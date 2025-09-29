import MenuIcon from '@mui/icons-material/Menu';
import NotificationsIcon from '@mui/icons-material/Notifications';
import DarkModeIcon from '@mui/icons-material/DarkMode';
import LightModeIcon from '@mui/icons-material/LightMode';
import ContrastIcon from '@mui/icons-material/Contrast';
import { AppBar, Avatar, Box, IconButton, Stack, Toolbar, Tooltip, Typography } from '@mui/material';
import { useAuth } from '../features/auth/useAuth';
import { GlobalSearch } from './GlobalSearch';
import { useThemeControls } from '../providers/ThemeProvider';

export const AppTopBar = ({ onMenuToggle }) => {
  const { user, org } = useAuth();
  const { mode, highContrast, toggleMode, toggleHighContrast } = useThemeControls();

  return (
    <AppBar position="fixed" color="inherit" elevation={1} sx={{ backdropFilter: 'blur(8px)' }}>
      <Toolbar sx={{ display: 'flex', justifyContent: 'space-between' }}>
        <Stack direction="row" alignItems="center" spacing={2}>
          <Tooltip title="Open navigation" enterDelay={300}>
            <IconButton color="inherit" onClick={onMenuToggle} edge="start" sx={{ mr: 1 }} aria-label="Open navigation menu">
              <MenuIcon />
            </IconButton>
          </Tooltip>
          <Box>
            <Typography variant="h6">{org?.name ?? 'Interior Showcase'}</Typography>
            <Typography variant="caption" color="text.secondary">
              Interior Design Showcase
            </Typography>
          </Box>
        </Stack>
        <Stack direction="row" alignItems="center" spacing={2}>
          <GlobalSearch />
          <Tooltip title={mode === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'} enterDelay={300}>
            <IconButton color="inherit" aria-label="Toggle color mode" onClick={toggleMode}>
              {mode === 'dark' ? <LightModeIcon /> : <DarkModeIcon />}
            </IconButton>
          </Tooltip>
          <Tooltip title={highContrast ? 'Disable high contrast' : 'Enable high contrast'} enterDelay={300}>
            <IconButton color="inherit" aria-label="Toggle high contrast" onClick={toggleHighContrast}>
              <ContrastIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="Notifications" enterDelay={300}>
            <IconButton color="inherit" aria-label="Open notifications">
              <NotificationsIcon />
            </IconButton>
          </Tooltip>
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

