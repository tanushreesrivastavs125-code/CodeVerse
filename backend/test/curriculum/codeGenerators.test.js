import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { spawnSync } from 'node:child_process';
import {
  SUPPORTED_LANGUAGES,
  LANGUAGE_METADATA,
  generateCode,
  generateSnippetExport,
  generateRunnableExport,
  buildExportReadme
} from '../../../shared/codeGenerators/index.js';
import { simulate, levels } from '../../../shared/game.js';

describe('Stage D: Multi-Language Code Generators & Connected Previews', () => {
  const sampleAst = [
    { nodeId: 'n1', blockId: 'b1', type: 'move' },
    {
      nodeId: 'n2',
      blockId: 'b2',
      type: 'repeat',
      count: 3,
      body: [
        { nodeId: 'n2_1', blockId: 'b2_1', type: 'move' },
        {
          nodeId: 'n2_2',
          blockId: 'b2_2',
          type: 'if',
          sensor: 'wall',
          body: [{ nodeId: 'n2_2_1', blockId: 'b2_2_1', type: 'left' }],
          elseBody: [{ nodeId: 'n2_2_2', blockId: 'b2_2_2', type: 'right' }]
        }
      ]
    },
    { nodeId: 'n3', blockId: 'b3', type: 'collect' },
    { nodeId: 'n4', blockId: 'b4', type: 'jump' },
    { nodeId: 'n5', blockId: 'b5', type: 'activate' },
    { nodeId: 'n6', blockId: 'b6', type: 'pulse' }
  ];

  test('advertises exactly the 6 required languages with accurate metadata', () => {
    assert.deepEqual(SUPPORTED_LANGUAGES, [
      'plainEnglish',
      'javascript',
      'python',
      'java',
      'cpp',
      'c'
    ]);

    for (const lang of SUPPORTED_LANGUAGES) {
      const meta = LANGUAGE_METADATA[lang];
      assert.ok(meta, `Metadata must exist for ${lang}`);
      assert.ok(meta.label, `Label required for ${lang}`);
      assert.ok(meta.extension, `Extension required for ${lang}`);
      assert.ok(meta.mimeType, `MimeType required for ${lang}`);
      assert.ok(meta.runCommand, `RunCommand required for ${lang}`);
    }

    // Honest status disclosure: Node.js and Python verified locally, Java/C++/C require local toolchains
    assert.equal(LANGUAGE_METADATA.javascript.verifiedRunnable, true);
    assert.equal(LANGUAGE_METADATA.python.verifiedRunnable, true);
    assert.equal(LANGUAGE_METADATA.java.verifiedRunnable, false);
    assert.equal(LANGUAGE_METADATA.cpp.verifiedRunnable, false);
    assert.equal(LANGUAGE_METADATA.c.verifiedRunnable, false);
    assert.ok(LANGUAGE_METADATA.java.verificationBlockedReason.includes('javac'));
    assert.ok(LANGUAGE_METADATA.cpp.verificationBlockedReason.includes('g++'));
    assert.ok(LANGUAGE_METADATA.c.verificationBlockedReason.includes('gcc'));
  });

  test('handles empty programs gracefully with educational placeholders in all languages', () => {
    for (const lang of SUPPORTED_LANGUAGES) {
      const res = generateCode([], lang);
      assert.ok(res.code, `Empty code string for ${lang} must not be empty`);
      assert.ok(
        res.code.includes('No') || res.code.includes('empty'),
        `Empty code for ${lang} must include clear guidance`
      );
      assert.ok(Array.isArray(res.lines));
      assert.ok(res.lines.length >= 1);
      assert.equal(typeof res.nodeLineMap, 'object');
    }
  });

  test('rejects unsupported command nodes upfront without silently dropping them', () => {
    const invalidAst = [
      { type: 'move' },
      { type: 'teleportToMoon' }
    ];

    for (const lang of SUPPORTED_LANGUAGES) {
      assert.throws(
        () => generateCode(invalidAst, lang),
        /Unsupported command node: "teleportToMoon"/,
        `Generator for ${lang} must throw on unknown commands`
      );
    }
  });

  test('generates Plain-English steps with numbering, indentation, and explanations', () => {
    const res = generateCode(sampleAst, 'plainEnglish');
    assert.equal(res.language, 'plainEnglish');
    assert.ok(res.code.includes('1. Move forward 1 step'));
    assert.ok(res.code.includes('Repeat 3 times:'));
    assert.ok(res.code.includes('If obstacle or wall ahead:'));
    assert.ok(res.code.includes('Otherwise:'));
    assert.ok(res.code.includes('Collect energy cell'));
    assert.ok(res.code.includes('Jump forward 2 steps'));
    assert.ok(res.code.includes('Activate terminal'));
    assert.ok(res.code.includes('Emit EMP pulse'));

    // Check node line map
    assert.ok(res.nodeLineMap.n1, 'Action node n1 must be mapped');
    assert.ok(res.nodeLineMap.n2, 'Repeat node n2 must be mapped');
    assert.ok(res.nodeLineMap.n2_2, 'If node n2_2 must be mapped');
    assert.ok(res.nodeLineMap.n2_2.conditionLine, 'If node must record conditionLine');
    assert.ok(res.nodeLineMap.n2_2.elseLine, 'If node must record elseLine');
  });

  test('generates idiomatic JavaScript with precise node-line mappings', () => {
    const res = generateCode(sampleAst, 'javascript');
    assert.equal(res.language, 'javascript');
    assert.ok(res.code.includes('drone.move();'));
    assert.ok(res.code.includes('for (let i = 0; i < 3; i++) {'));
    assert.ok(res.code.includes('if (drone.sensor("wall")) {'));
    assert.ok(res.code.includes('drone.left();'));
    assert.ok(res.code.includes('} else {'));
    assert.ok(res.code.includes('drone.right();'));
    assert.ok(res.code.includes('drone.collect();'));
    assert.ok(res.code.includes('drone.jump();'));
    assert.ok(res.code.includes('drone.activate();'));
    assert.ok(res.code.includes('drone.pulse();'));

    // Verify nodeLineMap mappings
    const n1Map = res.nodeLineMap.n1;
    assert.equal(res.lines[n1Map.startLine - 1].trim(), 'drone.move();');
    const n2Map = res.nodeLineMap.n2;
    assert.equal(res.lines[n2Map.startLine - 1].trim(), 'for (let i = 0; i < 3; i++) {');
    const n2_2Map = res.nodeLineMap.n2_2;
    assert.equal(res.lines[n2_2Map.conditionLine - 1].trim(), 'if (drone.sensor("wall")) {');
    assert.equal(res.lines[n2_2Map.elseLine - 1].trim(), '} else {');
  });

  test('generates idiomatic Python 3 with correct indentation and no trailing semicolons', () => {
    const res = generateCode(sampleAst, 'python');
    assert.equal(res.language, 'python');
    assert.ok(res.code.includes('drone.move()'));
    assert.ok(!res.code.includes('drone.move();'));
    assert.ok(res.code.includes('for i in range(3):'));
    assert.ok(res.code.includes('if drone.sensor("wall"):'));
    assert.ok(res.code.includes('else:'));
    assert.ok(res.code.includes('drone.collect()'));
    assert.ok(res.code.includes('drone.jump()'));
    assert.ok(res.code.includes('drone.activate()'));
    assert.ok(res.code.includes('drone.pulse()'));

    // Check loop variable collision avoidance in nested loops
    const deeplyNestedAst = [
      {
        nodeId: 'r1',
        type: 'repeat',
        count: 2,
        body: [
          {
            nodeId: 'r2',
            type: 'repeat',
            count: 3,
            body: [
              {
                nodeId: 'r3',
                type: 'repeat',
                count: 4,
                body: [{ nodeId: 'act', type: 'move' }]
              }
            ]
          }
        ]
      }
    ];

    const nestedPy = generateCode(deeplyNestedAst, 'python');
    assert.ok(nestedPy.code.includes('for i in range(2):'));
    assert.ok(nestedPy.code.includes('for j in range(3):'));
    assert.ok(nestedPy.code.includes('for k in range(4):'));
  });

  test('generates valid Java, C++, and C with proper typed loops and non-colliding variables', () => {
    const deeplyNestedAst = [
      {
        nodeId: 'r1',
        type: 'repeat',
        count: 2,
        body: [
          {
            nodeId: 'r2',
            type: 'repeat',
            count: 3,
            body: [
              {
                nodeId: 'r3',
                type: 'repeat',
                count: 4,
                body: [{ nodeId: 'act', type: 'move' }]
              }
            ]
          }
        ]
      }
    ];

    const javaRes = generateCode(deeplyNestedAst, 'java');
    assert.ok(javaRes.code.includes('for (int i = 0; i < 2; i++) {'));
    assert.ok(javaRes.code.includes('for (int j = 0; j < 3; j++) {'));
    assert.ok(javaRes.code.includes('for (int k = 0; k < 4; k++) {'));

    const cppRes = generateCode(deeplyNestedAst, 'cpp');
    assert.ok(cppRes.code.includes('for (int i = 0; i < 2; ++i) {'));
    assert.ok(cppRes.code.includes('for (int j = 0; j < 3; ++j) {'));
    assert.ok(cppRes.code.includes('for (int k = 0; k < 4; ++k) {'));

    const cRes = generateCode(deeplyNestedAst, 'c');
    assert.ok(cRes.code.includes('for (int i = 0; i < 2; ++i) {'));
    assert.ok(cRes.code.includes('for (int j = 0; j < 3; ++j) {'));
    assert.ok(cRes.code.includes('for (int k = 0; k < 4; ++k) {'));
  });

  test('generateSnippetExport produces appropriate file extensions and mime types', () => {
    const jsSnippet = generateSnippetExport(sampleAst, 'javascript');
    assert.equal(jsSnippet.filename, 'codeverse_program.js');
    assert.equal(jsSnippet.mimeType, 'text/javascript');
    assert.ok(jsSnippet.content.includes('drone.move();'));

    const pySnippet = generateSnippetExport(sampleAst, 'python');
    assert.equal(pySnippet.filename, 'codeverse_program.py');
    assert.equal(pySnippet.mimeType, 'text/x-python');
    assert.ok(pySnippet.content.includes('drone.move()'));
  });

  test('generateRunnableExport creates self-contained scripts with README', () => {
    const l1 = levels[0];
    const jsRunnable = generateRunnableExport(sampleAst, 'javascript', l1);
    assert.equal(jsRunnable.filename, 'drone_mission.js');
    assert.equal(jsRunnable.verifiedRunnable, true);
    assert.ok(jsRunnable.content.includes('class ConsoleDroneSimulator'));
    assert.ok(jsRunnable.content.includes('function main()'));

    const pyRunnable = generateRunnableExport(sampleAst, 'python', l1);
    assert.equal(pyRunnable.filename, 'drone_mission.py');
    assert.equal(pyRunnable.verifiedRunnable, true);
    assert.ok(pyRunnable.content.includes('class ConsoleDroneSimulator'));
    assert.ok(pyRunnable.content.includes('def main():'));

    const readme = buildExportReadme(l1);
    assert.ok(readme.includes('Sector 1: Boot Sequence'));
    assert.ok(readme.includes('node drone_mission.js'));
    assert.ok(readme.includes('python drone_mission.py'));
  });

  test('executes standalone Python runnable export and matches canonical simulator outcome', () => {
    const l1 = levels[0];
    const winningProgram = [
      { type: 'repeat', count: 3, body: [{ type: 'move' }] }
    ];

    // Canonical simulation outcome
    const canonSim = simulate(l1, winningProgram);
    assert.equal(canonSim.passed, true);
    assert.equal(canonSim.state.steps, 3);

    // Build standalone python file
    const pyExport = generateRunnableExport(winningProgram, 'python', l1);
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'cv-py-test-'));
    const tempFile = path.join(tempDir, 'drone_mission.py');

    try {
      fs.writeFileSync(tempFile, pyExport.content, 'utf8');
      const proc = spawnSync('python', [tempFile], { encoding: 'utf8', timeout: 8000 });

      assert.equal(
        proc.status,
        0,
        `Python script execution failed with error: ${proc.stderr || proc.stdout}`
      );
      assert.ok(
        proc.stdout.includes('MISSION PASSED'),
        `Python output must report MISSION PASSED:\n${proc.stdout}`
      );
      assert.ok(
        proc.stdout.includes('in 3 steps'),
        `Python output must report 3 steps matching simulator:\n${proc.stdout}`
      );
    } finally {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });

  test('executes standalone JavaScript runnable export and matches canonical simulator outcome', () => {
    const l1 = levels[0];
    const winningProgram = [
      { type: 'repeat', count: 3, body: [{ type: 'move' }] }
    ];

    const jsExport = generateRunnableExport(winningProgram, 'javascript', l1);
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'cv-js-test-'));
    const tempFile = path.join(tempDir, 'drone_mission.js');

    try {
      fs.writeFileSync(tempFile, jsExport.content, 'utf8');
      const proc = spawnSync('node', [tempFile], { encoding: 'utf8', timeout: 8000 });

      assert.equal(
        proc.status,
        0,
        `Node.js script execution failed with error: ${proc.stderr || proc.stdout}`
      );
      assert.ok(
        proc.stdout.includes('MISSION PASSED'),
        `Node.js output must report MISSION PASSED:\n${proc.stdout}`
      );
      assert.ok(
        proc.stdout.includes('in 3 steps'),
        `Node.js output must report 3 steps matching simulator:\n${proc.stdout}`
      );
    } finally {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });

  test('standalone simulation accurately reproduces crash and condition failure behaviour', () => {
    const l1 = levels[0];
    const crashingProgram = [
      { type: 'left' },
      { type: 'move' } // Hits wall
    ];

    // Python crash simulation
    const pyExport = generateRunnableExport(crashingProgram, 'python', l1);
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'cv-crash-test-'));
    const tempFile = path.join(tempDir, 'drone_mission.py');

    try {
      fs.writeFileSync(tempFile, pyExport.content, 'utf8');
      const proc = spawnSync('python', [tempFile], { encoding: 'utf8', timeout: 8000 });

      assert.equal(proc.status, 0);
      assert.ok(
        proc.stdout.includes('MISSION FAILED'),
        `Python output must report failure for crash:\n${proc.stdout}`
      );
      assert.ok(
        proc.stdout.includes('Route blocked') || proc.stdout.includes('wall barrier'),
        `Python output must explain wall barrier:\n${proc.stdout}`
      );
    } finally {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });

  test('verifies mechanics: collection, jump, terminal activation, and pulse in standalone exports', () => {
    // Level 2: Energy Run
    const l2 = levels[1];
    const l2Solution = [
      { type: 'move' },
      { type: 'collect' },
      { type: 'move' },
      { type: 'move' },
      { type: 'collect' },
      { type: 'move' }
    ];

    const pyL2 = generateRunnableExport(l2Solution, 'python', l2);
    const jsL2 = generateRunnableExport(l2Solution, 'javascript', l2);
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'cv-mech-test-'));

    try {
      const pyFile = path.join(tempDir, 'l2.py');
      fs.writeFileSync(pyFile, pyL2.content, 'utf8');
      const pyRes = spawnSync('python', [pyFile], { encoding: 'utf8' });
      assert.equal(pyRes.status, 0);
      assert.ok(pyRes.stdout.includes('MISSION PASSED'), `Python L2 must pass:\n${pyRes.stdout}`);

      const jsFile = path.join(tempDir, 'l2.js');
      fs.writeFileSync(jsFile, jsL2.content, 'utf8');
      const jsRes = spawnSync('node', [jsFile], { encoding: 'utf8' });
      assert.equal(jsRes.status, 0);
      assert.ok(jsRes.stdout.includes('MISSION PASSED'), `Node L2 must pass:\n${jsRes.stdout}`);
    } finally {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });
});
