import { useState } from 'react';
import { BrowserRouter, Navigate, Outlet, Route, Routes } from 'react-router-dom';
import { Box, Toolbar } from '@mui/material';
import { AppTopBar } from '../components/AppTopBar';
import { AppNavDrawer } from '../components/AppNavDrawer';
import { ProtectedRoute } from './ProtectedRoute';
import DashboardPage from '../pages/DashboardPage';
import EditorShellPage from '../pages/EditorShellPage';
import NotFoundPage from '../pages/NotFoundPage';
import LoginPage from '../pages/LoginPage';
import { PortfolioLanding } from '../features/portfolio/PortfolioLanding';
import { PublicProjectViewer } from '../features/viewer360/PublicProjectViewer';
import { spacing } from '../theme/spacing';

const AppLayout = () => {
  const [drawerOpen, setDrawerOpen] = useState(() => {
    try {
      return localStorage.getItem('drawerOpen') !== '0';
    } catch {
      return true;
    }
  });

  const handleToggleDrawer = () =>
    setDrawerOpen((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('drawerOpen', next ? '1' : '0');
      } catch {}
      return next;
    });

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: 'background.default' }}>
      <AppTopBar onMenuToggle={handleToggleDrawer} />
      <AppNavDrawer
        open={drawerOpen}
        onClose={() => {
          try {
            localStorage.setItem('drawerOpen', '0');
          } catch {}
          setDrawerOpen(false);
        }}
      />
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          display: 'flex',
          flexDirection: 'column',
          minHeight: '100vh',
          bgcolor: 'background.default',
          px: { xs: `${spacing.sm}px`, md: `${spacing.lg}px` },
          py: { xs: `${spacing.md}px`, md: `${spacing.lg}px` },
          transition: (theme) => theme.transitions.create(['padding'], { duration: theme.transitions.duration.shorter }),
        }}
      >
        <Toolbar />
        <Outlet />
      </Box>
    </Box>
  );
};

export const AppRoutes = () => (
  <BrowserRouter>
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route element={<AppLayout />}>
        <Route index element={<Navigate to="/editor/modern-flat-tour" replace />} />
        <Route
          path="dashboard"
          element={
            <ProtectedRoute>
              <DashboardPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="editor/:projectSlug/*"
          element={
            <ProtectedRoute>
              <EditorShellPage />
            </ProtectedRoute>
          }
        />
        <Route path="portfolio/:orgSlug" element={<PortfolioLanding />} />
        <Route path="p/:projectSlug" element={<PublicProjectViewer />} />
      </Route>
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  </BrowserRouter>
);
