import { mockDb } from '../index';
import { Project } from '../../lib/types';

export const projectsAdapter = {
  getProjectsByOrg(orgId: string): Project[] {
    return mockDb.projects.filter((project) => project.orgId === orgId);
  },

  getProjectBySlug(slug: string): Project | undefined {
    return mockDb.projects.find((project) => project.slug === slug);
  },

  getProjectById(projectId: string): Project | undefined {
    return mockDb.projects.find((project) => project.id === projectId);
  },

  getPortfolioProjects(orgId: string): Project[] {
    return mockDb.projects.filter((project) => project.orgId === orgId && project.portfolio);
  },

  getPublicProjectBySlug(slug: string): Project | undefined {
    const project = this.getProjectBySlug(slug);
    if (!project || project.visibility === 'PRIVATE') {
      return undefined;
    }
    return project;
  },
};
