import { orgsAdapter } from '../mocks/adapters/orgs.adapter';
import { projectsAdapter } from '../mocks/adapters/projects.adapter';
import { hierarchyAdapter } from '../mocks/adapters/hierarchy.adapter';
import { assetsAdapter } from '../mocks/adapters/assets.adapter';
import { sharingAdapter } from '../mocks/adapters/sharing.adapter';
import { analyticsAdapter } from '../mocks/adapters/analytics.adapter';

const simulateDelay = async (min = 60, max = 160) => {
  const duration = Math.floor(Math.random() * (max - min + 1)) + min;
  return new Promise((resolve) => setTimeout(resolve, duration));
};

export const apiClient = {
  async fetchOrg(orgId) {
    await simulateDelay();
    return orgsAdapter.getOrgById(orgId);
  },

  async fetchOrgBySlug(slug) {
    await simulateDelay();
    return orgsAdapter.getOrgBySlug(slug);
  },

  async fetchOrgMembers(orgId) {
    await simulateDelay();
    return orgsAdapter.getOrgMembers(orgId);
  },

  async fetchSeatUsage(orgId) {
    await simulateDelay();
    return orgsAdapter.getSeatUsage(orgId);
  },

  async fetchProjects(orgId) {
    await simulateDelay();
    return projectsAdapter.getProjectsByOrg(orgId);
  },

  async fetchPortfolioProjects(orgId) {
    await simulateDelay();
    return projectsAdapter.getPortfolioProjects(orgId);
  },

  async fetchProjectBySlug(slug) {
    await simulateDelay();
    return projectsAdapter.getProjectBySlug(slug);
  },

  async fetchPublicProject(slug) {
    await simulateDelay();
    return projectsAdapter.getPublicProjectBySlug(slug);
  },

  async fetchProjectHierarchy(projectId) {
    await simulateDelay();
    return hierarchyAdapter.buildHierarchy(projectId);
  },

  async fetchHierarchyTree(projectId) {
    await simulateDelay();
    return hierarchyAdapter.getHierarchyTree(projectId);
  },

  async fetchInitialSelection(projectId) {
    await simulateDelay();
    return hierarchyAdapter.getInitialSelection(projectId);
  },

  async fetchRoomViews(roomId) {
    await simulateDelay();
    return hierarchyAdapter.getViewsByRoom(roomId);
  },

  async fetchPinsForView(viewId) {
    await simulateDelay();
    return hierarchyAdapter.getPinsByView(viewId);
  },

  async fetchPanoramaAsset(assetId) {
    await simulateDelay();
    return assetsAdapter.getPanorama(assetId);
  },

  async fetchSharing(projectId) {
    await simulateDelay();
    return sharingAdapter.getSharing(projectId);
  },

  async updateSharing(projectId, payload) {
    await simulateDelay();
    return sharingAdapter.updateSharing(projectId, payload);
  },

  async fetchAnalytics(projectId) {
    await simulateDelay();
    return analyticsAdapter.getProjectAnalytics(projectId);
  },

  async recordSnapshot(projectId) {
    await simulateDelay();
    return analyticsAdapter.incrementSnapshotCount(projectId);
  },
};

