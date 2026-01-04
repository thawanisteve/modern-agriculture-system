import {Component, computed, Inject, inject, OnInit, PLATFORM_ID, signal} from '@angular/core';
import {NavbarComponent} from '../../../shared/components/navbar/navbar.component';
import {ActivatedRoute, Router, RouterLink} from '@angular/router';
import {MachineryService} from '../../../core/services/machinery.service';
import {RentalService} from '../../../core/services/rental.service';
import {Machinery} from '../../../core/models/Machinery';
import {Rental} from '../../../core/models/Rental';
import {CurrencyPipe, isPlatformBrowser, Location} from '@angular/common';
import {GalleryComponent, GalleryItem, ImageItem} from 'ng-gallery';
import {PaymentService} from '../../../core/services/payment.service';

@Component({
  selector: 'app-equipment-detail',
  imports: [
    NavbarComponent,
    CurrencyPipe,
    RouterLink,
    GalleryComponent,
  ],
  templateUrl: './equipment-detail.component.html',
  styleUrl: './equipment-detail.component.css'
})
export class EquipmentDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private location = inject(Location);
  machineryService = inject(MachineryService);
  paymentService = inject(PaymentService);
  rentalService = inject(RentalService);

  machine = signal<Machinery | undefined>(undefined);
  imageList = signal<GalleryItem[]>([]);

  isScriptLoaded = signal(false);
  error = signal<string | null>(null);
  isProcessing = signal(false);

  // Rental duration (in days) - you can make this configurable
  rentalDuration = signal(1);

  // Signal to track payment completion
  paymentCompleted = signal(false);
  successMessage = signal<string | null>(null);

  constructor(@Inject(PLATFORM_ID) private platformId: Object) {
    const id = this.route.snapshot.paramMap.get('id');
    this.machine.set(this.machineryService.machinery().find(m => m.id === id));
    if(this.machine()){
      this.machine()?.images.map(img =>
        this.imageList.update(data => [...data, new ImageItem({src: img, thumb: img})]),
      );
    }

    // Check if we're returning from payment
    this.checkPaymentReturn();
  }

  buttonText = computed(() => {
    if (this.isProcessing()) return 'Processing...';
    if (!this.isScriptLoaded()) return 'Loading...';
    if (this.machine()?.status === 'rented') return 'Currently Rented';
    return 'Rent Now';
  });

  totalAmount = computed(() => {
    return (this.machine()?.pricePerDay || 0) * this.rentalDuration();
  });

  ngOnInit() {
    if (isPlatformBrowser(this.platformId)) {
      this.loadRequiredScripts();
    }
  }

  private checkPaymentReturn(): void {
    const txRef = this.route.snapshot.queryParamMap.get('tx_ref');
    const status = this.route.snapshot.queryParamMap.get('status');

    if (txRef) {
      if (status === 'successful') {
        this.handleSuccessfulPayment(txRef);
      } else {
        this.handleFailedPayment(txRef);
      }

      // Navigate to payment success page instead of staying on equipment detail
      this.router.navigate(['/payment-success'], {
        queryParams: { tx_ref: txRef, status: status }
      });
    }
  }

  private async handleSuccessfulPayment(transactionRef: string): Promise<void> {
    try {
      // Update rental payment status
      await this.rentalService.updateRentalPaymentStatus(transactionRef, 'paid');

      // Update machinery status to rented
      if (this.machine()) {
        await this.machineryService.updateMachineryStatus(this.machine()!.id, 'rented');

        // Update local state to reflect the change immediately
        const updatedMachine = { ...this.machine()!, status: 'rented' as const };
        this.machine.set(updatedMachine);
      }

      this.paymentCompleted.set(true);
      this.successMessage.set('Payment successful! Your rental has been confirmed.');

      console.log('Payment completed successfully:', transactionRef);
    } catch (error) {
      console.error('Error processing successful payment:', error);
      this.error.set('Payment was successful but there was an error updating records. Please contact support.');
    }
  }

  private async handleFailedPayment(transactionRef: string): Promise<void> {
    try {
      // Update rental payment status to failed
      await this.rentalService.updateRentalPaymentStatus(transactionRef, 'failed');

      this.error.set('Payment was not successful. Please try again.');
      console.log('Payment failed for transaction:', transactionRef);
    } catch (error) {
      console.error('Error processing failed payment:', error);
    }
  }

  private loadRequiredScripts(): void {
    // Clear any previous errors
    this.error.set(null);

    // First load jQuery, then Paychangu
    this.loadJQuery().then(() => {
      this.loadPaychanguScript();
    }).catch(error => {
      console.error('Failed to load required scripts:', error);
      this.error.set('Failed to load payment system. Please refresh the page.');
    });
  }

  private loadJQuery(): Promise<void> {
    return new Promise((resolve, reject) => {
      // Check if jQuery is already loaded
      if (window.jQuery || window.$) {
        resolve();
        return;
      }

      // Check if script is already in DOM
      if (document.querySelector('script[src*="jquery"]')) {
        // Wait a bit for it to load
        setTimeout(() => {
          if (window.jQuery || window.$) {
            resolve();
          } else {
            reject(new Error('jQuery failed to load'));
          }
        }, 1000);
        return;
      }

      const script = document.createElement('script');
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/jquery/3.7.1/jquery.min.js';
      script.async = true;

      script.onload = () => {
        console.log('jQuery loaded successfully');
        resolve();
      };

      script.onerror = (error) => {
        console.error('Failed to load jQuery:', error);
        reject(error);
      };

      document.head.appendChild(script);
    });
  }

  private loadPaychanguScript(): void {
    // Check if script is already loaded
    if (document.querySelector('script[src="https://in.paychangu.com/js/popup.js"]')) {
      this.isScriptLoaded.set(true);
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://in.paychangu.com/js/popup.js';
    script.async = true;

    script.onload = () => {
      console.log('Paychangu script loaded successfully');
      this.isScriptLoaded.set(true);
    };

    script.onerror = (error) => {
      console.error('Failed to load Paychangu script:', error);
      this.error.set('Failed to load payment system. Please refresh the page.');
    };

    document.head.appendChild(script);
  }

  private getBaseUrl(): string {
    if (isPlatformBrowser(this.platformId)) {
      const hostname = window.location.hostname;

      // Check for ngrok URL pattern
      if (hostname.includes('ngrok') || hostname.includes('ngrok.io') || hostname.includes('ngrok-free.app')) {
        return window.location.origin;
      }

      // For localhost development with ngrok
      // You can set this as an environment variable or hardcode your ngrok URL
      const ngrokUrl = this.getNgrokUrl();
      if (ngrokUrl) {
        return ngrokUrl;
      }

      // Fallback to localhost with port for local development
      const protocol = window.location.protocol;
      const port = window.location.port;

      if (hostname === 'localhost' || hostname === '127.0.0.1') {
        return `${protocol}//${hostname}:${port || '4200'}`;
      }

      // For production, use origin as is
      return window.location.origin;
    }

    // Fallback for SSR
    return 'http://localhost:4200';
  }

  private getNgrokUrl(): string | null {
    // You can set this in environment variables or return your ngrok URL
    // For development, you might want to store this in localStorage or environment
    return localStorage.getItem('ngrok_url');
  }

  // UUID generator with fallback for older browsers
  private generateUUID(): string {
    // Try to use crypto.randomUUID if available
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
      return crypto.randomUUID();
    }

    // Fallback UUID v4 generator
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0;
      const v = c == 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }

  async makePayment(amount: number): Promise<void> {
    if (!this.isScriptLoaded() || !window.PaychanguCheckout) {
      this.error.set('Payment system not ready. Please try again.');
      return;
    }

    if (!this.machine()) {
      this.error.set('Machine details not available.');
      return;
    }

    if (this.machine()?.status === 'rented') {
      this.error.set('This machine is currently rented and not available.');
      return;
    }

    this.isProcessing.set(true);
    this.error.set(null);

    const transactionRef = this.generateTransactionRef();
    const totalAmount = this.totalAmount();

    console.log('Initiating payment with transaction ref:', transactionRef);

    try {
      // Create rental record first
      const rentalData: Omit<Rental, 'id' | 'createdAt' | 'updatedAt'> = {
        machineryId: this.machine()!.id,
        machineryName: this.machine()!.name,
        customerId: 'customer_' + Date.now(),
        customerEmail: 'thawanisteven7@gmail.com',
        customerFirstName: 'Steven',
        customerLastName: 'Thawani',
        pricePerDay: this.machine()!.pricePerDay,
        totalAmount: totalAmount,
        startDate: new Date(),
        endDate: new Date(Date.now() + (this.rentalDuration() * 24 * 60 * 60 * 1000)),
        duration: this.rentalDuration(),
        status: 'pending',
        paymentStatus: 'pending',
        transactionRef: transactionRef,
        paymentMethod: 'paychangu',
        location: this.machine()!.location || 'Unknown'
      };

      // Save rental to database
      console.log('Saving rental data:', rentalData);
      const savedRental = await this.rentalService.createRental(rentalData);
      console.log('Rental saved successfully:', savedRental);

      // Get the correct base URL
      const baseUrl = this.getBaseUrl();

      // Configure payment with callback URLs
      const paymentConfig = {
        public_key: "pub-test-X8yApUly5TxRBzLjhSlikbazNAuzolSy",
        tx_ref: transactionRef,
        amount: totalAmount,
        currency: "MWK",
        callback_url: `${baseUrl}/payment-success?tx_ref=${transactionRef}&status=successful`,
        return_url: `${baseUrl}/payment-success?tx_ref=${transactionRef}`,
        customer: {
          email: rentalData.customerEmail,
          first_name: rentalData.customerFirstName,
          last_name: rentalData.customerLastName,
        },
        customization: {
          title: `Rent ${this.machine()!.name}`,
          description: `Rental for ${this.rentalDuration()} day(s)`,
        },
        meta: {
          uuid: this.generateUUID(),
          machineryId: this.machine()!.id,
          rentalDuration: this.rentalDuration(),
          response: "Rental Payment",
          transactionRef: transactionRef // Add this for reference
        }
      };

      console.log('Payment config:', paymentConfig);

      // Store transaction ref in localStorage as backup
      localStorage.setItem('current_transaction_ref', transactionRef);
      localStorage.setItem('payment_in_progress', 'true');

      // Initiate payment
      window.PaychanguCheckout(paymentConfig);

      // Reset processing state after a short delay
      setTimeout(() => this.isProcessing.set(false), 2000);

    } catch (error) {
      console.error('Payment error:', error);
      this.error.set('Failed to process payment. Please try again.');
      this.isProcessing.set(false);
    }
  }

  private generateTransactionRef(): string {
    return 'RENT_' + Date.now() + '_' + Math.floor(Math.random() * 1000);
  }

  updateRentalDuration(days: number): void {
    this.rentalDuration.set(Math.max(1, days));
  }

  isAvailableForRent(): boolean {
    return this.machine()?.status !== 'rented';
  }

  // Method to set ngrok URL (can be called from component or service)
  setNgrokUrl(url: string): void {
    localStorage.setItem('ngrok_url', url);
  }
}

// Extend Window interface to include jQuery and PaychanguCheckout
declare global {
  interface Window {
    jQuery: any;
    $: any;
  }
}
