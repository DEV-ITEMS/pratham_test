import LockIcon from '@mui/icons-material/Lock';
import LockOpenIcon from '@mui/icons-material/LockOpen';
import MailIcon from '@mui/icons-material/Mail';
import { Chip, FormControl, FormControlLabel, Radio, RadioGroup, Stack, Typography } from '@mui/material';
import { Project, ProjectSharing, ShareRestriction } from '../../lib/types';

interface ShareSettingsPanelProps {
  project: Project;
  share: ProjectSharing;
  onChange: (payload: Partial<ProjectSharing>) => Promise<void> | void;
}

const restrictionLabels: Record<ShareRestriction, string> = {
  PUBLIC: 'Public',
  PRIVATE: 'Private',
  INVITE_ONLY: 'Invite Only',
};

export const ShareSettingsPanel = ({ project, share, onChange }: ShareSettingsPanelProps) => (
  <Stack spacing={1}>
    <Stack direction="row" spacing={1} alignItems="center">
      <Typography variant="subtitle2">Sharing</Typography>
      <Chip size="small" icon={share.restriction === 'PUBLIC' ? <LockOpenIcon fontSize="small" /> : <LockIcon fontSize="small" />} label={restrictionLabels[share.restriction]} />
    </Stack>
    <Typography variant="body2" color="text.secondary">
      Control how {project.name} is shared with clients.
    </Typography>
    <FormControl component="fieldset" sx={{ mt: 1 }}>
      <RadioGroup
        value={share.restriction}
        onChange={async (event) => {
          await onChange({ restriction: event.target.value as ShareRestriction });
        }}
      >
        <FormControlLabel value="PUBLIC" control={<Radio />} label="Public – accessible via link" />
        <FormControlLabel value="INVITE_ONLY" control={<Radio />} label="Invite only – specific emails" />
        <FormControlLabel value="PRIVATE" control={<Radio />} label="Private – internal team only" />
      </RadioGroup>
    </FormControl>
    {share.invitees.length > 0 && (
      <Stack spacing={0.5}>
        <Stack direction="row" spacing={1} alignItems="center">
          <MailIcon fontSize="small" color="action" />
          <Typography variant="body2">Invitees</Typography>
        </Stack>
        <Stack direction="row" spacing={1} flexWrap="wrap">
          {share.invitees.map((invitee) => (
            <Chip key={invitee} size="small" variant="outlined" label={invitee} />
          ))}
        </Stack>
      </Stack>
    )}
  </Stack>
);
