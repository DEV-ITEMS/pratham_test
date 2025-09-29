import PublicIcon from '@mui/icons-material/Public';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import VpnKeyIcon from '@mui/icons-material/VpnKey';
import { Button, Card, CardActions, CardContent, Chip, Stack, Typography } from '@mui/material';
import { formatDistanceToNow } from 'date-fns';
import { Project } from '../../lib/types';

interface ProjectCardProps {
  project: Project;
  onOpen?: (project: Project) => void;
}

const visibilityIconMap = {
  PUBLIC: <PublicIcon fontSize="small" />,
  PRIVATE: <VisibilityOffIcon fontSize="small" />,
  INVITE_ONLY: <VpnKeyIcon fontSize="small" />,
};

const visibilityLabelMap: Record<Project['visibility'], string> = {
  PUBLIC: 'Public',
  PRIVATE: 'Private',
  INVITE_ONLY: 'Invite Only',
};

export const ProjectCard = ({ project, onOpen }: ProjectCardProps) => {
  const lastUpdatedLabel = formatDistanceToNow(new Date(project.updatedAt), { addSuffix: true });

  return (
    <Card variant="outlined" sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <CardContent sx={{ flexGrow: 1 }}>
        <Stack spacing={2}>
          <Stack direction="row" spacing={1} alignItems="center">
            <Chip
              size="small"
              icon={visibilityIconMap[project.visibility]}
              label={visibilityLabelMap[project.visibility]}
            />
            {project.portfolio && <Chip size="small" color="primary" label="Portfolio" />}
          </Stack>
          <Typography variant="h6">{project.name}</Typography>
          <Typography variant="body2" color="text.secondary">
            {project.description}
          </Typography>
          <Stack direction="row" spacing={1} flexWrap="wrap">
            {project.tags.map((tag) => (
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
          Open Editor
        </Button>
      </CardActions>
    </Card>
  );
};
