import { Injectable, signal } from '@angular/core';
import {
  addDoc,
  collection,
  doc,
  Firestore,
  onSnapshot,
  updateDoc,
  query,
  where,
  orderBy,
  getDocs,
  getDoc,
  deleteDoc
} from '@angular/fire/firestore';
import { Rental } from '../models/Rental';

@Injectable({
  providedIn: 'root'
})
export class RentalService {
  rentals = signal<Rental[]>([]);
  loading = signal(false);
  error = signal<string | null>(null);

  constructor(private firestore: Firestore) {}

  async createRental(rental: Omit<Rental, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    const rentalsCollection = collection(this.firestore, 'rentals');

    try {
      const rentalData = {
        ...rental,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const docRef = await addDoc(rentalsCollection, rentalData);
      return docRef.id;
    } catch (error) {
      console.error('Error creating rental:', error);
      throw error;
    }
  }

  async updateRental(id: string, updates: Partial<Rental>): Promise<void> {
    const rentalDoc = doc(this.firestore, `rentals/${id}`);

    try {
      await updateDoc(rentalDoc, {
        ...updates,
        updatedAt: new Date()
      });
    } catch (error) {
      console.error('Error updating rental:', error);
      throw error;
    }
  }

  async updateRentalPaymentStatus(
    transactionRef: string,
    paymentStatus: 'paid' | 'failed',
    additionalData?: Partial<Rental>
  ): Promise<void> {
    try {
      const rentalsCollection = collection(this.firestore, 'rentals');
      const q = query(rentalsCollection, where('transactionRef', '==', transactionRef));
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        const rentalDoc = querySnapshot.docs[0];
        const updates: Partial<Rental> = {
          paymentStatus,
          status: paymentStatus === 'paid' ? 'active' : 'cancelled',
          updatedAt: new Date(),
          ...additionalData
        };

        await updateDoc(rentalDoc.ref, updates);
      } else {
        throw new Error(`Rental with transaction ref ${transactionRef} not found`);
      }
    } catch (error) {
      console.error('Error updating rental payment status:', error);
      throw error;
    }
  }

  async updateRentalStatus(transactionRef: string, status: Rental['status']): Promise<void> {
    try {
      const rentalsCollection = collection(this.firestore, 'rentals');
      const q = query(rentalsCollection, where('transactionRef', '==', transactionRef));
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        const rentalDoc = querySnapshot.docs[0];
        await updateDoc(rentalDoc.ref, {
          status,
          updatedAt: new Date()
        });
      } else {
        throw new Error(`Rental with transaction ref ${transactionRef} not found`);
      }
    } catch (error) {
      console.error('Error updating rental status:', error);
      throw error;
    }
  }

  async getRentalByTransactionRef(transactionRef: string): Promise<Rental | null> {
    try {
      const rentalsCollection = collection(this.firestore, 'rentals');
      const q = query(rentalsCollection, where('transactionRef', '==', transactionRef));
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        const doc = querySnapshot.docs[0];
        return {
          id: doc.id,
          ...doc.data()
        } as Rental;
      }
      return null;
    } catch (error) {
      console.error('Error getting rental by transaction ref:', error);
      throw error;
    }
  }

  async getRentalsByCustomer(customerEmail: string): Promise<Rental[]> {
    try {
      const rentalsCollection = collection(this.firestore, 'rentals');
      const q = query(
        rentalsCollection,
        where('customerEmail', '==', customerEmail),
        orderBy('createdAt', 'desc')
      );

      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }) as Rental);
    } catch (error) {
      console.error('Error getting customer rentals:', error);
      throw error;
    }
  }

  async getRentalsByMachinery(machineryId: string): Promise<Rental[]> {
    try {
      const rentalsCollection = collection(this.firestore, 'rentals');
      const q = query(
        rentalsCollection,
        where('machineryId', '==', machineryId),
        orderBy('createdAt', 'desc')
      );

      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }) as Rental);
    } catch (error) {
      console.error('Error getting machinery rentals:', error);
      throw error;
    }
  }

  async getRentalById(id: string): Promise<Rental | null> {
    try {
      const rentalDoc = doc(this.firestore, `rentals/${id}`);
      const docSnapshot = await getDoc(rentalDoc);

      if (docSnapshot.exists()) {
        return {
          id: docSnapshot.id,
          ...docSnapshot.data()
        } as Rental;
      }
      return null;
    } catch (error) {
      console.error('Error getting rental by ID:', error);
      throw error;
    }
  }

  async deleteRental(id: string): Promise<void> {
    const rentalDoc = doc(this.firestore, `rentals/${id}`);
    try {
      await deleteDoc(rentalDoc);
    } catch (error) {
      console.error('Error deleting rental:', error);
      throw error;
    }
  }

  async getActiveRentals(): Promise<Rental[]> {
    try {
      const rentalsCollection = collection(this.firestore, 'rentals');
      const q = query(
        rentalsCollection,
        where('status', '==', 'active'),
        orderBy('createdAt', 'desc')
      );

      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }) as Rental);
    } catch (error) {
      console.error('Error getting active rentals:', error);
      throw error;
    }
  }

  async getPendingRentals(): Promise<Rental[]> {
    try {
      const rentalsCollection = collection(this.firestore, 'rentals');
      const q = query(
        rentalsCollection,
        where('status', '==', 'pending'),
        orderBy('createdAt', 'desc')
      );

      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }) as Rental);
    } catch (error) {
      console.error('Error getting pending rentals:', error);
      throw error;
    }
  }

  async completeRental(transactionRef: string): Promise<void> {
    try {
      const rentalsCollection = collection(this.firestore, 'rentals');
      const q = query(rentalsCollection, where('transactionRef', '==', transactionRef));
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        const rentalDoc = querySnapshot.docs[0];
        await updateDoc(rentalDoc.ref, {
          status: 'completed',
          updatedAt: new Date()
        });
      } else {
        throw new Error(`Rental with transaction ref ${transactionRef} not found`);
      }
    } catch (error) {
      console.error('Error completing rental:', error);
      throw error;
    }
  }

  async cancelRental(transactionRef: string, reason?: string): Promise<void> {
    try {
      const rentalsCollection = collection(this.firestore, 'rentals');
      const q = query(rentalsCollection, where('transactionRef', '==', transactionRef));
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        const rentalDoc = querySnapshot.docs[0];
        const updates: Partial<Rental> = {
          status: 'cancelled',
          updatedAt: new Date()
        };

        if (reason) {
          updates.cancellationReason = reason;
        }

        await updateDoc(rentalDoc.ref, updates);
      } else {
        throw new Error(`Rental with transaction ref ${transactionRef} not found`);
      }
    } catch (error) {
      console.error('Error cancelling rental:', error);
      throw error;
    }
  }

  // Check if machinery is currently rented
  async isMachineryRented(machineryId: string): Promise<boolean> {
    try {
      const rentalsCollection = collection(this.firestore, 'rentals');
      const q = query(
        rentalsCollection,
        where('machineryId', '==', machineryId),
        where('status', '==', 'active')
      );

      const querySnapshot = await getDocs(q);
      return !querySnapshot.empty;
    } catch (error) {
      console.error('Error checking if machinery is rented:', error);
      return false;
    }
  }

  // Get overdue rentals (past end date and still active)
  async getOverdueRentals(): Promise<Rental[]> {
    try {
      const rentalsCollection = collection(this.firestore, 'rentals');
      const now = new Date();
      const q = query(
        rentalsCollection,
        where('status', '==', 'active'),
        where('endDate', '<', now),
        orderBy('endDate', 'asc')
      );

      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }) as Rental);
    } catch (error) {
      console.error('Error getting overdue rentals:', error);
      throw error;
    }
  }

  initializeRentalsListener(customerEmail?: string): void {
    let q;
    const rentalsCollection = collection(this.firestore, 'rentals');

    if (customerEmail) {
      q = query(
        rentalsCollection,
        where('customerEmail', '==', customerEmail),
        orderBy('createdAt', 'desc')
      );
    } else {
      q = query(rentalsCollection, orderBy('createdAt', 'desc'));
    }

    this.loading.set(true);

    onSnapshot(q, (snapshot) => {
      try {
        const rentalsData = snapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            ...data,
            // Convert Firestore Timestamps to JavaScript Dates
            startDate: data['startDate']?.toDate(),
            endDate: data['endDate']?.toDate(),
            createdAt: data['createdAt']?.toDate(),
            updatedAt: data['updatedAt']?.toDate()
          } as Rental;
        });

        this.rentals.set(rentalsData);
        this.loading.set(false);
        this.error.set(null);
      } catch (e) {
        this.error.set('Failed to parse rentals data');
        this.loading.set(false);
      }
    }, (error) => {
      this.error.set(error.message);
      this.loading.set(false);
    });
  }

  // Helper method to calculate rental duration in days
  calculateRentalDuration(startDate: Date, endDate: Date): number {
    // Ensure dates are valid
    if (!(startDate instanceof Date)) startDate = new Date(startDate);
    if (!(endDate instanceof Date)) endDate = new Date(endDate);

    const timeDiff = endDate.getTime() - startDate.getTime();
    return Math.ceil(timeDiff / (1000 * 3600 * 24));
  }

  // Helper method to generate unique transaction reference
  generateTransactionRef(): string {
    return 'RENT_' + Date.now() + '_' + Math.floor(Math.random() * 10000);
  }

  // Get rental statistics
  async getRentalStats(): Promise<{
    total: number;
    active: number;
    completed: number;
    cancelled: number;
    pending: number;
  }> {
    try {
      const rentalsCollection = collection(this.firestore, 'rentals');
      const querySnapshot = await getDocs(rentalsCollection);

      const stats = {
        total: 0,
        active: 0,
        completed: 0,
        cancelled: 0,
        pending: 0
      };

      querySnapshot.docs.forEach(doc => {
        const rental = doc.data() as Rental;
        stats.total++;

        switch (rental.status) {
          case 'active':
            stats.active++;
            break;
          case 'completed':
            stats.completed++;
            break;
          case 'cancelled':
            stats.cancelled++;
            break;
          case 'pending':
            stats.pending++;
            break;
        }
      });

      return stats;
    } catch (error) {
      console.error('Error getting rental stats:', error);
      throw error;
    }
  }
}
