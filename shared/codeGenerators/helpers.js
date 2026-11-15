/**
 * Utility helpers and constants for CodeVerse multi-language code generators.
 */

export const SUPPORTED_LANGUAGES = [
  'plainEnglish',
  'javascript',
  'python',
  'java',
  'cpp',
  'c'
];

export const LANGUAGE_METADATA = {
  plainEnglish: {
    id: 'plainEnglish',
    label: 'Plain-English',
    extension: 'txt',
    mimeType: 'text/plain',
    commentPrefix: '# ',
    isExecutable: false,
    exportCategory: 'explanation',
    verificationStatus: 'Educational outline (human-readable; not executable code)',
    runtimeRequirement: 'None (educational walkthrough outline)',
    runCommand: 'Read step-by-step alongside the mission grid'
  },
  javascript: {
    id: 'javascript',
    label: 'JavaScript',
    extension: 'js',
    mimeType: 'text/javascript',
    commentPrefix: '// ',
    isExecutable: true,
    exportCategory: 'programming_language',
    verificationStatus: 'Verified via CodeVerse CI test suite',
    runtimeRequirement: 'Node.js (v18+ recommended; LTS v20/v22 verified in project CI)',
    runCommand: 'node drone_mission.js'
  },
  python: {
    id: 'python',
    label: 'Python',
    extension: 'py',
    mimeType: 'text/x-python',
    commentPrefix: '# ',
    isExecutable: true,
    exportCategory: 'programming_language',
    verificationStatus: 'Verified via CodeVerse CI test suite',
    runtimeRequirement: 'Python 3 (3.8+ recommended; 3.10-3.14 verified in project CI)',
    runCommand: 'python drone_mission.py'
  },
  java: {
    id: 'java',
    label: 'Java',
    extension: 'java',
    mimeType: 'text/x-java-source',
    commentPrefix: '// ',
    isExecutable: true,
    exportCategory: 'programming_language',
    verificationStatus: 'Verified via CodeVerse CI test suite',
    runtimeRequirement: 'JDK 11+ (javac compiler and java runtime; JDK 21 verified in project CI)',
    runCommand: 'javac DroneMission.java && java DroneMission'
  },
  cpp: {
    id: 'cpp',
    label: 'C++',
    extension: 'cpp',
    mimeType: 'text/x-c++src',
    commentPrefix: '// ',
    isExecutable: true,
    exportCategory: 'programming_language',
    verificationStatus: 'Verified via CodeVerse CI test suite',
    runtimeRequirement: 'C++17 compliant compiler (GCC 9+, Clang 10+, MSVC 2019+; GCC 11+ verified in project CI)',
    runCommand: 'g++ -std=c++17 -O2 -o drone_mission drone_mission.cpp && ./drone_mission'
  },
  c: {
    id: 'c',
    label: 'C',
    extension: 'c',
    mimeType: 'text/x-csrc',
    commentPrefix: '// ',
    isExecutable: true,
    exportCategory: 'programming_language',
    verificationStatus: 'Verified via CodeVerse CI test suite',
    runtimeRequirement: 'C99 compliant compiler (GCC or Clang; GCC 11+ verified in project CI)',
    runCommand: 'gcc -std=c99 -O2 -o drone_mission drone_mission.c && ./drone_mission'
  }
};

export const SENSOR_DESCRIPTIONS = {
  wall: {
    english: 'obstacle or wall ahead',
    js: '"wall"',
    py: '"wall"',
    java: '"wall"',
    cpp: '"wall"',
    c: '"wall"',
    hint: 'Checks if a solid barrier, closed security gate, or perimeter wall blocks the drone heading.'
  },
  energy: {
    english: 'energy cell at current tile',
    js: '"energy"',
    py: '"energy"',
    java: '"energy"',
    cpp: '"energy"',
    c: '"energy"',
    hint: 'Checks if an uncollected glowing energy cell is present under the drone at its current coordinates.'
  },
  hazard: {
    english: 'corruption breach ahead',
    js: '"hazard"',
    py: '"hazard"',
    java: '"hazard"',
    cpp: '"hazard"',
    c: '"hazard"',
    hint: 'Checks if a red corrupted hazard breach lies 1 step ahead that must be leaped over using jump().'
  },
  terminal: {
    english: 'data terminal at current tile',
    js: '"terminal"',
    py: '"terminal"',
    java: '"terminal"',
    cpp: '"terminal"',
    c: '"terminal"',
    hint: 'Checks if the drone is positioned on an interactive data terminal tile ready for activate().'
  },
  guardian: {
    english: 'corrupted guardian ahead',
    js: '"guardian"',
    py: '"guardian"',
    java: '"guardian"',
    cpp: '"guardian"',
    c: '"guardian"',
    hint: 'Checks if an active cybernetic guardian is stationed 1 tile ahead that requires EMP pulse().'
  }
};

export const ACTION_DESCRIPTIONS = {
  move: {
    english: 'Move forward 1 step',
    js: 'drone.move();',
    py: 'drone.move()',
    java: 'drone.move();',
    cpp: 'drone.move();',
    c: 'drone_move();',
    explanation: 'Advances the drone 1 grid cell forward in its current facing direction.'
  },
  left: {
    english: 'Turn left 90°',
    js: 'drone.left();',
    py: 'drone.left()',
    java: 'drone.left();',
    cpp: 'drone.left();',
    c: 'drone_left();',
    explanation: 'Rotates the drone counter-clockwise 90 degrees without changing tile coordinates.'
  },
  right: {
    english: 'Turn right 90°',
    js: 'drone.right();',
    py: 'drone.right()',
    java: 'drone.right();',
    cpp: 'drone.right();',
    c: 'drone_right();',
    explanation: 'Rotates the drone clockwise 90 degrees without changing tile coordinates.'
  },
  collect: {
    english: 'Collect energy cell',
    js: 'drone.collect();',
    py: 'drone.collect()',
    java: 'drone.collect();',
    cpp: 'drone.collect();',
    c: 'drone_collect();',
    explanation: 'Harvests the glowing energy canister on the current tile into drone storage.'
  },
  jump: {
    english: 'Jump forward 2 steps',
    js: 'drone.jump();',
    py: 'drone.jump()',
    java: 'drone.jump();',
    cpp: 'drone.jump();',
    c: 'drone_jump();',
    explanation: 'Leaps over the tile directly ahead to land 2 steps forward, bypassing ground hazards.'
  },
  activate: {
    english: 'Activate terminal',
    js: 'drone.activate();',
    py: 'drone.activate()',
    java: 'drone.activate();',
    cpp: 'drone.activate();',
    c: 'drone_activate();',
    explanation: 'Transmits data override signal to extend holographic bridges or unlock security gates.'
  },
  pulse: {
    english: 'Emit EMP pulse',
    js: 'drone.pulse();',
    py: 'drone.pulse()',
    java: 'drone.pulse();',
    cpp: 'drone.pulse();',
    c: 'drone_pulse();',
    explanation: 'Discharges an electromagnetic burst to neutralize hostile cyber guardians.'
  }
};

/**
 * Ordered list of variable names for nested loops to guarantee zero variable collisions.
 */
export const LOOP_VARIABLES = ['i', 'j', 'k', 'm', 'n', 'p', 'q', 'r'];

/**
 * Resolves loop variable name at a given nesting depth.
 *
 * @param {number} depth - 0-based loop nesting depth
 * @returns {string} Variable name
 */
export function getLoopVar(depth) {
  if (depth < LOOP_VARIABLES.length) {
    return LOOP_VARIABLES[depth];
  }
  return `idx${depth}`;
}

/**
 * Normalizes language identifier to canonical form.
 *
 * @param {string} lang
 * @returns {string} Canonical language identifier
 */
export function normalizeLanguage(lang) {
  if (!lang || typeof lang !== 'string') return 'javascript';
  const clean = lang.trim().toLowerCase().replace(/[-_ ]/g, '');
  if (clean === 'plainenglish' || clean === 'english' || clean === 'steps' || clean === 'plain') {
    return 'plainEnglish';
  }
  if (clean === 'javascript' || clean === 'js') {
    return 'javascript';
  }
  if (clean === 'python' || clean === 'py') {
    return 'python';
  }
  if (clean === 'java') {
    return 'java';
  }
  if (clean === 'cpp' || clean === 'c++') {
    return 'cpp';
  }
  if (clean === 'c') {
    return 'c';
  }
  return 'javascript';
}

/**
 * Recursively guarantees every node in an AST has stable nodeId and blockId attributes.
 *
 * @param {Array<object>} nodes
 * @param {string} [prefix='n']
 * @returns {Array<object>} AST with stable IDs
 */
export function ensureNodeIdentities(nodes, prefix = 'n') {
  if (!Array.isArray(nodes)) return [];
  return nodes.map((node, index) => {
    const id = node.nodeId || `${prefix}_${index}`;
    const blockId = node.blockId || id;
    const cloned = { ...node, nodeId: id, blockId };
    if (Array.isArray(cloned.body)) {
      cloned.body = ensureNodeIdentities(cloned.body, `${id}_b`);
    }
    if (Array.isArray(cloned.elseBody)) {
      cloned.elseBody = ensureNodeIdentities(cloned.elseBody, `${id}_e`);
    }
    return cloned;
  });
}
