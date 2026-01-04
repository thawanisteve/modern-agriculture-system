export interface AdminStats {
  totalUsers: number;
  newUsersThisMonth: number;
  totalMachinery: number;
  availableMachinery: number;
  monthlyRevenue: number;
  activeBookings: number;
  pendingBookings: number;

  // Additional metrics
  userGrowthRate?: number;
  averageBookingValue?: number;
  mostPopularMachinery?: string;
  topRegion?: string;
  systemUptime?: number;

  // Time-based analytics
  dailyActiveUsers?: number;
  weeklyActiveUsers?: number;
  monthlyActiveUsers?: number;

  // Financial metrics
  totalRevenue?: number;
  revenueGrowthRate?: number;
  averageRevenuePerUser?: number;

  // Operational metrics
  maintenanceRequests?: number;
  completedBookings?: number;
  cancelledBookings?: number;
  customerSatisfactionScore?: number;

  // Last updated timestamp
  lastUpdated?: Date;
}
