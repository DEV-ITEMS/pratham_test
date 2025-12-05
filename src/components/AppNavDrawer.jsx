import DashboardIcon from '@mui/icons-material/Dashboard';
import LayersIcon from '@mui/icons-material/Layers';
import PublicIcon from '@mui/icons-material/Public';
import WorkspacesIcon from '@mui/icons-material/Workspaces';
import { Divider, Drawer, IconButton, List, ListItemButton, ListItemIcon, ListItemText, Stack, Typography, Toolbar } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../features/auth/useAuth';

export const APP_NAV_WIDTH = 280;

export const AppNavDrawer = ({ open, onClose }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { org, seatUsage } = useAuth();

  const items = [
    { icon: <DashboardIcon />, label: 'Dashboard', path: '/dashboard' },
    { icon: <LayersIcon />, label: 'Modern Flat Editor', path: '/editor/modern-flat-tour' },
    { icon: <WorkspacesIcon />, label: 'Portfolio', path: `/portfolio/${org?.slug ?? 'demo-interiors'}` },
    { icon: <PublicIcon />, label: 'Public Viewer', path: '/p/modern-flat-tour' },
  ];

  return (
    <Drawer
      variant="temporary"
      open={open}
      onClose={onClose}
      ModalProps={{ keepMounted: true }}
      sx={{
        '& .MuiDrawer-paper': {
          width: APP_NAV_WIDTH,
          boxSizing: 'border-box',
          borderRight: 0,
        },
      }}
    >
      {/* Offset for the fixed AppBar */}
      <Toolbar />
      <Stack spacing={2} sx={{ p: 3 }}>
        <Typography variant="subtitle2" color="text.secondary">
          Workspace
        </Typography>
        <Stack direction="row" alignItems="center" justifyContent="space-between">
          <Typography variant="h6">{org?.name}</Typography>
          <IconButton
            aria-label="Close navigation"
            onClick={onClose}
            size="small"
            sx={{ display: 'inline-flex' }}
          >
            <CloseIcon fontSize="small" />
          </IconButton>
        </Stack>
        {seatUsage && (
          <Typography variant="body2" color="text.secondary">
            Seats used {seatUsage.used}/{seatUsage.used + seatUsage.available}
          </Typography>
        )}
      </Stack>
      <Divider />
      <List>
        {items.map((item) => (
          <ListItemButton
            key={item.path}
            selected={location.pathname.startsWith(item.path)}
            onClick={() => {
              navigate(item.path);
              onClose();
            }}
          >
            <ListItemIcon>{item.icon}</ListItemIcon>
            <ListItemText primary={item.label} />
          </ListItemButton>
        ))}
      </List>
    </Drawer>
  );
};
