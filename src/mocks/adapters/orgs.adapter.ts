import { mockDb } from '../index';
import { Org, SeatUsage, User } from '../../lib/types';

export const orgsAdapter = {
  getOrgById(orgId: string): Org | undefined {
    return mockDb.orgs.find((org) => org.id === orgId);
  },

  getOrgBySlug(slug: string): Org | undefined {
    return mockDb.orgs.find((org) => org.slug === slug);
  },

  getOrgMembers(orgId: string): User[] {
    return mockDb.users.filter((user) => user.orgId === orgId);
  },

  getSeatUsage(orgId: string): SeatUsage {
    const org = this.getOrgById(orgId);
    const memberCount = this.getOrgMembers(orgId).length;
    return {
      used: memberCount,
      available: Math.max((org?.seatLimit ?? 0) - memberCount, 0),
    };
  },
};
