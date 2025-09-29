import MenuIcon from '@mui/icons-material/Menu';
import NotificationsIcon from '@mui/icons-material/Notifications';
import { AppBar, Avatar, Box, IconButton, Stack, Toolbar, Typography } from '@mui/material';
import { useAuth } from '../features/auth/useAuth';

export const AppTopBar = ({ onMenuToggle }) => {
  const { user, org } = useAuth();

  return (
    <AppBar position="fixed" color="inherit" elevation={1} sx={{ backdropFilter: 'blur(8px)' }}>
      <Toolbar sx={{ display: 'flex', justifyContent: 'space-between' }}>
        <Stack direction="row" alignItems="center" spacing={2}>
          <IconButton color="inherit" onClick={onMenuToggle} edge="start" sx={{ mr: 1 }}>
            <MenuIcon />
          </IconButton>
          <Box>
            <Typography variant="h6">{org?.name ?? 'Interior Showcase'}</Typography>
            <Typography variant="caption" color="text.secondary">
              Interior Design Showcase
            </Typography>
          </Box>
        </Stack>
        <Stack direction="row" alignItems="center" spacing={2}>
          <IconButton color="inherit">
            <NotificationsIcon />
          </IconButton>
          <Stack direction="row" spacing={1} alignItems="center">
            <Box textAlign="right">
              <Typography variant="body2" fontWeight={600}>
                {user?.name ?? 'Guest'}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {user?.role ?? 'Viewer'}
              </Typography>
            </Box>
            <Avatar src={user?.avatarUrl}>{user?.name?.[0]}</Avatar>
          </Stack>
        </Stack>
      </Toolbar>
    </AppBar>
  );
};

