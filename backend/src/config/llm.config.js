/**
 * CodeVerse LLM & Flight Mentor Configuration
 *
 * Safely parses and validates external provider configuration from server environment.
 * Ensures credentials and URLs never leak to clients, logs, or unhandled exceptions.
 */

export class LlmConfigurationError extends Error {
  constructor(message) {
    super(`[LlmConfigurationError] ${message}`);
    this.name = 'LlmConfigurationError';
  }
}

/**
 * Validates and normalizes LLM provider configuration.
 *
 * @param {Record<string, string | undefined>} [rawEnv=process.env]
 * @returns {{
 *   apiKey: string | null,
 *   apiUrl: string,
 *   model: string,
 *   timeoutMs: number,
 *   isConfigured: boolean
 * }}
 */
export function getLlmConfig(rawEnv = process.env) {
  const rawKey = rawEnv.LLM_API_KEY ? rawEnv.LLM_API_KEY.trim() : '';
  const apiKey = rawKey.length > 0 ? rawKey : null;

  let apiUrl = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent';
  if (rawEnv.LLM_API_URL && rawEnv.LLM_API_URL.trim().length > 0) {
    const trimmedUrl = rawEnv.LLM_API_URL.trim();
    try {
      const parsed = new URL(trimmedUrl);
      if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
        throw new Error('Invalid protocol');
      }
      apiUrl = trimmedUrl;
    } catch {
      throw new LlmConfigurationError(
        `Invalid LLM_API_URL "${trimmedUrl}". Must be a valid HTTP or HTTPS URL.`
      );
    }
  }

  const model = rawEnv.LLM_MODEL && rawEnv.LLM_MODEL.trim().length > 0
    ? rawEnv.LLM_MODEL.trim()
    : 'gemini-1.5-flash';

  let timeoutMs = 8000; // 8-second bounded timeout
  if (rawEnv.LLM_TIMEOUT_MS !== undefined && rawEnv.LLM_TIMEOUT_MS !== '') {
    const parsed = Number(rawEnv.LLM_TIMEOUT_MS);
    if (Number.isInteger(parsed) && parsed >= 1000 && parsed <= 30000) {
      timeoutMs = parsed;
    }
  }

  return {
    apiKey,
    apiUrl,
    model,
    timeoutMs,
    isConfigured: Boolean(apiKey)
  };
}

