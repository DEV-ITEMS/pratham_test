import { mockDb } from '../index';
import {
  Building,
  Flat,
  HierarchyNode,
  Project,
  Room,
  RoomPin,
  RoomView,
} from '../../lib/types';

export interface ProjectHierarchy {
  project: Project;
  buildings: Array<Building & {
    flats: Array<Flat & {
      rooms: Array<Room & {
        views: RoomView[];
        pins: RoomPin[];
      }>;
    }>;
  }>;
}

export const hierarchyAdapter = {
  getBuildingsByProject(projectId: string): Building[] {
    return mockDb.buildings.filter((building) => building.projectId === projectId);
  },

  getFlatsByBuilding(buildingId: string): Flat[] {
    return mockDb.flats.filter((flat) => flat.buildingId === buildingId);
  },

  getRoomsByFlat(flatId: string): Room[] {
    return mockDb.rooms.filter((room) => room.flatId === flatId);
  },

  getViewsByRoom(roomId: string): RoomView[] {
    return mockDb.roomViews.filter((view) => view.roomId === roomId);
  },

  getPinsByView(viewId: string): RoomPin[] {
    return mockDb.pins.filter((pin) => pin.fromViewId === viewId);
  },

  buildHierarchy(projectId: string): ProjectHierarchy | undefined {
    const project = mockDb.projects.find((item) => item.id === projectId);
    if (!project) {
      return undefined;
    }

    const buildings = this.getBuildingsByProject(projectId).map((building) => ({
      ...building,
      flats: this.getFlatsByBuilding(building.id).map((flat) => ({
        ...flat,
        rooms: this.getRoomsByFlat(flat.id).map((room) => ({
          ...room,
          views: this.getViewsByRoom(room.id),
          pins: room.viewIds.flatMap((viewId) => this.getPinsByView(viewId)),
        })),
      })),
    }));

    return { project, buildings };
  },

  getHierarchyTree(projectId: string): HierarchyNode<Project | Building | Flat | Room>[] {
    const hierarchy = this.buildHierarchy(projectId);
    if (!hierarchy) {
      return [];
    }

    return hierarchy.buildings.map((building) => ({
      id: building.id,
      name: building.name,
      data: building,
      children: building.flats.map((flat) => ({
        id: flat.id,
        name: flat.name,
        data: flat,
        children: flat.rooms.map((room) => ({
          id: room.id,
          name: room.name,
          data: room,
        })),
      })),
    }));
  },

  getInitialSelection(projectId: string): {
    buildingId: string | null;
    flatId: string | null;
    roomId: string | null;
    viewId: string | null;
  } {
    const hierarchy = this.buildHierarchy(projectId);
    const firstBuilding = hierarchy?.buildings[0];
    const firstFlat = firstBuilding?.flats[0];
    const firstRoom = firstFlat?.rooms[0];
    const firstView = firstRoom?.views[0];

    return {
      buildingId: firstBuilding?.id ?? null,
      flatId: firstFlat?.id ?? null,
      roomId: firstRoom?.id ?? null,
      viewId: firstView?.id ?? null,
    };
  },
};
