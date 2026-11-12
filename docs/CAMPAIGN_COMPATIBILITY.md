# CodeVerse Campaign Compatibility & Versioning Policy

This document establishes the architectural contract and compatibility policy governing CodeVerse's campaign progression, level data definitions, database schemas, and client-server synchronization.

---

## 1. Core Architectural Invariants

1. **Deterministic Shared Engine:**  
   Simulation mechanics, collision boundaries, sensor evaluations, and par definitions reside in `shared/game.js`. Both the backend authoritative engine and the frontend visualizer execute against identical rules.

2. **Authoritative Server Progression:**  
   The client never determines level completion, star ratings, unlock transitions, or currency increments. All submissions are sent as AST command trees to `POST /api/game/levels/:id/run` and simulated authoritatively by the backend.

3. **Multi-Document Transaction Durability:**  
   Every first-clear progression event atomically creates a `CampaignProgress` document and updates the `User` document (awarding 100 XP and 25 Drone Credits) inside a dedicated MongoDB replica-set transaction. Standalone non-transactional reward distribution is prohibited.

4. **Replay Invariant:**  
   Replaying a previously cleared level (`CampaignProgress` already exists for `{ user, levelId, campaignVersion }`) allows improving star ratings and recording attempts, but awards **0 additional XP and 0 additional Coins**.

---

## 2. Level Identifier & Progression Integrity

- **Stable Unique Identifiers:**  
  Sectors are identified by positive integers `1, 2, ..., N` (currently 24 sectors across 6 districts). Level IDs are permanent database foreign keys and must never be renumbered, reassigned, or shifted.
- **Sequential Unlock Chain:**  
  Level 1 is unlocked by default for all pilots. Every subsequent sector `k` strictly requires a verified `CampaignProgress` record for sector `k - 1` with matching `campaignVersion`.
- **Final Level Termination:**  
  The final sector (Sector 24, "The Singularity") must report `unlockedNext: false` upon victory. The application must not unlock nonexistent levels or wrap around.

---

## 3. Forward Compatibility & Campaign Expansion Policy

### Appending New Sectors (Backward Compatible)
- When expanding the campaign with additional sectors (e.g., Sectors 25–30):
  - New levels must be appended with monotonically increasing IDs (`id > 24`).
  - The campaign version **must remain `'v1'`**.
  - Appending levels is fully non-breaking: existing pilot accounts retain all completed sectors, accumulated XP, drone credits, best stars, and streaks.
  - A pilot who previously completed Sector 24 will automatically find Sector 25 unlocked upon campaign expansion without data loss or administrative migration.

### Modifying Existing Sectors (Breaking Changes)
- Once published and attempted by real learners, existing sector maps, spawn/goal coordinates, and tactical par goals are **immutable** within a campaign version.
- If a published sector must undergo breaking structural redesigns (e.g., redesigning the map layout, changing required items, or altering par ratings):
  - Do **not** silently overwrite the level definition under version `'v1'`, as doing so would invalidate the legitimacy of historical player attempts and star ratings.
  - A new campaign version identifier (e.g., `'v2'`) must be declared.
  - An explicit database migration script must be executed to either grandfather completed records or snapshot legacy records into an archive collection.
  - Bumping the campaign version without a migration is strictly prohibited, as it would re-lock all sectors for existing players or expose the database to duplicate currency exploits.

---

## 4. Advanced Sector Requirements & Authoritative Enforcement

Advanced sectors enforce tactical programming constraints:
- **Loop Requirement (`requireLoops: true`, Sectors 13–24):**  
  Must contain at least one `repeat` block that was **genuinely executed** during simulation (`executedLoops > 0`). Unused repeat blocks placed inside dead or unexecuted branches do not satisfy this requirement.
- **Sensor Requirement (`requireSensors: true`, Sectors 17–24):**  
  Must contain at least one `if` condition with a valid sensor (`wall`, `energy`, `hazard`, `terminal`, `guardian`) that was **genuinely evaluated** during simulation (`executedSensors > 0`).
- **Tactical Budgets (`maxBlocks`, `maxActions`):**  
  - `maxBlocks`: Upper bound on the total AST node count. Evaluated prior to execution.
  - `maxActions`: Upper bound on the simulation step count (`state.steps`). Monitored during frame stepping.
  - Violating either budget authoritatively halts clearance and returns actionable feedback to the learner.

---

## 5. Districts Taxonomy

| District ID | District Name | Sectors | Core Curriculum Focus | Max Boss HP |
|---|---|---|---|---|
| 1 | Neon Outskirts | 1–4 | Sequences, collection, turns & loops | 0 |
| 2 | Cipher District | 5–8 | Jumps, terminals, bridges & conditions | 0 |
| 3 | Firewall Core | 9–12 | Sensors, combined mechanics & guardian combat | 3 |
| 4 | Shadow Network | 13–16 | Longer routes, multiple objectives & advanced loops | 4 |
| 5 | Quantum Grid | 17–20 | Adaptive programs, sensor decisions & tight efficiency | 5 |
| 6 | Singularity | 21–24 | Expert combinations, demanding routes & final guardian | 8 |

