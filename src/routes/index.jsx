import { useState } from 'react';
import { BrowserRouter, Navigate, Outlet, Route, Routes } from 'react-router-dom';
import { Box, Toolbar } from '@mui/material';
import { AppTopBar } from '../components/AppTopBar';
import { AppNavDrawer, APP_NAV_WIDTH } from '../components/AppNavDrawer';
import { ProtectedRoute } from './ProtectedRoute';
import DashboardPage from '../pages/DashboardPage';
import EditorShellPage from '../pages/EditorShellPage';
import NotFoundPage from '../pages/NotFoundPage';
import LoginPage from '../pages/LoginPage';
import { PortfolioLanding } from '../features/portfolio/PortfolioLanding';
import { PublicProjectViewer } from '../features/viewer360/PublicProjectViewer';
import { AppBreadcrumbs } from '../components/AppBreadcrumbs';

const AppLayout = () => {
  const [drawerOpen, setDrawerOpen] = useState(true);

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: 'background.default' }}>
      <AppTopBar onMenuToggle={() => setDrawerOpen((open) => !open)} />
      <AppNavDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} />
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          ml: { md: drawerOpen ? `${APP_NAV_WIDTH}px` : 0 },
          transition: (theme) => theme.transitions.create('margin', { duration: theme.transitions.duration.short }),
        }}
      >
        <Toolbar />
        <AppBreadcrumbs />
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
