import { orgsAdapter } from '../mocks/adapters/orgs.adapter';
import { projectsAdapter } from '../mocks/adapters/projects.adapter';
import { hierarchyAdapter } from '../mocks/adapters/hierarchy.adapter';
import { assetsAdapter } from '../mocks/adapters/assets.adapter';
import { sharingAdapter } from '../mocks/adapters/sharing.adapter';
import { analyticsAdapter, ProjectAnalyticsSummary } from '../mocks/adapters/analytics.adapter';
import {
  Asset,
  Org,
  Project,
  ProjectSharing,
  RoomPin,
  RoomView,
  User,
} from './types';

const simulateDelay = async (min = 60, max = 160) => {
  const duration = Math.floor(Math.random() * (max - min + 1)) + min;
  return new Promise((resolve) => setTimeout(resolve, duration));
};

export const apiClient = {
  async fetchOrg(orgId: string): Promise<Org | undefined> {
    await simulateDelay();
    return orgsAdapter.getOrgById(orgId);
  },

  async fetchOrgBySlug(slug: string): Promise<Org | undefined> {
    await simulateDelay();
    return orgsAdapter.getOrgBySlug(slug);
  },

  async fetchOrgMembers(orgId: string): Promise<User[]> {
    await simulateDelay();
    return orgsAdapter.getOrgMembers(orgId);
  },

  async fetchSeatUsage(orgId: string) {
    await simulateDelay();
    return orgsAdapter.getSeatUsage(orgId);
  },

  async fetchProjects(orgId: string): Promise<Project[]> {
    await simulateDelay();
    return projectsAdapter.getProjectsByOrg(orgId);
  },

  async fetchPortfolioProjects(orgId: string): Promise<Project[]> {
    await simulateDelay();
    return projectsAdapter.getPortfolioProjects(orgId);
  },

  async fetchProjectBySlug(slug: string): Promise<Project | undefined> {
    await simulateDelay();
    return projectsAdapter.getProjectBySlug(slug);
  },

  async fetchPublicProject(slug: string): Promise<Project | undefined> {
    await simulateDelay();
    return projectsAdapter.getPublicProjectBySlug(slug);
  },

  async fetchProjectHierarchy(projectId: string) {
    await simulateDelay();
    return hierarchyAdapter.buildHierarchy(projectId);
  },

  async fetchHierarchyTree(projectId: string) {
    await simulateDelay();
    return hierarchyAdapter.getHierarchyTree(projectId);
  },

  async fetchInitialSelection(projectId: string) {
    await simulateDelay();
    return hierarchyAdapter.getInitialSelection(projectId);
  },

  async fetchRoomViews(roomId: string): Promise<RoomView[]> {
    await simulateDelay();
    return hierarchyAdapter.getViewsByRoom(roomId);
  },

  async fetchPinsForView(viewId: string): Promise<RoomPin[]> {
    await simulateDelay();
    return hierarchyAdapter.getPinsByView(viewId);
  },

  async fetchPanoramaAsset(assetId: string): Promise<Asset | undefined> {
    await simulateDelay();
    return assetsAdapter.getPanorama(assetId);
  },

  async fetchSharing(projectId: string): Promise<ProjectSharing | undefined> {
    await simulateDelay();
    return sharingAdapter.getSharing(projectId);
  },

  async updateSharing(projectId: string, payload: Partial<ProjectSharing>): Promise<ProjectSharing> {
    await simulateDelay();
    return sharingAdapter.updateSharing(projectId, payload);
  },

  async fetchAnalytics(projectId: string): Promise<ProjectAnalyticsSummary | undefined> {
    await simulateDelay();
    return analyticsAdapter.getProjectAnalytics(projectId);
  },

  async recordSnapshot(projectId: string): Promise<ProjectAnalyticsSummary> {
    await simulateDelay();
    return analyticsAdapter.incrementSnapshotCount(projectId);
  },
};
