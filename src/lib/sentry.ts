/**
 * Sentry Integration
 * Error tracking and performance monitoring
 */

import * as Sentry from '@sentry/react';
import { BrowserTracing } from '@sentry/tracing';

const SENTRY_DSN = import.meta.env.VITE_SENTRY_DSN;
const APP_ENV = import.meta.env.VITE_APP_ENV || 'development';
const ENABLE_ERROR_TRACKING = import.meta.env.VITE_ENABLE_ERROR_TRACKING === 'true';

export function initSentry() {
  // Only initialize in production or if explicitly enabled
  if (!SENTRY_DSN || (!ENABLE_ERROR_TRACKING && APP_ENV === 'development')) {
    console.log('Sentry disabled in development');
    return;
  }

  Sentry.init({
    dsn: SENTRY_DSN,
    environment: APP_ENV,
    integrations: [
      new BrowserTracing(),
      new Sentry.Replay({
        maskAllText: true,
        blockAllMedia: true,
      }),
    ],

    // Performance Monitoring
    tracesSampleRate: APP_ENV === 'production' ? 0.1 : 1.0,

    // Session Replay
    replaysSessionSampleRate: 0.1,
    replaysOnErrorSampleRate: 1.0,

    // Release tracking
    release: `barbaro-nutrition@${import.meta.env.VITE_APP_VERSION || 'dev'}`,

    // Before send hook to filter sensitive data
    beforeSend(event, hint) {
      // Filter out sensitive information
      if (event.request) {
        delete event.request.cookies;
        
        // Remove sensitive headers
        if (event.request.headers) {
          delete event.request.headers.Authorization;
          delete event.request.headers.Cookie;
        }
      }

      // Don't send errors in development unless explicitly enabled
      if (APP_ENV === 'development' && !ENABLE_ERROR_TRACKING) {
        return null;
      }

      return event;
    },

    // Ignore certain errors
    ignoreErrors: [
      // Browser extensions
      'top.GLOBALS',
      'chrome-extension://',
      'moz-extension://',
      
      // Network errors
      'NetworkError',
      'Network request failed',
      
      // Common user errors
      'ResizeObserver loop limit exceeded',
      'Non-Error promise rejection captured',
    ],
  });

  console.log(`Sentry initialized for ${APP_ENV} environment`);
}

/**
 * Set user context for Sentry
 */
export function setSentryUser(user: { id: string; email?: string; username?: string } | null) {
  if (!SENTRY_DSN) return;

  if (user) {
    Sentry.setUser({
      id: user.id,
      email: user.email,
      username: user.username,
    });
  } else {
    Sentry.setUser(null);
  }
}

/**
 * Add breadcrumb to Sentry
 */
export function addSentryBreadcrumb(message: string, category: string, data?: Record<string, unknown>) {
  if (!SENTRY_DSN) return;

  Sentry.addBreadcrumb({
    message,
    category,
    level: 'info',
    data,
  });
}

/**
 * Capture exception in Sentry
 */
export function captureException(error: Error, context?: Record<string, unknown>) {
  if (!SENTRY_DSN) {
    console.error('Error:', error, context);
    return;
  }

  Sentry.captureException(error, {
    contexts: context ? { custom: context } : undefined,
  });
}

/**
 * Capture message in Sentry
 */
export function captureMessage(message: string, level: Sentry.SeverityLevel = 'info') {
  if (!SENTRY_DSN) {
    console.log(`[${level}] ${message}`);
    return;
  }

  Sentry.captureMessage(message, level);
}
