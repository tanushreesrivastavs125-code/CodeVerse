// CodeVerse Campaign Game Engine
// Deterministic simulation and world state module shared across backend API and frontend renderer.
// Tile key:
//   # : Void / Wall (impassable perimeter or obstacle)
//   . : Floor (traversable tile)
//   S : Spawn point (initial drone position)
//   G : Extraction portal (objective goal)
//   C : Energy shard (collectible)
//   H : Corruption hazard (fatal if stepped directly; clearable via jump)
//   T : Terminal (deploys bridges when activated)
//   B : Bridge (void breach until activated by terminal)
//   X : Firewall guardian (boss entity requiring pulse charges)

export const createLevel = (
  id,
  title,
  zone,
  concept,
  briefing,
  hint,
  map,
  direction = 0,
  par = 10,
  extra = {}
) => ({
  id,
  title,
  zone,
  concept,
  briefing,
  hint,
  map,
  direction,
  par,
  ...extra
});

// Districts taxonomy for campaign grouping
export const DISTRICTS = [
  { id: 1, name: 'Neon Outskirts', sectors: [1, 2, 3, 4], focus: 'Sequences, collection, turns & loops' },
  { id: 2, name: 'Cipher District', sectors: [5, 6, 7, 8], focus: 'Jumps, terminals, bridges & conditions' },
  { id: 3, name: 'Firewall Core', sectors: [9, 10, 11, 12], focus: 'Sensors, combined mechanics & guardian combat' },
  { id: 4, name: 'Shadow Network', sectors: [13, 14, 15, 16], focus: 'Longer routes, multiple objectives & advanced loops' },
  { id: 5, name: 'Quantum Grid', sectors: [17, 18, 19, 20], focus: 'Adaptive programs, sensor decisions & tight efficiency' },
  { id: 6, name: 'Singularity', sectors: [21, 22, 23, 24], focus: 'Expert combinations, demanding routes & final 8-point guardian' }
];

function generateAdvancedLevels() {
  const designs = [
    ['Relay Ascent', 'Shadow Network', 3, 9, 3, 0, false, 0],
    ['Corrupted Relay', 'Shadow Network', 3, 10, 4, 1, false, 0],
    ['Bridge Labyrinth', 'Shadow Network', 3, 10, 4, 2, true, 0],
    ['Shadow Sentinel', 'Shadow Network', 3, 11, 5, 2, true, 4],
    ['Sensor Sweep', 'Quantum Grid', 4, 11, 5, 3, true, 4],
    ['Fractured Lanes', 'Quantum Grid', 4, 11, 6, 4, true, 4],
    ['Quantum Lock', 'Quantum Grid', 4, 11, 7, 5, true, 5],
    ['Grid Overload', 'Quantum Grid', 4, 11, 8, 6, true, 5],
    ['Deep Core Descent', 'Singularity', 5, 11, 8, 6, true, 6],
    ['Blackout Protocol', 'Singularity', 5, 11, 9, 7, true, 6],
    ['Last Transmission', 'Singularity', 5, 11, 10, 8, true, 7],
    ['The Singularity', 'Singularity', 5, 11, 12, 9, true, 8]
  ];

  return designs.map(([title, zone, lanes, width, crystals, hazards, bridges, bossHealth], index) => {
    const id = index + 13;
    const height = lanes * 2 + 1;
    const grid = Array.from({ length: height }, () => Array(width).fill('#'));
    const path = [];

    for (let lane = 0; lane < lanes; lane++) {
      const y = lane * 2 + 1;
      const xs = Array.from({ length: width - 2 }, (_, i) => (lane % 2 ? width - 2 - i : i + 1));
      for (const x of xs) {
        grid[y][x] = '.';
        path.push({ x, y });
      }
      if (lane < lanes - 1) {
        const x = xs.at(-1);
        grid[y + 1][x] = '.';
        path.push({ x, y: y + 1 });
      }
    }

    const place = (i, tile) => {
      const p = path[i];
      grid[p.y][p.x] = tile;
    };

    place(0, 'S');
    place(path.length - 1, 'G');

    if (bridges) {
      place(1, 'T');
      place(2, 'B');
      place(3, 'B');
    }

    if (bossHealth) {
      place(path.length - 3, 'X');
    }

    const eligible = path
      .map((p, i) => ({ p, i }))
      .filter(
        ({ p, i }) =>
          i > 4 &&
          i < path.length - 4 &&
          grid[p.y][p.x] === '.' &&
          path[i - 1].y === p.y &&
          path[i + 1].y === p.y
      );

    const hazardIndices = [];
    for (const { i } of eligible) {
      if (hazardIndices.length === hazards) break;
      if (hazardIndices.every((h) => Math.abs(h - i) > 1)) {
        place(i, 'H');
        hazardIndices.push(i);
      }
    }

    const available = path
      .map((p, i) => ({ p, i }))
      .filter(({ p, i }) => i > 0 && i < path.length - 1 && grid[p.y][p.x] === '.');

    for (let i = 0; i < crystals; i++) {
      place(available[Math.floor((i * available.length) / crystals)].i, 'C');
    }

    const turns = (lanes - 1) * 2;
    const par = path.length - 1 - hazards + turns + crystals + (bridges ? 1 : 0) + bossHealth;
    const maxActions = par + Math.max(1, 13 - index);
    const maxBlocks = par + 12 - index;

    return createLevel(
      id,
      title,
      zone,
      id >= 17 ? 'Adaptive programs' : 'Advanced loops',
      `Recover ${crystals} shards across ${lanes} lanes${hazards ? `, jump ${hazards} corruption tiles` : ''}${bridges ? ', restore the bridges' : ''}${bossHealth ? `, and break a ${bossHealth}-point guardian shield` : ''}. Use loops${id >= 17 ? ' and a sensor condition' : ''} to extract within the program limits.`,
      'Plan each lane before launching. Alternate right and left turns at the ends, jump red tiles, and collect before leaving a shard. A repeat block saves program space; sensors can check energy before collecting.',
      grid.map((row) => row.join('')),
      0,
      par,
      {
        bossHealth,
        maxActions,
        maxBlocks,
        requireLoops: true,
        requireSensors: id >= 17,
        difficulty: id
      }
    );
  });
}

// Canonical campaign sectors (24 progressively challenging missions across six districts)
export const levels = [
  createLevel(
    1,
    'Boot Sequence',
    'Neon Outskirts',
    'Sequences',
    'Reach the extraction portal. Each move advances one tile.',
    'Three forward moves reach the portal.',
    ['#######', '#S..G##', '#######'],
    0,
    3,
    { difficulty: 1 }
  ),
  createLevel(
    2,
    'Energy Run',
    'Neon Outskirts',
    'Actions',
    'Recover both energy shards, then reach extraction.',
    'Move onto a shard and use collect before moving on.',
    ['########', '#SC.CG##', '########'],
    0,
    6,
    { difficulty: 2 }
  ),
  createLevel(
    3,
    'The First Turn',
    'Neon Outskirts',
    'Direction',
    'Navigate the corner and collect the shard.',
    'Turn right to face south. Turning does not change your tile.',
    ['#######', '#S..###', '###C###', '###G###', '#######'],
    0,
    6,
    { difficulty: 3 }
  ),
  createLevel(
    4,
    'Loop Runner',
    'Neon Outskirts',
    'Loops',
    'Cross the long corridor with a compact program.',
    'A repeat block can hold both move and collect.',
    ['##########', '#SCCCC.G##', '##########'],
    0,
    11,
    { difficulty: 4 }
  ),
  createLevel(
    5,
    'Broken Circuit',
    'Cipher District',
    'Jump',
    'Jump across the corrupted tile. Recover the energy before exiting.',
    'Jump travels two tiles in your current direction.',
    ['########', '#S.H.CG#', '########'],
    0,
    5,
    { difficulty: 5 }
  ),
  createLevel(
    6,
    'Switch Protocol',
    'Cipher District',
    'State',
    'Activate the terminal to extend the bridge, then escape.',
    'Stand on the terminal and activate it before crossing B.',
    ['#########', '#STBB.CG#', '#########'],
    0,
    8,
    { difficulty: 6 }
  ),
  createLevel(
    7,
    'Signal Scanner',
    'Cipher District',
    'Conditions',
    'Recover the scattered shards along the corridor.',
    'Repeat: move, then if standing on energy, collect.',
    ['###########', '#S.C.C..CG#', '###########'],
    0,
    11,
    { difficulty: 7 }
  ),
  createLevel(
    8,
    'The Spiral',
    'Cipher District',
    'Nested logic',
    'Follow the path around the void. Collect the shard inside.',
    'Move east, turn south, then turn west on the lower path.',
    ['#########', '#S....###', '#####.###', '##GC..###', '#########'],
    0,
    12,
    { difficulty: 8 }
  ),
  createLevel(
    9,
    'Double Breach',
    'Firewall Core',
    'Jump + state',
    'Power the bridge, jump the hazard and claim the shard.',
    'Activate the terminal, cross the bridge, and jump over the hazard.',
    ['###########', '#STBB.HCG##', '###########'],
    0,
    9,
    { difficulty: 9 }
  ),
  createLevel(
    10,
    'Dead End Decoder',
    'Firewall Core',
    'Sensors',
    'Follow the bent passage to extraction.',
    'Repeat: if a wall is ahead, turn right; otherwise move. Collect when standing on energy.',
    ['#########', '#S...####', '####.####', '####C####', '####G####', '#########'],
    0,
    9,
    { difficulty: 10 }
  ),
  createLevel(
    11,
    'Firewall Guardian',
    'Firewall Core',
    'Boss battle',
    'Collect the charge. Face the guardian and fire three pulses to break its shield.',
    'Pulse works within three tiles in the direction you face. Defeat the guardian before crossing its tile.',
    ['#########', '#SC.X.G##', '#########'],
    0,
    10,
    { bossHealth: 3, difficulty: 11 }
  ),
  createLevel(
    12,
    'Zero Day Escape',
    'Firewall Core',
    'Final mission',
    'Recover every shard, extend the bridge, cross the breach, and destroy the core.',
    'First move onto the terminal and activate. Jump the hazard, collect the second shard, then pulse the core three times.',
    ['#############', '#SCTBB.HC.XG#', '#############'],
    0,
    16,
    { bossHealth: 3, difficulty: 12 }
  ),
  ...generateAdvancedLevels()
];

// Heading vectors: 0: East, 1: South, 2: West, 3: North
export const directions = [
  { x: 1, y: 0 },
  { x: 0, y: 1 },
  { x: -1, y: 0 },
  { x: 0, y: -1 }
];

export const VALID_COMMANDS = new Set([
  'move',
  'left',
  'right',
  'jump',
  'collect',
  'activate',
  'pulse',
  'repeat',
  'if'
]);

export const VALID_SENSORS = new Set([
  'wall',
  'energy',
  'hazard',
  'terminal',
  'guardian'
]);

/**
 * Validates the AST command tree before execution, including unexecuted branches.
 * Rejects malformed values, unbound repetitions, and unknown commands.
 *
 * @param {Array} program
 * @param {number} [maxDepth=8]
 */
export function validateProgram(program, maxDepth = 8) {
  if (!Array.isArray(program)) {
    throw new Error('Program must be a list of commands.');
  }

  // Bound raw payload size to avoid memory exhaustion
  try {
    const serialized = JSON.stringify(program);
    if (serialized && serialized.length > 65536) {
      throw new Error('Program payload exceeds maximum size limit (64KB).');
    }
  } catch (err) {
    if (err.message.includes('maximum size limit')) throw err;
    throw new Error('Program serialization failure.');
  }

  let totalNodes = 0;

  function traverse(nodes, depth) {
    if (depth > maxDepth) {
      throw new Error(`Program nesting is limited to ${maxDepth}.`);
    }
    if (!Array.isArray(nodes)) {
      throw new Error('Invalid command list.');
    }

    for (const node of nodes) {
      if (!node || typeof node !== 'object' || Array.isArray(node)) {
        throw new Error('Invalid command.');
      }
      if (!VALID_COMMANDS.has(node.type)) {
        throw new Error(`Unknown command: ${node.type}`);
      }
      totalNodes++;
      if (totalNodes > 300) {
        throw new Error('Program exceeds the 300-instruction limit.');
      }

      if (node.type === 'repeat') {
        if (!Number.isInteger(node.count) || node.count < 1 || node.count > 30) {
          throw new Error('Repeat count must be between 1 and 30.');
        }
        if (!Array.isArray(node.body)) {
          throw new Error('Repeat block must contain a body array of commands.');
        }
        traverse(node.body, depth + 1);
      } else if (node.type === 'if') {
        if (!VALID_SENSORS.has(node.sensor)) {
          throw new Error(`Unknown sensor: ${node.sensor}`);
        }
        if (!Array.isArray(node.body)) {
          throw new Error('If block must contain a body array of commands.');
        }
        traverse(node.body, depth + 1);
        if (node.elseBody !== undefined) {
          if (!Array.isArray(node.elseBody)) {
            throw new Error('Else body must be an array of commands.');
          }
          traverse(node.elseBody, depth + 1);
        }
      }
    }
  }

  traverse(program, 0);
  return true;
}

/**
 * Calculates initial world state for a sector definition.
 *
 * @param {object} level
 * @returns {object}
 */
export function initialState(level) {
  let x = 0;
  let y = 0;
  level.map.forEach((row, ry) => {
    [...row].forEach((char, rx) => {
      if (char === 'S') {
        x = rx;
        y = ry;
      }
    });
  });

  const hasBoss = level.map.some(row => row.includes('X'));
  const bossHP = hasBoss ? (level.bossHealth || 3) : 0;

  return {
    x,
    y,
    direction: level.direction ?? 0,
    collected: [],
    bridge: false,
    bossHP,
    health: 3,
    steps: 0,
    event: 'ready',
    message: 'Program the drone. The city is waiting.'
  };
}

/**
 * Simulates drone program execution against a sector map deterministically.
 *
 * @param {object} level - Level definition object
 * @param {Array} program - Validated AST command array
 * @returns {object} Simulation outcome with frames, final state, and stars
 */
export function simulate(level, program) {
  validateProgram(program);

  let state = initialState(level);
  let ticks = 0;
  let stopped = false;
  let executedLoops = 0;
  let executedSensors = 0;
  const frames = [{ ...state, collected: [...state.collected] }];
  const totalEnergy = level.map.join('').split('C').length - 1;

  const tile = (x, y) => level.map[y]?.[x] || '#';

  const snapshot = (event, message) => {
    state = {
      ...state,
      event,
      message,
      steps: state.steps + 1
    };
    frames.push({
      ...state,
      collected: [...state.collected]
    });
  };

  const ahead = (distance = 1) => {
    const d = directions[state.direction];
    return {
      x: state.x + d.x * distance,
      y: state.y + d.y * distance
    };
  };

  const blocked = (x, y) => {
    const t = tile(x, y);
    return t === '#' || (t === 'B' && !state.bridge) || (t === 'X' && state.bossHP > 0);
  };

  const sensor = name => {
    const a = ahead(1);
    switch (name) {
      case 'wall':
        return blocked(a.x, a.y);
      case 'energy':
        return tile(state.x, state.y) === 'C' && !state.collected.includes(`${state.x},${state.y}`);
      case 'hazard':
        return tile(a.x, a.y) === 'H';
      case 'terminal':
        return tile(state.x, state.y) === 'T';
      case 'guardian':
        return tile(a.x, a.y) === 'X' && state.bossHP > 0;
      default:
        throw new Error(`Unknown sensor: ${name}`);
    }
  };

  function run(nodes, depth = 0) {
    if (depth > 8) throw new Error('Program nesting is limited to 8.');

    for (const node of nodes) {
      if (stopped) return;
      if (++ticks > 300) throw new Error('Program exceeds the 300-instruction limit.');

      if (node.type === 'repeat') {
        executedLoops++;
        for (let i = 0; i < node.count; i++) {
          if (stopped) break;
          run(node.body, depth + 1);
        }
        continue;
      }

      if (node.type === 'if') {
        executedSensors++;
        const condition = sensor(node.sensor);
        if (condition) {
          run(node.body, depth + 1);
        } else if (node.elseBody && node.elseBody.length > 0) {
          run(node.elseBody, depth + 1);
        }
        continue;
      }

      if (state.steps >= 150) {
        throw new Error('A run can contain at most 150 actions.');
      }

      if (node.type === 'left' || node.type === 'right') {
        state.direction = (state.direction + (node.type === 'left' ? 3 : 1)) % 4;
        snapshot('turn', 'Heading adjusted.');
      } else if (node.type === 'move' || node.type === 'jump') {
        const distance = node.type === 'jump' ? 2 : 1;
        const target = ahead(distance);
        const targetTile = tile(target.x, target.y);

        if (blocked(target.x, target.y) || targetTile === 'H') {
          state.health = Math.max(0, state.health - 1);
          const isHazard = targetTile === 'H';
          snapshot(
            'crash',
            isHazard
              ? 'Corruption hit! Jump over red tiles.'
              : 'Route blocked. Change your program and retry.'
          );
          stopped = true;
          break;
        }

        state.x = target.x;
        state.y = target.y;
        snapshot(
          node.type === 'jump' ? 'jump' : 'move',
          node.type === 'jump' ? 'Breach cleared.' : 'Drone advancing.'
        );
      } else if (node.type === 'collect') {
        const key = `${state.x},${state.y}`;
        if (sensor('energy')) {
          state.collected = [...state.collected, key];
          snapshot('collect', 'Energy shard recovered.');
        } else {
          snapshot('miss', 'No energy on this tile.');
        }
      } else if (node.type === 'activate') {
        if (sensor('terminal')) {
          state.bridge = true;
          snapshot('activate', 'Bridge deployed. Route restored.');
        } else {
          snapshot('miss', 'Move onto a terminal to activate it.');
        }
      } else if (node.type === 'pulse') {
        let hit = false;
        for (let i = 1; i <= 3; i++) {
          const p = ahead(i);
          const t = tile(p.x, p.y);
          if (t === 'X' && state.bossHP > 0) {
            hit = true;
            state.bossHP--;
            break;
          }
          if (t === '#' || t === 'H' || (t === 'B' && !state.bridge)) {
            break;
          }
        }
        snapshot(
          hit ? 'pulse' : 'miss',
          hit
            ? (state.bossHP ? 'Guardian shield damaged.' : 'Firewall destroyed!')
            : 'No guardian in range.'
        );
      }
    }
  }

  run(program);

  const countBlocks = nodes =>
    nodes.reduce(
      (sum, n) =>
        sum + 1 + (n.body ? countBlocks(n.body) : 0) + (n.elseBody ? countBlocks(n.elseBody) : 0),
      0
    );

  const hasCommand = type => {
    const search = nodes =>
      nodes.some(
        n =>
          n.type === type ||
          (n.body && search(n.body)) ||
          (n.elseBody && search(n.elseBody))
      );
    return search(program);
  };

  const programBlocks = countBlocks(program);
  const constraintMessage =
    level.requireLoops && (!hasCommand('repeat') || executedLoops === 0)
      ? 'This sector requires an executed repeat block.'
      : level.requireSensors && (!hasCommand('if') || executedSensors === 0)
      ? 'This sector requires an evaluated sensor condition.'
      : level.maxBlocks && programBlocks > level.maxBlocks
      ? `Program too large: ${programBlocks}/${level.maxBlocks} blocks. Use loops to reduce repetition.`
      : level.maxActions && state.steps > level.maxActions
      ? `Action limit exceeded: ${state.steps}/${level.maxActions}. Plan a more efficient route.`
      : '';

  const reachedGoal = tile(state.x, state.y) === 'G';
  const collectedAll = state.collected.length === totalEnergy;
  const bossDefeated = state.bossHP === 0;
  const passed = !stopped && !constraintMessage && reachedGoal && collectedAll && bossDefeated;

  const message = passed
    ? 'Sector secured. Next level unlocked.'
    : stopped
    ? state.message
    : constraintMessage ||
      (reachedGoal
        ? 'Recover all energy shards and defeat the guardian before extracting.'
        : 'Program finished. Guide the drone to the exit portal.');

  const stars = passed
    ? programBlocks <= Math.ceil(level.par / 2)
      ? 3
      : state.steps <= level.par
      ? 2
      : 1
    : 0;

  return {
    passed,
    stars,
    frames,
    state: { ...state, message },
    message,
    totalEnergy,
    programBlocks
  };
}
