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
  { id: 6, name: 'Singularity', sectors: [21, 22, 23, 24], focus: 'Expert combinations, demanding routes & final 8-point guardian' },
  { id: 7, name: 'Algorithmic Core', sectors: [25, 26, 27, 28, 29, 30, 31, 32], focus: 'Variables, counters, comparisons & while loops' }
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
  ...generateAdvancedLevels(),

  // District 7: Algorithmic Core (Levels 25–32)
  // Stage E: Interactive variables, counters, comparisons, and while loops
  createLevel(
    25,
    'Data Genesis',
    'Algorithmic Core',
    'Variables & Initialization',
    'Initialize variable "target" to 2, then step forward 2 tiles to reach the extraction portal.',
    'Use the set variable block before your movement blocks. Watch the Variables panel record the value.',
    ['#####', '#S.G#', '#####'],
    0,
    3,
    { difficulty: 25, requireVariables: true }
  ),
  createLevel(
    26,
    'Step Counter',
    'Algorithmic Core',
    'Updating Variables & Counters',
    'Collect both energy shards and track each collection with a counter variable "count".',
    'Set count to 0 at the start. Move onto each shard, collect it, and change count by 1.',
    ['######', '#SC.CG#', '######'],
    0,
    6,
    { difficulty: 26, requireVariables: true, requireVarChange: true }
  ),
  createLevel(
    27,
    'Decision Gate',
    'Algorithmic Core',
    'Value Comparisons & If/Else',
    'Compare collected energy with threshold 1. If energy >= 1, turn south toward extraction; else stay on path.',
    'Set power to 0, collect the shard, change power by 1. Use an if block comparing power >= 1 to turn south.',
    ['######', '#S.C##', '###.##', '###G##', '######'],
    0,
    6,
    { difficulty: 27, requireVariables: true }
  ),
  createLevel(
    28,
    'While Loop Protocol',
    'Algorithmic Core',
    'While Loops (Repeat While True)',
    'Advance to extraction using a while loop: repeat while step counter is less than 5.',
    'A while loop checks its condition before every step. As long as step < 5, it executes the loop body.',
    ['########', '#S....G#', '########'],
    0,
    6,
    { difficulty: 28, requireWhile: true }
  ),
  createLevel(
    29,
    'Loop Termination',
    'Algorithmic Core',
    'Counter Termination',
    'Recover 3 energy shards. Update counter "shards" inside the while loop so it terminates after 3 shards.',
    'Inside the loop: move forward, collect shard, and change shards by 1 so shards < 3 becomes false.',
    ['##########', '#S.C.C.CG#', '##########'],
    0,
    10,
    { difficulty: 29, requireWhile: true, requireVarChange: true }
  ),
  createLevel(
    30,
    'Algorithm Fusion',
    'Algorithmic Core',
    'Loop, Counter & Sensor Fusion',
    'Restore the bridge, jump the breach, and use a while loop with a counter to traverse the corridor.',
    'Set step to 0. Activate the terminal, while step < 3 advance, then jump the corruption hazard to extract.',
    ['############', '#STBB.H.C.G#', '############'],
    0,
    10,
    { difficulty: 30, requireWhile: true, requireVariables: true }
  ),
  createLevel(
    31,
    'Infinite Loop Diagnosis',
    'Algorithmic Core',
    'Diagnosing Non-Terminating Loops',
    'Diagnose the runaway loop! A loop without counter updates runs forever. Add "change count by 1" inside the loop.',
    'Without updating the counter inside the loop, count < 4 never becomes false, hitting the execution limit.',
    ['#######', '#S...G#', '#######'],
    0,
    6,
    { difficulty: 31, requireWhile: true, requireVarChange: true }
  ),
  createLevel(
    32,
    'Algorithmic Master',
    'Algorithmic Core',
    'Independent Algorithmic Mastery',
    'Final Chapter Mission: Deploy bridges, recover shards, and dismantle the guardian using a counter-driven while loop.',
    'Set pulses to 0. Use while pulses < 3 to fire directed pulse blasts and dismantle the 3-point guardian shield.',
    ['##############', '#STBB.C..X.G##', '##############'],
    0,
    15,
    { bossHealth: 3, difficulty: 32, requireWhile: true, requireVariables: true }
  )
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
  'if',
  'var_set',
  'var_change',
  'while'
]);

export const VALID_SENSORS = new Set([
  'wall',
  'energy',
  'hazard',
  'terminal',
  'guardian'
]);

export const VALID_COMPARISONS = new Set([
  '==',
  '!=',
  '<',
  '<=',
  '>',
  '>='
]);

export const MAX_VARIABLES = 10;
export const IDENTIFIER_REGEX = /^[a-zA-Z][a-zA-Z0-9_]{0,23}$/;

export const RESERVED_IDENTIFIERS = new Set([
  // JavaScript keywords & builtins
  'break', 'case', 'catch', 'class', 'const', 'continue', 'debugger', 'default',
  'delete', 'do', 'else', 'export', 'extends', 'finally', 'for', 'function',
  'if', 'import', 'in', 'instanceof', 'new', 'return', 'super', 'switch',
  'this', 'throw', 'try', 'typeof', 'var', 'void', 'while', 'with', 'yield',
  'let', 'static', 'enum', 'await', 'async', 'null', 'true', 'false',
  'undefined', 'nan', 'infinity', 'window', 'document', 'global', 'globalthis',
  'process', 'console', 'math', 'string', 'number', 'object', 'array', 'boolean',

  // Python keywords
  'and', 'as', 'assert', 'def', 'del', 'elif', 'except', 'from', 'global',
  'is', 'lambda', 'nonlocal', 'not', 'or', 'pass', 'raise', 'none',

  // Java keywords
  'abstract', 'byte', 'char', 'double', 'final', 'float', 'goto', 'implements',
  'int', 'interface', 'long', 'native', 'package', 'private', 'protected',
  'public', 'short', 'strictfp', 'synchronized', 'throws', 'transient',
  'volatile', 'record', 'sealed', 'permits', 'system',

  // C / C++ keywords
  'auto', 'extern', 'inline', 'register', 'restrict', 'signed', 'sizeof',
  'struct', 'typedef', 'union', 'unsigned', 'bool', 'const_cast', 'dynamic_cast',
  'explicit', 'friend', 'mutable', 'namespace', 'operator', 'reinterpret_cast',
  'static_cast', 'template', 'typeid', 'typename', 'using', 'virtual', 'wchar_t',
  'concept', 'requires', 'co_await', 'co_return', 'co_yield', 'char8_t',
  'char16_t', 'char32_t', 'constexpr', 'consteval', 'constinit', 'decltype',
  'noexcept', 'nullptr', 'static_assert', 'thread_local', 'printf', 'malloc',
  'free', 'exit', 'stdio', 'stdlib', 'iostream', 'vector', 'map',

  // CodeVerse helper identifiers & models
  'drone', 'level', 'main', 'program', 'cvvar', 'consoledronesimulator',
  'console_drone_simulator', 'run_learner_program', 'runlearnerprogram',

  // Object prototype properties
  '__proto__', 'constructor', 'prototype', 'tostring', 'valueof',
  'hasownproperty', 'isprototypeof', 'propertyisenumerable', 'tolocalestring'
]);

export function getIdentifierError(name) {
  if (typeof name !== 'string' || name.length === 0) {
    return 'Variable name cannot be empty.';
  }
  if (name.startsWith('_')) {
    return `Variable "${name}" cannot begin with an underscore ("_"). Underscores at the start are reserved for system internals.`;
  }
  if (name.length > 24) {
    return `Variable "${name}" is too long (${name.length} characters). Variable names must be 24 characters or fewer.`;
  }
  if (!IDENTIFIER_REGEX.test(name)) {
    return `Variable "${name}" must start with a letter and contain only alphanumeric characters and underscores.`;
  }
  if (RESERVED_IDENTIFIERS.has(name.toLowerCase())) {
    return `"${name}" is a reserved keyword or helper identifier in CodeVerse and cannot be used as a variable name.`;
  }
  return null;
}

export function isValidIdentifier(name) {
  return getIdentifierError(name) === null;
}

function validateOperand(operand) {
  if (typeof operand === 'number') {
    if (!Number.isInteger(operand) || operand < -10000 || operand > 10000) {
      throw new Error('Numeric values must be integers between -10,000 and 10,000.');
    }
    return;
  }
  if (typeof operand === 'string') {
    const err = getIdentifierError(operand);
    if (err) throw new Error(err);
    return;
  }
  if (operand && typeof operand === 'object') {
    if (operand.type === 'var_get') {
      const v = operand.var || operand.variable;
      const err = getIdentifierError(v);
      if (err) throw new Error(err);
      return;
    }
    if (operand.type === 'literal') {
      if (!Number.isInteger(operand.value) || operand.value < -10000 || operand.value > 10000) {
        throw new Error('Literal values must be integers between -10,000 and 10,000.');
      }
      return;
    }
  }
  throw new Error(`Invalid operand in program: ${JSON.stringify(operand)}`);
}

function validateCondition(cond, nodeSensor) {
  if (nodeSensor) {
    if (!VALID_SENSORS.has(nodeSensor)) {
      throw new Error(`Unknown sensor: ${nodeSensor}`);
    }
    return;
  }
  if (typeof cond === 'string') {
    if (!VALID_SENSORS.has(cond)) {
      throw new Error(`Unknown sensor condition: ${cond}`);
    }
    return;
  }
  if (cond && typeof cond === 'object') {
    if (cond.type === 'sensor') {
      if (!VALID_SENSORS.has(cond.sensor)) {
        throw new Error(`Unknown sensor: ${cond.sensor}`);
      }
      return;
    }
    if (cond.type === 'compare') {
      if (!VALID_COMPARISONS.has(cond.op)) {
        throw new Error(`Unsupported comparison operator: "${cond.op}".`);
      }
      validateOperand(cond.left);
      validateOperand(cond.right);
      return;
    }
  }
  throw new Error('Condition must be a sensor query or comparison.');
}

/**
 * Validates the AST command tree before execution, including unexecuted branches.
 * Rejects malformed values, unbound repetitions, undefined variables, and unknown commands.
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
  const declaredVars = new Set();

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

      if (node.type === 'var_set') {
        const varName = node.var || node.variable;
        const err = getIdentifierError(varName);
        if (err) throw new Error(err);
        declaredVars.add(varName);
        if (declaredVars.size > MAX_VARIABLES) {
          throw new Error(`Program exceeds the limit of ${MAX_VARIABLES} variables.`);
        }
        validateOperand(node.value !== undefined ? node.value : 0);
      } else if (node.type === 'var_change') {
        const varName = node.var || node.variable;
        const err = getIdentifierError(varName);
        if (err) throw new Error(err);
        declaredVars.add(varName);
        if (declaredVars.size > MAX_VARIABLES) {
          throw new Error(`Program exceeds the limit of ${MAX_VARIABLES} variables.`);
        }
        if (node.amount !== undefined) {
          if (!Number.isInteger(node.amount) || node.amount < -10000 || node.amount > 10000) {
            throw new Error('Counter amount must be an integer between -10,000 and 10,000.');
          }
        }
      } else if (node.type === 'repeat') {
        if (!Number.isInteger(node.count) || node.count < 1 || node.count > 30) {
          throw new Error('Repeat count must be between 1 and 30.');
        }
        if (!Array.isArray(node.body)) {
          throw new Error('Repeat block must contain a body array of commands.');
        }
        traverse(node.body, depth + 1);
      } else if (node.type === 'while') {
        validateCondition(node.condition, node.sensor);
        if (node.condition && typeof node.condition === 'object' && node.condition.type === 'compare') {
          if (typeof node.condition.left === 'string') declaredVars.add(node.condition.left);
          else if (node.condition.left && (node.condition.left.var || node.condition.left.variable)) declaredVars.add(node.condition.left.var || node.condition.left.variable);
          if (typeof node.condition.right === 'string') declaredVars.add(node.condition.right);
          else if (node.condition.right && (node.condition.right.var || node.condition.right.variable)) declaredVars.add(node.condition.right.var || node.condition.right.variable);
          if (declaredVars.size > MAX_VARIABLES) {
            throw new Error(`Program exceeds the limit of ${MAX_VARIABLES} variables.`);
          }
        }
        if (!Array.isArray(node.body)) {
          throw new Error('While block must contain a body array of commands.');
        }
        if (node.body.length > 0) {
          traverse(node.body, depth + 1);
        }
      } else if (node.type === 'if') {
        validateCondition(node.condition, node.sensor);
        if (node.condition && typeof node.condition === 'object' && node.condition.type === 'compare') {
          if (typeof node.condition.left === 'string') declaredVars.add(node.condition.left);
          else if (node.condition.left && (node.condition.left.var || node.condition.left.variable)) declaredVars.add(node.condition.left.var || node.condition.left.variable);
          if (typeof node.condition.right === 'string') declaredVars.add(node.condition.right);
          else if (node.condition.right && (node.condition.right.var || node.condition.right.variable)) declaredVars.add(node.condition.right.var || node.condition.right.variable);
          if (declaredVars.size > MAX_VARIABLES) {
            throw new Error(`Program exceeds the limit of ${MAX_VARIABLES} variables.`);
          }
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
    variables: {},
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
export function simulate(level, program, options = {}) {
  validateProgram(program);

  let state = initialState(level);
  state.variables = Object.create(null);

  let ticks = 0;
  let stopped = false;
  let executedLoops = 0;
  let executedWhileLoops = 0;
  let executedSensors = 0;
  let executedVarUpdates = 0;
  const frames = [{ ...state, collected: [...state.collected], variables: { ...state.variables } }];
  const totalEnergy = level.map.join('').split('C').length - 1;

  const tile = (x, y) => level.map[y]?.[x] || '#';

  const snapshot = (event, message, isCondition = false, meta = {}) => {
    state = {
      ...state,
      event,
      message,
      variables: { ...state.variables },
      steps: isCondition ? state.steps : state.steps + 1
    };
    frames.push({
      ...state,
      ...meta,
      variables: { ...state.variables },
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

  function resolveOperand(operand) {
    if (typeof operand === 'number') {
      if (!Number.isFinite(operand)) throw new Error('Invalid numeric value.');
      const intVal = Math.trunc(operand);
      if (intVal < -10000 || intVal > 10000) {
        throw new Error(`Value out of bounds (${intVal}). Numbers must be between -10,000 and 10,000.`);
      }
      return intVal;
    }
    if (typeof operand === 'string') {
      const err = getIdentifierError(operand);
      if (err) throw new Error(err);
      if (!(operand in state.variables)) {
        throw new Error(`Variable "${operand}" is used before being set.`);
      }
      return state.variables[operand];
    }
    if (operand && typeof operand === 'object') {
      if (operand.type === 'var_get') {
        const vName = operand.var || operand.variable;
        const err = getIdentifierError(vName);
        if (err) throw new Error(err);
        if (!(vName in state.variables)) {
          throw new Error(`Variable "${vName}" is used before being set.`);
        }
        return state.variables[vName];
      }
      if (operand.type === 'literal') {
        const intVal = Math.trunc(operand.value);
        if (intVal < -10000 || intVal > 10000) {
          throw new Error(`Value out of bounds (${intVal}). Numbers must be between -10,000 and 10,000.`);
        }
        return intVal;
      }
    }
    throw new Error(`Invalid operand in expression: ${JSON.stringify(operand)}`);
  }

  function evaluateCondition(cond, nodeSensor) {
    if (nodeSensor) {
      const outcome = sensor(nodeSensor);
      return {
        outcome,
        text: `sensor("${nodeSensor}")`,
        meta: { sensor: nodeSensor, outcome }
      };
    }
    if (typeof cond === 'string') {
      const outcome = sensor(cond);
      return {
        outcome,
        text: `sensor("${cond}")`,
        meta: { sensor: cond, outcome }
      };
    }
    if (cond && typeof cond === 'object') {
      if (cond.type === 'sensor') {
        const outcome = sensor(cond.sensor);
        return {
          outcome,
          text: `sensor("${cond.sensor}")`,
          meta: { sensor: cond.sensor, outcome }
        };
      }
      if (cond.type === 'compare') {
        const leftVal = resolveOperand(cond.left);
        const rightVal = resolveOperand(cond.right);
        const leftLabel = typeof cond.left === 'string' ? cond.left : (cond.left?.var ?? cond.left);
        const rightLabel = typeof cond.right === 'string' ? cond.right : (cond.right?.var ?? cond.right);
        let outcome = false;
        switch (cond.op) {
          case '<': outcome = leftVal < rightVal; break;
          case '<=': outcome = leftVal <= rightVal; break;
          case '>': outcome = leftVal > rightVal; break;
          case '>=': outcome = leftVal >= rightVal; break;
          case '==': outcome = leftVal === rightVal; break;
          case '!=': outcome = leftVal !== rightVal; break;
          default:
            throw new Error(`Unsupported comparison operator: "${cond.op}".`);
        }
        const text = `${leftLabel} ${cond.op} ${rightLabel} (${leftVal} ${cond.op} ${rightVal})`;
        return {
          outcome,
          text,
          meta: {
            comparison: { left: leftLabel, leftVal, op: cond.op, right: rightLabel, rightVal, outcome },
            outcome
          }
        };
      }
    }
    throw new Error('Condition must be a sensor query or comparison.');
  }

  function run(nodes, depth = 0) {
    if (depth > 8) throw new Error('Program nesting is limited to 8.');

    for (const node of nodes) {
      if (stopped) return;
      if (++ticks > 1000) throw new Error('Program exceeds the 1000-instruction execution limit.');

      if (node.type === 'var_set') {
        const varName = node.var || node.variable;
        const err = getIdentifierError(varName);
        if (err) throw new Error(err);
        if (Object.keys(state.variables).length >= MAX_VARIABLES && !(varName in state.variables)) {
          throw new Error(`Maximum limit of ${MAX_VARIABLES} variables exceeded.`);
        }
        const val = resolveOperand(node.value !== undefined ? node.value : 0);
        if (val < -10000 || val > 10000) {
          throw new Error(`Variable "${varName}" out of bounds (${val}). Must be between -10,000 and 10,000.`);
        }
        const prevVal = state.variables[varName];
        state.variables[varName] = val;
        const changeText = prevVal !== undefined
          ? `${varName} changed from ${prevVal} to ${val}.`
          : `Set ${varName} to ${val}.`;
        const varMeta = {
          varMutation: { varName, prevVal: prevVal ?? null, val, changeText },
          variables: { ...state.variables }
        };
        if (node.nodeId) varMeta.nodeId = node.nodeId;
        if (node.blockId) varMeta.blockId = node.blockId;
        snapshot('var_set', changeText, true, varMeta);
        continue;
      }

      if (node.type === 'var_change') {
        executedVarUpdates++;
        const varName = node.var || node.variable;
        const err = getIdentifierError(varName);
        if (err) throw new Error(err);
        if (!(varName in state.variables)) {
          throw new Error(`Variable "${varName}" must be set before changing it.`);
        }
        const amount = Number.isInteger(node.amount) ? node.amount : 1;
        const prevVal = state.variables[varName];
        const newVal = prevVal + amount;
        if (newVal < -10000 || newVal > 10000) {
          throw new Error(`Variable "${varName}" out of bounds (${newVal}). Must be between -10,000 and 10,000.`);
        }
        state.variables[varName] = newVal;
        const changeText = `${varName} changed from ${prevVal} to ${newVal}.`;
        const varMeta = {
          varMutation: { varName, prevVal, val: newVal, changeText },
          variables: { ...state.variables }
        };
        if (node.nodeId) varMeta.nodeId = node.nodeId;
        if (node.blockId) varMeta.blockId = node.blockId;
        snapshot('var_change', changeText, true, varMeta);
        continue;
      }

      if (node.type === 'repeat') {
        executedLoops++;
        for (let i = 0; i < node.count; i++) {
          if (stopped) break;
          run(node.body, depth + 1);
        }
        continue;
      }

      if (node.type === 'while') {
        executedLoops++;
        executedWhileLoops++;
        let loopIters = 0;
        const MAX_WHILE_ITERS = 200;

        while (true) {
          if (stopped) break;
          ticks++;
          loopIters++;

          if (loopIters > MAX_WHILE_ITERS || ticks > 1000) {
            stopped = true;
            const runawayMsg = 'This loop kept repeating because its condition never became false. Try updating the counter inside it.';
            state.message = runawayMsg;
            snapshot('loop_limit', runawayMsg, true, {
              variables: { ...state.variables },
              nodeId: node.nodeId,
              blockId: node.blockId,
              whileCondition: {
                expr: 'runaway_limit',
                outcome: true,
                iteration: loopIters,
                explanation: runawayMsg
              }
            });
            break;
          }

          const condEval = evaluateCondition(node.condition, node.sensor);
          const condMeta = {
            variables: { ...state.variables },
            whileCondition: {
              expr: condEval.text,
              outcome: condEval.outcome,
              iteration: loopIters,
              explanation: `While [${condEval.text}] is ${condEval.outcome ? 'TRUE' : 'FALSE'} (iteration ${loopIters}).`
            }
          };
          if (node.nodeId) condMeta.nodeId = node.nodeId;
          if (node.blockId) condMeta.blockId = node.blockId;
          snapshot('while_step', `While [${condEval.text}] is ${condEval.outcome ? 'TRUE' : 'FALSE'}.`, true, condMeta);

          if (!condEval.outcome) {
            break;
          }

          if (Array.isArray(node.body) && node.body.length > 0) {
            run(node.body, depth + 1);
          }
        }
        continue;
      }

      if (node.type === 'if') {
        executedSensors++;
        const condEval = evaluateCondition(node.condition, node.sensor);
        const shouldRecord = options.recordConditions || Boolean(node.nodeId || node.blockId);
        if (shouldRecord) {
          const outcomeText = condEval.outcome
            ? `Condition [${condEval.text}] is TRUE → Executing IF body.`
            : `Condition [${condEval.text}] is FALSE → ${node.elseBody?.length ? 'Executing ELSE body.' : 'Skipping IF body.'}`;
          const condMeta = {
            variables: { ...state.variables },
            condition: {
              sensor: node.sensor || 'compare',
              outcome: condEval.outcome,
              explanation: outcomeText,
              detail: condEval.meta
            }
          };
          if (node.nodeId) condMeta.nodeId = node.nodeId;
          if (node.blockId) condMeta.blockId = node.blockId;
          snapshot('condition', outcomeText, true, condMeta);
        }
        if (condEval.outcome) {
          run(node.body, depth + 1);
        } else if (node.elseBody && node.elseBody.length > 0) {
          run(node.elseBody, depth + 1);
        }
        continue;
      }

      if (state.steps >= 150) {
        throw new Error('A run can contain at most 150 actions.');
      }

      const actionMeta = {};
      if (node.nodeId) actionMeta.nodeId = node.nodeId;
      if (node.blockId) actionMeta.blockId = node.blockId;

      if (node.type === 'left' || node.type === 'right') {
        state.direction = (state.direction + (node.type === 'left' ? 3 : 1)) % 4;
        snapshot('turn', 'Heading adjusted.', false, actionMeta);
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
              : 'Route blocked. Change your program and retry.',
            false,
            actionMeta
          );
          stopped = true;
          break;
        }

        state.x = target.x;
        state.y = target.y;
        snapshot(
          node.type === 'jump' ? 'jump' : 'move',
          node.type === 'jump' ? 'Breach cleared.' : 'Drone advancing.',
          false,
          actionMeta
        );
      } else if (node.type === 'collect') {
        const key = `${state.x},${state.y}`;
        if (sensor('energy')) {
          state.collected = [...state.collected, key];
          snapshot('collect', 'Energy shard recovered.', false, actionMeta);
        } else {
          snapshot('miss', 'No energy on this tile.', false, actionMeta);
        }
      } else if (node.type === 'activate') {
        if (sensor('terminal')) {
          state.bridge = true;
          snapshot('activate', 'Bridge deployed. Route restored.', false, actionMeta);
        } else {
          snapshot('miss', 'Move onto a terminal to activate it.', false, actionMeta);
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
            : 'No guardian in range.',
          false,
          actionMeta
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
    level.requireVariables && Object.keys(state.variables).length === 0
      ? 'This sector requires initializing and using a variable.'
      : level.requireVarChange && executedVarUpdates === 0
      ? 'This sector requires updating a counter variable.'
      : level.requireWhile && (!hasCommand('while') || executedWhileLoops === 0)
      ? 'This sector requires an executed while loop.'
      : level.requireLoops && (!hasCommand('repeat') || executedLoops === 0)
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
