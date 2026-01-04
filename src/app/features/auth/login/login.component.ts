import {Component, signal, WritableSignal} from '@angular/core';
import {Router, RouterLink} from '@angular/router';
import {AuthService} from '../../../core/services/auth.service';
import {FormControl, FormGroup, ReactiveFormsModule, Validators} from '@angular/forms';
import {AsyncPipe} from '@angular/common';

@Component({
  selector: 'app-login',
  imports: [
    RouterLink,
    ReactiveFormsModule,
    AsyncPipe
  ],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css'
})
export class LoginComponent {
  protected error: WritableSignal<string | null> = signal<string | null>(null);
  protected isLoading: WritableSignal<boolean> = signal<boolean>(false);

  loginForm: FormGroup;
  constructor(private router: Router, protected authService: AuthService) {
    this.loginForm = new FormGroup({
      email: new FormControl('', [Validators.required, Validators.email]),
      password: new FormControl('', [Validators.required])
    });
  }

  async loginWithEmail(): Promise<void> {
    try{
      if(this.loginForm.valid){
        const { email, password } = this.loginForm.value;
        await this.authService.signIn(email, password);
      }
    }catch(_){}
  }
}
