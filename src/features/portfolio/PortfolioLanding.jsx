import CameraAltIcon from '@mui/icons-material/CameraAlt';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import RefreshIcon from '@mui/icons-material/Refresh';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import IosShareIcon from '@mui/icons-material/IosShare';
import PushPinIcon from '@mui/icons-material/PushPin';
import TimelineIcon from '@mui/icons-material/Timeline';
import { Box, Button, Chip, Paper, Skeleton, Stack, Typography } from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import { ProjectCard } from '../projects/ProjectCard';
import { apiClient } from '../../lib/apiClient';
import { PanoramaViewer } from '../viewer360/PanoramaViewer';
import { useSceneNavigator } from '../../lib/hooks/useSceneNavigator';
import { formatYawPitch } from '../../lib/utils/yawPitch';
import { spacing } from '../../theme/spacing';
import { ViewerHudRibbon } from '../../components/ViewerHudRibbon';
import { createWatermarkedSnapshot, triggerDownload } from '../../lib/utils/snapshot';

const HUD_TABS = [
  { id: 'details', label: 'Details', icon: <InfoOutlinedIcon fontSize="small" /> },
  { id: 'share', label: 'Share', icon: <IosShareIcon fontSize="small" /> },
  { id: 'pins', label: 'Pins', icon: <PushPinIcon fontSize="small" /> },
  { id: 'activity', label: 'Activity', icon: <TimelineIcon fontSize="small" /> },
];

export const PortfolioLanding = () => {
  const { orgSlug = '' } = useParams();
  const [selectedProjectId, setSelectedProjectId] = useState(null);
  const [orientation, setOrientation] = useState({ yaw: 0, pitch: 0 });
  const viewerRef = useRef(null);
  const [hudTab, setHudTab] = useState(null);

  const orgQuery = useQuery({
    queryKey: ['org', orgSlug],
    queryFn: () => apiClient.fetchOrgBySlug(orgSlug),
  });

  const portfolioQuery = useQuery({
    queryKey: ['portfolio', orgSlug],
    queryFn: async () => {
      const org = await apiClient.fetchOrgBySlug(orgSlug);
      if (!org) return [];
      return apiClient.fetchPortfolioProjects(org.id);
    },
  });

  const projects = useMemo(() => portfolioQuery.data ?? [], [portfolioQuery.data]);

  useEffect(() => {
    if (projects.length && !selectedProjectId) {
      setSelectedProjectId(projects[0].id);
    }
  }, [projects, selectedProjectId]);

  const selectedProject = useMemo(() => projects.find((p) => p.id === selectedProjectId) ?? projects[0] ?? null, [projects, selectedProjectId]);
  const scene = useSceneNavigator(selectedProject?.id);

  const copyShareLink = async () => {
    if (!selectedProject) return;
    try {
      await navigator.clipboard.writeText(`${window.location.origin}/p/${selectedProject.slug}`);
    } catch {}
  };

  const handleSnapshot = async () => {
    if (!selectedProject) return;
    const canvas = viewerRef.current?.captureSnapshot();
    if (!canvas) return;
    const dataUrl = await createWatermarkedSnapshot(canvas, {
      watermark: `${selectedProject.name} Showcase`,
      strategy: 'BOTTOM_RIGHT',
    });
    triggerDownload(dataUrl, `${selectedProject.slug}-snapshot.png`);
  };

  const hudDrawerContent = (() => {
    if (!hudTab) return null;
    switch (hudTab) {
      case 'share':
        return selectedProject ? (
          <Stack direction="row" spacing={`${spacing.sm}px`} flexWrap="wrap">
            <Button variant="outlined" size="small" onClick={() => copyShareLink()} startIcon={<ContentCopyIcon />}>
              Copy link
            </Button>
            <Button variant="contained" size="small" onClick={handleSnapshot} startIcon={<CameraAltIcon fontSize="small" />}>
              Snapshot
            </Button>
          </Stack>
        ) : (
          <Typography variant="body2">Choose a project to share.</Typography>
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
          <Typography variant="body2">Pins are not available.</Typography>
        );
      case 'activity':
        return (
          <Typography variant="body2" color="text.secondary">
            Activity widgets are coming soon.
          </Typography>
        );
      case 'details':
      default:
        return selectedProject ? (
          <Stack spacing={`${spacing.xs}px`}>
            <Typography variant="subtitle1">{selectedProject.name}</Typography>
            <Typography variant="body2" color="text.secondary">
              {selectedProject.description}
            </Typography>
            <Stack direction="row" spacing={`${spacing.xs}px`} flexWrap="wrap">
              <Chip label={selectedProject.visibility} />
              {selectedProject.portfolio && <Chip color="primary" label="Portfolio" />}
              <Chip label={formatYawPitch(orientation)} />
            </Stack>
          </Stack>
        ) : (
          <Typography variant="body2">Select a project below.</Typography>
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
  ];

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: `${spacing.lg}px`, flex: 1, minHeight: 'calc(100vh - 96px)' }}>
      <Stack direction={{ xs: 'column', md: 'row' }} spacing={`${spacing.sm}px`} justifyContent="space-between" alignItems={{ xs: 'flex-start', md: 'center' }}>
        <Box>
          <Typography variant="h4">{orgQuery.data ? `${orgQuery.data.name} Showcase` : 'Portfolio'}</Typography>
          <Typography variant="body2" color="text.secondary">
            Explore curated scenes without leaving the viewer.
          </Typography>
        </Box>
        {selectedProject && <Chip size="small" label={formatYawPitch(orientation)} />}
      </Stack>

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
        {selectedProject && scene.asset ? (
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
              {portfolioQuery.isLoading ? 'Loading showcase…' : 'Select a project below to preview its rooms.'}
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
        <Stack spacing={`${spacing.md}px`}>
          <Typography variant="subtitle2" color="text.secondary">
            Portfolio Projects
          </Typography>
          <Box sx={{ display: 'flex', gap: `${spacing.md}px`, overflowX: 'auto', pb: `${spacing.sm}px` }}>
            {portfolioQuery.isLoading &&
              Array.from({ length: 3 }).map((_, index) => (
                <Skeleton key={index} variant="rounded" width={320} height={240} />
              ))}
            {!portfolioQuery.isLoading &&
              projects.map((project) => (
                <Box key={project.id} sx={{ minWidth: 320 }}>
                  <ProjectCard
                    project={project}
                    ctaLabel="Focus"
                    onOpen={() => setSelectedProjectId(project.id)}
                  />
                </Box>
              ))}
          </Box>
        </Stack>
      </Paper>
    </Box>
  );
};
