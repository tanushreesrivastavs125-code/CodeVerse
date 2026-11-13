/**
 * Client environment configuration module.
 * Safely accesses Vite environment variables with fallback defaults.
 */
export const env = {
  apiBaseUrl: (typeof import.meta !== 'undefined' && import.meta.env?.VITE_API_BASE_URL) ||
    (typeof globalThis !== 'undefined' && globalThis.process?.env?.VITE_API_BASE_URL) ||
    '/api'
};
