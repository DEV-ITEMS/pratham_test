import CameraAltIcon from '@mui/icons-material/CameraAlt';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import ExploreIcon from '@mui/icons-material/Explore';
import RefreshIcon from '@mui/icons-material/Refresh';
import UploadIcon from '@mui/icons-material/Upload';
import ShareIcon from '@mui/icons-material/Share';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import IosShareIcon from '@mui/icons-material/IosShare';
import PushPinIcon from '@mui/icons-material/PushPin';
import TimelineIcon from '@mui/icons-material/Timeline';
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  IconButton,
  Paper,
  Skeleton,
  Snackbar,
  Stack,
  Typography,
} from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import { formatDistanceToNow } from 'date-fns';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '../features/auth/useAuth';
import { ShareSettingsPanel } from '../features/sharing/ShareSettingsPanel';
import { ShareDialog } from '../features/sharing/ShareDialog';
import { UploadPanoramaDialog } from '../features/uploads/UploadPanoramaDialog';
import { PanoramaViewer } from '../features/viewer360/PanoramaViewer';
import { apiClient } from '../lib/apiClient';
import { createWatermarkedSnapshot, triggerDownload } from '../lib/utils/snapshot';
import { formatYawPitch } from '../lib/utils/yawPitch';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { ViewerHudRibbon } from '../components/ViewerHudRibbon';
import { spacing } from '../theme/spacing';

const HUD_TABS = [
  { id: 'details', label: 'Details', icon: <InfoOutlinedIcon fontSize="small" /> },
  { id: 'share', label: 'Share', icon: <IosShareIcon fontSize="small" /> },
  { id: 'pins', label: 'Pins', icon: <PushPinIcon fontSize="small" /> },
  { id: 'activity', label: 'Activity', icon: <TimelineIcon fontSize="small" /> },
];

const ScrollStrip = ({ label, items, selectedId, onSelect, emptyLabel }) => (
  <Stack spacing={`${spacing.xs}px`} sx={{ minWidth: 0 }}>
    <Typography variant="caption" color="text.secondary">
      {label}
    </Typography>
    <Stack direction="row" spacing={`${spacing.xs}px`} sx={{ overflowX: 'auto', pb: `${spacing.xs}px` }}>
      {items.length === 0 && <Chip size="small" label={emptyLabel} variant="outlined" />}
      {items.map((item) => (
        <Button
          key={item.id}
          size="small"
          variant={item.id === selectedId ? 'contained' : 'outlined'}
          onClick={() => onSelect(item.id)}
        >
          {item.name}
        </Button>
      ))}
    </Stack>
  </Stack>
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
  const [hudTab, setHudTab] = useState(null);
  const [shareDialogOpen, setShareDialogOpen] = useState(false);

  useEffect(() => () => {
    blobUrls.forEach((u) => {
      try {
        if (u.startsWith('blob:')) URL.revokeObjectURL(u);
      } catch {
        /* ignore */
      }
    });
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
    if (!selection) return;
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
    () => filteredBuildings.find((item) => item.id === selectedBuildingId) ?? filteredBuildings[0] ?? null,
    [filteredBuildings, selectedBuildingId],
  );

  const currentFlat = useMemo(
    () => currentBuilding?.flats.find((flat) => flat.id === selectedFlatId) ?? currentBuilding?.flats[0] ?? null,
    [currentBuilding, selectedFlatId],
  );

  const currentRoom = useMemo(
    () => currentFlat?.rooms.find((room) => room.id === selectedRoomId) ?? currentFlat?.rooms[0] ?? null,
    [currentFlat, selectedRoomId],
  );

  const roomViews = useMemo(() => {
    const base = currentRoom?.views ?? [];
    const added = currentRoom?.id && uploadedViewsByRoomId[currentRoom.id] ? uploadedViewsByRoomId[currentRoom.id] : [];
    return [...base, ...added];
  }, [currentRoom?.id, currentRoom?.views, uploadedViewsByRoomId]);

  const currentView = useMemo(() => roomViews.find((view) => view.id === selectedViewId) ?? roomViews[0] ?? null, [roomViews, selectedViewId]);

  const pinsQuery = useQuery({
    queryKey: ['pins', currentView?.id],
    queryFn: () => (currentView ? apiClient.fetchPinsForView(currentView.id) : Promise.resolve([])),
    enabled: Boolean(currentView?.id),
  });

  const panoramaAssetQuery = useQuery({
    queryKey: ['asset', currentView?.panoramaAssetId],
    queryFn: () => (currentView ? apiClient.fetchPanoramaAsset(currentView.panoramaAssetId) : Promise.resolve(undefined)),
    enabled: Boolean(currentView?.panoramaAssetId),
  });

  const uploadedAsset = currentView ? uploadedAssetsById[currentView.panoramaAssetId] : undefined;
  const panoramaUrl = uploadedAsset?.url ?? panoramaAssetQuery.data?.url;

  useEffect(() => {
    if (!currentView && roomViews.length > 0) {
      setSelectedViewId(roomViews[0].id);
    }
  }, [currentView, roomViews]);

  const handleBuildingChange = (buildingId) => {
    const building = filteredBuildings.find((b) => b.id === buildingId);
    setSelectedBuildingId(buildingId);
    const firstFlat = building?.flats[0];
    setSelectedFlatId(firstFlat?.id ?? null);
    const firstRoom = firstFlat?.rooms[0];
    setSelectedRoomId(firstRoom?.id ?? null);
    setSelectedViewId(firstRoom?.views[0]?.id ?? null);
  };

  const handleFlatChange = (flatId) => {
    const flat = currentBuilding?.flats.find((f) => f.id === flatId);
    setSelectedFlatId(flatId);
    const firstRoom = flat?.rooms[0];
    setSelectedRoomId(firstRoom?.id ?? null);
    setSelectedViewId(firstRoom?.views[0]?.id ?? null);
  };

  const handleRoomChange = (roomId) => {
    const room = currentFlat?.rooms.find((r) => r.id === roomId);
    setSelectedRoomId(roomId);
    setSelectedViewId(room?.views[0]?.id ?? null);
  };

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
    if (!canvas) {
      setSnapshotting(false);
      return;
    }
    const watermark = `${org?.name ?? 'Demo Interiors'} - ${project.name}`;
    const dataUrl = await createWatermarkedSnapshot(canvas, { watermark, strategy: 'BOTTOM_RIGHT' });
    triggerDownload(dataUrl, `${project.slug}-snapshot.png`);
    await apiClient.recordSnapshot(project.id);
    void analyticsQuery.refetch();
    setSnackbar({ open: true, message: 'Snapshot saved to your device', action: null });
    setSnapshotting(false);
  };

  if (projectQuery.isError) {
    return <Alert severity="error">Failed to load project. Please refresh the page.</Alert>;
  }

  if (!project && projectQuery.isLoading) {
    return (
      <Stack spacing={`${spacing.md}px`} sx={{ flex: 1 }}>
        <Skeleton variant="text" width="50%" height={spacing.xl * 2} />
        <Skeleton variant="rounded" height={240} />
      </Stack>
    );
  }

  if (!project) {
    return <Alert severity="warning">Project not found. Try another link from the dashboard.</Alert>;
  }

  const copyShareLink = async () => {
    try {
      await navigator.clipboard.writeText(`${window.location.origin}/p/${project.slug}`);
      setSnackbar({ open: true, message: 'Link copied', action: null });
    } catch {
      setSnackbar({ open: true, message: 'Copy failed. Try again.', action: null });
    }
  };

  const hudDrawerContent = (() => {
    switch (hudTab) {
      case 'share':
        if (!sharingQuery.data) return <Typography variant="body2">Loading share settings…</Typography>;
        return (
          <Stack spacing={`${spacing.sm}px`}>
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
                      color="inherit"
                      size="small"
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
            <Stack direction="row" spacing={`${spacing.sm}px`}>
              <IconButton size="small" onClick={copyShareLink} aria-label="Copy public link">
                <ContentCopyIcon fontSize="small" />
              </IconButton>
              <IconButton size="small" onClick={() => setShareDialogOpen(true)} aria-label="Open share dialog">
                <ShareIcon fontSize="small" />
              </IconButton>
            </Stack>
          </Stack>
        );
      case 'pins':
        return (
          <Stack spacing={`${spacing.xs}px`} direction="row" flexWrap="wrap">
            {(pinsQuery.data ?? []).map((pin) => (
              <Button key={pin.id} size="small" variant="outlined" onClick={() => handlePinNavigate(pin)}>
                {pin.label}
              </Button>
            ))}
            {pinsQuery.data?.length === 0 && (
              <Typography variant="body2" color="text.secondary">
                No pins yet for this view.
              </Typography>
            )}
          </Stack>
        );
      case 'activity':
        return analyticsQuery.data ? (
          <Stack direction="row" spacing={`${spacing.sm}px`} flexWrap="wrap">
            <Chip label={`Views ${analyticsQuery.data.totalViews}`} />
            <Chip label={`Snapshots ${analyticsQuery.data.snapshotsDownloaded}`} />
            <Chip label={`Last viewed ${formatDistanceToNow(new Date(analyticsQuery.data.lastViewedAt), { addSuffix: true })}`} />
          </Stack>
        ) : (
          <Typography variant="body2" color="text.secondary">
            Activity will appear once the project is viewed.
          </Typography>
        );
      case 'details':
      default:
        return currentRoom ? (
          <Stack spacing={`${spacing.xs}px`}>
            <Typography variant="subtitle1">{currentRoom.name}</Typography>
            {currentRoom.description && (
              <Typography variant="body2" color="text.secondary">
                {currentRoom.description}
              </Typography>
            )}
            <Stack direction="row" spacing={`${spacing.xs}px`} flexWrap="wrap">
              <Chip label={project.visibility} />
              {project.portfolio && <Chip color="primary" label="Portfolio" />}
              <Chip icon={<ExploreIcon fontSize="small" />} label={formatYawPitch(orientation)} />
            </Stack>
          </Stack>
        ) : (
          <Typography variant="body2">Select a room to inspect its details.</Typography>
        );
    }
  })();

  const hudActions = [
    {
      id: 'upload',
      label: 'Upload panorama',
      icon: <UploadIcon fontSize="small" />,
      onClick: () => setUploadOpen(true),
    },
    {
      id: 'reset',
      label: 'Reset orientation',
      icon: <RefreshIcon fontSize="small" />,
      onClick: () => viewerRef.current?.resetOrientation(),
    },
    {
      id: 'snapshot',
      label: 'Save snapshot',
      icon: snapshotting ? <CircularProgress size={16} color="inherit" /> : <CameraAltIcon fontSize="small" />,
      onClick: handleSnapshot,
      disabled: snapshotting,
    },
  ];

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        gap: `${spacing.lg}px`,
        flex: 1,
        minHeight: 'calc(100vh - 96px)',
      }}
    >
      <Stack direction={{ xs: 'column', md: 'row' }} spacing={`${spacing.sm}px`} justifyContent="space-between" alignItems={{ xs: 'flex-start', md: 'center' }}>
        <Box>
          <Typography variant="h4" component="h1">
            {project.name}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {currentBuilding?.address ?? 'Orientation ready'}
          </Typography>
        </Box>
        <Stack direction="row" spacing={`${spacing.xs}px`} flexWrap="wrap">
          <Chip size="small" label={`Updated ${formatDistanceToNow(new Date(project.updatedAt), { addSuffix: true })}`} />
          <Chip size="small" label={`Views ${analyticsQuery.data?.totalViews ?? 0}`} />
          <Chip size="small" label={project.visibility} />
        </Stack>
      </Stack>

      <Paper elevation={0} sx={{ p: `${spacing.md}px`, borderRadius: `${spacing.lg}px` }}>
        <Stack direction={{ xs: 'column', lg: 'row' }} spacing={`${spacing.md}px`} alignItems={{ xs: 'flex-start', lg: 'center' }}>
          <ScrollStrip
            label="Buildings"
            items={filteredBuildings}
            selectedId={currentBuilding?.id ?? null}
            onSelect={handleBuildingChange}
            emptyLabel="None"
          />
          <ScrollStrip
            label="Flats"
            items={currentBuilding?.flats ?? []}
            selectedId={currentFlat?.id ?? null}
            onSelect={handleFlatChange}
            emptyLabel="None"
          />
          <ScrollStrip
            label="Rooms"
            items={currentFlat?.rooms ?? []}
            selectedId={currentRoom?.id ?? null}
            onSelect={handleRoomChange}
            emptyLabel="None"
          />
          <ScrollStrip
            label="Views"
            items={roomViews}
            selectedId={currentView?.id ?? null}
            onSelect={setSelectedViewId}
            emptyLabel="None"
          />
        </Stack>
      </Paper>

      <Box
        sx={{
          flex: 1,
          minHeight: 0,
          position: 'relative',
          borderRadius: `${spacing.lg}px`,
          overflow: 'hidden',
          bgcolor: 'common.black',
        }}
      >
        {currentView && panoramaUrl ? (
          <PanoramaViewer
            ref={viewerRef}
            view={currentView}
            panoramaUrl={panoramaUrl}
            pins={pinsQuery.data ?? []}
            onPinClick={handlePinNavigate}
            onPositionChange={setOrientation}
          />
        ) : (
          <Stack alignItems="center" justifyContent="center" sx={{ height: '100%' }} spacing={`${spacing.sm}px`}>
            <Skeleton variant="rounded" width="70%" height={320} />
            <Typography variant="body2" color="text.secondary">
              Select a room to start exploring its panoramas.
            </Typography>
          </Stack>
        )}

        <ViewerHudRibbon
          tabs={HUD_TABS}
          activeTab={hudTab}
          onTabChange={setHudTab}
          actions={hudActions}
          drawerContent={hudTab ? hudDrawerContent : null}
        />
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
          setHudTab('details');
          setSnackbar({ open: true, message: 'Panorama uploaded', action: null });
        }}
      />

      {sharingQuery.data && (
        <ShareDialog
          open={shareDialogOpen}
          onClose={() => setShareDialogOpen(false)}
          project={project}
          share={sharingQuery.data}
          onChange={async (payload) => {
            await apiClient.updateSharing(project.id, payload);
            void sharingQuery.refetch();
          }}
        />
      )}

      <ConfirmDialog
        open={confirmDeleteOpen}
        title="Delete room?"
        description="This removes the room from the project view. You can undo this action from the snackbar."
        confirmLabel="Delete"
        onConfirm={() => {
          setConfirmDeleteOpen(false);
          if (!currentRoom) return;
          const deletedId = currentRoom.id;
          setDeletedRoomIds((prev) => [...prev, deletedId]);
          const nextRoom = currentFlat?.rooms.find((r) => r.id !== deletedId);
          setSelectedRoomId(nextRoom?.id ?? null);
          setSelectedViewId(nextRoom?.views?.[0]?.id ?? null);
          setSnackbar({
            open: true,
            message: 'Room deleted',
            action: (
              <Button color="inherit" size="small" onClick={() => setDeletedRoomIds((prev) => prev.filter((id) => id !== deletedId))}>
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
    </Box>
  );
};

export default EditorShellPage;
