import { Project } from '../lib/types';

export const projects: Project[] = [
  {
    id: 'project-modern-flat',
    orgId: 'org1',
    name: 'Modern Flat Tour',
    slug: 'modern-flat-tour',
    visibility: 'PUBLIC',
    portfolio: true,
    description: 'A bright, modern flat showcasing open living spaces with warm lighting accents.',
    updatedAt: '2025-02-14T10:30:00.000Z',
    heroImageAssetId: 'asset-thumb-modern-flat',
    buildingIds: ['building-sunrise-residency'],
    tags: ['modern', 'flat', 'demo'],
  },
  {
    id: 'project-private-villa',
    orgId: 'org1',
    name: 'Private Villa',
    slug: 'private-villa',
    visibility: 'PRIVATE',
    portfolio: false,
    description: 'High-end villa concept with bespoke finish selections for a coastal retreat.',
    updatedAt: '2025-01-21T08:45:00.000Z',
    buildingIds: [],
    tags: ['villa', 'concept'],
  },
];
