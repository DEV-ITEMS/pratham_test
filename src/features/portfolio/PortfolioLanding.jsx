import { Box, Container, Skeleton, Stack, Typography } from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import { useParams, useNavigate } from 'react-router-dom';
import { ProjectCard } from '../projects/ProjectCard';
import { apiClient } from '../../lib/apiClient';

export const PortfolioLanding = () => {
  const { orgSlug = '' } = useParams();
  const navigate = useNavigate();

  const orgQuery = useQuery({
    queryKey: ['org', orgSlug],
    queryFn: () => apiClient.fetchOrgBySlug(orgSlug),
  });

  const portfolioQuery = useQuery({
    queryKey: ['portfolio', orgSlug],
    queryFn: async () => {
      const org = await apiClient.fetchOrgBySlug(orgSlug);
      if (!org) {
        return [];
      }
      return apiClient.fetchPortfolioProjects(org.id);
    },
  });

  return (
    <Box sx={{ bgcolor: 'background.default', minHeight: '100vh', py: 10 }}>
      <Container maxWidth='lg'>
        <Stack spacing={2} textAlign='center' sx={{ mb: 6 }}>
          <Typography variant='subtitle2' color='primary'>
            Portfolio
          </Typography>
          <Typography variant='h3'>
            {orgQuery.data ? `${orgQuery.data.name} Showcase` : 'Loading portfolio'}
          </Typography>
          <Typography variant='body1' color='text.secondary'>
            Explore publicly published interior design projects curated by the firm.
          </Typography>
        </Stack>
        <Box
          sx={{
            display: 'grid',
            gap: 4,
            gridTemplateColumns: { xs: '1fr', md: 'repeat(3, minmax(0, 1fr))' },
          }}
        >
          {portfolioQuery.isLoading &&
            Array.from({ length: 3 }).map((_, index) => (
              <Skeleton key={index} variant='rounded' height={220} />
            ))}
          {!portfolioQuery.isLoading &&
            (portfolioQuery.data?.length ? (
              portfolioQuery.data.map((project) => (
                <ProjectCard
                  key={project.id}
                  project={project}
                  onOpen={() => navigate(`/p/${project.slug}`)}
                />
              ))
            ) : (
              <Typography variant='body1' color='text.secondary' textAlign='center'>
                No portfolio projects are published yet.
              </Typography>
            ))}
        </Box>
      </Container>
    </Box>
  );
};

