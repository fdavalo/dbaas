import {Component, OnInit} from '@angular/core';
import {FormBuilder, FormGroup, Validators} from '@angular/forms';
import {Router} from '@angular/router';
import Swal from 'sweetalert2/dist/sweetalert2.js';
import { UserService } from '../_services/user.service';

@Component({
  selector: 'app-profile',
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.scss']
})
export class ProfileComponent implements OnInit {
  checkoutForm: FormGroup;
  submitted: boolean = false;
  fullName: string;
  address: {'street':null,'city':null,'country':null,'county':null,'postalCode':null};

  constructor(private userService: UserService,
              private formBuilder: FormBuilder,
              private router: Router) {
    this.checkoutForm = this.formBuilder.group({
      fullName: ['', [Validators.required]],
      address: this.formBuilder.group({
        street: ['', Validators.required],
        city: ['', Validators.required],
        country: ['', Validators.required],
        county: ['', Validators.nullValidator],
        postalCode: ['', Validators.required],
      }),
    });
  }

  ngOnInit(): void {
    this.userService.getUser().subscribe(user => {
        console.log(user);
        if (user['fullName']) this.fullName = user['fullName'];
        if (user['addresses'] && (user['addresses'].length > 0)) this.address = user['addresses'][0];
      });      
  }

  onSubmit(data) {
    this.userService.getUser().subscribe(user => {
        user['fullName'] = data['fullName'];
        if (user['addresses'] && (user['addresses'].length > 0)) user['addresses'][0] = data['address'];
        else user['addresses'].push(data['address']);
        this.userService.updateUser(user).subscribe(majuser => {
            this.router.navigate(['/']);
        });
    });
  }

  onLogout() {
    this.userService.loggedOut();
    this.router.navigate(['/']);
  }  
}
