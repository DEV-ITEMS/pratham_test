import { mockDb } from '../index';

export const orgsAdapter = {
  getOrgById(orgId) {
    return mockDb.orgs.find((org) => org.id === orgId);
  },

  getOrgBySlug(slug) {
    return mockDb.orgs.find((org) => org.slug === slug);
  },

  getOrgMembers(orgId) {
    return mockDb.users.filter((user) => user.orgId === orgId);
  },

  getSeatUsage(orgId) {
    const org = this.getOrgById(orgId);
    const memberCount = this.getOrgMembers(orgId).length;
    return {
      used: memberCount,
      available: Math.max((org?.seatLimit ?? 0) - memberCount, 0),
    };
  },
};

