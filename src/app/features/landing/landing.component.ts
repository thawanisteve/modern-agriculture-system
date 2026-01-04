import { Component } from '@angular/core';
import {RouterLink, RouterLinkActive} from '@angular/router';
import {NgIcon, provideIcons} from '@ng-icons/core';
import {featherDollarSign, featherMapPin, featherStar} from '@ng-icons/feather-icons';
import {NgIf} from '@angular/common';

@Component({
  selector: 'app-landing',
  imports: [
    RouterLink,
    NgIcon,
    RouterLinkActive,
    NgIf
  ],
  templateUrl: './landing.component.html',
  styleUrl: './landing.component.css',
  viewProviders: [
    provideIcons({
      featherDollarSign,
      featherStar,
      featherMapPin,
    })
  ],
})
export class LandingComponent {
  isMobileMenuOpen = false;

  toggleMobileMenu(): void {
    this.isMobileMenuOpen = !this.isMobileMenuOpen;
  }

  closeMobileMenu(): void {
    this.isMobileMenuOpen = false;
  }
}
