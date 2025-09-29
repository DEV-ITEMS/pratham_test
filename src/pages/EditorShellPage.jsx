import CameraAltIcon from '@mui/icons-material/CameraAlt';
import ExploreIcon from '@mui/icons-material/Explore';
import RefreshIcon from '@mui/icons-material/Refresh';
import UploadIcon from '@mui/icons-material/Upload';
import {
  Alert,
  Box,
  Button,
  Chip,
  Breadcrumbs,
  Link as MUILink,
  Divider,
  List,
  ListItemButton,
  ListItemText,
  MenuItem,
  Paper,
  Select,
  Stack,
  Skeleton,
  Typography,
  Snackbar,
  CircularProgress,
} from '@mui/material';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { formatDistanceToNow } from 'date-fns';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '../features/auth/useAuth';
import { ShareSettingsPanel } from '../features/sharing/ShareSettingsPanel';
import { ShareDialog } from '../features/sharing/ShareDialog';
import { UploadPanoramaDialog } from '../features/uploads/UploadPanoramaDialog';
import { PanoramaViewer } from '../features/viewer360/PanoramaViewer';
import { ViewThumbnails } from '../features/viewer360/ViewThumbnails';
import { apiClient } from '../lib/apiClient';
import { createWatermarkedSnapshot, triggerDownload } from '../lib/utils/snapshot';
import { formatYawPitch } from '../lib/utils/yawPitch';
import { ConfirmDialog } from '../components/ConfirmDialog';

const Pane = ({ children, title }) => (
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
  const viewerRef = useRef(null);
  const [selectedBuildingId, setSelectedBuildingId] = useState(null);
  const [selectedFlatId, setSelectedFlatId] = useState(null);
  const [selectedRoomId, setSelectedRoomId] = useState(null);
  const [selectedViewId, setSelectedViewId] = useState(null);
  const [isUploadOpen, setUploadOpen] = useState(false);
  const [orientation, setOrientation] = useState({ yaw: 0, pitch: 0 });
  const [uploadedAssetsById, setUploadedAssetsById] = useState({});
  const [uploadedViewsByRoomId, setUploadedViewsByRoomId] = useState({});
  const [blobUrls, setBlobUrls] = useState([]);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', action: null });
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [deletedRoomIds, setDeletedRoomIds] = useState([]);
  const [snapshotting, setSnapshotting] = useState(false);
  useEffect(() => {
    return () => {
      blobUrls.forEach((u) => {
        try {
          if (u.startsWith('blob:')) URL.revokeObjectURL(u);
        } catch {
          /* ignore revoke failure */
        }
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

  const filteredBuildings = useMemo(() => {
    const data = hierarchyQuery.data;
    if (!data) return [];
    return data.buildings.map((b) => ({
      ...b,
      flats: b.flats.map((f) => ({
        ...f,
        rooms: f.rooms.filter((r) => !deletedRoomIds.includes(r.id)),
      })),
    }));
  }, [hierarchyQuery.data, deletedRoomIds]);

  const currentBuilding = useMemo(
    () => filteredBuildings.find((item) => item.id === selectedBuildingId) ?? null,
    [filteredBuildings, selectedBuildingId],
  );

  const currentFlat = useMemo(
    () => currentBuilding?.flats.find((flat) => flat.id === selectedFlatId) ?? null,
    [currentBuilding?.flats, selectedFlatId],
  );

  const currentRoom = useMemo(
    () => currentFlat?.rooms.find((room) => room.id === selectedRoomId) ?? null,
    [currentFlat?.rooms, selectedRoomId],
  );

  const roomViews = useMemo(() => {
    const base = currentRoom?.views ?? [];
    const added = currentRoom?.id && uploadedViewsByRoomId[currentRoom.id] ? uploadedViewsByRoomId[currentRoom.id] : [];
    return [...base, ...added];
  }, [currentRoom?.id, currentRoom?.views, uploadedViewsByRoomId]);

  const currentView = useMemo(() => roomViews.find((view) => view.id === selectedViewId) ?? null, [roomViews, selectedViewId]);

  const pinsQuery = useQuery({
    queryKey: ['pins', selectedViewId],
    queryFn: () => (selectedViewId ? apiClient.fetchPinsForView(selectedViewId) : Promise.resolve([])),
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

  const handlePinNavigate = (pin) => {
    const hierarchy = hierarchyQuery.data;
    if (!hierarchy) return;

    const targetBuilding = hierarchy.buildings.find((building) =>
      building.flats.some((flat) => flat.rooms.some((room) => room.id === pin.targetRoomId)),
    );
    if (!targetBuilding) return;

    const targetFlat = targetBuilding.flats.find((flat) => flat.rooms.some((room) => room.id === pin.targetRoomId));
    const targetRoom = targetFlat?.rooms.find((room) => room.id === pin.targetRoomId);

    if (!targetFlat || !targetRoom) return;

    setSelectedBuildingId(targetBuilding.id);
    setSelectedFlatId(targetFlat.id);
    setSelectedRoomId(targetRoom.id);
    setSelectedViewId(pin.targetViewId ?? targetRoom.views[0]?.id ?? null);
  };

  const handleSnapshot = async () => {
    if (!project) return;
    setSnapshotting(true);
    const canvas = viewerRef.current?.captureSnapshot();
    if (!canvas) return;
    const watermark = `${org?.name ?? 'Demo Interiors'} - ${project.name}`;
    const dataUrl = await createWatermarkedSnapshot(canvas, { watermark, strategy: 'BOTTOM_RIGHT' });
    triggerDownload(dataUrl, `${project.slug}-snapshot.png`);
    await apiClient.recordSnapshot(project.id);
    void analyticsQuery.refetch();
    setSnackbar({ open: true, message: 'Snapshot saved to your device', action: null });
    setSnapshotting(false);
  };

  if (projectQuery.isError) {
    return <Alert severity='error'>Failed to load project. Please refresh the page.</Alert>;
  }

  if (!project && projectQuery.isLoading) {
    return (
      <Stack spacing={2}>
        <Skeleton variant='text' width={280} height={40} />
        <Skeleton variant='rounded' height={320} />
      </Stack>
    );
  }

  if (!project) {
    return <Alert severity='warning'>Project not found. Try another link from the dashboard.</Alert>;
  }

  const hierarchy = hierarchyQuery.data ? { buildings: filteredBuildings } : undefined;

  return (
    <Stack spacing={3} sx={{ height: 'calc(100vh - 120px)' }}>
      <Breadcrumbs separator={<NavigateNextIcon fontSize='small' />} aria-label='Hierarchy breadcrumbs'>
        <MUILink component={Link} underline='hover' color='inherit' to={`/editor/${project.slug}`}>
          {project.name}
        </MUILink>
        {currentBuilding && <Typography color='text.primary'>{currentBuilding.name}</Typography>}
        {currentFlat && <Typography color='text.primary'>{currentFlat.name}</Typography>}
        {currentRoom && <Typography color='text.primary'>{currentRoom.name}</Typography>}
        {currentView && <Typography color='text.primary'>{currentView.name}</Typography>}
      </Breadcrumbs>
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
          {sharingQuery.data && project && (
            <ShareDialog
              project={project}
              share={sharingQuery.data}
              onChange={async (payload) => {
                const prev = sharingQuery.data;
                await apiClient.updateSharing(project.id, payload);
                void sharingQuery.refetch();
                setSnackbar({
                  open: true,
                  message: 'Sharing settings updated',
                  action: (
                    <Button
                      color='inherit'
                      size='small'
                      onClick={async () => {
                        await apiClient.updateSharing(project.id, { restriction: prev.restriction });
                        void sharingQuery.refetch();
                        setSnackbar({ open: true, message: 'Reverted sharing change', action: null });
                      }}
                    >
                      Undo
                    </Button>
                  ),
                });
              }}
            />
          )}
          <Button variant='outlined' startIcon={<UploadIcon />} onClick={() => setUploadOpen(true)}>
            Upload Panorama
          </Button>
          <Button
            variant='contained'
            startIcon={snapshotting ? <CircularProgress size={18} /> : <CameraAltIcon />}
            onClick={handleSnapshot}
            disabled={snapshotting}
          >
            {snapshotting ? 'Saving...' : 'Snapshot'}
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
          {hierarchy ? (
            <Stack spacing={2}>
              {hierarchy.buildings.map((building) => (
                <Stack key={building.id} spacing={1}>
                  <Typography variant='subtitle1'>{building.name}</Typography>
                  <List>
                    {building.flats.map((flat) => (
                      <ListItemButton
                        key={flat.id}
                        selected={flat.id === selectedFlatId}
                        onClick={() => {
                          setSelectedBuildingId(building.id);
                          setSelectedFlatId(flat.id);
                          const firstRoom = flat.rooms[0];
                          setSelectedRoomId(firstRoom?.id ?? null);
                          setSelectedViewId(firstRoom?.views[0]?.id ?? null);
                        }}
                      >
                        <ListItemText
                          primary={flat.name}
                          secondary={`${flat.rooms.length} room${flat.rooms.length !== 1 ? 's' : ''}`}
                        />
                      </ListItemButton>
                    ))}
                  </List>
                </Stack>
              ))}
            </Stack>
          ) : (
            <Stack spacing={2}>
              <Skeleton variant='text' width={160} />
              <Stack spacing={1}>
                {Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} variant='rounded' height={36} />
                ))}
              </Stack>
            </Stack>
          )}
        </Pane>
        <Pane title='Viewer'>
          {currentView && panoramaUrl ? (
            <Stack spacing={2} sx={{ height: '100%' }}>
              <Stack direction='row' spacing={1} alignItems='center'>
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
              <ViewThumbnails
                views={roomViews}
                selectedViewId={selectedViewId}
                onSelect={(id) => setSelectedViewId(id)}
              />
            </Stack>
          ) : (
            <Stack spacing={1}>
              <Skeleton variant='rounded' height={220} />
              <Typography variant='body2' color='text.secondary'>
                {currentRoom ? 'Loading panorama asset.' : 'Select a room to start exploring its panoramas.'}
              </Typography>
            </Stack>
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
              <Button
                variant='outlined'
                color='error'
                onClick={() => setConfirmDeleteOpen(true)}
                sx={{ alignSelf: 'flex-start' }}
              >
                Delete Room
              </Button>
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
                    const prev = sharingQuery.data;
                    await apiClient.updateSharing(project.id, payload);
                    void sharingQuery.refetch();
                    setSnackbar({
                      open: true,
                      message: 'Sharing settings updated',
                      action: (
                        <Button
                          color='inherit'
                          size='small'
                          onClick={async () => {
                            await apiClient.updateSharing(project.id, { restriction: prev.restriction });
                            void sharingQuery.refetch();
                            setSnackbar({ open: true, message: 'Reverted sharing change', action: null });
                          }}
                        >
                          Undo
                        </Button>
                      ),
                    });
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
          if (asset.url?.startsWith('blob:')) setBlobUrls((prev) => [...prev, asset.url]);
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
          setSnackbar({ open: true, message: 'Panorama uploaded', action: null });
        }}
      />
      <ConfirmDialog
        open={confirmDeleteOpen}
        title='Delete room?'
        description='This removes the room from the project view. You can undo this action from the snackbar.'
        confirmLabel='Delete'
        onConfirm={() => {
          setConfirmDeleteOpen(false);
          if (!currentRoom) return;
          const deletedId = currentRoom.id;
          setDeletedRoomIds((prev) => [...prev, deletedId]);
          // Move selection to first remaining room
          const nextRoom = currentFlat?.rooms.find((r) => r.id !== deletedId);
          setSelectedRoomId(nextRoom?.id ?? null);
          setSelectedViewId(nextRoom?.views?.[0]?.id ?? null);
          setSnackbar({
            open: true,
            message: 'Room deleted',
            action: (
              <Button
                color='inherit'
                size='small'
                onClick={() => setDeletedRoomIds((prev) => prev.filter((id) => id !== deletedId))}
              >
                Undo
              </Button>
            ),
          });
        }}
        onCancel={() => setConfirmDeleteOpen(false)}
      />
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
        message={snackbar.message}
        action={snackbar.action}
      />
    </Stack>
  );
};

export default EditorShellPage;
