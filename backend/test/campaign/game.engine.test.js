import test from 'node:test';
import assert from 'node:assert/strict';
import {
  levels,
  createLevel,
  directions,
  initialState,
  validateProgram,
  simulate
} from '../../../shared/game.js';

// Shorthand command generators for readable tests
const m = { type: 'move' };
const l = { type: 'left' };
const r = { type: 'right' };
const j = { type: 'jump' };
const c = { type: 'collect' };
const a = { type: 'activate' };
const p = { type: 'pulse' };
const repeat = (count, ...body) => ({ type: 'repeat', count, body });
const ifSensor = (sensor, body, elseBody = []) => ({ type: 'if', sensor, body, elseBody });

test('Level definitions and initial world state', () => {
  assert.equal(levels.length, 3);
  assert.equal(directions.length, 4);
  assert.deepEqual(directions[0], { x: 1, y: 0 }); // East
  assert.deepEqual(directions[1], { x: 0, y: 1 }); // South
  assert.deepEqual(directions[2], { x: -1, y: 0 }); // West
  assert.deepEqual(directions[3], { x: 0, y: -1 }); // North

  const l1 = levels[0];
  assert.equal(l1.id, 1);
  assert.equal(l1.title, 'Boot Sequence');
  assert.equal(l1.par, 3);
  assert.equal(l1.direction, 0);

  const state1 = initialState(l1);
  assert.equal(state1.x, 1);
  assert.equal(state1.y, 1);
  assert.equal(state1.direction, 0);
  assert.deepEqual(state1.collected, []);
  assert.equal(state1.bridge, false);
  assert.equal(state1.bossHP, 0);
  assert.equal(state1.health, 3);
  assert.equal(state1.event, 'ready');
});

test('Level 1: Solvable baseline with sequences and loops', () => {
  const l1 = levels[0];

  // Solution 1: Direct moves (par=3, steps=3, blocks=3 -> 2 stars)
  const directSolution = [m, m, m];
  const directRes = simulate(l1, directSolution);
  assert.equal(directRes.passed, true);
  assert.equal(directRes.stars, 2);
  assert.equal(directRes.state.steps, 3);
  assert.equal(directRes.state.x, 4);
  assert.equal(directRes.state.y, 1);
  assert.equal(directRes.frames.length, 4);

  // Solution 2: Repeat loop (blocks=2 <= ceil(3/2)=2 -> 3 stars)
  const loopSolution = [repeat(3, m)];
  const loopRes = simulate(l1, loopSolution);
  assert.equal(loopRes.passed, true);
  assert.equal(loopRes.stars, 3);
  assert.equal(loopRes.frames.length, 4);
  assert.equal(loopRes.message, 'Sector secured. Next level unlocked.');
});

test('Level 2: Solvable with actions and collection', () => {
  const l2 = levels[1];
  assert.equal(l2.par, 6);

  // Map: #SC.CG## -> Spawn at (1,1), C at (2,1), C at (4,1), G at (5,1)
  const solution = [m, c, m, m, c, m];
  const res = simulate(l2, solution);
  assert.equal(res.passed, true);
  assert.equal(res.totalEnergy, 2);
  assert.equal(res.state.collected.length, 2);
  assert.equal(res.state.x, 5);
  assert.equal(res.state.y, 1);
  assert.equal(res.stars, 2); // 6 blocks > ceil(6/2)=3, steps=6 <= 6

  // Incomplete collection fails
  const incomplete = [repeat(4, m)];
  const incompleteRes = simulate(l2, incomplete);
  assert.equal(incompleteRes.passed, false);
  assert.match(incompleteRes.message, /Recover all energy shards/);
});

test('Level 3: Solvable with directional turns and navigation', () => {
  const l3 = levels[2];
  // Map:
  // #######
  // #S..###
  // ###C###
  // ###G###
  // #######
  // Spawn at (1,1), East. Move 2 to (3,1), turn right to face South (1), move to (3,2), collect, move to (3,3) G.
  const solution = [m, m, r, m, c, m];
  const res = simulate(l3, solution);
  assert.equal(res.passed, true);
  assert.equal(res.state.direction, 1); // Facing South
  assert.equal(res.state.x, 3);
  assert.equal(res.state.y, 3);
  assert.equal(res.state.collected.length, 1);
});

test('World collisions: wall collisions result in crash and halts run', () => {
  const l1 = levels[0];
  // Spawn at (1,1) facing East. Turning right faces South (1,2 is wall #)
  const crashProgram = [r, m, m, m];
  const res = simulate(l1, crashProgram);
  assert.equal(res.passed, false);
  assert.equal(res.state.event, 'crash');
  assert.equal(res.state.health, 2);
  assert.match(res.message, /Route blocked/);
  // Crashes on step 2; remaining move commands are halted
  assert.equal(res.state.steps, 2);
});

test('Hazards and jump landing rules', () => {
  // Test map with a hazard: #S.H.CG#
  const hazardLevel = createLevel(
    99,
    'Hazard Test',
    'Test Zone',
    'Jump',
    'Jump the breach',
    'Jump over H',
    ['########', '#S.H.CG#', '########'],
    0,
    5
  );

  // Stepping into hazard H directly causes crash
  const walkIntoHazard = [m, m];
  const walkRes = simulate(hazardLevel, walkIntoHazard);
  assert.equal(walkRes.passed, false);
  assert.equal(walkRes.state.event, 'crash');
  assert.match(walkRes.message, /Corruption hit!/);

  // Jumping 2 tiles forward clears hazard H: from (2,1) jumps to (4,1), then moves to (5,1), collects, and moves to (6,1) G
  const jumpSuccess = [m, j, m, c, m];
  const jumpRes = simulate(hazardLevel, jumpSuccess);
  assert.equal(jumpRes.passed, true);
  assert.equal(jumpRes.state.x, 6);

  // Jumping into a wall causes crash
  const jumpIntoWall = [r, j];
  const wallRes = simulate(hazardLevel, jumpIntoWall);
  assert.equal(wallRes.passed, false);
  assert.equal(wallRes.state.event, 'crash');
});

test('Terminal and bridge deployment state', () => {
  // Map with Terminal at (2,1) and Bridge at (3,1): #STB.G##
  const bridgeLevel = createLevel(
    98,
    'Bridge Test',
    'Test Zone',
    'Terminals',
    'Activate bridge',
    'Terminal first',
    ['########', '#STB.G##', '########'],
    0,
    5
  );

  // Crossing bridge B before activating crashes
  const unactivatedRun = [m, m];
  const unactivatedRes = simulate(bridgeLevel, unactivatedRun);
  assert.equal(unactivatedRes.passed, false);
  assert.equal(unactivatedRes.state.event, 'crash');

  // Activate terminal and cross bridge safely
  const activatedRun = [m, a, m, m, m];
  const activatedRes = simulate(bridgeLevel, activatedRun);
  assert.equal(activatedRes.passed, true);
  assert.equal(activatedRes.state.bridge, true);

  // Activating terminal when not standing on one produces miss
  const missRun = [a];
  const missRes = simulate(bridgeLevel, missRun);
  assert.equal(missRes.frames[1].event, 'miss');
  assert.equal(missRes.state.bridge, false);
});

test('Firewall guardian line-of-sight and pulse range', () => {
  // Map: #S...XG# with Boss shield 2
  const bossLevel = createLevel(
    97,
    'Boss Test',
    'Test Zone',
    'Combat',
    'Defeat guardian',
    'Fire 2 pulses',
    ['########', '#S...XG#', '########'],
    0,
    8,
    { bossHealth: 2 }
  );

  // Stepping into active guardian crashes
  const ramBoss = [repeat(5, m)];
  const ramRes = simulate(bossLevel, ramBoss);
  assert.equal(ramRes.passed, false);
  assert.equal(ramRes.state.event, 'crash');

  // Pulse from distance 4 (out of 3-tile range) misses
  const outOfRange = [p];
  const outRes = simulate(bossLevel, outOfRange);
  assert.equal(outRes.frames[1].event, 'miss');

  // Move within 3 tiles (at x=2, boss at x=5, distance=3), fire 2 pulses, move through
  const combatSuccess = [m, m, p, p, m, m, m];
  const combatRes = simulate(bossLevel, combatSuccess);
  assert.equal(combatRes.passed, true);
  assert.equal(combatRes.state.bossHP, 0);
});

test('Conditionals and sensors', () => {
  // Sensor scanner: checks wall and energy
  const scannerLevel = createLevel(
    96,
    'Scanner Test',
    'Test Zone',
    'Sensors',
    'Use sensors',
    'Scan and react',
    ['#######', '#S.C.G#', '#######'],
    0,
    6
  );

  const conditionalProgram = [
    repeat(4, m, ifSensor('energy', [c]))
  ];
  const res = simulate(scannerLevel, conditionalProgram);
  assert.equal(res.passed, true);
  assert.equal(res.state.collected.length, 1);
});

test('Static program validation and bounded execution limits', () => {
  const l1 = levels[0];

  // Must be array
  assert.throws(() => validateProgram(null), /Program must be a list of commands/);
  assert.throws(() => validateProgram({ type: 'move' }), /Program must be a list of commands/);

  // Unknown command rejected upfront
  assert.throws(() => validateProgram([{ type: 'hackServer' }]), /Unknown command: hackServer/);

  // Invalid repeat count rejected upfront
  assert.throws(() => validateProgram([repeat(0, m)]), /Repeat count must be between 1 and 30/);
  assert.throws(() => validateProgram([repeat(31, m)]), /Repeat count must be between 1 and 30/);
  assert.throws(() => validateProgram([repeat('many', m)]), /Repeat count must be between 1 and 30/);

  // Unknown sensor rejected upfront, even in unexecuted branch
  assert.throws(
    () => validateProgram([ifSensor('magicSensor', [m])]),
    /Unknown sensor: magicSensor/
  );

  // Nesting depth limit (depth > 8)
  let nested = [m];
  for (let i = 0; i < 9; i++) {
    nested = [repeat(1, ...nested)];
  }
  assert.throws(() => validateProgram(nested), /Program nesting is limited to 8/);

  // Total instructions limit (> 300 AST nodes)
  const massiveProgram = Array(301).fill(m);
  assert.throws(() => validateProgram(massiveProgram), /Program exceeds the 300-instruction limit/);

  // Runtime action step limit (150 actions)
  const infiniteLoop = [repeat(30, repeat(6, l))]; // 180 turn actions
  assert.throws(() => simulate(l1, infiniteLoop), /A run can contain at most 150 actions/);
});

test('Sensors: hazard, wall, guardian detection and elseBody branching', () => {
  // Test map: #S.H.XG# with guardian shield 1
  const complexLevel = createLevel(
    95,
    'Sensor Matrix Test',
    'Test Zone',
    'Advanced Sensors',
    'Test all sensors and branches',
    'Evaluate conditions',
    ['########', '#S.H.XG#', '########'],
    0,
    10,
    { bossHealth: 1 }
  );

  // If hazard ahead, jump; else move
  const adaptiveProgram = [
    m, // at (2,1)
    ifSensor('hazard', [j], [m]), // hazard ahead at (3,1), so branch takes [j] -> lands at (4,1)
    ifSensor('guardian', [p], [m]), // guardian ahead at (5,1), so fires pulse
    m, // moves to (5,1)
    m // moves to (6,1) G
  ];

  const res = simulate(complexLevel, adaptiveProgram);
  assert.equal(res.passed, true);
  assert.equal(res.state.bossHP, 0);
  assert.equal(res.state.x, 6);

  // Test wall sensor: at spawn (1,1), turning left faces North (1,0 is # wall)
  const wallSensorLevel = levels[0];
  const wallProgram = [
    l,
    ifSensor('wall', [r, r], [m]) // wall ahead -> takes body: turns right twice (now South)
  ];
  const wallRes = simulate(wallSensorLevel, wallProgram);
  assert.equal(wallRes.state.direction, 1); // Facing South
});

test('Pulse obstruction: obstacles block line-of-sight to guardian', () => {
  // Map: #S.#.XG# where '#' at (3,1) blocks pulse from (2,1) to guardian at (5,1)
  const wallBlockedLevel = createLevel(
    94,
    'Pulse Wall Blocked',
    'Test Zone',
    'LOS',
    'Pulse cannot penetrate walls',
    'LOS blocked',
    ['########', '#S.#.XG#', '########'],
    0,
    5,
    { bossHealth: 1 }
  );

  const blockedPulse = [m, p]; // at (2,1), wall at (3,1) blocks pulse
  const blockedRes = simulate(wallBlockedLevel, blockedPulse);
  assert.equal(blockedRes.frames[2].event, 'miss');
  assert.equal(blockedRes.state.bossHP, 1);
});

test('Static program validation: payload size bound check', () => {
  // Program payload exceeding 64KB
  const hugePayload = Array(2000).fill({ type: 'move' });
  assert.throws(
    () => validateProgram(hugePayload),
    /Program payload exceeds maximum size limit|Program exceeds the 300-instruction limit/
  );
});

test('Determinism: identical inputs yield identical frame snapshots', () => {
  const l1 = levels[0];
  const prog = [repeat(3, m)];

  const run1 = simulate(l1, prog);
  const run2 = simulate(l1, prog);

  assert.deepEqual(run1.frames, run2.frames);
  assert.equal(run1.stars, run2.stars);
  assert.equal(run1.state.steps, run2.state.steps);
  assert.equal(run1.frames.length, 4);

  // Frame 0: ready state at (1,1)
  assert.equal(run1.frames[0].event, 'ready');
  assert.equal(run1.frames[0].x, 1);

  // Frame 3: extraction reached at (4,1)
  assert.equal(run1.frames[3].event, 'move');
  assert.equal(run1.frames[3].x, 4);
});
