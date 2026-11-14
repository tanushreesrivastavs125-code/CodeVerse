import { levels, DISTRICTS, simulate } from '../../../shared/game.js';
import { getLevelCurriculum, diagnoseFailure } from '../../../shared/curriculum.js';
import CampaignProgress from '../models/CampaignProgress.js';
import CampaignAttempt from '../models/CampaignAttempt.js';
import { CAMPAIGN_VERSION } from './campaignService.js';
import { getLlmConfig } from '../config/llm.config.js';
import { AppError } from '../middleware/errorHandler.js';

/**
 * Checks whether the requested sector is unlocked for the authenticated user.
 * Level 1 is always unlocked. Any level L > 1 requires a recorded completion of level L - 1.
 *
 * @param {string} userId - Authenticated player ID
 * @param {number} levelId - Target sector ID
 * @returns {Promise<boolean>}
 */
export async function checkLevelAccess(userId, levelId) {
  if (levelId === 1) return true;

  const previousCompletion = await CampaignProgress.findOne({
    user: userId,
    levelId: levelId - 1,
    campaignVersion: CAMPAIGN_VERSION
  }).lean();

  if (!previousCompletion) {
    throw new AppError(
      'Sector is locked. Complete earlier sectors to access mentor guidance.',
      403,
      'LEVEL_LOCKED'
    );
  }

  return true;
}

/**
 * Computes actual player progression metrics across the entire 24-level campaign.
 *
 * @param {string} userId
 * @returns {Promise<{
 *   completedMap: Map<number, object>,
 *   completedCount: number,
 *   totalStars: number,
 *   highestUnlockedId: number,
 *   incompleteUnlocked: object[]
 * }>}
 */
export async function getPlayerProgressSummary(userId) {
  const progressList = await CampaignProgress.find({
    user: userId,
    campaignVersion: CAMPAIGN_VERSION
  }).lean();

  const completedMap = new Map();
  let totalStars = 0;
  for (const prog of progressList) {
    completedMap.set(prog.levelId, prog);
    totalStars += prog.stars || 0;
  }

  const completedCount = completedMap.size;
  const highestUnlockedId = Math.min(levels.length, completedCount + 1);

  const incompleteUnlocked = levels.filter(
    (lvl) => (lvl.id === 1 || completedMap.has(lvl.id - 1)) && !completedMap.has(lvl.id)
  );

  return {
    completedMap,
    completedCount,
    totalStars,
    highestUnlockedId,
    incompleteUnlocked
  };
}

/**
 * Diagnostic map analysis helper to identify key mechanics present on a sector grid.
 *
 * @param {object} level
 * @returns {{
 *   hasHazards: boolean,
 *   hasTerminal: boolean,
 *   hasBridges: boolean,
 *   hasBoss: boolean,
 *   bossHP: number,
 *   energyCount: number,
 *   hasTurns: boolean,
 *   requiresLoops: boolean,
 *   requiresSensors: boolean
 * }}
 */
export function analyzeSectorMechanics(level) {
  const mapStr = level.map.join('');
  const hasHazards = mapStr.includes('H');
  const hasTerminal = mapStr.includes('T');
  const hasBridges = mapStr.includes('B');
  const hasBoss = mapStr.includes('X');
  const bossHP = level.bossHealth || (hasBoss ? 3 : 0);
  const energyCount = (mapStr.match(/C/g) || []).length;
  const hasTurns = level.map.length > 3 || level.direction !== 0;

  return {
    hasHazards,
    hasTerminal,
    hasBridges,
    hasBoss,
    bossHP,
    energyCount,
    hasTurns,
    requiresLoops: Boolean(level.requireLoops),
    requiresSensors: Boolean(level.requireSensors)
  };
}

/**
 * Generates deterministic, graduated, and mechanically accurate offline guidance.
 *
 * @param {object} params
 * @param {'hint' | 'explain' | 'debug' | 'recommend'} params.mode
 * @param {object | null} params.level
 * @param {Array | null} params.program
 * @param {object | null} params.recentAttempt
 * @param {string} params.message
 * @param {object} params.progressSummary
 * @returns {string}
 */
export function generateFallbackGuidance({
  mode,
  level,
  program,
  recentAttempt,
  message,
  progressSummary
}) {
  const mechanics = level ? analyzeSectorMechanics(level) : null;
  const district = level ? DISTRICTS.find((d) => d.sectors.includes(level.id)) : null;

  // 1. RECOMMEND MODE
  if (mode === 'recommend') {
    const { completedCount, totalStars, incompleteUnlocked, completedMap } = progressSummary;

    if (incompleteUnlocked.length > 0) {
      const nextTarget = incompleteUnlocked[0];
      const targetDistrict = DISTRICTS.find((d) => d.sectors.includes(nextTarget.id));
      return (
        `### Tactical Mission Recommendation\n\n` +
        `**Next Objective: Sector ${nextTarget.id} — "${nextTarget.title}"**\n` +
        `- **District:** ${targetDistrict ? targetDistrict.name : 'Unknown'} (District Focus: ${targetDistrict ? targetDistrict.focus : 'Core mechanics'})\n` +
        `- **Core Concept:** ${nextTarget.concept}\n` +
        `- **Tactical Briefing:** ${nextTarget.briefing}\n\n` +
        `**Flight Progress:** You have cleared **${completedCount} / 24 sectors** with **${totalStars} total stars** earned.\n` +
        `Proceed to Sector ${nextTarget.id} to advance the campaign frontier.`
      );
    }

    // Check if any cleared sector has fewer than 3 stars
    const improvable = levels.find((lvl) => {
      const prog = completedMap.get(lvl.id);
      return prog && prog.stars < 3;
    });

    if (improvable) {
      const prog = completedMap.get(improvable.id);
      return (
        `### Optimization Recommendation\n\n` +
        `**Par Tuning Target: Sector ${improvable.id} — "${improvable.title}"**\n` +
        `- **Current Stars:** ${prog.stars} / 3 ⭐\n` +
        `- **Target Par:** ${improvable.par} actions\n` +
        `- **Concept:** ${improvable.concept}\n\n` +
        `You have unlocked and completed all current sectors, but Sector ${improvable.id} has an uncollected star. ` +
        `Refactor your program with repeat loops or tighter heading adjustments to achieve a full 3-star clear!`
      );
    }

    return (
      `### Master Pilot Status\n\n` +
      `**Congratulations, Pilot!** You have conquered all **24 sectors** across all 6 districts with a perfect **72 / 72 stars**!\n\n` +
      `- **Next Activity:** Check the **Global Leaderboard** to compare your flight efficiency and weekly XP against top cyber pilots.\n` +
      `- **Experimentation:** Visit the flight console on Sector 24 ("The Singularity") to experiment with alternative algorithmic solutions.`
    );
  }

  // 2. HINT MODE (Graduated hints)
  if (mode === 'hint') {
    const sections = [];
    sections.push(`### Mission Guidance: Sector ${level.id} — "${level.title}"`);
    sections.push(`**Objective:** ${level.briefing}`);

    // Core Concept Clue
    sections.push(`**Algorithmic Concept:** ${level.concept}`);

    // Mechanical Diagnostic Clues
    const clues = [];
    if (mechanics.hasTurns) {
      clues.push(
        `- **Heading & Orientation:** Remember that \`turn_left\` and \`turn_right\` rotate your drone 90° in place without advancing your position. Verify your heading matches the open corridor before executing forward moves.`
      );
    }
    if (mechanics.hasHazards) {
      clues.push(
        `- **Corruption Tiles (H):** Red corruption tiles breach the drone upon direct entry. A \`move\` advances 1 tile into the corruption, whereas \`jump\` propels the drone 2 tiles forward in your current heading to vault cleanly across.`
      );
    }
    if (mechanics.hasTerminal && mechanics.hasBridges) {
      clues.push(
        `- **Bridge Terminals (T & B):** Bridge tiles (B) remain deactivated void breaches until extended. Stand on the terminal tile (T) and execute an \`activate\` command to deploy the bridge before attempting to cross.`
      );
    }
    if (mechanics.energyCount > 0) {
      clues.push(
        `- **Energy Shards (C):** Extraction portal (G) remains locked until all ${mechanics.energyCount} energy shard${mechanics.energyCount > 1 ? 's are' : ' is'} collected. Use \`collect\` while standing on each shard.`
      );
    }
    if (mechanics.hasBoss) {
      clues.push(
        `- **Firewall Guardian (X):** The guardian's defensive shield has ${mechanics.bossHP} HP. Align your heading toward the guardian within a 3-tile range and emit \`pulse\` charges to break the shield before crossing.`
      );
    }
    if (mechanics.requiresLoops) {
      clues.push(
        `- **Loop Compaction:** This sector requires structured loops (\`repeat\`). Group repeating patterns into a repeat block to satisfy the block budget (max ${level.maxBlocks || level.par} blocks).`
      );
    }
    if (mechanics.requiresSensors) {
      clues.push(
        `- **Sensor Scanning:** Use the sensor radar (\`if path/wall/hazard\`) to evaluate environment tiles dynamically rather than hardcoding static coordinates.`
      );
    }

    if (clues.length > 0) {
      sections.push(`**Diagnostic Clues:**\n${clues.join('\n')}`);
    }

    const curriculum = getLevelCurriculum(level.id);
    if (curriculum?.hints) {
      sections.push(
        `**3-Tier Graduated Guidance:**\n` +
        `- **Tier 1 (Notice the Goal):** ${curriculum.hints[0].text}\n` +
        `- **Tier 2 (Helpful Concept):** ${curriculum.hints[1].text}\n` +
        `- **Tier 3 (Step-by-Step Suggestion):** ${curriculum.hints[2].text}`
      );
    }

    // Telemetry from recent failed flight
    if (recentAttempt && !recentAttempt.passed && recentAttempt.reason) {
      sections.push(
        `> ⚠️ **Flight Telemetry Notice:** Your previous attempt failed with: *"${recentAttempt.reason}"*. Focus your adjustments on the mechanic highlighted above.`
      );
    }

    // Optional user query context
    if (message) {
      sections.push(`**Pilot Inquiry:** "${message}"\n*Tactical advice:* Apply the mechanical clues above to structure your sequence step-by-step.`);
    }

    return sections.join('\n\n');
  }

  // 3. EXPLAIN MODE
  if (mode === 'explain') {
    const conceptExplanations = {
      Sequences:
        'In computing, a **Sequence** is an ordered list of instructions executed strictly one after another from top to bottom. Each command must fully resolve before the processor evaluates the next instruction. In drone navigation, a single out-of-order instruction shifts all subsequent spatial coordinates.',
      Actions:
        "**Actions** are state-altering operations. Spatial actions (`move`, `jump`) manipulate the drone's coordinate state $(x, y)$. Interaction actions (`collect`, `activate`, `pulse`) manipulate environmental tile states without altering drone position.",
      Direction:
        '**Relative Orientation vs Absolute Grid:** In CodeVerse, turns (`left`, `right`) are relative to your drone\'s current heading vector, not fixed screen coordinates. East is heading 0, South is 1, West is 2, North is 3. Turning transforms your forward trajectory without changing tile coordinates.',
      Loops:
        '**Loops & Iteration:** Repeating code is redundant and violates the DRY (Don\'t Repeat Yourself) principle. A `repeat` block executes an encapsulated body of commands $N$ times. Loops conserve memory, reduce AST block counts, and enable generalized problem solving.',
      Jump:
        '**Discontinuous Traversal (Jump):** Unlike `move` which transitions state $(x, y) \\rightarrow (x + \\Delta x, y + \\Delta y)$, `jump` transitions $(x, y) \\rightarrow (x + 2\\Delta x, y + 2\\Delta y)$. This bypasses intermediate hazard tiles entirely without triggering trigger-based collision checks.',
      State:
        '**Digital State & Environmental Triggers:** A state machine transitions between discrete modes. The Bridge Terminal acts as a binary trigger: standing on `T` and calling `activate` flips the bridge status from false (void breach) to true (traversable floor).',
      Conditions:
        '**Conditional Branching (`if / else`):** Conditions allow software to adapt to unpredictable runtime data. An `if` block evaluates a boolean predicate (such as a sensor reading) before choosing which branch of instructions to execute.',
      Sensors:
        '**Sensor Radar & Reactive Systems:** Sensor-driven programming decodes the environment at runtime rather than relying on hardcoded static routes. Checking for walls, energy, or hazards enables drone autonomy in dynamic sector environments.',
      'Boss battle':
        '**Multi-Phase Combat & State Machines:** Boss entities have internal health pools. Overcoming them requires distance-checking (line-of-sight range), heading alignment, and multi-cycle action execution (`pulse` charges) before objective clearance.',
      'Adaptive programs':
        '**Adaptive Algorithms:** Combining nested repeat loops with dynamic sensor branching allows a single compact program to navigate complex multi-lane serpentine grids efficiently within strict par budgets.'
    };

    const explanation =
      conceptExplanations[level.concept] ||
      `**${level.concept}** represents a fundamental algorithmic building block. In Sector ${level.id}, master this concept by breaking the mission into clear, testable phases: position, interact, and extract.`;

    return (
      `### Concept Analysis: ${level.concept}\n\n` +
      `**Sector ${level.id}:** "${level.title}" (${district ? district.name : 'Campaign Sector'})\n\n` +
      `${explanation}\n\n` +
      `**Engineering Takeaway:** Clean software architecture decomposes complex operations into modular sequences, reusable loops, and defensive condition checks.`
    );
  }

  // 4. DEBUG MODE
  if (mode === 'debug') {
    // If a program AST is provided, simulate it authoritatively in-memory
    if (program && program.length > 0) {
      try {
        const outcome = simulate(level, program);
        if (outcome.passed) {
          return (
            `### Simulation Diagnostic: PASS ✅\n\n` +
            `Your program successfully cleared **Sector ${level.id} ("${level.title}")** in local flight simulation!\n\n` +
            `- **Steps Executed:** ${outcome.frames.length - 1}\n` +
            `- **Par Budget:** ${level.par} steps\n` +
            `- **Projected Stars:** ${outcome.stars} / 3 ⭐\n` +
            `- **Status:** Ready for flight authorization. Click **Run** on the flight console to commit your flight and record your stars.`
          );
        }

        // Program failed simulation
        const lastFrame = outcome.frames[outcome.frames.length - 1] || {};
        const stepNum = outcome.frames.length - 1;
        const reason = outcome.message || 'Mission objective not fulfilled.';

        let tacticalNudge = 'Review your command sequence and step count.';
        let failureDescription = reason;
        if (reason.toLowerCase().includes('corruption') || reason.toLowerCase().includes('hazard')) {
          tacticalNudge = 'Your drone moved onto a corruption hazard tile (H). Replace the `move` block at that step with a `jump` block.';
        } else if (
          reason.toLowerCase().includes('wall') ||
          reason.toLowerCase().includes('barrier') ||
          reason.toLowerCase().includes('route blocked')
        ) {
          failureDescription = 'Drone collided with an impassable perimeter wall or obstacle barrier.';
          tacticalNudge = 'The drone collided with an impassable boundary. Check the turn commands immediately preceding this step to ensure the drone is facing the open corridor.';
        } else if (reason.toLowerCase().includes('energy') || reason.toLowerCase().includes('shard')) {
          tacticalNudge = 'The drone reached extraction before gathering all energy shards. Ensure you insert a `collect` block each time the drone steps onto a shard (C).';
        } else if (reason.toLowerCase().includes('bridge') || reason.toLowerCase().includes('terminal')) {
          tacticalNudge = 'The drone attempted to cross an unextended bridge. You must navigate to the terminal tile (T) and execute an `activate` block before stepping onto bridge tiles (B).';
        } else if (reason.toLowerCase().includes('guardian')) {
          tacticalNudge = 'The firewall guardian blocked the extraction path. Face the guardian from within 3 tiles and fire pulse charges to deplete its shield before attempting to enter.';
        }

        const diag = diagnoseFailure(level, outcome.finalState || { event: 'crash', message: reason, x: lastFrame.x, y: lastFrame.y }, program);

        return (
          `### Simulation Diagnostic: FAILURE DETECTED ❌\n\n` +
          `**Failure at Step ${stepNum}:**\n` +
          `- **Diagnostic Telemetry:** *"${failureDescription}"*\n` +
          `- **Drone Coordinate:** (${lastFrame.x ?? '?'}, ${lastFrame.y ?? '?'})\n\n` +
          `**Tactical Diagnostic:**\n${tacticalNudge}\n\n` +
          `**Next Step Guidance:**\n${diag.suggestion}`
        );
      } catch (simErr) {
        return (
          `### Simulation Diagnostic: AST ERROR\n\n` +
          `The program AST could not be evaluated: *${simErr.message}*. Check that all blocks are properly connected in the Blockly workspace.`
        );
      }
    }

    // No program supplied, but recent attempt exists
    if (recentAttempt) {
      if (recentAttempt.passed) {
        return (
          `### Diagnostic Telemetry: PREVIOUS CLEAR\n\n` +
          `Your last recorded flight on **Sector ${level.id}** was successful (${recentAttempt.stars} ⭐, ${recentAttempt.steps} steps).\n` +
          `To debug a new approach, construct your program in the Blockly workspace and consult the mentor again.`
        );
      }

      return (
        `### Diagnostic Telemetry: PREVIOUS ATTEMPT FAILED\n\n` +
        `- **Sector:** Sector ${level.id} ("${level.title}")\n` +
        `- **Failure Recorded:** *"${recentAttempt.reason || 'Objective not achieved'}"*\n` +
        `- **Steps Executed:** ${recentAttempt.steps}\n` +
        `- **Blocks Used:** ${recentAttempt.programBlocks}\n\n` +
        `**Recommendation:** Re-examine the mission map and ensure every obstacle is addressed before extraction.`
      );
    }

    // Neither program nor recent attempt
    return (
      `### Flight Telemetry: NO DATA\n\n` +
      `No active program or recorded flight telemetry found for **Sector ${level.id}**.\n\n` +
      `**Debugging Checklist:**\n` +
      `1. Assemble your sequence in the Blockly editor.\n` +
      `2. Verify turn direction (facing East $\\rightarrow$ right turn faces South).\n` +
      `3. Vault over red hazards with \`jump\`.\n` +
      `4. Collect all energy shards before reaching extraction.`
    );
  }

  return 'Guidance telemetry unavailable for requested configuration.';
}

/**
 * Executes an HTTP call to the configured external LLM provider with bounded timeout
 * and response sanitization.
 *
 * @param {object} params
 * @param {object} params.config
 * @param {string} params.prompt
 * @returns {Promise<string>} Sanitized text response
 */
export async function callExternalLlm({ config, prompt }) {
  const isGeminiEndpoint =
    config.apiUrl.includes('googleapis.com') || config.apiUrl.includes('generateContent');

  let targetUrl = config.apiUrl;
  let headers = {
    'Content-Type': 'application/json'
  };
  let requestBody;

  if (isGeminiEndpoint) {
    // Append API key query param for Google Gemini REST format
    const urlObj = new URL(config.apiUrl);
    urlObj.searchParams.set('key', config.apiKey);
    targetUrl = urlObj.toString();

    requestBody = JSON.stringify({
      contents: [
        {
          parts: [{ text: prompt }]
        }
      ],
      generationConfig: {
        maxOutputTokens: 600,
        temperature: 0.3
      }
    });
  } else {
    // OpenAI-compatible chat completion payload
    headers['Authorization'] = `Bearer ${config.apiKey}`;
    requestBody = JSON.stringify({
      model: config.model,
      messages: [
        {
          role: 'system',
          content:
            'You are the CodeVerse Flight Mentor, an encouraging, technical mentor embedded in a cyber coding adventure game. You guide pilots through 24 progressive sectors teaching computational thinking. Always provide concise, technical, graduated guidance. Never give away full solutions immediately. Never claim to modify player balances or game rules. Format in clean markdown.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      max_tokens: 600,
      temperature: 0.3
    });
  }

  const response = await fetch(targetUrl, {
    method: 'POST',
    headers,
    body: requestBody,
    signal: AbortSignal.timeout(config.timeoutMs)
  });

  if (!response.ok) {
    throw new Error(`LLM provider responded with HTTP status ${response.status}`);
  }

  const data = await response.json();

  let extractedText = '';
  if (isGeminiEndpoint) {
    extractedText = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
  } else {
    extractedText =
      data.choices?.[0]?.message?.content || data.choices?.[0]?.text || data.text || '';
  }

  if (typeof extractedText !== 'string' || extractedText.trim().length === 0) {
    throw new Error('LLM provider returned empty or malformed text response');
  }

  // Sanitize text: strip non-printable control characters while preserving newlines and markdown
  return Array.from(extractedText)
    .filter((char) => {
      const code = char.charCodeAt(0);
      return (code >= 32 && code !== 127) || code === 9 || code === 10 || code === 13;
    })
    .join('')
    .trim();
}

/**
 * Dispatcher object enabling test stubs without module namespace mutation.
 */
export const llmClient = {
  call: callExternalLlm
};

/**
 * Main mentor orchestration entry point.
 * Guarantees zero side-effects on player balances, stars, completions, or unlocks.
 *
 * @param {object} params
 * @param {string} params.userId - Authenticated player ID
 * @param {'hint' | 'explain' | 'debug' | 'recommend'} params.mode
 * @param {number | null} [params.levelId]
 * @param {string} [params.message='']
 * @param {Array | null} [params.program=null]
 * @returns {Promise<{
 *   text: string,
 *   mode: string,
 *   levelId: number | null,
 *   source: 'ai' | 'fallback',
 *   sector: object | null
 * }>}
 */
export async function askMentor({ userId, mode, levelId = null, message = '', program = null }) {
  // 1. Verify level access if levelId is provided
  if (levelId !== null) {
    await checkLevelAccess(userId, levelId);
  }

  // 2. Fetch player campaign progress summary
  const progressSummary = await getPlayerProgressSummary(userId);

  // 3. Load canonical sector definition
  const level = levelId !== null ? levels.find((l) => l.id === levelId) || null : null;

  // 4. Load recent attempt for this sector if applicable
  let recentAttempt = null;
  if (levelId !== null) {
    recentAttempt = await CampaignAttempt.findOne({
      user: userId,
      levelId,
      campaignVersion: CAMPAIGN_VERSION
    })
      .sort({ createdAt: -1 })
      .lean();
  }

  const sectorSummary = level
    ? {
        id: level.id,
        title: level.title,
        zone: level.zone,
        concept: level.concept
      }
    : null;

  // 5. Evaluate LLM configuration
  const llmConfig = getLlmConfig();

  // If no external provider configured, return deterministic fallback immediately
  if (!llmConfig.isConfigured) {
    const fallbackText = generateFallbackGuidance({
      mode,
      level,
      program,
      recentAttempt,
      message,
      progressSummary
    });

    return {
      text: fallbackText,
      mode,
      levelId,
      source: 'fallback',
      sector: sectorSummary
    };
  }

  // 6. External LLM Provider Execution with graceful fallback
  try {
    const promptContext = [
      `Mode: ${mode.toUpperCase()}`,
      level
        ? `Sector: ${level.id} ("${level.title}"), Zone: ${level.zone}, Concept: ${level.concept}, Par: ${level.par}`
        : 'Context: Entire Campaign',
      level ? `Briefing: ${level.briefing}` : '',
      recentAttempt && !recentAttempt.passed
        ? `Last Flight Failure: ${recentAttempt.reason}`
        : '',
      program ? `Current Program Blocks: ${program.length} commands` : '',
      message ? `Pilot Question: "${message}"` : ''
    ]
      .filter(Boolean)
      .join('\n');

    const prompt =
      `Context Information:\n${promptContext}\n\n` +
      `Provide game-aware, encouraging, graduated guidance for mode "${mode}". Follow CodeVerse game rules strictly.`;

    const aiText = await llmClient.call({ config: llmConfig, prompt });

    return {
      text: aiText,
      mode,
      levelId,
      source: 'ai',
      sector: sectorSummary
    };
  } catch (err) {
    // Graceful fallback on provider failure, timeout, or malformed response
    // Sanitized logging: never log authorization headers, keys, or endpoints
    console.warn(`[MentorService] External provider notice (${err.message}). Returning autonomous fallback.`);

    const fallbackText = generateFallbackGuidance({
      mode,
      level,
      program,
      recentAttempt,
      message,
      progressSummary
    });

    return {
      text: fallbackText,
      mode,
      levelId,
      source: 'fallback',
      sector: sectorSummary
    };
  }
}
