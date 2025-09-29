const DEFAULT_FONT = '500 36px "Segoe UI", sans-serif';

export const createWatermarkedSnapshot = async (canvas, options) => {
  const snapshotCanvas = document.createElement('canvas');
  snapshotCanvas.width = canvas.width;
  snapshotCanvas.height = canvas.height;
  const context = snapshotCanvas.getContext('2d');
  if (!context) {
    throw new Error('Unable to capture snapshot context');
  }

  context.drawImage(canvas, 0, 0);

  const padding = Math.max(Math.round(canvas.width * 0.02), 24);
  context.font = DEFAULT_FONT;
  context.fillStyle = 'rgba(33, 33, 33, 0.35)';
  context.textBaseline = 'bottom';

  const { watermark, strategy = 'BOTTOM_RIGHT' } = options;
  const textWidth = context.measureText(watermark).width;
  const textHeight = 36;

  const positions = {
    BOTTOM_RIGHT: {
      x: snapshotCanvas.width - padding - textWidth,
      y: snapshotCanvas.height - padding,
    },
    BOTTOM_LEFT: {
      x: padding,
      y: snapshotCanvas.height - padding,
    },
  };

  const coords = positions[strategy];
  context.fillRect(
    coords.x - padding * 0.25,
    coords.y - textHeight - padding * 0.15,
    textWidth + padding * 0.5,
    textHeight + padding * 0.55,
  );

  context.fillStyle = 'rgba(255, 255, 255, 0.92)';
  context.fillText(watermark, coords.x, coords.y);

  return snapshotCanvas.toDataURL('image/png');
};

export const triggerDownload = (dataUrl, filename) => {
  const link = document.createElement('a');
  link.href = dataUrl;
  link.download = filename;
  link.style.display = 'none';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

