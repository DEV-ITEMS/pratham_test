import { clampPitch, degToRad, formatYawPitch, fromSphericalPosition, normalizeYaw, radToDeg, toSphericalPosition } from '../../lib/utils/yawPitch';

describe('yawPitch utils', () => {
  it('converts degrees to radians and back', () => {
    const degrees = 180;
    const radians = degToRad(degrees);
    expect(Math.round(radians * 100) / 100).toBeCloseTo(Math.PI, 2);
    expect(radToDeg(radians)).toBe(degrees);
  });

  it('normalises yaw within -180 to 180 range', () => {
    expect(normalizeYaw(270)).toBe(-90);
    expect(normalizeYaw(-540)).toBe(-180);
    expect(normalizeYaw(45)).toBe(45);
  });

  it('clamps pitch between -90 and 90', () => {
    expect(clampPitch(120)).toBe(90);
    expect(clampPitch(-120)).toBe(-90);
    expect(clampPitch(45)).toBe(45);
  });

  it('converts yaw/pitch to spherical position and back', () => {
    const orientation = { yaw: 135, pitch: -12 };
    const spherical = toSphericalPosition(orientation);
    const restored = fromSphericalPosition(spherical);
    expect(restored.yaw).toBeCloseTo(orientation.yaw, 5);
    expect(restored.pitch).toBeCloseTo(orientation.pitch, 5);
  });

  it('formats yaw/pitch label', () => {
    expect(formatYawPitch({ yaw: 45.234, pitch: -12.345 })).toBe('45.2°, -12.3°');
  });
});
