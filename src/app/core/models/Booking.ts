export interface Booking {
  id?: string;
  userId: string;
  machineryId: string;
  machineryName: string;
  transactionRef: string;
  amountPaid: number;
  bookingDate: Date;
}
