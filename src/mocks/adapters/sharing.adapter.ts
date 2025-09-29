import { ProjectSharing } from '../../lib/types';

const sharingMap: Record<string, ProjectSharing> = {
  'project-modern-flat': {
    projectId: 'project-modern-flat',
    restriction: 'PUBLIC',
    invitees: ['client@demo-interiors.com'],
  },
  'project-private-villa': {
    projectId: 'project-private-villa',
    restriction: 'PRIVATE',
    invitees: ['vip@clients.com'],
    passwordProtected: true,
  },
};

export const sharingAdapter = {
  getSharing(projectId: string): ProjectSharing | undefined {
    return sharingMap[projectId];
  },

  updateSharing(projectId: string, payload: Partial<ProjectSharing>): ProjectSharing {
    const current = sharingMap[projectId] ?? {
      projectId,
      restriction: 'PRIVATE',
      invitees: [],
    };
    const updated = { ...current, ...payload };
    sharingMap[projectId] = updated;
    return updated;
  },
};
