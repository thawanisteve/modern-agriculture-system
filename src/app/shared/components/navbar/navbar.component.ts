import {Component, inject, OnInit} from '@angular/core';
import {Router, RouterLink} from '@angular/router';
import {AuthService} from '../../../core/services/auth.service';
import {User} from '@angular/fire/auth';
import {TitleCasePipe} from '@angular/common';

@Component({
  selector: 'app-navbar',
  imports: [
    RouterLink,
    TitleCasePipe
  ],
  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.css'
})
export class NavbarComponent implements OnInit {
  private authService = inject(AuthService);
  private router = inject(Router);
  protected currentUser: User | null = null;

  ngOnInit(): void {
    this.authService.getCurrentUser().subscribe(currentUser => {
      this.currentUser = currentUser;
    });
  }

  async logout() {
    await this.authService.signOut();
    await this.router.navigateByUrl('/login');
  }
}
