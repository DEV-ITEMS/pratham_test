import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  MenuItem,
  Stack,
  Switch,
  TextField,
  Typography,
} from '@mui/material';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';

const defaultValues = {
  name: '',
  description: '',
  visibility: 'PRIVATE',
  portfolio: false,
  tags: '',
};

export const CreateProjectDialog = ({ open, onClose, onSubmit, isSubmitting, errorMessage }) => {
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setError,
    clearErrors,
  } = useForm({
    defaultValues,
  });

  useEffect(() => {
    if (!open) {
      reset(defaultValues);
    }
  }, [open, reset]);

  useEffect(() => {
    if (!errorMessage) return;
    // If we can detect slug conflict messaging, attach to name for now.
    if (/slug/i.test(errorMessage)) {
      setError('name', { message: 'Slug already exists. Try a different name.' });
    } else {
      clearErrors('name');
    }
  }, [errorMessage, setError, clearErrors]);

  const submit = handleSubmit((values) => {
    if (!values.name || values.name.trim().length < 2) {
      setError('name', { message: 'Name is required' });
      return;
    }
    const tags = values.tags
      ? values.tags
          .split(',')
          .map((t) => t.trim())
          .filter(Boolean)
      : [];
    onSubmit({
      name: values.name,
      description: values.description || undefined,
      visibility: values.visibility,
      portfolio: values.portfolio,
      tags,
    });
  });

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>Create project</DialogTitle>
      <DialogContent sx={{ pt: 2 }}>
        <Stack spacing={2}>
          <TextField
            label="Name"
            fullWidth
            required
            disabled={isSubmitting}
            error={Boolean(errors.name)}
            helperText={errors.name?.message}
            {...register('name')}
          />
          <TextField
            label="Description"
            fullWidth
            multiline
            minRows={2}
            disabled={isSubmitting}
            error={Boolean(errors.description)}
            helperText={errors.description?.message}
            {...register('description')}
          />
          <TextField
            label="Visibility"
            select
            fullWidth
            disabled={isSubmitting}
            error={Boolean(errors.visibility)}
            helperText={errors.visibility?.message}
            defaultValue="PRIVATE"
            {...register('visibility')}
          >
            <MenuItem value="PRIVATE">Private</MenuItem>
            <MenuItem value="INVITE_ONLY">Invite Only</MenuItem>
            <MenuItem value="PUBLIC">Public</MenuItem>
          </TextField>
          <FormControlLabel
            control={<Switch color="primary" disabled={isSubmitting} {...register('portfolio')} />}
            label="Show in portfolio"
          />
          <TextField
            label="Tags"
            fullWidth
            placeholder="Comma-separated, e.g. lobby,interior"
            disabled={isSubmitting}
            error={Boolean(errors.tags)}
            helperText={errors.tags?.message ?? 'Optional'}
            {...register('tags')}
          />
          {errorMessage && (
            <Typography variant="body2" color="error">
              {errorMessage}
            </Typography>
          )}
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={isSubmitting}>
          Cancel
        </Button>
        <Button onClick={submit} variant="contained" disabled={isSubmitting}>
          {isSubmitting ? 'Creating…' : 'Create project'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};
