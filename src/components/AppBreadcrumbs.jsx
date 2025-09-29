import NavigateNextIcon from '@mui/icons-material/NavigateNext';
import { Breadcrumbs, Link as MUILink, Typography } from '@mui/material';
import { useMemo } from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';

const segmentLabel = (segment) => {
  switch (segment) {
    case 'dashboard':
      return 'Dashboard';
    case 'editor':
      return 'Editor';
    case 'portfolio':
      return 'Portfolio';
    case 'p':
      return 'Public';
    default:
      return decodeURIComponent(segment);
  }
};

export const AppBreadcrumbs = () => {
  const location = useLocation();
  const params = useParams();

  const crumbs = useMemo(() => {
    const pathnames = location.pathname.split('/').filter(Boolean);
    const items = pathnames.map((segment, index) => {
      const to = '/' + pathnames.slice(0, index + 1).join('/');
      return { label: segmentLabel(segment), to };
    });
    // Replace slug labels with more friendly ones when available
    if (params.projectSlug) {
      items.forEach((item) => {
        if (item.label === params.projectSlug) item.label = 'Project';
      });
    }
    if (params.orgSlug) {
      items.forEach((item) => {
        if (item.label === params.orgSlug) item.label = 'Organization';
      });
    }
    return items;
  }, [location.pathname, params]);

  if (crumbs.length === 0) return null;

  return (
    <Breadcrumbs separator={<NavigateNextIcon fontSize="small" />} aria-label="breadcrumb" sx={{ mb: 2 }}>
      <MUILink component={Link} underline="hover" color="inherit" to="/dashboard">
        Home
      </MUILink>
      {crumbs.map((crumb, index) => {
        const isLast = index === crumbs.length - 1;
        return isLast ? (
          <Typography color="text.primary" key={crumb.to}>
            {crumb.label}
          </Typography>
        ) : (
          <MUILink component={Link} underline="hover" color="inherit" to={crumb.to} key={crumb.to}>
            {crumb.label}
          </MUILink>
        );
      })}
    </Breadcrumbs>
  );
};

