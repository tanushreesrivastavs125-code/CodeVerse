import {
  SUPPORTED_LANGUAGES,
  LANGUAGE_METADATA,
  normalizeLanguage,
  ensureNodeIdentities
} from './helpers.js';
import { generatePlainEnglish } from './languages/plainEnglish.js';
import { generateJavaScript } from './languages/javascript.js';
import { generatePython } from './languages/python.js';
import { generateJava } from './languages/java.js';
import { generateCpp } from './languages/cpp.js';
import { generateC } from './languages/c.js';
import {
  buildJavaScriptRunnable,
  buildPythonRunnable,
  buildJavaRunnable,
  buildCppRunnable,
  buildCRunnable,
  buildExportReadme
} from './runnableTemplates.js';

export {
  SUPPORTED_LANGUAGES,
  LANGUAGE_METADATA,
  normalizeLanguage,
  ensureNodeIdentities,
  generatePlainEnglish,
  generateJavaScript,
  generatePython,
  generateJava,
  generateCpp,
  generateC,
  buildJavaScriptRunnable,
  buildPythonRunnable,
  buildJavaRunnable,
  buildCppRunnable,
  buildCRunnable,
  buildExportReadme
};

const GENERATORS = {
  plainEnglish: generatePlainEnglish,
  javascript: generateJavaScript,
  python: generatePython,
  java: generateJava,
  cpp: generateCpp,
  c: generateC
};

/**
 * Deterministically generates readable code and AST line mappings for any supported language.
 *
 * @param {Array<object>} ast - Canonical CodeVerse AST
 * @param {string} [language='javascript'] - Language key
 * @param {object} [options={}] - Options (e.g. includeHeader)
 * @returns {{ language: string, code: string, lines: string[], nodeLineMap: object, explanations: Array<object> }}
 */
export function generateCode(ast, language = 'javascript', options = {}) {
  const normLang = normalizeLanguage(language);
  const generator = GENERATORS[normLang] || GENERATORS.javascript;
  const identifiedAst = ensureNodeIdentities(ast);
  return generator(identifiedAst, options);
}

/**
 * Generates standalone downloadable learner snippet.
 *
 * @param {Array<object>} ast
 * @param {string} language
 * @param {object} [options={}]
 * @returns {{ filename: string, content: string, mimeType: string, language: string }}
 */
export function generateSnippetExport(ast, language = 'javascript', options = {}) {
  const normLang = normalizeLanguage(language);
  const meta = LANGUAGE_METADATA[normLang] || LANGUAGE_METADATA.javascript;
  const result = generateCode(ast, normLang, options);
  const ext = meta.extension;
  const filename = `codeverse_program.${ext}`;

  return {
    filename,
    content: result.code,
    mimeType: meta.mimeType,
    language: normLang
  };
}

/**
 * Generates standalone downloadable complete runnable console project.
 *
 * @param {Array<object>} ast
 * @param {string} language
 * @param {object} level
 * @param {object} [options={}]
 * @returns {{ filename: string, content: string, mimeType: string, language: string, verifiedRunnable: boolean, runCommand: string, instructions: string }}
 */
export function generateRunnableExport(ast, language = 'javascript', level = null, _options = {}) {
  const normLang = normalizeLanguage(language);
  const meta = LANGUAGE_METADATA[normLang] || LANGUAGE_METADATA.javascript;
  const identifiedAst = ensureNodeIdentities(ast);

  let content = '';
  let filename = `drone_mission.${meta.extension}`;

  switch (normLang) {
    case 'python':
      content = buildPythonRunnable(identifiedAst, level);
      break;
    case 'java':
      filename = 'DroneMission.java';
      content = buildJavaRunnable(identifiedAst, level);
      break;
    case 'cpp':
      content = buildCppRunnable(identifiedAst, level);
      break;
    case 'c':
      content = buildCRunnable(identifiedAst, level);
      break;
    case 'plainEnglish':
      filename = 'mission_steps.txt';
      content = generatePlainEnglish(identifiedAst, { includeHeader: true }).code;
      break;
    case 'javascript':
    default:
      content = buildJavaScriptRunnable(identifiedAst, level);
      break;
  }

  return {
    filename,
    content,
    mimeType: meta.mimeType,
    language: normLang,
    isExecutable: meta.isExecutable,
    verifiedRunnable: meta.isExecutable,
    verificationStatus: meta.verificationStatus,
    runCommand: meta.runCommand,
    instructions: meta.runtimeRequirement,
    runtimeRequirement: meta.runtimeRequirement,
    exportCategory: meta.exportCategory
  };
}
