// ==========================================
// ANALYTICS TYPES
// ==========================================

export interface IncidentAnalytics {
  total: number;
  open: number;
  inProgress: number;
  pending: number;
  resolved: number;
  closed: number;
  critical: number;
  highPriority: number;
}

export interface ProblemAnalytics {
  total: number;
  open: number;
  resolved: number;
  closed: number;
  highPriority: number;
}

export interface ServiceRequestAnalytics {
  total: number;
  pending: number;
  approved: number;
  inProgress: number;
  completed: number;
  rejected: number;
  cancelled: number;
}

export interface AnalyticsOverview {
  incidents: IncidentAnalytics;
  problems: ProblemAnalytics;
  serviceRequests: ServiceRequestAnalytics;
}