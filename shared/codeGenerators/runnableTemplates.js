import { generateJavaScript } from './languages/javascript.js';
import { generatePython } from './languages/python.js';
import { generateJava } from './languages/java.js';
import { generateCpp } from './languages/cpp.js';
import { generateC } from './languages/c.js';

/**
 * Default fallback level definition for standalone simulation when level is omitted.
 */
const DEFAULT_LEVEL = {
  id: 1,
  title: 'Boot Sequence',
  name: 'Boot Sequence',
  difficulty: 'Beginner',
  map: [
    '#######',
    '#S..G##',
    '#######'
  ],
  start: { x: 1, y: 1, direction: 0 },
  direction: 0,
  par: 3
};

/**
 * Normalizes level definition, dynamically resolving start coordinates and objectives.
 */
function resolveLevelMeta(level) {
  const lvl = level || DEFAULT_LEVEL;
  const map = lvl.map || DEFAULT_LEVEL.map;
  let startX = 1;
  let startY = 1;
  map.forEach((row, ry) => {
    [...row].forEach((char, rx) => {
      if (char === 'S') {
        startX = rx;
        startY = ry;
      }
    });
  });

  const title = lvl.title || lvl.name || 'Sector Mission';
  const id = lvl.id || 1;
  const direction = lvl.direction ?? lvl.start?.direction ?? 0;
  const par = lvl.par || 6;
  const hasBoss = map.some(row => row.includes('X'));
  const bossHP = hasBoss ? (lvl.bossHealth || 3) : 0;

  return {
    id,
    title,
    map,
    startX,
    startY,
    direction,
    par,
    bossHP
  };
}

/**
 * Builds standalone executable JavaScript console simulation.
 *
 * @param {Array<object>} ast
 * @param {object} level
 * @returns {string} Executable JS code
 */
export function buildJavaScriptRunnable(ast, level = DEFAULT_LEVEL) {
  const meta = resolveLevelMeta(level);
  const codeRes = generateJavaScript(ast, { includeHeader: false });
  const mapJson = JSON.stringify(meta.map);

  return `#!/usr/bin/env node
/**
 * CodeVerse Standalone Console Drone Simulation (JavaScript)
 * Sector: ${meta.id} - "${meta.title}"
 *
 * This standalone script simulates drone execution locally in your terminal.
 * It is completely independent from cloud servers and does not alter account progress.
 *
 * Requirements: Node.js 18+ (tested on Node.js v24)
 * Run: node drone_mission.js
 */

const LEVEL = {
  id: ${meta.id},
  title: ${JSON.stringify(meta.title)},
  map: ${mapJson},
  start: { x: ${meta.startX}, y: ${meta.startY}, direction: ${meta.direction} },
  par: ${meta.par},
  initialBossHP: ${meta.bossHP}
};

const DIRS = [
  { x: 1, y: 0, char: '>' },  // 0: East
  { x: 0, y: 1, char: 'v' },  // 1: South
  { x: -1, y: 0, char: '<' }, // 2: West
  { x: 0, y: -1, char: '^' }  // 3: North
];

class ConsoleDroneSimulator {
  constructor(lvl) {
    this.level = lvl;
    this.x = lvl.start.x;
    this.y = lvl.start.y;
    this.direction = lvl.start.direction;
    this.health = 3;
    this.collected = new Set();
    this.bridge = false;
    this.bossHP = lvl.initialBossHP;
    this.steps = 0;
    this.actionsCount = 0;
    this.crashed = false;
    this.crashReason = null;
    this.totalEnergy = lvl.map.join('').split('C').length - 1;
  }

  tile(x, y) {
    return this.level.map[y]?.[x] || '#';
  }

  ahead(dist = 1) {
    const d = DIRS[this.direction];
    return { x: this.x + d.x * dist, y: this.y + d.y * dist };
  }

  isBlocked(x, y) {
    const t = this.tile(x, y);
    return t === '#' || (t === 'B' && !this.bridge) || (t === 'X' && this.bossHP > 0);
  }

  sensor(name) {
    const a = this.ahead(1);
    switch (name) {
      case 'wall':
        return this.isBlocked(a.x, a.y);
      case 'energy':
        return this.tile(this.x, this.y) === 'C' && !this.collected.has(\`\${this.x},\${this.y}\`);
      case 'hazard':
        return this.tile(a.x, a.y) === 'H';
      case 'terminal':
        return this.tile(this.x, this.y) === 'T';
      case 'guardian':
        return this.tile(a.x, a.y) === 'X' && this.bossHP > 0;
      default:
        throw new Error(\`Unknown sensor: \${name}\`);
    }
  }

  recordAction(name) {
    this.actionsCount++;
    this.steps++;
    if (this.actionsCount > 150) {
      this.crashed = true;
      this.crashReason = 'Action limit exceeded (150 actions max).';
      throw new Error(this.crashReason);
    }
  }

  move() {
    if (this.crashed) return;
    this.recordAction('move');
    const a = this.ahead(1);
    const t = this.tile(a.x, a.y);
    if (this.isBlocked(a.x, a.y) || t === 'H') {
      this.crashed = true;
      this.health = Math.max(0, this.health - 1);
      this.crashReason = t === 'H' ? 'Breach corruption hit!' : 'Route blocked by wall barrier.';
      return;
    }
    this.x = a.x;
    this.y = a.y;
  }

  jump() {
    if (this.crashed) return;
    this.recordAction('jump');
    const a = this.ahead(2);
    const t = this.tile(a.x, a.y);
    if (this.isBlocked(a.x, a.y) || t === 'H') {
      this.crashed = true;
      this.health = Math.max(0, this.health - 1);
      this.crashReason = 'Jump landing site is blocked.';
      return;
    }
    this.x = a.x;
    this.y = a.y;
  }

  left() {
    if (this.crashed) return;
    this.recordAction('left');
    this.direction = (this.direction + 3) % 4;
  }

  right() {
    if (this.crashed) return;
    this.recordAction('right');
    this.direction = (this.direction + 1) % 4;
  }

  collect() {
    if (this.crashed) return;
    this.recordAction('collect');
    if (this.sensor('energy')) {
      this.collected.add(\`\${this.x},\${this.y}\`);
    }
  }

  activate() {
    if (this.crashed) return;
    this.recordAction('activate');
    if (this.sensor('terminal')) {
      this.bridge = true;
    }
  }

  pulse() {
    if (this.crashed) return;
    this.recordAction('pulse');
    for (let i = 1; i <= 3; i++) {
      const p = this.ahead(i);
      const t = this.tile(p.x, p.y);
      if (t === 'X' && this.bossHP > 0) {
        this.bossHP = Math.max(0, this.bossHP - 1);
        break;
      }
      if (t === '#' || t === 'H' || (t === 'B' && !this.bridge)) break;
    }
  }

  renderGrid() {
    const lines = [];
    for (let r = 0; r < this.level.map.length; r++) {
      let line = '';
      for (let c = 0; c < this.level.map[r].length; c++) {
        if (r === this.y && c === this.x) {
          line += this.crashed ? 'X' : DIRS[this.direction].char;
        } else if (this.collected.has(\`\${c},\${r}\`)) {
          line += '.';
        } else {
          line += this.level.map[r][c];
        }
      }
      lines.push(line);
    }
    return lines.join('\\n');
  }

  checkOutcome() {
    const atTarget = this.tile(this.x, this.y) === 'G';
    const allCollected = this.collected.size >= this.totalEnergy;
    const bossDown = this.bossHP === 0;
    const passed = !this.crashed && atTarget && allCollected && bossDown;
    return {
      passed,
      crashed: this.crashed,
      crashReason: this.crashReason,
      steps: this.steps,
      collected: this.collected.size,
      totalEnergy: this.totalEnergy
    };
  }
}

// ==========================================
// LEARNER PROGRAM ENTRY POINT
// ==========================================
function runLearnerProgram(drone) {
${codeRes.lines.map(line => '  ' + line).join('\n')}
}

// ==========================================
// SIMULATION RUNNER & REPORT
// ==========================================
function main() {
  console.log('='.repeat(55));
  console.log(\`  CodeVerse Drone Simulator | Sector \${LEVEL.id}: \${LEVEL.title}\`);
  console.log('='.repeat(55));

  const drone = new ConsoleDroneSimulator(LEVEL);
  console.log('\\nInitial Sector State:');
  console.log(drone.renderGrid());

  try {
    runLearnerProgram(drone);
  } catch (err) {
    if (!drone.crashed) {
      drone.crashed = true;
      drone.crashReason = err.message;
    }
  }

  console.log('\\nFinal Sector State:');
  console.log(drone.renderGrid());

  const outcome = drone.checkOutcome();
  console.log('\\n' + '-'.repeat(55));
  if (outcome.passed) {
    console.log(\`✅ MISSION PASSED! Drone reached target in \${outcome.steps} steps.\`);
    console.log(\`   Energy cells collected: \${outcome.collected} / \${outcome.totalEnergy}\`);
    let stars = 1;
    if (outcome.steps <= LEVEL.par) stars = 3;
    else if (outcome.steps <= LEVEL.par * 1.5) stars = 2;
    console.log(\`   Efficiency Rating: \${'★'.repeat(stars)}\${'☆'.repeat(3 - stars)}\`);
  } else {
    console.log(\`❌ MISSION FAILED: \${outcome.crashReason || 'Drone did not satisfy sector objectives.'}\`);
    console.log(\`   Final Position: (\${drone.x}, \${drone.y}) | Facing: \${DIRS[drone.direction].char}\`);
    console.log(\`   Energy: \${outcome.collected} / \${outcome.totalEnergy}\`);
  }
  console.log('-'.repeat(55) + '\\n');
}

main();
`;
}

/**
 * Builds standalone executable Python 3 console simulation.
 *
 * @param {Array<object>} ast
 * @param {object} level
 * @returns {string} Executable Python code
 */
export function buildPythonRunnable(ast, level = DEFAULT_LEVEL) {
  const meta = resolveLevelMeta(level);
  const codeRes = generatePython(ast, { includeHeader: false });
  const mapStr = JSON.stringify(meta.map);

  return `#!/usr/bin/env python3
"""
CodeVerse Standalone Console Drone Simulation (Python 3)
Sector: ${meta.id} - "${meta.title}"

This standalone script simulates drone execution locally in your terminal.
It reproduces canonical CodeVerse mechanics and does not alter cloud progress.

Requirements: Python 3.8+ (tested on Python 3.14)
Run: python drone_mission.py
"""

LEVEL = {
    "id": ${meta.id},
    "title": "${meta.title}",
    "map": ${mapStr},
    "start": {"x": ${meta.startX}, "y": ${meta.startY}, "direction": ${meta.direction}},
    "par": ${meta.par},
    "initial_boss_hp": ${meta.bossHP}
}

DIRS = [
    {"x": 1, "y": 0, "char": ">"},   # 0: East
    {"x": 0, "y": 1, "char": "v"},   # 1: South
    {"x": -1, "y": 0, "char": "<"},  # 2: West
    {"x": 0, "y": -1, "char": "^"}   # 3: North
]

class ConsoleDroneSimulator:
    def __init__(self, lvl):
        self.level = lvl
        self.x = lvl["start"]["x"]
        self.y = lvl["start"]["y"]
        self.direction = lvl["start"]["direction"]
        self.health = 3
        self.collected = set()
        self.bridge = False
        self.boss_hp = lvl["initial_boss_hp"]
        self.steps = 0
        self.actions_count = 0
        self.crashed = False
        self.crash_reason = None
        self.total_energy = sum(row.count("C") for row in lvl["map"])

    def tile(self, x, y):
        m = self.level["map"]
        if 0 <= y < len(m) and 0 <= x < len(m[y]):
            return m[y][x]
        return "#"

    def ahead(self, dist=1):
        d = DIRS[self.direction]
        return {"x": self.x + d["x"] * dist, "y": self.y + d["y"] * dist}

    def is_blocked(self, x, y):
        t = self.tile(x, y)
        return t == "#" or (t == "B" and not self.bridge) or (t == "X" and self.boss_hp > 0)

    def sensor(self, name):
        a = self.ahead(1)
        if name == "wall":
            return self.is_blocked(a["x"], a["y"])
        elif name == "energy":
            return self.tile(self.x, self.y) == "C" and (self.x, self.y) not in self.collected
        elif name == "hazard":
            return self.tile(a["x"], a["y"]) == "H"
        elif name == "terminal":
            return self.tile(self.x, self.y) == "T"
        elif name == "guardian":
            return self.tile(a["x"], a["y"]) == "X" and self.boss_hp > 0
        else:
            raise ValueError(f"Unknown sensor: {name}")

    def record_action(self, name):
        self.actions_count += 1
        self.steps += 1
        if self.actions_count > 150:
            self.crashed = True
            self.crash_reason = "Action limit exceeded (150 actions max)."
            raise RuntimeError(self.crash_reason)

    def move(self):
        if self.crashed:
            return
        self.record_action("move")
        a = self.ahead(1)
        t = self.tile(a["x"], a["y"])
        if self.is_blocked(a["x"], a["y"]) or t == "H":
            self.crashed = True
            self.health = max(0, self.health - 1)
            self.crash_reason = "Breach corruption hit!" if t == "H" else "Route blocked by wall barrier."
            return
        self.x = a["x"]
        self.y = a["y"]

    def jump(self):
        if self.crashed:
            return
        self.record_action("jump")
        a = self.ahead(2)
        t = self.tile(a["x"], a["y"])
        if self.is_blocked(a["x"], a["y"]) or t == "H":
            self.crashed = True
            self.health = max(0, self.health - 1)
            self.crash_reason = "Jump landing site is blocked."
            return
        self.x = a["x"]
        self.y = a["y"]

    def left(self):
        if self.crashed:
            return
        self.record_action("left")
        self.direction = (self.direction + 3) % 4

    def right(self):
        if self.crashed:
            return
        self.record_action("right")
        self.direction = (self.direction + 1) % 4

    def collect(self):
        if self.crashed:
            return
        self.record_action("collect")
        if self.sensor("energy"):
            self.collected.add((self.x, self.y))

    def activate(self):
        if self.crashed:
            return
        self.record_action("activate")
        if self.sensor("terminal"):
            self.bridge = True

    def pulse(self):
        if self.crashed:
            return
        self.record_action("pulse")
        for i in range(1, 4):
            p = self.ahead(i)
            t = self.tile(p["x"], p["y"])
            if t == "X" and self.boss_hp > 0:
                self.boss_hp = max(0, self.boss_hp - 1)
                break
            if t == "#" or t == "H" or (t == "B" and not self.bridge):
                break

    def render_grid(self):
        lines = []
        for r, row in enumerate(self.level["map"]):
            chars = []
            for c, ch in enumerate(row):
                if r == self.y and c == self.x:
                    chars.append("X" if self.crashed else DIRS[self.direction]["char"])
                elif (c, r) in self.collected:
                    chars.append(".")
                else:
                    chars.append(ch)
            lines.append("".join(chars))
        return "\\n".join(lines)

    def check_outcome(self):
        at_target = self.tile(self.x, self.y) == "G"
        all_collected = len(self.collected) >= self.total_energy
        boss_down = self.boss_hp == 0
        passed = not self.crashed and at_target and all_collected and boss_down
        return {
            "passed": passed,
            "crashed": self.crashed,
            "crash_reason": self.crash_reason,
            "steps": self.steps,
            "collected": len(self.collected),
            "total_energy": self.total_energy
        }

# ==========================================
# LEARNER PROGRAM ENTRY POINT
# ==========================================
def run_learner_program(drone):
${codeRes.lines.map(line => '    ' + line).join('\n')}

# ==========================================
# SIMULATION RUNNER & REPORT
# ==========================================
def main():
    print("=" * 55)
    print(f"  CodeVerse Drone Simulator | Sector {LEVEL['id']}: {LEVEL['title']}")
    print("=" * 55)

    drone = ConsoleDroneSimulator(LEVEL)
    print("\\nInitial Sector State:")
    print(drone.render_grid())

    try:
        run_learner_program(drone)
    except Exception as err:
        if not drone.crashed:
            drone.crashed = True
            drone.crash_reason = str(err)

    print("\\nFinal Sector State:")
    print(drone.render_grid())

    outcome = drone.check_outcome()
    print("\\n" + "-" * 55)
    if outcome["passed"]:
        print(f"✅ MISSION PASSED! Drone reached target in {outcome['steps']} steps.")
        print(f"   Energy cells collected: {outcome['collected']} / {outcome['total_energy']}")
        stars = 1
        if outcome["steps"] <= LEVEL["par"]:
            stars = 3
        elif outcome["steps"] <= LEVEL["par"] * 1.5:
            stars = 2
        print(f"   Efficiency Rating: {'★' * stars}{'☆' * (3 - stars)}")
    else:
        print(f"❌ MISSION FAILED: {outcome['crash_reason'] or 'Objectives not completed.'}")
        print(f"   Final Position: ({drone.x}, {drone.y}) | Facing: {DIRS[drone.direction]['char']}")
        print(f"   Energy: {outcome['collected']} / {outcome['total_energy']}")
    print("-" * 55 + "\\n")

if __name__ == "__main__":
    main()
`;
}

/**
 * Builds standalone Java console simulation class.
 *
 * @param {Array<object>} ast
 * @param {object} level
 * @returns {string} Java class file content
 */
export function buildJavaRunnable(ast, level = DEFAULT_LEVEL) {
  const meta = resolveLevelMeta(level);
  const codeRes = generateJava(ast, { includeHeader: false });
  const mapLines = meta.map.map(m => `        "${m}"`).join(',\n');

  return `/**
 * CodeVerse Standalone Console Drone Simulation (Java)
 * Sector: ${meta.id} - "${meta.title}"
 *
 * Requirements: JDK 11+
 * Compile & Run:
 *   javac DroneMission.java
 *   java DroneMission
 *
 * Verification Status Note:
 *   Not verified on host system (javac compiler not found in local PATH).
 */

import java.util.*;

public class DroneMission {
    public static final String[] MAP = {
${mapLines}
    };
    public static final int START_X = ${meta.startX};
    public static final int START_Y = ${meta.startY};
    public static final int START_DIR = ${meta.direction};

    public static class Drone {
        public int x = START_X;
        public int y = START_Y;
        public int dir = START_DIR;
        public int steps = 0;
        public boolean crashed = false;
        public String crashReason = "";
        public Set<String> collected = new HashSet<>();
        public boolean bridge = false;
        public int bossHP = ${meta.bossHP};

        private static final int[][] DIRS = {{1, 0}, {0, 1}, {-1, 0}, {0, -1}};

        public char tile(int tx, int ty) {
            if (ty >= 0 && ty < MAP.length && tx >= 0 && tx < MAP[ty].length()) {
                return MAP[ty].charAt(tx);
            }
            return '#';
        }

        public boolean sensor(String name) {
            int ax = x + DIRS[dir][0];
            int ay = y + DIRS[dir][1];
            char t = tile(ax, ay);
            switch (name) {
                case "wall": return t == '#' || (t == 'B' && !bridge) || (t == 'X' && bossHP > 0);
                case "energy": return tile(x, y) == 'C' && !collected.contains(x + "," + y);
                case "hazard": return t == 'H';
                case "terminal": return tile(x, y) == 'T';
                case "guardian": return t == 'X' && bossHP > 0;
                default: return false;
            }
        }

        public void move() {
            if (crashed) return;
            steps++;
            int nx = x + DIRS[dir][0];
            int ny = y + DIRS[dir][1];
            char t = tile(nx, ny);
            if (sensor("wall") || t == 'H') {
                crashed = true;
                crashReason = t == 'H' ? "Breach corruption hit!" : "Blocked by wall barrier.";
                return;
            }
            x = nx;
            y = ny;
        }

        public void jump() {
            if (crashed) return;
            steps++;
            int nx = x + DIRS[dir][0] * 2;
            int ny = y + DIRS[dir][1] * 2;
            char t = tile(nx, ny);
            if (t == '#' || (t == 'B' && !bridge) || t == 'H') {
                crashed = true;
                crashReason = "Jump landing site blocked.";
                return;
            }
            x = nx;
            y = ny;
        }

        public void left() {
            if (crashed) return;
            steps++;
            dir = (dir + 3) % 4;
        }

        public void right() {
            if (crashed) return;
            steps++;
            dir = (dir + 1) % 4;
        }

        public void collect() {
            if (crashed) return;
            steps++;
            if (sensor("energy")) collected.add(x + "," + y);
        }

        public void activate() {
            if (crashed) return;
            steps++;
            if (sensor("terminal")) bridge = true;
        }

        public void pulse() {
            if (crashed) return;
            steps++;
            for (int i = 1; i <= 3; i++) {
                int ax = x + DIRS[dir][0] * i;
                int ay = y + DIRS[dir][1] * i;
                char t = tile(ax, ay);
                if (t == 'X' && bossHP > 0) {
                    bossHP--;
                    break;
                }
                if (t == '#' || t == 'H' || (t == 'B' && !bridge)) break;
            }
        }
    }

    public static void runLearnerProgram(Drone drone) {
${codeRes.lines.map(line => '        ' + line).join('\n')}
    }

    public static void main(String[] args) {
        System.out.println("CodeVerse Drone Simulation (Java) | Sector: " + "${meta.title}");
        Drone drone = new Drone();
        try {
            runLearnerProgram(drone);
        } catch (Exception e) {
            drone.crashed = true;
            drone.crashReason = e.getMessage();
        }
        boolean passed = !drone.crashed && drone.tile(drone.x, drone.y) == 'G' && drone.bossHP == 0;
        System.out.println(passed ? "✅ MISSION PASSED in " + drone.steps + " steps." : "❌ MISSION FAILED: " + drone.crashReason);
    }
}
`;
}

/**
 * Builds standalone C++ console simulation.
 *
 * @param {Array<object>} ast
 * @param {object} level
 * @returns {string} C++ file content
 */
export function buildCppRunnable(ast, level = DEFAULT_LEVEL) {
  const meta = resolveLevelMeta(level);
  const codeRes = generateCpp(ast, { includeHeader: false });
  const mapLines = meta.map.map(m => `    "${m}"`).join(',\n');

  return `/**
 * CodeVerse Standalone Console Drone Simulation (C++)
 * Sector: ${meta.id} - "${meta.title}"
 *
 * Requirements: C++17 compliant compiler (GCC, Clang, MSVC)
 * Compile & Run:
 *   g++ -std=c++17 -O2 -o drone_mission drone_mission.cpp
 *   ./drone_mission
 *
 * Verification Status Note:
 *   Not verified on host system (g++ compiler not found in local PATH).
 */

#include <iostream>
#include <vector>
#include <string>
#include <set>

const std::vector<std::string> LEVEL_MAP = {
${mapLines}
};
const int START_X = ${meta.startX};
const int START_Y = ${meta.startY};
const int START_DIR = ${meta.direction};

const int DIRS[4][2] = {{1, 0}, {0, 1}, {-1, 0}, {0, -1}};

class Drone {
public:
    int x = START_X;
    int y = START_Y;
    int dir = START_DIR;
    int steps = 0;
    bool crashed = false;
    std::string crashReason = "";
    std::set<std::pair<int, int>> collected;
    bool bridge = false;
    int bossHP = ${meta.bossHP};

    char tile(int tx, int ty) const {
        if (ty >= 0 && ty < LEVEL_MAP.size() && tx >= 0 && tx < LEVEL_MAP[ty].size()) {
            return LEVEL_MAP[ty][tx];
        }
        return '#';
    }

    bool sensor(const std::string& name) const {
        int ax = x + DIRS[dir][0];
        int ay = y + DIRS[dir][1];
        char t = tile(ax, ay);
        if (name == "wall") return t == '#' || (t == 'B' && !bridge) || (t == 'X' && bossHP > 0);
        if (name == "energy") return tile(x, y) == 'C' && collected.find({x, y}) == collected.end();
        if (name == "hazard") return t == 'H';
        if (name == "terminal") return tile(x, y) == 'T';
        if (name == "guardian") return t == 'X' && bossHP > 0;
        return false;
    }

    void move() {
        if (crashed) return;
        steps++;
        int nx = x + DIRS[dir][0];
        int ny = y + DIRS[dir][1];
        char t = tile(nx, ny);
        if (sensor("wall") || t == 'H') {
            crashed = true;
            crashReason = (t == 'H') ? "Breach corruption hit!" : "Route blocked by wall barrier.";
            return;
        }
        x = nx;
        y = ny;
    }

    void jump() {
        if (crashed) return;
        steps++;
        int nx = x + DIRS[dir][0] * 2;
        int ny = y + DIRS[dir][1] * 2;
        char t = tile(nx, ny);
        if (t == '#' || (t == 'B' && !bridge) || t == 'H') {
            crashed = true;
            crashReason = "Jump landing site blocked.";
            return;
        }
        x = nx;
        y = ny;
    }

    void left() {
        if (crashed) return;
        steps++;
        dir = (dir + 3) % 4;
    }

    void right() {
        if (crashed) return;
        steps++;
        dir = (dir + 1) % 4;
    }

    void collect() {
        if (crashed) return;
        steps++;
        if (sensor("energy")) collected.insert({x, y});
    }

    void activate() {
        if (crashed) return;
        steps++;
        if (sensor("terminal")) bridge = true;
    }

    void pulse() {
        if (crashed) return;
        steps++;
        for (int i = 1; i <= 3; i++) {
            int ax = x + DIRS[dir][0] * i;
            int ay = y + DIRS[dir][1] * i;
            char t = tile(ax, ay);
            if (t == 'X' && bossHP > 0) {
                bossHP--;
                break;
            }
            if (t == '#' || t == 'H' || (t == 'B' && !bridge)) break;
        }
    }
};

void runLearnerProgram(Drone& drone) {
${codeRes.lines.map(line => '    ' + line).join('\n')}
}

int main() {
    std::cout << "CodeVerse Drone Simulation (C++) | Sector: ${meta.title}" << std::endl;
    Drone drone;
    runLearnerProgram(drone);
    bool passed = !drone.crashed && drone.tile(drone.x, drone.y) == 'G' && drone.bossHP == 0;
    if (passed) {
        std::cout << "✅ MISSION PASSED in " << drone.steps << " steps." << std::endl;
    } else {
        std::cout << "❌ MISSION FAILED: " << drone.crashReason << std::endl;
    }
    return 0;
}
`;
}

/**
 * Builds standalone C99 console simulation.
 *
 * @param {Array<object>} ast
 * @param {object} level
 * @returns {string} C file content
 */
export function buildCRunnable(ast, level = DEFAULT_LEVEL) {
  const meta = resolveLevelMeta(level);
  const codeRes = generateC(ast, { includeHeader: false });
  const mapLines = meta.map.map(m => `    "${m}"`).join(',\n');

  return `/**
 * CodeVerse Standalone Console Drone Simulation (C99)
 * Sector: ${meta.id} - "${meta.title}"
 *
 * Requirements: C99 compliant compiler (GCC, Clang)
 * Compile & Run:
 *   gcc -std=c99 -O2 -o drone_mission drone_mission.c
 *   ./drone_mission
 *
 * Verification Status Note:
 *   Not verified on host system (gcc compiler not found in local PATH).
 */

#include <stdio.h>
#include <string.h>
#include <stdbool.h>

static const char* LEVEL_MAP[] = {
${mapLines}
};
static const int MAP_ROWS = sizeof(LEVEL_MAP) / sizeof(LEVEL_MAP[0]);
static const int START_X = ${meta.startX};
static const int START_Y = ${meta.startY};
static const int START_DIR = ${meta.direction};

static const int DIRS[4][2] = {{1, 0}, {0, 1}, {-1, 0}, {0, -1}};

static int g_x = START_X;
static int g_y = START_Y;
static int g_dir = START_DIR;
static int g_steps = 0;
static bool g_crashed = false;
static char g_crash_reason[128] = "";
static bool g_bridge = false;
static int g_boss_hp = ${meta.bossHP};
static int g_collected = 0;

static char tile_at(int x, int y) {
    if (y >= 0 && y < MAP_ROWS && x >= 0 && x < (int)strlen(LEVEL_MAP[y])) {
        return LEVEL_MAP[y][x];
    }
    return '#';
}

int drone_sensor(const char* name) {
    int ax = g_x + DIRS[g_dir][0];
    int ay = g_y + DIRS[g_dir][1];
    char t = tile_at(ax, ay);
    if (strcmp(name, "wall") == 0) return t == '#' || (t == 'B' && !g_bridge) || (t == 'X' && g_boss_hp > 0);
    if (strcmp(name, "energy") == 0) return tile_at(g_x, g_y) == 'C';
    if (strcmp(name, "hazard") == 0) return t == 'H';
    if (strcmp(name, "terminal") == 0) return tile_at(g_x, g_y) == 'T';
    if (strcmp(name, "guardian") == 0) return t == 'X' && g_boss_hp > 0;
    return 0;
}

void drone_move(void) {
    if (g_crashed) return;
    g_steps++;
    int nx = g_x + DIRS[g_dir][0];
    int ny = g_y + DIRS[g_dir][1];
    char t = tile_at(nx, ny);
    if (drone_sensor("wall") || t == 'H') {
        g_crashed = true;
        snprintf(g_crash_reason, sizeof(g_crash_reason), t == 'H' ? "Breach corruption hit!" : "Blocked by wall.");
        return;
    }
    g_x = nx;
    g_y = ny;
}

void drone_jump(void) {
    if (g_crashed) return;
    g_steps++;
    int nx = g_x + DIRS[g_dir][0] * 2;
    int ny = g_y + DIRS[g_dir][1] * 2;
    char t = tile_at(nx, ny);
    if (t == '#' || (t == 'B' && !g_bridge) || t == 'H') {
        g_crashed = true;
        snprintf(g_crash_reason, sizeof(g_crash_reason), "Jump landing site blocked.");
        return;
    }
    g_x = nx;
    g_y = ny;
}

void drone_left(void) {
    if (g_crashed) return;
    g_steps++;
    g_dir = (g_dir + 3) % 4;
}

void drone_right(void) {
    if (g_crashed) return;
    g_steps++;
    g_dir = (g_dir + 1) % 4;
}

void drone_collect(void) {
    if (g_crashed) return;
    g_steps++;
    if (drone_sensor("energy")) g_collected++;
}

void drone_activate(void) {
    if (g_crashed) return;
    g_steps++;
    if (drone_sensor("terminal")) g_bridge = true;
}

void drone_pulse(void) {
    if (g_crashed) return;
    g_steps++;
    for (int i = 1; i <= 3; i++) {
        int ax = g_x + DIRS[g_dir][0] * i;
        int ay = g_y + DIRS[g_dir][1] * i;
        char t = tile_at(ax, ay);
        if (t == 'X' && g_boss_hp > 0) {
            g_boss_hp--;
            break;
        }
        if (t == '#' || t == 'H' || (t == 'B' && !g_bridge)) break;
    }
}

void run_learner_program(void) {
${codeRes.lines.map(line => '    ' + line).join('\n')}
}

int main(void) {
    printf("CodeVerse Drone Simulation (C99) | Sector: %s\\n", "${meta.title}");
    run_learner_program();
    bool passed = !g_crashed && tile_at(g_x, g_y) == 'G' && g_boss_hp == 0;
    if (passed) {
        printf("✅ MISSION PASSED in %d steps.\\n", g_steps);
    } else {
        printf("❌ MISSION FAILED: %s\\n", g_crash_reason);
    }
    return 0;
}
`;
}

/**
 * Builds a clear README.md for runnable exports documenting commands and verification status.
 *
 * @param {object} level
 * @returns {string} Markdown text
 */
export function buildExportReadme(level = DEFAULT_LEVEL) {
  const meta = resolveLevelMeta(level);
  return `# CodeVerse Standalone Mission Simulation
**Sector ${meta.id}: ${meta.title}**

This package allows you to run your CodeVerse drone program locally in your terminal. It includes standalone console simulators that replicate the canonical CodeVerse game engine.

> **Note:** Running exports locally in your terminal does not modify your cloud player progress or award campaign stars. It serves as an educational bridge from visual blocks to real programming languages.

---

## Supported Languages & Execution Instructions

### 1. JavaScript (\`drone_mission.js\`)
- **Status:** ✅ **Verified Runnable** (tested on Node.js v24.11.1)
- **Prerequisite:** [Node.js](https://nodejs.org/) (v18+)
- **Execution Command:**
  \`\`\`bash
  node drone_mission.js
  \`\`\`

### 2. Python (\`drone_mission.py\`)
- **Status:** ✅ **Verified Runnable** (tested on Python 3.14.0)
- **Prerequisite:** [Python 3](https://www.python.org/) (3.8+)
- **Execution Command:**
  \`\`\`bash
  python drone_mission.py
  \`\`\`

### 3. Java (\`DroneMission.java\`)
- **Status:** ⚠️ **Compiler Required** (javac not detected in host test environment)
- **Prerequisite:** [Java JDK 11+](https://adoptium.net/)
- **Compile & Run:**
  \`\`\`bash
  javac DroneMission.java
  java DroneMission
  \`\`\`

### 4. C++ (\`drone_mission.cpp\`)
- **Status:** ⚠️ **Compiler Required** (g++ not detected in host test environment)
- **Prerequisite:** C++17 compiler (GCC, Clang, or MSVC)
- **Compile & Run:**
  \`\`\`bash
  g++ -std=c++17 -O2 -o drone_mission drone_mission.cpp
  ./drone_mission
  \`\`\`

### 5. C (\`drone_mission.c\`)
- **Status:** ⚠️ **Compiler Required** (gcc not detected in host test environment)
- **Prerequisite:** C99 compiler (GCC or Clang)
- **Compile & Run:**
  \`\`\`bash
  gcc -std=c99 -O2 -o drone_mission drone_mission.c
  ./drone_mission
  \`\`\`

---

## CodeVerse API Reference

- \`drone.move()\` / \`drone_move()\`: Advance 1 step forward.
- \`drone.left()\` / \`drone_left()\`: Turn 90° counter-clockwise.
- \`drone.right()\` / \`drone_right()\`: Turn 90° clockwise.
- \`drone.jump()\` / \`drone_jump()\`: Jump 2 steps forward over hazards.
- \`drone.collect()\` / \`drone_collect()\`: Harvest energy canister on current tile.
- \`drone.activate()\` / \`drone_activate()\`: Trigger data terminal to bridge gaps.
- \`drone.pulse()\` / \`drone_pulse()\`: Fire EMP blast at cyber guardian ahead.
- \`drone.sensor("name")\` / \`drone_sensor("name")\`: Query sensors (\`"wall"\`, \`"energy"\`, \`"hazard"\`, \`"terminal"\`, \`"guardian"\`).
`;
}
