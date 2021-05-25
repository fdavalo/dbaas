import { Component } from '@angular/core';
import { UserService } from '../_services/user.service';
import {FormBuilder, FormGroup, Validators} from '@angular/forms';
import { Router } from "@angular/router";
import { CustomValidators } from '../custom-validators';

@Component({
    selector: 'app-login',
    templateUrl: './login.component.html',
    styleUrls: ['./login.component.scss']
})

export class LoginComponent {

    public reason: string;
    public loginForm: FormGroup;
    public registerForm: FormGroup;
    protected target: string;

    constructor(protected userService: UserService, 
                protected formBuilder: FormBuilder,
                protected router: Router) {
        this.target = '/';
        this.loginForm = this.formBuilder.group(
            {
                // email is required and must be a valid email email
                email: [null, Validators.compose([
                    Validators.email,
                    Validators.required])
                ],
                password: [ null, Validators.compose([
                    Validators.required])
                ]
            }
        );  
        this.registerForm = this.formBuilder.group(
            {
                // email is required and must be a valid email email
                email: [null, Validators.compose([
                    Validators.email,
                    Validators.required])
                ],
                password: [ null, Validators.compose([
                    Validators.required,
                    CustomValidators.patternValidator(/\d/, { hasNumber: true }),
                    CustomValidators.patternValidator(/[A-Z]/, { hasCapitalCase: true }),
                    CustomValidators.patternValidator(/[a-z]/, { hasSmallCase: true }),
                    CustomValidators.patternValidator(/[!$@#%&*()_+\-=\[\]{};':",.<>\/?|~^]/, { hasSpecialCharacters: true }),
                    Validators.minLength(8)])
                ],
                confirmPassword: [null, Validators.compose([Validators.required])]
            },
            {
                // check whether our password and confirm password match
                validator: CustomValidators.passwordMatchValidator
            }
        );              
    }

    onSignIn(customerData) {
        console.log(customerData);
        if (customerData.email && customerData.password) {
            this.userService.login({"login":customerData.email,"password":customerData.password})
                .subscribe(result => {
                    console.log(result);
                    if (result['session']) { 
                        this.userService.loggedIn(result, customerData.email);
                        this.router.navigate([this.target], { "queryParams": result });
                    }
                    else {
                        this.userService.loggedOut();
                        this.reason = result['reason'];
                    }
                });
        }
    }

    onRegister(customerData) {
        if (customerData.email && customerData.password) {
            this.userService.register({"id":customerData.email,"password":customerData.password})
                .subscribe(result => {
                    this.onSignIn(customerData);
                });
        }
    }

}