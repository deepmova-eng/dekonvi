import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { HelmetProvider } from 'react-helmet-async';
import * as Sentry from "@sentry/react";
import { SupabaseProvider } from './contexts/SupabaseContext';
import { NotificationsProvider } from './contexts/NotificationsContext';
import { ErrorFallback } from './components/ErrorFallback';
import App from './App';
import './index.css';
import './premium-ui.css';

import { FavoritesProvider } from './contexts/FavoritesContext';

import { reportWebVitals } from './lib/vitals';

// Initialiser Sentry
if (import.meta.env.PROD) {
  Sentry.init({
    dsn: import.meta.env.VITE_SENTRY_DSN,
    environment: import.meta.env.VITE_SENTRY_ENVIRONMENT || 'development',
    enabled: import.meta.env.PROD, // Désactivé en dev

    // Configuration basique qui marche
    integrations: [
      Sentry.browserTracingIntegration(),
      Sentry.replayIntegration({
        maskAllText: true,
        blockAllMedia: true,
      }),
    ],

    // Performance Monitoring
    tracesSampleRate: 1.0,
    tracePropagationTargets: ["localhost", /^https:\/\/yourserver\.io\/api/],

    // Session Replay
    replaysSessionSampleRate: 0.1,
    replaysOnErrorSampleRate: 1.0,

    beforeSend(event) {
      // Ne pas envoyer les erreurs en dev
      if (import.meta.env.DEV) return null;
      return event;
    },
  });

  // Report Web Vitals
  reportWebVitals();
}

// Configurer QueryClient
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes (données "fresh")
      gcTime: 1000 * 60 * 30, // 30 minutes (garde en cache)
      refetchOnWindowFocus: false, // Ne pas refetch au focus
      refetchOnReconnect: true, // Refetch à la reconnexion
      retry: 3, // 3 tentatives en cas d'erreur
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    },
    mutations: {
      retry: 1, // 1 retry pour les mutations
    },
  },
});

const root = document.getElementById('root');
if (!root) throw new Error('Root element not found');

createRoot(root).render(
  <StrictMode>
    <HelmetProvider>
      <Sentry.ErrorBoundary
        fallback={({ error, resetError, eventId }) => (
          <ErrorFallback error={error as Error} resetError={resetError} eventId={eventId} />
        )}
        showDialog
      >
        <QueryClientProvider client={queryClient}>
          <BrowserRouter>
            <SupabaseProvider>
              <NotificationsProvider>
                <FavoritesProvider>
                  <App />
                  <Toaster
                    position="top-right"
                    toastOptions={{
                      duration: 3000,
                      style: {
                        background: '#363636',
                        color: '#fff',
                      },
                    }}
                  />
                </FavoritesProvider>
              </NotificationsProvider>
            </SupabaseProvider>
          </BrowserRouter>
          {/* DevTools - uniquement en dev */}
          {import.meta.env.DEV && (
            <ReactQueryDevtools
              initialIsOpen={false}
              buttonPosition="bottom-right"
            />
          )}
        </QueryClientProvider>
      </Sentry.ErrorBoundary>
    </HelmetProvider>
  </StrictMode>
);