import { CssBaseline, ThemeProvider } from '@mui/material';
import { createContext, useContext, useMemo, useState } from 'react';
import { createMaterialTheme } from '../theme/materialTheme';

const ThemeControlsContext = createContext({
  mode: 'light',
  highContrast: false,
  toggleMode: () => {},
  toggleHighContrast: () => {},
});

export const AppThemeProvider = ({ children }) => {
  const [mode, setMode] = useState('light');
  const [highContrast, setHighContrast] = useState(false);

  const theme = useMemo(() => createMaterialTheme({ mode, highContrast }), [mode, highContrast]);
  const controls = useMemo(
    () => ({
      mode,
      highContrast,
      toggleMode: () => setMode((m) => (m === 'light' ? 'dark' : 'light')),
      toggleHighContrast: () => setHighContrast((v) => !v),
    }),
    [mode, highContrast],
  );

  return (
    <ThemeControlsContext.Provider value={controls}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        {children}
      </ThemeProvider>
    </ThemeControlsContext.Provider>
  );
};

export const useThemeControls = () => useContext(ThemeControlsContext);
