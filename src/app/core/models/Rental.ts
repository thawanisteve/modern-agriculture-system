export interface Rental {
  id?: string;
  machineryId: string;
  machineryName: string;
  customerId: string;
  customerEmail: string;
  customerFirstName: string;
  customerLastName: string;
  pricePerDay: number;
  totalAmount: number;
  startDate: Date;
  endDate: Date;
  duration: number;
  status: 'pending' | 'active' | 'completed' | 'cancelled';
  paymentStatus: 'pending' | 'paid' | 'failed' | 'refunded';
  transactionRef: string;
  paymentMethod: string;
  location: string;
  cancellationReason?: string; // Add this line
  createdAt: Date;
  updatedAt: Date;
}
