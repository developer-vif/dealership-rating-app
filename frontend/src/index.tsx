import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { GoogleReCaptchaProvider } from 'react-google-recaptcha-v3';

import App from './App';
import theme from './theme';
import { AuthProvider } from './contexts/AuthContext';
import './index.css';

// Suppress CoreLocation console errors
const originalConsoleError = console.error;
console.error = (...args) => {
  const message = args[0];
  if (typeof message === 'string' && message.includes('kCLErrorLocationUnknown')) {
    // Suppress CoreLocation errors to avoid user confusion
    console.warn('Location service temporarily unavailable. This is normal and the app will continue to work.');
    return;
  }
  originalConsoleError.apply(console, args);
};

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);

root.render(
  <React.StrictMode>
    <GoogleReCaptchaProvider
      reCaptchaKey={process.env.REACT_APP_RECAPTCHA_SITE_KEY || ''}
    >
      <QueryClientProvider client={queryClient}>
        <ThemeProvider theme={theme}>
          <CssBaseline />
          <AuthProvider>
            <BrowserRouter>
              <App />
            </BrowserRouter>
          </AuthProvider>
        </ThemeProvider>
      </QueryClientProvider>
    </GoogleReCaptchaProvider>
  </React.StrictMode>
);