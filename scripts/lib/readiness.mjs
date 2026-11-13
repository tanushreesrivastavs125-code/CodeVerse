/**
 * Readiness and health check utilities for CodeVerse processes.
 * Distinguishes simple process liveness from database transaction readiness.
 */

/**
 * Polls the backend health endpoint until the service is live, database is connected,
 * and transaction capability is verified.
 *
 * @param {object} options
 * @param {string} [options.url='http://127.0.0.1:5000/api/health']
 * @param {number} [options.timeoutMs=35000]
 * @param {number} [options.intervalMs=600]
 * @param {boolean} [options.requireTransactions=true]
 * @returns {Promise<object>} Parsed health JSON response
 */
export async function waitForBackendHealth({
  url = 'http://127.0.0.1:5000/api/health',
  timeoutMs = 35000,
  intervalMs = 600,
  requireTransactions = true
} = {}) {
  const startTime = Date.now();
  let lastError = null;
  let lastPayload = null;

  while (Date.now() - startTime < timeoutMs) {
    try {
      const res = await fetch(url, { signal: AbortSignal.timeout(2000) });
      if (res.ok) {
        const data = await res.json();
        lastPayload = data;

        const isLive = data.status === 'ok';
        const isDbConnected = data.database === 'connected';
        const isTxReady = !requireTransactions || data.transactions === true;

        if (isLive && isDbConnected && isTxReady) {
          return data;
        }
      } else {
        lastError = new Error(`HTTP ${res.status} ${res.statusText}`);
      }
    } catch (err) {
      lastError = err;
    }

    await new Promise((resolve) => setTimeout(resolve, intervalMs));
  }

  const detail = lastPayload
    ? `Status: ${lastPayload.status}, Database: ${lastPayload.database}, Transactions: ${lastPayload.transactions}`
    : (lastError?.message || 'Connection refused');

  throw new Error(
    `[Readiness Probe] Backend health probe at ${url} failed to achieve readiness within ${timeoutMs}ms.\n` +
    `Latest state: ${detail}`
  );
}

/**
 * Polls the frontend Vite development server until it responds with HTTP 200.
 *
 * @param {object} options
 * @param {string} [options.url='http://localhost:5173/']
 * @param {number} [options.timeoutMs=25000]
 * @param {number} [options.intervalMs=500]
 * @returns {Promise<void>}
 */
export async function waitForFrontendReadiness({
  url = 'http://localhost:5173/',
  timeoutMs = 25000,
  intervalMs = 500
} = {}) {
  const startTime = Date.now();
  let lastError = null;

  while (Date.now() - startTime < timeoutMs) {
    try {
      const res = await fetch(url, { signal: AbortSignal.timeout(2000) });
      if (res.ok) {
        return;
      }
      lastError = new Error(`HTTP ${res.status}`);
    } catch (err) {
      lastError = err;
    }

    await new Promise((resolve) => setTimeout(resolve, intervalMs));
  }

  throw new Error(
    `[Readiness Probe] Frontend development server at ${url} failed to respond within ${timeoutMs}ms.\n` +
    `Latest error: ${lastError?.message || 'Connection refused'}`
  );
}
