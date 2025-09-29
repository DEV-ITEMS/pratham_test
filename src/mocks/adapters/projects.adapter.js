import { mockDb } from '../index';

export const projectsAdapter = {
  getProjectsByOrg(orgId) {
    return mockDb.projects.filter((project) => project.orgId === orgId);
  },

  getProjectBySlug(slug) {
    return mockDb.projects.find((project) => project.slug === slug);
  },

  getProjectById(projectId) {
    return mockDb.projects.find((project) => project.id === projectId);
  },

  getPortfolioProjects(orgId) {
    return mockDb.projects.filter((project) => project.orgId === orgId && project.portfolio);
  },

  getPublicProjectBySlug(slug) {
    const project = this.getProjectBySlug(slug);
    if (!project || project.visibility === 'PRIVATE') {
      return undefined;
    }
    return project;
  },
};

