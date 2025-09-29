import DashboardIcon from '@mui/icons-material/Dashboard';
import LayersIcon from '@mui/icons-material/Layers';
import PublicIcon from '@mui/icons-material/Public';
import WorkspacesIcon from '@mui/icons-material/Workspaces';
import { Divider, Drawer, List, ListItemButton, ListItemIcon, ListItemText, Stack, Typography } from '@mui/material';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../features/auth/useAuth';

export const APP_NAV_WIDTH = 280;

interface AppNavDrawerProps {
  open: boolean;
  onClose: () => void;
}

export const AppNavDrawer = ({ open, onClose }: AppNavDrawerProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { org, seatUsage } = useAuth();

  const items = [
    {
      icon: <DashboardIcon />,
      label: 'Dashboard',
      path: '/dashboard',
    },
    {
      icon: <LayersIcon />,
      label: 'Modern Flat Editor',
      path: '/editor/modern-flat-tour',
    },
    {
      icon: <WorkspacesIcon />,
      label: 'Portfolio',
      path: `/portfolio/${org?.slug ?? 'demo-interiors'}`,
    },
    {
      icon: <PublicIcon />,
      label: 'Public Viewer',
      path: '/p/modern-flat-tour',
    },
  ];

  return (
    <Drawer
      variant="persistent"
      open={open}
      onClose={onClose}
      sx={{
        width: APP_NAV_WIDTH,
        flexShrink: 0,
        '& .MuiDrawer-paper': {
          width: APP_NAV_WIDTH,
          boxSizing: 'border-box',
          borderRight: 0,
        },
      }}
    >
      <Stack spacing={2} sx={{ p: 3 }}>
        <Typography variant="subtitle2" color="text.secondary">
          Workspace
        </Typography>
        <Typography variant="h6">{org?.name}</Typography>
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
