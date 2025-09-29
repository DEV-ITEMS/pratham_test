import { RoomPin } from '../lib/types';

export const pins: RoomPin[] = [
  {
    id: 'pin-living-to-bedroom',
    fromViewId: 'view-living-day',
    label: 'Go to Bedroom',
    targetRoomId: 'room-bedroom',
    targetViewId: 'view-bedroom-night',
    yaw: 45,
    pitch: -5,
  },
  {
    id: 'pin-living-to-kitchen',
    fromViewId: 'view-living-day',
    label: 'Kitchen',
    targetRoomId: 'room-kitchen',
    targetViewId: 'view-kitchen-service',
    yaw: -160,
    pitch: -3,
  },
  {
    id: 'pin-bedroom-to-living',
    fromViewId: 'view-bedroom-night',
    label: 'Back to Living',
    targetRoomId: 'room-living',
    targetViewId: 'view-living-dusk',
    yaw: -90,
    pitch: 0,
  },
  {
    id: 'pin-kitchen-to-living',
    fromViewId: 'view-kitchen-service',
    label: 'Living Room',
    targetRoomId: 'room-living',
    targetViewId: 'view-living-day',
    yaw: 140,
    pitch: -10,
  },
  {
    id: 'pin-living-dusk-to-bedroom',
    fromViewId: 'view-living-dusk',
    label: 'Bedroom',
    targetRoomId: 'room-bedroom',
    targetViewId: 'view-bedroom-night',
    yaw: 80,
    pitch: -4,
  },
];
