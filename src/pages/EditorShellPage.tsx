import CameraAltIcon from '@mui/icons-material/CameraAlt';
import ExploreIcon from '@mui/icons-material/Explore';
import RefreshIcon from '@mui/icons-material/Refresh';
import UploadIcon from '@mui/icons-material/Upload';
import {
  Alert,
  Box,
  Button,
  Chip,
  Divider,
  List,
  ListItemButton,
  ListItemText,
  MenuItem,
  Paper,
  Select,
  Stack,
  Typography,
} from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import { formatDistanceToNow } from 'date-fns';
import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '../features/auth/useAuth';
import { ShareSettingsPanel } from '../features/sharing/ShareSettingsPanel';
import { UploadPanoramaDialog } from '../features/uploads/UploadPanoramaDialog';
import { PanoramaViewer, PanoramaViewerHandle } from '../features/viewer360/PanoramaViewer';
import { apiClient } from '../lib/apiClient';
import { Asset, Room, RoomPin, RoomView, YawPitch } from '../lib/types';
import { createWatermarkedSnapshot, triggerDownload } from '../lib/utils/snapshot';
import { formatYawPitch } from '../lib/utils/yawPitch';

const Pane = ({ children, title }: { children: ReactNode; title: string }) => (
  <Paper sx={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }} elevation={0}>
    <Box sx={{ px: 3, py: 2, borderBottom: 1, borderColor: 'divider' }}>
      <Typography variant='subtitle2' color='text.secondary'>
        {title}
      </Typography>
    </Box>
    <Box sx={{ flex: 1, overflow: 'auto', p: 3 }}>{children}</Box>
  </Paper>
);

const EditorShellPage = () => {
  const { projectSlug = '' } = useParams();
  const { org } = useAuth();
  const viewerRef = useRef<PanoramaViewerHandle | null>(null);
  const [selectedBuildingId, setSelectedBuildingId] = useState<string | null>(null);
  const [selectedFlatId, setSelectedFlatId] = useState<string | null>(null);
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null);
  const [selectedViewId, setSelectedViewId] = useState<string | null>(null);
  const [isUploadOpen, setUploadOpen] = useState(false);
  const [orientation, setOrientation] = useState<YawPitch>({ yaw: 0, pitch: 0 });
  const [uploadedAssetsById, setUploadedAssetsById] = useState<Record<string, Asset>>({});
  const [uploadedViewsByRoomId, setUploadedViewsByRoomId] = useState<Record<string, RoomView[]>>({});
  const [blobUrls, setBlobUrls] = useState<string[]>([]);
  useEffect(() => {
    return () => {
      blobUrls.forEach((u) => {
        try {
          if (u.startsWith('blob:')) URL.revokeObjectURL(u);
        } catch { /* ignore revoke failure */ }
      });
    };
  }, [blobUrls]);

  const projectQuery = useQuery({
    queryKey: ['project', projectSlug],
    queryFn: () => apiClient.fetchProjectBySlug(projectSlug),
  });

  const project = projectQuery.data;

  const hierarchyQuery = useQuery({
    queryKey: ['hierarchy', project?.id],
    queryFn: () => (project ? apiClient.fetchProjectHierarchy(project.id) : Promise.resolve(undefined)),
    enabled: Boolean(project?.id),
  });

  const initialSelectionQuery = useQuery({
    queryKey: ['initial-selection', project?.id],
    queryFn: () => (project ? apiClient.fetchInitialSelection(project.id) : Promise.resolve(null)),
    enabled: Boolean(project?.id),
  });

  const sharingQuery = useQuery({
    queryKey: ['sharing', project?.id],
    queryFn: () => (project ? apiClient.fetchSharing(project.id) : Promise.resolve(undefined)),
    enabled: Boolean(project?.id),
  });

  const analyticsQuery = useQuery({
    queryKey: ['analytics', project?.id],
    queryFn: () => (project ? apiClient.fetchAnalytics(project.id) : Promise.resolve(undefined)),
    enabled: Boolean(project?.id),
  });

  useEffect(() => {
    const selection = initialSelectionQuery.data;
    if (!selection) {
      return;
    }
    setSelectedBuildingId(selection.buildingId);
    setSelectedFlatId(selection.flatId);
    setSelectedRoomId(selection.roomId);
    setSelectedViewId(selection.viewId);
  }, [initialSelectionQuery.data]);

  const currentBuilding = useMemo(
    () => hierarchyQuery.data?.buildings.find((item) => item.id === selectedBuildingId) ?? null,
    [hierarchyQuery.data?.buildings, selectedBuildingId],
  );

  const currentFlat = useMemo(
    () => currentBuilding?.flats.find((flat) => flat.id === selectedFlatId) ?? null,
    [currentBuilding?.flats, selectedFlatId],
  );

  const currentRoom: (Room & { views: RoomView[] }) | null = useMemo(
    () => (currentFlat?.rooms.find((room) => room.id === selectedRoomId) as Room & { views: RoomView[] }) ?? null,
    [currentFlat?.rooms, selectedRoomId],
  );

  const roomViews = useMemo(() => {
    const base = currentRoom?.views ?? [];
    const added = (currentRoom?.id && uploadedViewsByRoomId[currentRoom.id]) ? uploadedViewsByRoomId[currentRoom.id] : [];
    return [...base, ...added];
  }, [currentRoom?.id, currentRoom?.views, uploadedViewsByRoomId]);

  const currentView = useMemo(() => roomViews.find((view) => view.id === selectedViewId) ?? null, [roomViews, selectedViewId]);

  const pinsQuery = useQuery({
    queryKey: ['pins', selectedViewId],
    queryFn: () => (selectedViewId ? apiClient.fetchPinsForView(selectedViewId) : Promise.resolve<RoomPin[]>([])),
    enabled: Boolean(selectedViewId),
  });

  const panoramaAssetQuery = useQuery({
    queryKey: ['asset', currentView?.panoramaAssetId],
    queryFn: () => (currentView ? apiClient.fetchPanoramaAsset(currentView.panoramaAssetId) : Promise.resolve(undefined)),
    enabled: Boolean(currentView?.panoramaAssetId),
  });

  const uploadedAsset = currentView ? uploadedAssetsById[currentView.panoramaAssetId] : undefined;
  const panoramaUrl = uploadedAsset?.url ?? panoramaAssetQuery.data?.url;

  useEffect(() => {
    if (!currentView && currentRoom?.views?.length) {
      setSelectedViewId(currentRoom.views[0].id);
    }
  }, [currentRoom, currentView]);

  const handlePinNavigate = (pin: RoomPin) => {
    const hierarchy = hierarchyQuery.data;
    if (!hierarchy) return;

    const targetBuilding = hierarchy.buildings.find((building) =>
      building.flats.some((flat) => flat.rooms.some((room) => room.id === pin.targetRoomId)),
    );
    if (!targetBuilding) return;

    const targetFlat = targetBuilding.flats.find((flat) => flat.rooms.some((room) => room.id === pin.targetRoomId));
    const targetRoom = targetFlat?.rooms.find((room) => room.id === pin.targetRoomId) as
      | (Room & { views: RoomView[] })
      | undefined;

    if (!targetFlat || !targetRoom) return;

    setSelectedBuildingId(targetBuilding.id);
    setSelectedFlatId(targetFlat.id);
    setSelectedRoomId(targetRoom.id);
    setSelectedViewId(pin.targetViewId ?? targetRoom.views[0]?.id ?? null);
  };

  const handleSnapshot = async () => {
    if (!project) return;
    const canvas = viewerRef.current?.captureSnapshot();
    if (!canvas) return;
    const watermark = `${org?.name ?? 'Demo Interiors'} – ${project.name}`;
    const dataUrl = await createWatermarkedSnapshot(canvas, { watermark, strategy: 'BOTTOM_RIGHT' });
    triggerDownload(dataUrl, `${project.slug}-snapshot.png`);
    await apiClient.recordSnapshot(project.id);
    void analyticsQuery.refetch();
  };

  if (projectQuery.isError) {
    return <Alert severity='error'>Failed to load project. Please refresh the page.</Alert>;
  }

  if (!project && projectQuery.isLoading) {
    return <Typography>Loading project...</Typography>;
  }

  if (!project) {
    return <Alert severity='warning'>Project not found. Try another link from the dashboard.</Alert>;
  }

  const hierarchy = hierarchyQuery.data;

  return (
    <Stack spacing={3} sx={{ height: 'calc(100vh - 120px)' }}>
      <Stack direction='row' justifyContent='space-between' alignItems='center'>
        <Stack spacing={0.5}>
          <Typography variant='h4'>{project.name}</Typography>
          <Stack direction='row' spacing={1} alignItems='center'>
            <Chip size='small' label={project.visibility} />
            {project.portfolio && <Chip size='small' color='primary' label='Portfolio' />}
            <Typography variant='caption' color='text.secondary'>
              Updated {formatDistanceToNow(new Date(project.updatedAt), { addSuffix: true })}
            </Typography>
          </Stack>
        </Stack>
        <Stack direction='row' spacing={2}>
          <Button variant='outlined' startIcon={<UploadIcon />} onClick={() => setUploadOpen(true)}>
            Upload Panorama
          </Button>
          <Button variant='contained' startIcon={<CameraAltIcon />} onClick={handleSnapshot}>
            Snapshot
          </Button>
        </Stack>
      </Stack>
      <Box
        sx={{
          display: 'grid',
          gap: 3,
          gridTemplateColumns: {
            xs: '1fr',
            lg: 'minmax(260px, 320px) minmax(0, 1fr) minmax(260px, 320px)',
          },
          alignItems: 'stretch',
        }}
      >
        <Pane title='Hierarchy'>
          {hierarchy && hierarchy.buildings.length > 0 ? (
            <Stack spacing={2}>
              {hierarchy.buildings.map((building) => (
                <Box key={building.id}>
                  <Typography variant='subtitle2' sx={{ mb: 1 }}>
                    {building.name}
                  </Typography>
                  {building.flats.map((flat) => (
                    <Box key={flat.id} sx={{ pl: 1, mb: 2 }}>
                      <Typography variant='body2' color='text.secondary' sx={{ mb: 0.5 }}>
                        {flat.name}
                      </Typography>
                      <List dense disablePadding>
                        {flat.rooms.map((room) => (
                          <ListItemButton
                            key={room.id}
                            selected={room.id === selectedRoomId}
                            onClick={() => {
                              setSelectedBuildingId(building.id);
                              setSelectedFlatId(flat.id);
                              setSelectedRoomId(room.id);
                              setSelectedViewId(room.viewIds[0] ?? null);
                            }}
                          >
                            <ListItemText primary={room.name} secondary={`${room.viewIds.length} view(s)`} />
                          </ListItemButton>
                        ))}
                      </List>
                    </Box>
                  ))}
                </Box>
              ))}
            </Stack>
          ) : (
            <Typography variant='body2' color='text.secondary'>
              No hierarchy data available.
            </Typography>
          )}
        </Pane>
        <Pane title='Panorama Viewer'>
          {currentView && panoramaUrl ? (
            <Stack spacing={2} sx={{ height: '100%' }}>
              <Stack direction='row' spacing={2} alignItems='center'>
                <Typography variant='subtitle1'>{currentRoom?.name}</Typography>
                <Select size='small' value={selectedViewId ?? ''} onChange={(event) => setSelectedViewId(event.target.value)}>
                  {roomViews.map((viewOption) => (
                    <MenuItem value={viewOption.id} key={viewOption.id}>
                      {viewOption.name}
                    </MenuItem>
                  ))}
                </Select>
                <Chip icon={<ExploreIcon />} label={formatYawPitch(orientation)} />
                <Button
                  size='small'
                  variant='text'
                  startIcon={<RefreshIcon />}
                  onClick={() => viewerRef.current?.resetOrientation()}
                >
                  Reset View
                </Button>
              </Stack>
              <Box sx={{ flex: 1, minHeight: 0 }}>
                <PanoramaViewer
                  ref={viewerRef}
                  view={currentView}
                  panoramaUrl={panoramaUrl}
                  pins={pinsQuery.data ?? []}
                  onPinClick={handlePinNavigate}
                  onPositionChange={setOrientation}
                />
              </Box>
            </Stack>
          ) : (
            <Typography variant='body2' color='text.secondary'>
              {currentRoom ? 'Loading panorama asset.' : 'Select a room to start exploring its panoramas.'}
            </Typography>
          )}
        </Pane>
        <Pane title='Details'>
          {currentRoom ? (
            <Stack spacing={3}>
              <Stack spacing={1}>
                <Typography variant='subtitle1'>{currentRoom.name}</Typography>
                {currentRoom.description && (
                  <Typography variant='body2' color='text.secondary'>
                    {currentRoom.description}
                  </Typography>
                )}
              </Stack>
              <Divider />
              <Stack spacing={1}>
                <Typography variant='subtitle2'>Pins</Typography>
                <Stack spacing={1}>
                  {(pinsQuery.data ?? []).map((pin) => (
                    <Button key={pin.id} variant='outlined' size='small' onClick={() => handlePinNavigate(pin)}>
                      {pin.label}
                    </Button>
                  ))}
                  {pinsQuery.data?.length === 0 && (
                    <Typography variant='body2' color='text.secondary'>
                      No pins yet for this view.
                    </Typography>
                  )}
                </Stack>
              </Stack>
              <Divider />
              {sharingQuery.data && project && (
                <ShareSettingsPanel
                  project={project}
                  share={sharingQuery.data}
                  onChange={async (payload) => {
                    await apiClient.updateSharing(project.id, payload);
                    void sharingQuery.refetch();
                  }}
                />
              )}
              <Divider />
              {analyticsQuery.data && (
                <Stack spacing={1}>
                  <Typography variant='subtitle2'>Activity</Typography>
                  <Typography variant='body2' color='text.secondary'>
                    Total views: {analyticsQuery.data.totalViews}
                  </Typography>
                  <Typography variant='body2' color='text.secondary'>
                    Snapshots: {analyticsQuery.data.snapshotsDownloaded}
                  </Typography>
                  <Typography variant='caption' color='text.secondary'>
                    Last viewed {formatDistanceToNow(new Date(analyticsQuery.data.lastViewedAt), { addSuffix: true })}
                  </Typography>
                </Stack>
              )}
            </Stack>
          ) : (
            <Typography variant='body2' color='text.secondary'>
              Select a room from the hierarchy to inspect details and pins.
            </Typography>
          )}
        </Pane>
      </Box>
      <UploadPanoramaDialog
        open={isUploadOpen}
        onClose={() => setUploadOpen(false)}
        room={currentRoom ?? undefined}
        onUploaded={({ asset, view }) => {
          setUploadedAssetsById((prev) => ({ ...prev, [asset.id]: asset }));
          if (asset.url?.startsWith("blob:")) setBlobUrls((prev) => [...prev, asset.url]);
          if (view) {
            setUploadedViewsByRoomId((prev) => ({
              ...prev,
              [view.roomId]: [...(prev[view.roomId] ?? []), view],
            }));
            setSelectedRoomId(view.roomId);
            setSelectedViewId(view.id);
            viewerRef.current?.loadPanorama(asset.url, { yaw: view.defaultYaw, pitch: view.defaultPitch });
          } else {
            viewerRef.current?.loadPanorama(asset.url);
          }
        }}
      />
    </Stack>
  );
};

export default EditorShellPage;







