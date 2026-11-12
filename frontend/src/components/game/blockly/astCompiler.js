const SENSOR_MAP = new Set(['wall', 'energy', 'hazard', 'terminal', 'guardian']);

/**
 * Extracts sensor identifier from a connected sensor block.
 *
 * @param {object | null} sensorBlock
 * @returns {string}
 */
function extractSensor(sensorBlock) {
  if (!sensorBlock) {
    throw new Error('Condition incomplete: attach a sensor block (e.g. "wall ahead") to the if-statement.');
  }

  const sensorVal = sensorBlock.getFieldValue('SENSOR');
  if (sensorVal && SENSOR_MAP.has(sensorVal)) {
    return sensorVal;
  }

  throw new Error(`Unrecognized sensor value: "${sensorVal || 'none'}".`);
}

/**
 * Compiles a linear sequence of connected Blockly blocks into canonical CodeVerse AST nodes.
 *
 * @param {object | null} block - The head block of a statement chain
 * @returns {Array<object>}
 */
export function compileBlockSequence(block) {
  const nodes = [];
  let current = block;

  while (current) {
    const type = current.type;

    if (type.startsWith('cv_') && type !== 'cv_sensor') {
      const actionName = type.slice(3);

      if (actionName === 'repeat') {
        const rawCount = current.getFieldValue('COUNT');
        const count = Number.parseInt(rawCount, 10);
        if (Number.isNaN(count) || count < 1 || count > 30) {
          throw new Error('Repeat loop count must be an integer between 1 and 30.');
        }

        const bodyBlock = current.getInputTargetBlock('DO');
        if (!bodyBlock) {
          throw new Error('Repeat loop cannot be empty. Connect action blocks inside.');
        }

        nodes.push({
          type: 'repeat',
          count,
          body: compileBlockSequence(bodyBlock)
        });
      } else if (actionName === 'if') {
        const sensor = extractSensor(current.getInputTargetBlock('SENSOR'));
        const bodyBlock = current.getInputTargetBlock('DO');
        if (!bodyBlock) {
          throw new Error('The if-condition block must contain at least one action inside.');
        }

        nodes.push({
          type: 'if',
          sensor,
          body: compileBlockSequence(bodyBlock),
          elseBody: []
        });
      } else if (actionName === 'if_else') {
        const sensor = extractSensor(current.getInputTargetBlock('SENSOR'));
        const bodyBlock = current.getInputTargetBlock('DO');
        if (!bodyBlock) {
          throw new Error('The then-branch of the if/else block must contain at least one action.');
        }

        const elseBlock = current.getInputTargetBlock('ELSE');
        const elseBody = elseBlock ? compileBlockSequence(elseBlock) : [];

        nodes.push({
          type: 'if',
          sensor,
          body: compileBlockSequence(bodyBlock),
          elseBody
        });
      } else {
        // Simple atomic actions: move, left, right, collect, jump, activate, pulse
        nodes.push({ type: actionName });
      }
    } else if (type === 'controls_repeat_ext') {
      const timesBlock = current.getInputTargetBlock('TIMES');
      const rawNum = timesBlock?.getFieldValue('NUM');
      const count = Number.parseInt(rawNum, 10);
      if (Number.isNaN(count) || count < 1 || count > 30) {
        throw new Error('Repeat loop count must be an integer between 1 and 30.');
      }

      const bodyBlock = current.getInputTargetBlock('DO');
      if (!bodyBlock) {
        throw new Error('Repeat loop cannot be empty. Connect action blocks inside.');
      }

      nodes.push({
        type: 'repeat',
        count,
        body: compileBlockSequence(bodyBlock)
      });
    } else if (type === 'controls_if') {
      let first = null;
      let tail = null;

      for (let i = 0; current.getInput(`IF${i}`); i++) {
        const sensorBlock = current.getInputTargetBlock(`IF${i}`);
        const sensor = extractSensor(sensorBlock);
        const bodyBlock = current.getInputTargetBlock(`DO${i}`);
        if (!bodyBlock) {
          throw new Error(`Branch ${i + 1} of if-statement must contain at least one action.`);
        }

        const branch = {
          type: 'if',
          sensor,
          body: compileBlockSequence(bodyBlock),
          elseBody: []
        };

        if (tail) {
          tail.elseBody = [branch];
        } else {
          first = branch;
        }
        tail = branch;
      }

      const elseBlock = current.getInputTargetBlock('ELSE');
      if (elseBlock && tail) {
        tail.elseBody = compileBlockSequence(elseBlock);
      }

      if (first) {
        nodes.push(first);
      }
    } else if (type === 'cv_sensor' || type === 'math_number') {
      // Standalone loose value blocks sitting in workspace outside statement stack are ignored
    } else {
      throw new Error(`Unrecognized block in sequence: ${type}. Please replace with a standard CodeVerse action.`);
    }

    current = current.getNextBlock();
  }

  return nodes;
}

/**
 * Compiles the entire Blockly workspace into a top-level AST command array.
 *
 * @param {object} workspace - Blockly workspace instance
 * @returns {Array<object>} Compiled AST
 */
export function compileWorkspaceToAST(workspace) {
  if (!workspace) {
    return [];
  }

  const topBlocks = workspace.getTopBlocks(true);
  const ast = [];

  for (const block of topBlocks) {
    // Only top blocks with statements (not standalone value/sensor/math blocks)
    if (block.outputConnection) {
      continue;
    }

    const compiledChain = compileBlockSequence(block);
    ast.push(...compiledChain);
  }

  return ast;
}

/**
 * Validates a program before transmission to the server.
 * Returns { valid: boolean, error: string | null }
 *
 * @param {Array<object>} program
 * @returns {{ valid: boolean, error: string | null }}
 */
export function validateProgramAST(program) {
  if (!Array.isArray(program) || program.length === 0) {
    return {
      valid: false,
      error: 'Your program is empty. Drag and snap action blocks together to program the drone.'
    };
  }

  try {
    // Recursively count nodes and check depth
    let count = 0;
    const checkNodes = (nodes, depth = 0) => {
      if (depth > 8) {
        throw new Error('Program nesting is too deep (maximum 8 levels allowed).');
      }
      for (const n of nodes) {
        count++;
        if (count > 300) {
          throw new Error('Program exceeds the 300-command limit.');
        }
        if (n.type === 'repeat') {
          if (!n.body || n.body.length === 0) {
            throw new Error('Repeat loop cannot be empty.');
          }
          checkNodes(n.body, depth + 1);
        } else if (n.type === 'if') {
          if (!n.body || n.body.length === 0) {
            throw new Error('If statement cannot be empty.');
          }
          checkNodes(n.body, depth + 1);
          if (n.elseBody && n.elseBody.length > 0) {
            checkNodes(n.elseBody, depth + 1);
          }
        }
      }
    };
    checkNodes(program);
    return { valid: true, error: null };
  } catch (err) {
    return { valid: false, error: err.message };
  }
}

/**
 * Formats canonical CodeVerse AST into a human-readable program preview string.
 *
 * @param {Array<object>} ast
 * @param {number} [depth=0]
 * @returns {string}
 */
export function programToPreviewCode(ast, depth = 0) {
  if (!Array.isArray(ast) || ast.length === 0) {
    return '# CodeVerse Program Preview\n# No blocks assembled yet.';
  }

  const indent = '  '.repeat(depth);

  return ast
    .map((node) => {
      if (node.type === 'repeat') {
        const bodyCode = programToPreviewCode(node.body, depth + 1);
        return `${indent}repeat (${node.count} times) {\n${bodyCode}\n${indent}}`;
      }

      if (node.type === 'if') {
        const bodyCode = programToPreviewCode(node.body, depth + 1);
        let result = `${indent}if (drone.sensor("${node.sensor}")) {\n${bodyCode}\n${indent}}`;
        if (node.elseBody && node.elseBody.length > 0) {
          const elseCode = programToPreviewCode(node.elseBody, depth + 1);
          result += ` else {\n${elseCode}\n${indent}}`;
        }
        return result;
      }

      return `${indent}drone.${node.type}();`;
    })
    .join('\n');
}
