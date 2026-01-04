export interface User {
  id: string;
  email: string;
  displayName: string;
  phoneNumber?: string;
  nationalId?: string;
  role: 'admin' | 'supplier' | 'user';
  isActive: boolean;
  emailVerified: boolean;
  createdAt: Date;
  updatedAt?: Date;
  lastLoginAt?: Date;
  profileImageUrl?: string;
  address?: {
    street?: string;
    city?: string;
    region?: string;
    postalCode?: string;
    country?: string;
  };
  preferences?: {
    notifications: boolean;
    language: string;
    theme: 'light' | 'dark' | 'auto';
  };
  metadata?: {
    loginCount?: number;
    lastActiveAt?: Date;
    registrationSource?: string;
  };
}
