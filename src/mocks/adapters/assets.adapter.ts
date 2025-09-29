import { mockDb } from '../index';
import { Asset } from '../../lib/types';

export const assetsAdapter = {
  getAssetById(assetId: string): Asset | undefined {
    return mockDb.assets.find((asset) => asset.id === assetId);
  },

  getPanorama(assetId: string): Asset | undefined {
    const asset = this.getAssetById(assetId);
    if (!asset || asset.kind !== 'PANORAMA') {
      return undefined;
    }
    return asset;
  },
};
