import { CssBaseline, ThemeProvider } from '@mui/material';
import { PropsWithChildren } from 'react';
import { materialTheme } from '../theme/materialTheme';

export const AppThemeProvider = ({ children }: PropsWithChildren) => (
  <ThemeProvider theme={materialTheme}>
    <CssBaseline />
    {children}
  </ThemeProvider>
);
