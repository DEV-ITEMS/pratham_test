import { useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../apiClient';

export const useSceneNavigator = (projectId) => {
  const hierarchyQuery = useQuery({
    queryKey: ['scene-hierarchy', projectId],
    queryFn: () => (projectId ? apiClient.fetchProjectHierarchy(projectId) : Promise.resolve(undefined)),
    enabled: Boolean(projectId),
  });

  const rooms = useMemo(() => {
    const hierarchy = hierarchyQuery.data;
    if (!hierarchy) return [];
    return hierarchy.buildings.flatMap((building) =>
      building.flats.flatMap((flat) =>
        flat.rooms.map((room) => ({
          ...room,
          building,
          flat,
        })),
      ),
    );
  }, [hierarchyQuery.data]);

  const [selectedRoomId, setSelectedRoomId] = useState(null);
  const [selectedViewId, setSelectedViewId] = useState(null);

  useEffect(() => {
    if (rooms.length === 0) return;
    const defaultRoom = rooms[0];
    setSelectedRoomId((prev) => prev ?? defaultRoom.id);
    setSelectedViewId((prev) => prev ?? defaultRoom.views[0]?.id ?? null);
  }, [rooms]);

  const selectedRoom = rooms.find((room) => room.id === selectedRoomId) ?? rooms[0] ?? null;
  const selectedView = selectedRoom?.views.find((view) => view.id === selectedViewId) ?? selectedRoom?.views[0] ?? null;

  useEffect(() => {
    if (!selectedRoom) return;
    if (!selectedRoom.views.some((view) => view.id === selectedViewId)) {
      setSelectedViewId(selectedRoom.views[0]?.id ?? null);
    }
  }, [selectedRoom, selectedViewId]);

  const selectRoom = (roomId) => {
    setSelectedRoomId(roomId);
    const room = rooms.find((item) => item.id === roomId);
    setSelectedViewId(room?.views[0]?.id ?? null);
  };

  const selectView = (viewId) => setSelectedViewId(viewId);

  const pinsQuery = useQuery({
    queryKey: ['scene-pins', selectedView?.id],
    queryFn: () => (selectedView ? apiClient.fetchPinsForView(selectedView.id) : Promise.resolve([])),
    enabled: Boolean(selectedView?.id),
  });

  const assetQuery = useQuery({
    queryKey: ['scene-asset', selectedView?.panoramaAssetId],
    queryFn: () => (selectedView ? apiClient.fetchPanoramaAsset(selectedView.panoramaAssetId) : Promise.resolve(undefined)),
    enabled: Boolean(selectedView?.panoramaAssetId),
  });

  return {
    rooms,
    selectedRoom,
    selectedView,
    selectRoom,
    selectView,
    pins: pinsQuery.data ?? [],
    pinsLoading: pinsQuery.isLoading,
    asset: assetQuery.data,
    assetLoading: assetQuery.isLoading,
    hierarchyLoading: hierarchyQuery.isLoading,
    hierarchy: hierarchyQuery.data,
  };
};
