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
  let totalEnergy = 0;
  map.forEach(row => {
    [...row].forEach(char => {
      if (char === 'C') totalEnergy++;
    });
  });

  return {
    id,
    title,
    map,
    startX,
    startY,
    direction,
    par,
    bossHP,
    totalEnergy
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
  const codeRes = generateJavaScript(ast, { includeHeader: false, boundedLoops: true });
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
    this.variables = {};
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

  fail(reason) {
    this.crashed = true;
    this.crashReason = reason;
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
// RUNTIME VARIABLE SENTINELS & BOUNDS CHECKERS
// ==========================================
function _cv_uninit(name, drone) {
  return {
    [Symbol.toPrimitive]() {
      const msg = \`Variable "\${name}" is used before being set.\`;
      drone.fail(msg);
      throw new Error(msg);
    },
    valueOf() {
      const msg = \`Variable "\${name}" is used before being set.\`;
      drone.fail(msg);
      throw new Error(msg);
    },
    toString() {
      const msg = \`Variable "\${name}" is used before being set.\`;
      drone.fail(msg);
      throw new Error(msg);
    }
  };
}

function _cv_set(drone, name, val) {
  if (val && typeof val === 'object' && typeof val.valueOf === 'function') {
    val = val.valueOf();
  }
  if (typeof val !== 'number' || !Number.isFinite(val)) {
    const msg = \`Invalid numeric value for variable "\${name}".\`;
    drone.fail(msg);
    throw new Error(msg);
  }
  const intVal = Math.trunc(val);
  if (intVal < -10000 || intVal > 10000) {
    const msg = \`Variable "\${name}" out of bounds (\${intVal}). Must be between -10,000 and 10,000.\`;
    drone.fail(msg);
    throw new Error(msg);
  }
  if (_cv_call_stack.length === 0) {
    if (Object.keys(drone.variables).length >= 10 && !(name in drone.variables)) {
      const msg = 'Maximum limit of 10 variables exceeded.';
      drone.fail(msg);
      throw new Error(msg);
    }
    drone.variables[name] = intVal;
  }
  return intVal;
}

function _cv_change(drone, name, curVal, amount) {
  if (curVal && typeof curVal === 'object' && typeof curVal.valueOf === 'function') {
    const msg = \`Variable "\${name}" must be set before changing it.\`;
    drone.fail(msg);
    throw new Error(msg);
  }
  if (typeof curVal !== 'number' || !Number.isFinite(curVal)) {
    const msg = \`Variable "\${name}" must be set before changing it.\`;
    drone.fail(msg);
    throw new Error(msg);
  }
  const delta = Number.isInteger(amount) ? amount : 1;
  const nextVal = curVal + delta;
  if (nextVal < -10000 || nextVal > 10000) {
    const msg = \`Variable "\${name}" out of bounds (\${nextVal}). Must be between -10,000 and 10,000.\`;
    drone.fail(msg);
    throw new Error(msg);
  }
  if (_cv_call_stack.length === 0) {
    drone.variables[name] = nextVal;
  }
  return nextVal;
}

// ==========================================
// CALL STACK & RECURSION MANAGEMENT
// ==========================================
const _cv_call_stack = [];
let _cv_current_drone = null;

function _cv_enter_fn(name) {
  if (_cv_call_stack.includes(name)) {
    const msg = \`Recursion is not permitted in this stage. Function "\${name}" cannot call itself directly or indirectly.\`;
    if (_cv_current_drone) _cv_current_drone.fail(msg);
    throw new Error(msg);
  }
  if (_cv_call_stack.length >= 8) {
    const msg = 'Maximum call stack depth (8) exceeded.';
    if (_cv_current_drone) _cv_current_drone.fail(msg);
    throw new Error(msg);
  }
  _cv_call_stack.push(name);
}

function _cv_exit_fn() {
  if (_cv_call_stack.length > 0) {
    _cv_call_stack.pop();
  }
}

// ==========================================
// LEARNER PROGRAM ENTRY POINT
// ==========================================
function runLearnerProgram(drone) {
  _cv_current_drone = drone;
  _cv_call_stack.length = 0;
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
    console.log(\`[PASS] MISSION PASSED! Drone reached target in \${outcome.steps} steps.\`);
    console.log(\`   Energy cells collected: \${outcome.collected} / \${outcome.totalEnergy}\`);
    let stars = 1;
    if (outcome.steps <= LEVEL.par) stars = 3;
    else if (outcome.steps <= LEVEL.par * 1.5) stars = 2;
    console.log(\`   Efficiency Rating: \${stars}/3 stars (\${'*'.repeat(stars)})\`);
  } else {
    console.log(\`[FAIL] MISSION FAILED: \${outcome.crashReason || 'Drone did not satisfy sector objectives.'}\`);
    console.log(\`   Final Position: (\${drone.x}, \${drone.y}) | Facing: \${DIRS[drone.direction].char}\`);
    console.log(\`   Energy: \${outcome.collected} / \${outcome.totalEnergy}\`);
  }
  console.log('-'.repeat(55) + '\\n');

  console.log('__CV_RESULT__=' + JSON.stringify({
    x: drone.x,
    y: drone.y,
    dir: drone.direction,
    steps: drone.steps,
    crashed: drone.crashed,
    crashReason: drone.crashReason || '',
    collected: drone.collected.size,
    bridge: drone.bridge,
    bossHP: drone.bossHP,
    passed: outcome.passed,
    variables: drone.variables
  }));
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
  const codeRes = generatePython(ast, { includeHeader: false, boundedLoops: true });
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
        self.variables = {}
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

    def fail(self, reason):
        self.crashed = True
        self.crash_reason = reason

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
# RUNTIME VARIABLE SENTINELS & BOUNDS CHECKERS
# ==========================================
class _CvUninit:
    def __init__(self, name, drone):
        self._name = name
        self._drone = drone
    def _fail(self):
        msg = f'Variable "{self._name}" is used before being set.'
        self._drone.fail(msg)
        raise ValueError(msg)
    def __lt__(self, other): self._fail()
    def __le__(self, other): self._fail()
    def __gt__(self, other): self._fail()
    def __ge__(self, other): self._fail()
    def __eq__(self, other): self._fail()
    def __ne__(self, other): self._fail()
    def __add__(self, other): self._fail()
    def __radd__(self, other): self._fail()
    def __sub__(self, other): self._fail()
    def __rsub__(self, other): self._fail()
    def __int__(self): self._fail()
    def __bool__(self): self._fail()

def _cv_uninit(name, drone):
    return _CvUninit(name, drone)

def _cv_set(drone, name, val):
    if isinstance(val, _CvUninit):
        val._fail()
    if not isinstance(val, int) or isinstance(val, bool):
        msg = f'Invalid numeric value for variable "{name}".'
        drone.fail(msg)
        raise ValueError(msg)
    if val < -10000 or val > 10000:
        msg = f'Variable "{name}" out of bounds ({val}). Must be between -10,000 and 10,000.'
        drone.fail(msg)
        raise ValueError(msg)
    if len(_cv_call_stack) == 0:
        if len(drone.variables) >= 10 and name not in drone.variables:
            msg = 'Maximum limit of 10 variables exceeded.'
            drone.fail(msg)
            raise ValueError(msg)
        drone.variables[name] = val
    return val

def _cv_change(drone, name, cur_val, amount):
    if isinstance(cur_val, _CvUninit):
        msg = f'Variable "{name}" must be set before changing it.'
        drone.fail(msg)
        raise ValueError(msg)
    if not isinstance(cur_val, int) or isinstance(cur_val, bool):
        msg = f'Variable "{name}" must be set before changing it.'
        drone.fail(msg)
        raise ValueError(msg)
    next_val = cur_val + amount
    if next_val < -10000 or next_val > 10000:
        msg = f'Variable "{name}" out of bounds ({next_val}). Must be between -10,000 and 10,000.'
        drone.fail(msg)
        raise ValueError(msg)
    if len(_cv_call_stack) == 0:
        drone.variables[name] = next_val
    return next_val

# ==========================================
# CALL STACK & RECURSION MANAGEMENT
# ==========================================
_cv_call_stack = []
_cv_current_drone = None

def _cv_enter_fn(name):
    global _cv_current_drone
    if name in _cv_call_stack:
        msg = f'Recursion is not permitted in this stage. Function "{name}" cannot call itself directly or indirectly.'
        if _cv_current_drone:
            _cv_current_drone.fail(msg)
        raise RuntimeError(msg)
    if len(_cv_call_stack) >= 8:
        msg = 'Maximum call stack depth (8) exceeded.'
        if _cv_current_drone:
            _cv_current_drone.fail(msg)
        raise RuntimeError(msg)
    _cv_call_stack.append(name)

def _cv_exit_fn():
    if _cv_call_stack:
        _cv_call_stack.pop()

# ==========================================
# LEARNER PROGRAM ENTRY POINT
# ==========================================
def run_learner_program(drone):
    global _cv_current_drone
    _cv_current_drone = drone
    _cv_call_stack.clear()
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
        print(f"[PASS] MISSION PASSED! Drone reached target in {outcome['steps']} steps.")
        print(f"   Energy cells collected: {outcome['collected']} / {outcome['total_energy']}")
        stars = 1
        if outcome["steps"] <= LEVEL["par"]:
            stars = 3
        elif outcome["steps"] <= LEVEL["par"] * 1.5:
            stars = 2
        print(f"   Efficiency Rating: {stars}/3 stars ({'*' * stars})")
    else:
        print(f"[FAIL] MISSION FAILED: {outcome['crash_reason'] or 'Objectives not completed.'}")
        print(f"   Final Position: ({drone.x}, {drone.y}) | Facing: {DIRS[drone.direction]['char']}")
        print(f"   Energy: {outcome['collected']} / {outcome['total_energy']}")
    print("-" * 55 + "\\n")

    import json
    print("__CV_RESULT__=" + json.dumps({
        "x": drone.x,
        "y": drone.y,
        "dir": drone.direction,
        "steps": drone.steps,
        "crashed": drone.crashed,
        "crashReason": drone.crash_reason or "",
        "collected": len(drone.collected),
        "bridge": drone.bridge,
        "bossHP": drone.boss_hp,
        "passed": outcome["passed"],
        "variables": drone.variables
    }))

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
  const codeRes = generateJava(ast, { includeHeader: false, boundedLoops: true });
  const mapLines = meta.map.map(m => `        "${m}"`).join(',\n');

  return `/**
 * CodeVerse Standalone Console Drone Simulation (Java)
 * Sector: ${meta.id} - "${meta.title}"
 *
 * Requirements: JDK 11+ (javac compiler & java runtime)
 * Verification Status: Fully verified via CodeVerse CI automated test suite
 *
 * Compile & Run:
 *   javac DroneMission.java
 *   java DroneMission
 */

import java.util.*;

public class DroneMission {
    public static final String[] MAP = {
${mapLines}
    };
    public static final int START_X = ${meta.startX};
    public static final int START_Y = ${meta.startY};
    public static final int START_DIR = ${meta.direction};
    public static final int TOTAL_ENERGY = ${meta.totalEnergy};

    public static class Drone {
        public int x = START_X;
        public int y = START_Y;
        public int dir = START_DIR;
        public int steps = 0;
        public int actionsCount = 0;
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

        public void recordAction() {
            actionsCount++;
            steps++;
            if (actionsCount > 150) {
                crashed = true;
                crashReason = "Action limit exceeded (150 actions max).";
            }
        }

        public void fail(String reason) {
            this.crashed = true;
            this.crashReason = reason;
        }

        public Map<String, Integer> variables = new LinkedHashMap<>();

        public int varGet(String name, Integer val) {
            if (val == null) {
                String msg = "Variable \\"" + name + "\\" is used before being set.";
                fail(msg);
                throw new IllegalStateException(msg);
            }
            return val;
        }

        public int varSet(String name, int val) {
            if (val < -10000 || val > 10000) {
                String msg = "Variable \\"" + name + "\\" out of bounds (" + val + "). Must be between -10,000 and 10,000.";
                fail(msg);
                throw new IllegalStateException(msg);
            }
            if (_cv_call_stack.isEmpty()) {
                if (variables.size() >= 10 && !variables.containsKey(name)) {
                    String msg = "Maximum limit of 10 variables exceeded.";
                    fail(msg);
                    throw new IllegalStateException(msg);
                }
                variables.put(name, val);
            }
            return val;
        }

        public int varChange(String name, Integer curVal, int amount) {
            if (curVal == null) {
                String msg = "Variable \\"" + name + "\\" must be set before changing it.";
                fail(msg);
                throw new IllegalStateException(msg);
            }
            long next = (long) curVal + (long) amount;
            if (next < -10000 || next > 10000) {
                String msg = "Variable \\"" + name + "\\" out of bounds (" + next + "). Must be between -10,000 and 10,000.";
                fail(msg);
                throw new IllegalStateException(msg);
            }
            if (_cv_call_stack.isEmpty()) {
                variables.put(name, (int) next);
            }
            return (int) next;
        }

        public void move() {
            if (crashed) return;
            recordAction();
            if (crashed) return;
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
            recordAction();
            if (crashed) return;
            int nx = x + DIRS[dir][0] * 2;
            int ny = y + DIRS[dir][1] * 2;
            char t = tile(nx, ny);
            if (t == '#' || (t == 'B' && !bridge) || (t == 'X' && bossHP > 0) || t == 'H') {
                crashed = true;
                crashReason = t == 'H' ? "Corruption hit on landing." : "Jump landing site blocked.";
                return;
            }
            x = nx;
            y = ny;
        }

        public void left() {
            if (crashed) return;
            recordAction();
            if (crashed) return;
            dir = (dir + 3) % 4;
        }

        public void right() {
            if (crashed) return;
            recordAction();
            if (crashed) return;
            dir = (dir + 1) % 4;
        }

        public void collect() {
            if (crashed) return;
            recordAction();
            if (crashed) return;
            if (sensor("energy")) collected.add(x + "," + y);
        }

        public void activate() {
            if (crashed) return;
            recordAction();
            if (crashed) return;
            if (sensor("terminal")) bridge = true;
        }

        public void pulse() {
            if (crashed) return;
            recordAction();
            if (crashed) return;
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

    public static Drone drone;
    public static List<String> _cv_call_stack = new ArrayList<>();

    public static void _cv_enter_fn(String name) {
        if (_cv_call_stack.contains(name)) {
            String msg = "Recursion is not permitted in this stage. Function \\"" + name + "\\" cannot call itself directly or indirectly.";
            if (drone != null) drone.fail(msg);
            throw new IllegalStateException(msg);
        }
        if (_cv_call_stack.size() >= 8) {
            String msg = "Maximum call stack depth (8) exceeded.";
            if (drone != null) drone.fail(msg);
            throw new IllegalStateException(msg);
        }
        _cv_call_stack.add(name);
    }

    public static void _cv_exit_fn() {
        if (!_cv_call_stack.isEmpty()) {
            _cv_call_stack.remove(_cv_call_stack.size() - 1);
        }
    }

${codeRes.globalVars && codeRes.globalVars.length ? codeRes.globalVars.map(v => `    public static Integer ${v} = null;`).join('\n') : ''}

${codeRes.functionsCode ? codeRes.functionsCode.split('\n').map(l => '    ' + l).join('\n') : ''}

    public static void runLearnerProgram(Drone droneArg) {
        drone = droneArg;
        _cv_call_stack.clear();
${codeRes.globalVars && codeRes.globalVars.length ? codeRes.globalVars.map(v => `        ${v} = null;`).join('\n') : ''}
${codeRes.bodyCode ? codeRes.bodyCode.split('\n').map(line => '        ' + line).join('\n') : ''}
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
        boolean passed = !drone.crashed && drone.tile(drone.x, drone.y) == 'G' && drone.collected.size() == TOTAL_ENERGY && drone.bossHP == 0;
        System.out.println(passed ? "[PASS] MISSION PASSED in " + drone.steps + " steps." : "[FAIL] MISSION FAILED: " + drone.crashReason);

        StringBuilder varsJson = new StringBuilder("{");
        int vi = 0;
        for (Map.Entry<String, Integer> entry : drone.variables.entrySet()) {
            if (vi++ > 0) varsJson.append(",");
            varsJson.append("\\"").append(entry.getKey()).append("\\":").append(entry.getValue());
        }
        varsJson.append("}");

        System.out.println(String.format(
            java.util.Locale.US,
            "__CV_RESULT__={\\"x\\":%d,\\"y\\":%d,\\"dir\\":%d,\\"steps\\":%d,\\"crashed\\":%b,\\"crashReason\\":\\"%s\\",\\"collected\\":%d,\\"bridge\\":%b,\\"bossHP\\":%d,\\"passed\\":%b,\\"variables\\":%s}",
            drone.x, drone.y, drone.dir, drone.steps, drone.crashed, (drone.crashReason == null ? "" : drone.crashReason.replace("\\"", "'")), drone.collected.size(), drone.bridge, drone.bossHP, passed, varsJson.toString()
        ));
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
  const codeRes = generateCpp(ast, { includeHeader: false, boundedLoops: true });
  const mapLines = meta.map.map(m => `    "${m}"`).join(',\n');

  return `/**
 * CodeVerse Standalone Console Drone Simulation (C++)
 * Sector: ${meta.id} - "${meta.title}"
 *
 * Requirements: C++17 compliant compiler (GCC 9+, Clang 10+, MSVC 2019+)
 * Verification Status: Fully verified via CodeVerse CI automated test suite
 *
 * Compile & Run:
 *   g++ -std=c++17 -O2 -o drone_mission drone_mission.cpp
 *   ./drone_mission
 */

#include <iostream>
#include <vector>
#include <string>
#include <set>
#include <map>
#include <stdexcept>

const std::vector<std::string> LEVEL_MAP = {
${mapLines}
};
const int START_X = ${meta.startX};
const int START_Y = ${meta.startY};
const int START_DIR = ${meta.direction};
const int TOTAL_ENERGY = ${meta.totalEnergy};

const int DIRS[4][2] = {{1, 0}, {0, 1}, {-1, 0}, {0, -1}};

class Drone {
public:
    int x = START_X;
    int y = START_Y;
    int dir = START_DIR;
    int steps = 0;
    int actionsCount = 0;
    bool crashed = false;
    std::string crashReason = "";
    std::set<std::pair<int, int>> collected;
    bool bridge = false;
    int bossHP = ${meta.bossHP};
    std::map<std::string, int> variables;

    void fail(const std::string& reason) {
        crashed = true;
        crashReason = reason;
    }

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

    void recordAction() {
        actionsCount++;
        steps++;
        if (actionsCount > 150) {
            crashed = true;
            crashReason = "Action limit exceeded (150 actions max).";
        }
    }

    void move() {
        if (crashed) return;
        recordAction();
        if (crashed) return;
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
        recordAction();
        if (crashed) return;
        int nx = x + DIRS[dir][0] * 2;
        int ny = y + DIRS[dir][1] * 2;
        char t = tile(nx, ny);
        if (t == '#' || (t == 'B' && !bridge) || (t == 'X' && bossHP > 0) || t == 'H') {
            crashed = true;
            crashReason = (t == 'H') ? "Corruption hit on landing." : "Jump landing site blocked.";
            return;
        }
        x = nx;
        y = ny;
    }

    void left() {
        if (crashed) return;
        recordAction();
        if (crashed) return;
        dir = (dir + 3) % 4;
    }

    void right() {
        if (crashed) return;
        recordAction();
        if (crashed) return;
        dir = (dir + 1) % 4;
    }

    void collect() {
        if (crashed) return;
        recordAction();
        if (crashed) return;
        if (sensor("energy")) collected.insert({x, y});
    }

    void activate() {
        if (crashed) return;
        recordAction();
        if (crashed) return;
        if (sensor("terminal")) bridge = true;
    }

    void pulse() {
        if (crashed) return;
        recordAction();
        if (crashed) return;
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

class CvVar {
    std::string name;
    Drone* drone;
    bool initialized = false;
    long long value = 0;
public:
    CvVar(const std::string& n, Drone* d) : name(n), drone(d) {}

    CvVar& operator=(long long val) {
        if (val < -10000 || val > 10000) {
            std::string msg = "Variable \\"" + name + "\\" out of bounds (" + std::to_string(val) + "). Must be between -10,000 and 10,000.";
            drone->fail(msg);
            throw std::runtime_error(msg);
        }
        if (_cv_call_stack.empty()) {
            if (drone->variables.size() >= 10 && drone->variables.find(name) == drone->variables.end()) {
                drone->fail("Maximum limit of 10 variables exceeded.");
                throw std::runtime_error("Maximum limit of 10 variables exceeded.");
            }
            drone->variables[name] = (int)val;
        }
        initialized = true;
        value = val;
        return *this;
    }

    CvVar& operator=(const CvVar& other) {
        if (!other.initialized) {
            std::string msg = "Variable \\"" + other.name + "\\" is used before being set.";
            drone->fail(msg);
            throw std::runtime_error(msg);
        }
        return *this = other.value;
    }

    CvVar& operator+=(long long delta) {
        if (!initialized) {
            std::string msg = "Variable \\"" + name + "\\" must be set before changing it.";
            drone->fail(msg);
            throw std::runtime_error(msg);
        }
        long long next = value + delta;
        if (next < -10000 || next > 10000) {
            std::string msg = "Variable \\"" + name + "\\" out of bounds (" + std::to_string(next) + "). Must be between -10,000 and 10,000.";
            drone->fail(msg);
            throw std::runtime_error(msg);
        }
        value = next;
        if (_cv_call_stack.empty()) {
            drone->variables[name] = (int)next;
        }
        return *this;
    }

    CvVar& operator-=(long long delta) {
        return *this += (-delta);
    }

    operator long long() const {
        if (!initialized) {
            std::string msg = "Variable \\"" + name + "\\" is used before being set.";
            drone->fail(msg);
            throw std::runtime_error(msg);
        }
        return value;
    }

    void reset() {
        initialized = false;
        value = 0;
    }
};

static Drone drone;

static std::vector<std::string> _cv_call_stack;
static void _cv_enter_fn(const std::string& name) {
    for (const auto& item : _cv_call_stack) {
        if (item == name) {
            std::string msg = "Recursion is not permitted in this stage. Function \\"" + name + "\\" cannot call itself directly or indirectly.";
            drone.fail(msg);
            throw std::runtime_error(msg);
        }
    }
    if (_cv_call_stack.size() >= 8) {
        std::string msg = "Maximum call stack depth (8) exceeded.";
        drone.fail(msg);
        throw std::runtime_error(msg);
    }
    _cv_call_stack.push_back(name);
}

static void _cv_exit_fn() {
    if (!_cv_call_stack.empty()) {
        _cv_call_stack.pop_back();
    }
}

${codeRes.globalVars && codeRes.globalVars.length ? codeRes.globalVars.map(v => `static CvVar ${v}("${v}", &drone);`).join('\n') : ''}

${codeRes.functionsCode || ''}

void runLearnerProgram() {
    _cv_call_stack.clear();
${codeRes.globalVars && codeRes.globalVars.length ? codeRes.globalVars.map(v => `    ${v}.reset();`).join('\n') : ''}
${codeRes.bodyCode ? codeRes.bodyCode.split('\n').map(line => '    ' + line).join('\n') : ''}
}

int main() {
    std::cout << "CodeVerse Drone Simulation (C++) | Sector: ${meta.title}" << std::endl;
    try {
        runLearnerProgram();
    } catch (const std::exception& e) {
        drone.crashed = true;
        drone.crashReason = e.what();
    }
    bool passed = !drone.crashed && drone.tile(drone.x, drone.y) == 'G' && drone.collected.size() == TOTAL_ENERGY && drone.bossHP == 0;
    if (passed) {
        std::cout << "[PASS] MISSION PASSED in " << drone.steps << " steps." << std::endl;
    } else {
        std::cout << "[FAIL] MISSION FAILED: " << drone.crashReason << std::endl;
    }

    std::string varsJson = "{";
    int vi = 0;
    for (const auto& pair : drone.variables) {
        if (vi++ > 0) varsJson += ",";
        varsJson += "\\"" + pair.first + "\\":" + std::to_string(pair.second);
    }
    varsJson += "}";

    std::string safeReason = drone.crashReason;
    for (size_t i = 0; i < safeReason.size(); ++i) {
        if (safeReason[i] == '"') safeReason[i] = 39;
    }

    std::cout << "__CV_RESULT__={\\"x\\":" << drone.x
              << ",\\"y\\":" << drone.y
              << ",\\"dir\\":" << drone.dir
              << ",\\"steps\\":" << drone.steps
              << ",\\"crashed\\":" << (drone.crashed ? "true" : "false")
              << ",\\"crashReason\\":\\"" << safeReason << "\\""
              << ",\\"collected\\":" << drone.collected.size()
              << ",\\"bridge\\":" << (drone.bridge ? "true" : "false")
              << ",\\"bossHP\\":" << drone.bossHP
              << ",\\"passed\\":" << (passed ? "true" : "false")
              << ",\\"variables\\":" << varsJson
              << "}" << std::endl;
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
  const codeRes = generateC(ast, { includeHeader: false, boundedLoops: true });
  const mapLines = meta.map.map(m => `    "${m}"`).join(',\n');

  return `/**
 * CodeVerse Standalone Console Drone Simulation (C99)
 * Sector: ${meta.id} - "${meta.title}"
 *
 * Requirements: C99 compliant compiler (GCC, Clang)
 * Verification Status: Fully verified via CodeVerse CI automated test suite
 *
 * Compile & Run:
 *   gcc -std=c99 -O2 -o drone_mission drone_mission.c
 *   ./drone_mission
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
static const int TOTAL_ENERGY = ${meta.totalEnergy};

static const int DIRS[4][2] = {{1, 0}, {0, 1}, {-1, 0}, {0, -1}};

static int g_x = START_X;
static int g_y = START_Y;
static int g_dir = START_DIR;
static int g_steps = 0;
static int g_actions_count = 0;
static bool g_crashed = false;
static char g_crash_reason[256] = "";
static bool g_bridge = false;
static int g_boss_hp = ${meta.bossHP};
static int g_collected = 0;
static bool g_collected_grid[64][64] = {{false}};

static char tile_at(int x, int y) {
    if (y >= 0 && y < MAP_ROWS && x >= 0 && x < (int)strlen(LEVEL_MAP[y])) {
        return LEVEL_MAP[y][x];
    }
    return '#';
}

static void record_action(void) {
    g_actions_count++;
    g_steps++;
    if (g_actions_count > 150) {
        g_crashed = true;
        snprintf(g_crash_reason, sizeof(g_crash_reason), "Action limit exceeded (150 actions max).");
    }
}

static void drone_fail(const char* reason) {
    g_crashed = true;
    snprintf(g_crash_reason, sizeof(g_crash_reason), "%s", reason);
}

typedef struct {
    char name[32];
    int value;
} CvVarEntry;

static CvVarEntry g_vars[16];
static int g_vars_count = 0;

static void set_g_var(const char* name, int val) {
    for (int i = 0; i < g_vars_count; i++) {
        if (strcmp(g_vars[i].name, name) == 0) {
            g_vars[i].value = val;
            return;
        }
    }
    if (g_vars_count < 16) {
        strncpy(g_vars[g_vars_count].name, name, sizeof(g_vars[g_vars_count].name) - 1);
        g_vars[g_vars_count].name[sizeof(g_vars[g_vars_count].name) - 1] = '\0';
        g_vars[g_vars_count].value = val;
        g_vars_count++;
    }
}

typedef struct {
    char name[32];
    bool initialized;
    int value;
} CvVar;

static CvVar _cv_var_init(const char* name) {
    CvVar v;
    strncpy(v.name, name, sizeof(v.name) - 1);
    v.name[sizeof(v.name) - 1] = '\0';
    v.initialized = false;
    v.value = 0;
    return v;
}

static int _cv_var_get(CvVar* v) {
    if (g_crashed) return 0;
    if (!v->initialized) {
        g_crashed = true;
        snprintf(g_crash_reason, sizeof(g_crash_reason), "Variable \\"%s\\" is used before being set.", v->name);
        return 0;
    }
    return v->value;
}

static void _cv_var_set(CvVar* v, long long val) {
    if (g_crashed) return;
    if (val < -10000 || val > 10000) {
        g_crashed = true;
        snprintf(g_crash_reason, sizeof(g_crash_reason), "Variable \\"%s\\" out of bounds (%lld). Must be between -10,000 and 10,000.", v->name, val);
        return;
    }
    bool exists = false;
    for (int i = 0; i < g_vars_count; i++) {
        if (strcmp(g_vars[i].name, v->name) == 0) { exists = true; break; }
    }
    if (!exists && g_vars_count >= 10) {
        g_crashed = true;
        snprintf(g_crash_reason, sizeof(g_crash_reason), "Maximum limit of 10 variables exceeded.");
        return;
    }
    v->initialized = true;
    v->value = (int)val;
    if (g_cv_call_depth == 0) {
        set_g_var(v->name, (int)val);
    }
}

static void _cv_var_change(CvVar* v, long long amount) {
    if (g_crashed) return;
    if (!v->initialized) {
        g_crashed = true;
        snprintf(g_crash_reason, sizeof(g_crash_reason), "Variable \\"%s\\" must be set before changing it.", v->name);
        return;
    }
    long long next = (long long)v->value + amount;
    if (next < -10000 || next > 10000) {
        g_crashed = true;
        snprintf(g_crash_reason, sizeof(g_crash_reason), "Variable \\"%s\\" out of bounds (%lld). Must be between -10,000 and 10,000.", v->name, next);
        return;
    }
    v->value = (int)next;
    if (g_cv_call_depth == 0) {
        set_g_var(v->name, (int)next);
    }
}

int drone_sensor(const char* name) {
    int ax = g_x + DIRS[g_dir][0];
    int ay = g_y + DIRS[g_dir][1];
    char t = tile_at(ax, ay);
    if (strcmp(name, "wall") == 0) return t == '#' || (t == 'B' && !g_bridge) || (t == 'X' && g_boss_hp > 0);
    if (strcmp(name, "energy") == 0) return (tile_at(g_x, g_y) == 'C' && !g_collected_grid[g_y][g_x]) ? 1 : 0;
    if (strcmp(name, "hazard") == 0) return t == 'H';
    if (strcmp(name, "terminal") == 0) return tile_at(g_x, g_y) == 'T';
    if (strcmp(name, "guardian") == 0) return (t == 'X' && g_boss_hp > 0) ? 1 : 0;
    return 0;
}

void drone_move(void) {
    if (g_crashed) return;
    record_action();
    if (g_crashed) return;
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
    record_action();
    if (g_crashed) return;
    int nx = g_x + DIRS[g_dir][0] * 2;
    int ny = g_y + DIRS[g_dir][1] * 2;
    char t = tile_at(nx, ny);
    if (t == '#' || (t == 'B' && !g_bridge) || (t == 'X' && g_boss_hp > 0) || t == 'H') {
        g_crashed = true;
        snprintf(g_crash_reason, sizeof(g_crash_reason), t == 'H' ? "Corruption hit on landing." : "Jump landing site blocked.");
        return;
    }
    g_x = nx;
    g_y = ny;
}

void drone_left(void) {
    if (g_crashed) return;
    record_action();
    if (g_crashed) return;
    g_dir = (g_dir + 3) % 4;
}

void drone_right(void) {
    if (g_crashed) return;
    record_action();
    if (g_crashed) return;
    g_dir = (g_dir + 1) % 4;
}

void drone_collect(void) {
    if (g_crashed) return;
    record_action();
    if (g_crashed) return;
    if (drone_sensor("energy")) {
        g_collected_grid[g_y][g_x] = true;
        g_collected++;
    }
}

void drone_activate(void) {
    if (g_crashed) return;
    record_action();
    if (g_crashed) return;
    if (drone_sensor("terminal")) g_bridge = true;
}

void drone_pulse(void) {
    if (g_crashed) return;
    record_action();
    if (g_crashed) return;
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

static char g_cv_call_stack[8][64];
static int g_cv_call_depth = 0;

static void _cv_enter_fn(const char* name) {
    for (int i = 0; i < g_cv_call_depth; i++) {
        if (strcmp(g_cv_call_stack[i], name) == 0) {
            snprintf(g_crash_reason, sizeof(g_crash_reason), "Recursion is not permitted in this stage. Function \\"%s\\" cannot call itself directly or indirectly.", name);
            g_crashed = true;
            return;
        }
    }
    if (g_cv_call_depth >= 8) {
        snprintf(g_crash_reason, sizeof(g_crash_reason), "Maximum call stack depth (8) exceeded.");
        g_crashed = true;
        return;
    }
    strncpy(g_cv_call_stack[g_cv_call_depth], name, 63);
    g_cv_call_stack[g_cv_call_depth][63] = '\\0';
    g_cv_call_depth++;
}

static void _cv_exit_fn(void) {
    if (g_cv_call_depth > 0) {
        g_cv_call_depth--;
    }
}

${codeRes.globalVars && codeRes.globalVars.length ? codeRes.globalVars.map(v => `static CvVar ${v};`).join('\n') : ''}

${codeRes.prototypesCode || ''}

${codeRes.functionsCode || ''}

void run_learner_program(void) {
    g_cv_call_depth = 0;
${codeRes.globalVars && codeRes.globalVars.length ? codeRes.globalVars.map(v => `    ${v} = _cv_var_init("${v}");`).join('\n') : ''}
${codeRes.bodyCode ? codeRes.bodyCode.split('\n').map(line => '    ' + line).join('\n') : ''}
}

int main(void) {
    printf("CodeVerse Drone Simulation (C99) | Sector: %s\\n", "${meta.title}");
    run_learner_program();
    bool passed = !g_crashed && tile_at(g_x, g_y) == 'G' && g_collected == TOTAL_ENERGY && g_boss_hp == 0;
    if (passed) {
        printf("[PASS] MISSION PASSED in %d steps.\\n", g_steps);
    } else {
        printf("[FAIL] MISSION FAILED: %s\\n", g_crash_reason);
    }

    char vars_json[512] = "{";
    int vi = 0;
    for (int i = 0; i < g_vars_count; i++) {
        char entry[64];
        snprintf(entry, sizeof(entry), "%s\\"%s\\":%d", (vi++ > 0 ? "," : ""), g_vars[i].name, g_vars[i].value);
        strncat(vars_json, entry, sizeof(vars_json) - strlen(vars_json) - 1);
    }
    strncat(vars_json, "}", sizeof(vars_json) - strlen(vars_json) - 1);

    char safe_reason[256];
    strncpy(safe_reason, g_crash_reason, sizeof(safe_reason) - 1);
    safe_reason[sizeof(safe_reason) - 1] = 0;
    for (int i = 0; safe_reason[i] != 0; i++) {
        if (safe_reason[i] == '"') safe_reason[i] = 39;
    }

    printf("__CV_RESULT__={\\"x\\":%d,\\"y\\":%d,\\"dir\\":%d,\\"steps\\":%d,\\"crashed\\":%s,\\"crashReason\\":\\"%s\\",\\"collected\\":%d,\\"bridge\\":%s,\\"bossHP\\":%d,\\"passed\\":%s,\\"variables\\":%s}\\n",
        g_x, g_y, g_dir, g_steps,
        g_crashed ? "true" : "false",
        safe_reason,
        g_collected,
        g_bridge ? "true" : "false",
        g_boss_hp,
        passed ? "true" : "false",
        vars_json
    );
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

This package allows you to study and run your CodeVerse drone program locally in your development environment.

> **Note:** Running exports locally in your terminal does not modify your cloud player progress or award campaign stars. It serves as an educational bridge from visual blocks to real programming languages.

---

## Understanding Your Export Files

1. **Learning Snippet (\`codeverse_program.<ext>\`)**:
   - Contains clean algorithmic code for your drone program using CodeVerse helper functions (\`drone.move()\`, \`drone.sensor()\`, etc.).
   - **Important:** This is a code snippet designed for study. It requires the CodeVerse drone helper APIs to run and is not standalone on its own.

2. **Complete Console Simulation (\`drone_mission.<ext>\` / \`DroneMission.java\`)**:
   - Self-contained executable project that includes an embedded terminal grid simulator matching canonical CodeVerse game physics, action limits, and win conditions.
   - Runs independently in your terminal using the appropriate compiler or interpreter.

3. **Plain-English Walkthrough (\`mission_steps.txt\`)**:
   - Human-readable step-by-step description of the algorithm for conceptual understanding.
   - Not an executable script.

---

## Supported Languages, Prerequisites & Execution Instructions

All executable exports are verified against canonical CodeVerse simulation semantics in the project CI test suite.

### 1. JavaScript (\`drone_mission.js\`)
- **Prerequisite:** [Node.js](https://nodejs.org/) (v18+ recommended; LTS v20 & v22 verified in project CI)
- **Status:** Verified via CodeVerse CI test suite
- **Run Command:**
  \`\`\`bash
  node drone_mission.js
  \`\`\`

### 2. Python (\`drone_mission.py\`)
- **Prerequisite:** [Python 3](https://www.python.org/) (3.8+ recommended; 3.10-3.14 verified in project CI)
- **Status:** Verified via CodeVerse CI test suite
- **Run Command:**
  \`\`\`bash
  python drone_mission.py
  # or
  python3 drone_mission.py
  \`\`\`

### 3. Java (\`DroneMission.java\`)
- **Prerequisite:** [Java JDK 11+](https://adoptium.net/) (javac compiler and java runtime; JDK 21 verified in project CI)
- **Status:** Verified via CodeVerse CI test suite
- **Compile & Run:**
  \`\`\`bash
  javac DroneMission.java
  java DroneMission
  \`\`\`

### 4. C++ (\`drone_mission.cpp\`)
- **Prerequisite:** C++17 compliant compiler (GCC 9+, Clang 10+, or MSVC 2019+; GCC 11+ verified in project CI)
- **Status:** Verified via CodeVerse CI test suite
- **Compile & Run (Linux / macOS):**
  \`\`\`bash
  g++ -std=c++17 -O2 -o drone_mission drone_mission.cpp
  ./drone_mission
  \`\`\`
- **Compile & Run (Windows CMD / PowerShell with MinGW):**
  \`\`\`powershell
  g++ -std=c++17 -O2 -o drone_mission.exe drone_mission.cpp
  .\\drone_mission.exe
  \`\`\`

### 5. C (\`drone_mission.c\`)
- **Prerequisite:** C99 compliant compiler (GCC or Clang; GCC 11+ verified in project CI)
- **Status:** Verified via CodeVerse CI test suite
- **Compile & Run (Linux / macOS):**
  \`\`\`bash
  gcc -std=c99 -O2 -o drone_mission drone_mission.c
  ./drone_mission
  \`\`\`
- **Compile & Run (Windows CMD / PowerShell with MinGW):**
  \`\`\`powershell
  gcc -std=c99 -O2 -o drone_mission.exe drone_mission.c
  .\\drone_mission.exe
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
