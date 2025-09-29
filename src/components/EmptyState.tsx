import { Button, Paper, Stack, Typography } from '@mui/material';
import { ReactNode } from 'react';

interface EmptyStateProps {
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  actionIcon?: ReactNode;
}

export const EmptyState = ({ title, description, actionLabel, onAction, actionIcon }: EmptyStateProps) => (
  <Paper sx={{ p: 6, textAlign: 'center', borderStyle: 'dashed', borderColor: 'divider' }}>
    <Stack spacing={2} alignItems="center">
      <Typography variant="h6">{title}</Typography>
      <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 420 }}>
        {description}
      </Typography>
      {actionLabel && onAction && (
        <Button variant="contained" onClick={onAction} startIcon={actionIcon}>
          {actionLabel}
        </Button>
      )}
    </Stack>
  </Paper>
);
