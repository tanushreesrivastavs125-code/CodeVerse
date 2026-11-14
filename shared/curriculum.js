/**
 * CodeVerse Campaign Curriculum & Progressive Learning Engine (Stage C)
 *
 * Provides structured educational content, progressive toolbox definitions,
 * 3-tier graduated hints, visual legends, interactive worked examples,
 * and diagnostic error advice for all 24 campaign levels.
 */

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
    prerequisites: ['Basic navigation'],
    practisedSkills: ['Counting steps', 'Connecting blocks'],
    introducedBlocks: [BLOCK_DEFINITIONS.cv_move, BLOCK_DEFINITIONS.cv_repeat],
    allowedBlocks: ['cv_move', 'cv_repeat'],
    conceptExplanation: 'Programs are lists of instructions executed in order. When you stack Move Forward blocks, the robot executes each move one tile at a time in the direction it faces.',
    visualLegend: [VISUAL_LEGEND.robot, VISUAL_LEGEND.floor, VISUAL_LEGEND.exit, VISUAL_LEGEND.wall],
    workedExample: {
      title: 'Taking Two Steps',
      explanation: 'To move forward two tiles, connect two Move Forward blocks in order.',
      program: [{ type: 'move' }, { type: 'move' }],
      demoMap: ['#####', '#S.G#', '#####'],
      demoInitialState: { x: 1, y: 1, direction: 0 }
    },
    commonMistake: {
      mistake: 'Counting the starting tile as step 1.',
      correction: 'Count the empty spaces between your robot and the exit portal. You need one move command for each step forward.'
    },
    hints: [
      { level: 1, label: 'Notice the Goal', text: 'Look at the green exit portal on the right. How many floor tiles are between the robot and the goal?' },
      { level: 2, label: 'Helpful Concept', text: 'The robot starts facing east toward the exit. You only need forward moves to get there.' },
      { level: 3, label: 'Step-by-Step Suggestion', text: 'Place 3 Move Forward blocks in a row, or use a Repeat 3 block with Move inside.' }
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
    allowedBlocks: ['cv_move', 'cv_collect', 'cv_repeat'],
    conceptExplanation: 'Just moving to the exit is not enough when objectives are on the board! Move onto the tile with the diamond shard, then use "Collect Energy" before moving forward.',
    visualLegend: [VISUAL_LEGEND.robot, VISUAL_LEGEND.energy, VISUAL_LEGEND.exit],
    workedExample: {
      title: 'Step and Collect',
      explanation: 'Move onto a shard, collect it, then step forward to the exit.',
      program: [{ type: 'move' }, { type: 'collect' }, { type: 'move' }],
      demoMap: ['#####', '#SCG#', '#####'],
      demoInitialState: { x: 1, y: 1, direction: 0 }
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
    allowedBlocks: ['cv_move', 'cv_left', 'cv_right', 'cv_collect', 'cv_repeat'],
    conceptExplanation: 'The robot has a direction: East (0°), South (90°), West (180°), or North (270°). "Turn Right" rotates clockwise 90 degrees in place without changing position. Move Forward always advances in the current facing direction.',
    visualLegend: [VISUAL_LEGEND.robot, VISUAL_LEGEND.wall, VISUAL_LEGEND.energy, VISUAL_LEGEND.exit],
    workedExample: {
      title: 'Turning a Corner',
      explanation: 'Advance 1 step, turn right to face south, then advance 1 step.',
      program: [{ type: 'move' }, { type: 'right' }, { type: 'move' }],
      demoMap: ['####', '#S.#', '##G#', '####'],
      demoInitialState: { x: 1, y: 1, direction: 0 }
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
      explanation: 'Repeat 2 times: move forward and collect energy.',
      program: [{ type: 'repeat', count: 2, body: [{ type: 'move' }, { type: 'collect' }] }],
      demoMap: ['######', '#SCCG#', '######'],
      demoInitialState: { x: 1, y: 1, direction: 0 }
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
      explanation: 'Step forward 1 tile to position in front of hazard, jump 2 tiles over it, then step to exit.',
      program: [{ type: 'move' }, { type: 'jump' }, { type: 'move' }],
      demoMap: ['######', '#S.HG#', '######'],
      demoInitialState: { x: 1, y: 1, direction: 0 }
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
      program: [{ type: 'move' }, { type: 'activate' }, { type: 'move' }, { type: 'move' }],
      demoMap: ['######', '#STBG#', '######'],
      demoInitialState: { x: 1, y: 1, direction: 0 }
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
      title: 'Smart Collection',
      explanation: 'Move forward, and IF standing on energy, collect it.',
      program: [{ type: 'move' }, { type: 'if', sensor: 'energy', body: [{ type: 'collect' }] }],
      demoMap: ['#####', '#SCG#', '#####'],
      demoInitialState: { x: 1, y: 1, direction: 0 }
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
      explanation: 'Move east, turn south, move south, turn west, move west.',
      program: [{ type: 'move' }, { type: 'right' }, { type: 'move' }, { type: 'right' }, { type: 'move' }],
      demoMap: ['####', '#S.#', '#G.#', '####'],
      demoInitialState: { x: 1, y: 1, direction: 0 }
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
      explanation: 'Activate switch, walk across bridge, then jump over corruption tile.',
      program: [{ type: 'move' }, { type: 'activate' }, { type: 'move' }, { type: 'jump' }],
      demoMap: ['#######', '#STBHG#', '#######'],
      demoInitialState: { x: 1, y: 1, direction: 0 }
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
      title: 'Wall Avoidance Decision',
      explanation: 'If wall ahead, turn right; else move forward.',
      program: [{ type: 'if', sensor: 'wall', body: [{ type: 'right' }], elseBody: [{ type: 'move' }] }],
      demoMap: ['####', '#S.#', '##.#', '####'],
      demoInitialState: { x: 1, y: 1, direction: 0 }
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
      title: 'Discharging a Guardian',
      explanation: 'Move within range, fire pulse to deplete 1 HP shield, then advance through.',
      program: [{ type: 'move' }, { type: 'pulse' }, { type: 'move' }, { type: 'move' }],
      demoMap: ['#####', '#SXG#', '#####'],
      demoInitialState: { x: 1, y: 1, direction: 0 }
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
      program: [{ type: 'move' }, { type: 'collect' }, { type: 'move' }, { type: 'activate' }, { type: 'move' }],
      demoMap: ['######', '#SCTB#', '######'],
      demoInitialState: { x: 1, y: 1, direction: 0 }
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

// Generate structured curriculum entries for advanced sectors 13-24
function generateAdvancedCurriculum() {
  const advancedEntries = {};
  const districtThemes = {
    4: { name: 'Shadow Network', focus: 'Multi-lane loops & serpentine routing' },
    5: { name: 'Quantum Grid', focus: 'Adaptive sensor decisions & compact block constraints' },
    6: { name: 'Singularity', focus: 'Mastery of multi-guardian combat & tight efficiency' }
  };

  const titles = [
    'Relay Ascent', 'Corrupted Relay', 'Bridge Labyrinth', 'Shadow Sentinel',
    'Sensor Sweep', 'Fractured Lanes', 'Quantum Lock', 'Grid Overload',
    'Deep Core Descent', 'Blackout Protocol', 'Last Transmission', 'The Singularity'
  ];

  for (let idx = 0; idx < 12; idx++) {
    const id = idx + 13;
    const title = titles[idx];
    const districtId = id <= 16 ? 4 : id <= 20 ? 5 : 6;
    const district = districtThemes[districtId];
    const requiresSensors = id >= 17;
    const bossHealth = id === 16 ? 4 : id === 17 ? 4 : id === 18 ? 4 : id === 19 ? 5 : id === 20 ? 5 : id === 21 ? 6 : id === 22 ? 6 : id === 23 ? 7 : id === 24 ? 8 : 0;

    advancedEntries[id] = {
      id,
      title,
      zone: district.name,
      objective: `Navigate ${id <= 16 ? '3' : id <= 20 ? '4' : '5'} lanes in the ${district.name}, recover all energy shards${bossHealth ? `, defeat the ${bossHealth}-HP guardian` : ''}, and escape within program limits.`,
      learningObjective: requiresSensors
        ? 'Master adaptive sensor conditions inside loops to solve complex multi-lane maps within strict block budgets.'
        : 'Master multi-lane serpentine routing using alternating right and left turns with loop bodies.',
      newConcept: requiresSensors ? 'Adaptive Sensor Logic & Budget Constraints' : 'Serpentine Multi-Lane Loops',
      prerequisites: [`Level ${id - 1}`],
      practisedSkills: ['Loop optimization', 'Sensor evaluation', 'Step budget management'],
      introducedBlocks: [],
      allowedBlocks: ['cv_move', 'cv_left', 'cv_right', 'cv_collect', 'cv_repeat', 'cv_jump', 'cv_activate', 'cv_pulse', 'cv_if', 'cv_if_else', 'cv_sensor'],
      conceptExplanation: requiresSensors
        ? 'In high-density sectors, hardcoded actions exceed block limits. Wrap your navigation in loops and use sensors (like "energy on tile") to decide when to collect shards automatically.'
        : 'When traversing back and forth across multiple lanes, alternate your turns at the end of each lane (Right-Right on lane 1, Left-Left on lane 2) while keeping actions inside repeating loops.',
      visualLegend: [VISUAL_LEGEND.robot, VISUAL_LEGEND.energy, VISUAL_LEGEND.hazard, VISUAL_LEGEND.exit],
      workedExample: {
        title: 'Lane Traversal Loop',
        explanation: 'Shows moving along a lane and using a sensor to collect energy efficiently.',
        program: [{ type: 'repeat', count: 3, body: [{ type: 'move' }, { type: 'if', sensor: 'energy', body: [{ type: 'collect' }] }] }],
        demoMap: ['#####', '#SCG#', '#####'],
        demoInitialState: { x: 1, y: 1, direction: 0 }
      },
      commonMistake: {
        mistake: 'Writing separate blocks for each tile, which causes a "Program too large" block budget failure.',
        correction: 'Look for repeating lane patterns and condense your moves into Repeat loops.'
      },
      hints: [
        { level: 1, label: 'Notice the Goal', text: `This sector has strict constraints: ${requiresSensors ? 'You MUST evaluate a sensor condition and execute a repeat loop.' : 'You MUST execute a repeat loop.'}` },
        { level: 2, label: 'Helpful Concept', text: 'Plan lane by lane. Alternate between right turns and left turns at the lane edges.' },
        { level: 3, label: 'Step-by-Step Suggestion', text: bossHealth ? `Remember to fire ${bossHealth} pulse attacks before advancing onto the guardian's tile!` : 'Jump over red corruption tiles and use sensors to grab all shards.' }
      ],
      postSuccessExplanation: `Outstanding! You conquered Sector ${id} demonstrating advanced algorithmic efficiency in the ${district.name}.`
    };
  }

  return advancedEntries;
}

// Populate full 24-level curriculum
Object.assign(LEVEL_CURRICULUM, generateAdvancedCurriculum());

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
 * Validates that all 24 campaign levels have complete, valid structured lesson content.
 *
 * @param {Array} levelsList
 * @returns {{ valid: boolean, errors: string[] }}
 */
export function auditCurriculum(levelsList) {
  const errors = [];
  if (!Array.isArray(levelsList) || levelsList.length !== 24) {
    errors.push(`Expected 24 levels in campaign list, received ${levelsList?.length}`);
  }

  for (let id = 1; id <= 24; id++) {
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
 * @param {Array} program
 * @returns {{ diagnosis: string, suggestion: string, hintTier: number }}
 */
export function diagnoseFailure(level, finalState, _program) {
  const curriculum = getLevelCurriculum(level.id);

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
