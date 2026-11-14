import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { spawn } from 'node:child_process';

/**
 * Dependency-free test discovery runner for Node.js built-in test runner.
 * Discovers only intended *.test.js files (root-level and nested), avoiding
 * shell glob expansion quirks across Node 20/22/24, Windows cmd.exe, and Linux shells.
 * Ensures non-test files (helpers, fixtures, standalone runners) are strictly ignored.
 */

function findTestFiles(dir) {
  const results = [];
  if (!fs.existsSync(dir)) {
    return results;
  }

  const stat = fs.statSync(dir);
  if (stat.isFile()) {
    if (/\.test\.[cm]?js$/.test(dir)) {
      results.push(dir);
    }
    return results;
  }

  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name !== 'node_modules' && entry.name !== '.git') {
        results.push(...findTestFiles(fullPath));
      }
    } else if (entry.isFile() && /\.test\.[cm]?js$/.test(entry.name)) {
      results.push(fullPath);
    }
  }

  return results;
}

const targetDir = path.resolve(process.cwd(), process.argv[2] || 'test');
const testFiles = findTestFiles(targetDir).sort();

if (testFiles.length === 0) {
  console.error(`[run-tests] No test files matching *.test.js found in: ${targetDir}`);
  process.exit(1);
}

// Convert absolute paths to paths relative to cwd for clean test runner output
const relativeFiles = testFiles.map((file) => path.relative(process.cwd(), file));

// Ensure mongodb-memory-server resolves the root workspace cache if present
if (!process.env.MONGOMS_DOWNLOAD_DIR) {
  const rootCache = path.resolve(import.meta.dirname, '../node_modules/.cache/mongodb-memory-server');
  if (fs.existsSync(rootCache)) {
    process.env.MONGOMS_DOWNLOAD_DIR = rootCache;
  }
}

const nodeArgs = ['--test', '--test-concurrency=1'];
const jsxRegister = path.join(process.cwd(), 'test/helpers/jsx-register.mjs');
if (fs.existsSync(jsxRegister)) {
  nodeArgs.push('--import', pathToFileURL(jsxRegister).href);
}

const child = spawn(process.execPath, [...nodeArgs, ...relativeFiles], {
  stdio: 'inherit',
  env: process.env
});

child.on('close', (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal);
  } else {
    process.exit(code ?? 0);
  }
});

