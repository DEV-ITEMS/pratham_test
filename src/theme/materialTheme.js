import { createTheme } from '@mui/material/styles';
import { spacing } from './spacing';

const neutralPalette = {
  light: {
    50: '#f9f9fb',
    100: '#f0f1f5',
    200: '#dfe3ea',
    800: '#1f2430',
  },
  dark: {
    50: '#141821',
    100: '#1d2330',
    200: '#2b3243',
    800: '#f5f6fa',
  },
};

export const createMaterialTheme = ({ mode = 'light', highContrast = false } = {}) => {
  const neutrals = neutralPalette[mode === 'dark' ? 'dark' : 'light'];

  return createTheme({
    palette: {
      mode,
      primary: {
        main: '#3f51b5',
      },
      secondary: {
        main: '#7a8194',
      },
      background: {
        default: mode === 'dark' ? '#0f121a' : neutrals[50],
        paper: mode === 'dark' ? neutrals[100] : '#ffffff',
      },
      ...(highContrast
        ? {
            contrastThreshold: 7,
            text: { primary: mode === 'dark' ? '#ffffff' : '#000000' },
          }
        : {}),
      text: {
        primary: mode === 'dark' ? '#f5f6fa' : '#1b1f29',
        secondary: mode === 'dark' ? '#c4c8d4' : '#5c6374',
      },
    },
    typography: {
      fontFamily: '"Inter", "Segoe UI", -apple-system, BlinkMacSystemFont, "Roboto", sans-serif',
      h4: {
        fontWeight: 600,
        fontSize: '1.75rem',
        lineHeight: 1.3,
      },
      h6: {
        fontWeight: 600,
        fontSize: '1rem',
      },
      subtitle1: {
        fontWeight: 500,
        fontSize: '0.95rem',
      },
      subtitle2: {
        fontWeight: 600,
        textTransform: 'uppercase',
        letterSpacing: 0.4,
        fontSize: '0.75rem',
      },
      body1: {
        fontSize: '0.95rem',
      },
      body2: {
        fontSize: '0.85rem',
      },
    },
    shape: {
      borderRadius: 12,
    },
    shadows: Array(25).fill('none'),
    components: {
      MuiButton: {
        defaultProps: {
          disableElevation: true,
        },
        styleOverrides: {
          root: {
            textTransform: 'none',
            borderRadius: spacing.sm,
          },
        },
      },
      MuiCard: {
        styleOverrides: {
          root: {
            borderRadius: 16,
            border: `1px solid ${neutrals[200]}`,
          },
        },
      },
      MuiPaper: {
        styleOverrides: {
          root: {
            backgroundImage: 'none',
            borderRadius: spacing.md,
          },
        },
      },
      MuiTabs: {
        styleOverrides: {
          root: {
            minHeight: 48,
          },
          indicator: {
            borderRadius: 999,
          },
        },
      },
      MuiTab: {
        styleOverrides: {
          root: {
            textTransform: 'none',
            minHeight: 48,
            fontWeight: 600,
          },
        },
      },
      MuiChip: {
        styleOverrides: {
          root: {
            borderRadius: 999,
          },
        },
      },
      MuiDialog: {
        styleOverrides: {
          paper: {
            borderRadius: spacing.lg,
            border: `1px solid ${neutrals[200]}`,
          },
        },
      },
    },
  });
};
