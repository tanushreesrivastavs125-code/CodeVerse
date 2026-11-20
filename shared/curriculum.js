/**
 * CodeVerse Campaign Curriculum & Progressive Learning Engine (Stage C)
 *
 * Provides structured educational content, progressive toolbox definitions,
 * 3-tier graduated hints, visual legends, canonical interactive worked examples,
 * and diagnostic error advice for all 24 campaign levels.
 */

import { levels } from './game.js';

export const VISUAL_LEGEND = {
  robot: {
    symbol: '🤖',
    name: 'Recon Drone',
    description: 'The programmable robot you control. The heading indicator shows which direction it is facing (East, South, West, North).'
  },
  exit: {
    symbol: '🟢',
    name: 'Extraction Portal (G)',
    description: 'The mission destination. Guide your robot to this green portal to complete the level.'
  },
  floor: {
    symbol: '⬜',
    name: 'Floor Tile (.)',
    description: 'Open, safe pathway that the robot can traverse freely.'
  },
  wall: {
    symbol: '⬛',
    name: 'Perimeter Wall (#)',
    description: 'Solid barrier. Moving or jumping into a wall causes a collision and stops your program.'
  },
  energy: {
    symbol: '💎',
    name: 'Energy Shard (C)',
    description: 'Valuable power core. The robot must stand on this tile and execute "collect energy" to recover it before extracting.'
  },
  hazard: {
    symbol: '🟥',
    name: 'Corruption Hazard (H)',
    description: 'Dangerous energy breach. Stepping directly onto a hazard crashes the robot. Use "jump across breach" to leap over it.'
  },
  terminal: {
    symbol: '🕹️',
    name: 'Terminal Switch (T)',
    description: 'Control console. Stand on this tile and execute "activate terminal" to deploy retracted bridges.'
  },
  bridge: {
    symbol: '🌉',
    name: 'Deployable Bridge (B)',
    description: 'Retracted void gap until extended by a terminal switch. Crossing before activation causes a fatal fall.'
  },
  guardian: {
    symbol: '👾',
    name: 'Firewall Guardian (X)',
    description: 'Defensive barrier bot. Stepping into it causes a crash. Face it from up to 3 tiles away and fire pulse discharges to disable its shield.'
  }
};

export const BLOCK_DEFINITIONS = {
  cv_move: {
    type: 'cv_move',
    name: 'Move Forward',
    category: 'Actions',
    description: 'Advances the robot one tile in the direction it is currently facing.',
    syntax: 'move()',
    tip: 'Make sure the tile directly ahead is open floor, not a wall or hazard.'
  },
  cv_left: {
    type: 'cv_left',
    name: 'Turn Left ↶',
    category: 'Actions',
    description: 'Rotates the robot 90 degrees counter-clockwise in place without moving to another tile.',
    syntax: 'turnLeft()',
    tip: 'Turning changes your direction but leaves your position unchanged.'
  },
  cv_right: {
    type: 'cv_right',
    name: 'Turn Right ↷',
    category: 'Actions',
    description: 'Rotates the robot 90 degrees clockwise in place without moving to another tile.',
    syntax: 'turnRight()',
    tip: 'Turning changes your direction but leaves your position unchanged.'
  },
  cv_collect: {
    type: 'cv_collect',
    name: 'Collect Energy ◈',
    category: 'Actions',
    description: 'Picks up an energy shard on the tile the robot is currently standing on.',
    syntax: 'collect()',
    tip: 'You must first move onto the tile containing the shard before collecting.'
  },
  cv_jump: {
    type: 'cv_jump',
    name: 'Jump Across Breach',
    category: 'Actions',
    description: 'Leaps forward exactly two tiles in your current direction, flying over any obstacle or hazard in between.',
    syntax: 'jump()',
    tip: 'Jump travels 2 tiles. Ensure the landing tile two steps ahead is safe floor.'
  },
  cv_activate: {
    type: 'cv_activate',
    name: 'Activate Terminal ⌘',
    category: 'Actions',
    description: 'Triggers a control switch on the current tile, extending connected bridges across void gaps.',
    syntax: 'activate()',
    tip: 'Stand directly on the terminal (T) tile before running activate.'
  },
  cv_pulse: {
    type: 'cv_pulse',
    name: 'Fire Pulse ⚡',
    category: 'Actions',
    description: 'Emits a focused energy pulse up to 3 tiles forward in your facing direction, reducing guardian shields.',
    syntax: 'pulse()',
    tip: 'Works within 1 to 3 tiles in a straight line of sight.'
  },
  cv_repeat: {
    type: 'cv_repeat',
    name: 'Repeat N Times',
    category: 'Control',
    description: 'Repeats all blocks placed inside its loop body a specified number of times.',
    syntax: 'repeat(count) { ... }',
    tip: 'Use loops to replace repeated sequences and keep your code compact.'
  },
  cv_if: {
    type: 'cv_if',
    name: 'If Condition',
    category: 'Control',
    description: 'Checks an environmental sensor condition and executes the enclosed blocks only when true.',
    syntax: 'if (sensor) { ... }',
    tip: 'Attach a sensor like "energy on tile" to check before performing actions.'
  },
  cv_if_else: {
    type: 'cv_if_else',
    name: 'If / Else Branch',
    category: 'Control',
    description: 'Checks a sensor condition: runs the first block list if true, or the else block list if false.',
    syntax: 'if (sensor) { ... } else { ... }',
    tip: 'Great for two-way decisions, such as "if wall ahead then turn right else move forward".'
  },
  cv_sensor: {
    type: 'cv_sensor',
    name: 'Sensor Input',
    category: 'Sensors',
    description: 'Reads the robot surroundings: wall ahead, energy on tile, hazard ahead, on terminal, or guardian ahead.',
    syntax: 'sensor(type)',
    tip: 'Snap this into the condition slot of an If or If/Else block.'
  },
  cv_var_set: {
    type: 'cv_var_set',
    name: 'Set Variable',
    category: 'Variables',
    description: 'Assigns an initial or new value to a named variable in memory.',
    syntax: 'let name = value;',
    tip: 'Create meaningful variable names like "steps" or "count" to track values.'
  },
  cv_var_change: {
    type: 'cv_var_change',
    name: 'Change Variable',
    category: 'Variables',
    description: 'Increases or decreases a variable by a specific number (e.g. counter increment).',
    syntax: 'name += amount;',
    tip: 'Use inside a loop to update counters and prevent infinite loops.'
  },
  cv_var_get: {
    type: 'cv_var_get',
    name: 'Variable Value',
    category: 'Variables',
    description: 'Retrieves the current value stored in a variable for use in comparisons or expressions.',
    syntax: 'name',
    tip: 'Snap this into comparison blocks to check its current value.'
  },
  cv_compare: {
    type: 'cv_compare',
    name: 'Compare Values',
    category: 'Logic',
    description: 'Compares two values using operators (<, <=, ==, !=, >, >=) and returns true or false.',
    syntax: 'left < right',
    tip: 'Connect to an If condition or While loop to control execution.'
  },
  cv_while: {
    type: 'cv_while',
    name: 'While Condition',
    category: 'Control',
    description: 'Repeats all enclosed blocks as long as the specified condition remains true.',
    syntax: 'while (condition) { ... }',
    tip: 'Ensure the loop body updates a variable or state so the condition eventually becomes false.'
  },
  cv_fn_def: {
    type: 'cv_fn_def',
    name: 'Define Routine',
    category: 'Routines',
    description: 'Bundles a series of instructions into a reusable named routine that executes only when called.',
    syntax: 'function name() { ... }',
    tip: 'Define a routine once, then call it as many times as you need.'
  },
  cv_fn_def_param: {
    type: 'cv_fn_def_param',
    name: 'Define Routine with Parameter',
    category: 'Routines',
    description: 'Defines a routine that accepts a numeric parameter for dynamic, customizable actions.',
    syntax: 'function name(param) { ... }',
    tip: 'Use parameters inside repeat loops or comparisons to make routines adaptable.'
  },
  cv_fn_call: {
    type: 'cv_fn_call',
    name: 'Call Routine',
    category: 'Routines',
    description: 'Executes a defined routine from your main program.',
    syntax: 'name();',
    tip: 'Snap this into your program wherever you want to run the routine.'
  },
  cv_fn_call_param: {
    type: 'cv_fn_call_param',
    name: 'Call Routine with Argument',
    category: 'Routines',
    description: 'Executes a parameterized routine, supplying a specific numeric argument.',
    syntax: 'name(argument);',
    tip: 'Pass numbers or variable values into the parameter.'
  },
  cv_array_create: {
    type: 'cv_array_create',
    name: 'Create Array',
    category: 'Arrays',
    description: 'Creates a fixed-length integer array with initial values.',
    syntax: 'let name = [v1, v2, ...];',
    tip: 'Specify a name and list of initial integer values (e.g. 2, 1, 3).'
  },
  cv_array_get: {
    type: 'cv_array_get',
    name: 'Array Element',
    category: 'Arrays',
    description: 'Reads an element from an array at a specific zero-based index.',
    syntax: 'name[index]',
    tip: 'Remember that index 0 accesses the first cell, and index (length - 1) accesses the last cell.'
  },
  cv_array_set: {
    type: 'cv_array_set',
    name: 'Set Array Element',
    category: 'Arrays',
    description: 'Updates an array element at a specific zero-based index.',
    syntax: 'name[index] = value;',
    tip: 'Use an integer index between 0 and length - 1.'
  },
  cv_array_length: {
    type: 'cv_array_length',
    name: 'Array Length',
    category: 'Arrays',
    description: 'Returns the total number of cells in the array.',
    syntax: 'name.length',
    tip: 'Useful for loop limits when traversing all cells from 0 to length - 1.'
  },
  cv_math_op: {
    type: 'cv_math_op',
    name: 'Arithmetic Operation',
    category: 'Math',
    description: 'Performs integer arithmetic (+, -, *, /) on two values.',
    syntax: 'left + right',
    tip: 'Division truncates toward zero (integer division).'
  },
  cv_midpoint: {
    type: 'cv_midpoint',
    name: 'Calculate Midpoint',
    category: 'Math',
    description: 'Calculates the integer midpoint between two indexes: Math.floor((low + high) / 2).',
    syntax: 'mid = Math.floor((low + high) / 2);',
    tip: 'Use to locate the middle index in binary search candidate ranges.'
  },
  cv_break: {
    type: 'cv_break',
    name: 'Break Out of Loop',
    category: 'Control',
    description: 'Immediately exits the innermost repeat or while loop.',
    syntax: 'break;',
    tip: 'Use inside a loop once you find the target item to avoid unnecessary comparisons.'
  }
};

/**
 * Explicit intentional failure worked example demonstrating crash behavior.
 */
export const INTENTIONAL_FAILURE_EXAMPLE = {
  title: 'Wall Collision (Intentional Failure Demo)',
  isIntentionalFailure: true,
  explanation: 'Demonstrates what happens when the robot attempts to move into a solid wall: the simulation halts on collision with an explanatory crash diagnosis.',
  demoLevel: {
    id: 'demo-failure',
    title: 'Collision Demonstration',
    map: ['####', '#S.#', '####'],
    direction: 0,
    bossHealth: 0
  },
  demoMap: ['####', '#S.#', '####'],
  demoInitialState: { x: 1, y: 1, direction: 0 },
  program: [{ type: 'move' }, { type: 'move' }],
  expectedOutcome: {
    passed: false,
    event: 'crash',
    isIntentionalFailure: true
  }
};

/**
 * Structured lesson content, worked examples, visual legends, and 3-tier graduated hints
 * for all 24 campaign levels.
 */
export const LEVEL_CURRICULUM = {
  1: {
    id: 1,
    title: 'Boot Sequence',
    zone: 'Neon Outskirts',
    objective: 'Move the robot forward 3 tiles to reach the green exit portal.',
    learningObjective: 'Understand sequential execution: commands run one after another in order from top to bottom.',
    newConcept: 'Sequences & Forward Movement',
    prerequisites: [],
    practisedSkills: ['Counting steps', 'Connecting blocks in sequence'],
    introducedBlocks: [BLOCK_DEFINITIONS.cv_move],
    allowedBlocks: ['cv_move'],
    conceptExplanation: 'Programs are lists of instructions executed in order. When you stack Move Forward blocks, the robot executes each move one tile at a time in the direction it faces.',
    visualLegend: [VISUAL_LEGEND.robot, VISUAL_LEGEND.floor, VISUAL_LEGEND.exit, VISUAL_LEGEND.wall],
    workedExample: {
      title: 'Taking Two Steps',
      explanation: 'To move forward two tiles, connect two Move Forward blocks in order.',
      demoLevel: {
        id: 'demo-1',
        title: 'Two Steps Demo',
        map: ['####', '#S.G#', '####'],
        direction: 0,
        bossHealth: 0
      },
      demoMap: ['####', '#S.G#', '####'],
      demoInitialState: { x: 1, y: 1, direction: 0 },
      program: [{ type: 'move' }, { type: 'move' }],
      expectedOutcome: {
        passed: true,
        finalPosition: { x: 3, y: 1 },
        collectedCount: 0
      }
    },
    commonMistake: {
      mistake: 'Counting the starting tile as step 1.',
      correction: 'Count the empty spaces between your robot and the exit portal. You need one move command for each step forward.'
    },
    hints: [
      { level: 1, label: 'Notice the Goal', text: 'Look at the green exit portal on the right. How many floor tiles are between the robot and the goal?' },
      { level: 2, label: 'Helpful Concept', text: 'The robot starts facing east toward the exit. You only need forward moves to get there.' },
      { level: 3, label: 'Step-by-Step Suggestion', text: 'Place 3 Move Forward blocks in a vertical stack to reach the portal.' }
    ],
    postSuccessExplanation: 'Great job! Your commands ran in exact sequence from top to bottom. That is the foundation of all computer programming.'
  },
  2: {
    id: 2,
    title: 'Energy Run',
    zone: 'Neon Outskirts',
    objective: 'Collect both energy shards along the path, then extract at the exit.',
    learningObjective: 'Understand action commands and state changes: doing an action on a specific tile.',
    newConcept: 'Actions & Shard Collection',
    prerequisites: ['Level 1: Sequences'],
    practisedSkills: ['Sequential movement', 'Stopping at targets'],
    introducedBlocks: [BLOCK_DEFINITIONS.cv_collect],
    allowedBlocks: ['cv_move', 'cv_collect'],
    conceptExplanation: 'Just moving to the exit is not enough when objectives are on the board! Move onto the tile with the diamond shard, then use "Collect Energy" before moving forward.',
    visualLegend: [VISUAL_LEGEND.robot, VISUAL_LEGEND.energy, VISUAL_LEGEND.exit],
    workedExample: {
      title: 'Step and Collect',
      explanation: 'Move onto a shard, collect it, then step forward to the exit.',
      demoLevel: {
        id: 'demo-2',
        title: 'Collect Demo',
        map: ['#####', '#SCG#', '#####'],
        direction: 0,
        bossHealth: 0
      },
      demoMap: ['#####', '#SCG#', '#####'],
      demoInitialState: { x: 1, y: 1, direction: 0 },
      program: [{ type: 'move' }, { type: 'collect' }, { type: 'move' }],
      expectedOutcome: {
        passed: true,
        finalPosition: { x: 3, y: 1 },
        collectedCount: 1
      }
    },
    commonMistake: {
      mistake: 'Calling Collect Energy before stepping onto the shard tile, or walking past without collecting.',
      correction: 'Always move onto the shard tile first. You cannot collect from an empty tile or from one space away.'
    },
    hints: [
      { level: 1, label: 'Notice the Goal', text: 'There are two energy shards on the path. You must collect both before entering the exit portal.' },
      { level: 2, label: 'Helpful Concept', text: 'Move onto the first shard, run Collect Energy, move to the second shard, and collect again.' },
      { level: 3, label: 'Step-by-Step Suggestion', text: 'Try: Move, Collect, Move, Move, Collect, Move to reach the exit with both shards.' }
    ],
    postSuccessExplanation: 'Awesome! You combined movement with actions to change the game world state.'
  },
  3: {
    id: 3,
    title: 'The First Turn',
    zone: 'Neon Outskirts',
    objective: 'Navigate around the corner, collect the energy shard, and reach the exit.',
    learningObjective: 'Understand heading and orientation: changing direction without moving.',
    newConcept: 'Direction & Turning (Heading)',
    prerequisites: ['Level 2: Actions'],
    practisedSkills: ['Movement', 'Collecting', 'Spatial reasoning'],
    introducedBlocks: [BLOCK_DEFINITIONS.cv_left, BLOCK_DEFINITIONS.cv_right],
    allowedBlocks: ['cv_move', 'cv_left', 'cv_right', 'cv_collect'],
    conceptExplanation: 'The robot has a direction: East (0°), South (90°), West (180°), or North (270°). "Turn Right" rotates clockwise 90 degrees in place without changing position. Move Forward always advances in the current facing direction.',
    visualLegend: [VISUAL_LEGEND.robot, VISUAL_LEGEND.wall, VISUAL_LEGEND.energy, VISUAL_LEGEND.exit],
    workedExample: {
      title: 'Turning a Corner',
      explanation: 'Advance 1 step, turn right to face south, then advance 1 step to the exit.',
      demoLevel: {
        id: 'demo-3',
        title: 'Turn Demo',
        map: ['####', '#S.#', '##G#', '####'],
        direction: 0,
        bossHealth: 0
      },
      demoMap: ['####', '#S.#', '##G#', '####'],
      demoInitialState: { x: 1, y: 1, direction: 0 },
      program: [{ type: 'move' }, { type: 'right' }, { type: 'move' }],
      expectedOutcome: {
        passed: true,
        finalPosition: { x: 2, y: 2 },
        finalDirection: 1
      }
    },
    commonMistake: {
      mistake: 'Assuming turning moves the robot forward.',
      correction: 'Turning only rotates your robot in place. You still need a Move Forward block after turning to step in the new direction.'
    },
    hints: [
      { level: 1, label: 'Notice the Goal', text: 'The path bends down at the third tile. If you keep moving forward without turning, you will crash into the wall.' },
      { level: 2, label: 'Helpful Concept', text: 'Move forward until you reach the corner, then Turn Right so your arrow points south.' },
      { level: 3, label: 'Step-by-Step Suggestion', text: 'Sequence: Move 2 times, Turn Right, Move, Collect, Move to finish.' }
    ],
    postSuccessExplanation: 'Well done! You learned how to control orientation and navigate 2D grid coordinates.'
  },
  4: {
    id: 4,
    title: 'Loop Runner',
    zone: 'Neon Outskirts',
    objective: 'Collect all four shards in the long corridor using a compact program with a loop.',
    learningObjective: 'Understand iteration with repeat loops: running a block group multiple times to eliminate repetitive code.',
    newConcept: 'Repeat Loops (Iteration)',
    prerequisites: ['Level 3: Turning'],
    practisedSkills: ['Spotting repetitive patterns', 'Loop body design'],
    introducedBlocks: [BLOCK_DEFINITIONS.cv_repeat],
    allowedBlocks: ['cv_move', 'cv_left', 'cv_right', 'cv_collect', 'cv_repeat'],
    conceptExplanation: 'When code repeats the same pattern over and over (like move, collect, move, collect), programmers use a loop! "Repeat N Times" runs everything snapped inside its body N times automatically.',
    visualLegend: [VISUAL_LEGEND.robot, VISUAL_LEGEND.energy, VISUAL_LEGEND.exit],
    workedExample: {
      title: 'Repeating Move and Collect',
      explanation: 'Repeat 2 times: move forward and collect energy, then step to exit.',
      demoLevel: {
        id: 'demo-4',
        title: 'Loop Demo',
        map: ['#######', '#SCC.G#', '#######'],
        direction: 0,
        bossHealth: 0
      },
      demoMap: ['#######', '#SCC.G#', '#######'],
      demoInitialState: { x: 1, y: 1, direction: 0 },
      program: [
        { type: 'repeat', count: 2, body: [{ type: 'move' }, { type: 'collect' }] },
        { type: 'move' },
        { type: 'move' }
      ],
      expectedOutcome: {
        passed: true,
        finalPosition: { x: 5, y: 1 },
        collectedCount: 2
      }
    },
    commonMistake: {
      mistake: 'Putting blocks under the repeat block instead of inside its "DO" mouth.',
      correction: 'Blocks must snap INSIDE the loop body to be repeated. Blocks placed below only run once after the loop finishes.'
    },
    hints: [
      { level: 1, label: 'Notice the Goal', text: 'Notice the repeating pattern: Move onto a shard, then Collect. This happens 4 times in a row.' },
      { level: 2, label: 'Helpful Concept', text: 'Place a Move Forward and a Collect Energy block inside a Repeat 4 block.' },
      { level: 3, label: 'Step-by-Step Suggestion', text: 'Use: Repeat 4 [Move, Collect], followed by 2 Move blocks outside the loop to reach the exit.' }
    ],
    postSuccessExplanation: 'Excellent! You wrote a clean, DRY (Don\'t Repeat Yourself) program using a loop.'
  },
  5: {
    id: 5,
    title: 'Broken Circuit',
    zone: 'Cipher District',
    objective: 'Leap over the red corruption hazard tile, collect the shard, and reach the exit.',
    learningObjective: 'Understand multi-tile actions: jumping two tiles to clear hazards.',
    newConcept: 'Breach Jumping (Hazard Traversal)',
    prerequisites: ['Level 4: Loops'],
    practisedSkills: ['Distance calculation', 'Hazard identification'],
    introducedBlocks: [BLOCK_DEFINITIONS.cv_jump],
    allowedBlocks: ['cv_move', 'cv_left', 'cv_right', 'cv_collect', 'cv_repeat', 'cv_jump'],
    conceptExplanation: 'Red tiles are corruption hazards (H) that will crash your robot if stepped on directly. The "Jump Across Breach" command leaps forward 2 tiles, soaring right over the hazard to land safely on the other side.',
    visualLegend: [VISUAL_LEGEND.robot, VISUAL_LEGEND.hazard, VISUAL_LEGEND.floor, VISUAL_LEGEND.exit],
    workedExample: {
      title: 'Jumping a Gap',
      explanation: 'Step forward 1 tile to position in front of hazard, jump 2 tiles over it, landing on the exit.',
      demoLevel: {
        id: 'demo-5',
        title: 'Jump Demo',
        map: ['######', '#S.HG#', '######'],
        direction: 0,
        bossHealth: 0
      },
      demoMap: ['######', '#S.HG#', '######'],
      demoInitialState: { x: 1, y: 1, direction: 0 },
      program: [{ type: 'move' }, { type: 'jump' }],
      expectedOutcome: {
        passed: true,
        finalPosition: { x: 4, y: 1 }
      }
    },
    commonMistake: {
      mistake: 'Jumping when standing too far away or right on top of the hazard.',
      correction: 'Jump travels exactly 2 tiles. Stand directly in front of the hazard tile so your leap lands on the safe tile behind it.'
    },
    hints: [
      { level: 1, label: 'Notice the Goal', text: 'There is a red hazard tile (H) at position 3. Do not use Move Forward into it or the robot will crash.' },
      { level: 2, label: 'Helpful Concept', text: 'Move 1 step forward, then use Jump Across Breach to leap over the red tile.' },
      { level: 3, label: 'Step-by-Step Suggestion', text: 'Sequence: Move, Jump, Move, Collect, Move.' }
    ],
    postSuccessExplanation: 'Superb! You learned how special movement actions can bypass dangerous obstacles.'
  },
  6: {
    id: 6,
    title: 'Switch Protocol',
    zone: 'Cipher District',
    objective: 'Step onto the terminal, activate it to deploy the bridge, then cross to the exit.',
    learningObjective: 'Understand interactive environment mechanics: activating switches to unlock paths.',
    newConcept: 'Interactive Terminals & Bridge Deployment',
    prerequisites: ['Level 5: Jumping'],
    practisedSkills: ['Sequential problem solving', 'Environmental interaction'],
    introducedBlocks: [BLOCK_DEFINITIONS.cv_activate],
    allowedBlocks: ['cv_move', 'cv_left', 'cv_right', 'cv_collect', 'cv_repeat', 'cv_jump', 'cv_activate'],
    conceptExplanation: 'Bridges (B) start retracted as empty void. Stepping onto an unactivated bridge crashes the robot. Step directly onto the terminal (T) tile and run "Activate Terminal" to extend the bridge pathway.',
    visualLegend: [VISUAL_LEGEND.robot, VISUAL_LEGEND.terminal, VISUAL_LEGEND.bridge, VISUAL_LEGEND.exit],
    workedExample: {
      title: 'Activating a Bridge',
      explanation: 'Move onto terminal T, activate it, then cross the extended bridge B to exit.',
      demoLevel: {
        id: 'demo-6',
        title: 'Terminal Bridge Demo',
        map: ['######', '#STBG#', '######'],
        direction: 0,
        bossHealth: 0
      },
      demoMap: ['######', '#STBG#', '######'],
      demoInitialState: { x: 1, y: 1, direction: 0 },
      program: [{ type: 'move' }, { type: 'activate' }, { type: 'move' }, { type: 'move' }],
      expectedOutcome: {
        passed: true,
        bridgeDeployed: true,
        finalPosition: { x: 4, y: 1 }
      }
    },
    commonMistake: {
      mistake: 'Trying to activate the terminal from a distance before standing on it.',
      correction: 'The robot must be standing directly on the terminal switch tile (T) when Activate Terminal is called.'
    },
    hints: [
      { level: 1, label: 'Notice the Goal', text: 'The bridge tiles (B) are offline. You cannot cross them until the terminal switch (T) is triggered.' },
      { level: 2, label: 'Helpful Concept', text: 'Step 1 tile to the terminal, execute Activate Terminal, then walk safely across the bridges.' },
      { level: 3, label: 'Step-by-Step Suggestion', text: 'Plan: Move onto terminal, Activate, Repeat 4 Move across bridges, Collect, Move to exit.' }
    ],
    postSuccessExplanation: 'Great work! You manipulated external system state to clear a path across a breach.'
  },
  7: {
    id: 7,
    title: 'Signal Scanner',
    zone: 'Cipher District',
    objective: 'Gather shards scattered irregularly along the corridor using a conditional check.',
    learningObjective: 'Understand conditional statements: checking whether a condition is true before acting.',
    newConcept: 'Conditionals (If / Sensor)',
    prerequisites: ['Level 6: Terminals'],
    practisedSkills: ['Loop-with-condition pattern', 'Sensors'],
    introducedBlocks: [BLOCK_DEFINITIONS.cv_if, BLOCK_DEFINITIONS.cv_sensor],
    allowedBlocks: ['cv_move', 'cv_left', 'cv_right', 'cv_collect', 'cv_repeat', 'cv_jump', 'cv_activate', 'cv_if', 'cv_sensor'],
    conceptExplanation: 'When shard locations vary, hardcoding individual moves and collects is brittle. The "If" block tests a sensor (like "energy on tile"). If true, it runs the enclosed action. If false, it skips it!',
    visualLegend: [VISUAL_LEGEND.robot, VISUAL_LEGEND.energy, VISUAL_LEGEND.exit],
    workedExample: {
      title: 'Smart Collection (Condition True Case)',
      explanation: 'Move forward onto energy shard, check if standing on energy (evaluates TRUE), collect it, then move to exit.',
      demoLevel: {
        id: 'demo-7',
        title: 'Condition True Demo',
        map: ['#####', '#SCG#', '#####'],
        direction: 0,
        bossHealth: 0
      },
      demoMap: ['#####', '#SCG#', '#####'],
      demoInitialState: { x: 1, y: 1, direction: 0 },
      program: [
        { type: 'move' },
        { type: 'if', sensor: 'energy', body: [{ type: 'collect' }] },
        { type: 'move' }
      ],
      expectedOutcome: {
        passed: true,
        finalPosition: { x: 3, y: 1 },
        collectedCount: 1,
        conditionOutcome: true
      }
    },
    commonMistake: {
      mistake: 'Placing the Move block inside the If block, which gets skipped when no energy is present.',
      correction: 'Keep the Move block in the main loop so the robot always advances, and use the If block only for the conditional Collect.'
    },
    hints: [
      { level: 1, label: 'Notice the Goal', text: 'The energy shards are spaced unevenly: some tiles have energy, some are empty.' },
      { level: 2, label: 'Helpful Concept', text: 'Use a Repeat loop: in each step, Move forward, then check "if energy on tile" to collect.' },
      { level: 3, label: 'Step-by-Step Suggestion', text: 'Combine Repeat 8 [Move, If (energy on tile) [Collect]].' }
    ],
    postSuccessExplanation: 'Fantastic! Your program now makes autonomous decisions based on what it senses in the environment.'
  },
  8: {
    id: 8,
    title: 'The Spiral',
    zone: 'Cipher District',
    objective: 'Navigate around the perimeter wall, collect the central shard, and exit.',
    learningObjective: 'Understand multi-turn path planning and coordinated directional changes.',
    newConcept: 'Multi-Leg Path Navigation',
    prerequisites: ['Level 7: Conditionals'],
    practisedSkills: ['Multiple turns', 'Looping sections', 'Sequential planning'],
    introducedBlocks: [],
    allowedBlocks: ['cv_move', 'cv_left', 'cv_right', 'cv_collect', 'cv_repeat', 'cv_jump', 'cv_activate', 'cv_if', 'cv_sensor'],
    conceptExplanation: 'Real routes often require multiple legs with turns in between. Break the mission into distinct sections: first corridor, first corner, second corridor, second corner, and final stretch.',
    visualLegend: [VISUAL_LEGEND.robot, VISUAL_LEGEND.wall, VISUAL_LEGEND.energy, VISUAL_LEGEND.exit],
    workedExample: {
      title: 'U-Turn Route',
      explanation: 'Move east, turn south, move south, turn west, move west to exit.',
      demoLevel: {
        id: 'demo-8',
        title: 'Spiral U-Turn Demo',
        map: ['####', '#S.#', '#G.#', '####'],
        direction: 0,
        bossHealth: 0
      },
      demoMap: ['####', '#S.#', '#G.#', '####'],
      demoInitialState: { x: 1, y: 1, direction: 0 },
      program: [
        { type: 'move' },
        { type: 'right' },
        { type: 'move' },
        { type: 'right' },
        { type: 'move' }
      ],
      expectedOutcome: {
        passed: true,
        finalPosition: { x: 1, y: 2 },
        finalDirection: 2
      }
    },
    commonMistake: {
      mistake: 'Turning left when facing south expecting to go west.',
      correction: 'Remember: when facing South (down), your robot\'s Right is West (left on the screen)!'
    },
    hints: [
      { level: 1, label: 'Notice the Goal', text: 'Trace the path with your finger: 4 moves east, a turn south, 2 moves south, a turn west, and 2 moves west.' },
      { level: 2, label: 'Helpful Concept', text: 'Use Repeat loops for each straight corridor to stay well within the action budget.' },
      { level: 3, label: 'Step-by-Step Suggestion', text: 'Repeat 4 Move, Turn Right, Move 2, Turn Right, Move 2, Collect, Move.' }
    ],
    postSuccessExplanation: 'Well planned! You navigated a winding 2D route by breaking it into manageable sub-paths.'
  },
  9: {
    id: 9,
    title: 'Double Breach',
    zone: 'Firewall Core',
    objective: 'Deploy the bridge, leap over the hazard, recover the shard, and extract.',
    learningObjective: 'Synthesize multiple mechanics: combining switches, bridges, and hazard jumps.',
    newConcept: 'Mechanic Chaining (Switch + Jump)',
    prerequisites: ['Level 8: The Spiral'],
    practisedSkills: ['Terminal activation', 'Leaping hazards', 'Sequential coordination'],
    introducedBlocks: [],
    allowedBlocks: ['cv_move', 'cv_left', 'cv_right', 'cv_collect', 'cv_repeat', 'cv_jump', 'cv_activate', 'cv_if', 'cv_sensor'],
    conceptExplanation: 'Advanced missions require chaining different mechanics in a single run. Activate the terminal first to bridge the void, cross safely, and prepare to jump when the red hazard appears.',
    visualLegend: [VISUAL_LEGEND.terminal, VISUAL_LEGEND.bridge, VISUAL_LEGEND.hazard, VISUAL_LEGEND.energy, VISUAL_LEGEND.exit],
    workedExample: {
      title: 'Bridge and Leap',
      explanation: 'Activate switch, walk across bridge, then jump over corruption tile to reach exit.',
      demoLevel: {
        id: 'demo-9',
        title: 'Bridge and Jump Demo',
        map: ['#######', '#STBHG#', '#######'],
        direction: 0,
        bossHealth: 0
      },
      demoMap: ['#######', '#STBHG#', '#######'],
      demoInitialState: { x: 1, y: 1, direction: 0 },
      program: [
        { type: 'move' },
        { type: 'activate' },
        { type: 'move' },
        { type: 'jump' }
      ],
      expectedOutcome: {
        passed: true,
        bridgeDeployed: true,
        finalPosition: { x: 5, y: 1 }
      }
    },
    commonMistake: {
      mistake: 'Using Move instead of Jump after crossing the bridge.',
      correction: 'Check the tile ahead: if it is red (H), you must Jump across it, not Move into it.'
    },
    hints: [
      { level: 1, label: 'Notice the Goal', text: 'Notice the two different obstacles: first a bridge gap (B), then a red hazard (H).' },
      { level: 2, label: 'Helpful Concept', text: 'First activate the terminal to deploy the bridge. Then walk across and jump the hazard.' },
      { level: 3, label: 'Step-by-Step Suggestion', text: 'Move, Activate, Repeat 3 Move, Jump, Collect, Move.' }
    ],
    postSuccessExplanation: 'Masterful! You coordinated environmental switches and athletic jumps in a seamless sequence.'
  },
  10: {
    id: 10,
    title: 'Dead End Decoder',
    zone: 'Firewall Core',
    objective: 'Follow the winding corridor to extraction by detecting walls ahead with an If/Else block.',
    learningObjective: 'Understand two-way branching: choosing between two distinct paths using If/Else.',
    newConcept: 'Two-Way Branching (If / Else & Wall Sensor)',
    prerequisites: ['Level 9: Double Breach'],
    practisedSkills: ['Sensors', 'Branching logic', 'Maze following'],
    introducedBlocks: [BLOCK_DEFINITIONS.cv_if_else],
    allowedBlocks: ['cv_move', 'cv_left', 'cv_right', 'cv_collect', 'cv_repeat', 'cv_jump', 'cv_activate', 'cv_if', 'cv_if_else', 'cv_sensor'],
    conceptExplanation: '"If/Else" lets your robot choose between two actions: if a wall is directly ahead, turn right; OTHERWISE, move forward. Repeating this rule lets the robot navigate corners automatically!',
    visualLegend: [VISUAL_LEGEND.robot, VISUAL_LEGEND.wall, VISUAL_LEGEND.energy, VISUAL_LEGEND.exit],
    workedExample: {
      title: 'If / Else Dual Branching (False & True Cases)',
      explanation: 'First step tests sensor(wall) = FALSE (runs ELSE: move). Second step tests sensor(wall) = TRUE (runs IF: turn right). Then finishes to exit.',
      demoLevel: {
        id: 'demo-10',
        title: 'If Else Branching Demo',
        map: ['#####', '#S.##', '##.G#', '#####'],
        direction: 0,
        bossHealth: 0
      },
      demoMap: ['#####', '#S.##', '##.G#', '#####'],
      demoInitialState: { x: 1, y: 1, direction: 0 },
      program: [
        { type: 'if', sensor: 'wall', body: [{ type: 'right' }], elseBody: [{ type: 'move' }] },
        { type: 'if', sensor: 'wall', body: [{ type: 'right' }], elseBody: [{ type: 'move' }] },
        { type: 'move' },
        { type: 'left' },
        { type: 'move' }
      ],
      expectedOutcome: {
        passed: true,
        finalPosition: { x: 3, y: 2 }
      }
    },
    commonMistake: {
      mistake: 'Putting Move inside the "IF wall" branch instead of the "ELSE" branch.',
      correction: 'When a wall is ahead, you cannot move forward! Put Turn Right in the IF branch, and Move in the ELSE branch.'
    },
    hints: [
      { level: 1, label: 'Notice the Goal', text: 'The corridor runs east, hits a wall, and turns south down to the exit.' },
      { level: 2, label: 'Helpful Concept', text: 'Use an If/Else block: if wall ahead, turn right; otherwise, move forward.' },
      { level: 3, label: 'Step-by-Step Suggestion', text: 'Repeat 8: If (wall ahead) [Turn Right] Else [Move], then If (energy on tile) [Collect].' }
    ],
    postSuccessExplanation: 'Incredible! You wrote an autonomous wall-following algorithm using two-way decision logic.'
  },
  11: {
    id: 11,
    title: 'Firewall Guardian',
    zone: 'Firewall Core',
    objective: 'Grab the energy, face the guardian, and fire 3 pulse discharges to take down its shield.',
    learningObjective: 'Understand ranged combat mechanics and state counters: depleting enemy health.',
    newConcept: 'Ranged Pulse Attacks & Guardian Shields',
    prerequisites: ['Level 10: Dead End Decoder'],
    practisedSkills: ['Ranged targeting', 'Repeated actions', 'Combat preparation'],
    introducedBlocks: [BLOCK_DEFINITIONS.cv_pulse],
    allowedBlocks: ['cv_move', 'cv_left', 'cv_right', 'cv_collect', 'cv_repeat', 'cv_jump', 'cv_activate', 'cv_pulse', 'cv_if', 'cv_if_else', 'cv_sensor'],
    conceptExplanation: 'The Firewall Guardian (X) blocks the path with a 3-point energy shield. Stepping into it causes a fatal crash! Face the guardian from 1 to 3 tiles away and fire "Pulse" 3 times to destroy its shield before advancing.',
    visualLegend: [VISUAL_LEGEND.guardian, VISUAL_LEGEND.energy, VISUAL_LEGEND.exit],
    workedExample: {
      title: 'Discharging a Guardian at Range 3',
      explanation: 'From 3 tiles away, fire pulse to destroy guardian shield, then advance through to exit.',
      demoLevel: {
        id: 'demo-11',
        title: 'Guardian Pulse Demo',
        map: ['#######', '#S..X.G#', '#######'],
        direction: 0,
        bossHealth: 1
      },
      demoMap: ['#######', '#S..X.G#', '#######'],
      demoInitialState: { x: 1, y: 1, direction: 0 },
      program: [
        { type: 'pulse' },
        { type: 'move' },
        { type: 'move' },
        { type: 'move' },
        { type: 'move' },
        { type: 'move' }
      ],
      expectedOutcome: {
        passed: true,
        bossHP: 0,
        finalPosition: { x: 6, y: 1 }
      }
    },
    commonMistake: {
      mistake: 'Firing pulse from more than 3 tiles away, or attempting to walk onto the guardian while its shield is active.',
      correction: 'Pulse has a maximum range of 3 tiles. Make sure you are within range, and fire enough pulses to reduce its HP to 0.'
    },
    hints: [
      { level: 1, label: 'Notice the Goal', text: 'The guardian (X) has 3 shield hit points. You must break its shield before passing through.' },
      { level: 2, label: 'Helpful Concept', text: 'Move onto the shard, collect it, move into range, and fire pulse 3 times.' },
      { level: 3, label: 'Step-by-Step Suggestion', text: 'Sequence: Move, Collect, Move, Repeat 3 [Pulse], Repeat 3 [Move] to extraction.' }
    ],
    postSuccessExplanation: 'Victory! You successfully executed ranged combat operations and brought down the firewall.'
  },
  12: {
    id: 12,
    title: 'Zero Day Escape',
    zone: 'Firewall Core',
    objective: 'District 3 Finale: Collect all shards, activate the bridge, jump the breach, defeat the guardian, and escape.',
    learningObjective: 'Full mission synthesis: orchestrating every mechanic learned so far into a cohesive program.',
    newConcept: 'Full System Synthesis (Grand Challenge)',
    prerequisites: ['Level 11: Firewall Guardian'],
    practisedSkills: ['All core actions', 'Jumping', 'Terminals', 'Pulse combat', 'Looping'],
    introducedBlocks: [],
    allowedBlocks: ['cv_move', 'cv_left', 'cv_right', 'cv_collect', 'cv_repeat', 'cv_jump', 'cv_activate', 'cv_pulse', 'cv_if', 'cv_if_else', 'cv_sensor'],
    conceptExplanation: 'This is the ultimate test of the foundational districts! Every obstacle appears on this route: energy shards, an offline bridge, a corruption gap, and a shielded guardian. Plan each stage methodically.',
    visualLegend: [VISUAL_LEGEND.terminal, VISUAL_LEGEND.bridge, VISUAL_LEGEND.hazard, VISUAL_LEGEND.guardian, VISUAL_LEGEND.energy, VISUAL_LEGEND.exit],
    workedExample: {
      title: 'Full Sequence Integration',
      explanation: 'Demonstrates completing an integrated route with multiple mechanics.',
      demoLevel: {
        id: 'demo-12',
        title: 'Full Integration Demo',
        map: ['########', '#SCTBX.G#', '########'],
        direction: 0,
        bossHealth: 1
      },
      demoMap: ['########', '#SCTBX.G#', '########'],
      demoInitialState: { x: 1, y: 1, direction: 0 },
      program: [
        { type: 'move' },
        { type: 'collect' },
        { type: 'move' },
        { type: 'activate' },
        { type: 'pulse' },
        { type: 'move' },
        { type: 'move' },
        { type: 'move' },
        { type: 'move' }
      ],
      expectedOutcome: {
        passed: true,
        collectedCount: 1,
        bridgeDeployed: true,
        bossHP: 0,
        finalPosition: { x: 7, y: 1 }
      }
    },
    commonMistake: {
      mistake: 'Rushing to the boss without activating the bridge or collecting both energy shards.',
      correction: 'Review the mission checklist: 2 shards collected, bridge activated, hazard cleared, guardian shield broken.'
    },
    hints: [
      { level: 1, label: 'Notice the Goal', text: 'Check off each requirement: Collect shard 1, activate terminal, cross bridge, jump hazard, collect shard 2, pulse boss 3 times.' },
      { level: 2, label: 'Helpful Concept', text: 'Break the route into 3 phases: Terminal & Bridge phase, Jump & Second Shard phase, Guardian combat phase.' },
      { level: 3, label: 'Step-by-Step Suggestion', text: 'Move, Collect, Move, Activate, Repeat 3 Move, Jump, Collect, Move, Repeat 3 Pulse, Move 2.' }
    ],
    postSuccessExplanation: 'Outstanding triumph! You have mastered the complete core curriculum of CodeVerse!'
  }
};

/**
 * Generates verified, mechanically accurate curriculum entries for advanced sectors 13-24.
 * Uses real level object properties (crystals, hazards, bridges, bossHP, constraints) directly.
 */
function generateAdvancedCurriculum() {
  const advancedEntries = {};

  // Level-specific verified demonstration definitions for sectors 13-24
  const advancedDemos = {
    13: {
      title: 'Serpentine Multi-Lane Traversal',
      explanation: 'Demonstrates alternating lane turns and crystal recovery inside loops.',
      demoMap: ['######', '#S.C##', '###.##', '#G.C##', '######'],
      direction: 0,
      bossHealth: 0,
      program: [
        { type: 'repeat', count: 2, body: [{ type: 'move' }] },
        { type: 'collect' },
        { type: 'right' },
        { type: 'move' },
        { type: 'move' },
        { type: 'collect' },
        { type: 'right' },
        { type: 'repeat', count: 2, body: [{ type: 'move' }] }
      ],
      expectedOutcome: { passed: true, collectedCount: 2, finalPosition: { x: 1, y: 3 } }
    },
    14: {
      title: 'Corrupted Lane Breach Jump',
      explanation: 'Demonstrates vaulting hazards across lanes and collecting shards.',
      demoMap: ['#######', '#S.HCG#', '#######'],
      direction: 0,
      bossHealth: 0,
      program: [
        { type: 'move' },
        { type: 'jump' },
        { type: 'collect' },
        { type: 'move' }
      ],
      expectedOutcome: { passed: true, collectedCount: 1, finalPosition: { x: 5, y: 1 } }
    },
    15: {
      title: 'Multi-Span Bridge Deployment',
      explanation: 'Demonstrates activating terminal and crossing dual bridge spans.',
      demoMap: ['#######', '#STBBG#', '#######'],
      direction: 0,
      bossHealth: 0,
      program: [
        { type: 'move' },
        { type: 'activate' },
        { type: 'repeat', count: 3, body: [{ type: 'move' }] }
      ],
      expectedOutcome: { passed: true, bridgeDeployed: true, finalPosition: { x: 5, y: 1 } }
    },
    16: {
      title: 'Sentinel Combat with 2-Point Shield',
      explanation: 'Demonstrates collecting shard and depleting 2-point guardian shield with pulse.',
      demoMap: ['######', '#SCX.G#', '######'],
      direction: 0,
      bossHealth: 2,
      program: [
        { type: 'move' },
        { type: 'collect' },
        { type: 'pulse' },
        { type: 'pulse' },
        { type: 'move' },
        { type: 'move' },
        { type: 'move' }
      ],
      expectedOutcome: { passed: true, collectedCount: 1, bossHP: 0, finalPosition: { x: 5, y: 1 } }
    },
    17: {
      title: 'Sensor Evaluation (Condition False Case)',
      explanation: 'Demonstrates sensor(energy) evaluating FALSE on empty tile, safely skipping collect.',
      demoMap: ['######', '#S..G#', '######'],
      direction: 0,
      bossHealth: 0,
      program: [
        { type: 'move' },
        { type: 'if', sensor: 'energy', body: [{ type: 'collect' }] },
        { type: 'repeat', count: 2, body: [{ type: 'move' }] }
      ],
      expectedOutcome: { passed: true, conditionOutcome: false, finalPosition: { x: 4, y: 1 } }
    },
    18: {
      title: 'Conditional Traversal with Hazard Vault',
      explanation: 'Demonstrates sensing energy before jumping over corruption breach.',
      demoMap: ['#######', '#SCH.G#', '#######'],
      direction: 0,
      bossHealth: 0,
      program: [
        { type: 'move' },
        { type: 'if', sensor: 'energy', body: [{ type: 'collect' }] },
        { type: 'jump' },
        { type: 'move' }
      ],
      expectedOutcome: { passed: true, collectedCount: 1, finalPosition: { x: 5, y: 1 } }
    },
    19: {
      title: 'Quantum Lock Bridge & Boss Combat',
      explanation: 'Demonstrates activating bridge then pulsing 2-point guardian before crossing.',
      demoMap: ['########', '#STBX.G#', '########'],
      direction: 0,
      bossHealth: 2,
      program: [
        { type: 'move' },
        { type: 'activate' },
        { type: 'pulse' },
        { type: 'pulse' },
        { type: 'move' },
        { type: 'move' },
        { type: 'move' },
        { type: 'move' }
      ],
      expectedOutcome: { passed: true, bridgeDeployed: true, bossHP: 0, finalPosition: { x: 6, y: 1 } }
    },
    20: {
      title: 'Grid Overload Multi-Phase Synthesis',
      explanation: 'Demonstrates shard sensing, terminal activation, guardian combat, and hazard leap.',
      demoMap: ['##########', '#SCTBX.HG#', '##########'],
      direction: 0,
      bossHealth: 1,
      program: [
        { type: 'move' },
        { type: 'if', sensor: 'energy', body: [{ type: 'collect' }] },
        { type: 'move' },
        { type: 'activate' },
        { type: 'pulse' },
        { type: 'move' },
        { type: 'move' },
        { type: 'move' },
        { type: 'jump' }
      ],
      expectedOutcome: { passed: true, bridgeDeployed: true, bossHP: 0, finalPosition: { x: 8, y: 1 } }
    },
    21: {
      title: 'Deep Core 3-Point Boss Combat',
      explanation: 'Demonstrates looping 3 pulse attacks from range to eliminate deep core boss.',
      demoMap: ['######', '#S.X.G#', '######'],
      direction: 0,
      bossHealth: 3,
      program: [
        { type: 'repeat', count: 3, body: [{ type: 'pulse' }] },
        { type: 'repeat', count: 4, body: [{ type: 'move' }] }
      ],
      expectedOutcome: { passed: true, bossHP: 0, finalPosition: { x: 5, y: 1 } }
    },
    22: {
      title: 'Zero-Waste Loop Compaction',
      explanation: 'Demonstrates traversing corridors under strict block and action limits.',
      demoMap: ['#######', '#S...G#', '#######'],
      direction: 0,
      bossHealth: 0,
      program: [
        { type: 'repeat', count: 4, body: [{ type: 'move' }] }
      ],
      expectedOutcome: { passed: true, finalPosition: { x: 5, y: 1 } }
    },
    23: {
      title: 'Endurance Multi-Shard Sweep & Boss Combat',
      explanation: 'Demonstrates collecting multiple shards along a route and breaking 2-point shield.',
      demoMap: ['########', '#SC.C.XG#', '########'],
      direction: 0,
      bossHealth: 2,
      program: [
        { type: 'move' },
        { type: 'collect' },
        { type: 'move' },
        { type: 'move' },
        { type: 'collect' },
        { type: 'pulse' },
        { type: 'pulse' },
        { type: 'move' },
        { type: 'move' },
        { type: 'move' }
      ],
      expectedOutcome: { passed: true, collectedCount: 2, bossHP: 0, finalPosition: { x: 7, y: 1 } }
    },
    24: {
      title: 'The Singularity Master Climax',
      explanation: 'Full mastery: shard collection, terminal bridge deploy, guardian combat, and extraction.',
      demoMap: ['###########', '#SCTBX.C.G#', '###########'],
      direction: 0,
      bossHealth: 2,
      program: [
        { type: 'move' },
        { type: 'collect' },
        { type: 'move' },
        { type: 'activate' },
        { type: 'pulse' },
        { type: 'pulse' },
        { type: 'move' },
        { type: 'move' },
        { type: 'move' },
        { type: 'move' },
        { type: 'collect' },
        { type: 'move' },
        { type: 'move' }
      ],
      expectedOutcome: { passed: true, collectedCount: 2, bridgeDeployed: true, bossHP: 0, finalPosition: { x: 9, y: 1 } }
    }
  };

  for (let id = 13; id <= 24; id++) {
    const levelObj = levels[id - 1];
    if (!levelObj) continue;

    const mapChars = levelObj.map.join('');
    const crystals = (mapChars.match(/C/g) || []).length;
    const hazards = (mapChars.match(/H/g) || []).length;
    const bridges = (mapChars.match(/B/g) || []).length;
    const bossHealth = levelObj.bossHealth || 0;
    const lanes = Math.floor((levelObj.map.length - 1) / 2);
    const requiresSensors = Boolean(levelObj.requireSensors);
    const requiresLoops = Boolean(levelObj.requireLoops);
    const par = levelObj.par;
    const maxActions = levelObj.maxActions;
    const maxBlocks = levelObj.maxBlocks;

    const demo = advancedDemos[id];

    advancedEntries[id] = {
      id,
      title: levelObj.title,
      zone: levelObj.zone,
      objective: `Navigate ${lanes} lanes in the ${levelObj.zone}, recover all ${crystals} energy shards${hazards ? `, jump ${hazards} corruption hazards` : ''}${bridges ? ', activate bridge switches' : ''}${bossHealth ? `, and defeat the ${bossHealth}-HP guardian` : ''} within ${maxActions} actions and ${maxBlocks} blocks.`,
      learningObjective: requiresSensors
        ? `Master adaptive sensor evaluation inside loops to clear ${lanes} lanes within strict limits (${maxBlocks} blocks, ${maxActions} actions).`
        : `Master multi-lane serpentine routing using alternating right and left turns under par ${par}.`,
      newConcept: requiresSensors ? 'Adaptive Sensor Logic & Budget Constraints' : 'Serpentine Multi-Lane Loops',
      prerequisites: [`Level ${id - 1}`],
      practisedSkills: ['Loop optimization', 'Sensor evaluation', 'Step budget management'],
      introducedBlocks: [],
      allowedBlocks: ['cv_move', 'cv_left', 'cv_right', 'cv_collect', 'cv_repeat', 'cv_jump', 'cv_activate', 'cv_pulse', 'cv_if', 'cv_if_else', 'cv_sensor'],
      conceptExplanation: requiresSensors
        ? `In high-density sectors like ${levelObj.title}, hardcoding every step exceeds the ${maxBlocks} block budget. Wrap your traversal in repeat loops and use "if energy on tile" to collect dynamically.`
        : `When traversing back and forth across ${lanes} lanes, alternate your turns at the end of each corridor (Right-Right on lane 1, Left-Left on lane 2) while keeping movement inside repeat loops.`,
      visualLegend: [VISUAL_LEGEND.robot, VISUAL_LEGEND.energy, VISUAL_LEGEND.hazard, VISUAL_LEGEND.exit],
      workedExample: {
        title: demo.title,
        explanation: demo.explanation,
        demoLevel: {
          id: `demo-${id}`,
          title: demo.title,
          map: demo.demoMap,
          direction: demo.direction,
          bossHealth: demo.bossHealth
        },
        demoMap: demo.demoMap,
        demoInitialState: { x: 1, y: 1, direction: demo.direction },
        program: demo.program,
        expectedOutcome: demo.expectedOutcome
      },
      commonMistake: {
        mistake: `Writing separate blocks for each tile, which causes a "Program too large: ${maxBlocks} blocks limit" failure.`,
        correction: 'Look for repeating lane patterns and condense your moves into Repeat loops.'
      },
      hints: [
        {
          level: 1,
          label: 'Notice the Goal',
          text: `This sector has ${crystals} energy shards across ${lanes} lanes.${bossHealth ? ` The guardian requires ${bossHealth} pulse hits.` : ''} Constraints: max ${maxActions} actions, max ${maxBlocks} blocks.${requiresSensors ? ' You must evaluate a sensor condition.' : ''}${requiresLoops ? ' You must use a repeat loop.' : ''}`
        },
        {
          level: 2,
          label: 'Helpful Concept',
          text: `Plan lane by lane. Alternate turns at corridor ends (Right-Right, then Left-Left). ${requiresSensors ? 'Use "if energy on tile" to collect shards only when present.' : 'Use Repeat loops for long straights.'}`
        },
        {
          level: 3,
          label: 'Step-by-Step Suggestion',
          text: bossHealth
            ? `Face the guardian from 1-3 tiles away and fire pulse ${bossHealth} times before stepping onto its tile. Collect all ${crystals} shards to open extraction.`
            : `Jump corruption hazards (H) and activate terminals (T) to deploy bridges (B) before crossing.`
        }
      ],
      postSuccessExplanation: `Outstanding! You conquered Sector ${id} (${levelObj.title}) demonstrating advanced algorithmic efficiency in the ${levelObj.zone}.`
    };
  }

  return advancedEntries;
}

function generateStageECurriculum() {
  return {
    25: {
      id: 25,
      title: 'Data Genesis',
      zone: 'Algorithmic Core',
      objective: 'Initialize variable "target" to 2, then step forward 2 tiles to reach the extraction portal.',
      learningObjective: 'Understand variables as named storage locations in memory holding integer values.',
      newConcept: 'Variables & Value Initialization',
      prerequisites: ['Level 24: Final Singularity', 'Core Control Flow'],
      practisedSkills: ['Creating variables', 'Setting initial values', 'Observing variable watch panel'],
      introducedBlocks: [BLOCK_DEFINITIONS.cv_var_set],
      allowedBlocks: ['cv_move', 'cv_left', 'cv_right', 'cv_collect', 'cv_var_set'],
      conceptExplanation: 'A variable is a named storage container in computer memory that holds a value (like target = 2). Variables allow programs to store, inspect, and update information dynamically.',
      visualLegend: [VISUAL_LEGEND.robot, VISUAL_LEGEND.floor, VISUAL_LEGEND.exit],
      workedExample: {
        title: 'Creating and Setting a Variable',
        explanation: 'Initialize a variable "steps" to 1, then step forward into the extraction portal.',
        demoLevel: { id: 'demo-25', title: 'Variable Demo', map: ['####', '#S.G#', '####'], direction: 0, bossHealth: 0 },
        demoMap: ['####', '#S.G#', '####'],
        demoInitialState: { x: 1, y: 1, direction: 0 },
        program: [{ type: 'var_set', var: 'steps', value: 1 }, { type: 'move' }, { type: 'move' }],
        expectedOutcome: { passed: true, finalPosition: { x: 3, y: 1 }, collectedCount: 0 }
      },
      commonMistake: {
        mistake: 'Trying to use a variable before setting it.',
        correction: 'Always place a "Set Variable" block first to give your variable an initial number.'
      },
      hints: [
        { level: 1, label: 'Notice the Goal', text: 'Notice the Variables panel on your screen. What value does the mission ask you to store?' },
        { level: 2, label: 'Helpful Concept', text: 'Drag a "Set Variable" block to the top of your program, set variable to target and value to 2.' },
        { level: 3, label: 'Step-by-Step Suggestion', text: 'Stack "set target to 2" followed by two "Move Forward" blocks.' }
      ],
      postSuccessExplanation: 'Great job! You created your first variable in memory. Notice how the Variables panel tracked target = 2 throughout the flight.'
    },
    26: {
      id: 26,
      title: 'Step Counter',
      zone: 'Algorithmic Core',
      objective: 'Collect both energy shards and track each collection with counter variable "count".',
      learningObjective: 'Learn to update variables using counters (incrementing values by a delta).',
      newConcept: 'Counters & Variable Updates',
      prerequisites: ['Level 25: Variables & Values'],
      practisedSkills: ['Initializing counters to 0', 'Incrementing with change variable', 'Tracking events'],
      introducedBlocks: [BLOCK_DEFINITIONS.cv_var_change],
      allowedBlocks: ['cv_move', 'cv_left', 'cv_right', 'cv_collect', 'cv_var_set', 'cv_var_change'],
      conceptExplanation: 'Variables can be updated as programs run! The "Change Variable by 1" block adds 1 to the current stored value. This is how counters track events like items collected or steps taken.',
      visualLegend: [VISUAL_LEGEND.robot, VISUAL_LEGEND.energy, VISUAL_LEGEND.exit],
      workedExample: {
        title: 'Counting Collections',
        explanation: 'Set count to 0, move to shard, collect, change count by 1, then step to exit.',
        demoLevel: { id: 'demo-26', title: 'Counter Demo', map: ['#####', '#SC.G#', '#####'], direction: 0, bossHealth: 0 },
        demoMap: ['#####', '#SC.G#', '#####'],
        demoInitialState: { x: 1, y: 1, direction: 0 },
        program: [{ type: 'var_set', var: 'count', value: 0 }, { type: 'move' }, { type: 'collect' }, { type: 'var_change', var: 'count', amount: 1 }, { type: 'move' }, { type: 'move' }],
        expectedOutcome: { passed: true, finalPosition: { x: 4, y: 1 }, collectedCount: 1 }
      },
      commonMistake: {
        mistake: 'Forgetting to initialize the counter to 0 before changing it.',
        correction: 'Always initialize your counter with "set count to 0" before calling "change count by 1".'
      },
      hints: [
        { level: 1, label: 'Notice the Goal', text: 'You have 2 energy shards to collect. How should your counter variable increase as each shard is recovered?' },
        { level: 2, label: 'Helpful Concept', text: 'Place "change count by 1" immediately after each "collect energy" block.' },
        { level: 3, label: 'Step-by-Step Suggestion', text: 'Initialize count to 0. Move onto each shard, collect, change count by 1, and move to extraction.' }
      ],
      postSuccessExplanation: 'Notice how the counter variable tracked each recovered shard from 0 to 1 to 2! Counters are essential for counting and loop control.'
    },
    27: {
      id: 27,
      title: 'Decision Gate',
      zone: 'Algorithmic Core',
      objective: 'Compare collected energy with threshold 1. If power >= 1, turn south toward extraction; else stay on path.',
      learningObjective: 'Understand comparison operators (<, <=, ==, !=, >, >=) to make decisions based on variable values.',
      newConcept: 'Value Comparisons & Conditional Branches',
      prerequisites: ['Level 26: Counters', 'Conditional Branching'],
      practisedSkills: ['Comparing variables to numbers', 'Using comparison in If/Else', 'Relational operators'],
      introducedBlocks: [BLOCK_DEFINITIONS.cv_var_get, BLOCK_DEFINITIONS.cv_compare],
      allowedBlocks: ['cv_move', 'cv_left', 'cv_right', 'cv_collect', 'cv_var_set', 'cv_var_change', 'cv_var_get', 'cv_compare', 'cv_if', 'cv_if_else'],
      conceptExplanation: 'Comparison operators compare two values and produce true or false. In this sector, "power >= 1" evaluates whether you have collected enough power to open the south exit branch.',
      visualLegend: [VISUAL_LEGEND.robot, VISUAL_LEGEND.energy, VISUAL_LEGEND.exit],
      workedExample: {
        title: 'Comparing Values in an If Block',
        explanation: 'Initialize count to 1. If count >= 1, turn right to reach the goal.',
        demoLevel: { id: 'demo-27', title: 'Comparison Demo', map: ['###', '#S#', '#G#', '###'], direction: 0, bossHealth: 0 },
        demoMap: ['###', '#S#', '#G#', '###'],
        demoInitialState: { x: 1, y: 1, direction: 0 },
        program: [{ type: 'var_set', var: 'count', value: 1 }, { type: 'if', condition: { type: 'compare', left: 'count', op: '>=', right: 1 }, body: [{ type: 'right' }, { type: 'move' }] }],
        expectedOutcome: { passed: true, finalPosition: { x: 1, y: 2 }, collectedCount: 0 }
      },
      commonMistake: {
        mistake: 'Confusing comparison operator >= (greater than or equal) with assignment.',
        correction: 'Comparison operators compare two values without changing them, returning true or false to guide the If block.'
      },
      hints: [
        { level: 1, label: 'Notice the Goal', text: 'Recover the shard and update variable "power" to 1. Which direction should the drone turn when power >= 1?' },
        { level: 2, label: 'Helpful Concept', text: 'Snap the comparison block into the If condition slot: set left to "power", operator to ">=", right to 1.' },
        { level: 3, label: 'Step-by-Step Suggestion', text: 'Inside the If body, turn right and move south 2 tiles to reach the extraction portal.' }
      ],
      postSuccessExplanation: 'Comparison expressions give your programs the intelligence to make decisions based on calculated data, not just hardcoded paths!'
    },
    28: {
      id: 28,
      title: 'While Loop Protocol',
      zone: 'Algorithmic Core',
      objective: 'Advance to extraction using a while loop: repeat while step counter is less than 5.',
      learningObjective: 'Understand while loops: repeated execution governed by a continuing condition.',
      newConcept: 'While Loops (Repeat While True)',
      prerequisites: ['Level 27: Comparisons', 'Loops'],
      practisedSkills: ['While loop condition evaluation', 'Loop body execution', 'Pre-condition checking'],
      introducedBlocks: [BLOCK_DEFINITIONS.cv_while],
      allowedBlocks: ['cv_move', 'cv_left', 'cv_right', 'cv_collect', 'cv_var_set', 'cv_var_change', 'cv_var_get', 'cv_compare', 'cv_while'],
      conceptExplanation: 'A while loop repeats its body as long as its condition is true. Before each iteration, the condition is evaluated. As soon as the condition becomes false, the loop ends immediately.',
      visualLegend: [VISUAL_LEGEND.robot, VISUAL_LEGEND.floor, VISUAL_LEGEND.exit],
      workedExample: {
        title: 'Stepping with a While Loop',
        explanation: 'Initialize step = 0. While step < 2, move forward and increment step.',
        demoLevel: { id: 'demo-28', title: 'While Loop Demo', map: ['####', '#S.G#', '####'], direction: 0, bossHealth: 0 },
        demoMap: ['####', '#S.G#', '####'],
        demoInitialState: { x: 1, y: 1, direction: 0 },
        program: [{ type: 'var_set', var: 'step', value: 0 }, { type: 'while', condition: { type: 'compare', left: 'step', op: '<', right: 2 }, body: [{ type: 'move' }, { type: 'var_change', var: 'step', amount: 1 }] }],
        expectedOutcome: { passed: true, finalPosition: { x: 3, y: 1 }, collectedCount: 0 }
      },
      commonMistake: {
        mistake: 'Expecting while loop to run if the condition starts false.',
        correction: 'If the while loop condition is false at the start, the body never runs even once.'
      },
      hints: [
        { level: 1, label: 'Notice the Goal', text: 'Count how many steps forward lead to the exit portal (5 steps).' },
        { level: 2, label: 'Helpful Concept', text: 'Set variable "step" to 0. Add a while loop with condition "step < 5".' },
        { level: 3, label: 'Step-by-Step Suggestion', text: 'Inside the loop, place "Move Forward" and "change step by 1".' }
      ],
      postSuccessExplanation: 'While loops are the universal loop of computer science! Unlike repeat blocks with fixed numbers, while loops can run as long as any condition remains true.'
    },
    29: {
      id: 29,
      title: 'Loop Termination',
      zone: 'Algorithmic Core',
      objective: 'Recover 3 energy shards. Update counter "shards" inside the while loop so it terminates after 3 shards.',
      learningObjective: 'Understand loop termination: modifying loop control variables inside the body to prevent infinite execution.',
      newConcept: 'Counter-Driven Loop Termination',
      prerequisites: ['Level 28: While Loops'],
      practisedSkills: ['Loop invariants', 'Guaranteed termination', 'Progress toward termination condition'],
      introducedBlocks: [],
      allowedBlocks: ['cv_move', 'cv_left', 'cv_right', 'cv_collect', 'cv_var_set', 'cv_var_change', 'cv_var_get', 'cv_compare', 'cv_while'],
      conceptExplanation: 'For a while loop to stop, something inside the loop body must change the condition! By incrementing a counter variable like "shards" each time a shard is collected, "shards < 3" eventually becomes false and execution proceeds.',
      visualLegend: [VISUAL_LEGEND.robot, VISUAL_LEGEND.energy, VISUAL_LEGEND.exit],
      workedExample: {
        title: 'Terminating After Two Items',
        explanation: 'Initialize items = 0. While items < 2: move, collect, increment counter.',
        demoLevel: { id: 'demo-29', title: 'Termination Demo', map: ['######', '#SC.CG#', '######'], direction: 0, bossHealth: 0 },
        demoMap: ['######', '#SC.CG#', '######'],
        demoInitialState: { x: 1, y: 1, direction: 0 },
        program: [{ type: 'var_set', var: 'items', value: 0 }, { type: 'while', condition: { type: 'compare', left: 'items', op: '<', right: 2 }, body: [{ type: 'move' }, { type: 'collect' }, { type: 'var_change', var: 'items', amount: 1 }, { type: 'move' }] }],
        expectedOutcome: { passed: true, finalPosition: { x: 5, y: 1 }, collectedCount: 2 }
      },
      commonMistake: {
        mistake: 'Putting the counter update outside the while loop.',
        correction: 'The counter update must be INSIDE the while loop body so it increments on every iteration.'
      },
      hints: [
        { level: 1, label: 'Notice the Goal', text: 'Notice the corridor pattern: move, move, collect shard. How many shards are there?' },
        { level: 2, label: 'Helpful Concept', text: 'Set "shards" to 0. Use while condition "shards < 3". Inside the loop: move, move, collect, and change shards by 1.' },
        { level: 3, label: 'Step-by-Step Suggestion', text: 'After the while loop finishes, add one final move to enter the extraction portal.' }
      ],
      postSuccessExplanation: 'You mastered loop termination! Every well-designed loop must make progress toward its termination condition on every pass.'
    },
    30: {
      id: 30,
      title: 'Algorithm Fusion',
      zone: 'Algorithmic Core',
      objective: 'Restore the bridge, jump the breach, and use a while loop with a counter to traverse the corridor.',
      learningObjective: 'Combine variables, counter-controlled while loops, and physical robot actions (terminals, jumps, collection).',
      newConcept: 'Multi-Paradigm Algorithm Fusion',
      prerequisites: ['Level 29: Loop Termination', 'Terminal & Jump Mechanics'],
      practisedSkills: ['Interleaving actions and loop logic', 'Bridge deployment', 'Hazard clearing'],
      introducedBlocks: ['cv_jump', 'cv_activate'],
      allowedBlocks: ['cv_move', 'cv_left', 'cv_right', 'cv_collect', 'cv_jump', 'cv_activate', 'cv_var_set', 'cv_var_change', 'cv_var_get', 'cv_compare', 'cv_while'],
      conceptExplanation: 'Real-world software combines many techniques into a single pipeline. In this sector, your code coordinates hardware activation, algorithmic while loops, and spatial jumps.',
      visualLegend: [VISUAL_LEGEND.robot, VISUAL_LEGEND.terminal, VISUAL_LEGEND.bridge, VISUAL_LEGEND.hazard, VISUAL_LEGEND.energy, VISUAL_LEGEND.exit],
      workedExample: {
        title: 'Switch then Loop',
        explanation: 'Step on terminal, activate bridge, then while loop across the deployed bridge.',
        demoLevel: { id: 'demo-30', title: 'Fusion Demo', map: ['######', '#STBBG#', '######'], direction: 0, bossHealth: 0 },
        demoMap: ['######', '#STBBG#', '######'],
        demoInitialState: { x: 1, y: 1, direction: 0 },
        program: [{ type: 'move' }, { type: 'activate' }, { type: 'var_set', var: 'k', value: 0 }, { type: 'while', condition: { type: 'compare', left: 'k', op: '<', right: 3 }, body: [{ type: 'move' }, { type: 'var_change', var: 'k', amount: 1 }] }],
        expectedOutcome: { passed: true, finalPosition: { x: 5, y: 1 }, collectedCount: 0 }
      },
      commonMistake: {
        mistake: 'Crossing the bridge before activating the terminal.',
        correction: 'Step onto the terminal (T) and execute "activate" before moving onto bridge (B) tiles.'
      },
      hints: [
        { level: 1, label: 'Notice the Goal', text: 'First move to the terminal (T) and activate it to deploy the bridges.' },
        { level: 2, label: 'Helpful Concept', text: 'Use while "i < 3" to move across the deployed bridge tiles, updating i by 1 each time.' },
        { level: 3, label: 'Step-by-Step Suggestion', text: 'After the bridge, jump the red hazard (H), collect the diamond shard, and step to extraction.' }
      ],
      postSuccessExplanation: 'Flawless execution! You fused variable tracking, loop repetition, and reactive environment control into a single robust algorithm.'
    },
    31: {
      id: 31,
      title: 'Infinite Loop Diagnosis',
      zone: 'Algorithmic Core',
      objective: 'Diagnose the runaway loop! A loop without counter updates runs forever. Add "change count by 1" inside the loop.',
      learningObjective: 'Diagnose and repair runaway infinite loops using safe bounded execution limits.',
      newConcept: 'Debugging Runaway Loops & Execution Limits',
      prerequisites: ['Level 30: Fusion'],
      practisedSkills: ['Root-cause analysis', 'Loop condition inspection', 'Safe boundary debugging'],
      introducedBlocks: [],
      allowedBlocks: ['cv_move', 'cv_left', 'cv_right', 'cv_collect', 'cv_var_set', 'cv_var_change', 'cv_var_get', 'cv_compare', 'cv_while'],
      conceptExplanation: 'An infinite loop happens when a loop condition never becomes false. The engine protects your computer with safe execution limits. When a loop exceeds its budget, it safely halts with diagnostic feedback.',
      visualLegend: [VISUAL_LEGEND.robot, VISUAL_LEGEND.floor, VISUAL_LEGEND.exit],
      workedExample: {
        title: 'Infinite Loop Demonstration (Intentional Failure Demo)',
        isIntentionalFailure: true,
        explanation: 'Demonstrates what happens when a while loop condition never becomes false: the engine safely halts execution and returns a diagnostic message.',
        demoLevel: { id: 'demo-31-fail', title: 'Runaway Loop Demo', map: ['####', '#S.G#', '####'], direction: 0, bossHealth: 0 },
        demoMap: ['####', '#S.G#', '####'],
        demoInitialState: { x: 1, y: 1, direction: 0 },
        program: [{ type: 'var_set', var: 'count', value: 0 }, { type: 'while', condition: { type: 'compare', left: 'count', op: '<', right: 4 }, body: [] }],
        expectedOutcome: { passed: false, event: 'loop_limit', isIntentionalFailure: true }
      },
      commonMistake: {
        mistake: 'Forgetting to increment the loop control variable.',
        correction: 'Ensure every while loop has a command inside it that brings the condition closer to becoming false.'
      },
      hints: [
        { level: 1, label: 'Notice the Goal', text: 'Look at the loop condition: "count < 4". Does the value of "count" ever change inside the loop?' },
        { level: 2, label: 'Helpful Concept', text: 'Because "count" stays 0 forever, 0 < 4 is always true! Add "change count by 1" inside the loop.' },
        { level: 3, label: 'Step-by-Step Suggestion', text: 'With "change count by 1" inside, count will reach 4 after 4 moves and the loop will cleanly terminate at the goal.' }
      ],
      postSuccessExplanation: 'Debugging infinite loops is one of the most critical skills in software engineering! You diagnosed the root cause and implemented the terminating counter update.'
    },
    32: {
      id: 32,
      title: 'Algorithmic Master',
      zone: 'Algorithmic Core',
      objective: 'Final Chapter Mission: Deploy bridges, recover shards, and dismantle the guardian using a counter-driven while loop.',
      learningObjective: 'Synthesize all computational thinking concepts into an autonomous, bounded drone mission.',
      newConcept: 'Comprehensive Algorithmic Synthesis',
      prerequisites: ['Level 31: Runaway Diagnosis', 'Full Campaign Mastery'],
      practisedSkills: ['Complex variable management', 'Multi-phase algorithmic planning', 'Combat loops'],
      introducedBlocks: ['cv_pulse'],
      allowedBlocks: ['cv_move', 'cv_left', 'cv_right', 'cv_collect', 'cv_jump', 'cv_activate', 'cv_pulse', 'cv_var_set', 'cv_var_change', 'cv_var_get', 'cv_compare', 'cv_while', 'cv_if', 'cv_if_else'],
      conceptExplanation: 'The final challenge of the Algorithmic Core! Orchestrate bridge deployment, shard recovery, and a bounded while loop that fires precision pulse discharges to dismantle the firewall guardian.',
      visualLegend: [VISUAL_LEGEND.robot, VISUAL_LEGEND.terminal, VISUAL_LEGEND.bridge, VISUAL_LEGEND.energy, VISUAL_LEGEND.guardian, VISUAL_LEGEND.exit],
      workedExample: {
        title: 'Pulse While Loop Combat',
        explanation: 'Initialize pulses = 0. While pulses < 2, fire pulse and increment pulses.',
        demoLevel: { id: 'demo-32', title: 'Combat While Demo', map: ['######', '#S..XG#', '######'], direction: 0, bossHealth: 2 },
        demoMap: ['######', '#S..XG#', '######'],
        demoInitialState: { x: 1, y: 1, direction: 0 },
        program: [{ type: 'var_set', var: 'pulses', value: 0 }, { type: 'move' }, { type: 'while', condition: { type: 'compare', left: 'pulses', op: '<', right: 2 }, body: [{ type: 'pulse' }, { type: 'var_change', var: 'pulses', amount: 1 }] }, { type: 'move' }, { type: 'move' }, { type: 'move' }],
        expectedOutcome: { passed: true, finalPosition: { x: 5, y: 1 }, collectedCount: 0 }
      },
      commonMistake: {
        mistake: 'Trying to pass the guardian before depleting its 3 shield points.',
        correction: 'Face the guardian from up to 3 tiles away and fire 3 pulse strikes before stepping onto its tile.'
      },
      hints: [
        { level: 1, label: 'Notice the Goal', text: 'Activate the terminal first to cross the bridge and collect the energy shard.' },
        { level: 2, label: 'Helpful Concept', text: 'Position the drone facing the guardian. Use a while loop with condition "pulses < 3" to fire pulse strikes.' },
        { level: 3, label: 'Step-by-Step Suggestion', text: 'Once the guardian is defeated, move through the cleared sector to the extraction portal.' }
      ],
      postSuccessExplanation: '🏆 ALGORITHMIC CORE CONQUERED! You have mastered variables, counters, comparisons, and while loops, completing the CodeVerse algorithmic expansion.'
    }
  };
}

function generateStageE2Curriculum() {
  return {
    33: {
      id: 33,
      title: 'Routine Protocol',
      zone: 'Procedural Matrix',
      objective: 'Define routine "walkThree" and call it to guide the drone to the extraction portal.',
      learningObjective: 'Understand named routines as reusable blocks of instructions that only run when called.',
      newConcept: 'Named Routines (Procedures)',
      prerequisites: ['Level 32: Algorithmic Master', 'While Loops & Variables'],
      practisedSkills: ['Defining a routine', 'Calling a routine', 'Call stack inspection'],
      introducedBlocks: [BLOCK_DEFINITIONS.cv_fn_def, BLOCK_DEFINITIONS.cv_fn_call],
      allowedBlocks: ['cv_move', 'cv_left', 'cv_right', 'cv_collect', 'cv_fn_def', 'cv_fn_call'],
      conceptExplanation: 'A routine (or procedure/function) is a named sequence of instructions bundled together. Defining a routine teaches the drone what to do, but the routine only runs when you call it with a "call routine" block.',
      visualLegend: [VISUAL_LEGEND.robot, VISUAL_LEGEND.floor, VISUAL_LEGEND.exit],
      workedExample: {
        title: 'Defining and Calling a Routine',
        explanation: 'Define routine walkThree containing 3 move blocks, then call walkThree from main.',
        demoLevel: { id: 'demo-33', title: 'Routine Demo', map: ['#####', '#S..G#', '#####'], direction: 0, bossHealth: 0 },
        demoMap: ['#####', '#S..G#', '#####'],
        demoInitialState: { x: 1, y: 1, direction: 0 },
        program: [
          { type: 'fn_def', name: 'walkThree', params: [], body: [{ type: 'move' }, { type: 'move' }, { type: 'move' }] },
          { type: 'fn_call', name: 'walkThree', args: [] }
        ],
        expectedOutcome: { passed: true, finalPosition: { x: 4, y: 1 }, collectedCount: 0 }
      },
      commonMistake: {
        mistake: 'Defining a routine but forgetting to call it.',
        correction: 'A definition only creates the routine. Add a "call routine [walkThree]" block in your main program to execute it.'
      },
      hints: [
        { level: 1, label: 'Notice the Goal', text: 'You need to advance 3 tiles into the portal. The mission requires defining and calling a routine.' },
        { level: 2, label: 'Helpful Concept', text: 'Drag a "define routine" block and name it walkThree. Place 3 "move" blocks inside it.' },
        { level: 3, label: 'Step-by-Step Suggestion', text: 'Below your definition, place a "call routine walkThree" block.' }
      ],
      postSuccessExplanation: 'walkThree runs these instructions whenever you call it. You defined your first routine and called it successfully!'
    },
    34: {
      id: 34,
      title: 'Echo Corridor',
      zone: 'Procedural Matrix',
      objective: 'Define reusable routine "advance" and call it at least twice to collect shards in both corridors.',
      learningObjective: 'Apply routine reusability: write instructions once and call the routine multiple times.',
      newConcept: 'Routine Reusability & Multiple Calls',
      prerequisites: ['Level 33: Routine Protocol'],
      practisedSkills: ['Routine reusability', 'Multiple calls', 'Code deduplication'],
      introducedBlocks: [],
      allowedBlocks: ['cv_move', 'cv_left', 'cv_right', 'cv_collect', 'cv_fn_def', 'cv_fn_call'],
      conceptExplanation: 'The true power of routines is reusability! Instead of copying identical sequences of blocks, define a single routine and call it multiple times from different points in your program.',
      visualLegend: [VISUAL_LEGEND.robot, VISUAL_LEGEND.energy, VISUAL_LEGEND.floor, VISUAL_LEGEND.exit],
      workedExample: {
        title: 'Calling a Routine Multiple Times',
        explanation: 'Define routine advance (move, collect, move) and call it twice to clear both corridors.',
        demoLevel: { id: 'demo-34', title: 'Echo Demo', map: ['#####', '#SC.#', '#GC.#', '#####'], direction: 0, bossHealth: 0 },
        demoMap: ['#####', '#SC.#', '#GC.#', '#####'],
        demoInitialState: { x: 1, y: 1, direction: 0 },
        program: [
          { type: 'fn_def', name: 'advance', params: [], body: [{ type: 'move' }, { type: 'collect' }, { type: 'move' }] },
          { type: 'fn_call', name: 'advance', args: [] },
          { type: 'right' },
          { type: 'move' },
          { type: 'right' },
          { type: 'fn_call', name: 'advance', args: [] }
        ],
        expectedOutcome: { passed: true, finalPosition: { x: 1, y: 2 }, collectedCount: 2 }
      },
      commonMistake: {
        mistake: 'Creating two separate identical routines instead of calling the same routine twice.',
        correction: 'Use one routine definition and place two "call routine advance" blocks in your program.'
      },
      hints: [
        { level: 1, label: 'Notice the Goal', text: 'Both corridors have a shard and need to be traversed. Notice the repeated pattern.' },
        { level: 2, label: 'Helpful Concept', text: 'Define routine "advance" with: move, collect, move. Call it for the top corridor, navigate down, and call it again.' },
        { level: 3, label: 'Step-by-Step Suggestion', text: 'Call advance, turn right, move 2, turn right, and call advance again to extract.' }
      ],
      postSuccessExplanation: 'Brilliant reuse! Calling advance twice saved blocks and eliminated duplicate instructions.'
    },
    35: {
      id: 35,
      title: 'Parameter Matrix',
      zone: 'Procedural Matrix',
      objective: 'Define routine "march" with parameter "steps", and call it with argument 5 to advance across the corridor.',
      learningObjective: 'Pass numeric values into routines via parameters to make them dynamic and adaptable.',
      newConcept: 'Numeric Parameters & Pass-by-Value Arguments',
      prerequisites: ['Level 34: Echo Corridor'],
      practisedSkills: ['Parameter definition', 'Argument passing', 'Dynamic routine execution'],
      introducedBlocks: [BLOCK_DEFINITIONS.cv_fn_def_param, BLOCK_DEFINITIONS.cv_fn_call_param],
      allowedBlocks: ['cv_move', 'cv_left', 'cv_right', 'cv_repeat', 'cv_val_num', 'cv_var_get', 'cv_fn_def', 'cv_fn_def_param', 'cv_fn_call', 'cv_fn_call_param'],
      conceptExplanation: 'Parameters allow routines to accept inputs. When calling march(5), the number 5 is passed into parameter "steps", allowing the routine to repeat movement dynamically.',
      visualLegend: [VISUAL_LEGEND.robot, VISUAL_LEGEND.floor, VISUAL_LEGEND.exit],
      workedExample: {
        title: 'Parameterized Routine Execution',
        explanation: 'Define march with parameter steps. Call march with argument 4 to cover the distance.',
        demoLevel: { id: 'demo-35', title: 'Parameter Demo', map: ['#######', '#S...G#', '#######'], direction: 0, bossHealth: 0 },
        demoMap: ['#######', '#S...G#', '#######'],
        demoInitialState: { x: 1, y: 1, direction: 0 },
        program: [
          { type: 'fn_def', name: 'march', params: ['steps'], body: [{ type: 'repeat', count: 4, body: [{ type: 'move' }] }] },
          { type: 'fn_call', name: 'march', args: [4] }
        ],
        expectedOutcome: { passed: true, finalPosition: { x: 5, y: 1 }, collectedCount: 0 }
      },
      commonMistake: {
        mistake: 'Calling a parameterized routine without supplying an argument.',
        correction: 'Ensure you snap a number block (5) into the argument socket of the "call routine with" block.'
      },
      hints: [
        { level: 1, label: 'Notice the Goal', text: 'The corridor requires 5 steps forward. Define a parameterized routine named march.' },
        { level: 2, label: 'Helpful Concept', text: 'Use "define routine march with parameter steps". Inside, use a repeat loop to move.' },
        { level: 3, label: 'Step-by-Step Suggestion', text: 'Call march with argument 5 to complete the traversal in one clean procedure call.' }
      ],
      postSuccessExplanation: 'Parameters mastered! The routine received argument 5, ran the loop 5 times, and returned to main.'
    },
    36: {
      id: 36,
      title: 'Modulated Strides',
      zone: 'Procedural Matrix',
      objective: 'Call parameterized routine "march" twice with different arguments (2, then 4) to navigate both straight corridors.',
      learningObjective: 'Reuse a single routine across varying distances by modulating argument values.',
      newConcept: 'Varying Arguments across Repeated Calls',
      prerequisites: ['Level 35: Parameter Matrix'],
      practisedSkills: ['Argument modulation', 'Multi-distance navigation', 'Procedural abstraction'],
      introducedBlocks: [],
      allowedBlocks: ['cv_move', 'cv_left', 'cv_right', 'cv_collect', 'cv_repeat', 'cv_val_num', 'cv_var_get', 'cv_fn_def', 'cv_fn_def_param', 'cv_fn_call', 'cv_fn_call_param'],
      conceptExplanation: 'One routine, many uses! By changing the argument in each call (march with 2, then march with 4), the same routine effortlessly handles corridors of completely different lengths.',
      visualLegend: [VISUAL_LEGEND.robot, VISUAL_LEGEND.energy, VISUAL_LEGEND.floor, VISUAL_LEGEND.exit],
      workedExample: {
        title: 'Calling with Different Arguments',
        explanation: 'Call march with 1 to reach shard, then call march with 2 to reach extraction.',
        demoLevel: { id: 'demo-36', title: 'Modulated Demo', map: ['#####', '#SC##', '##.##', '##G##', '#####'], direction: 0, bossHealth: 0 },
        demoMap: ['#####', '#SC##', '##.##', '##G##', '#####'],
        demoInitialState: { x: 1, y: 1, direction: 0 },
        program: [
          { type: 'fn_def', name: 'march', params: ['steps'], body: [
            { type: 'var_set', variable: 'cnt', value: 0 },
            { type: 'while', condition: { type: 'compare', left: 'cnt', op: '<', right: 'steps' }, body: [
              { type: 'move' },
              { type: 'var_change', variable: 'cnt', amount: 1 }
            ]}
          ]},
          { type: 'fn_call', name: 'march', args: [1] },
          { type: 'collect' },
          { type: 'right' },
          { type: 'fn_call', name: 'march', args: [2] }
        ],
        expectedOutcome: { passed: true, finalPosition: { x: 2, y: 3 }, collectedCount: 1 }
      },
      commonMistake: {
        mistake: 'Hardcoding separate routines for distance 2 and distance 4.',
        correction: 'Define one routine "march(steps)" and modulate the argument: call march(2), then call march(4).'
      },
      hints: [
        { level: 1, label: 'Notice the Goal', text: 'First lane is 2 steps to the shard. Second lane is 4 steps down to the portal.' },
        { level: 2, label: 'Helpful Concept', text: 'Define routine march(steps). Call march with argument 2, collect the shard, turn right, and call march with argument 4.' },
        { level: 3, label: 'Step-by-Step Suggestion', text: 'Call march(2), collect, turn right, call march(4).' }
      ],
      postSuccessExplanation: 'Dynamic procedures in action! One routine adapted to two different corridor lengths.'
    },
    37: {
      id: 37,
      title: 'Procedural Composition',
      zone: 'Procedural Matrix',
      objective: 'Compose routine "clearSection" inside a loop to leap corruption hazards and recover energy shards along the route.',
      learningObjective: 'Combine routines with loops and conditionals to structure complex algorithms.',
      newConcept: 'Routine Composition with Loops & Conditions',
      prerequisites: ['Level 36: Modulated Strides', 'Repeat Loops'],
      practisedSkills: ['Routine composition', 'Nested execution', 'Algorithmic flow'],
      introducedBlocks: [],
      allowedBlocks: ['cv_move', 'cv_left', 'cv_right', 'cv_jump', 'cv_collect', 'cv_repeat', 'cv_if', 'cv_fn_def', 'cv_fn_def_param', 'cv_fn_call', 'cv_fn_call_param'],
      conceptExplanation: 'Routines can be composed cleanly inside repeat loops and if conditions. Calling a routine inside a loop repeats the entire procedure on every iteration.',
      visualLegend: [VISUAL_LEGEND.robot, VISUAL_LEGEND.hazard, VISUAL_LEGEND.energy, VISUAL_LEGEND.exit],
      workedExample: {
        title: 'Routine Called Inside a Loop',
        explanation: 'Define vault (jump, move, collect) and call it inside a repeat loop.',
        demoLevel: { id: 'demo-37', title: 'Composition Demo', map: ['########', '#S.H.CG#', '########'], direction: 0, bossHealth: 0 },
        demoMap: ['########', '#S.H.CG#', '########'],
        demoInitialState: { x: 1, y: 1, direction: 0 },
        program: [
          { type: 'fn_def', name: 'vault', params: [], body: [{ type: 'jump' }, { type: 'move' }, { type: 'collect' }] },
          { type: 'move' },
          { type: 'repeat', count: 1, body: [{ type: 'fn_call', name: 'vault', args: [] }] },
          { type: 'move' }
        ],
        expectedOutcome: { passed: true, finalPosition: { x: 6, y: 1 }, collectedCount: 1 }
      },
      commonMistake: {
        mistake: 'Putting the repeat loop inside the routine instead of calling the routine inside the loop.',
        correction: 'Keep the routine focused on clearing one section, then place "call clearSection" inside your repeat loop.'
      },
      hints: [
        { level: 1, label: 'Notice the Goal', text: 'Notice the two repeating hazard-and-shard sections. Compose a routine inside a loop.' },
        { level: 2, label: 'Helpful Concept', text: 'Define clearSection with: move, jump, move, collect. Call clearSection inside a repeat 2 loop.' },
        { level: 3, label: 'Step-by-Step Suggestion', text: 'Repeat 2 times: call clearSection. Then take 1 step into the exit portal.' }
      ],
      postSuccessExplanation: 'Seamless composition! Combining routines with loops creates compact, readable programs.'
    },
    38: {
      id: 38,
      title: 'Procedural Architect',
      zone: 'Procedural Matrix',
      objective: 'Final Chapter Mission: Deploy bridges, leap hazards, recover shards, and dismantle the guardian using parameterized routines.',
      learningObjective: 'Integrate routines, parameters, loops, and conditions to solve a multi-phase system challenge.',
      newConcept: 'Comprehensive Procedural Mastery',
      prerequisites: ['Level 37: Procedural Composition', 'Guardian Combat', 'Terminal Activation'],
      practisedSkills: ['System decomposition', 'Multiple parameterized routines', 'End-to-end procedural architecture'],
      introducedBlocks: ['cv_pulse'],
      allowedBlocks: ['cv_move', 'cv_left', 'cv_right', 'cv_jump', 'cv_collect', 'cv_activate', 'cv_pulse', 'cv_repeat', 'cv_while', 'cv_if', 'cv_val_num', 'cv_var_get', 'cv_var_set', 'cv_var_change', 'cv_compare', 'cv_fn_def', 'cv_fn_def_param', 'cv_fn_call', 'cv_fn_call_param'],
      conceptExplanation: 'The ultimate procedural challenge! Decompose the mission into reusable routines: one for traversal (march), one for pulse combat (firePulses). Orchestrate them to activate terminals, leap hazards, recover energy, and defeat the guardian.',
      visualLegend: [VISUAL_LEGEND.robot, VISUAL_LEGEND.terminal, VISUAL_LEGEND.bridge, VISUAL_LEGEND.hazard, VISUAL_LEGEND.energy, VISUAL_LEGEND.guardian, VISUAL_LEGEND.exit],
      workedExample: {
        title: 'Multi-Routine Architectural Climax',
        explanation: 'Decompose traversal and combat into separate parameterized routines.',
        demoLevel: { id: 'demo-38', title: 'Mastery Demo', map: ['#########', '#STB.X.G#', '#########'], direction: 0, bossHealth: 1 },
        demoMap: ['#########', '#STB.X.G#', '#########'],
        demoInitialState: { x: 1, y: 1, direction: 0 },
        program: [
          { type: 'fn_def', name: 'strike', params: ['pulses'], body: [{ type: 'repeat', count: 1, body: [{ type: 'pulse' }] }] },
          { type: 'fn_def', name: 'march', params: ['steps'], body: [
            { type: 'var_set', variable: 'c', value: 0 },
            { type: 'while', condition: { type: 'compare', left: 'c', op: '<', right: 'steps' }, body: [
              { type: 'move' },
              { type: 'var_change', variable: 'c', amount: 1 }
            ]}
          ]},
          { type: 'move' },
          { type: 'activate' },
          { type: 'fn_call', name: 'march', args: [2] },
          { type: 'fn_call', name: 'strike', args: [1] },
          { type: 'fn_call', name: 'march', args: [3] }
        ],
        expectedOutcome: { passed: true, bridgeDeployed: true, bossHP: 0, finalPosition: { x: 7, y: 1 } }
      },
      commonMistake: {
        mistake: 'Trying to solve the entire complex route without defining reusable routines.',
        correction: 'Break the route into phases: march(3) to cross the bridge, vault the breach, and firePulses(3) to dismantle the guardian shield.'
      },
      hints: [
        { level: 1, label: 'Notice the Goal', text: 'Check off each mission phase: Activate terminal, cross bridge, jump breach, collect shard, pulse guardian 3 times, extract.' },
        { level: 2, label: 'Helpful Concept', text: 'Define march(steps) for repeated movement and firePulses(count) for guardian combat.' },
        { level: 3, label: 'Step-by-Step Suggestion', text: 'Move, activate, call march(3), jump, move, collect, move, call firePulses(3), call march(4).' }
      ],
      postSuccessExplanation: '🏆 PROCEDURAL MATRIX CONQUERED! You have mastered routines, parameters, arguments, and procedural architecture. Outstanding computational mastery!'
    }
  };
}

/**
 * Stage E3: Fixed-length integer arrays, zero-based indexing, element updates & traversal (Levels 39–44).
 */
export function generateStageE3Curriculum() {
  return {
    39: {
      id: 39,
      title: 'Memory Allocation',
      zone: 'Memory Matrix',
      objective: 'Initialize array "cells" with power levels [2, 1, 3] to calibrate the drone capacitor banks, then navigate to the extraction portal.',
      learningObjective: 'Understand how arrays store an ordered list of items in numbered memory cells starting at index 0.',
      newConcept: 'Arrays & Numbered Memory Cells',
      prerequisites: ['Variables', 'Procedural Matrix'],
      practisedSkills: ['Array creation', 'Fixed-length integer arrays', 'Memory inspection'],
      introducedBlocks: ['cv_array_create'],
      allowedBlocks: ['cv_move', 'cv_left', 'cv_right', 'cv_repeat', 'cv_array_create'],
      conceptExplanation: 'An array is an ordered container that holds multiple values in numbered cells. In CodeVerse, array cells are numbered starting at 0: the first item is at index 0, the second at index 1, and so on. Inspect your array in the Array Watch panel!',
      visualLegend: [VISUAL_LEGEND.robot, VISUAL_LEGEND.floor, VISUAL_LEGEND.exit],
      workedExample: {
        title: 'Creating an Array',
        explanation: 'Initialize an array with values [2, 1, 3] and take steps to the exit.',
        demoLevel: { id: 'demo-39', title: 'Array Demo', map: ['######', '#S..G#', '######'], direction: 0, bossHealth: 0 },
        demoMap: ['######', '#S..G#', '######'],
        demoInitialState: { x: 1, y: 1, direction: 0 },
        program: [
          { type: 'array_init', name: 'cells', values: [2, 1, 3] },
          { type: 'repeat', count: 3, body: [{ type: 'move' }] }
        ],
        expectedOutcome: { passed: true, finalPosition: { x: 4, y: 1 } }
      },
      commonMistake: {
        mistake: 'Thinking the first cell in an array is numbered 1.',
        correction: 'Remember zero-based indexing: the first cell is always index 0!'
      },
      hints: [
        { level: 1, label: 'Notice the Goal', text: 'Create array "cells" with initial values [2, 1, 3], then advance 4 steps forward.' },
        { level: 2, label: 'Helpful Concept', text: 'Drag the "create array cells with values" block to the top of your program.' },
        { level: 3, label: 'Step-by-Step Suggestion', text: 'Create array cells with [2, 1, 3]. Use repeat 4 times: move forward.' }
      ],
      postSuccessExplanation: 'Welcome to Memory Matrix! You created your first array and inspected its numbered cells in memory.'
    },
    40: {
      id: 40,
      title: 'Zero-Based Reading',
      zone: 'Memory Matrix',
      objective: 'The passcode distance to the energy shard is stored at index 0 of array "codes" [3, 1, 4]. Read codes[0] into variable "dist" to reach the shard and extract.',
      learningObjective: 'Read specific array elements using zero-based bracket indexing.',
      newConcept: 'Zero-Based Array Indexing',
      prerequisites: ['Level 39: Memory Allocation', 'Variables'],
      practisedSkills: ['Array indexing', 'Array element reading', 'Data-driven execution'],
      introducedBlocks: ['cv_array_get'],
      allowedBlocks: ['cv_move', 'cv_collect', 'cv_repeat', 'cv_var_set', 'cv_var_get', 'cv_array_create', 'cv_array_get'],
      conceptExplanation: 'To retrieve a value from an array, provide its index number in brackets: codes[0] retrieves the first element, codes[1] retrieves the second, etc. Using codes[0] lets your code dynamically read saved data!',
      visualLegend: [VISUAL_LEGEND.robot, VISUAL_LEGEND.energy, VISUAL_LEGEND.exit],
      workedExample: {
        title: 'Reading from Index 0',
        explanation: 'Create array codes with [2, 1], read codes[0] into stepCount, and move that many times.',
        demoLevel: { id: 'demo-40', title: 'Read Demo', map: ['#######', '#S.C.G#', '#######'], direction: 0, bossHealth: 0 },
        demoMap: ['#######', '#S.C.G#', '#######'],
        demoInitialState: { x: 1, y: 1, direction: 0 },
        program: [
          { type: 'array_init', name: 'codes', values: [2, 1] },
          { type: 'var_set', variable: 'stepCount', value: { type: 'array_get', name: 'codes', index: 0 } },
          { type: 'repeat', count: 2, body: [{ type: 'move' }] },
          { type: 'collect' },
          { type: 'repeat', count: 2, body: [{ type: 'move' }] }
        ],
        expectedOutcome: { passed: true, finalPosition: { x: 5, y: 1 }, collectedCount: 1 }
      },
      commonMistake: {
        mistake: 'Using index 1 when attempting to read the very first item in the array.',
        correction: 'Zero-based indexing means index 0 is the first item. Index 1 is the second item.'
      },
      hints: [
        { level: 1, label: 'Notice the Goal', text: 'Create array codes [3, 1, 4]. Read index 0 to get 3, step forward 3 times to collect the shard.' },
        { level: 2, label: 'Helpful Concept', text: 'Set variable dist to value from array codes at index 0. Then repeat move dist (3) times.' },
        { level: 3, label: 'Step-by-Step Suggestion', text: 'Create array codes [3, 1, 4]. Set dist to codes[0]. Repeat 3: move. Collect. Repeat 4: move.' }
      ],
      postSuccessExplanation: 'Precision read! codes[0] gave you the exact distance needed to reach the shard.'
    },
    41: {
      id: 41,
      title: 'Element Mutation',
      zone: 'Memory Matrix',
      objective: 'Calibrate the bridge security buffer: update broken cell "bridgeBuffer" at index 1 from 0 to 1, activate the terminal, and cross the bridge.',
      learningObjective: 'Update and modify individual array elements in place using index assignment.',
      newConcept: 'Array Element Mutation',
      prerequisites: ['Level 40: Zero-Based Reading', 'Terminals & Bridges'],
      practisedSkills: ['In-place mutation', 'Targeted index assignment', 'System calibration'],
      introducedBlocks: ['cv_array_set'],
      allowedBlocks: ['cv_move', 'cv_activate', 'cv_collect', 'cv_repeat', 'cv_array_create', 'cv_array_get', 'cv_array_set'],
      conceptExplanation: 'Arrays are mutable: you can change the value of any cell without replacing the entire array. "Set array bridgeBuffer at index 1 to 1" updates that specific cell while leaving all other cells untouched.',
      visualLegend: [VISUAL_LEGEND.robot, VISUAL_LEGEND.terminal, VISUAL_LEGEND.bridge, VISUAL_LEGEND.energy, VISUAL_LEGEND.exit],
      workedExample: {
        title: 'Updating an Array Element',
        explanation: 'Initialize buffer with [0, 0], update buffer[1] to 1, move onto terminal, activate, and proceed.',
        demoLevel: { id: 'demo-41', title: 'Mutation Demo', map: ['########', '#STBB.G#', '########'], direction: 0, bossHealth: 0 },
        demoMap: ['########', '#STBB.G#', '########'],
        demoInitialState: { x: 1, y: 1, direction: 0 },
        program: [
          { type: 'array_init', name: 'buffer', values: [0, 0] },
          { type: 'array_set', name: 'buffer', index: 1, value: 1 },
          { type: 'move' },
          { type: 'activate' },
          { type: 'repeat', count: 4, body: [{ type: 'move' }] }
        ],
        expectedOutcome: { passed: true, bridgeDeployed: true, finalPosition: { x: 6, y: 1 } }
      },
      commonMistake: {
        mistake: 'Attempting to update an array before it has been created.',
        correction: 'Always initialize the array with "create array" before setting or reading its elements.'
      },
      hints: [
        { level: 1, label: 'Notice the Goal', text: 'Initialize bridgeBuffer with [0, 0, 0], update index 1 to 1, then activate terminal and extract.' },
        { level: 2, label: 'Helpful Concept', text: 'Use "set array bridgeBuffer at index 1 to 1" to repair the configuration.' },
        { level: 3, label: 'Step-by-Step Suggestion', text: 'Create bridgeBuffer [0, 0, 0]. Set index 1 to 1. Move, activate, repeat 4: move, collect, repeat 2: move.' }
      ],
      postSuccessExplanation: 'Mutation confirmed! You successfully modified a single array cell in place.'
    },
    42: {
      id: 42,
      title: 'Array Traversal',
      zone: 'Memory Matrix',
      objective: 'Traverse array "shards" [1, 1, 1] using while loop and counter "i". At each station, move forward, collect the shard, and advance the counter.',
      learningObjective: 'Use a loop with an index counter to systematically visit every element in an array.',
      newConcept: 'Array Traversal with Index Counters',
      prerequisites: ['Level 41: Element Mutation', 'While Loops & Counters'],
      practisedSkills: ['Loop traversal', 'Dynamic indexing', 'Counter incrementation', 'Array length'],
      introducedBlocks: ['cv_array_length'],
      allowedBlocks: ['cv_move', 'cv_collect', 'cv_while', 'cv_var_set', 'cv_var_change', 'cv_var_get', 'cv_compare', 'cv_array_create', 'cv_array_get', 'cv_array_set', 'cv_array_length'],
      conceptExplanation: 'Array traversal is the process of visiting each element one by one. By using an index variable (like i = 0) and incrementing it inside a while loop (i < 3), your code accesses array[0], array[1], array[2] automatically!',
      visualLegend: [VISUAL_LEGEND.robot, VISUAL_LEGEND.energy, VISUAL_LEGEND.exit],
      workedExample: {
        title: 'Array Traversal with While Loop',
        explanation: 'Initialize items = [1, 1], set i = 0, while i < 2: read items[i], move, collect, and increment i.',
        demoLevel: { id: 'demo-42', title: 'Traversal Demo', map: ['########', '#S.C.CG#', '########'], direction: 0, bossHealth: 0 },
        demoMap: ['########', '#S.C.CG#', '########'],
        demoInitialState: { x: 1, y: 1, direction: 0 },
        program: [
          { type: 'array_init', name: 'items', values: [1, 1] },
          { type: 'var_set', variable: 'i', value: 0 },
          { type: 'while', condition: { type: 'compare', left: 'i', op: '<', right: 2 }, body: [
            { type: 'var_set', variable: 'val', value: { type: 'array_get', name: 'items', index: 'i' } },
            { type: 'move' },
            { type: 'move' },
            { type: 'collect' },
            { type: 'var_change', variable: 'i', amount: 1 }
          ]},
          { type: 'move' }
        ],
        expectedOutcome: { passed: true, finalPosition: { x: 6, y: 1 }, collectedCount: 2 }
      },
      commonMistake: {
        mistake: 'Forgetting to increment the index counter (i += 1) inside the while loop body.',
        correction: 'Always change i by 1 at the end of each loop iteration so the loop moves to the next cell and terminates.'
      },
      hints: [
        { level: 1, label: 'Notice the Goal', text: 'Three shard stations are located along the corridor. Traverse shards [1, 1, 1] with counter i.' },
        { level: 2, label: 'Helpful Concept', text: 'Set i to 0. Use while i < 3. Inside: read shards[i], move forward twice, collect, and change i by 1.' },
        { level: 3, label: 'Step-by-Step Suggestion', text: 'Create shards [1, 1, 1]. Set i = 0. While i < 3: move, move, collect, change i by 1. Move into portal.' }
      ],
      postSuccessExplanation: 'Flawless traversal! The counter visited every cell in order and guided the drone across the sector.'
    },
    43: {
      id: 43,
      title: 'Routine Processing',
      zone: 'Memory Matrix',
      objective: 'Define routine "inspectSector" with parameter "hazardFlag". Traverse array "hazards" [0, 1, 0] to safely jump breaches when flagged.',
      learningObjective: 'Pass array elements as arguments into reusable routines for procedural processing.',
      newConcept: 'Processing Arrays with Reusable Routines',
      prerequisites: ['Level 42: Array Traversal', 'Procedural Matrix'],
      practisedSkills: ['Array data flow', 'Routine parameters with array data', 'Conditional execution'],
      introducedBlocks: [],
      allowedBlocks: ['cv_move', 'cv_jump', 'cv_collect', 'cv_repeat', 'cv_while', 'cv_if', 'cv_if_else', 'cv_var_set', 'cv_var_change', 'cv_var_get', 'cv_compare', 'cv_fn_def', 'cv_fn_def_param', 'cv_fn_call', 'cv_fn_call_param', 'cv_array_create', 'cv_array_get', 'cv_array_set', 'cv_array_length'],
      conceptExplanation: 'Arrays provide data; routines provide actions. When you read an array element (like hazards[i]) and pass it into a routine parameter, your routine can make intelligent decisions based on stored data!',
      visualLegend: [VISUAL_LEGEND.robot, VISUAL_LEGEND.hazard, VISUAL_LEGEND.energy, VISUAL_LEGEND.exit],
      workedExample: {
        title: 'Processing Array Values in a Routine',
        explanation: 'Define handleFlag(flag): if flag == 1 jump else move. Read data[i] and pass to routine.',
        demoLevel: { id: 'demo-43', title: 'Routine Array Demo', map: ['########', '#S.H.CG#', '########'], direction: 0, bossHealth: 0 },
        demoMap: ['########', '#S.H.CG#', '########'],
        demoInitialState: { x: 1, y: 1, direction: 0 },
        program: [
          { type: 'fn_def', name: 'handleFlag', params: ['flag'], body: [
            { type: 'if', condition: { type: 'compare', left: 'flag', op: '==', right: 1 }, body: [{ type: 'jump' }], elseBody: [{ type: 'move' }] }
          ]},
          { type: 'array_init', name: 'data', values: [0, 1] },
          { type: 'var_set', variable: 'v0', value: { type: 'array_get', name: 'data', index: 0 } },
          { type: 'fn_call', name: 'handleFlag', args: ['v0'] },
          { type: 'var_set', variable: 'v1', value: { type: 'array_get', name: 'data', index: 1 } },
          { type: 'fn_call', name: 'handleFlag', args: ['v1'] },
          { type: 'move' },
          { type: 'collect' },
          { type: 'move' }
        ],
        expectedOutcome: { passed: true, finalPosition: { x: 6, y: 1 }, collectedCount: 1 }
      },
      commonMistake: {
        mistake: 'Passing the whole array instead of passing the single element value.',
        correction: 'Pass individual elements (like hazards[0] or hazards[i]) into routine parameters.'
      },
      hints: [
        { level: 1, label: 'Notice the Goal', text: 'Hazard array is [0, 1, 0]: index 1 indicates the breach. Process each flag with routine inspectSector.' },
        { level: 2, label: 'Helpful Concept', text: 'Define inspectSector(hazardFlag): if hazardFlag == 1 jump across breach else move forward.' },
        { level: 3, label: 'Step-by-Step Suggestion', text: 'Create hazards [0, 1, 0]. Define inspectSector(hazardFlag). Move, collect, jump breach, collect, extract.' }
      ],
      postSuccessExplanation: 'Procedural array processing mastered! Reusable logic combined with structured data.'
    },
    44: {
      id: 44,
      title: 'Array Architect',
      zone: 'Memory Matrix',
      objective: 'Final Chapter Mission: Coordinate power cells, bridge deployment, shard recovery, and guardian combat using arrays, traversal, and mutation.',
      learningObjective: 'Integrate array creation, reading, mutation, traversal, and robotic actions in an end-to-end mission.',
      newConcept: 'Comprehensive Array Mastery',
      prerequisites: ['Level 43: Routine Processing', 'Terminal Activation', 'Guardian Combat'],
      practisedSkills: ['Comprehensive array mastery', 'End-to-end data coordination', 'Multi-phase problem solving'],
      introducedBlocks: [],
      allowedBlocks: ['cv_move', 'cv_left', 'cv_right', 'cv_jump', 'cv_collect', 'cv_activate', 'cv_pulse', 'cv_repeat', 'cv_while', 'cv_if', 'cv_if_else', 'cv_val_num', 'cv_var_get', 'cv_var_set', 'cv_var_change', 'cv_compare', 'cv_fn_def', 'cv_fn_def_param', 'cv_fn_call', 'cv_fn_call_param', 'cv_array_create', 'cv_array_get', 'cv_array_set', 'cv_array_length'],
      conceptExplanation: 'The ultimate array challenge! Create array matrix [3, 1, 0]. Use matrix[0] to determine pulse blasts against the guardian, deploy the bridge, collect the shard, update matrix[2] to 1 when the guardian falls, and extract.',
      visualLegend: [VISUAL_LEGEND.robot, VISUAL_LEGEND.terminal, VISUAL_LEGEND.bridge, VISUAL_LEGEND.energy, VISUAL_LEGEND.guardian, VISUAL_LEGEND.exit],
      workedExample: {
        title: 'Full Array Architecture',
        explanation: 'Initialize matrix [3, 1], deploy bridge, strike guardian 3 times, update cell, and extract.',
        demoLevel: { id: 'demo-44', title: 'Array Climax Demo', map: ['###########', '#STB.C.X.G#', '###########'], direction: 0, bossHealth: 1 },
        demoMap: ['###########', '#STB.C.X.G#', '###########'],
        demoInitialState: { x: 1, y: 1, direction: 0 },
        program: [
          { type: 'array_init', name: 'matrix', values: [1, 1] },
          { type: 'move' },
          { type: 'activate' },
          { type: 'repeat', count: 3, body: [{ type: 'move' }] },
          { type: 'collect' },
          { type: 'move' },
          { type: 'pulse' },
          { type: 'array_set', name: 'matrix', index: 0, value: 0 },
          { type: 'repeat', count: 3, body: [{ type: 'move' }] }
        ],
        expectedOutcome: { passed: true, bridgeDeployed: true, bossHP: 0, finalPosition: { x: 9, y: 1 } }
      },
      commonMistake: {
        mistake: 'Attempting to complete the challenge without satisfying array creation, reading, and mutation requirements.',
        correction: 'Ensure your program creates an array, reads from it, updates a cell, and utilizes while loop traversal.'
      },
      hints: [
        { level: 1, label: 'Notice the Goal', text: 'Phase 1: Create array matrix [3, 1, 0]. Phase 2: Deploy bridge and collect shard. Phase 3: Pulse guardian and update matrix[2].' },
        { level: 2, label: 'Helpful Concept', text: 'Set p = matrix[0] (value 3). While p > 0: pulse, change p by -1. Update matrix[2] to 1.' },
        { level: 3, label: 'Step-by-Step Suggestion', text: 'Create matrix [3, 1, 0]. Move, activate, repeat 4: move, collect. Repeat 3: pulse. Set matrix[2] to 1. Advance to portal.' }
      ],
      postSuccessExplanation: '🏆 MEMORY MATRIX CONQUERED! You have mastered fixed-length integer arrays, zero-based indexing, element mutation, and loop traversal. Exceptional engineering!'
    }
  };
}

/**
 * Stage E4: Beginner-friendly linear search, early termination, sorted arrays & binary search (Levels 45–50).
 */
function generateStageE4Curriculum() {
  return {
    45: {
      id: 45,
      title: 'Sequential Scan',
      zone: 'Search Matrix',
      objective: 'Inspect array "sensors" [4, 7, 2, 9] cell-by-cell to find target value 2. Set variable "found" to index 2, then step to the portal.',
      learningObjective: 'Understand sequential inspection: testing elements in order from index 0 until a target match is found.',
      newConcept: 'Sequential Target Search',
      prerequisites: ['Level 40: Zero-Based Reading', 'Level 27: Value Comparisons'],
      practisedSkills: ['Target comparison', 'Recording match index', 'Sequential inspection'],
      introducedBlocks: [],
      allowedBlocks: ['cv_move', 'cv_left', 'cv_right', 'cv_var_set', 'cv_var_get', 'cv_array_get', 'cv_compare', 'cv_if', 'cv_val_num', 'cv_repeat'],
      conceptExplanation: 'Searching checks whether a target value exists within a collection. In sequential scanning, we read each cell in order (index 0, 1, 2...) and compare it with our target. When a match is found, we record its zero-based index.',
      visualLegend: [VISUAL_LEGEND.robot, VISUAL_LEGEND.floor, VISUAL_LEGEND.exit, VISUAL_LEGEND.wall],
      workedExample: {
        title: 'Sequential Target Inspection',
        explanation: 'Inspect cells 0, 1, 2. When sensors[2] equals target 2, record found = 2 and step to extraction.',
        demoLevel: { id: 'demo-45', title: 'Sequential Demo', map: ['######', '#S..G#', '######'], direction: 0, bossHealth: 0, requireArray: true, initialArrays: { sensors: [4, 7, 2] }, initialVariables: { target: 2, found: -1 } },
        demoMap: ['######', '#S..G#', '######'],
        demoInitialState: { x: 1, y: 1, direction: 0 },
        program: [
          { type: 'var_set', variable: 'found', value: -1 },
          { type: 'if', condition: { type: 'compare', left: { type: 'array_get', name: 'sensors', index: 0 }, op: '==', right: 'target' }, body: [{ type: 'var_set', variable: 'found', value: 0 }] },
          { type: 'if', condition: { type: 'compare', left: { type: 'array_get', name: 'sensors', index: 1 }, op: '==', right: 'target' }, body: [{ type: 'var_set', variable: 'found', value: 1 }] },
          { type: 'if', condition: { type: 'compare', left: { type: 'array_get', name: 'sensors', index: 2 }, op: '==', right: 'target' }, body: [{ type: 'var_set', variable: 'found', value: 2 }] },
          { type: 'repeat', count: 3, body: [{ type: 'move' }] }
        ],
        expectedOutcome: { passed: true, finalPosition: { x: 4, y: 1 } }
      },
      commonMistake: {
        mistake: 'Hardcoding index 2 without checking array values, or forgetting to set variable found.',
        correction: 'Compare sensors[index] with variable target, and set found = index when they match.'
      },
      hints: [
        { level: 1, label: 'Notice the Goal', text: 'Target is 2. Read sensors[0], sensors[1], sensors[2] to locate which cell holds 2.' },
        { level: 2, label: 'Helpful Concept', text: 'Set found = -1. When you compare sensors[2] == target (2 == 2), update found = 2.' },
        { level: 3, label: 'Step-by-Step Suggestion', text: 'Check each cell. When sensors[2] == target, set found to 2, then step 3 times forward to portal.' }
      ],
      postSuccessExplanation: 'Target matched! Sequential inspection checks each index in order to locate items.'
    },
    46: {
      id: 46,
      title: 'Linear Search Protocol',
      zone: 'Search Matrix',
      objective: 'Implement linear search over array "data" [5, 12, 8, 21, 3] to find target 21 using a while loop and index counter "i".',
      learningObjective: 'Automate sequential search using a while loop, counter increment, and conditional target comparison.',
      newConcept: 'Linear Search Algorithm',
      prerequisites: ['Level 45: Sequential Scan', 'Level 42: Array Traversal', 'Level 28: While Loops'],
      practisedSkills: ['Loop-driven search', 'Counter progression', 'Dynamic index reading'],
      introducedBlocks: [],
      allowedBlocks: ['cv_move', 'cv_left', 'cv_right', 'cv_while', 'cv_var_set', 'cv_var_change', 'cv_var_get', 'cv_array_get', 'cv_array_length', 'cv_compare', 'cv_if', 'cv_val_num', 'cv_repeat'],
      conceptExplanation: 'Manually checking individual cells does not scale to large arrays. Linear search uses a counter variable (i = 0) and a while loop (while i < length) to test data[i] == target on every iteration, updating found whenever a match occurs.',
      visualLegend: [VISUAL_LEGEND.robot, VISUAL_LEGEND.floor, VISUAL_LEGEND.exit, VISUAL_LEGEND.wall],
      workedExample: {
        title: 'Automated Linear Search Loop',
        explanation: 'Loop through elements with index counter i. Compare data[i] with target on each iteration.',
        demoLevel: { id: 'demo-46', title: 'Linear Search Demo', map: ['#######', '#S...G#', '#######'], direction: 0, bossHealth: 0, requireArray: true, initialArrays: { data: [5, 12, 8] }, initialVariables: { target: 12, found: -1 } },
        demoMap: ['#######', '#S...G#', '#######'],
        demoInitialState: { x: 1, y: 1, direction: 0 },
        program: [
          { type: 'var_set', variable: 'i', value: 0 },
          { type: 'var_set', variable: 'found', value: -1 },
          {
            type: 'while',
            condition: { type: 'compare', left: 'i', op: '<', right: 3 },
            body: [
              {
                type: 'if',
                condition: { type: 'compare', left: { type: 'array_get', name: 'data', index: 'i' }, op: '==', right: 'target' },
                body: [{ type: 'var_set', variable: 'found', value: 'i' }]
              },
              { type: 'var_change', variable: 'i', amount: 1 }
            ]
          },
          { type: 'repeat', count: 4, body: [{ type: 'move' }] }
        ],
        expectedOutcome: { passed: true, finalPosition: { x: 5, y: 1 } }
      },
      commonMistake: {
        mistake: 'Forgetting to increment counter "i" inside the while loop, causing an infinite loop.',
        correction: 'Place "change i by 1" at the bottom of the while loop body so each cell is visited.'
      },
      hints: [
        { level: 1, label: 'Notice the Goal', text: 'Loop through array data with counter i. Compare data[i] to target 21.' },
        { level: 2, label: 'Helpful Concept', text: 'Set found = -1, i = 0. While i < 5: if data[i] == target then found = i; change i by 1.' },
        { level: 3, label: 'Step-by-Step Suggestion', text: 'Run the while loop to search, then move forward to the extraction portal.' }
      ],
      postSuccessExplanation: 'Linear search complete! By driving index inspection with a loop counter, any array length can be searched.'
    },
    47: {
      id: 47,
      title: 'Early Termination',
      zone: 'Search Matrix',
      objective: 'Stop searching once target 27 is found using "break out of loop". If target is absent, preserve found = -1.',
      learningObjective: 'Understand search efficiency: stopping early when target is found (best/average case) and representing absent targets with standard sentinel value -1.',
      newConcept: 'Early Termination (Break) & Sentinel -1',
      prerequisites: ['Level 46: Linear Search Protocol'],
      practisedSkills: ['Loop early exit', 'Sentinel value representation', 'Efficiency optimization'],
      introducedBlocks: [BLOCK_DEFINITIONS.cv_break],
      allowedBlocks: ['cv_move', 'cv_left', 'cv_right', 'cv_activate', 'cv_while', 'cv_break', 'cv_var_set', 'cv_var_change', 'cv_var_get', 'cv_array_get', 'cv_array_length', 'cv_compare', 'cv_if', 'cv_val_num', 'cv_repeat'],
      conceptExplanation: 'Continuing to search after finding your target wastes processor cycles. The "break out of loop" command immediately exits the while loop. If the loop completes without finding the target, found remains -1, the universal programming standard for "not found".',
      visualLegend: [VISUAL_LEGEND.robot, VISUAL_LEGEND.terminal, VISUAL_LEGEND.bridge, VISUAL_LEGEND.exit],
      workedExample: {
        title: 'Linear Search with Early Exit',
        explanation: 'Initialize found to -1. When codes[i] == target, record found = i and break out of loop immediately.',
        demoLevel: { id: 'demo-47', title: 'Break Demo', map: ['#######', '#S...G#', '#######'], direction: 0, bossHealth: 0, requireArray: true, initialArrays: { codes: [14, 9, 27] }, initialVariables: { target: 27, found: -1 } },
        demoMap: ['#######', '#S...G#', '#######'],
        demoInitialState: { x: 1, y: 1, direction: 0 },
        program: [
          { type: 'var_set', variable: 'i', value: 0 },
          { type: 'var_set', variable: 'found', value: -1 },
          {
            type: 'while',
            condition: { type: 'compare', left: 'i', op: '<', right: 3 },
            body: [
              {
                type: 'if',
                condition: { type: 'compare', left: { type: 'array_get', name: 'codes', index: 'i' }, op: '==', right: 'target' },
                body: [
                  { type: 'var_set', variable: 'found', value: 'i' },
                  { type: 'break' }
                ]
              },
              { type: 'var_change', variable: 'i', amount: 1 }
            ]
          },
          { type: 'repeat', count: 4, body: [{ type: 'move' }] }
        ],
        expectedOutcome: { passed: true, finalPosition: { x: 5, y: 1 } }
      },
      commonMistake: {
        mistake: 'Not placing the break block inside the if condition, causing the loop to exit on the very first iteration.',
        correction: 'Snap "break out of loop" directly inside the if block that confirms data[i] == target.'
      },
      hints: [
        { level: 1, label: 'Notice the Goal', text: 'Loop through array codes. When codes[i] == target, set found = i and break out of the loop.' },
        { level: 2, label: 'Helpful Concept', text: 'Break exits immediately, avoiding unnecessary comparisons. If target is never found, found stays -1.' },
        { level: 3, label: 'Step-by-Step Suggestion', text: 'In while loop: if codes[i] == target: found = i, break. Then advance, activate terminal, and cross bridge to portal.' }
      ],
      postSuccessExplanation: 'Early termination verified! Halting immediately upon match saves substantial runtime.'
    },
    48: {
      id: 48,
      title: 'The Power of Order',
      zone: 'Search Matrix',
      objective: 'Inspect sorted array "archive" [3, 8, 15, 24, 39, 50, 72]. Compare target 39 with middle element archive[3] (24). Eliminate cells 0 to 3, set low = 4, collect shard, and extract.',
      learningObjective: 'Understand sorted array properties: when elements are in ascending order, one comparison can discard half of the search space.',
      newConcept: 'Sorted Arrays & Range Halving',
      prerequisites: ['Level 47: Early Termination'],
      practisedSkills: ['Sorted property recognition', 'Boundary adjustment', 'Range elimination'],
      introducedBlocks: [BLOCK_DEFINITIONS.cv_math_op],
      allowedBlocks: ['cv_move', 'cv_left', 'cv_right', 'cv_collect', 'cv_var_set', 'cv_var_get', 'cv_array_get', 'cv_compare', 'cv_if', 'cv_if_else', 'cv_math_op', 'cv_val_num', 'cv_repeat'],
      conceptExplanation: 'In an unsorted array, any element could be anywhere, so you must inspect every cell. But in a sorted array, if target > archive[mid], the target CANNOT be in any cell at or below mid! All cells [0..mid] can be eliminated at once.',
      visualLegend: [VISUAL_LEGEND.robot, VISUAL_LEGEND.floor, VISUAL_LEGEND.energy, VISUAL_LEGEND.exit],
      workedExample: {
        title: 'Eliminating Half the Search Range',
        explanation: 'Check archive[3] (24). Since target 39 > 24, update low bound to mid + 1 (4), discarding cells 0 to 3.',
        demoLevel: { id: 'demo-48', title: 'Order Power Demo', map: ['########', '#S.C..G#', '########'], direction: 0, bossHealth: 0, requireArray: true, initialArrays: { archive: [3, 8, 15, 24, 39] }, initialVariables: { target: 39, low: 0, high: 4 } },
        demoMap: ['########', '#S.C..G#', '########'],
        demoInitialState: { x: 1, y: 1, direction: 0 },
        program: [
          { type: 'var_set', variable: 'mid', value: 2 },
          {
            type: 'if',
            condition: { type: 'compare', left: { type: 'array_get', name: 'archive', index: 'mid' }, op: '<', right: 'target' },
            body: [
              { type: 'var_set', variable: 'low', value: { type: 'binary_op', op: '+', left: 'mid', right: 1 } }
            ]
          },
          { type: 'move' }, { type: 'move' }, { type: 'collect' },
          { type: 'repeat', count: 3, body: [{ type: 'move' }] }
        ],
        expectedOutcome: { passed: true, finalPosition: { x: 6, y: 1 } }
      },
      commonMistake: {
        mistake: 'Applying binary search logic to unsorted data. Without sorted order, range elimination discards valid items.',
        correction: 'Always ensure input arrays are sorted before applying range halving techniques.'
      },
      hints: [
        { level: 1, label: 'Notice the Goal', text: 'Middle cell archive[3] has value 24. Target is 39.' },
        { level: 2, label: 'Helpful Concept', text: 'Since 39 > 24 and the array is sorted, 39 can only be in cells 4, 5, or 6. Set low = mid + 1 (4).' },
        { level: 3, label: 'Step-by-Step Suggestion', text: 'Set mid = 3. If archive[mid] < target: set low = mid + 1. Step forward, collect shard, and extract.' }
      ],
      postSuccessExplanation: 'Range halved! In sorted data, a single comparison eliminates half of all remaining candidates.'
    },
    49: {
      id: 49,
      title: 'Binary Search Matrix',
      zone: 'Search Matrix',
      objective: 'Implement binary search over sorted array "grid" [2, 6, 11, 19, 27, 34, 45] to locate target 19 in at most 3 comparisons! Maintain low, mid, and high bounds.',
      learningObjective: 'Implement the full binary search algorithm using low and high bounds, integer midpoint calculation, and three-way boundary adjustment.',
      newConcept: 'Binary Search Algorithm (O(log n))',
      prerequisites: ['Level 48: The Power of Order'],
      practisedSkills: ['Binary search implementation', 'Midpoint calculation', 'Logarithmic efficiency'],
      introducedBlocks: [BLOCK_DEFINITIONS.cv_midpoint],
      allowedBlocks: ['cv_move', 'cv_left', 'cv_right', 'cv_activate', 'cv_collect', 'cv_while', 'cv_break', 'cv_var_set', 'cv_var_change', 'cv_var_get', 'cv_array_get', 'cv_compare', 'cv_if', 'cv_if_else', 'cv_math_op', 'cv_midpoint', 'cv_val_num', 'cv_repeat'],
      conceptExplanation: 'Binary search repeatedly divides the search space in half. Calculate mid = Math.floor((low + high) / 2). If grid[mid] == target, match found! If grid[mid] < target, set low = mid + 1. Otherwise set high = mid - 1. For length 7, binary search takes at most 3 comparisons, whereas linear search might take 7!',
      visualLegend: [VISUAL_LEGEND.robot, VISUAL_LEGEND.terminal, VISUAL_LEGEND.bridge, VISUAL_LEGEND.energy, VISUAL_LEGEND.exit],
      workedExample: {
        title: 'Full Binary Search Routine',
        explanation: 'Maintain low and high bounds. Halve candidate range until target 19 is matched.',
        demoLevel: { id: 'demo-49', title: 'Binary Matrix Demo', map: ['########', '#S....G#', '########'], direction: 0, bossHealth: 0, requireArray: true, initialArrays: { grid: [2, 6, 11, 19, 27] }, initialVariables: { target: 19, low: 0, high: 4, found: -1 } },
        demoMap: ['########', '#S....G#', '########'],
        demoInitialState: { x: 1, y: 1, direction: 0 },
        program: [
          { type: 'var_set', variable: 'low', value: 0 },
          { type: 'var_set', variable: 'high', value: 4 },
          { type: 'var_set', variable: 'found', value: -1 },
          {
            type: 'while',
            condition: { type: 'compare', left: 'low', op: '<=', right: 'high' },
            body: [
              { type: 'var_set', variable: 'mid', value: { type: 'midpoint', low: 'low', high: 'high' } },
              {
                type: 'if',
                condition: { type: 'compare', left: { type: 'array_get', name: 'grid', index: 'mid' }, op: '==', right: 'target' },
                body: [
                  { type: 'var_set', variable: 'found', value: 'mid' },
                  { type: 'break' }
                ],
                elseBody: [
                  {
                    type: 'if',
                    condition: { type: 'compare', left: { type: 'array_get', name: 'grid', index: 'mid' }, op: '<', right: 'target' },
                    body: [
                      { type: 'var_set', variable: 'low', value: { type: 'binary_op', op: '+', left: 'mid', right: 1 } }
                    ],
                    elseBody: [
                      { type: 'var_set', variable: 'high', value: { type: 'binary_op', op: '-', left: 'mid', right: 1 } }
                    ]
                  }
                ]
              }
            ]
          },
          { type: 'repeat', count: 5, body: [{ type: 'move' }] }
        ],
        expectedOutcome: { passed: true, finalPosition: { x: 6, y: 1 } }
      },
      commonMistake: {
        mistake: 'Using "low < high" instead of "low <= high" in the while loop condition, causing single-element ranges to be skipped.',
        correction: 'Use "low <= high" so the loop evaluates the last remaining candidate when low equals high.'
      },
      hints: [
        { level: 1, label: 'Notice the Goal', text: 'Keep updating low and high. Calculate mid = (low + high) / 2 each loop iteration.' },
        { level: 2, label: 'Helpful Concept', text: 'If grid[mid] == target: found = mid, break. If grid[mid] < target: low = mid + 1. Else: high = mid - 1.' },
        { level: 3, label: 'Step-by-Step Suggestion', text: 'Run binary search while low <= high. Activate terminal, collect shard, and cross bridge to portal.' }
      ],
      postSuccessExplanation: 'Binary search implemented! With 3 comparisons, you searched 7 items. At scale, 1,000,000 items takes only 20 comparisons!'
    },
    50: {
      id: 50,
      title: 'Search Master Climax',
      zone: 'Search Matrix',
      objective: 'Final Chapter Mission: Implement binary search on sorted array "coreKeys" [1, 5, 12, 18, 25, 33, 42, 59]. Pass multi-case verification, deploy bridge, leap hazard, collect shard, and neutralize guardian!',
      learningObjective: 'Synthesize binary search, sentinel absent handling (-1), robotic navigation, and combat mechanics into an autonomous solution.',
      newConcept: 'Comprehensive Search Mastery',
      prerequisites: ['Level 49: Binary Search Matrix', 'Terminal Activation', 'Guardian Combat'],
      practisedSkills: ['Binary search mastery', 'Absent target handling', 'Multi-scenario verification', 'Autonomous problem solving'],
      introducedBlocks: [],
      allowedBlocks: ['cv_move', 'cv_left', 'cv_right', 'cv_jump', 'cv_collect', 'cv_activate', 'cv_pulse', 'cv_repeat', 'cv_while', 'cv_break', 'cv_if', 'cv_if_else', 'cv_val_num', 'cv_var_get', 'cv_var_set', 'cv_var_change', 'cv_compare', 'cv_array_create', 'cv_array_get', 'cv_array_set', 'cv_array_length', 'cv_math_op', 'cv_midpoint', 'cv_fn_def', 'cv_fn_def_param', 'cv_fn_call', 'cv_fn_call_param'],
      conceptExplanation: 'The ultimate search challenge! The guardian core evaluates your binary search algorithm against multiple server test cases (targets present at start, middle, end, and absent targets). Your code must generalize to all cases!',
      visualLegend: [VISUAL_LEGEND.robot, VISUAL_LEGEND.terminal, VISUAL_LEGEND.bridge, VISUAL_LEGEND.hazard, VISUAL_LEGEND.energy, VISUAL_LEGEND.guardian, VISUAL_LEGEND.exit],
      workedExample: {
        title: 'Search Mastery Climax',
        explanation: 'Binary search locates key index, followed by bridge deployment, hazard clearing, and guardian takedown.',
        demoLevel: { id: 'demo-50', title: 'Climax Demo', map: ['###########', '#STB.C.X.G#', '###########'], direction: 0, bossHealth: 1, requireArray: true, initialArrays: { coreKeys: [1, 5, 12, 18] }, initialVariables: { target: 12, low: 0, high: 3, found: -1 } },
        demoMap: ['###########', '#STB.C.X.G#', '###########'],
        demoInitialState: { x: 1, y: 1, direction: 0 },
        program: [
          { type: 'var_set', variable: 'low', value: 0 },
          { type: 'var_set', variable: 'high', value: 3 },
          { type: 'var_set', variable: 'found', value: -1 },
          {
            type: 'while',
            condition: { type: 'compare', left: 'low', op: '<=', right: 'high' },
            body: [
              { type: 'var_set', variable: 'mid', value: { type: 'midpoint', low: 'low', high: 'high' } },
              {
                type: 'if',
                condition: { type: 'compare', left: { type: 'array_get', name: 'coreKeys', index: 'mid' }, op: '==', right: 'target' },
                body: [
                  { type: 'var_set', variable: 'found', value: 'mid' },
                  { type: 'break' }
                ],
                elseBody: [
                  {
                    type: 'if',
                    condition: { type: 'compare', left: { type: 'array_get', name: 'coreKeys', index: 'mid' }, op: '<', right: 'target' },
                    body: [
                      { type: 'var_set', variable: 'low', value: { type: 'binary_op', op: '+', left: 'mid', right: 1 } }
                    ],
                    elseBody: [
                      { type: 'var_set', variable: 'high', value: { type: 'binary_op', op: '-', left: 'mid', right: 1 } }
                    ]
                  }
                ]
              }
            ]
          },
          { type: 'move' },
          { type: 'activate' },
          { type: 'repeat', count: 3, body: [{ type: 'move' }] },
          { type: 'collect' },
          { type: 'move' },
          { type: 'pulse' },
          { type: 'repeat', count: 3, body: [{ type: 'move' }] }
        ],
        expectedOutcome: { passed: true, bridgeDeployed: true, bossHP: 0, finalPosition: { x: 9, y: 1 } }
      },
      commonMistake: {
        mistake: 'Hardcoding found = 3 instead of implementing binary search. Server test cases will fail for other targets.',
        correction: 'Implement the general binary search algorithm so any target value is found or correctly reported as -1.'
      },
      hints: [
        { level: 1, label: 'Notice the Goal', text: 'Implement binary search over coreKeys. Set found = mid if matched, or -1 if absent.' },
        { level: 2, label: 'Helpful Concept', text: 'While low <= high: mid = (low + high) / 2. If matched: found = mid, break. Else adjust low or high.' },
        { level: 3, label: 'Step-by-Step Suggestion', text: 'Run binary search. Then: move, activate terminal, advance, jump hazard, collect shard, fire 3 pulses, and extract.' }
      ],
      postSuccessExplanation: '🏆 SEARCH MATRIX CONQUERED! You have mastered sequential search, linear search, early loop exit, sorted array properties, and logarithmic binary search. True algorithmic mastery!'
    }
  };
}

// Populate full 50-level curriculum
Object.assign(LEVEL_CURRICULUM, generateAdvancedCurriculum());
Object.assign(LEVEL_CURRICULUM, generateStageECurriculum());
Object.assign(LEVEL_CURRICULUM, generateStageE2Curriculum());
Object.assign(LEVEL_CURRICULUM, generateStageE3Curriculum());
Object.assign(LEVEL_CURRICULUM, generateStageE4Curriculum());

/**
 * Returns curriculum metadata for a specific level id.
 *
 * @param {number} levelId
 * @returns {object}
 */
export function getLevelCurriculum(levelId) {
  return LEVEL_CURRICULUM[levelId] || LEVEL_CURRICULUM[1];
}

/**
 * Validates that all campaign levels have complete, valid structured lesson content.
 *
 * @param {Array} levelsList
 * @returns {{ valid: boolean, errors: string[] }}
 */
export function auditCurriculum(levelsList) {
  const errors = [];
  const expectedCount = Array.isArray(levelsList) ? levelsList.length : 50;
  if (!Array.isArray(levelsList) || levelsList.length < 24) {
    errors.push(`Expected at least 24 levels in campaign list, received ${levelsList?.length}`);
  }

  for (let id = 1; id <= expectedCount; id++) {
    const entry = LEVEL_CURRICULUM[id];
    if (!entry) {
      errors.push(`Missing curriculum entry for Level ${id}`);
      continue;
    }
    if (!entry.objective) errors.push(`Level ${id} missing plain-English objective`);
    if (!entry.learningObjective) errors.push(`Level ${id} missing learningObjective`);
    if (!entry.newConcept) errors.push(`Level ${id} missing newConcept`);
    if (!entry.conceptExplanation) errors.push(`Level ${id} missing conceptExplanation`);
    if (!entry.commonMistake || !entry.commonMistake.mistake || !entry.commonMistake.correction) {
      errors.push(`Level ${id} missing complete commonMistake`);
    }
    if (!Array.isArray(entry.hints) || entry.hints.length !== 3) {
      errors.push(`Level ${id} must provide exactly 3 graduated hints`);
    }
    if (!entry.workedExample || !entry.workedExample.program) {
      errors.push(`Level ${id} missing workedExample`);
    }
    if (!Array.isArray(entry.allowedBlocks) || entry.allowedBlocks.length === 0) {
      errors.push(`Level ${id} must specify allowed progressive blocks`);
    }
    if (!entry.postSuccessExplanation) {
      errors.push(`Level ${id} missing postSuccessExplanation`);
    }
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Diagnoses a simulation failure and returns actionable, graduated guidance.
 *
 * @param {object} level
 * @param {object} finalState
 * @param {Array} _program
 * @returns {{ diagnosis: string, suggestion: string, hintTier: number }}
 */
export function diagnoseFailure(level, finalState, _program) {
  const curriculum = getLevelCurriculum(level.id);

  if (finalState?.message?.includes('requires creating and initializing an array')) {
    return {
      diagnosis: 'Observed Mistake: The sector requires creating and initializing an array, but none was created.',
      suggestion: 'Suggestion: Use the "Create Array" block (e.g. create array cells with [2, 1, 3]) at the start of your program.',
      hintTier: 2
    };
  }

  if (finalState?.message?.includes('requires locating the target and setting variable')) {
    return {
      diagnosis: 'Observed Mistake: The target was not matched or variable "found" was not set to the target index.',
      suggestion: 'Suggestion: Compare array elements to the target variable and set variable "found" when a match occurs.',
      hintTier: 2
    };
  }

  if (finalState?.message?.includes('requires implementing linear search')) {
    return {
      diagnosis: 'Observed Mistake: Linear search was not implemented with an index counter and while loop.',
      suggestion: 'Suggestion: Use a counter (e.g. i = 0) and while loop (while i < length) to compare data[i] with target.',
      hintTier: 2
    };
  }

  if (finalState?.message?.includes('requires breaking out of the loop early')) {
    return {
      diagnosis: 'Observed Mistake: The loop did not break early upon finding the target.',
      suggestion: 'Suggestion: Snap the "Break Out of Loop" block inside the if condition when a match is found.',
      hintTier: 2
    };
  }

  if (finalState?.message?.includes('Binary search requires a sorted array')) {
    return {
      diagnosis: 'Observed Mistake: Binary search was attempted on an unsorted array.',
      suggestion: 'Suggestion: Binary search relies on ascending sorted order. Check that elements are in sorted sequence.',
      hintTier: 2
    };
  }

  if (finalState?.message?.includes('Comparison limit exceeded') || finalState?.message?.includes('Binary search comparison budget exceeded')) {
    return {
      diagnosis: `Observed Mistake: ${finalState.message}`,
      suggestion: 'Suggestion: Ensure you update both low = mid + 1 and high = mid - 1 correctly to halve the search range.',
      hintTier: 2
    };
  }

  if (finalState?.message?.includes('Challenge evaluation failed')) {
    return {
      diagnosis: `Observed Mistake: ${finalState.message}`,
      suggestion: 'Suggestion: Make sure your search algorithm handles both present targets and absent targets (returning -1).',
      hintTier: 2
    };
  }

  if (finalState?.message?.includes('Division by zero')) {
    return {
      diagnosis: 'Observed Mistake: Division by zero encountered during arithmetic.',
      suggestion: 'Suggestion: Check your divisor expression and ensure it cannot evaluate to 0.',
      hintTier: 2
    };
  }

  if (finalState?.message?.includes('The break command can only be used inside a loop')) {
    return {
      diagnosis: 'Observed Mistake: A break block was placed outside of any repeat or while loop.',
      suggestion: 'Suggestion: Move the break block inside the body of a repeat or while loop.',
      hintTier: 2
    };
  }

  if (finalState?.message?.includes('requires reading a value from an array using an index')) {
    return {
      diagnosis: 'Observed Mistake: An array value was never read using an index.',
      suggestion: 'Suggestion: Use the "Array Element" block (e.g. value from array codes at index 0) to retrieve a value.',
      hintTier: 2
    };
  }

  if (finalState?.message?.includes('requires updating an array element')) {
    return {
      diagnosis: 'Observed Mistake: An array element was required to be updated, but was never modified.',
      suggestion: 'Suggestion: Use the "Set Array Element" block (e.g. set array bridgeBuffer at index 1 to 1) to mutate a cell.',
      hintTier: 2
    };
  }

  if (finalState?.message?.includes('requires traversing an array using an index counter inside a loop')) {
    return {
      diagnosis: 'Observed Mistake: The array was not traversed with an index counter inside a loop.',
      suggestion: 'Suggestion: Use a while loop with an index counter (e.g. while i < 3) to access multiple array cells in sequence.',
      hintTier: 2
    };
  }

  if (finalState?.message?.includes('Array index out of bounds')) {
    return {
      diagnosis: `Observed Mistake: ${finalState.message}`,
      suggestion: 'Suggestion: Remember that array indexing is zero-based: valid indexes range from 0 to (length - 1). Check your index variable or value.',
      hintTier: 2
    };
  }

  if (finalState?.message?.includes('used before being created')) {
    return {
      diagnosis: `Observed Mistake: ${finalState.message}`,
      suggestion: 'Suggestion: Drag a "Create Array" block to the top of your program before reading or setting elements.',
      hintTier: 2
    };
  }

  if (finalState?.message?.includes('requires defining and calling a routine')) {
    return {
      diagnosis: 'Observed Mistake: A routine was defined or required, but was never executed in your program.',
      suggestion: 'Suggestion: Add a "call routine [name]" block to your main program so the routine instructions run.',
      hintTier: 2
    };
  }

  if (finalState?.message?.includes('requires calling a routine at least')) {
    return {
      diagnosis: 'Observed Mistake: The routine was not reused enough times.',
      suggestion: 'Suggestion: Call the routine again from another location in your program to navigate both sections.',
      hintTier: 2
    };
  }

  if (finalState?.message?.includes('requires defining a routine with a parameter')) {
    return {
      diagnosis: 'Observed Mistake: The routine was called without a parameter or argument.',
      suggestion: 'Suggestion: Use "define routine with parameter" and supply an argument in your "call routine with" block.',
      hintTier: 2
    };
  }

  if (finalState?.message?.includes('at least two different argument values')) {
    return {
      diagnosis: 'Observed Mistake: The parameterized routine was called with identical arguments.',
      suggestion: 'Suggestion: Modulate the argument between calls (e.g. march with 2 for lane 1, march with 4 for lane 2).',
      hintTier: 2
    };
  }

  if (finalState?.message?.includes('composing a routine inside a loop')) {
    return {
      diagnosis: 'Observed Mistake: The routine was called outside a loop or conditional block.',
      suggestion: 'Suggestion: Drag your "call routine" block inside a repeat loop or conditional statement.',
      hintTier: 2
    };
  }

  if (finalState?.message?.includes('Undefined function')) {
    return {
      diagnosis: 'Observed Mistake: A routine was called before being defined.',
      suggestion: 'Suggestion: Place a "define routine" block in your workspace with matching routine name.',
      hintTier: 2
    };
  }

  if (finalState?.message?.includes('expects') && finalState?.message?.includes('argument')) {
    return {
      diagnosis: 'Observed Mistake: The number of arguments passed did not match the routine definition.',
      suggestion: 'Suggestion: Check the parameter count in your routine definition and pass the matching number of arguments.',
      hintTier: 2
    };
  }

  if (finalState?.message?.includes('Recursion is not permitted')) {
    return {
      diagnosis: 'Observed Mistake: A routine attempted to call itself directly or indirectly.',
      suggestion: 'Suggestion: CodeVerse routines in this stage do not use recursion. Use loops instead of recursive calls.',
      hintTier: 2
    };
  }

  if (finalState?.message?.includes('Call stack depth limit')) {
    return {
      diagnosis: 'Observed Mistake: The routine call stack exceeded the maximum depth limit of 8.',
      suggestion: 'Suggestion: Avoid deeply nested routine calls. Use loops for repeating actions.',
      hintTier: 2
    };
  }

  if (finalState?.message?.includes('condition never became false') || finalState?.message?.includes('kept repeating')) {
    return {
      diagnosis: 'Observed Mistake: The while loop ran continuously without terminating because its condition never became false.',
      suggestion: 'Suggestion: Add a "Change Variable" block inside the while loop body (e.g. change count by 1) so the loop condition eventually evaluates to false.',
      hintTier: 2
    };
  }

  if (finalState?.message?.includes('used before being set') || finalState?.message?.includes('Undefined variable')) {
    return {
      diagnosis: 'Observed Mistake: A variable was referenced or changed before being initialized.',
      suggestion: 'Suggestion: Place a "Set Variable" block at the start of your program to initialize your variable with a starting value.',
      hintTier: 2
    };
  }

  if (finalState?.event === 'crash') {
    if (finalState.message?.includes('Corruption') || finalState.message?.includes('hazard')) {
      return {
        diagnosis: `Observed Mistake: The robot crashed into a red corruption hazard at (${finalState.x}, ${finalState.y}).`,
        suggestion: 'Suggestion: Use "Jump Across Breach" instead of "Move Forward" when facing a hazard. Jump leaps 2 tiles over the breach.',
        hintTier: 2
      };
    }
    return {
      diagnosis: `Observed Mistake: The robot crashed into a wall or obstacle at (${finalState.x}, ${finalState.y}).`,
      suggestion: 'Suggestion: Check your step count and direction. You may need to Turn before taking another step forward.',
      hintTier: 2
    };
  }

  if (finalState?.event === 'miss') {
    if (finalState.message?.includes('terminal')) {
      return {
        diagnosis: 'Observed Mistake: Activate Terminal was called while not standing on the terminal switch.',
        suggestion: 'Suggestion: Step directly onto the "T" tile first before executing Activate Terminal.',
        hintTier: 2
      };
    }
    if (finalState.message?.includes('energy')) {
      return {
        diagnosis: 'Observed Mistake: Collect Energy was called on an empty tile without an energy shard.',
        suggestion: 'Suggestion: Move onto the diamond shard tile before collecting, or check "if energy on tile" first.',
        hintTier: 2
      };
    }
    if (finalState.message?.includes('guardian')) {
      return {
        diagnosis: 'Observed Mistake: Pulse discharge fired but no guardian was within 3 tiles in your line of sight.',
        suggestion: 'Suggestion: Ensure you are facing the guardian (X) and within 3 straight tiles before firing.',
        hintTier: 2
      };
    }
  }

  // Unfinished program
  return {
    diagnosis: 'Program finished before reaching the objective.',
    suggestion: curriculum.hints[0].text,
    hintTier: 1
  };
}
