import { Box, IconButton, Paper, Stack, Tooltip, Slide } from '@mui/material';
import { spacing } from '../theme/spacing';

export const ViewerHudRibbon = ({ tabs, activeTab, onTabChange, actions = [], drawerContent }) => {
  const showDrawer = Boolean(drawerContent);

  return (
    <Box
      sx={{
        position: 'absolute',
        left: `${spacing.lg}px`,
        right: `${spacing.lg}px`,
        bottom: `${spacing.lg}px`,
        pointerEvents: 'none',
        zIndex: 2,
      }}
    >
      <Paper
        elevation={0}
        sx={{
          height: '56px',
          borderRadius: `${spacing.lg}px`,
          bgcolor: 'rgba(15,21,34,0.65)',
          color: 'common.white',
          px: `${spacing.md}px`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          pointerEvents: 'auto',
        }}
      >
        <Stack direction="row" spacing={`${spacing.sm}px`}>
          {tabs.map((tab) => (
            <Tooltip key={tab.id} title={tab.label} enterDelay={200}>
              <IconButton
                size="small"
                onClick={() => onTabChange(tab.id === activeTab ? null : tab.id)}
                aria-pressed={tab.id === activeTab}
                aria-label={tab.ariaLabel ?? tab.label}
                sx={{
                  bgcolor: tab.id === activeTab ? 'primary.main' : 'rgba(255,255,255,0.08)',
                  color: tab.id === activeTab ? 'primary.contrastText' : 'common.white',
                  borderRadius: `${spacing.xl}px`,
                }}
              >
                {tab.icon}
              </IconButton>
            </Tooltip>
          ))}
        </Stack>
        <Stack direction="row" spacing={`${spacing.sm}px`}>
          {actions.map((action) => (
            <Tooltip key={action.id} title={action.label} enterDelay={200}>
              <span>
                <IconButton
                  size="small"
                  aria-label={action.label}
                  onClick={action.onClick}
                  disabled={action.disabled}
                  sx={{
                    color: 'common.white',
                    borderRadius: `${spacing.xl}px`,
                    bgcolor: 'rgba(255,255,255,0.08)',
                  }}
                >
                  {action.icon}
                </IconButton>
              </span>
            </Tooltip>
          ))}
        </Stack>
      </Paper>
      <Slide direction="up" in={showDrawer} mountOnEnter unmountOnExit>
        <Paper
          elevation={0}
          sx={{
            mt: `${spacing.xs}px`,
            borderRadius: `${spacing.lg}px`,
            bgcolor: 'background.paper',
            maxHeight: 160,
            overflow: 'auto',
            pointerEvents: 'auto',
            px: `${spacing.md}px`,
            py: `${spacing.sm}px`,
          }}
          aria-live="polite"
        >
          {drawerContent}
        </Paper>
      </Slide>
    </Box>
  );
};
