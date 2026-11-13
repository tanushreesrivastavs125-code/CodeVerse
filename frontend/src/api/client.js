import { env } from '../config/env.js';

/**
 * Standard error class for CodeVerse client-side API operations.
 * Captures standardized envelope error code, HTTP status, and validation details.
 */
export class ApiClientError extends Error {
  constructor(message, code = 'API_ERROR', status = 500, details = null) {
    super(message);
    this.name = 'ApiClientError';
    this.code = code;
    this.status = status;
    this.details = details;
  }
}

/**
 * Executes an HTTP fetch request against the CodeVerse API with credentials included.
 * Parses the standard backend JSON envelope:
 * Success: { success: true, data: ... } -> returns data
 * Error:   { success: false, error: { code, message, details } } -> throws ApiClientError
 *
 * @param {string} endpoint
 * @param {RequestInit} [options]
 * @returns {Promise<any>}
 */
async function request(endpoint, options = {}) {
  const url = endpoint.startsWith('http') ? endpoint : `${env.apiBaseUrl}${endpoint}`;

  const headers = {
    'Content-Type': 'application/json',
    ...options.headers
  };

  const fetchOptions = {
    ...options,
    headers,
    credentials: 'include' // Transmit and receive HTTP-only session cookies
  };

  if (options.body && typeof options.body === 'object' && !(options.body instanceof FormData)) {
    fetchOptions.body = JSON.stringify(options.body);
  }

  let response;
  try {
    response = await fetch(url, fetchOptions);
  } catch {
    throw new ApiClientError(
      'Unable to communicate with the CodeVerse backend gateway. Please check your connection.',
      'NETWORK_ERROR',
      0
    );
  }

  let payload = null;
  const contentType = response.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    try {
      payload = await response.json();
    } catch {
      payload = null;
    }
  }

  if (!response.ok) {
    const errorCode = payload?.error?.code || `HTTP_${response.status}`;
    const errorMessage = payload?.error?.message || response.statusText || 'An unexpected error occurred';
    const details = payload?.error?.details || null;
    throw new ApiClientError(errorMessage, errorCode, response.status, details);
  }

  return payload?.data !== undefined ? payload.data : payload;
}

export const api = {
  auth: {
    getProfile: () => request('/auth/profile'),
    login: ({ email, password }) =>
      request('/auth/login', { method: 'POST', body: { email, password } }),
    register: ({ username, email, password }) =>
      request('/auth/register', { method: 'POST', body: { username, email, password } }),
    guest: () => request('/auth/guest', { method: 'POST' }),
    logout: () => request('/auth/logout', { method: 'POST' })
  },
  campaign: {
    getLevels: () => request('/game/levels'),
    runLevel: (id, { program }) =>
      request(`/game/levels/${id}/run`, { method: 'POST', body: { program } }),
    getHistory: (limit = 20) => request(`/game/history?limit=${limit}`)
  },
  leaderboard: {
    get: (range = 'all', limit = 20) => request(`/leaderboard?range=${range}&limit=${limit}`)
  },
  health: {
    check: () => request('/health')
  }
};
