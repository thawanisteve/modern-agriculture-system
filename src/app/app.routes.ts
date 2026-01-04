import { Routes } from '@angular/router';
import {LoginComponent} from './features/auth/login/login.component';
import {RegisterComponent} from './features/auth/register/register.component';
import {EquipmentListingComponent} from './features/equipment/equipment-listing/equipment-listing.component';
import {EquipmentDetailComponent} from './features/equipment/equipment-detail/equipment-detail.component';
import {MachineryDashboardComponent} from './features/dashboards/machinery-dashboard/machinery-dashboard.component';
import { LandingComponent } from './features/landing/landing.component';
import {AdminDashboardComponent} from './features/dashboards/admin-dashboard/admin-dashboard.component';
import {PaymentSuccessComponent} from './shared/components/payment-success/payment-success.component';

export const routes: Routes = [
  { path: '', component: LandingComponent, pathMatch: 'full' },
  { path: 'login', component: LoginComponent, pathMatch: 'full' },
  { path: 'register', component: RegisterComponent, pathMatch: 'full' },
  { path: 'equipment', component: EquipmentListingComponent, pathMatch: 'full' },
  { path: 'equipment/:id', component: EquipmentDetailComponent, pathMatch: 'full' },
  { path: 'payment-success', component: PaymentSuccessComponent, pathMatch: 'full' },
  { path: 'admin-dashboard', component: AdminDashboardComponent, pathMatch: 'full' },
  { path: 'machinery-dashboard', component: MachineryDashboardComponent, pathMatch: 'full' },
];
