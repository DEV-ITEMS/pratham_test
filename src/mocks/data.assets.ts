import { Asset } from '../lib/types';

export const assets: Asset[] = [
  {
    id: 'asset-logo-org1',
    kind: 'LOGO',
    url: '/logo.png',
    width: 512,
    height: 512,
    altText: 'Demo Interiors logo',
  },
  {
    id: 'asset-thumb-modern-flat',
    kind: 'THUMBNAIL',
    url: '/panos/livingroom.jpg',
    width: 8000,
    height: 4000,
    altText: 'Modern Flat Tour thumbnail',
  },
  {
    id: 'asset-pano-livingroom-day',
    kind: 'PANORAMA',
    url: '/panos/livingroom.jpg',
    width: 8000,
    height: 4000,
    altText: 'Modern flat living room panorama',
  },
  {
    id: 'asset-pano-bedroom-night',
    kind: 'PANORAMA',
    url: '/panos/bedroom.jpg',
    width: 8000,
    height: 4000,
    altText: 'Bedroom panorama',
  },
  {
    id: 'asset-pano-kitchen-chef',
    kind: 'PANORAMA',
    url: '/panos/kitchen.jpg',
    width: 8000,
    height: 4000,
    altText: 'Kitchen panorama',
  },
];
