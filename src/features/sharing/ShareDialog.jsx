import ShareIcon from '@mui/icons-material/Share';
import { Button, Dialog, DialogContent, DialogTitle } from '@mui/material';
import { useState } from 'react';
import { ShareSettingsPanel } from './ShareSettingsPanel';

export const ShareDialog = ({ project, share, onChange }) => {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button variant="outlined" startIcon={<ShareIcon />} onClick={() => setOpen(true)}>
        Share
      </Button>
      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Share settings</DialogTitle>
        <DialogContent sx={{ pt: 1 }}>
          <ShareSettingsPanel project={project} share={share} onChange={onChange} />
        </DialogContent>
      </Dialog>
    </>
  );
};

