import { CssBaseline, ThemeProvider } from '@mui/material';
import { materialTheme } from '../theme/materialTheme';

export const AppThemeProvider = ({ children }) => (
  <ThemeProvider theme={materialTheme}>
    <CssBaseline />
    {children}
  </ThemeProvider>
);
