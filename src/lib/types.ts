import { ReactNode } from 'react';

export type Visibility = 'PUBLIC' | 'PRIVATE' | 'INVITE_ONLY';

export type Role = 'ADMIN' | 'EDITOR' | 'VIEWER';

export interface Org {
  id: string;
  name: string;
  slug: string;
  logoUrl: string;
  primaryColor: string;
  seatLimit: number;
}

export interface User {
  id: string;
  orgId: string;
  name: string;
  email: string;
  role: Role;
  avatarUrl?: string;
}

export interface Project {
  id: string;
  orgId: string;
  name: string;
  slug: string;
  visibility: Visibility;
  portfolio: boolean;
  description: string;
  updatedAt: string;
  heroImageAssetId?: string;
  buildingIds: string[];
  tags: string[];
}

export interface Building {
  id: string;
  projectId: string;
  name: string;
  address?: string;
  flatIds: string[];
}

export interface Flat {
  id: string;
  buildingId: string;
  name: string;
  level: number;
  roomIds: string[];
}

export interface Room {
  id: string;
  flatId: string;
  name: string;
  description?: string;
  viewIds: string[];
}

export type AssetKind = 'PANORAMA' | 'IMAGE' | 'THUMBNAIL' | 'LOGO';

export interface Asset {
  id: string;
  kind: AssetKind;
  url: string;
  width: number;
  height: number;
  altText?: string;
}

export interface RoomView {
  id: string;
  roomId: string;
  name: string;
  panoramaAssetId: string;
  description?: string;
  defaultYaw: number;
  defaultPitch: number;
  compass?: number;
  createdAt: string;
}

export interface RoomPin {
  id: string;
  fromViewId: string;
  label: string;
  targetRoomId: string;
  targetViewId?: string;
  yaw: number;
  pitch: number;
}

export type ShareRestriction = 'PUBLIC' | 'PRIVATE' | 'INVITE_ONLY';

export interface ProjectSharing {
  projectId: string;
  restriction: ShareRestriction;
  invitees: string[];
  passwordProtected?: boolean;
}

export interface HierarchyNode<T> {
  id: string;
  name: string;
  data: T;
  children?: Array<HierarchyNode<unknown>>;
}

export interface SeatUsage {
  used: number;
  available: number;
}

export type WatermarkStrategy = 'BOTTOM_RIGHT' | 'BOTTOM_LEFT';

export interface UploadResult {
  asset: Asset;
  view?: RoomView;
}

export interface AppRouteMeta {
  label: string;
  path: string;
  icon: ReactNode;
}

export interface YawPitch {
  yaw: number;
  pitch: number;
}

export interface PanoramaSnapshotOptions {
  watermark: string;
  strategy?: WatermarkStrategy;
}

