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
 * Ordered list of variable names for generated repeat loops.
 * When programs have no conflicting learner variables, standard idiomatic identifiers (i, j, k, ...) are used.
 * When a learner program defines a variable (such as i), getLoopVar avoids colliding by picking non-conflicting names.
 */
export const LOOP_VARIABLES = ['i', 'j', 'k', 'm', 'n', 'p', 'q', 'r'];

/**
 * Resolves loop variable name at a given nesting depth, avoiding collision with learner program variables.
 *
 * @param {number} depth - 0-based loop nesting depth
 * @param {Set<string> | string[] | null} [usedVars=null] - Variables defined/used in the program
 * @returns {string} Variable name
 */
export function getLoopVar(depth, usedVars = null) {
  if (!usedVars || (Array.isArray(usedVars) && usedVars.length === 0) || (usedVars instanceof Set && usedVars.size === 0)) {
    if (depth < LOOP_VARIABLES.length) {
      return LOOP_VARIABLES[depth];
    }
    return `idx${depth}`;
  }
  const used = usedVars instanceof Set ? usedVars : new Set(usedVars);
  const candidates = [...LOOP_VARIABLES, 's', 't', 'u', 'v', 'w'];
  const available = candidates.filter(v => !used.has(v));
  if (depth < available.length) {
    return available[depth];
  }
  return `_step_${depth}`;
}

/**
 * Traverses an AST to collect all unique variable names referenced in var_set, var_change, or comparisons.
 *
 * @param {Array<object>} ast
 * @returns {string[]} Ordered list of unique variable names
 */
export function collectProgramVariables(ast) {
  const vars = new Set();
  function walkOperand(op) {
    if (!op || typeof op !== 'object') return;
    if (op.type === 'var_get') {
      const v = op.var || op.variable;
      if (v && typeof v === 'string') vars.add(v);
    }
    if (op.index) walkOperand(op.index);
    if (op.value) walkOperand(op.value);
    if (op.left) walkOperand(op.left);
    if (op.right) walkOperand(op.right);
    if (op.low) walkOperand(op.low);
    if (op.high) walkOperand(op.high);
  }
  function walk(nodes) {
    if (!Array.isArray(nodes)) return;
    for (const node of nodes) {
      if (!node || typeof node !== 'object') continue;
      if (node.type === 'var_set' || node.type === 'var_change') {
        const v = node.variable || node.var;
        if (v && typeof v === 'string') vars.add(v);
        walkOperand(node.value);
        walkOperand(node.amount);
      }
      if (node.type === 'array_set') {
        walkOperand(node.index);
        walkOperand(node.value);
      }
      if (node.type === 'fn_call' && Array.isArray(node.args)) {
        for (const arg of node.args) walkOperand(arg);
      }
      if (node.condition && typeof node.condition === 'object' && node.condition.type === 'compare') {
        const left = node.condition.left;
        const right = node.condition.right;
        if (typeof left === 'string') vars.add(left);
        else walkOperand(left);
        if (typeof right === 'string') vars.add(right);
        else walkOperand(right);
      }
      if (Array.isArray(node.body)) walk(node.body);
      if (Array.isArray(node.elseBody)) walk(node.elseBody);
    }
  }
  walk(ast);
  return Array.from(vars);
}

/**
 * Traverses an AST to collect all unique array names declared or referenced.
 *
 * @param {Array<object>} ast
 * @returns {string[]} Ordered list of unique array names
 */
export function collectProgramArrays(ast) {
  const arrays = new Set();
  function walkOperand(op) {
    if (!op || typeof op !== 'object') return;
    if (op.type === 'array_get' || op.type === 'array_length') {
      const a = op.name || op.array;
      if (a && typeof a === 'string') arrays.add(a);
    }
    if (op.index) walkOperand(op.index);
    if (op.value) walkOperand(op.value);
    if (op.left) walkOperand(op.left);
    if (op.right) walkOperand(op.right);
    if (op.low) walkOperand(op.low);
    if (op.high) walkOperand(op.high);
  }
  function walk(nodes) {
    if (!Array.isArray(nodes)) return;
    for (const node of nodes) {
      if (!node || typeof node !== 'object') continue;
      if (node.type === 'array_init' || node.type === 'array_set') {
        const a = node.name || node.array;
        if (a && typeof a === 'string') arrays.add(a);
        if (node.type === 'array_set') {
          walkOperand(node.index);
          walkOperand(node.value);
        }
      }
      if (node.type === 'var_set' || node.type === 'var_change') {
        walkOperand(node.value);
        walkOperand(node.amount);
      }
      if (node.type === 'fn_call' && Array.isArray(node.args)) {
        for (const arg of node.args) walkOperand(arg);
      }
      if (node.condition && typeof node.condition === 'object' && node.condition.type === 'compare') {
        walkOperand(node.condition.left);
        walkOperand(node.condition.right);
      }
      if (Array.isArray(node.body)) walk(node.body);
      if (Array.isArray(node.elseBody)) walk(node.elseBody);
    }
  }
  walk(ast);
  return Array.from(arrays);
}

/**
 * Separates top-level function definition nodes from main program statement nodes.
 *
 * @param {Array<object>} ast
 * @returns {{ functions: Array<object>, body: Array<object> }}
 */
export function partitionAst(ast) {
  const functions = [];
  const body = [];
  if (Array.isArray(ast)) {
    for (const node of ast) {
      if (node && node.type === 'fn_def') {
        functions.push(node);
      } else {
        body.push(node);
      }
    }
  }
  return { functions, body };
}

/**
 * Collects variables referenced at the global level (outside function definitions).
 *
 * @param {Array<object>} ast
 * @returns {string[]}
 */
export function collectGlobalVariables(ast) {
  const { body } = partitionAst(ast);
  return collectProgramVariables(body);
}

/**
 * Collects local variables assigned within a function definition (excluding its parameters).
 *
 * @param {object} fnNode
 * @returns {string[]}
 */
export function collectFunctionLocals(fnNode) {
  if (!fnNode || !Array.isArray(fnNode.body)) return [];
  const params = new Set(fnNode.params || []);
  const allVars = collectProgramVariables(fnNode.body);
  return allVars.filter(v => !params.has(v));
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

/**
 * Formats an AST operand (variable reference or number literal) into target code string.
 *
 * @param {any} operand
 * @param {string} [lang='javascript']
 * @param {object} [options={}]
 * @returns {string} Formatted operand
 */
export function formatOperand(operand, lang = 'javascript', options = {}) {
  if (typeof operand === 'number') return String(operand);
  let varName = null;
  if (typeof operand === 'string') {
    varName = operand;
  } else if (operand && typeof operand === 'object') {
    if (operand.type === 'literal') return String(operand.value);
    if (operand.type === 'var_get') varName = operand.var || operand.variable;
    if (operand.type === 'array_get') {
      const arr = operand.name || operand.array;
      const idx = formatOperand(operand.index !== undefined ? operand.index : 0, lang, options);
      if (options.isRunnable || options.boundedLoops) {
        if (lang === 'javascript') return `_cv_arr_get(drone, "${arr}", ${arr}, ${idx})`;
        if (lang === 'python') return `_cv_arr_get(drone, "${arr}", ${arr}, ${idx})`;
        if (lang === 'java') return `_cv_arr_get("${arr}", ${arr}, ${idx})`;
        if (lang === 'cpp') return `${arr}.get(${idx})`;
        if (lang === 'c') return `_cv_arr_get(&${arr}, ${idx})`;
      }
      if (lang === 'plainEnglish') return `${arr} at index ${idx}`;
      return `${arr}[${idx}]`;
    }
    if (operand.type === 'array_length') {
      const arr = operand.name || operand.array;
      if (lang === 'plainEnglish') return `length of ${arr}`;
      if (lang === 'python') return `len(${arr})`;
      if (lang === 'java') return `${arr}.length`;
      if (lang === 'cpp') return `${arr}.size()`;
      if (lang === 'c') return `${arr}.length`;
      return `${arr}.length`;
    }
    if (operand.type === 'binary_op' || operand.type === 'math_op') {
      const left = formatOperand(operand.left, lang, options);
      const right = formatOperand(operand.right, lang, options);
      const op = operand.op || '+';
      if (lang === 'plainEnglish') {
        const opNames = { '+': 'plus', '-': 'minus', '*': 'multiplied by', '/': 'divided by' };
        return `${left} ${opNames[op] || op} ${right}`;
      }
      if (lang === 'python') {
        if (op === '/') return `(${left} // ${right})`;
        return `(${left} ${op} ${right})`;
      }
      if (lang === 'javascript') {
        if (op === '/') return `Math.trunc(${left} / ${right})`;
        return `(${left} ${op} ${right})`;
      }
      return `(${left} ${op} ${right})`;
    }
    if (operand.type === 'midpoint') {
      const low = formatOperand(operand.low, lang, options);
      const high = formatOperand(operand.high, lang, options);
      if (lang === 'plainEnglish') return `midpoint of ${low} and ${high}`;
      if (lang === 'javascript') return `Math.trunc((${low} + ${high}) / 2)`;
      if (lang === 'python') return `((${low} + ${high}) // 2)`;
      return `((${low} + ${high}) / 2)`;
    }
  }
  if (varName) {
    if (options.isRunnable || options.boundedLoops) {
      if (lang === 'java') return `drone.varGet("${varName}", ${varName})`;
      if (lang === 'c') return `_cv_var_get(&${varName})`;
    }
    return varName;
  }
  return '0';
}

/**
 * Formats condition node or sensor string for target language syntax.
 *
 * @param {object | string | null} cond
 * @param {string | null} sensorName
 * @param {string} [lang='javascript']
 * @param {object} [options={}]
 * @returns {string} Formatted condition
 */
export function formatCondition(cond, sensorName, lang = 'javascript', options = {}) {
  if (sensorName || (cond && cond.type === 'sensor')) {
    const s = sensorName || cond.sensor;
    if (lang === 'c') return `drone_sensor("${s}")`;
    if (lang === 'plainEnglish') {
      const sDesc = SENSOR_DESCRIPTIONS[s]?.english || `${s} detected`;
      return sDesc;
    }
    return `drone.sensor("${s}")`;
  }
  if (cond && cond.type === 'compare') {
    const left = formatOperand(cond.left, lang, options);
    const right = formatOperand(cond.right, lang, options);
    if (lang === 'plainEnglish') {
      const opNames = {
        '<': 'is less than',
        '<=': 'is at most',
        '==': 'equals',
        '!=': 'does not equal',
        '>': 'is greater than',
        '>=': 'is at least'
      };
      return `${left} ${opNames[cond.op] || cond.op} ${right}`;
    }
    return `${left} ${cond.op} ${right}`;
  }
  if (typeof cond === 'string') {
    if (lang === 'c') return `drone_sensor("${cond}")`;
    if (lang === 'plainEnglish') return `${cond} detected`;
    return `drone.sensor("${cond}")`;
  }
  return 'true';
}
