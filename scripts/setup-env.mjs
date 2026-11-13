import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

const ROOT_DIR = process.cwd();

/**
 * Initializes local environment files safely:
 * - Creates backend/.env if missing, injecting a persistent random 64-hex-char JWT secret.
 * - Creates frontend/.env if missing from frontend/.env.example.
 * - Preserves any existing .env files, database configurations, and secrets without modification.
 * - Strictly never prints secrets to stdout or terminal logs.
 */
export function setupEnvironment() {
  const backendEnvPath = path.join(ROOT_DIR, 'backend', '.env');
  const backendExamplePath = path.join(ROOT_DIR, 'backend', '.env.example');
  const frontendEnvPath = path.join(ROOT_DIR, 'frontend', '.env');
  const frontendExamplePath = path.join(ROOT_DIR, 'frontend', '.env.example');

  let backendCreated = false;
  let frontendCreated = false;

  // 1. Backend environment setup
  if (!fs.existsSync(backendEnvPath)) {
    if (fs.existsSync(backendExamplePath)) {
      let content = fs.readFileSync(backendExamplePath, 'utf8');
      const randomSecret = crypto.randomBytes(32).toString('hex');
      content = content.replace(
        'JWT_SECRET=dev_secret_key_for_local_development_only_replace_in_prod',
        `JWT_SECRET=${randomSecret}`
      );
      fs.writeFileSync(backendEnvPath, content, { encoding: 'utf8', mode: 0o600 });
      backendCreated = true;
      console.log('[Setup] Created backend/.env with persistent random JWT_SECRET (value redacted for security).');
    }
  } else {
    console.log('[Setup] Existing backend/.env preserved (unchanged).');
  }

  // 2. Frontend environment setup
  if (!fs.existsSync(frontendEnvPath)) {
    if (fs.existsSync(frontendExamplePath)) {
      const content = fs.readFileSync(frontendExamplePath, 'utf8');
      fs.writeFileSync(frontendEnvPath, content, { encoding: 'utf8', mode: 0o600 });
      frontendCreated = true;
      console.log('[Setup] Created frontend/.env from frontend/.env.example.');
    }
  } else {
    console.log('[Setup] Existing frontend/.env preserved (unchanged).');
  }

  return { backendCreated, frontendCreated };
}

// Allow direct CLI invocation
if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(import.meta.filename || '')) {
  setupEnvironment();
}
