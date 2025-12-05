import CameraAltIcon from '@mui/icons-material/CameraAlt';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import RefreshIcon from '@mui/icons-material/Refresh';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import IosShareIcon from '@mui/icons-material/IosShare';
import PushPinIcon from '@mui/icons-material/PushPin';
import TimelineIcon from '@mui/icons-material/Timeline';
import { Box, Button, Chip, Paper, Skeleton, Stack, Tab, Tabs, Typography } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useRef, useState } from 'react';
import { useAuth } from '../features/auth/useAuth';
import { apiClient } from '../lib/apiClient';
import { ProjectCard } from '../features/projects/ProjectCard';
import { PanoramaViewer } from '../features/viewer360/PanoramaViewer';
import { useSceneNavigator } from '../lib/hooks/useSceneNavigator';
import { formatYawPitch } from '../lib/utils/yawPitch';
import { spacing } from '../theme/spacing';
import { ViewerHudRibbon } from '../components/ViewerHudRibbon';
import { createWatermarkedSnapshot, triggerDownload } from '../lib/utils/snapshot';

const HUD_TABS = [
  { id: 'details', label: 'Details', icon: <InfoOutlinedIcon fontSize="small" /> },
  { id: 'share', label: 'Share', icon: <IosShareIcon fontSize="small" /> },
  { id: 'pins', label: 'Pins', icon: <PushPinIcon fontSize="small" /> },
  { id: 'activity', label: 'Activity', icon: <TimelineIcon fontSize="small" /> },
];

const DashboardPage = () => {
  const { org, seatUsage } = useAuth();
  const navigate = useNavigate();
  const viewerRef = useRef(null);
  const [orientation, setOrientation] = useState({ yaw: 0, pitch: 0 });
  const [panel, setPanel] = useState('projects');
  const [hudTab, setHudTab] = useState(null);

  const { data: projects = [], isLoading } = useQuery({
    queryKey: ['projects', org?.id],
    queryFn: () => (org ? apiClient.fetchProjects(org.id) : Promise.resolve([])),
    enabled: Boolean(org?.id),
  });

  const heroProject = projects[0] ?? null;
  const scene = useSceneNavigator(heroProject?.id);

  const heroAnalyticsQuery = useQuery({
    queryKey: ['dashboard-analytics', heroProject?.id],
    queryFn: () => (heroProject ? apiClient.fetchAnalytics(heroProject.id) : Promise.resolve(undefined)),
    enabled: Boolean(heroProject?.id),
  });

  const copyShareLink = async () => {
    if (!heroProject) return;
    try {
      await navigator.clipboard.writeText(`${window.location.origin}/p/${heroProject.slug}`);
    } catch {}
  };

  const handleSnapshot = async () => {
    if (!heroProject) return;
    const canvas = viewerRef.current?.captureSnapshot();
    if (!canvas) return;
    const dataUrl = await createWatermarkedSnapshot(canvas, {
      watermark: heroProject.name,
      strategy: 'BOTTOM_RIGHT',
    });
    triggerDownload(dataUrl, `${heroProject.slug}-snapshot.png`);
  };

  const hudDrawerContent = (() => {
    if (!hudTab) return null;
    switch (hudTab) {
      case 'share':
        return heroProject ? (
          <Stack direction="row" spacing={`${spacing.sm}px`} flexWrap="wrap" alignItems="center">
            <Button variant="outlined" size="small" onClick={() => navigate(`/editor/${heroProject.slug}`)}>
              Edit project
            </Button>
            <Button startIcon={<ContentCopyIcon />} size="small" onClick={copyShareLink}>
              Copy public link
            </Button>
          </Stack>
        ) : (
          <Typography variant="body2" color="text.secondary">
            Select a project to share.
          </Typography>
        );
      case 'pins':
        return scene.pins.length ? (
          <Stack direction="row" spacing={`${spacing.xs}px`} flexWrap="wrap">
            {scene.pins.map((pin) => (
              <Button key={pin.id} variant="outlined" size="small" onClick={() => {
                scene.selectRoom(pin.targetRoomId);
                if (pin.targetViewId) scene.selectView(pin.targetViewId);
              }}>
                {pin.label}
              </Button>
            ))}
          </Stack>
        ) : (
          <Typography variant="body2">Pins are not available for this view.</Typography>
        );
      case 'activity':
        return heroAnalyticsQuery.data ? (
          <Stack direction="row" spacing={`${spacing.sm}px`} flexWrap="wrap">
            <Chip label={`Views ${heroAnalyticsQuery.data.totalViews}`} />
            <Chip label={`Snapshots ${heroAnalyticsQuery.data.snapshotsDownloaded}`} />
            <Chip label={`Last viewed ${new Date(heroAnalyticsQuery.data.lastViewedAt).toLocaleDateString()}`} />
          </Stack>
        ) : (
          <Typography variant="body2">Activity data loads when projects go live.</Typography>
        );
      case 'details':
      default:
        return heroProject ? (
          <Stack spacing={`${spacing.xs}px`}>
            <Typography variant="subtitle1">{heroProject.name}</Typography>
            <Typography variant="body2" color="text.secondary">
              {heroProject.description}
            </Typography>
            <Stack direction="row" spacing={`${spacing.xs}px`} flexWrap="wrap">
              <Chip label={heroProject.visibility} />
              {heroProject.portfolio && <Chip color="primary" label="Portfolio" />}
              <Chip label={formatYawPitch(orientation)} />
            </Stack>
          </Stack>
        ) : (
          <Typography variant="body2">Add a project to see details here.</Typography>
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

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: `${spacing.lg}px`, flex: 1, minHeight: 'calc(100vh - 96px)' }}>
      <Stack direction={{ xs: 'column', md: 'row' }} spacing={`${spacing.sm}px`} justifyContent="space-between" alignItems={{ xs: 'flex-start', md: 'center' }}>
        <Box>
          <Typography variant="h4">Workspace Viewer</Typography>
          <Typography variant="body2" color="text.secondary">
            Your latest panoramas stay in focus. Everything else tucks below.
          </Typography>
        </Box>
        <Chip size="small" label={`Orientation ${formatYawPitch(orientation)}`} />
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
        {heroProject && scene.asset ? (
          <PanoramaViewer
            ref={viewerRef}
            view={scene.selectedView}
            pins={scene.pins}
            panoramaUrl={scene.asset.url}
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
              {isLoading ? 'Loading viewer…' : 'Add a project to preview panoramas here.'}
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
        <Tabs value={panel} onChange={(_, next) => setPanel(next)} aria-label="Dashboard panels" variant="fullWidth">
          <Tab label="Projects" value="projects" />
          <Tab label="Workspace" value="workspace" />
        </Tabs>
        {panel === 'projects' ? (
          <Box sx={{ display: 'flex', gap: `${spacing.md}px`, overflowX: 'auto', py: `${spacing.sm}px` }}>
            {isLoading &&
              Array.from({ length: 3 }).map((_, index) => (
                <Skeleton key={index} variant="rounded" width={320} height={240} />
              ))}
            {!isLoading &&
              projects.map((project) => (
                <Box key={project.id} sx={{ minWidth: 320 }}>
                  <ProjectCard project={project} onOpen={(selected) => navigate(`/editor/${selected.slug}`)} />
                </Box>
              ))}
          </Box>
        ) : (
          <Stack spacing={`${spacing.sm}px`} sx={{ py: `${spacing.sm}px` }}>
            <Typography variant="subtitle1">Seat usage</Typography>
            {seatUsage ? (
              <Stack direction="row" spacing={`${spacing.sm}px`} flexWrap="wrap">
                <Chip label={`Used ${seatUsage.used}`} color="primary" />
                <Chip label={`Available ${seatUsage.available}`} />
                <Chip label={`Total ${seatUsage.used + seatUsage.available}`} />
              </Stack>
            ) : (
              <Typography variant="body2" color="text.secondary">
                Seat insights load after signing in.
              </Typography>
            )}
          </Stack>
        )}
      </Paper>
    </Box>
  );
};

export default DashboardPage;
