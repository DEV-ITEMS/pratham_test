import { Button, Paper, Stack, Typography } from '@mui/material';

export const EmptyState = ({ title, description, actionLabel, onAction, actionIcon }) => (
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

