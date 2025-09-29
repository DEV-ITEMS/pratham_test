import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { AppThemeProvider } from './providers/ThemeProvider';
import { AppQueryProvider } from './providers/QueryProvider';
import { AuthProvider } from './providers/AuthProvider';

const rootElement = document.getElementById('root');

if (!rootElement) {
  throw new Error('Root element not found');
}

ReactDOM.createRoot(rootElement).render(
  <React.StrictMode>
    <AppThemeProvider>
      <AppQueryProvider>
        <AuthProvider>
          <App />
        </AuthProvider>
      </AppQueryProvider>
    </AppThemeProvider>
  </React.StrictMode>,
);
