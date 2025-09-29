import { Box, Breadcrumbs, Button, Chip, Container, Divider, Skeleton, Stack, ToggleButton, Tooltip, Typography } from '@mui/material';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';
import SlideshowIcon from '@mui/icons-material/Slideshow';
import { useQuery } from '@tanstack/react-query';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import { PanoramaViewer } from './PanoramaViewer';
import { apiClient } from '../../lib/apiClient';
import { formatYawPitch } from '../../lib/utils/yawPitch';

export const PublicProjectViewer = () => {
  const { projectSlug = '' } = useParams();
  const viewerRef = useRef(null);
  const [selectedRoomId, setSelectedRoomId] = useState(null);
  const [selectedViewId, setSelectedViewId] = useState(null);
  const [orientation, setOrientation] = useState({ yaw: 0, pitch: 0 });
  const [presentation, setPresentation] = useState(false);

  const projectQuery = useQuery({
    queryKey: ['public-project', projectSlug],
    queryFn: () => apiClient.fetchPublicProject(projectSlug),
  });

  const project = projectQuery.data;

  const hierarchyQuery = useQuery({
    queryKey: ['public-hierarchy', project?.id],
    queryFn: () => (project ? apiClient.fetchProjectHierarchy(project.id) : Promise.resolve(undefined)),
    enabled: Boolean(project?.id),
  });

  useEffect(() => {
    const hierarchy = hierarchyQuery.data;
    if (!hierarchy) return;
    const firstBuilding = hierarchy.buildings[0];
    const firstFlat = firstBuilding?.flats[0];
    const firstRoom = firstFlat?.rooms[0];
    const firstView = firstRoom?.views[0];
    setSelectedRoomId((prev) => prev ?? firstRoom?.id ?? null);
    setSelectedViewId((prev) => prev ?? firstView?.id ?? null);
  }, [hierarchyQuery.data]);

  const rooms = useMemo(() => {
    const hierarchy = hierarchyQuery.data;
    if (!hierarchy) return [];
    return hierarchy.buildings.flatMap((building) => building.flats.flatMap((flat) => flat.rooms));
  }, [hierarchyQuery.data]);

  const currentRoom = rooms.find((room) => room.id === selectedRoomId) ?? rooms[0];
  const currentView = currentRoom?.views.find((view) => view.id === selectedViewId) ?? currentRoom?.views[0];

  useEffect(() => {
    if (currentRoom && !currentRoom.views.some((view) => view.id === selectedViewId)) {
      setSelectedViewId(currentRoom.views[0]?.id ?? null);
    }
  }, [currentRoom, selectedViewId]);

  const pinsQuery = useQuery({
    queryKey: ['public-pins', currentView?.id],
    queryFn: () => (currentView ? apiClient.fetchPinsForView(currentView.id) : Promise.resolve([])),
    enabled: Boolean(currentView?.id),
  });

  const assetQuery = useQuery({
    queryKey: ['public-asset', currentView?.panoramaAssetId],
    queryFn: () => (currentView ? apiClient.fetchPanoramaAsset(currentView.panoramaAssetId) : Promise.resolve(undefined)),
    enabled: Boolean(currentView?.panoramaAssetId),
  });

  const handlePinNavigate = (pin) => {
    setSelectedRoomId(pin.targetRoomId);
    setSelectedViewId(pin.targetViewId ?? null);
  };

  if (!project) {
    return (
      <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Typography variant='body1'>Loading public project.</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ bgcolor: 'background.default' }}>
      <Container maxWidth='lg'>
        <Stack spacing={3} sx={{ mb: 4 }}>
          <Stack spacing={1}>
            <Breadcrumbs separator={<NavigateNextIcon fontSize='small' />} aria-label='breadcrumb'>
              <Typography color='text.primary'>Public</Typography>
              <Typography color='text.primary'>{project.name}</Typography>
            </Breadcrumbs>
          </Stack>
          <Stack spacing={1} direction='row' justifyContent='space-between' alignItems='center'>
            <Stack spacing={1}>
              <Typography variant='subtitle2' color='primary'>
                Public View
              </Typography>
              <Typography variant='h3'>{project.name}</Typography>
              <Typography variant='body1' color='text.secondary'>
                Explore interactive rooms and jump between scenes using the in-view pins.
              </Typography>
              <Stack direction='row' spacing={1}>
                <Chip size='small' label={`Visibility: ${project.visibility}`} />
                {project.portfolio && <Chip size='small' color='primary' label='Portfolio' />}
                {currentRoom && <Chip size='small' label={`Room: ${currentRoom.name}`} />}
                <Chip size='small' label={`Orientation: ${formatYawPitch(orientation)}`} />
              </Stack>
            </Stack>
            <Tooltip title={presentation ? 'Exit presentation' : 'Enter presentation'}>
              <ToggleButton
                value='presentation'
                selected={presentation}
                onChange={() => setPresentation((v) => !v)}
                aria-label='Toggle presentation mode'
              >
                <SlideshowIcon />
              </ToggleButton>
            </Tooltip>
          </Stack>
          <Box
            sx={{
              display: 'grid',
              gap: 3,
              gridTemplateColumns: presentation ? '1fr' : { xs: '1fr', md: '320px minmax(0, 1fr)' },
              alignItems: 'start',
            }}
          >
            {!presentation && (
              <Stack spacing={1}>
                <Typography variant='subtitle2'>Rooms</Typography>
                <Stack spacing={1}>
                  {rooms.map((room) => (
                    <Button
                      key={room.id}
                      variant={room.id === currentRoom?.id ? 'contained' : 'outlined'}
                      onClick={() => {
                        setSelectedRoomId(room.id);
                        setSelectedViewId(room.views[0]?.id ?? null);
                      }}
                    >
                      {room.name}
                    </Button>
                  ))}
                </Stack>
                <Divider />
                <Typography variant='subtitle2'>Pins</Typography>
                <Stack spacing={1}>
                  {(pinsQuery.data ?? []).map((pin) => (
                    <Button key={pin.id} variant='outlined' size='small' onClick={() => handlePinNavigate(pin)}>
                      {pin.label}
                    </Button>
                  ))}
                  {pinsQuery.data?.length === 0 && <Typography variant='body2'>No pins available.</Typography>}
                </Stack>
              </Stack>
            )}
            <Box>
              {currentView && assetQuery.data ? (
                <Box sx={{ height: presentation ? 640 : { xs: 360, md: 560 } }}>
                  <PanoramaViewer
                    ref={viewerRef}
                    view={currentView}
                    panoramaUrl={assetQuery.data.url}
                    pins={pinsQuery.data ?? []}
                    onPinClick={handlePinNavigate}
                    onPositionChange={setOrientation}
                  />
                </Box>
              ) : (
                <Box sx={{ height: presentation ? 640 : 560 }}>
                  <Stack spacing={1}>
                    <Skeleton variant='rounded' height={presentation ? 640 : 560} />
                  </Stack>
                </Box>
              )}
            </Box>
          </Box>
        </Stack>
      </Container>
    </Box>
  );
};

