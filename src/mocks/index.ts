import { orgs } from './data.orgs';
import { users } from './data.users';
import { projects } from './data.projects';
import { buildings } from './data.buildings';
import { flats } from './data.flats';
import { rooms } from './data.rooms';
import { roomViews } from './data.views';
import { pins } from './data.pins';
import { assets } from './data.assets';

export const mockDb = {
  orgs,
  users,
  projects,
  buildings,
  flats,
  rooms,
  roomViews,
  pins,
  assets,
};

export type MockDb = typeof mockDb;

export type MockDbEntity<K extends keyof MockDb> = MockDb[K][number];
