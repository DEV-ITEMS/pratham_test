export const degToRad = (value) => (value * Math.PI) / 180;

export const radToDeg = (value) => (value * 180) / Math.PI;

export const normalizeYaw = (value) => {
  let yaw = value % 360;
  if (yaw < -180) {
    yaw += 360;
  }
  if (yaw > 180) {
    yaw -= 360;
  }
  return yaw;
};

export const clampPitch = (value) => {
  if (value > 90) return 90;
  if (value < -90) return -90;
  return value;
};

export const toSphericalPosition = (orientation) => ({
  longitude: degToRad(normalizeYaw(orientation.yaw)),
  latitude: degToRad(clampPitch(orientation.pitch)),
});

export const fromSphericalPosition = (position) => ({
  yaw: normalizeYaw(radToDeg(position.longitude)),
  pitch: clampPitch(radToDeg(position.latitude)),
});

export const formatYawPitch = (orientation) => {
  const roundedYaw = Math.round(normalizeYaw(orientation.yaw) * 10) / 10;
  const roundedPitch = Math.round(clampPitch(orientation.pitch) * 10) / 10;
  return `${roundedYaw.toFixed(1)}°, ${roundedPitch.toFixed(1)}°`;
};

