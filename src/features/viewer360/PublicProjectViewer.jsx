import CameraAltIcon from '@mui/icons-material/CameraAlt';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import RefreshIcon from '@mui/icons-material/Refresh';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import IosShareIcon from '@mui/icons-material/IosShare';
import PushPinIcon from '@mui/icons-material/PushPin';
import TimelineIcon from '@mui/icons-material/Timeline';
import { Box, Button, Chip, Paper, Skeleton, Stack, Typography } from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import { useMemo, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import { PanoramaViewer } from './PanoramaViewer';
import { apiClient } from '../../lib/apiClient';
import { formatYawPitch } from '../../lib/utils/yawPitch';
import { useSceneNavigator } from '../../lib/hooks/useSceneNavigator';
import { spacing } from '../../theme/spacing';
import { ViewerHudRibbon } from '../../components/ViewerHudRibbon';
import { createWatermarkedSnapshot, triggerDownload } from '../../lib/utils/snapshot';

const HUD_TABS = [
  { id: 'details', label: 'Details', icon: <InfoOutlinedIcon fontSize="small" /> },
  { id: 'share', label: 'Share', icon: <IosShareIcon fontSize="small" /> },
  { id: 'pins', label: 'Pins', icon: <PushPinIcon fontSize="small" /> },
  { id: 'activity', label: 'Activity', icon: <TimelineIcon fontSize="small" /> },
];

export const PublicProjectViewer = () => {
  const { projectSlug = '' } = useParams();
  const viewerRef = useRef(null);
  const [orientation, setOrientation] = useState({ yaw: 0, pitch: 0 });
  const [hudTab, setHudTab] = useState(null);

  const projectQuery = useQuery({
    queryKey: ['public-project', projectSlug],
    queryFn: () => apiClient.fetchPublicProject(projectSlug),
  });

  const project = projectQuery.data;
  const scene = useSceneNavigator(project?.id);

  const analyticsQuery = useQuery({
    queryKey: ['public-analytics', project?.id],
    queryFn: () => (project ? apiClient.fetchAnalytics(project.id) : Promise.resolve(undefined)),
    enabled: Boolean(project?.id),
  });

  const shareUrl = useMemo(() => `${window.location.origin}/p/${projectSlug}`, [projectSlug]);

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
    } catch {}
  };

  const handleSnapshot = async () => {
    if (!project) return;
    const canvas = viewerRef.current?.captureSnapshot();
    if (!canvas) return;
    const dataUrl = await createWatermarkedSnapshot(canvas, {
      watermark: project.name,
      strategy: 'BOTTOM_RIGHT',
    });
    triggerDownload(dataUrl, `${project.slug}-snapshot.png`);
  };

  const hudDrawerContent = (() => {
    if (!hudTab) return null;
    switch (hudTab) {
      case 'share':
        return (
          <Stack direction="row" spacing={`${spacing.sm}px`} flexWrap="wrap">
            <Button startIcon={<ContentCopyIcon />} size="small" onClick={handleCopyLink}>
              Copy Link
            </Button>
            <Button variant="outlined" size="small" onClick={() => window.open(shareUrl, '_blank', 'noopener')}>
              Open Viewer
            </Button>
            <Button variant="contained" size="small" startIcon={<CameraAltIcon fontSize="small" />} onClick={handleSnapshot}>
              Snapshot
            </Button>
          </Stack>
        );
      case 'pins':
        return scene.pins.length ? (
          <Stack direction="row" spacing={`${spacing.xs}px`} flexWrap="wrap">
            {scene.pins.map((pin) => (
              <Button key={pin.id} size="small" variant="outlined" onClick={() => {
                scene.selectRoom(pin.targetRoomId);
                if (pin.targetViewId) scene.selectView(pin.targetViewId);
              }}>
                {pin.label}
              </Button>
            ))}
          </Stack>
        ) : (
          <Typography variant="body2">No pins available.</Typography>
        );
      case 'activity':
        return analyticsQuery.data ? (
          <Stack direction="row" spacing={`${spacing.sm}px`} flexWrap="wrap">
            <Chip label={`Views ${analyticsQuery.data.totalViews}`} />
            <Chip label={`Snapshots ${analyticsQuery.data.snapshotsDownloaded}`} />
            <Chip label={`Last viewed ${analyticsQuery.data.lastViewedAt ? new Date(analyticsQuery.data.lastViewedAt).toLocaleDateString() : '—'}`} />
          </Stack>
        ) : (
          <Typography variant="body2" color="text.secondary">
            Activity data becomes available once the project receives visits.
          </Typography>
        );
      case 'details':
      default:
        return project ? (
          <Stack spacing={`${spacing.xs}px`}>
            <Typography variant="subtitle1">{project.name}</Typography>
            <Typography variant="body2" color="text.secondary">
              {project.description}
            </Typography>
            <Stack direction="row" spacing={`${spacing.xs}px`} flexWrap="wrap">
              <Chip label={project.visibility} />
              {project.portfolio && <Chip color="primary" label="Portfolio" />}
              <Chip label={formatYawPitch(orientation)} />
            </Stack>
          </Stack>
        ) : (
          <Typography variant="body2">Project not found.</Typography>
        );
    }
  })();

  const hudActions = [
    {
      id: 'reset',
      label: 'Reset orientation',
      icon: <RefreshIcon fontSize="small" />,
      onClick: () => viewerRef.current?.resetOrientation(),
    },
    {
      id: 'snapshot',
      label: 'Save snapshot',
      icon: <CameraAltIcon fontSize="small" />,
      onClick: handleSnapshot,
    },
  ];

  if (!project) {
    return (
      <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Typography variant="body1">{projectQuery.isLoading ? 'Loading public project.' : 'Project not found.'}</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: `${spacing.lg}px`, flex: 1, minHeight: 'calc(100vh - 96px)' }}>
      <Stack direction={{ xs: 'column', md: 'row' }} spacing={`${spacing.sm}px`} justifyContent="space-between" alignItems={{ xs: 'flex-start', md: 'center' }}>
        <Box>
          <Typography variant="h4">{project.name}</Typography>
          <Typography variant="body2" color="text.secondary">
            Explore interactive rooms and jump between scenes using pins.
          </Typography>
        </Box>
        <Chip label="Public View" color="primary" variant="outlined" />
      </Stack>

      <Box
        sx={{
          flex: 1,
          minHeight: 0,
          borderRadius: `${spacing.lg}px`,
          overflow: 'hidden',
          position: 'relative',
          bgcolor: 'common.black',
        }}
      >
        {scene.asset ? (
          <PanoramaViewer
            ref={viewerRef}
            view={scene.selectedView}
            panoramaUrl={scene.asset.url}
            pins={scene.pins}
            onPinClick={(pin) => {
              scene.selectRoom(pin.targetRoomId);
              if (pin.targetViewId) scene.selectView(pin.targetViewId);
            }}
            onPositionChange={setOrientation}
          />
        ) : (
          <Stack alignItems="center" justifyContent="center" sx={{ height: '100%' }} spacing={`${spacing.sm}px`}>
            <Skeleton variant="rounded" width="80%" height={320} />
            <Typography variant="body2" color="text.secondary">
              Loading panorama…
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

      <Paper elevation={0} sx={{ borderRadius: `${spacing.lg}px`, p: `${spacing.md}px` }}>
        <Typography variant="subtitle2" color="text.secondary" sx={{ mb: `${spacing.sm}px` }}>
          Rooms
        </Typography>
        <Stack direction="row" spacing={`${spacing.xs}px`} flexWrap="wrap">
          {scene.rooms.map((room) => (
            <Button
              key={room.id}
              variant={room.id === scene.selectedRoom?.id ? 'contained' : 'outlined'}
              size="small"
              onClick={() => scene.selectRoom(room.id)}
            >
              {room.name}
            </Button>
          ))}
        </Stack>
      </Paper>
    </Box>
  );
};
