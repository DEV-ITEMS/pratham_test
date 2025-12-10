import PublicIcon from '@mui/icons-material/Public';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import VpnKeyIcon from '@mui/icons-material/VpnKey';
import { Button, Card, CardActions, CardContent, Chip, Stack, Typography } from '@mui/material';
import { formatDistanceToNow } from 'date-fns';

const visibilityIconMap = {
  PUBLIC: <PublicIcon fontSize="small" />,
  PRIVATE: <VisibilityOffIcon fontSize="small" />,
  INVITE_ONLY: <VpnKeyIcon fontSize="small" />,
};

const visibilityLabelMap = {
  PUBLIC: 'Public',
  PRIVATE: 'Private',
  INVITE_ONLY: 'Invite Only',
};

export const ProjectCard = ({ project, onOpen, ctaLabel = 'Open Editor' }) => {
  const updatedAt = project?.updatedAt ? new Date(project.updatedAt) : null;
  const hasValidDate = updatedAt instanceof Date && !Number.isNaN(updatedAt?.getTime?.());
  const lastUpdatedLabel = hasValidDate ? formatDistanceToNow(updatedAt, { addSuffix: true }) : 'Unknown';
  const tags = Array.isArray(project?.tags) ? project.tags : [];
  const visibility = project?.visibility ?? 'PRIVATE';

  return (
    <Card variant="outlined" sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <CardContent sx={{ flexGrow: 1 }}>
        <Stack spacing={2}>
          <Stack direction="row" spacing={1} alignItems="center">
            <Chip
              size="small"
              icon={visibilityIconMap[visibility]}
              label={visibilityLabelMap[visibility] ?? visibility}
            />
            {project.portfolio && <Chip size="small" color="primary" label="Portfolio" />}
          </Stack>
          <Typography variant="h6">{project.name}</Typography>
          <Typography variant="body2" color="text.secondary">
            {project.description}
          </Typography>
          <Stack direction="row" spacing={1} flexWrap="wrap">
            {tags.map((tag) => (
              <Chip key={tag} size="small" variant="outlined" label={tag} />
            ))}
          </Stack>
          <Typography variant="caption" color="text.secondary">
            Updated {lastUpdatedLabel}
          </Typography>
        </Stack>
      </CardContent>
      <CardActions sx={{ justifyContent: 'flex-end', p: 2 }}>
        <Button variant="contained" onClick={() => onOpen?.(project)}>
          {ctaLabel}
        </Button>
      </CardActions>
    </Card>
  );
};
