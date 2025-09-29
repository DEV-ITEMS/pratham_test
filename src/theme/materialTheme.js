import { createTheme } from '@mui/material/styles';

export const createMaterialTheme = ({ mode = 'light', highContrast = false } = {}) =>
  createTheme({
    palette: {
      mode,
      primary: {
        main: '#3f51b5',
      },
      secondary: {
        main: '#ff9800',
      },
      background: {
        default: mode === 'dark' ? '#0b0e14' : '#f4f6f8',
        paper: mode === 'dark' ? '#111827' : '#ffffff',
      },
      ...(highContrast
        ? {
            contrastThreshold: 7,
            text: { primary: mode === 'dark' ? '#ffffff' : '#000000' },
          }
        : {}),
    },
    typography: {
      fontFamily: '"Inter", "Segoe UI", -apple-system, BlinkMacSystemFont, "Roboto", sans-serif',
      h6: {
        fontWeight: 600,
      },
      subtitle2: {
        fontWeight: 600,
        textTransform: 'uppercase',
        letterSpacing: 0.6,
        fontSize: '0.75rem',
      },
    },
    shape: {
      borderRadius: 12,
    },
    components: {
      MuiButton: {
        defaultProps: {
          disableElevation: true,
        },
        styleOverrides: {
          root: {
            textTransform: 'none',
          },
        },
      },
      MuiCard: {
        styleOverrides: {
          root: {
            borderRadius: 16,
          },
        },
      },
    },
  });
