import { Component, OnInit, signal, inject } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { RentalService } from '../../../core/services/rental.service';
import { MachineryService } from '../../../core/services/machinery.service';
import { Rental } from '../../../core/models/Rental';
import { CommonModule, CurrencyPipe, DatePipe } from '@angular/common';
import { NavbarComponent } from '../navbar/navbar.component';

@Component({
  selector: 'app-payment-success',
  standalone: true,
  imports: [
    CommonModule,
    CurrencyPipe,
    DatePipe,
    RouterLink,
    NavbarComponent
  ],
  template: `
    <app-navbar />

    <div class="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 p-8">
      <div class="max-w-4xl mx-auto">

        @if (isLoading()) {
          <!-- Loading State -->
          <div class="bg-white rounded-2xl shadow-xl p-8 text-center">
            <div class="loading loading-spinner loading-lg mb-4"></div>
            <p class="text-gray-600">Processing your payment...</p>
            <p class="text-sm text-gray-500 mt-2">Transaction: {{ transactionRef() }}</p>
          </div>
        } @else if (rental() && paymentStatus() === 'successful') {
          <!-- Success State -->
            <!-- Success Header -->
          <div class="bg-white rounded-2xl shadow-xl p-8 mb-8 text-center">
            <div class="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg class="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
              </svg>
            </div>
            <h1 class="text-3xl font-bold text-green-600 mb-2">Payment Successful!</h1>
            <p class="text-gray-600">Your equipment rental has been confirmed</p>
            <p class="text-sm text-gray-500 mt-2">Transaction ID: {{ rental()?.transactionRef }}</p>
          </div>

          <!-- Receipt -->
          <div class="bg-white rounded-2xl shadow-xl overflow-hidden" id="receipt">
            <!-- Receipt Header -->
            <div class="bg-gradient-to-r from-green-600 to-blue-600 text-white p-6">
              <div class="flex justify-between items-start">
                <div>
                  <h2 class="text-2xl font-bold mb-2">Rental Receipt</h2>
                  <p class="opacity-90">AgriRental Platform</p>
                </div>
                <div class="text-right">
                  <p class="text-sm opacity-90">Receipt #</p>
                  <p class="font-mono">{{ rental()?.transactionRef }}</p>
                </div>
              </div>
            </div>

            <!-- Receipt Body -->
            <div class="p-6 space-y-6">
              <!-- Customer Information -->
              <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 class="text-lg font-semibold mb-3 text-gray-800">Customer Information</h3>
                  <div class="space-y-2 text-sm">
                    <p><span class="font-medium">Name:</span> {{ rental()?.customerFirstName }} {{ rental()?.customerLastName }}</p>
                    <p><span class="font-medium">Email:</span> {{ rental()?.customerEmail }}</p>
                    <p><span class="font-medium">Customer ID:</span> {{ rental()?.customerId }}</p>
                  </div>
                </div>

                <div>
                  <h3 class="text-lg font-semibold mb-3 text-gray-800">Rental Details</h3>
                  <div class="space-y-2 text-sm">
                    <p><span class="font-medium">Equipment:</span> {{ rental()?.machineryName }}</p>
                    <p><span class="font-medium">Location:</span> {{ rental()?.location }}</p>
                    <p><span class="font-medium">Status:</span>
                      <span class="badge badge-success badge-sm ml-1">{{ rental()?.status }}</span>
                    </p>
                  </div>
                </div>
              </div>

              <!-- Rental Period -->
              <div class="border-t pt-4">
                <h3 class="text-lg font-semibold mb-3 text-gray-800">Rental Period</h3>
                <div class="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div>
                    <p class="font-medium text-gray-600">Start Date</p>
                    <p class="text-lg">{{ rental()?.startDate | date:'medium' }}</p>
                  </div>
                  <div>
                    <p class="font-medium text-gray-600">End Date</p>
                    <p class="text-lg">{{ rental()?.endDate | date:'medium' }}</p>
                  </div>
                  <div>
                    <p class="font-medium text-gray-600">Duration</p>
                    <p class="text-lg">{{ rental()?.duration }} day(s)</p>
                  </div>
                </div>
              </div>

              <!-- Payment Summary -->
              <div class="border-t pt-4">
                <h3 class="text-lg font-semibold mb-3 text-gray-800">Payment Summary</h3>
                <div class="space-y-3">
                  <div class="flex justify-between">
                    <span>Price per day</span>
                    <span>{{ rental()?.pricePerDay | currency:'MWK' }}</span>
                  </div>
                  <div class="flex justify-between">
                    <span>Duration</span>
                    <span>{{ rental()?.duration }} day(s)</span>
                  </div>
                  <div class="border-t pt-2 flex justify-between font-bold text-lg">
                    <span>Total Amount</span>
                    <span class="text-green-600">{{ rental()?.totalAmount | currency:'MWK' }}</span>
                  </div>
                  <div class="flex justify-between text-sm text-gray-600">
                    <span>Payment Method</span>
                    <span>{{ rental()?.paymentMethod | titlecase }}</span>
                  </div>
                  <div class="flex justify-between text-sm">
                    <span>Payment Status</span>
                    <span class="badge badge-success badge-sm">{{ rental()?.paymentStatus | titlecase }}</span>
                  </div>
                </div>
              </div>

              <!-- Important Information -->
              <div class="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 class="font-semibold text-blue-800 mb-2">Important Information</h4>
                <ul class="text-sm text-blue-700 space-y-1">
                  <li>• Please present this receipt when collecting the equipment</li>
                  <li>• Contact us at least 24 hours before the end date for return arrangements</li>
                  <li>• Late returns may incur additional charges</li>
                  <li>• Equipment should be returned in the same condition as received</li>
                </ul>
              </div>
            </div>

            <!-- Receipt Footer -->
            <div class="bg-gray-50 p-4 text-center text-sm text-gray-600">
              <p>Generated on {{ currentDate | date:'medium' }}</p>
              <p class="mt-1">Thank you for choosing AgriRental Platform!</p>
            </div>
          </div>

          <!-- Action Buttons -->
          <div class="flex flex-col sm:flex-row gap-4 mt-8 justify-center">
            <button
              (click)="downloadReceipt()"
              class="btn btn-primary">
              <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
              </svg>
              Download Receipt
            </button>

            <button
              (click)="printReceipt()"
              class="btn btn-outline">
              <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"></path>
              </svg>
              Print Receipt
            </button>

            <a routerLink="/equipment" class="btn btn-ghost">
              <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path>
              </svg>
              Back to Equipment
            </a>
          </div>
        } @else if (paymentStatus() === 'failed' || paymentStatus() === 'cancelled') {
          <!-- Failed State -->
          <div class="bg-white rounded-2xl shadow-xl p-8 text-center">
            <div class="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg class="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
              </svg>
            </div>
            <h1 class="text-3xl font-bold text-red-600 mb-2">Payment {{ paymentStatus() | titlecase }}</h1>
            <p class="text-gray-600 mb-6">Your payment could not be processed at this time</p>

            <div class="flex flex-col sm:flex-row gap-4 justify-center">
              <button (click)="retryPayment()" class="btn btn-primary">
                Try Again
              </button>
              <a routerLink="/equipment" class="btn btn-ghost">
                Back to Equipment
              </a>
            </div>
          </div>
        } @else {
          <!-- Error State -->
          <div class="bg-white rounded-2xl shadow-xl p-8 text-center">
            <div class="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg class="w-8 h-8 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"></path>
              </svg>
            </div>
            <h1 class="text-2xl font-bold text-gray-800 mb-2">Payment Information Not Found</h1>
            <p class="text-gray-600 mb-4">We couldn't find the payment information for this transaction</p>
            <p class="text-sm text-gray-500 mb-6">Transaction Ref: {{ transactionRef() || 'Not provided' }}</p>

            <!-- Debug Information (remove in production) -->
            <div class="bg-gray-100 p-4 rounded-lg mb-6 text-left">
              <h4 class="font-semibold mb-2">Debug Information:</h4>
              <p class="text-xs">Status: {{ paymentStatus() }}</p>
              <p class="text-xs">Transaction Ref: {{ transactionRef() }}</p>
              <p class="text-xs">Loading: {{ isLoading() }}</p>
              <p class="text-xs">Rental Found: {{ !!rental() }}</p>
            </div>

            <div class="flex flex-col sm:flex-row gap-4 justify-center">
              <button (click)="retrySearch()" class="btn btn-primary">
                Retry Search
              </button>
              <a routerLink="/equipment" class="btn btn-ghost">
                Back to Equipment
              </a>
            </div>
          </div>
        }
      </div>
    </div>
  `,
  styles: [`
    @media print {
      .btn, .btn-group {
        display: none !important;
      }

      .bg-gradient-to-br {
        background: white !important;
      }

      .shadow-xl {
        box-shadow: none !important;
      }
    }
  `]
})
export class PaymentSuccessComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private rentalService = inject(RentalService);
  private machineryService = inject(MachineryService);

  rental = signal<Rental | undefined>(undefined);
  isLoading = signal(true);
  paymentStatus = signal<string>('');
  transactionRef = signal<string>('');
  currentDate = new Date();

  ngOnInit() {
    this.processPaymentResult();
  }

  private async processPaymentResult() {
    const txRef = this.route.snapshot.queryParamMap.get('tx_ref');
    const status = this.route.snapshot.queryParamMap.get('status');

    console.log('Payment Success Page - Query Params:', {
      tx_ref: txRef,
      status: status,
      allParams: Object.fromEntries(this.route.snapshot.queryParamMap.keys.map(key =>
        [key, this.route.snapshot.queryParamMap.get(key)]
      ))
    });

    if (!txRef) {
      console.error('No transaction reference found in URL');
      this.isLoading.set(false);
      return;
    }

    this.transactionRef.set(txRef);
    this.paymentStatus.set(status || 'unknown');

    try {
      console.log('Searching for rental with transaction ref:', txRef);

      // Add a small delay to ensure database has been updated
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Get rental information
      const rentalData = await this.rentalService.getRentalByTransactionRef(txRef);
      console.log('Rental data found:', rentalData);

      if (rentalData) {
        this.rental.set(rentalData);

        if (status === 'successful') {
          console.log('Processing successful payment...');

          // Update rental payment status
          await this.rentalService.updateRentalPaymentStatus(txRef, 'paid');
          await this.rentalService.updateRentalStatus(txRef, 'active');

          // Update machinery status to rented
          await this.machineryService.updateMachineryStatus(rentalData.machineryId, 'rented');

          // Update the rental signal with new status
          this.rental.set({
            ...rentalData,
            paymentStatus: 'paid',
            status: 'active'
          });

          console.log('Payment processing completed successfully');
        } else {
          console.log('Payment failed, updating status...');
          // Update rental payment status to failed
          await this.rentalService.updateRentalPaymentStatus(txRef, 'failed');
        }
      } else {
        console.error('No rental found for transaction ref:', txRef);
      }
    } catch (error) {
      console.error('Error processing payment result:', error);
    } finally {
      this.isLoading.set(false);
    }
  }


  retrySearch() {
    this.isLoading.set(true);
    this.processPaymentResult();
  }

  downloadReceipt() {
    const element = document.getElementById('receipt');
    if (element) {
      // Create a new window for printing
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(`
          <html>
            <head>
              <title>Receipt - ${this.rental()?.transactionRef}</title>
              <style>
                body { font-family: Arial, sans-serif; margin: 20px; }
                .receipt-container { max-width: 800px; margin: 0 auto; }
                .header { background: linear-gradient(135deg, #16a085, #3498db); color: white; padding: 20px; }
                .content { padding: 20px; }
                .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
                .section { margin-bottom: 20px; }
                .section h3 { color: #2c3e50; border-bottom: 2px solid #ecf0f1; padding-bottom: 5px; }
                .badge { background: #27ae60; color: white; padding: 2px 8px; border-radius: 4px; font-size: 12px; }
                .total { font-size: 18px; font-weight: bold; color: #27ae60; }
                .info-box { background: #e8f4fd; border: 1px solid #3498db; padding: 15px; border-radius: 5px; }
              </style>
            </head>
            <body>
              ${element.outerHTML}
            </body>
          </html>
        `);
        printWindow.document.close();

        // Trigger download as PDF (modern browsers)
        setTimeout(() => {
          printWindow.print();
        }, 250);
      }
    }
  }

  printReceipt() {
    window.print();
  }

  retryPayment() {
    if (this.rental()) {
      this.router.navigate(['/equipment', this.rental()!.machineryId]);
    }
  }
}
