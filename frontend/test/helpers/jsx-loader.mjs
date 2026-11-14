import fs from 'node:fs';
import { URL } from 'node:url';
import { transformSync } from 'esbuild';

export async function load(url, context, nextLoad) {
  if (url.endsWith('.jsx')) {
    const rawSource = fs.readFileSync(new URL(url), 'utf8');
    const { code } = transformSync(rawSource, {
      loader: 'jsx',
      format: 'esm',
      target: 'node20',
      jsx: 'automatic'
    });
    return {
      format: 'module',
      shortCircuit: true,
      source: code
    };
  }
  return nextLoad(url, context);
}
