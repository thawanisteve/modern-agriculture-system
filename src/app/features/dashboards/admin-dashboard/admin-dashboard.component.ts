import { Component, computed, effect, inject, signal } from '@angular/core';
import { NavbarComponent } from '../../../shared/components/navbar/navbar.component';
import { CommonModule, DatePipe } from '@angular/common';
import { FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { AdminService } from '../../../core/services/admin.service';
import { MachineryService } from '../../../core/services/machinery.service';
import { RentalService } from '../../../core/services/rental.service';
import { AuthService } from '../../../core/services/auth.service';
import { Router } from '@angular/router';
import { User } from '../../../core/models/User';
import { Rental } from '../../../core/models/Rental';
import { AdminExportDataService } from '../../../core/services/admin-export-data.service';

@Component({
  selector: 'app-admin-dashboard',
  imports: [
    NavbarComponent,
    CommonModule,
    DatePipe,
    ReactiveFormsModule,
    FormsModule
  ],
  templateUrl: './admin-dashboard.component.html',
  styleUrl: './admin-dashboard.component.css'
})
export class AdminDashboardComponent {
  adminService = inject(AdminService);
  machineryService = inject(MachineryService);
  rentalService = inject(RentalService);
  authService = inject(AuthService);
  adminExportDataService = inject(AdminExportDataService);
  router = inject(Router);

  // Signals for state management
  users = this.adminService.users;
  adminStats = this.adminService.adminStats;
  recentActivities = this.adminService.recentActivities;
  loading = this.adminService.loading;
  error = this.adminService.error;

  // Rental/Booking signals
  rentals = signal<Rental[]>([]);
  rentalStats = signal({
    total: 0,
    active: 0,
    completed: 0,
    cancelled: 0,
    pending: 0
  });
  rentalStatus = signal({
    pending: 'pending',
    active: 'active',
    completed: 'completed',
    cancelled: 'cancelled'
  });
  overdueRentals = signal<Rental[]>([]);
  recentBookings = signal<Rental[]>([]);

  // UI state signals
  showUserModal = signal<boolean>(false);
  showExportModal = signal<boolean>(false);
  showBookingModal = signal<boolean>(false);
  editingUser = signal<User | null>(null);
  selectedBooking = signal<Rental | null>(null);
  searchTerm = signal<string>('');
  selectedUserRole = signal<string>('');
  bookingSearchTerm = signal<string>('');
  selectedBookingStatus = signal<string>('');
  exportFormat = signal<'csv' | 'pdf'>('pdf');
  activeTab = signal<'overview' | 'users' | 'bookings'>('overview');

  // Filtered users computed signal
  filteredUsers = computed(() => {
    const users = this.users();
    const search = this.searchTerm().toLowerCase();
    const role = this.selectedUserRole();

    return users.filter(user => {
      const matchesSearch = !search ||
        user.displayName.toLowerCase().includes(search) ||
        user.email.toLowerCase().includes(search) ||
        user.phoneNumber?.toLowerCase().includes(search);

      const matchesRole = !role || user.role === role;

      return matchesSearch && matchesRole;
    });
  });

  // Filtered bookings computed signal
  filteredBookings = computed(() => {
    const bookings = this.rentalService.rentals();
    const search = this.bookingSearchTerm().toLowerCase();
    const status = this.selectedBookingStatus();

    return bookings.filter(booking => {
      const matchesSearch = !search ||
        booking.customerEmail.toLowerCase().includes(search) ||
        booking.transactionRef.toLowerCase().includes(search) ||
        (booking.customerFirstName + ' ' + booking.customerLastName).toLowerCase().includes(search);

      const matchesStatus = !status || booking.status === status;

      return matchesSearch && matchesStatus;
    });
  });

  // User form setup
  userForm = new FormGroup({
    displayName: new FormControl('', [Validators.required, Validators.minLength(2)]),
    email: new FormControl('', [Validators.required, Validators.email]),
    phoneNumber: new FormControl('', [Validators.required]),
    nationalId: new FormControl(''),
    role: new FormControl('user', [Validators.required]),
    isActive: new FormControl(true)
  });

  constructor() {
    effect(() => {
      this.initializeData();
    });
  }

  async initializeData(): Promise<void> {
    try {
      // Initialize admin data
      this.adminService.initializeAdminData();

      // Initialize rental listener
      this.rentalService.initializeRentalsListener();

      // Load rental data
      await this.loadRentalData();
    } catch (error) {
      console.error('Error initializing data:', error);
    }
  }

  async loadRentalData(): Promise<void> {
    try {
      // Get all rentals
      const allRentals = this.rentalService.rentals();
      this.rentals.set(allRentals);

      // Get rental statistics
      const stats = await this.rentalService.getRentalStats();
      this.rentalStats.set(stats);

      // Get overdue rentals
      const overdue = await this.rentalService.getOverdueRentals();
      this.overdueRentals.set(overdue);

      // Get recent bookings (last 10)
      const recent = allRentals
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, 10);
      this.recentBookings.set(recent);
    } catch (error) {
      console.error('Error loading rental data:', error);
    }
  }

  // Tab management
  setActiveTab(tab: 'overview' | 'users' | 'bookings'): void {
    this.activeTab.set(tab);
  }

  // Navigation methods
  async navigateToUsers(): Promise<void> {
    await this.router.navigate(['/admin/users']);
  }

  async navigateToMachinery(): Promise<void> {
    await this.router.navigate(['/machinery-dashboard']);
  }

  async viewReports(): Promise<void> {
    await this.router.navigate(['/admin/reports']);
  }

  async systemSettings(): Promise<void> {
    await this.router.navigate(['/admin/settings']);
  }

  // Booking management methods
  viewBookingDetails(booking: Rental): void {
    this.selectedBooking.set(booking);
    this.showBookingModal.set(true);
  }

  async updateBookingStatus(booking: Rental, newStatus: Rental['status']): Promise<void> {
    try {
      await this.rentalService.updateRentalStatus(booking.transactionRef, newStatus);
      await this.loadRentalData(); // Refresh data
    } catch (error) {
      console.error('Error updating booking status:', error);
    }
  }

  async approveBooking(booking: Rental): Promise<void> {
    await this.updateBookingStatus(booking, 'active');
  }

  async cancelBooking(booking: Rental, reason?: string): Promise<void> {
    try {
      await this.rentalService.cancelRental(booking.transactionRef, reason);
      await this.loadRentalData();
    } catch (error) {
      console.error('Error cancelling booking:', error);
    }
  }

  async completeBooking(booking: Rental): Promise<void> {
    try {
      await this.rentalService.completeRental(booking.transactionRef);
      await this.loadRentalData();
    } catch (error) {
      console.error('Error completing booking:', error);
    }
  }

  closeBookingModal(): void {
    this.showBookingModal.set(false);
    this.selectedBooking.set(null);
  }

  // Enhanced export methods
  openExportModal(): void {
    this.showExportModal.set(true);
  }

  closeExportModal(): void {
    this.showExportModal.set(false);
  }

  async exportData(): Promise<void> {
    try {
      const users = this.users();
      const stats = this.adminStats();
      const activities = this.recentActivities();
      const bookings = this.rentals();
      const rentalStats = this.rentalStats();

      if (this.exportFormat() === 'csv') {
        this.adminExportDataService.generateCSVReport(users, stats, activities);
      } else {
        this.adminExportDataService.generatePDFReport(users, stats, activities);
      }

      this.closeExportModal();
      console.log(`${this.exportFormat().toUpperCase()} report generated successfully!`);
    } catch (error) {
      console.error('Error generating report:', error);
    }
  }

  async exportCSV(): Promise<void> {
    try {
      const users = this.users();
      const stats = this.adminStats();
      const activities = this.recentActivities();
      const bookings = this.rentals();
      const rentalStats = this.rentalStats();

      this.adminExportDataService.generateCSVReport(users, stats, activities);
      console.log('CSV report generated successfully!');
    } catch (error) {
      console.error('Error generating CSV report:', error);
    }
  }

  async exportPDF(): Promise<void> {
    try {
      const users = this.users();
      const stats = this.adminStats();
      const activities = this.recentActivities();
      const bookings = this.rentals();
      const rentalStats = this.rentalStats();

      this.adminExportDataService.generatePDFReport(users, stats, activities);
      console.log('PDF report generated successfully!');
    } catch (error) {
      console.error('Error generating PDF report:', error);
    }
  }

  // User management methods (existing methods remain the same)
  openUserModal(): void {
    this.editingUser.set(null);
    this.userForm.reset({
      role: 'user',
      isActive: true
    });
    this.showUserModal.set(true);
  }

  editUser(user: User): void {
    this.editingUser.set(user);
    this.userForm.patchValue({
      displayName: user.displayName,
      email: user.email,
      phoneNumber: user.phoneNumber,
      nationalId: user.nationalId,
      role: user.role,
      isActive: user.isActive
    });
    this.showUserModal.set(true);
  }

  async handleUserSubmit(): Promise<void> {
    if (this.userForm.invalid) {
      this.markFormGroupTouched(this.userForm);
      return;
    }

    try {
      const formData = this.userForm.value;
      const userData = {
        displayName: formData.displayName!,
        email: formData.email!,
        phoneNumber: formData.phoneNumber!,
        nationalId: formData.nationalId || '',
        role: formData.role as 'admin' | 'supplier' | 'user',
        isActive: formData.isActive ?? true,
        emailVerified: false,
        createdAt: new Date()
      };

      if (this.editingUser()) {
        await this.adminService.updateUser(this.editingUser()!.id, userData);
      } else {
        await this.adminService.createUser(userData);
      }

      this.closeUserModal();
    } catch (error) {
      console.error('Error saving user:', error);
    }
  }

  async deleteUser(userId: string): Promise<void> {
    if (confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
      try {
        await this.adminService.deleteUser(userId);
      } catch (error) {
        console.error('Error deleting user:', error);
      }
    }
  }

  async toggleUserStatus(user: User): Promise<void> {
    try {
      await this.adminService.updateUser(user.id, {
        isActive: !user.isActive
      });
    } catch (error) {
      console.error('Error updating user status:', error);
    }
  }

  closeUserModal(): void {
    this.showUserModal.set(false);
    this.editingUser.set(null);
    this.userForm.reset();
  }

  // Search and filter methods
  filterUsers(): void {
    // The filteredUsers computed signal will automatically update
  }

  filterBookings(): void {
    // The filteredBookings computed signal will automatically update
  }

  // Utility methods
  private markFormGroupTouched(formGroup: FormGroup): void {
    Object.keys(formGroup.controls).forEach(key => {
      const control = formGroup.get(key);
      control?.markAsTouched();

      if (control instanceof FormGroup) {
        this.markFormGroupTouched(control);
      }
    });
  }

  getFieldError(fieldName: string): string | null {
    const field = this.userForm.get(fieldName);
    if (field?.errors && field.touched) {
      if (field.errors['required']) return `${fieldName} is required`;
      if (field.errors['email']) return 'Please enter a valid email';
      if (field.errors['minlength']) return `${fieldName} is too short`;
    }
    return null;
  }

  hasFieldError(fieldName: string): boolean {
    const field = this.userForm.get(fieldName);
    return !!(field?.errors && field.touched);
  }

  // Enhanced analytics methods
  getUserGrowthRate(): number {
    const stats = this.adminStats();
    const previousMonthUsers = stats.totalUsers - stats.newUsersThisMonth;
    return previousMonthUsers > 0 ? Math.round((stats.newUsersThisMonth / previousMonthUsers) * 100) : 100;
  }

  getBookingConversionRate(): number {
    const rentalStats = this.rentalStats();
    const totalUsers = this.adminStats().totalUsers;
    return totalUsers > 0 ? Math.round((rentalStats.total / totalUsers) * 100) : 0;
  }

  getMachineryUtilizationRate(): number {
    const rentalStats = this.rentalStats();
    const totalMachinery = this.adminStats().totalMachinery;
    return totalMachinery > 0 ? Math.round((rentalStats.active / totalMachinery) * 100) : 0;
  }

  getAverageRevenuePerUser(): number {
    const stats = this.adminStats();
    return stats.totalUsers > 0 ? Math.round(stats.monthlyRevenue / stats.totalUsers) : 0;
  }

  getBookingSuccessRate(): number {
    const rentalStats = this.rentalStats();
    const totalBookings = rentalStats.total;
    return totalBookings > 0 ? Math.round((rentalStats.completed / totalBookings) * 100) : 0;
  }

  getBookingStatusClass(status: string): string {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'completed': return 'bg-blue-100 text-blue-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  }

  // Helper method to get booking status color
  getBookingStatusColor(status: string): string {
    switch (status) {
      case 'active': return 'text-green-600 bg-green-100';
      case 'completed': return 'text-blue-600 bg-blue-100';
      case 'cancelled': return 'text-red-600 bg-red-100';
      case 'pending': return 'text-yellow-600 bg-yellow-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  }

  // Helper method to format currency
  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-MW', {
      style: 'currency',
      currency: 'MWK',
      minimumFractionDigits: 0
    }).format(amount);
  }

  // Helper method to calculate rental duration
  calculateDuration(startDate: Date, endDate: Date): number {
    return this.rentalService.calculateRentalDuration(startDate, endDate);
  }
}
