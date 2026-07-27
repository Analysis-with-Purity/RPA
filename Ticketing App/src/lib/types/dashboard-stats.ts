export interface TicketVolumePoint {
  date: string;
  opened: number;
  resolved: number;
}

export interface DashboardStats {
  openCount: number;
  pendingCount: number;
  resolvedCount: number;
  avgResponseTimeHours: number;
  avgResolutionTimeHours: number;
  satisfactionScore: number;
  ticketVolumeTrend: TicketVolumePoint[];
}
