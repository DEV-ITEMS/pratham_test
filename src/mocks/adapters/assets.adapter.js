import { mockDb } from '../index';

export const assetsAdapter = {
  getAssetById(assetId) {
    return mockDb.assets.find((asset) => asset.id === assetId);
  },

  getPanorama(assetId) {
    const asset = this.getAssetById(assetId);
    if (!asset || asset.kind !== 'PANORAMA') {
      return undefined;
    }
    return asset;
  },
};

