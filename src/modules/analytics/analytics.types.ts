// ==========================================
// ANALYTICS TYPES
// ==========================================

export interface CountBreakdown {
  [key: string]: number;
}

// ==========================================
// INCIDENT ANALYTICS
// ==========================================

export interface IncidentAnalytics {
  total: number;

  // Status
  open: number;
  inProgress: number;
  pending: number;
  resolved: number;
  closed: number;

  // Existing priority/severity highlights
  critical: number;
  highPriority: number;

  // Full breakdowns
  byPriority: CountBreakdown;
  bySeverity: CountBreakdown;
  byStatus: CountBreakdown;

  // Resolution metrics
  averageResolutionTimeMinutes: number;
  averageResolutionTimeHours: number;

  // Time-series
  overTime: IncidentTimeSeries[];
}

// ==========================================
// INCIDENT TIME SERIES
// ==========================================

export interface IncidentTimeSeries {
  date: string;
  count: number;
}

// ==========================================
// PROBLEM ANALYTICS
// ==========================================

export interface ProblemAnalytics {
  total: number;

  open: number;
  underInvestigation: number;
  knownError: number;
  resolved: number;
  closed: number;

  highPriority: number;

  byPriority: CountBreakdown;
  byStatus: CountBreakdown;
}

// ==========================================
// SERVICE REQUEST ANALYTICS
// ==========================================

export interface ServiceRequestAnalytics {
  total: number;

  pending: number;
  approved: number;
  inProgress: number;
  completed: number;
  rejected: number;
  cancelled: number;

  byPriority: CountBreakdown;
  byType: CountBreakdown;
  byStatus: CountBreakdown;
}

// ==========================================
// SLA ANALYTICS
// ==========================================

export interface SLAAnalytics {
  total: number;

  active: number;
  completed: number;

  responseBreached: number;
  resolutionBreached: number;

  totalBreached: number;
  compliant: number;

  complianceRate: number;
}

// ==========================================
// ANALYTICS OVERVIEW
// ==========================================

export interface AnalyticsOverview {
  incidents: IncidentAnalytics;

  problems: ProblemAnalytics;

  serviceRequests: ServiceRequestAnalytics;

  sla: SLAAnalytics;
}