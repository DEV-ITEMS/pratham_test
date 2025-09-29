import { Button, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, Stack, TextField, Typography } from '@mui/material';
import { useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';

const generateId = (prefix) => `${prefix}-${Math.random().toString(36).slice(2, 10)}`;

export const UploadPanoramaDialog = ({ open, onClose, room, onUploaded }) => {
  const defaultName = useMemo(() => (room ? `${room.name} View ${room.views.length + 1}` : 'New Panorama'), [room]);

  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useForm({
    defaultValues: { name: defaultName },
  });

  useEffect(() => {
    reset({ name: defaultName });
  }, [defaultName, reset]);

  const handleClose = () => {
    reset({ name: defaultName });
    onClose();
  };

  const onSubmit = handleSubmit(async (values) => {
    const file = values.file?.[0];
    if (!file) {
      setError('file', { message: 'Panorama file is required.' });
      return;
    }

    const dimensions = await readImageDimensions(file).catch(() => null);
    if (!dimensions) {
      setError('file', { message: 'Unable to read image dimensions.' });
      return;
    }

    const ratio = dimensions.width / dimensions.height;
    if (Math.abs(ratio - 2) > 0.05) {
      setError('file', { message: 'Panorama must have a 2:1 aspect ratio.' });
      return;
    }

    if (dimensions.width < 8000 || dimensions.height < 4000) {
      setError('file', { message: 'Panorama must be at least 8000x4000 pixels.' });
      return;
    }

    const assetId = generateId('asset-upload');
    const viewId = generateId('view-upload');
    const asset = {
      id: assetId,
      kind: 'PANORAMA',
      url: URL.createObjectURL(file),
      width: dimensions.width,
      height: dimensions.height,
      altText: values.name,
    };

    const view = {
      id: viewId,
      roomId: room?.id ?? 'room-temp',
      name: values.name,
      panoramaAssetId: assetId,
      description: 'Uploaded panorama (mock).',
      defaultYaw: 180,
      defaultPitch: 0,
      compass: 0,
      createdAt: new Date().toISOString(),
    };

    onUploaded?.({ asset, view });
    handleClose();
  });

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>Upload Panorama</DialogTitle>
      <DialogContent>
        <DialogContentText sx={{ mb: 3 }}>
          Upload a 360° panorama (2:1 aspect ratio, minimum 8000x4000). This upload is mocked and stored in memory only.
        </DialogContentText>
        <Stack spacing={2}>
          <TextField
            label="View Name"
            fullWidth
            {...register('name', { required: 'Name is required', minLength: { value: 3, message: 'Name too short' } })}
            error={Boolean(errors.name)}
            helperText={errors.name?.message}
          />
          <Button component="label" variant="outlined">
            Select Panorama
            <input hidden accept="image/*" type="file" {...register('file')} />
          </Button>
          {errors.file && (
            <Typography variant="caption" color="error">
              {errors.file.message}
            </Typography>
          )}
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose}>Cancel</Button>
        <Button onClick={onSubmit} disabled={isSubmitting} variant="contained">
          Validate
        </Button>
      </DialogActions>
    </Dialog>
  );
};

const readImageDimensions = (file) =>
  new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const image = new Image();
    image.onload = () => {
      resolve({ width: image.width, height: image.height });
      URL.revokeObjectURL(url);
    };
    image.onerror = (error) => {
      URL.revokeObjectURL(url);
      reject(error);
    };
    image.src = url;
  });

