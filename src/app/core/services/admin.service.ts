import { Injectable, inject, signal } from '@angular/core';
import {
  Firestore,
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
  orderBy,
  limit,
  where,
  getDocs,
  setDoc
} from '@angular/fire/firestore';
import {
  Auth,
  createUserWithEmailAndPassword,
  sendEmailVerification
} from '@angular/fire/auth';
import { User } from '../models/User';
import { AdminStats } from '../models/AdminStats';
import { ActivityLog } from '../models/ActivityLog';

@Injectable({
  providedIn: 'root'
})
export class AdminService {
  private firestore = inject(Firestore);
  private auth = inject(Auth);

  // Signals for reactive state management
  users = signal<User[]>([]);
  adminStats = signal<AdminStats>({
    totalUsers: 0,
    newUsersThisMonth: 0,
    totalMachinery: 0,
    availableMachinery: 0,
    monthlyRevenue: 0,
    activeBookings: 0,
    pendingBookings: 0
  });
  recentActivities = signal<ActivityLog[]>([]);
  loading = signal<boolean>(false);
  error = signal<string | null>(null);

  constructor() {
    this.initializeListeners();
  }

  initializeAdminData(): void {
    this.initializeListeners();
    this.calculateStats();
  }

  private initializeListeners(): void {
    this.initializeUsersListener();
    this.initializeActivitiesListener();
  }

  // Users management
  private initializeUsersListener(): void {
    const usersCollection = collection(this.firestore, 'users');
    const usersQuery = query(usersCollection, orderBy('createdAt', 'desc'));

    onSnapshot(usersQuery, (snapshot) => {
      try {
        const usersData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data()['createdAt']?.toDate() || new Date()
        }) as User);

        this.users.set(usersData);
        this.calculateStats();
        this.error.set(null);
      } catch (e) {
        this.error.set('Failed to load users data');
        console.error('Error parsing users data:', e);
      }
    }, (error) => {
      this.error.set(error.message);
      console.error('Error listening to users:', error);
    });
  }

  async createUser(userData: Omit<User, 'id'>): Promise<void> {
    this.loading.set(true);
    try {
      // Create user in Authentication
      const userCredential = await createUserWithEmailAndPassword(
        this.auth,
        userData.email,
        '1234' // You might want to generate a random password
      );

      const authUser = userCredential.user;

      // Send email verification
      await sendEmailVerification(authUser);

      // Save user data to Firestore
      const userDocRef = doc(this.firestore, `users/${authUser.uid}`);
      await setDoc(userDocRef, {
        ...userData,
        createdAt: new Date(),
        emailVerified: false
      });

      // Log activity
      await this.logActivity({
        type: 'user_created',
        description: `New user created: ${userData.displayName}`,
        userId: authUser.uid,
        metadata: { email: userData.email, role: userData.role }
      });

    } catch (error: any) {
      this.error.set(this.handleFirebaseError(error.code));
      throw error;
    } finally {
      this.loading.set(false);
    }
  }

  async updateUser(userId: string, updates: Partial<User>): Promise<void> {
    this.loading.set(true);
    try {
      const userDocRef = doc(this.firestore, `users/${userId}`);
      await updateDoc(userDocRef, {
        ...updates,
        updatedAt: new Date()
      });

      // Log activity
      await this.logActivity({
        type: 'user_updated',
        description: `User updated: ${updates.displayName || 'User'}`,
        userId: userId,
        metadata: updates
      });

    } catch (error: any) {
      this.error.set('Failed to update user');
      throw error;
    } finally {
      this.loading.set(false);
    }
  }

  async deleteUser(userId: string): Promise<void> {
    this.loading.set(true);
    try {
      const userDocRef = doc(this.firestore, `users/${userId}`);
      await deleteDoc(userDocRef);

      // Log activity
      await this.logActivity({
        type: 'user_deleted',
        description: `User deleted`,
        userId: userId
      });

    } catch (error: any) {
      this.error.set('Failed to delete user');
      throw error;
    } finally {
      this.loading.set(false);
    }
  }

  // Activity logging
  private initializeActivitiesListener(): void {
    const activitiesCollection = collection(this.firestore, 'activities');
    const activitiesQuery = query(
      activitiesCollection,
      orderBy('timestamp', 'desc'),
      limit(10)
    );

    onSnapshot(activitiesQuery, (snapshot) => {
      try {
        const activitiesData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          timestamp: doc.data()['timestamp']?.toDate() || new Date()
        }) as ActivityLog);

        this.recentActivities.set(activitiesData);
      } catch (e) {
        console.error('Error parsing activities data:', e);
      }
    });
  }

  async logActivity(activityData: Omit<ActivityLog, 'id' | 'timestamp'>): Promise<void> {
    try {
      const activitiesCollection = collection(this.firestore, 'activities');
      await addDoc(activitiesCollection, {
        ...activityData,
        timestamp: new Date()
      });
    } catch (error) {
      console.error('Error logging activity:', error);
    }
  }

  // Statistics calculation
  private async calculateStats(): Promise<void> {
    try {
      const users = this.users();
      const currentDate = new Date();
      const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);

      // Calculate user stats
      const totalUsers = users.length;
      const newUsersThisMonth = users.filter(user =>
        user.createdAt >= firstDayOfMonth
      ).length;

      // Get machinery stats (you'll need to inject MachineryService or query directly)
      const machineryCollection = collection(this.firestore, 'machinery');
      const machinerySnapshot = await getDocs(machineryCollection);
      const machineryData = machinerySnapshot.docs.map(doc => doc.data());

      const totalMachinery = machineryData.length;
      const availableMachinery = machineryData.filter(m => m['status'] === 'available').length;

      // Calculate revenue (this is a mock calculation - adjust based on your booking system)
      const monthlyRevenue = machineryData.reduce((sum, machine) => {
        return sum + (machine['pricePerDay'] || 0) * 5; // Assuming 5 rental days per month average
      }, 0);

      // Get bookings stats (if you have a bookings collection)
      const activeBookings = 15; // Mock data - replace with actual query
      const pendingBookings = 8;  // Mock data - replace with actual query

      this.adminStats.set({
        totalUsers,
        newUsersThisMonth,
        totalMachinery,
        availableMachinery,
        monthlyRevenue,
        activeBookings,
        pendingBookings
      });

    } catch (error) {
      console.error('Error calculating stats:', error);
    }
  }

  // User role management
  async assignRole(userId: string, role: 'admin' | 'supplier' | 'user'): Promise<void> {
    await this.updateUser(userId, { role });
  }

  async toggleUserStatus(userId: string): Promise<void> {
    const user = this.users().find(u => u.id === userId);
    if (user) {
      await this.updateUser(userId, { isActive: !user.isActive });
    }
  }

  // Search and filter methods
  searchUsers(searchTerm: string): User[] {
    const users = this.users();
    if (!searchTerm) return users;

    const term = searchTerm.toLowerCase();
    return users.filter(user =>
      user.displayName.toLowerCase().includes(term) ||
      user.email.toLowerCase().includes(term) ||
      user.phoneNumber?.toLowerCase().includes(term)
    );
  }

  filterUsersByRole(role: string): User[] {
    const users = this.users();
    if (!role) return users;

    return users.filter(user => user.role === role);
  }

  // Utility methods
  private handleFirebaseError(errorCode: string): string {
    switch (errorCode) {
      case 'auth/email-already-in-use':
        return 'Email address is already in use.';
      case 'auth/invalid-email':
        return 'Invalid email address.';
      case 'auth/operation-not-allowed':
        return 'Operation not allowed.';
      case 'auth/weak-password':
        return 'Password is too weak.';
      case 'permission-denied':
        return 'Permission denied. Admin access required.';
      default:
        return 'An unexpected error occurred. Please try again.';
    }
  }

  // Export data for reports
  async exportUserData(): Promise<User[]> {
    return this.users();
  }

  async exportActivityData(): Promise<ActivityLog[]> {
    return this.recentActivities();
  }

  // System maintenance methods
  async cleanupOldActivities(): Promise<void> {
    try {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const activitiesCollection = collection(this.firestore, 'activities');
      const oldActivitiesQuery = query(
        activitiesCollection,
        where('timestamp', '<', thirtyDaysAgo)
      );

      const snapshot = await getDocs(oldActivitiesQuery);
      const deletePromises = snapshot.docs.map(doc => deleteDoc(doc.ref));

      await Promise.all(deletePromises);

      console.log(`Cleaned up ${snapshot.size} old activity records`);
    } catch (error) {
      console.error('Error cleaning up old activities:', error);
    }
  }
}
