import { Button, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, Stack, TextField, Typography } from '@mui/material';
import { useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { Room, RoomView, UploadResult } from '../../lib/types';

interface UploadPanoramaDialogProps {
  open: boolean;
  onClose: () => void;
  room?: Room & { views: RoomView[] };
  onUploaded?: (result: UploadResult) => void;
}

interface UploadForm {
  name: string;
  file: FileList;
}

const generateId = (prefix: string) => `${prefix}-${Math.random().toString(36).slice(2, 10)}`;

export const UploadPanoramaDialog = ({ open, onClose, room, onUploaded }: UploadPanoramaDialogProps) => {
  const defaultName = useMemo(() => (room ? `${room.name} View ${room.views.length + 1}` : 'New Panorama'), [room]);

  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<UploadForm>({
    defaultValues: { name: defaultName } as Partial<UploadForm>,
  });

  useEffect(() => {
    reset({ name: defaultName } as Partial<UploadForm>);
  }, [defaultName, reset]);

  const handleClose = () => {
    reset({ name: defaultName } as Partial<UploadForm>);
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
      kind: 'PANORAMA' as const,
      url: URL.createObjectURL(file),
      width: dimensions.width,
      height: dimensions.height,
      altText: values.name,
    };

    const view: RoomView = {
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

const readImageDimensions = (file: File): Promise<{ width: number; height: number }> =>
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
