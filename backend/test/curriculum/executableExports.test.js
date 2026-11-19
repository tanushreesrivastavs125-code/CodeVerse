import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { spawnSync } from 'node:child_process';
import { generateRunnableExport } from '../../../shared/codeGenerators/index.js';
import { simulate, levels, validateProgram, isValidIdentifier, getIdentifierError, MAX_VARIABLES, MAX_FUNCTIONS, MAX_PARAMS_PER_FUNCTION, MAX_CALL_DEPTH } from '../../../shared/game.js';

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
        // Pre-warm C++ standard header resolution to populate filesystem cache for cold runners
        try {
          spawnSync(c, ['-std=c++17', '-E', '-x', 'c++', '-'], {
            input: '#include <iostream>\n#include <vector>\n#include <string>\n#include <map>\n#include <set>\n',
            encoding: 'utf8',
            timeout: 25000
          });
        } catch {
          /* ignore pre-warm failure */
        }
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
        // Pre-warm C standard header resolution
        try {
          spawnSync(c, ['-std=c99', '-E', '-x', 'c', '-'], {
            input: '#include <stdio.h>\n#include <string.h>\n#include <stdbool.h>\n',
            encoding: 'utf8',
            timeout: 20000
          });
        } catch {
          /* ignore pre-warm failure */
        }
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

  const COMPILER_TIMEOUT_MS = process.platform === 'win32' ? 35000 : 20000;
  const EXEC_TIMEOUT_MS = 10000;

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
        proc = spawnSync(tc.cmd, [srcPath], { timeout: EXEC_TIMEOUT_MS, encoding: 'utf8' });
      } else if (lang === 'python') {
        proc = spawnSync(tc.cmd, [srcPath], {
          timeout: EXEC_TIMEOUT_MS,
          encoding: 'utf8',
          env: { ...process.env, PYTHONIOENCODING: 'utf-8', PYTHONUTF8: '1' }
        });
      } else if (lang === 'java') {
        const compile = spawnSync(tc.javacCmd, [srcPath], {
          timeout: COMPILER_TIMEOUT_MS,
          encoding: 'utf8',
          cwd: tempDir
        });
        if (compile.error) {
          throw new Error(`Java compilation process error:\n${compile.error.message}`);
        }
        if (compile.status !== 0) {
          throw new Error(`Java compilation failed (exit code ${compile.status}):\n${compile.stderr || compile.stdout}`);
        }
        proc = spawnSync(tc.javaCmd, ['DroneMission'], {
          timeout: EXEC_TIMEOUT_MS,
          encoding: 'utf8',
          cwd: tempDir
        });
      } else if (lang === 'cpp') {
        const binPath = path.join(tempDir, process.platform === 'win32' ? 'mission.exe' : 'mission');
        const compile = spawnSync(tc.cmd, ['-std=c++17', '-O2', '-o', binPath, srcPath], {
          timeout: COMPILER_TIMEOUT_MS,
          encoding: 'utf8'
        });
        if (compile.error) {
          throw new Error(`C++ compilation process error:\n${compile.error.message}`);
        }
        if (compile.status !== 0) {
          throw new Error(`C++ compilation failed (exit code ${compile.status}):\n${compile.stderr || compile.stdout}`);
        }
        proc = spawnSync(binPath, [], { timeout: EXEC_TIMEOUT_MS, encoding: 'utf8' });
      } else if (lang === 'c') {
        const binPath = path.join(tempDir, process.platform === 'win32' ? 'mission.exe' : 'mission');
        const compile = spawnSync(tc.cmd, ['-std=c99', '-O2', '-o', binPath, srcPath], {
          timeout: COMPILER_TIMEOUT_MS,
          encoding: 'utf8'
        });
        if (compile.error) {
          throw new Error(`C compilation process error:\n${compile.error.message}`);
        }
        if (compile.status !== 0) {
          throw new Error(`C compilation failed (exit code ${compile.status}):\n${compile.stderr || compile.stdout}`);
        }
        proc = spawnSync(binPath, [], { timeout: EXEC_TIMEOUT_MS, encoding: 'utf8' });
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
    },
    {
      name: 'Variables and counter while loop',
      level: levels[28], // Level 29 (Loop Termination)
      program: [
        { type: 'var_set', variable: 'shards', value: 0 },
        {
          type: 'while',
          condition: { type: 'compare', left: { type: 'var_get', var: 'shards' }, op: '<', right: 3 },
          body: [
            { type: 'move' },
            { type: 'move' },
            { type: 'collect' },
            { type: 'var_change', variable: 'shards', amount: 1 }
          ]
        },
        { type: 'move' }
      ]
    },
    {
      name: 'Runaway while loop execution limit',
      level: levels[28],
      program: [
        { type: 'var_set', variable: 'counter', value: 0 },
        {
          type: 'while',
          condition: { type: 'compare', left: { type: 'var_get', var: 'counter' }, op: '<', right: 3 },
          body: []
        }
      ]
    },
    {
      name: 'Branch initialization followed by use outside',
      level: levels[0], // Level 1: drone starts at (1,1) facing East (0). (2,1) is empty space (not wall).
      program: [
        {
          type: 'if',
          sensor: 'wall',
          body: [
            { type: 'var_set', variable: 'branch_val', value: 10 }
          ],
          elseBody: [
            { type: 'var_set', variable: 'branch_val', value: 42 }
          ]
        },
        {
          type: 'if',
          condition: { type: 'compare', left: 'branch_val', op: '==', right: 42 },
          body: [
            { type: 'move' }
          ]
        }
      ]
    },
    {
      name: 'Skipped branch initialization produces uninitialized error',
      level: levels[0],
      expectCrash: true,
      expectedReason: 'used before being set',
      program: [
        {
          type: 'if',
          sensor: 'wall',
          body: [
            { type: 'var_set', variable: 'uninit_val', value: 99 }
          ]
        },
        {
          type: 'if',
          condition: { type: 'compare', left: 'uninit_val', op: '>', right: 0 },
          body: [
            { type: 'move' }
          ]
        }
      ]
    },
    {
      name: 'Loop initialization and repeated reassignment across iterations',
      level: levels[0],
      program: [
        { type: 'var_set', variable: 'iter', value: 0 },
        {
          type: 'repeat',
          count: 2,
          body: [
            { type: 'var_set', variable: 'inner_val', value: 100 },
            { type: 'var_change', variable: 'iter', amount: 1 },
            { type: 'var_change', variable: 'inner_val', amount: 5 }
          ]
        }
      ]
    },
    {
      name: 'Learner variable i avoids collision with loop counter',
      level: levels[0],
      program: [
        { type: 'var_set', variable: 'i', value: 7 },
        {
          type: 'repeat',
          count: 2,
          body: [
            { type: 'move' }
          ]
        },
        {
          type: 'if',
          condition: { type: 'compare', left: 'i', op: '==', right: 7 },
          body: [
            { type: 'var_change', variable: 'i', amount: 3 }
          ]
        }
      ]
    },
    {
      name: 'Positive and negative boundary values',
      level: levels[0],
      program: [
        { type: 'var_set', variable: 'max_val', value: 10000 },
        { type: 'var_set', variable: 'min_val', value: -10000 },
        { type: 'var_change', variable: 'max_val', amount: 0 },
        { type: 'var_change', variable: 'min_val', amount: 0 }
      ]
    },
    {
      name: 'Upper boundary overflow rejected',
      level: levels[0],
      expectCrash: true,
      expectedReason: 'out of bounds',
      program: [
        { type: 'var_set', variable: 'bound_overflow', value: 10000 },
        { type: 'var_change', variable: 'bound_overflow', amount: 1 }
      ]
    },
    {
      name: 'Lower boundary underflow rejected',
      level: levels[0],
      expectCrash: true,
      expectedReason: 'out of bounds',
      program: [
        { type: 'var_set', variable: 'bound_underflow', value: -10000 },
        { type: 'var_change', variable: 'bound_underflow', amount: -1 }
      ]
    },
    {
      name: 'Repeated routine calls',
      level: levels[0],
      program: [
        { type: 'fn_def', name: 'step_forward', params: [], body: [{ type: 'move' }] },
        { type: 'fn_call', name: 'step_forward', args: [] },
        { type: 'fn_call', name: 'step_forward', args: [] },
        { type: 'fn_call', name: 'step_forward', args: [] }
      ]
    },
    {
      name: 'Different parameter values',
      level: levels[0],
      program: [
        {
          type: 'fn_def',
          name: 'turn_times',
          params: ['rotations'],
          body: [
            {
              type: 'while',
              condition: { type: 'compare', left: 'rotations', op: '>', right: 0 },
              body: [
                { type: 'left' },
                { type: 'var_change', variable: 'rotations', amount: -1 }
              ]
            }
          ]
        },
        { type: 'fn_call', name: 'turn_times', args: [1] },
        { type: 'fn_call', name: 'turn_times', args: [2] }
      ]
    },
    {
      name: 'Local/global name shadowing',
      level: levels[0],
      program: [
        {
          type: 'fn_def',
          name: 'shadow_test',
          params: [],
          body: [
            { type: 'var_set', variable: 'count', value: 99 },
            { type: 'var_change', variable: 'count', amount: 1 }
          ]
        },
        { type: 'var_set', variable: 'count', value: 10 },
        { type: 'fn_call', name: 'shadow_test', args: [] },
        {
          type: 'if',
          condition: { type: 'compare', left: 'count', op: '==', right: 10 },
          body: [{ type: 'move' }]
        }
      ]
    },
    {
      name: 'Local-state isolation between calls',
      level: levels[0],
      program: [
        {
          type: 'fn_def',
          name: 'accumulate',
          params: [],
          body: [
            { type: 'var_set', variable: 'local_acc', value: 5 },
            { type: 'var_change', variable: 'local_acc', amount: 1 },
            { type: 'move' }
          ]
        },
        { type: 'fn_call', name: 'accumulate', args: [] },
        { type: 'fn_call', name: 'accumulate', args: [] }
      ]
    },
    {
      name: 'Nested non-recursive routine calls',
      level: levels[0],
      program: [
        { type: 'fn_def', name: 'just_turn', params: [], body: [{ type: 'left' }] },
        {
          type: 'fn_def',
          name: 'step_and_turn',
          params: [],
          body: [
            { type: 'move' },
            { type: 'fn_call', name: 'just_turn', args: [] }
          ]
        },
        { type: 'fn_call', name: 'step_and_turn', args: [] }
      ]
    },
    {
      name: 'Forbidden recursion rejected',
      level: levels[0],
      expectCrash: true,
      expectedReason: 'recursion is not permitted',
      program: [
        {
          type: 'fn_def',
          name: 'bad_fn',
          params: [],
          body: [{ type: 'fn_call', name: 'bad_fn', args: [] }]
        },
        { type: 'fn_call', name: 'bad_fn', args: [] }
      ]
    }
  ];

  test('validates identifier naming policy, reserved keywords, and length bounds', () => {
    // Valid identifiers
    assert.equal(isValidIdentifier('i'), true);
    assert.equal(isValidIdentifier('count'), true);
    assert.equal(isValidIdentifier('my_var_1'), true);
    assert.equal(isValidIdentifier('x'), true);

    // Reserved language keywords & helpers
    assert.equal(isValidIdentifier('drone'), false);
    assert.match(getIdentifierError('drone'), /reserved keyword or helper identifier/);
    assert.equal(isValidIdentifier('while'), false);
    assert.match(getIdentifierError('while'), /reserved keyword or helper identifier/);
    assert.equal(isValidIdentifier('int'), false);
    assert.match(getIdentifierError('int'), /reserved keyword or helper identifier/);
    assert.equal(isValidIdentifier('class'), false);
    assert.equal(isValidIdentifier('return'), false);

    // Internal reserved prefix (_)
    assert.equal(isValidIdentifier('_step_0'), false);
    assert.match(getIdentifierError('_step_0'), /cannot begin with an underscore/);
    assert.equal(isValidIdentifier('__proto__'), false);
    assert.match(getIdentifierError('__proto__'), /cannot begin with an underscore/);

    // Length limit (max 24)
    const longName = 'a'.repeat(25);
    assert.equal(isValidIdentifier(longName), false);
    assert.match(getIdentifierError(longName), /too long/);
  });

  test('enforces maximum 10 variables per program in validateProgram', () => {
    // Program with 10 variables -> OK
    const tenVars = [];
    for (let i = 1; i <= MAX_VARIABLES; i++) {
      tenVars.push({ type: 'var_set', variable: `var_${i}`, value: i });
    }
    assert.equal(validateProgram(tenVars), true);

    // Program with 11 variables -> rejected
    const elevenVars = [...tenVars, { type: 'var_set', variable: 'var_11', value: 11 }];
    assert.throws(() => validateProgram(elevenVars), /Program exceeds the limit of 10 variables/);
  });

  test('enforces function constraints and cycle detection in validateProgram', () => {
    assert.equal(MAX_FUNCTIONS, 5);
    assert.equal(MAX_PARAMS_PER_FUNCTION, 3);
    assert.equal(MAX_CALL_DEPTH, 8);

    // 1. Max 5 functions limit
    const sixFns = [];
    for (let i = 1; i <= 6; i++) {
      sixFns.push({ type: 'fn_def', name: `fn_${i}`, params: [], body: [] });
    }
    assert.throws(() => validateProgram(sixFns), /Program exceeds the limit of 5 function definitions/);

    // 2. Max 3 params per function
    const fourParams = [
      { type: 'fn_def', name: 'big_fn', params: ['a', 'b', 'c', 'd'], body: [] }
    ];
    assert.throws(() => validateProgram(fourParams), /Function "big_fn" exceeds the limit of 3 parameters/);

    // 3. Duplicate function names
    const dupFns = [
      { type: 'fn_def', name: 'my_step', params: [], body: [] },
      { type: 'fn_def', name: 'my_step', params: [], body: [] }
    ];
    assert.throws(() => validateProgram(dupFns), /Function "my_step" is already defined/);

    // 4. Duplicate parameter names
    const dupParams = [
      { type: 'fn_def', name: 'dup_p', params: ['x', 'x'], body: [] }
    ];
    assert.throws(() => validateProgram(dupParams), /Duplicate parameter "x" in function "dup_p"/);

    // 5. Nested function definitions rejected
    const nestedFn = [
      {
        type: 'repeat',
        count: 2,
        body: [{ type: 'fn_def', name: 'inner_fn', params: [], body: [] }]
      }
    ];
    assert.throws(() => validateProgram(nestedFn), /Function definitions must be at top-level/);

    // 6. Direct recursion rejected statically
    const directRec = [
      { type: 'fn_def', name: 'recurse', params: [], body: [{ type: 'fn_call', name: 'recurse', args: [] }] },
      { type: 'fn_call', name: 'recurse', args: [] }
    ];
    assert.throws(() => validateProgram(directRec), /Recursion is not permitted/);

    // 7. Indirect recursion cycle rejected statically (A -> B -> A)
    const indirectRec = [
      { type: 'fn_def', name: 'fn_a', params: [], body: [{ type: 'fn_call', name: 'fn_b', args: [] }] },
      { type: 'fn_def', name: 'fn_b', params: [], body: [{ type: 'fn_call', name: 'fn_a', args: [] }] },
      { type: 'fn_call', name: 'fn_a', args: [] }
    ];
    assert.throws(() => validateProgram(indirectRec), /Recursion is not permitted/);
  });

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
            if (scenario.expectCrash || err.message.includes('150 actions')) {
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
          if (scenario.name.includes('Execution limits') || scenario.name.includes('Runaway while loop')) {
            assert.equal(result.crashed, true, 'Execution limit must trigger crashed state');
            assert.equal(result.passed, false, 'Execution limit must not pass level');
            assert.ok(
              result.crashReason.includes('150 actions') || result.crashReason.includes('never became false'),
              `Crash reason must explain limit: ${result.crashReason}`
            );
          } else if (scenario.expectCrash) {
            assert.equal(result.crashed, true, 'Failure scenario must trigger crashed state');
            assert.equal(result.passed, false, 'Failure scenario must not pass level');
            if (scenario.expectedReason) {
              assert.ok(
                result.crashReason.toLowerCase().includes(scenario.expectedReason.toLowerCase()),
                `Crash reason must explain failure. Got "${result.crashReason}", expected "${scenario.expectedReason}"`
              );
            }
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
            if (simState.variables && result.variables) {
              assert.deepEqual(
                result.variables,
                simState.variables,
                `Variables state in ${lang} must match canonical simulator`
              );
            }
          }
        });
      }
    });
  }
});
