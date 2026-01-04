export interface ActivityLog {
  id: string;
  type: ActivityType;
  description: string;
  userId?: string;
  targetId?: string; // ID of the affected resource (machinery, booking, etc.)
  timestamp: Date;
  metadata?: Record<string, any>;
  severity?: 'info' | 'warning' | 'error' | 'success';
  source?: 'admin' | 'user' | 'system' | 'api';
  ipAddress?: string;
  userAgent?: string;
}

export type ActivityType =
// User activities
  | 'user_registered'
  | 'user_created'
  | 'user_updated'
  | 'user_deleted'
  | 'user_login'
  | 'user_logout'
  | 'user_role_changed'
  | 'user_suspended'
  | 'user_activated'

  // Machinery activities
  | 'machinery_added'
  | 'machinery_updated'
  | 'machinery_deleted'
  | 'machinery_status_changed'
  | 'machinery_maintenance'

  // Booking activities
  | 'booking_created'
  | 'booking_updated'
  | 'booking_cancelled'
  | 'booking_completed'
  | 'booking_approved'
  | 'booking_rejected'

  // System activities
  | 'system_backup'
  | 'system_maintenance'
  | 'system_update'
  | 'system_error'
  | 'data_export'
  | 'data_import'

  // Admin activities
  | 'admin_login'
  | 'admin_settings_changed'
  | 'admin_user_created'
  | 'admin_report_generated'

  // Security activities
  | 'security_login_failed'
  | 'security_password_reset'
  | 'security_suspicious_activity'
  | 'security_access_denied';

export interface ActivityFilter {
  type?: ActivityType[];
  userId?: string;
  dateFrom?: Date;
  dateTo?: Date;
  severity?: ('info' | 'warning' | 'error' | 'success')[];
  source?: ('admin' | 'user' | 'system' | 'api')[];
  limit?: number;
  offset?: number;
}
