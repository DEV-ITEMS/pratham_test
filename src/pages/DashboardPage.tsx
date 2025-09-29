import { Box, Skeleton, Stack, Typography } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../features/auth/useAuth';
import { apiClient } from '../lib/apiClient';
import { Project } from '../lib/types';
import { ProjectCard } from '../features/projects/ProjectCard';

const DashboardPage = () => {
  const { org } = useAuth();
  const navigate = useNavigate();

  const { data: projects, isLoading } = useQuery({
    queryKey: ['projects', org?.id],
    queryFn: () => (org ? apiClient.fetchProjects(org.id) : Promise.resolve<Project[]>([])),
    enabled: Boolean(org?.id),
  });

  return (
    <Stack spacing={4}>
      <Stack spacing={1}>
        <Typography variant='h4'>Projects</Typography>
        <Typography variant='body1' color='text.secondary'>
          Browse interior design projects and jump into the viewer or editor instantly.
        </Typography>
      </Stack>
      <Box
        sx={{
          display: 'grid',
          gap: 3,
          gridTemplateColumns: { xs: '1fr', md: 'repeat(3, minmax(0, 1fr))' },
        }}
      >
        {isLoading &&
          Array.from({ length: 3 }).map((_, index) => (
            <Skeleton key={index} variant='rounded' height={220} />
          ))}
        {!isLoading &&
          projects?.map((project) => (
            <ProjectCard
              key={project.id}
              project={project}
              onOpen={(selected) => navigate(`/editor/${selected.slug}`)}
            />
          ))}
      </Box>
    </Stack>
  );
};

export default DashboardPage;
