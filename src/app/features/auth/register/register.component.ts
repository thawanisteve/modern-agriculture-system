import { Component } from '@angular/core';
import {Router, RouterLink} from '@angular/router';
import {AuthService} from '../../../core/services/auth.service';
import {FormControl, FormGroup, ReactiveFormsModule, Validators} from '@angular/forms';
import {map} from 'rxjs';
import {AsyncPipe} from '@angular/common';

@Component({
  selector: 'app-register',
  imports: [
    RouterLink,
    AsyncPipe,
    ReactiveFormsModule
  ],
  templateUrl: './register.component.html',
  styleUrl: './register.component.css'
})
export class RegisterComponent {
  registerForm: FormGroup;

  constructor(private router: Router, protected authService: AuthService) {
    this.registerForm = new FormGroup({
      email: new FormControl('', [Validators.required, Validators.email]),
      fullName: new FormControl('', [Validators.required]),
      phoneNumber: new FormControl('', [Validators.required]),
      password: new FormControl('', [Validators.required]),
      passwordConfirm: new FormControl('', [Validators.required]),
      nationalId: new FormControl('', [Validators.required]),
    });
  }

  async registerWithEmail(): Promise<void> {
    try{
      if(this.registerForm.valid){
        const { email, password, passwordConfirm, fullName, phoneNumber, nationalId } = this.registerForm.value;
        if(password !== passwordConfirm){
          return this.authService._error$.next('Password should match');
        }
        await this.authService.signUp(email, password, fullName, phoneNumber, nationalId);
        await this.router.navigate(['/equipment']);
      }
    }catch(error){}
  }
}
