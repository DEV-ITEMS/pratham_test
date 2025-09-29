import { Button, Stack, Typography } from '@mui/material';
import { useNavigate } from 'react-router-dom';

const NotFoundPage = () => {
  const navigate = useNavigate();
  return (
    <Stack spacing={3} alignItems="center" textAlign="center" sx={{ pt: 12 }}>
      <Typography variant="h3">Page not found</Typography>
      <Typography variant="body1" color="text.secondary" sx={{ maxWidth: 480 }}>
        The view you are trying to access does not exist or has been moved. Use the navigation to get back to the
        showcase.
      </Typography>
      <Button variant="contained" onClick={() => navigate('/editor/modern-flat-tour')}>
        Back to demo editor
      </Button>
    </Stack>
  );
};

export default NotFoundPage;

