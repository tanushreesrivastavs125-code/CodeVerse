# CodeVerse Educational Curriculum Map (Stage C)

This document provides the authoritative curriculum audit and pedagogical map for all 24 campaign levels in CodeVerse, grounded strictly in evaluated simulation engine mechanics.

---

## 1. Pedagogical Design Principles

1. **Concrete Actions Before Abstractions**: Concepts are introduced visually on the game board before learners write code.
2. **Teach Before First Use**: When encountering a concept or block for the first time, learners receive a short dismissible lesson with an interactive sandbox demonstration.
3. **Progressive Block Staging**: Early levels expose only the blocks needed for the lesson and previously practiced mechanics. Staged toolboxes eliminate cognitive overload. Curious learners can toggle `[ Show All Blocks ]` at any time.
4. **Graduated 3-Tier Guidance**: Hints never dump raw answers. Tier 1 highlights what to observe on the board; Tier 2 identifies the relevant programming concept or block; Tier 3 offers a concrete step-by-step partial suggestion via explicit learner click.
5. **Clear Error Diagnosis**: Failure diagnostics distinguish between the *observed mistake* (e.g. wall collision or hazard breach) and *what to try next*.
6. **Honest Mechanical Scope**: Unsupported concepts (while loops, functions/procedures, variables, recursion, sorting) are explicitly classified as future curriculum and are not falsely claimed for existing levels.

---

## 2. Block Mechanics Reference

| Block | Type | Category | Mechanics / Syntax | Introduced |
| :--- | :--- | :--- | :--- | :--- |
| **Move Forward** | `cv_move` | Actions | Advances 1 tile in facing direction (`move()`). Fails if wall or hazard. | Level 1 |
| **Repeat N Times** | `cv_repeat` | Control | Loops enclosed body N times ($1 \le N \le 30$) (`repeat(N) { ... }`). | Level 1 (formalized in Level 4) |
| **Collect Energy** | `cv_collect` | Actions | Collects shard on current tile (`collect()`). Portal requires all shards. | Level 2 |
| **Turn Left** | `cv_left` | Actions | Rotates 90° counter-clockwise in place (`turnLeft()`). | Level 3 |
| **Turn Right** | `cv_right` | Actions | Rotates 90° clockwise in place (`turnRight()`). | Level 3 |
| **Jump Breach** | `cv_jump` | Actions | Vaults exactly 2 tiles forward in facing direction (`jump()`). Bypasses hazards. | Level 5 |
| **Activate Terminal**| `cv_activate` | Actions | Flips switch on terminal tile (`T`), extending bridges (`B`) (`activate()`). | Level 6 |
| **If Condition** | `cv_if` | Control | Evaluates sensor predicate before executing body (`if (sensor) { ... }`). | Level 7 |
| **Sensor Input** | `cv_sensor` | Sensors | Scans surroundings (`wall`, `energy`, `hazard`, `terminal`, `guardian`). | Level 7 |
| **If / Else** | `cv_if_else` | Control | Two-way decision branch (`if (sensor) { ... } else { ... }`). | Level 10 |
| **Fire Pulse** | `cv_pulse` | Actions | Discharges energy pulse 1–3 tiles straight ahead (`pulse()`). Reduces boss HP. | Level 11 |

---

## 3. Authoritative 24-Level Curriculum Audit Table

| Level | District | Concept / Mechanic | Plain-English Objective | Learning Objective | Prerequisites | Practised Skills | Allowed Blocks |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **1** | Neon Outskirts | Sequences & Forward Movement | Move forward 3 tiles to reach the green exit portal. | Understand sequential execution: commands run in order from top to bottom. | Basic navigation | Counting steps, connecting blocks | `cv_move`, `cv_repeat` |
| **2** | Neon Outskirts | Actions & Shard Collection | Collect both energy shards along the path, then extract. | Understand action commands and state changes on specific tiles. | Level 1: Sequences | Sequential movement, stopping at targets | `cv_move`, `cv_collect`, `cv_repeat` |
| **3** | Neon Outskirts | Direction & Turning (Heading) | Navigate around the corner, collect shard, and exit. | Understand heading: rotating 90° in place without changing position. | Level 2: Actions | Movement, collecting, spatial reasoning | `cv_move`, `cv_left`, `cv_right`, `cv_collect`, `cv_repeat` |
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

## 5. Distinction from Future Curriculum (Stages D & E)

The following concepts are planned for future stages and are **NOT** claimed by existing levels:

- **While Loops & Indefinite Iteration**: Current engine supports fixed repeat loops ($1 \le N \le 30$) and conditional statements (`if`, `if/else`).
- **User-Defined Functions / Procedures**: Custom subroutines and reusable functions.
- **Variables & Arithmetic Expressions**: Mutable counters and user-assigned memory slots.
- **Recursion & Call Stacks**: Self-referencing function execution.
- **Sorting & Array Algorithms**: In-place sorting and indexed memory access.
