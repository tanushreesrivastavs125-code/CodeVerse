import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { spawnSync } from 'node:child_process';
import { generateRunnableExport } from '../../../shared/codeGenerators/index.js';
import { simulate, levels } from '../../../shared/game.js';

/**
 * Detect available language runtimes and compilers in the current environment.
 */
function detectEnvironmentToolchains() {
  const toolchains = {};

  // 1. JavaScript (Node.js)
  try {
    const res = spawnSync('node', ['--version'], { encoding: 'utf8' });
    if (res.status === 0) {
      toolchains.javascript = { cmd: 'node', version: res.stdout.trim() };
    }
  } catch {
    /* binary not available */
  }

  // 2. Python (Python 3)
  for (const p of ['python3', 'python']) {
    try {
      const res = spawnSync(p, ['--version'], { encoding: 'utf8' });
      if (res.status === 0) {
        toolchains.python = { cmd: p, version: (res.stdout || res.stderr).trim() };
        break;
      }
    } catch {
      /* binary not available */
    }
  }

  // 3. Java (javac compiler and java runtime)
  try {
    const javac = spawnSync('javac', ['-version'], { encoding: 'utf8' });
    const java = spawnSync('java', ['-version'], { encoding: 'utf8' });
    if (javac.status === 0 && java.status === 0) {
      toolchains.java = {
        javacCmd: 'javac',
        javaCmd: 'java',
        version: (javac.stdout || javac.stderr).trim()
      };
    }
  } catch {
    /* binary not available */
  }

  // 4. C++ (g++ or clang++)
  for (const c of ['g++', 'clang++']) {
    try {
      const res = spawnSync(c, ['--version'], { encoding: 'utf8' });
      if (res.status === 0) {
        toolchains.cpp = { cmd: c, version: res.stdout.split('\n')[0].trim() };
        break;
      }
    } catch {
      /* binary not available */
    }
  }

  // 5. C (gcc or clang)
  for (const c of ['gcc', 'clang']) {
    try {
      const res = spawnSync(c, ['--version'], { encoding: 'utf8' });
      if (res.status === 0) {
        toolchains.c = { cmd: c, version: res.stdout.split('\n')[0].trim() };
        break;
      }
    } catch {
      /* binary not available */
    }
  }

  return toolchains;
}

const toolchains = detectEnvironmentToolchains();

describe('Stage D: Multi-Language Executable Exports Compilation & Semantic Verification', () => {
  // Check CI toolchain requirement enforcement
  test('verifies provisioned compiler toolchains according to environment contract', () => {
    const isCiCompilerRequired = process.env.REQUIRE_ALL_COMPILERS === 'true';
    const requiredLanguages = ['javascript', 'python', 'java', 'cpp', 'c'];
    const missing = requiredLanguages.filter((lang) => !toolchains[lang]);

    if (isCiCompilerRequired) {
      // In isolated CI compiler job, failure is mandatory if any provisioned compiler is missing
      assert.equal(
        missing.length,
        0,
        `Required CI verification failed: Missing toolchains for [${missing.join(', ')}]. CI runner must explicitly provision all compilers.`
      );
    } else if (missing.length > 0) {
      // Local developer / learner notice
      console.log(
        `[Toolchain Info] Compilers for [${missing.join(', ')}] not installed in local host PATH. Skipping local execution for those targets. (Isolated CI job verify-executable-exports tests all 5 targets).`
      );
    }
  });

  /**
   * Helper function to execute downloadable export in isolated temporary directory
   * using bounded subprocess execution and argument-based process spawning.
   */
  function executeStandaloneExport(lang, program, level) {
    const tc = toolchains[lang];
    if (!tc) return null;

    const exportData = generateRunnableExport(program, lang, level);
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), `cv-exec-${lang}-`));
    const srcPath = path.join(tempDir, exportData.filename);
    fs.writeFileSync(srcPath, exportData.content, 'utf8');

    try {
      let proc;

      if (lang === 'javascript') {
        proc = spawnSync(tc.cmd, [srcPath], { timeout: 10000, encoding: 'utf8' });
      } else if (lang === 'python') {
        proc = spawnSync(tc.cmd, [srcPath], {
          timeout: 10000,
          encoding: 'utf8',
          env: { ...process.env, PYTHONIOENCODING: 'utf-8', PYTHONUTF8: '1' }
        });
      } else if (lang === 'java') {
        const compile = spawnSync(tc.javacCmd, [srcPath], {
          timeout: 12000,
          encoding: 'utf8',
          cwd: tempDir
        });
        if (compile.status !== 0) {
          throw new Error(`Java compilation failed:\n${compile.stderr || compile.stdout}`);
        }
        proc = spawnSync(tc.javaCmd, ['DroneMission'], {
          timeout: 10000,
          encoding: 'utf8',
          cwd: tempDir
        });
      } else if (lang === 'cpp') {
        const binPath = path.join(tempDir, process.platform === 'win32' ? 'mission.exe' : 'mission');
        const compile = spawnSync(tc.cmd, ['-std=c++17', '-O2', '-o', binPath, srcPath], {
          timeout: 15000,
          encoding: 'utf8'
        });
        if (compile.status !== 0) {
          throw new Error(`C++ compilation failed:\n${compile.stderr || compile.stdout}`);
        }
        proc = spawnSync(binPath, [], { timeout: 10000, encoding: 'utf8' });
      } else if (lang === 'c') {
        const binPath = path.join(tempDir, process.platform === 'win32' ? 'mission.exe' : 'mission');
        const compile = spawnSync(tc.cmd, ['-std=c99', '-O2', '-o', binPath, srcPath], {
          timeout: 15000,
          encoding: 'utf8'
        });
        if (compile.status !== 0) {
          throw new Error(`C compilation failed:\n${compile.stderr || compile.stdout}`);
        }
        proc = spawnSync(binPath, [], { timeout: 10000, encoding: 'utf8' });
      }

      if (proc.error) throw proc.error;

      // Extract machine-readable state payload
      const match = proc.stdout.match(/__CV_RESULT__=(.+)/);
      if (!match) {
        throw new Error(
          `Export did not output __CV_RESULT__ token.\nStdout:\n${proc.stdout}\nStderr:\n${proc.stderr}`
        );
      }

      return JSON.parse(match[1]);
    } finally {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  }

  // 6 Representative Test Scenarios
  const SCENARIOS = [
    {
      name: 'Nested repeats',
      level: levels[0], // Level 1 (Boot Sequence)
      program: [
        {
          type: 'repeat',
          count: 3,
          body: [{ type: 'repeat', count: 1, body: [{ type: 'move' }] }]
        }
      ]
    },
    {
      name: 'True and false conditions and both if/else branches',
      level: levels[0], // Level 1
      program: [
        { type: 'move' },
        // Facing East at (2, 1); ahead is (3, 1) '.' (not wall) -> evaluates FALSE -> executes ELSE
        {
          type: 'if',
          sensor: 'wall',
          body: [{ type: 'left' }],
          elseBody: [{ type: 'move' }]
        },
        // Turn North at (3, 1); ahead is (3, 0) '#' (wall) -> evaluates TRUE -> executes IF
        { type: 'left' },
        {
          type: 'if',
          sensor: 'wall',
          body: [{ type: 'right' }],
          elseBody: [{ type: 'move' }]
        }
      ]
    },
    {
      name: 'Collection and terminal activation',
      level: levels[5], // Level 6 (Switch Protocol)
      program: [
        { type: 'move' }, // onto terminal 'T' at (2, 1)
        { type: 'activate' }, // activates bridge!
        { type: 'move' }, // onto bridge 'B' (3, 1)
        { type: 'move' }, // onto bridge 'B' (4, 1)
        { type: 'move' }, // (5, 1)
        { type: 'move' }, // onto energy 'C' (6, 1)
        { type: 'collect' }, // collects energy!
        { type: 'move' } // onto goal 'G' (7, 1)
      ]
    },
    {
      name: 'Jumping over hazard and pulse range',
      level: levels[4], // Level 5 (Broken Circuit: #S.H.CG#)
      program: [
        { type: 'move' }, // to (2, 1)
        { type: 'jump' }, // jumps over hazard 'H' at (3, 1) onto safe tile (4, 1)
        { type: 'move' }, // to (5, 1)
        { type: 'collect' }, // collects energy
        { type: 'move' } // to goal 'G' (6, 1)
      ]
    },
    {
      name: 'Collision and failure behaviour',
      level: levels[0], // Level 1
      program: [
        { type: 'left' }, // face North
        { type: 'move' } // hits wall '#' at (1, 0)
      ]
    },
    {
      name: 'Execution limits (150 actions max)',
      level: levels[0], // Level 1
      program: [
        {
          type: 'repeat',
          count: 10,
          body: [
            {
              type: 'repeat',
              count: 16,
              body: [{ type: 'left' }]
            }
          ]
        }
      ]
    }
  ];

  const EXECUTABLE_LANGS = ['javascript', 'python', 'java', 'cpp', 'c'];

  for (const lang of EXECUTABLE_LANGS) {
    describe(`Executable target: ${lang.toUpperCase()}`, () => {
      for (const scenario of SCENARIOS) {
        test(`matches canonical simulator outcome for: ${scenario.name}`, () => {
          if (!toolchains[lang]) {
            if (process.env.REQUIRE_ALL_COMPILERS === 'true') {
              assert.fail(`Toolchain for ${lang} is missing in required CI verification.`);
            }
            return;
          }

          // Run canonical simulation
          let simPassed = false;
          let simCrashed = false;
          let simState = null;

          try {
            const sim = simulate(scenario.level, scenario.program);
            simPassed = sim.passed;
            simState = sim.state;
            simCrashed = sim.frames.some((f) => f.event === 'crash');
          } catch (err) {
            if (err.message.includes('150 actions')) {
              simCrashed = true;
              simPassed = false;
            } else {
              throw err;
            }
          }

          // Run downloadable export in isolated subprocess
          const result = executeStandaloneExport(lang, scenario.program, scenario.level);
          assert.ok(result, `Subprocess execution for ${lang} must return parsed result`);

          // Compare semantics
          if (scenario.name.includes('Execution limits')) {
            assert.equal(result.crashed, true, 'Execution limit must trigger crashed state');
            assert.equal(result.passed, false, 'Execution limit must not pass level');
            assert.ok(
              result.crashReason.includes('150 actions'),
              `Crash reason must explain action limit: ${result.crashReason}`
            );
          } else {
            assert.equal(result.passed, simPassed, 'Passed status must match canonical simulator');
            assert.equal(result.crashed, simCrashed, 'Crashed status must match canonical simulator');
            assert.equal(result.x, simState.x, 'Final X position must match canonical simulator');
            assert.equal(result.y, simState.y, 'Final Y position must match canonical simulator');
            assert.equal(result.dir, simState.direction, 'Final heading must match canonical simulator');
            assert.equal(result.steps, simState.steps, 'Action steps count must match canonical simulator');

            if (simState.collected) {
              assert.equal(
                result.collected,
                simState.collected.length,
                'Energy collection count must match canonical simulator'
              );
            }
            if (typeof simState.bridge === 'boolean') {
              assert.equal(result.bridge, simState.bridge, 'Bridge state must match canonical simulator');
            }
            if (typeof simState.bossHP === 'number') {
              assert.equal(result.bossHP, simState.bossHP, 'Boss HP must match canonical simulator');
            }
          }
        });
      }
    });
  }
});
