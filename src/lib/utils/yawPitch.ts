import { Position } from 'photo-sphere-viewer';
import { YawPitch } from '../types';

export const degToRad = (value: number): number => (value * Math.PI) / 180;

export const radToDeg = (value: number): number => (value * 180) / Math.PI;

export const normalizeYaw = (value: number): number => {
  let yaw = value % 360;
  if (yaw < -180) {
    yaw += 360;
  }
  if (yaw > 180) {
    yaw -= 360;
  }
  return yaw;
};

export const clampPitch = (value: number): number => {
  if (value > 90) return 90;
  if (value < -90) return -90;
  return value;
};

export const toSphericalPosition = (orientation: YawPitch): Position => ({
  longitude: degToRad(normalizeYaw(orientation.yaw)),
  latitude: degToRad(clampPitch(orientation.pitch)),
});

export const fromSphericalPosition = (position: Position): YawPitch => ({
  yaw: normalizeYaw(radToDeg(position.longitude)),
  pitch: clampPitch(radToDeg(position.latitude)),
});

export const formatYawPitch = (orientation: YawPitch): string => {
  const roundedYaw = Math.round(normalizeYaw(orientation.yaw) * 10) / 10;
  const roundedPitch = Math.round(clampPitch(orientation.pitch) * 10) / 10;
  return `${roundedYaw.toFixed(1)}°, ${roundedPitch.toFixed(1)}°`;
};
