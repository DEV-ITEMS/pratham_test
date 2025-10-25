import ShareIcon from '@mui/icons-material/Share';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import IosShareIcon from '@mui/icons-material/IosShare';
import { Button, Dialog, DialogActions, DialogContent, DialogTitle } from '@mui/material';
import { useMemo, useState } from 'react';
import { ShareSettingsPanel } from './ShareSettingsPanel';
import { spacing } from '../../theme/spacing';

export const ShareDialog = ({ project, share, onChange, open, onClose }) => {
  const isControlled = typeof open === 'boolean';
  const [internalOpen, setInternalOpen] = useState(false);
  const dialogOpen = isControlled ? open : internalOpen;
  const [copyLabel, setCopyLabel] = useState('Copy Link');
  const shareUrl = useMemo(() => (project ? `${window.location.origin}/p/${project.slug}` : window.location.href), [project]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopyLabel('Copied');
      setTimeout(() => setCopyLabel('Copy Link'), 1500);
    } catch {
      setCopyLabel('Link Ready');
      setTimeout(() => setCopyLabel('Copy Link'), 1500);
    }
  };

  const handleSystemShare = () => {
    if (navigator.share) {
      navigator.share({ title: project?.name ?? 'Interior Showcase', url: shareUrl }).catch(() => {});
    } else {
      window.open(shareUrl, '_blank', 'noopener');
    }
  };

  const handleOpen = () => {
    if (isControlled) return;
    setInternalOpen(true);
  };

  const handleClose = () => {
    if (isControlled) {
      onClose?.();
    } else {
      setInternalOpen(false);
    }
  };

  return (
    <>
      {!isControlled && (
        <Button variant="outlined" startIcon={<ShareIcon />} onClick={handleOpen} sx={{ borderRadius: `${spacing.md}px` }}>
          Share
        </Button>
      )}
      <Dialog open={dialogOpen} onClose={handleClose} maxWidth="sm" fullWidth>
        <DialogTitle>Share settings</DialogTitle>
        <DialogContent sx={{ pt: `${spacing.sm}px` }}>
          <ShareSettingsPanel project={project} share={share} onChange={onChange} />
        </DialogContent>
        <DialogActions sx={{ px: `${spacing.md}px`, pb: `${spacing.sm}px` }}>
          <Button startIcon={<ContentCopyIcon />} onClick={handleCopy} aria-label="Copy share link">
            {copyLabel}
          </Button>
          <Button variant="contained" startIcon={<IosShareIcon />} onClick={handleSystemShare} aria-label="Share project">
            Share Externally
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};
