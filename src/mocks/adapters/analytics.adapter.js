const analyticsStore = {
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
  getProjectAnalytics(projectId) {
    return analyticsStore[projectId];
  },

  incrementSnapshotCount(projectId) {
    const current = analyticsStore[projectId];
    if (!current) {
      const fallback = {
        projectId,
        totalViews: 0,
        lastViewedAt: new Date().toISOString(),
        snapshotsDownloaded: 1,
      };
      analyticsStore[projectId] = fallback;
      return fallback;
    }
    const updated = {
      ...current,
      snapshotsDownloaded: current.snapshotsDownloaded + 1,
      lastViewedAt: new Date().toISOString(),
    };
    analyticsStore[projectId] = updated;
    return updated;
  },
};

