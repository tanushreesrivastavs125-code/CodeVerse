# CodeVerse — Game Architecture & Implementation Roadmap

---

## 1. Executive Summary & Product Direction

**CodeVerse** is an interactive, gamified coding education platform. This roadmap establishes the architectural and product pivot from a multiple-choice quiz assessment model to a **playable, animated coding adventure**.

Learners program an animated autonomous drone through cyber-themed grid environments using visual block programming (Blockly). Learners witness their code execute step-by-step through deterministic animations, collecting energy shards, leaping over corrupted void breaches, toggling terminal bridges, and dismantling firewall guardians.

### 1.1 Guiding Principles
- **CodeVerse Branding:** Retain the CodeVerse identity, developer-grade cyber HUD aesthetic, and pedagogical philosophy:
  $$\mathbf{PLAY} \longrightarrow \mathbf{BUILD} \longrightarrow \mathbf{UNDERSTAND} \longrightarrow \mathbf{CODE} \longrightarrow \mathbf{MASTER}$$
- **Interactive Coding First:** Quizzes are **not** the main gameplay. The core progression is advancing through the 24-level campaign.
- **Server-Authoritative Execution:** The client submits only an Abstract Syntax Tree (AST) / command list. The server simulates the run in a sandboxed, deterministic virtual world, validates constraints, and awards stars, XP, and unlocks. The client never decides rewards or arbitrary code execution.
- **Progressive Cognitive Scaffolding:** From basic sequence planning to algorithmic loops, conditional branches, spatial sensors, and multi-variable boss battles.

---

## 2. Superseded Assumptions vs. Preserved Foundations

To maintain engineering integrity, this matrix documents how earlier design specifications in `docs/PRD.md`, `docs/HLD.md`, and `docs/LLD.md` are adapted:

| Dimension | Previous Assumption (PRD / HLD / LLD) | Updated Product Direction (Game Roadmap) | Action / Status |
|:---|:---|:---|:---|
| **Core Gameplay** | Multiple-choice quiz questions per topic, Bloom's cognitive taxonomy via MCQs | Visual block programming of an animated drone solving 24 spatial/algorithmic levels across 6 districts | **Replaced:** Quizzes relegated to optional secondary module; game campaign is primary |
| **Quiz Engine** | Implemented on `feature/quiz-engine` (202 unit & integration tests) | Preserved on dedicated checkpoint branch (`c25eb33`) for potential auxiliary evaluation | **Preserved / Checkpointed:** Safely preserved; not merged into game core |
| **Code Execution** | Client-side Web Worker executing raw JavaScript strings with 1,000ms watchdog | Server-authoritative deterministic simulation of a bounded command DSL; client renders frame states | **Upgraded:** Eliminates RCE risk; guarantees deterministic state replay |
| **Authentication** | Bearer JWT stored in client memory; header-based authorization | Hybrid Bearer JWT + HTTP-only cookie browser sessions; guest quick-play sessions with rate limiting | **Enhanced:** Preserves API compatibility while securing web browser sessions |
| **User Progress** | User fields: `username`, `email`, `totalXp`, `level`, `currentStreak`, `role` | Reuse exact user model; add `coins` and persistent `GameWin` / `CampaignProgress` records | **Preserved & Extended:** Same XP leveling curve ($100 \times \text{level}^{1.5}$) |
| **Database Schema** | MongoDB (Mongoose 9) with replica-set transactions or compensating rollback | MongoDB primary store; campaign completions indexed uniquely by `(user, level, campaignVersion)` | **Preserved:** Reuses established transaction and rollback patterns |
| **Curriculum API** | Topics API (`/api/topics`) and seed infrastructure (`ddf159c`) | Maintained as background curriculum mapping; districts align with programming concepts | **Preserved:** Reused for knowledge domain mapping |

---

## 3. Core Gameplay & Mechanical Design

### 3.1 World Elements & Tile Taxonomy
The game world is represented as a 2D tile grid:
- `.` **Floor Tile:** Traversal surface.
- `#` **Void / Wall:** Impassable perimeter boundary or obstacle.
- `S` **Spawn Point:** Initial drone position and facing heading (0: East, 1: South, 2: West, 3: North).
- `G` **Extraction Portal (Goal):** Objective endpoint. Can only be entered once all required energy shards are recovered and all guardians defeated.
- `C` **Energy Shard:** Collectible objective required to stabilize the portal.
- `H` **Hazard / Breach:** Corrupted tile. Walking directly onto it causes an instant crash; must be bypassed using `jump` (clearing 2 tiles).
- `T` **Terminal:** Interactive switch tile. Activating it permanently extends associated bridge tiles (`B`).
- `B` **Bridge Tile:** Void breach until activated by terminal `T`. Traversable once deployed.
- `X` **Firewall Guardian:** Defensive boss entity possessing 3 to 8 shield points. Impassable while shield $> 0$. Bypassed by firing directed `pulse` charges within a 3-tile line-of-sight.

### 3.2 Visual Programming DSL & Command Tree
The drone is controlled via a strictly typed, bounded command tree:
- **Movement:**
  - `move`: Advance 1 tile in current heading.
  - `left`: Turn 90° counter-clockwise (does not alter position).
  - `right`: Turn 90° clockwise (does not alter position).
  - `jump`: Leap 2 tiles forward in current heading (clears over intermediate hazard `H`).
- **Interaction:**
  - `collect`: Recover energy shard on current tile.
  - `activate`: Toggle terminal on current tile to deploy bridges.
  - `pulse`: Fire ionic beam up to 3 tiles forward to deplete guardian shield.
- **Control Flow:**
  - `repeat(count, body)`: Execute enclosed blocks `count` times ($1 \le \text{count} \le 30$).
  - `if(sensor, body, elseBody)`: Conditional execution based on environmental query.
- **Sensors:**
  - `wall`: Detects if next tile is impassable (`#`, retracted bridge, or alive guardian).
  - `energy`: Detects if current tile contains an uncollected energy shard.
  - `hazard`: Detects if tile directly ahead is corrupted (`H`).
  - `terminal`: Detects if current tile is an active terminal switch.
  - `guardian`: Detects if guardian is within 3-tile forward line-of-sight.

### 3.3 Server Execution Guardrails & Bounded Limits
To guarantee system stability, prevent infinite loops, and eliminate denial-of-service vectors:
- **Maximum Nesting Depth:** 8 levels.
- **Maximum AST Program Nodes:** 300 instructions.
- **Maximum Simulation Steps (Ticks):** 150 discrete actions per run.
- **Block & Action Budgets:** Specific levels enforce visible block count (`maxBlocks`) and action step (`maxActions`) limits.
- **Strict AST Validation:** Deep tree traversal before execution. Rejects unknown commands, invalid sensor names, non-integer repeat counts, and extraneous fields. No `eval()`, `new Function()`, or dynamic code evaluation.

---

## 4. 24-Level Campaign Structure: The Six Districts

The campaign comprises 24 progressive sectors across six distinct cyberpunk districts:

```
District 1: Neon Outskirts (Levels 1–4)
  └─ Sequential logic, basic actions, turning, introduction to loops
District 2: Cipher District (Levels 5–8)
  └─ Jump mechanics, terminal-bridge state, conditions, nested logic
District 3: Firewall Core (Levels 9–12)
  └─ Jump + state synchronization, sensors, boss combat, final district mission
District 4: Shadow Network (Levels 13–16)
  └─ Multi-lane algorithmic navigation, mandatory loops, 4-point guardians
District 5: Quantum Grid (Levels 17–20)
  └─ Dynamic sensor conditions, tight block budgets, 4–5 point guardians
District 6: Singularity (Levels 21–24)
  └─ Multi-phase routing, high hazard density, 6–8 point shield guardians
```

### Campaign Sector Specifications

| Level | Sector Title | District | Pedagogical Concept | Objectives & Mechanics | Par Steps | Boss HP |
|:---:|:---|:---|:---|:---|:---:|:---:|
| **1** | Boot Sequence | Neon Outskirts | Sequence & Orientation | 3 forward moves to reach portal | 3 | — |
| **2** | Energy Run | Neon Outskirts | Actions & Collection | Recover 2 energy shards, extract | 6 | — |
| **3** | The First Turn | Neon Outskirts | Directional Control | Turn 90° right, collect shard, extract | 6 | — |
| **4** | Loop Runner | Neon Outskirts | Repeat Loops | Long corridor; collect 4 shards using loop | 11 | — |
| **5** | Broken Circuit | Cipher District | Jump Mechanics | Jump 2-tile gap over hazard, collect shard | 5 | — |
| **6** | Switch Protocol | Cipher District | State & Terminals | Activate terminal to extend bridge, cross | 8 | — |
| **7** | Signal Scanner | Cipher District | Conditional Logic | If standing on energy, collect; traverse corridor | 11 | — |
| **8** | The Spiral | Cipher District | Nested Logic | Spiral maze around void; turn sequences | 12 | — |
| **9** | Double Breach | Firewall Core | State + Jump Combo | Terminal activate $\rightarrow$ bridge $\rightarrow$ jump hazard | 9 | — |
| **10** | Dead End Decoder | Firewall Core | Spatial Sensors | If wall ahead turn right, else move; collect | 9 | — |
| **11** | Firewall Guardian | Firewall Core | Boss Combat (Pulse) | Face guardian, 3 pulse strikes to destroy shield | 10 | 3 |
| **12** | Zero Day Escape | Firewall Core | Multi-System Mission | Terminal + bridge + jump + pulse boss + extract | 16 | 3 |
| **13** | Relay Ascent | Shadow Network | Multi-Lane Traversal | 3 lanes, 9 width, 3 shards, mandatory loops | 27 | — |
| **14** | Corrupted Relay | Shadow Network | Hazard Avoidance | 3 lanes, 10 width, 4 shards, 1 hazard jump | 30 | — |
| **15** | Bridge Labyrinth | Shadow Network | Remote Bridge Deploy | 3 lanes, 10 width, terminal + 2 bridges, 4 shards | 32 | — |
| **16** | Shadow Sentinel | Shadow Network | Combat & Routing | 3 lanes, 11 width, 5 shards, 4-point boss shield | 38 | 4 |
| **17** | Sensor Sweep | Quantum Grid | Mandatory Sensors | 4 lanes, 11 width, 5 shards, mandatory sensor | 49 | 4 |
| **18** | Fractured Lanes | Quantum Grid | Multi-Hazard Timing | 4 lanes, 11 width, 6 shards, 4 hazard breaches | 50 | 4 |
| **19** | Quantum Lock | Quantum Grid | Tight Block Budget | 4 lanes, 11 width, 7 shards, 5-point boss shield | 52 | 5 |
| **20** | Grid Overload | Quantum Grid | Algorithmic Optimization| 4 lanes, 11 width, 8 shards, 6 hazard breaches | 53 | 5 |
| **21** | Deep Core Descent | Singularity | Extreme Routing | 5 lanes, 11 width, 8 shards, 6-point boss shield | 66 | 6 |
| **22** | Blackout Protocol | Singularity | Blind Sensor Navigation| 5 lanes, 11 width, 9 shards, 7 hazard breaches | 67 | 6 |
| **23** | Last Transmission | Singularity | Shield Endurance | 5 lanes, 11 width, 10 shards, 7-point boss shield | 69 | 7 |
| **24** | The Singularity | Singularity | Grandmaster Synthesis | 5 lanes, 11 width, 12 shards, 8-point final boss | 72 | 8 |

---

## 5. Economy, Scoring & Progression Persistence

### 5.1 Reward Structure
- **First-Time Sector Clear:**
  - **100 XP** awarded immediately to user's cumulative `totalXp`.
  - **25 Coins** awarded for cosmetics and future unlocks.
  - Subsequent sector unlocks in linear order (Level $N$ clear unlocks Level $N+1$).
- **Replays & Anti-Farming:**
  - Learners can replay cleared levels indefinitely to optimize algorithms or improve stars.
  - Replays **never** award duplicate XP or coins (`earned = 0`).
  - Best stars are updated via `$max: { stars: result.stars }`.

### 5.2 Star Rating System
- **3 Stars:** Program block count $\le \lceil \text{par} / 2 \rceil$ (demonstrates algorithmic efficiency via loops/sensors).
- **2 Stars:** Simulation action steps $\le \text{par}$ (clean route planning).
- **1 Star:** Completed objectives and safely extracted.
- **0 Stars:** Failed run (crash, uncollected shards, guardian surviving, or out of bounds).

### 5.3 Level Progression Formula
CodeVerse's established mathematical leveling formula is strictly preserved:
$$\text{XP Required for Level } N = \lceil 100 \times N^{1.5} \rceil$$
- Level 1: 0 – 99 XP
- Level 2: 100 – 282 XP
- Level 3: 283 – 519 XP
- Level 4: 520 – 799 XP

---

## 6. Staged Implementation Roadmap

```
Stage 0: Safe Baseline & Audit (Complete)
   │
   ▼
Stage 1: Deterministic Game Engine
   │  └─ Shared simulation, 3 baseline solvable levels, frame generator
   ▼
Stage 2: Authoritative API & Persistence
   │  └─ POST /api/game/levels/:id/run, idempotent GameWin, XP/coin grants
   ▼
Stage 3: Browser Auth & Routed Game Shell
   │  └─ HTTP-only cookies, React Router, quick play guest sessions
   ▼
Stage 4: Animated Playable Vertical Slice
   │  └─ Blockly integration, animated drone canvas, execution highlight
   ▼
Stage 5: 24-Level Progressive Campaign
   │  └─ 6 districts, 72 stars, boss shields, budget enforcement, solvability tests
   ▼
Stage 6: Neon Cyber Experience & Dossier
   │  └─ Cyber HUD, campaign map, command center, player stats, leaderboard
   ▼
Stage 7: AI Mentor & Guilds
   │  └─ Bounded hints, guild creation, collective XP
   ▼
Stage 8: Startup, CI & Production Readiness
      └─ Single-command launch, GitHub Actions CI, persistence verification
```

### Detailed Breakdown of Stages

#### Stage 0: Safe Baseline & Repository Audit (CURRENT)
- **Goal:** Audit architecture, verify Git integrity, preserve unfinished quiz work, run full test baseline, establish roadmap.
- **Deliverables:**
  - `feature/quiz-engine` checkpointed cleanly at `c25eb33`.
  - Baseline checks verified: 202 tests passed, lint clean, frontend build clean.
  - `docs/GAME_ROADMAP.md` authored.

#### Stage 1: Deterministic Game Engine
- **Branch:** `feature/campaign-engine`
- **Goal:** Create a pure, zero-dependency JavaScript simulation engine (`simulate(level, program)`).
- **Deliverables:**
  - Level data structure and coordinate system.
  - Solvable baseline levels (1 to 3).
  - Command interpreter: `move`, `left`, `right`, `collect`, `jump`, `activate`, `pulse`, `repeat`, `if/else`.
  - Frame emitter generating ordered visual snapshots.
  - solvalibity and bound limit unit tests.

#### Stage 2: Authoritative Game API & Persistence
- **Branch:** `feature/campaign-api`
- **Goal:** Implement secure server endpoints evaluating submitted programs and persisting progress.
- **Deliverables:**
  - `GET /api/game/levels`: Return sector metadata, unlock states, best stars.
  - `POST /api/game/levels/:id/run`: Run program server-side, evaluate results, apply atomic rewards.
  - `GameWin` Mongoose model with unique `(user, level, campaignVersion)` index.
  - Idempotent reward reconciliation using existing `gamificationService` and `calculateLevel`.
  - Integration tests for locks, unlocks, replay idempotency, and crash handling.

#### Stage 3: Browser Authentication & Routed Game Shell
- **Branch:** `feature/game-auth-shell`
- **Goal:** Provide seamless browser access, session restoration, and client-side routing.
- **Deliverables:**
  - HTTP-only cookie support alongside Bearer JWT for client flexibility.
  - Guest quick-play session generator (rate-limited, persistent MongoDB guest user).
  - React Router integration (`/play`, `/dashboard`, `/profile`, `/login`, `/register`).
  - Responsive Cyber HUD with real-time level, XP bar, streak, and coin counter.

#### Stage 4: Animated Playable Level Connected End-to-End
- **Branch:** `feature/animated-coding-game`
- **Goal:** Complete interactive vertical slice connecting Blockly to the live drone world.
- **Deliverables:**
  - Blockly workspace with cyber-themed custom blocks (Move, Turn, Collect, Jump, Pulse, Repeat, Sensors).
  - Live animated drone rendering canvas (interpolated position, rotation, particle pickups, laser pulses).
  - Frame-by-frame execution playback with block highlighting.
  - Failure explanations (crash, missed energy, out of bounds) and instant retry.
  - End-to-end browser verification of Levels 1–3.

#### Stage 5: 24 Progressive Levels Across Six Districts
- **Branch:** `feature/campaign-24-levels`
- **Goal:** Expand campaign to all 24 levels with increasing algorithmic complexity.
- **Deliverables:**
  - Procedural/matrix definitions for all 24 sectors across 6 districts.
  - Guardian shield combat scaling from 3 to 8 points.
  - Server-enforced block and action budget constraints.
  - Campaign map with sector statuses (locked, active, completed, 1–3 stars).
  - Automated solvability test suite executing valid solutions for every level.

#### Stage 6: Professional Neon Interface & Progress Pages
- **Branch:** `feature/neon-game-experience`
- **Goal:** Polish the visual presentation to production cyber-grade quality.
- **Deliverables:**
  - High-performance canvas/CSS ambient code flow background.
  - Sleek campaign sector selector with interactive district nodes.
  - Player Dossier & Command Center page displaying stats, badges, and sector masteries.
  - All-time and weekly leaderboards aggregating verified campaign XP.
  - Accessibility compliance: visible focus indicators, screen reader labels, `prefers-reduced-motion` support.

#### Stage 7A: Game-Aware AI Flight Mentor & Reliable Offline Fallback
- **Branch:** `feature/game-mentor`
- **Goal:** Add an authenticated, rate-limited, pedagogical flight mentor providing contextual hints, concept explanations, simulation diagnostics, and tactical recommendations.
- **Deliverables:**
  - Game-aware mentor API endpoint (`POST /api/ai/mentor`) with 4 distinct modes (`hint`, `explain`, `debug`, `recommend`).
  - Strict server-side validation: bounded AST validation, 500-character message bound, level unlock verification.
  - Rate limiting (20 consultations per minute) and bounded provider timeout (8,000ms).
  - External LLM provider integration (`LLM_API_KEY`, `LLM_API_URL`, `LLM_MODEL`) supporting Gemini and OpenAI-compatible formats.
  - Robust deterministic autonomous fallback engine covering all 24 levels and game mechanics (headings/turns, hazards/jumps, energy collection, bridge terminals, loop compaction, sensors, guardian shields, and budgets).
  - Honest source attribution badging (`🤖 AI Neural Guidance` vs `🛡️ Autonomous Offline Guidance`).
  - Zero side effects: mentor requests never alter player XP, coins, stars, completions, or unlocks.
  - Interactive frontend UI: dedicated `/mentor` command center and compact `MentorModal` accessible directly from the flight deck without resetting workspace programs.

#### Stage 7B: Persistent Guilds & Combined Member XP
- **Branch:** `feature/game-guilds`
- **Goal:** Implement persistent collaborative pilot squadrons, single-source-of-truth membership, deterministic ownership succession, clean disbanding, and real-time combined member XP.
- **Deliverables:**
  - Authoritative Guild and GuildMembership schemas with compound unique indexing enforcing at most one active guild per player.
  - Multi-document ACID database transactions coordinating guild creation, join, leave, owner succession, and disbanding without dangling data.
  - Dynamic derivation of Combined Member XP as the real-time sum of active members' authoritative lifetime XP with zero side-effects on personal player balances.
  - Deterministic owner succession transferring leadership to the senior remaining member (`joinedAt: 1, _id: 1`) on owner departure; clean disbanding when the final pilot leaves.
  - Safe public data exposure omitting emails, passwords, and sensitive credentials from roster payloads.
  - Rate-limited mutating operations (20 operations/min per user/IP) to protect transaction health.
  - Interactive `/guild` game shell UI featuring active squadron command HUD, public squadron directory with search, creation wizard with character counters, and honest guest session disclosures.

#### Stage 8: Reliable Startup, CI & Release Readiness
- **Branch:** `chore/game-release-readiness`
- **Goal:** Developer ergonomics, automated CI pipelines, and production deployment scripts.
- **Deliverables:**
  - Root `start.mjs` launcher waiting for backend readiness before launching browser.
  - Cross-platform Windows launcher (`Start-CodeVerse.cmd`).
  - GitHub Actions CI matrix testing lint, unit tests, integration tests, and Vite build.
  - Complete documentation covering local setup, environment variables, seeding, and production deployment.

---

## 7. Quality & Verification Standards

To uphold CodeVerse's engineering standards:
1. **Zero Client Trust:** Game outcomes, unlocks, stars, and XP are calculated solely on the server.
2. **Deterministic Replay:** Given an identical level and program AST, the engine must always produce identical frame outputs and star evaluations.
3. **Idempotent Rewards:** Network disconnects, browser refreshes, or duplicate submissions can never double-grant rewards.
4. **Test Coverage:** Every engine feature, API endpoint, and level definition must be accompanied by automated tests (`npm test` and `npm run lint` must pass with 0 errors at every stage).

