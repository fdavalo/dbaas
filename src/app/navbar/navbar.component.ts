import {Component, DoCheck, OnInit} from '@angular/core';
import {UserService} from '../_services/user.service';

@Component({
  selector: 'app-navbar',
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.scss']
})
export class NavbarComponent implements OnInit, DoCheck {
  products;
  backgroundColor = '#343A40';
  loginLabel: string;
  link: string;
  title: string;
  user: string;

  constructor(private userService: UserService) {
  }

  ngOnInit(): void {}

  ngDoCheck(): void {
    this.loginLabel = this.userService.getId();
    this.link = "/logout";
    this.title = "Sign Out";
    this.user = this.userService.getId();
    if (!this.loginLabel) {
      this.loginLabel = "Sign In";
      this.link = "/login";
      this.title = "Sign In";
      this.user = "";
    }
  }
}
