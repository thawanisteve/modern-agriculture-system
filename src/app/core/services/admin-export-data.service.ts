import { Injectable } from '@angular/core';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import {AdminStats} from '../models/AdminStats';
import {ActivityLog} from '../models/ActivityLog';
import {User} from '../models/User';

declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: any) => jsPDF;
    lastAutoTable: {
      finalY: number;
    };
  }
}

@Injectable({
  providedIn: 'root'
})
export class AdminExportDataService {

  constructor() { }

  // Generate comprehensive CSV report
  generateCSVReport(users: User[], stats: AdminStats, activities: ActivityLog[]): void {
    const csvData = this.prepareCSVData(users, stats, activities);
    this.downloadCSV(csvData, `business-analytics-report-${new Date().toISOString().split('T')[0]}.csv`);
  }

  // Generate comprehensive PDF report
  generatePDFReport(users: User[], stats: AdminStats, activities: ActivityLog[]): void {
    const doc = new jsPDF();

    // Set up the document
    this.setupPDFHeader(doc);

    // Add executive summary
    this.addExecutiveSummary(doc, stats);

    // Add user analytics
    this.addUserAnalytics(doc, users, stats);

    // Add revenue and financial insights
    this.addFinancialAnalytics(doc, stats);

    // Add operational metrics
    this.addOperationalMetrics(doc, stats);

    // Add user demographics table
    this.addUserDemographicsTable(doc, users);

    // Add recent activity summary
    this.addActivitySummary(doc, activities);

    // Add recommendations
    this.addBusinessRecommendations(doc, users, stats);

    doc.save(`business-analytics-report-${new Date().toISOString().split('T')[0]}.pdf`);
  }

  private prepareCSVData(users: User[], stats: AdminStats, activities: ActivityLog[]): string {
    const csvRows: string[] = [];

    // Header section
    csvRows.push('BUSINESS ANALYTICS REPORT');
    csvRows.push(`Generated on: ${new Date().toLocaleString()}`);
    csvRows.push('');

    // Executive Summary
    csvRows.push('EXECUTIVE SUMMARY');
    csvRows.push('Metric,Value,Growth');
    csvRows.push(`Total Users,${stats.totalUsers},+${stats.newUsersThisMonth} this month`);
    csvRows.push(`Total Machinery,${stats.totalMachinery},${stats.availableMachinery} available`);
    csvRows.push(`Monthly Revenue,MWK ${stats.monthlyRevenue.toLocaleString()},+15% from last month`);
    csvRows.push(`Active Bookings,${stats.activeBookings},${stats.pendingBookings} pending`);
    csvRows.push('');

    // User Demographics Analysis
    csvRows.push('USER DEMOGRAPHICS ANALYSIS');
    const usersByRole = this.analyzeUsersByRole(users);
    csvRows.push('Role,Count,Percentage');
    Object.entries(usersByRole).forEach(([role, count]) => {
      const percentage = ((count / users.length) * 100).toFixed(1);
      csvRows.push(`${role},${count},${percentage}%`);
    });
    csvRows.push('');

    // Verification Status Analysis
    csvRows.push('USER VERIFICATION STATUS');
    const verificationStats = this.analyzeVerificationStatus(users);
    csvRows.push('Status,Count,Percentage');
    Object.entries(verificationStats).forEach(([status, count]) => {
      const percentage = ((count / users.length) * 100).toFixed(1);
      csvRows.push(`${status},${count},${percentage}%`);
    });
    csvRows.push('');

    // Monthly Growth Analysis
    csvRows.push('GROWTH METRICS');
    csvRows.push('Metric,Current Month,Growth Rate');
    csvRows.push(`New User Registrations,${stats.newUsersThisMonth},${this.calculateUserGrowthRate(stats)}%`);
    csvRows.push(`Revenue Growth,MWK ${stats.monthlyRevenue.toLocaleString()},+15%`);
    csvRows.push(`Booking Conversion Rate,${this.calculateBookingConversionRate(stats)}%,+5%`);
    csvRows.push('');

    // User Activity Analysis
    csvRows.push('USER ACTIVITY ANALYSIS');
    const activityStats = this.analyzeUserActivity(users);
    csvRows.push('Activity Level,Count,Percentage');
    Object.entries(activityStats).forEach(([level, count]) => {
      const percentage = ((count / users.length) * 100).toFixed(1);
      csvRows.push(`${level},${count},${percentage}%`);
    });
    csvRows.push('');

    // Detailed User List
    csvRows.push('DETAILED USER DATA');
    csvRows.push('Name,Email,Phone,Role,Status,Verification,Join Date,Activity Level');
    users.forEach(user => {
      const activityLevel = this.getUserActivityLevel(user);
      csvRows.push(`"${user.displayName}","${user.email}","${user.phoneNumber || 'N/A'}","${user.role}","${user.isActive ? 'Active' : 'Inactive'}","${user.emailVerified ? 'Verified' : 'Pending'}","${new Date(user.createdAt).toLocaleDateString()}","${activityLevel}"`);
    });
    csvRows.push('');

    // Business Recommendations
    csvRows.push('BUSINESS RECOMMENDATIONS');
    const recommendations = this.generateBusinessRecommendations(users, stats);
    recommendations.forEach((rec, index) => {
      csvRows.push(`${index + 1}. ${rec}`);
    });

    return csvRows.join('\n');
  }

  private setupPDFHeader(doc: jsPDF): void {
    // Company header
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.text('AGRICULTURAL MACHINERY RENTAL', 105, 20, { align: 'center' });

    doc.setFontSize(16);
    doc.text('Business Analytics Report', 105, 30, { align: 'center' });

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Generated on: ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}`, 105, 40, { align: 'center' });

    // Add a line separator
    doc.setLineWidth(0.5);
    doc.line(20, 45, 190, 45);
  }

  private addExecutiveSummary(doc: jsPDF, stats: AdminStats): void {
    let yPos = 55;

    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('EXECUTIVE SUMMARY', 20, yPos);

    yPos += 10;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');

    const summaryData = [
      ['Total Users', stats.totalUsers.toString(), `+${stats.newUsersThisMonth} this month`],
      ['Total Machinery', stats.totalMachinery.toString(), `${stats.availableMachinery} available`],
      ['Monthly Revenue', `MWK ${stats.monthlyRevenue.toLocaleString()}`, '+15% growth'],
      ['Active Bookings', stats.activeBookings.toString(), `${stats.pendingBookings} pending`],
      ['User Growth Rate', `${this.calculateUserGrowthRate(stats)}%`, 'Month over month'],
      ['Booking Conversion', `${this.calculateBookingConversionRate(stats)}%`, 'Current rate']
    ];

    // Check if autoTable is available
    if (typeof doc.autoTable === 'function') {
      doc.autoTable({
        startY: yPos,
        head: [['Metric', 'Value', 'Trend/Status']],
        body: summaryData,
        theme: 'grid',
        styles: { fontSize: 9 },
        headStyles: { fillColor: [74, 112, 74] }
      });
    } else {
      // Fallback: create table manually
      this.createManualTable(doc, yPos, [['Metric', 'Value', 'Trend/Status']], summaryData);
    }
  }

  private addUserAnalytics(doc: jsPDF, users: User[], stats: AdminStats): void {
    const finalY = doc.lastAutoTable?.finalY || 120;
    let yPos = finalY + 15;

    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('USER ANALYTICS', 20, yPos);

    yPos += 10;

    // User role distribution
    const usersByRole = this.analyzeUsersByRole(users);
    const roleData = Object.entries(usersByRole).map(([role, count]) => [
      role.charAt(0).toUpperCase() + role.slice(1),
      count.toString(),
      `${((count / users.length) * 100).toFixed(1)}%`
    ]);

    if (typeof doc.autoTable === 'function') {
      doc.autoTable({
        startY: yPos,
        head: [['User Role', 'Count', 'Percentage']],
        body: roleData,
        theme: 'striped',
        styles: { fontSize: 9 }
      });
    } else {
      this.createManualTable(doc, yPos, [['User Role', 'Count', 'Percentage']], roleData);
    }
  }

  private addFinancialAnalytics(doc: jsPDF, stats: AdminStats): void {
    const finalY = doc.lastAutoTable?.finalY || 160;
    let yPos = finalY + 15;

    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('FINANCIAL ANALYTICS', 20, yPos);

    yPos += 10;

    const financialData = [
      ['Current Monthly Revenue', `MWK ${stats.monthlyRevenue.toLocaleString()}`],
      ['Revenue Growth Rate', '+15% MoM'],
      ['Average Revenue per User', `MWK ${Math.round(stats.monthlyRevenue / stats.totalUsers).toLocaleString()}`],
      ['Revenue per Active Booking', `MWK ${Math.round(stats.monthlyRevenue / stats.activeBookings).toLocaleString()}`],
      ['Projected Annual Revenue', `MWK ${(stats.monthlyRevenue * 12).toLocaleString()}`]
    ];

    if (typeof doc.autoTable === 'function') {
      doc.autoTable({
        startY: yPos,
        head: [['Financial Metric', 'Value']],
        body: financialData,
        theme: 'grid',
        styles: { fontSize: 9 },
        headStyles: { fillColor: [139, 69, 19] }
      });
    } else {
      this.createManualTable(doc, yPos, [['Financial Metric', 'Value']], financialData);
    }
  }

  private addOperationalMetrics(doc: jsPDF, stats: AdminStats): void {
    const finalY = doc.lastAutoTable?.finalY || 200;
    let yPos = finalY + 15;

    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('OPERATIONAL METRICS', 20, yPos);

    yPos += 10;

    const operationalData = [
      ['Machinery Utilization Rate', `${Math.round((stats.activeBookings / stats.totalMachinery) * 100)}%`],
      ['Average Bookings per Machine', Math.round(stats.activeBookings / stats.totalMachinery).toString()],
      ['Booking Conversion Rate', `${this.calculateBookingConversionRate(stats)}%`],
      ['Equipment Availability', `${Math.round((stats.availableMachinery / stats.totalMachinery) * 100)}%`],
      ['Pending Booking Rate', `${Math.round((stats.pendingBookings / stats.activeBookings) * 100)}%`]
    ];

    if (typeof doc.autoTable === 'function') {
      doc.autoTable({
        startY: yPos,
        head: [['Operational Metric', 'Value']],
        body: operationalData,
        theme: 'striped',
        styles: { fontSize: 9 }
      });
    } else {
      this.createManualTable(doc, yPos, [['Operational Metric', 'Value']], operationalData);
    }
  }

  private addUserDemographicsTable(doc: jsPDF, users: User[]): void {
    // Add new page if needed
    if (doc.lastAutoTable?.finalY && doc.lastAutoTable.finalY > 240) {
      doc.addPage();
      this.setupPDFHeader(doc);
    }

    const finalY = doc.lastAutoTable?.finalY || 240;
    let yPos = finalY + 15;

    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('USER DEMOGRAPHICS TABLE', 20, yPos);

    yPos += 10;

    const userData = users.slice(0, 15).map(user => [
      user.displayName,
      user.role.charAt(0).toUpperCase() + user.role.slice(1),
      user.emailVerified ? 'Verified' : 'Pending',
      user.isActive ? 'Active' : 'Inactive',
      new Date(user.createdAt).toLocaleDateString()
    ]);

    if (typeof doc.autoTable === 'function') {
      doc.autoTable({
        startY: yPos,
        head: [['User Name', 'Role', 'Verification', 'Status', 'Join Date']],
        body: userData,
        theme: 'grid',
        styles: { fontSize: 8 }
      });
    } else {
      this.createManualTable(doc, yPos, [['User Name', 'Role', 'Verification', 'Status', 'Join Date']], userData);
    }
  }

  private addActivitySummary(doc: jsPDF, activities: ActivityLog[]): void {
    const finalY = doc.lastAutoTable?.finalY || 280;

    if (finalY > 240) {
      doc.addPage();
      this.setupPDFHeader(doc);
    }

    let yPos = finalY > 240 ? 55 : finalY + 15;

    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('RECENT ACTIVITY SUMMARY', 20, yPos);

    yPos += 10;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');

    const activitySummary = activities.slice(0, 10).map(activity => [
      activity.description,
      activity.type.replace('_', ' ').toUpperCase(),
      new Date(activity.timestamp).toLocaleDateString()
    ]);

    if (typeof doc.autoTable === 'function') {
      doc.autoTable({
        startY: yPos,
        head: [['Activity', 'Type', 'Date']],
        body: activitySummary,
        theme: 'striped',
        styles: { fontSize: 8 }
      });
    } else {
      this.createManualTable(doc, yPos, [['Activity', 'Type', 'Date']], activitySummary);
    }
  }

  private addBusinessRecommendations(doc: jsPDF, users: User[], stats: AdminStats): void {
    const finalY = doc.lastAutoTable?.finalY || 280;

    if (finalY > 220) {
      doc.addPage();
      this.setupPDFHeader(doc);
    }

    let yPos = finalY > 220 ? 55 : finalY + 20;

    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('BUSINESS RECOMMENDATIONS', 20, yPos);

    yPos += 10;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');

    const recommendations = this.generateBusinessRecommendations(users, stats);

    recommendations.forEach((recommendation, index) => {
      if (yPos > 270) {
        doc.addPage();
        yPos = 20;
      }
      doc.text(`${index + 1}. ${recommendation}`, 20, yPos, { maxWidth: 170 });
      yPos += 10;
    });
  }

  // Fallback method to create tables manually if autoTable fails
  private createManualTable(doc: jsPDF, startY: number, headers: string[][], data: string[][]): void {
    let yPos = startY;
    const lineHeight = 8;
    const colWidth = 60;

    // Draw headers
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    headers[0].forEach((header, index) => {
      doc.text(header, 20 + (index * colWidth), yPos);
    });
    yPos += lineHeight;

    // Draw a line under headers
    doc.setLineWidth(0.1);
    doc.line(20, yPos - 2, 20 + (headers[0].length * colWidth), yPos - 2);

    // Draw data rows
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    data.forEach((row) => {
      row.forEach((cell, index) => {
        doc.text(cell.toString(), 20 + (index * colWidth), yPos);
      });
      yPos += lineHeight;
    });

    // Update lastAutoTable for compatibility
    (doc as any).lastAutoTable = { finalY: yPos };
  }

  private analyzeUsersByRole(users: User[]): Record<string, number> {
    return users.reduce((acc, user) => {
      acc[user.role] = (acc[user.role] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
  }

  private analyzeVerificationStatus(users: User[]): Record<string, number> {
    return users.reduce((acc, user) => {
      const status = user.emailVerified ? 'Verified' : 'Pending';
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
  }

  private analyzeUserActivity(users: User[]): Record<string, number> {
    return users.reduce((acc, user) => {
      const level = this.getUserActivityLevel(user);
      acc[level] = (acc[level] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
  }

  private getUserActivityLevel(user: User): string {
    const daysSinceJoin = Math.floor((Date.now() - new Date(user.createdAt).getTime()) / (1000 * 60 * 60 * 24));

    if (daysSinceJoin <= 7) return 'New User';
    if (daysSinceJoin <= 30) return 'Active';
    if (daysSinceJoin <= 90) return 'Regular';
    return 'Long-term';
  }

  private calculateUserGrowthRate(stats: AdminStats): number {
    const previousMonthUsers = stats.totalUsers - stats.newUsersThisMonth;
    return previousMonthUsers > 0 ? Math.round((stats.newUsersThisMonth / previousMonthUsers) * 100) : 100;
  }

  private calculateBookingConversionRate(stats: AdminStats): number {
    return Math.round((stats.activeBookings / stats.totalUsers) * 100);
  }

  private generateBusinessRecommendations(users: User[], stats: AdminStats): string[] {
    const recommendations: string[] = [];

    // User verification recommendation
    const unverifiedUsers = users.filter(u => !u.emailVerified).length;
    const unverifiedRate = (unverifiedUsers / users.length) * 100;
    if (unverifiedRate > 20) {
      recommendations.push(`${unverifiedRate.toFixed(1)}% of users are unverified. Implement email verification campaigns to improve user trust and reduce fraud.`);
    }

    // Machinery utilization
    const utilizationRate = (stats.activeBookings / stats.totalMachinery) * 100;
    if (utilizationRate < 60) {
      recommendations.push(`Machinery utilization at ${utilizationRate.toFixed(1)}%. Consider promotional campaigns or dynamic pricing to increase bookings.`);
    }

    // User growth
    const growthRate = this.calculateUserGrowthRate(stats);
    if (growthRate < 10) {
      recommendations.push(`User growth rate is ${growthRate}%. Implement referral programs and marketing campaigns to accelerate user acquisition.`);
    }

    // Revenue optimization
    const avgRevenuePerUser = stats.monthlyRevenue / stats.totalUsers;
    if (avgRevenuePerUser < 50000) {
      recommendations.push(`Average revenue per user is MWK ${avgRevenuePerUser.toFixed(0)}. Consider upselling services or premium memberships.`);
    }

    // Operational efficiency
    const pendingRate = (stats.pendingBookings / stats.activeBookings) * 100;
    if (pendingRate > 30) {
      recommendations.push(`${pendingRate.toFixed(1)}% of bookings are pending. Streamline approval process to improve customer satisfaction.`);
    }

    // Supplier engagement
    const supplierCount = users.filter(u => u.role === 'supplier').length;
    const supplierRatio = (supplierCount / stats.totalMachinery) * 100;
    if (supplierRatio < 50) {
      recommendations.push(`Low supplier-to-machinery ratio (${supplierRatio.toFixed(1)}%). Recruit more suppliers to improve service availability.`);
    }

    return recommendations;
  }

  private downloadCSV(csvContent: string, filename: string): void {
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');

    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', filename);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }
  }
}
