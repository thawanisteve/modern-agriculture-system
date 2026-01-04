import {Injectable, signal} from '@angular/core';
import {Machinery} from '../models/Machinery';
import {addDoc, collection, deleteDoc, doc, Firestore, onSnapshot, updateDoc} from '@angular/fire/firestore';

@Injectable({
  providedIn: 'root'
})
export class MachineryService {

  machinery = signal<Machinery[]>([]);
  loading = signal(true);
  error = signal<string | null>(null);

  constructor(private firestore: Firestore) {
    this.initializeMachineryListener();
  }

  initializeMachineryListener(): void {
    const machineryCollection = collection(this.firestore, 'machinery');

    onSnapshot(machineryCollection, (snapshot) => {
      try {
        const machineryData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }) as Machinery);
        this.machinery.set(machineryData);
        this.loading.set(false);
        this.error.set(null);
      } catch (e) {
        this.error.set('Failed to parse machinery data');
        this.loading.set(false);
      }
    },(error) => {
      this.error.set(error.message);
      this.loading.set(false);
    });
  }

  async addMachinery(machinery: Omit<Machinery, 'id'>): Promise<void> {
    const machineryCollection = collection(this.firestore, 'machinery');
    try {
      await addDoc(machineryCollection, {
        ...machinery,
        images: machinery.images || [],
        status: machinery.status || 'available' // Set default status
      });
    } catch (error) {
      console.error('Error adding machinery:', error);
      throw error;
    }
  }

  async updateMachinery(id: string, updates: Partial<Machinery>): Promise<void> {
    const machineryDoc = doc(this.firestore, `machinery/${id}`);
    try {
      await updateDoc(machineryDoc, {
        ...updates,
        images: updates.images || []
      });
    } catch (error) {
      console.error('Error updating machinery:', error);
      throw error;
    }
  }

  async updateMachineryStatus(id: string, status: string): Promise<void> {
    const machineryDoc = doc(this.firestore, `machinery/${id}`);
    try {
      await updateDoc(machineryDoc, {
        status,
        updatedAt: new Date()
      });
    } catch (error) {
      console.error('Error updating machinery status:', error);
      throw error;
    }
  }

  async deleteMachinery(id: string): Promise<void> {
    const machineryDoc = doc(this.firestore, `machinery/${id}`);
    await deleteDoc(machineryDoc);
  }

  // Get available machinery only
  getAvailableMachinery(): Machinery[] {
    return this.machinery().filter(machine => machine.status === 'available');
  }

  // Get machinery by status
  getMachineryByStatus(status: string): Machinery[] {
    return this.machinery().filter(machine => machine.status === status);
  }

  // Check if machinery is available for rent
  isMachineryAvailable(id: string): boolean {
    const machine = this.machinery().find(m => m.id === id);
    return machine?.status === 'available';
  }
}
