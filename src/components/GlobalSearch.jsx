import SearchIcon from '@mui/icons-material/Search';
import { Autocomplete, Box, InputAdornment, TextField } from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiClient } from '../lib/apiClient';
import { useAuth } from '../features/auth/useAuth';

// Simple global search across projects. Can be expanded to rooms/views.
export const GlobalSearch = () => {
  const navigate = useNavigate();
  const { org, token } = useAuth();
  const [value, setValue] = useState(null);

  const projectsQuery = useQuery({
    queryKey: ['projects', org?.id, token],
    queryFn: () => (org && token ? apiClient.fetchProjects(org.id, { token }) : Promise.resolve([])),
    enabled: Boolean(org?.id && token),
  });

  const options = useMemo(() => {
    const items = Array.isArray(projectsQuery.data) ? projectsQuery.data : Array.isArray(projectsQuery.data?.items) ? projectsQuery.data.items : [];
    return items.map((p) => ({
      type: 'project',
      id: p.id,
      label: p.name,
      slug: p.slug,
    }));
  }, [projectsQuery.data]);

  return (
    <Box sx={{ minWidth: { xs: 180, sm: 260, md: 360 } }}>
      <Autocomplete
        size="small"
        disableClearable
        options={options}
        value={value}
        isOptionEqualToValue={(a, b) => a?.id === b?.id}
        getOptionLabel={(opt) => opt.label}
        onChange={(_, opt) => {
          setValue(opt);
          if (opt?.type === 'project' && opt.slug) {
            navigate(`/editor/${opt.slug}`);
          }
        }}
        renderInput={(params) => (
          <TextField
            {...params}
            placeholder="Search projects"
            aria-label="Global search"
            InputProps={{
              ...params.InputProps,
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon fontSize="small" />
                </InputAdornment>
              ),
            }}
          />)
        }
      />
    </Box>
  );
};

