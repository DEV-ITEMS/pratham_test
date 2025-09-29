import { createWatermarkedSnapshot } from '../../lib/utils/snapshot';

describe('snapshot utility', () => {
  it('creates a watermarked image data URL', async () => {
    const canvas = document.createElement('canvas');
    canvas.width = 400;
    canvas.height = 200;
    const context = canvas.getContext('2d');
    expect(context).not.toBeNull();
    if (!context) throw new Error('Canvas 2D context not available');
    context.fillStyle = '#1976d2';
    context.fillRect(0, 0, canvas.width, canvas.height);

    const dataUrl = await createWatermarkedSnapshot(canvas, {
      watermark: 'Demo Interiors - Modern Flat Tour',
    });

    expect(dataUrl.startsWith('data:image/png;base64,')).toBe(true);
  });
});

