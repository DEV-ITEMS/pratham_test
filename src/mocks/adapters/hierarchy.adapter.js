import { mockDb } from '../index';

export const hierarchyAdapter = {
  getBuildingsByProject(projectId) {
    return mockDb.buildings.filter((building) => building.projectId === projectId);
  },

  getFlatsByBuilding(buildingId) {
    return mockDb.flats.filter((flat) => flat.buildingId === buildingId);
  },

  getRoomsByFlat(flatId) {
    return mockDb.rooms.filter((room) => room.flatId === flatId);
  },

  getViewsByRoom(roomId) {
    return mockDb.roomViews.filter((view) => view.roomId === roomId);
  },

  getPinsByView(viewId) {
    return mockDb.pins.filter((pin) => pin.fromViewId === viewId);
  },

  buildHierarchy(projectId) {
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

  getHierarchyTree(projectId) {
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

  getInitialSelection(projectId) {
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

