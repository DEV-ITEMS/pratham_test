export interface ProjectAnalyticsSummary {
  projectId: string;
  totalViews: number;
  lastViewedAt: string;
  snapshotsDownloaded: number;
}

const analyticsStore: Record<string, ProjectAnalyticsSummary> = {
  'project-modern-flat': {
    projectId: 'project-modern-flat',
    totalViews: 482,
    lastViewedAt: '2025-02-20T12:15:00.000Z',
    snapshotsDownloaded: 37,
  },
  'project-private-villa': {
    projectId: 'project-private-villa',
    totalViews: 24,
    lastViewedAt: '2025-02-18T09:05:00.000Z',
    snapshotsDownloaded: 4,
  },
};

export const analyticsAdapter = {
  getProjectAnalytics(projectId: string): ProjectAnalyticsSummary | undefined {
    return analyticsStore[projectId];
  },

  incrementSnapshotCount(projectId: string): ProjectAnalyticsSummary {
    const current = analyticsStore[projectId];
    if (!current) {
      const fallback: ProjectAnalyticsSummary = {
        projectId,
        totalViews: 0,
        lastViewedAt: new Date().toISOString(),
        snapshotsDownloaded: 1,
      };
      analyticsStore[projectId] = fallback;
      return fallback;
    }
    const updated: ProjectAnalyticsSummary = {
      ...current,
      snapshotsDownloaded: current.snapshotsDownloaded + 1,
      lastViewedAt: new Date().toISOString(),
    };
    analyticsStore[projectId] = updated;
    return updated;
  },
};
