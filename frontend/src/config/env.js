/**
 * Client environment configuration module.
 * Safely accesses Vite environment variables with fallback defaults.
 */
export const env = {
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api'
};
