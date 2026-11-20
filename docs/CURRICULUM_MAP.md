# CodeVerse Educational Curriculum Map (Stage E3)

This document provides the authoritative curriculum audit and pedagogical map for all 44 campaign levels in CodeVerse, grounded strictly in evaluated simulation engine mechanics.

---

## 1. Pedagogical Design Principles

1. **Concrete Actions Before Abstractions**: Concepts are introduced visually on the game board before learners write code.
2. **Teach Before First Use**: When encountering a concept or block for the first time, learners receive a short dismissible lesson with an interactive sandbox demonstration.
3. **Progressive Block Staging**: Early levels expose only the blocks needed for the lesson and previously practiced mechanics. Staged toolboxes eliminate cognitive overload. Curious learners can toggle `[ Show All Blocks ]` at any time.
4. **Graduated 3-Tier Guidance**: Hints never dump raw answers. Tier 1 highlights what to observe on the board; Tier 2 identifies the relevant programming concept or block; Tier 3 offers a concrete step-by-step partial suggestion via explicit learner click.
5. **Clear Error Diagnosis**: Failure diagnostics distinguish between the *observed mistake* (e.g. wall collision, index out of bounds, or hazard breach) and *what to try next*.
6. **Honest Mechanical Scope**: Unsupported future concepts (searching algorithms, sorting algorithms, recursion) are explicitly classified as future curriculum and are not falsely claimed for existing levels.

---

## 2. Block Mechanics Reference

| Block | Type | Category | Mechanics / Syntax | Introduced |
| :--- | :--- | :--- | :--- | :--- |
| **Move Forward** | `cv_move` | Actions | Advances 1 tile in facing direction (`move()`). Fails if wall or hazard. | Level 1 |
| **Collect Energy** | `cv_collect` | Actions | Collects shard on current tile (`collect()`). Portal requires all shards. | Level 2 |
| **Turn Left** | `cv_left` | Actions | Rotates 90° counter-clockwise in place (`turnLeft()`). | Level 3 |
| **Turn Right** | `cv_right` | Actions | Rotates 90° clockwise in place (`turnRight()`). | Level 3 |
| **Repeat N Times** | `cv_repeat` | Control | Loops enclosed body N times ($1 \le N \le 30$) (`repeat(N) { ... }`). | Level 4 |
| **Jump Breach** | `cv_jump` | Actions | Vaults exactly 2 tiles forward in facing direction (`jump()`). Bypasses hazards. | Level 5 |
| **Activate Terminal**| `cv_activate` | Actions | Flips switch on terminal tile (`T`), extending bridges (`B`) (`activate()`). | Level 6 |
| **If Condition** | `cv_if` | Control | Evaluates sensor predicate before executing body (`if (sensor) { ... }`). | Level 7 |
| **Sensor Input** | `cv_sensor` | Sensors | Scans surroundings (`wall`, `energy`, `hazard`, `terminal`, `guardian`). | Level 7 |
| **If / Else** | `cv_if_else` | Control | Two-way decision branch (`if (sensor) { ... } else { ... }`). | Level 10 |
| **Fire Pulse** | `cv_pulse` | Actions | Discharges energy pulse 1–3 tiles straight ahead (`pulse()`). Reduces boss HP. | Level 11 |
| **Set Variable** | `cv_var_set` | Variables | Initializes or overwrites named variable (`x = 0;`). | Level 25 |
| **Change Variable** | `cv_var_change` | Variables | Mutates existing numeric counter by step amount (`x += 1;`). | Level 26 |
| **Comparison** | `cv_compare` | Logic | Compares two expressions with `<, <=, ==, !=, >, >=`. | Level 27 |
| **Repeat While** | `cv_while` | Control | Repeats enclosed body while condition is true (`while (cond) { ... }`). | Level 28 |
| **Define Routine** | `cv_fn_def` | Routines | Defines top-level named procedure (`function name() { ... }`). | Level 33 |
| **Call Routine** | `cv_fn_call` | Routines | Invokes named routine from main program or another routine. | Level 33 |
| **Define with Param** | `cv_fn_def_param`| Routines | Defines procedure accepting numeric parameter (`function name(param) { ... }`).| Level 35 |
| **Call with Arg** | `cv_fn_call_param` | Routines | Invokes routine with evaluated argument (`name(5);`). | Level 35 |
| **Create Array** | `cv_array_create`| Arrays | Allocates fixed-length integer array with literal items (`let arr = [v1, v2];`).| Level 39 |
| **Read Array Element**| `cv_array_get` | Arrays | Reads value at zero-based index (`arr[i]`). Out-of-bounds throws descriptive error.| Level 40 |
| **Update Element** | `cv_array_set` | Arrays | Mutates value at zero-based index (`arr[i] = val`). | Level 41 |
| **Array Length** | `cv_array_length`| Arrays | Evaluates current number of elements in array (`arr.length`). | Level 42 |

---

## 3. Authoritative 44-Level Curriculum Audit Table

| Level | District | Concept / Mechanic | Plain-English Objective | Learning Objective | Prerequisites | Practised Skills | Allowed Blocks |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **1** | Neon Outskirts | Sequences & Forward Movement | Move forward 3 tiles to reach the green exit portal. | Understand sequential execution: commands run in order from top to bottom. | Basic navigation | Counting steps, connecting blocks | `cv_move` |
| **2** | Neon Outskirts | Actions & Shard Collection | Collect both energy shards along the path, then extract. | Understand action commands and state changes on specific tiles. | Level 1: Sequences | Sequential movement, stopping at targets | `cv_move`, `cv_collect` |
| **3** | Neon Outskirts | Direction & Turning (Heading) | Navigate around the corner, collect shard, and exit. | Understand heading: rotating 90° in place without changing position. | Level 2: Actions | Movement, collecting, spatial reasoning | `cv_move`, `cv_left`, `cv_right`, `cv_collect` |
| **4** | Neon Outskirts | Repeat Loops (Iteration) | Collect all four shards using a compact program with a loop. | Understand iteration: running a block group multiple times to eliminate repetition. | Level 3: Turning | Spotting patterns, loop body design | `cv_move`, `cv_left`, `cv_right`, `cv_collect`, `cv_repeat` |
| **5** | Cipher District | Breach Jumping (Hazards) | Leap over the red corruption hazard tile, collect shard, and extract. | Understand multi-tile actions: leaping two tiles to safely clear hazards. | Level 4: Loops | Distance calculation, hazard identification | `cv_move`, `cv_left`, `cv_right`, `cv_collect`, `cv_repeat`, `cv_jump` |
| **6** | Cipher District | Terminals & Bridge Deployment | Step onto terminal, activate it to deploy bridge, and cross to exit. | Understand interactive switches and dynamic environment state. | Level 5: Jumping | Sequential problem solving, switches | `cv_move`, `cv_left`, `cv_right`, `cv_collect`, `cv_repeat`, `cv_jump`, `cv_activate` |
| **7** | Cipher District | Conditionals (If / Sensor) | Gather shards scattered irregularly using a conditional check. | Understand conditional statements: checking environmental sensors before acting. | Level 6: Terminals | Loop-with-condition pattern, sensors | `cv_move`, `cv_left`, `cv_right`, `cv_collect`, `cv_repeat`, `cv_jump`, `cv_activate`, `cv_if`, `cv_sensor` |
| **8** | Cipher District | Multi-Leg Path Navigation | Navigate perimeter corridor, collect central shard, and extract. | Understand multi-turn path planning and coordinated directional changes. | Level 7: Conditionals | Multiple turns, looping sections, planning | `cv_move`, `cv_left`, `cv_right`, `cv_collect`, `cv_repeat`, `cv_jump`, `cv_activate`, `cv_if`, `cv_sensor` |
| **9** | Firewall Core | Mechanic Chaining (Switch + Jump) | Deploy bridge, jump hazard, recover shard, and extract. | Synthesize multiple mechanics: combining switches, bridges, and hazard jumps. | Level 8: The Spiral | Terminal activation, leaping, coordination | `cv_move`, `cv_left`, `cv_right`, `cv_collect`, `cv_repeat`, `cv_jump`, `cv_activate`, `cv_if`, `cv_sensor` |
| **10** | Firewall Core | Two-Way Branching (If / Else) | Follow winding corridor by detecting walls ahead with If/Else. | Understand two-way decision logic: choosing between alternative actions. | Level 9: Double Breach | Sensors, branching logic, maze following | `cv_move`, `cv_left`, `cv_right`, `cv_collect`, `cv_repeat`, `cv_jump`, `cv_activate`, `cv_if`, `cv_if_else`, `cv_sensor` |
| **11** | Firewall Core | Ranged Combat & Shields | Grab energy, face guardian, and fire 3 pulse discharges. | Understand ranged attacks and state counters: depleting enemy health pools. | Level 10: Dead End Decoder | Ranged targeting, repeated combat actions | All core blocks + `cv_pulse` |
| **12** | Firewall Core | Full System Synthesis | District 3 Finale: Collect shards, bridge breach, defeat guardian. | Full mission synthesis: orchestrating every learned mechanic. | Level 11: Firewall Guardian | All core actions, loops, switches, combat | All blocks |
| **13** | Shadow Network | Serpentine Multi-Lane Loops | Navigate 3 lanes in Shadow Network, recover shards, and escape. | Master alternating turn patterns (right-right, left-left) inside loops. | Level 12: Zero Day Escape | Multi-lane traversal, loop compaction | All blocks |
| **14** | Shadow Network | Corrupted Relay | Traverse multiple hazard breaches across 3 lanes under par limits. | Coordinate breach jumps inside alternating multi-lane loops. | Level 13: Relay Ascent | Jump timing, hazard avoidance | All blocks |
| **15** | Shadow Network | Bridge Labyrinth | Activate multiple terminal switches to bridge dual void chasms. | Manage multi-switch state transitions and route return legs. | Level 14: Corrupted Relay | Sequential terminal activation, void safety | All blocks |
| **16** | Shadow Network | Shadow Sentinel | Conquer 3 lanes and defeat 4-HP guardian before extraction. | Coordinate multi-lane collection with multi-strike boss combat. | Level 15: Bridge Labyrinth | 4-strike pulse combat, par budget | All blocks |
| **17** | Quantum Grid | Adaptive Sensor Logic | Use sensor sweep to collect shards on 4 lanes within block budget. | Master adaptive sensor conditions inside loops to solve complex maps. | Level 16: Shadow Sentinel | Sensor conditions, block budget limits | All blocks |
| **18** | Quantum Grid | Fractured Lanes | Leap alternating hazards across 4 lanes while checking shard sensors. | Combine hazard jumping and shard sensing inside compact loops. | Level 17: Sensor Sweep | Conditional traversal, jump coordination | All blocks |
| **19** | Quantum Grid | Quantum Lock | Activate dual bridge terminals and defeat 5-HP firewall sentinel. | Coordinate environmental state flips with heavy guardian combat. | Level 18: Fractured Lanes | Dual bridge flips, 5-HP boss tactics | All blocks |
| **20** | Quantum Grid | Grid Overload | 4-lane grand master challenge with hazards, bridges, and 5-HP boss. | High-efficiency loop optimization under strict block par constraints. | Level 19: Quantum Lock | Multi-mechanic coordination | All blocks |
| **21** | Singularity | Deep Core Descent | Navigate 5 deep core lanes and neutralize 6-HP Singularity guardian. | Deep loop nesting and efficient orientation adjustments. | Level 20: Grid Overload | 5-lane navigation, 6-HP pulse combat | All blocks |
| **22** | Singularity | Blackout Protocol | Cross active breach void under tight action limits to reach extraction. | Extreme step-count optimization and zero-waste traversal. | Level 21: Deep Core Descent | Precision path minimization | All blocks |
| **23** | Singularity | Last Transmission | Recover 10 energy shards across 5 corridors and defeat 7-HP boss. | Multi-objective energy recovery and endurance combat sequence. | Level 22: Blackout Protocol | High-density shard sweep, 7-HP boss | All blocks |
| **24** | Singularity | The Singularity | Campaign Climax: Full 5-lane traversal, dual bridges, 8-HP guardian. | Master synthesis of all algorithms: loops, branches, jumps, and combat. | Level 23: Last Transmission | Full campaign mastery | All blocks |
| **25** | Algorithmic Core | Variables: Storage & Observation | Set variable `power` to 1 and observe in Live Watch panel. | Understand named variables as persistent memory locations for values. | Level 24: The Singularity | Variable declaration, value inspection | Variables + Core |
| **26** | Algorithmic Core | Counters & Incrementation | Use counter `shards` to count collected energy pickups. | Understand mutating counter variables incrementally (`counter += 1`). | Level 25: Variable Init | Variable modification, counter tracking | Variables + Core |
| **27** | Algorithmic Core | Value Comparisons & Decisions | Compare `power >= 1` to choose correct corridor route. | Understand relational comparison operators (`<, <=, ==, !=, >, >=`). | Level 26: Counter Step | Comparison logic, conditional branches | Variables + Core |
| **28** | Algorithmic Core | While Loops (Indefinite Iteration) | Traverse corridor using `while (step < 5)` loop. | Understand while loops as repeated execution while condition holds true. | Level 27: Comparison | While loop semantics, loop conditions | Variables + Core |
| **29** | Algorithmic Core | Loop Termination & Counter Updates | Gather 3 shards using while loop with counter increment inside. | Understand loop termination: mutating state inside loop to reach exit condition. | Level 28: While Loop | Counter increments, loop safety | Variables + Core |
| **30** | Algorithmic Core | Multi-Action While Iteration | Combine while loop traversal with switch activation and jumping. | Coordinate multiple actions within variable-bounded while loop bodies. | Level 29: Loop Exit | Multi-action loops, hybrid mechanics | Variables + Core |
| **31** | Algorithmic Core | Runaway Loop Diagnostics | Diagnose non-terminating loop with bounded safety watchdog demonstration. | Recognize infinite loops and understand why terminal condition was not reached. | Level 30: Hybrid While | Loop bounds, termination bugs, debugging | Variables + Core |
| **32** | Algorithmic Core | Algorithmic Synthesis Challenge | District Finale: Coordinate variables, counters, while loops, and boss combat. | Synthesize variable-bounded loops with full mechanical suite. | Level 31: Runaway Trap | Full variable & while loop mastery | Variables + Core |
| **33** | Procedural Matrix | Routine Definition & Execution | Define named procedure `advance` and call it to reach extraction. | Understand procedural abstraction: packaging instructions under a name. | Level 32: Synthesis | Routine definition, procedure calls | Routines + Core |
| **34** | Procedural Matrix | Routine Reusability | Define routine and call it at least twice across distinct corridors. | Understand reusability: write common instructions once, invoke multiple times. | Level 33: Routine Init | Multi-call workflows, DRY principles | Routines + Core |
| **35** | Procedural Matrix | Numeric Parameters | Define routine with parameter `steps` and invoke with argument 5. | Understand parameters and arguments: passing values dynamically into routines. | Level 34: Routine Reuse | Parameter binding, dynamic arguments | Routines + Core |
| **36** | Procedural Matrix | Modulated Arguments Across Calls | Invoke routine twice with distinct arguments (2, then 4) across lanes. | Understand polymorphic invocation: varying arguments to adapt routine behavior. | Level 35: Parameters | Multi-argument calls, flexible procedures | Routines + Core |
| **37** | Procedural Matrix | Procedural Composition in Loops | Compose routine `clearSection` inside repeat loop to vault breaches. | Understand procedural composition: nesting routines inside loops and branches. | Level 36: Modulated Calls | Routine composition, loop nesting | Routines + Core |
| **38** | Procedural Matrix | Comprehensive Procedural Mastery | Chapter Finale: Parameterized routines, terminal bridges, 3-HP boss defeat. | Master full procedural architecture combined with entire gameplay system. | Level 37: Composition | Full procedural mastery | Routines + Core |
| **39** | Memory Matrix | Array Creation & Numbered Cells | Create array `codes` with values `[2, 1, 3]` and inspect numbered cells in Array Watch. | Understand arrays as ordered sequences of items stored under one name. | Level 38: Procedural Finale | Array allocation, literal elements, cell inspection | Arrays + Core |
| **40** | Memory Matrix | Zero-Based Index Reads | Read `codes[0]` into variable `steps` and navigate corridor. | Master zero-based indexing: first item is at index 0, not 1. | Level 39: Array Init | Indexed element retrieval, index math | Arrays + Core |
| **41** | Memory Matrix | Updating Elements (Array Mutation) | Update `bridgeBuffer[1]` from 0 to 1 to deploy safety bridge. | Understand in-place mutation: reassigning specific cells without replacing the array. | Level 40: Index Reads | Element mutation, cell updates | Arrays + Core |
| **42** | Memory Matrix | Traversal with Index Counter | Traverse array `path` using index variable `i` from 0 to `length(path) - 1`. | Master sequential traversal: stepping through an entire array with a while loop. | Level 41: Array Mutation | Loop traversal, bounds testing, pointer tracking | Arrays + Core |
| **43** | Memory Matrix | Processing Arrays with Routines | Process array elements with conditional decisions inside reusable routine `processCell`. | Integrate arrays with procedural abstraction and sensor-assisted decisions. | Level 42: Array Traversal | Routine-array integration, modular design | Arrays + Routines + Core |
| **44** | Memory Matrix | Memory Matrix Grand Master | District Finale: Coordinate arrays, indexing, mutations, while loops, routines, and boss combat. | Master complete data structure orchestration in an independent challenge. | Level 43: Routine Processing | Full Stage E3 mastery | All blocks |

---

## 4. Visual World Map Legend

| Icon | Tile / Entity | Code / Key | Engine Behavior |
| :---: | :--- | :---: | :--- |
| 🤖 | **Recon Drone** | `S` | Controllable robot. Facing indicator (East, South, West, North). |
| 🟢 | **Extraction Portal** | `G` | Target goal. Requires all map energy shards collected before opening. |
| ⬜ | **Floor Tile** | `.` | Open safe pathway. |
| ⬛ | **Perimeter Barrier** | `#` | Impassable barrier. Moving into wall halts execution with collision. |
| 💎 | **Energy Shard** | `C` | Power core. Must run `collect` while standing directly on tile. |
| 🟥 | **Corruption Hazard** | `H` | Fatal breach. Stepping directly causes crash; vaultable via `jump`. |
| 🕹️ | **Terminal Switch** | `T` | Console switch. Running `activate` on tile deploys retracted bridges. |
| 🌉 | **Deployable Bridge** | `B` | Void breach until activated by terminal. Safe to cross once deployed. |
| 👾 | **Firewall Guardian**| `X` | Defensive barrier bot ($3$–$8$ HP). Fire `pulse` within 3 tiles to destroy. |

---

## 5. Distinction from Future Curriculum (Stage E4 & Beyond)

The following advanced concepts are planned for subsequent stages and are **NOT** claimed by existing levels:

- **Linear & Binary Searching (Stage E4)**: Finding items or target values within arrays using sequential and divide-and-conquer traversal.
- **Sorting Algorithms (Stage E5)**: In-place comparison and swap algorithms (Bubble Sort, Selection Sort) with visual swap animations.
- **Recursion & Call Stacks (Stage E6)**: Self-referencing subroutines with base cases. (The engine explicitly rejects recursion in Stages E2 and E3).
