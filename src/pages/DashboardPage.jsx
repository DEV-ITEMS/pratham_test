import { Box, Chip, Paper, Skeleton, Stack, Tab, Tabs, Typography } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import { useAuth } from '../features/auth/useAuth';
import { apiClient } from '../lib/apiClient';
import { ProjectCard } from '../features/projects/ProjectCard';
import { spacing } from '../theme/spacing';

const DashboardPage = () => {
  const { org, seatUsage, token } = useAuth();
  const navigate = useNavigate();
  const [panel, setPanel] = useState('projects');

  const { data: projectsResult, isLoading } = useQuery({
    queryKey: ['projects', org?.id, token],
    queryFn: () => (org && token ? apiClient.getProjects({ token, page: 1, pageSize: 20 }) : Promise.resolve(null)),
    enabled: Boolean(org?.id && token),
  });

  const projects = useMemo(() => {
    if (!projectsResult) return [];
    if (Array.isArray(projectsResult)) return projectsResult;
    return Array.isArray(projectsResult.items) ? projectsResult.items : [];
  }, [projectsResult]);

  const renderProjects = () => {
    if (isLoading) {
      return (
        <Stack spacing={`${spacing.sm}px`} sx={{ py: `${spacing.sm}px` }}>
          {Array.from({ length: 3 }).map((_, index) => (
            <Skeleton key={index} variant="rounded" height={240} />
          ))}
        </Stack>
      );
    }

    if (!projects.length) {
      return (
        <Paper elevation={0} sx={{ p: `${spacing.md}px`, borderRadius: `${spacing.lg}px` }}>
          <Typography variant="subtitle1">No projects yet</Typography>
          <Typography variant="body2" color="text.secondary">
            Use the backend (POST /projects) or admin tools to create your first project. It will appear here automatically.
          </Typography>
        </Paper>
      );
    }

    return (
      <Stack spacing={`${spacing.md}px`} sx={{ py: `${spacing.sm}px` }}>
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: `${spacing.md}px`,
          }}
        >
          {projects.map((project) => (
            <ProjectCard key={project.id} project={project} onOpen={(selected) => navigate(`/editor/${selected.slug}`)} />
          ))}
        </Box>
      </Stack>
    );
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: `${spacing.lg}px`, flex: 1, minHeight: 'calc(100vh - 96px)' }}>
      <Stack direction={{ xs: 'column', md: 'row' }} spacing={`${spacing.sm}px`} justifyContent="space-between" alignItems={{ xs: 'flex-start', md: 'center' }}>
        <Box>
          <Typography variant="h4">Workspace</Typography>
          <Typography variant="body2" color="text.secondary">
            Connect to your organization and list available projects from the backend.
          </Typography>
        </Box>
        {org && <Chip size="small" label={org.name} />}
      </Stack>

      <Paper elevation={0} sx={{ borderRadius: `${spacing.lg}px`, p: `${spacing.md}px` }}>
        <Tabs value={panel} onChange={(_, next) => setPanel(next)} aria-label="Dashboard panels" variant="fullWidth">
          <Tab label="Projects" value="projects" />
          <Tab label="Workspace" value="workspace" />
        </Tabs>
        {panel === 'projects' ? (
          renderProjects()
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
