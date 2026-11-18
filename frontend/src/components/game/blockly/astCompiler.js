const SENSOR_MAP = new Set(['wall', 'energy', 'hazard', 'terminal', 'guardian']);
const COMPARISON_MAP = new Set(['<', '<=', '==', '!=', '>', '>=']);

/**
 * Extracts an operand value (variable or number) from a connected block.
 *
 * @param {object | null} block
 * @param {any} [fallback=0]
 * @returns {object | number | string}
 */
function extractOperand(block, fallback = 0) {
  if (!block) return fallback;

  if (block.type === 'cv_var_get') {
    const varName = block.getFieldValue('VAR') || 'count';
    return { type: 'var_get', var: varName };
  }

  if (block.type === 'math_number' || block.type === 'cv_val_num') {
    const num = Number.parseInt(block.getFieldValue('NUM'), 10);
    return Number.isNaN(num) ? 0 : num;
  }

  return fallback;
}

/**
 * Extracts condition (sensor or comparison) from a connected condition block.
 *
 * @param {object | null} condBlock
 * @returns {object} Condition AST node
 */
function extractCondition(condBlock) {
  if (!condBlock) {
    throw new Error('Condition incomplete: attach a sensor block or comparison condition block.');
  }

  if (condBlock.type === 'cv_sensor') {
    const sensorVal = condBlock.getFieldValue('SENSOR');
    if (sensorVal && SENSOR_MAP.has(sensorVal)) {
      return { type: 'sensor', sensor: sensorVal };
    }
    throw new Error(`Unrecognized sensor value: "${sensorVal || 'none'}".`);
  }

  if (condBlock.type === 'cv_compare') {
    const op = condBlock.getFieldValue('OP') || '<';
    if (!COMPARISON_MAP.has(op)) {
      throw new Error(`Unsupported comparison operator: "${op}".`);
    }
    const leftBlock = condBlock.getInputTargetBlock('LEFT');
    const rightBlock = condBlock.getInputTargetBlock('RIGHT');
    const left = extractOperand(leftBlock, { type: 'var_get', var: 'count' });
    const right = extractOperand(rightBlock, 0);

    return {
      type: 'compare',
      left,
      op,
      right
    };
  }

  throw new Error(`Unrecognized condition block: ${condBlock.type}. Connect a sensor or comparison.`);
}

/**
 * Extracts sensor identifier from a connected sensor block (backward compatibility).
 *
 * @param {object | null} sensorBlock
 * @returns {string}
 */
function extractSensor(sensorBlock) {
  const cond = extractCondition(sensorBlock);
  if (cond.type === 'sensor') {
    return cond.sensor;
  }
  return 'wall';
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

    if (type === 'cv_var_set') {
      const varName = current.getFieldValue('VAR') || 'count';
      const inputValBlock = current.getInputTargetBlock ? current.getInputTargetBlock('VALUE') : null;
      let value = 0;
      if (inputValBlock) {
        value = extractOperand(inputValBlock, 0);
        if (value && typeof value === 'object' && value.type === 'literal') {
          value = value.value;
        }
      } else {
        const rawVal = current.getFieldValue('VALUE');
        const parsed = Number.parseInt(rawVal, 10);
        value = Number.isNaN(parsed) ? 0 : parsed;
      }
      const varSetNode = {
        type: 'var_set',
        var: varName,
        variable: varName,
        value
      };
      if (current.id) {
        varSetNode.nodeId = current.id;
        varSetNode.blockId = current.id;
      }
      nodes.push(varSetNode);
    } else if (type === 'cv_var_change') {
      const varName = current.getFieldValue('VAR') || 'count';
      const rawAmt = current.getFieldValue('AMOUNT') ?? current.getFieldValue('DELTA');
      const amount = Number.parseInt(rawAmt, 10);
      const varChangeNode = {
        type: 'var_change',
        var: varName,
        variable: varName,
        amount: Number.isNaN(amount) ? 1 : amount
      };
      if (current.id) {
        varChangeNode.nodeId = current.id;
        varChangeNode.blockId = current.id;
      }
      nodes.push(varChangeNode);
    } else if (type === 'cv_while') {
      const cond = extractCondition(current.getInputTargetBlock('CONDITION'));
      const bodyBlock = current.getInputTargetBlock('DO');

      const whileNode = {
        type: 'while',
        condition: cond,
        body: bodyBlock ? compileBlockSequence(bodyBlock) : []
      };
      if (cond.type === 'sensor') {
        whileNode.sensor = cond.sensor;
      }
      if (current.id) {
        whileNode.nodeId = current.id;
        whileNode.blockId = current.id;
      }
      nodes.push(whileNode);
    } else if (type.startsWith('cv_') && type !== 'cv_sensor' && type !== 'cv_compare' && type !== 'cv_var_get') {
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

        const repeatNode = {
          type: 'repeat',
          count,
          body: compileBlockSequence(bodyBlock)
        };
        if (current.id) {
          repeatNode.nodeId = current.id;
          repeatNode.blockId = current.id;
        }
        nodes.push(repeatNode);
      } else if (actionName === 'if') {
        const cond = extractCondition(current.getInputTargetBlock('SENSOR'));
        const bodyBlock = current.getInputTargetBlock('DO');
        if (!bodyBlock) {
          throw new Error('The if-condition block must contain at least one action inside.');
        }

        const ifNode = {
          type: 'if',
          body: compileBlockSequence(bodyBlock),
          elseBody: []
        };
        if (cond.type === 'sensor') {
          ifNode.sensor = cond.sensor;
        } else {
          ifNode.condition = cond;
        }
        if (current.id) {
          ifNode.nodeId = current.id;
          ifNode.blockId = current.id;
        }
        nodes.push(ifNode);
      } else if (actionName === 'if_else') {
        const cond = extractCondition(current.getInputTargetBlock('SENSOR'));
        const bodyBlock = current.getInputTargetBlock('DO');
        if (!bodyBlock) {
          throw new Error('The then-branch of the if/else block must contain at least one action.');
        }

        const elseBlock = current.getInputTargetBlock('ELSE');
        const elseBody = elseBlock ? compileBlockSequence(elseBlock) : [];

        const ifElseNode = {
          type: 'if',
          body: compileBlockSequence(bodyBlock),
          elseBody
        };
        if (cond.type === 'sensor') {
          ifElseNode.sensor = cond.sensor;
        } else {
          ifElseNode.condition = cond;
        }
        if (current.id) {
          ifElseNode.nodeId = current.id;
          ifElseNode.blockId = current.id;
        }
        nodes.push(ifElseNode);
      } else {
        // Simple atomic actions: move, left, right, collect, jump, activate, pulse
        const actionNode = { type: actionName };
        if (current.id) {
          actionNode.nodeId = current.id;
          actionNode.blockId = current.id;
        }
        nodes.push(actionNode);
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

      const extRepeatNode = {
        type: 'repeat',
        count,
        body: compileBlockSequence(bodyBlock)
      };
      if (current.id) {
        extRepeatNode.nodeId = current.id;
        extRepeatNode.blockId = current.id;
      }
      nodes.push(extRepeatNode);
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
        if (current.id) {
          branch.nodeId = `${current.id}_${i}`;
          branch.blockId = current.id;
        }

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
    } else if (type === 'cv_sensor' || type === 'math_number' || type === 'cv_compare' || type === 'cv_var_get' || type === 'cv_val_num') {
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
        } else if (n.type === 'while') {
          if (n.body && n.body.length > 0) {
            checkNodes(n.body, depth + 1);
          }
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
      if (node.type === 'var_set') {
        const val = typeof node.value === 'object' ? (node.value?.var ?? '0') : node.value;
        const vName = node.var || node.variable;
        return `${indent}let ${vName} = ${val};`;
      }

      if (node.type === 'var_change') {
        const amt = node.amount ?? 1;
        const vName = node.var || node.variable;
        if (amt < 0) {
          return `${indent}${vName} -= ${Math.abs(amt)};`;
        }
        return `${indent}${vName} += ${amt};`;
      }

      if (node.type === 'repeat') {
        const bodyCode = programToPreviewCode(node.body, depth + 1);
        return `${indent}repeat (${node.count} times) {\n${bodyCode}\n${indent}}`;
      }

      if (node.type === 'while') {
        const bodyCode = programToPreviewCode(node.body || [], depth + 1);
        let condStr = '';
        if (node.condition?.type === 'compare') {
          const left = node.condition.left?.var ?? node.condition.left;
          const right = node.condition.right?.var ?? node.condition.right;
          condStr = `${left} ${node.condition.op} ${right}`;
        } else {
          condStr = `drone.sensor("${node.sensor || node.condition?.sensor || 'wall'}")`;
        }
        return `${indent}while (${condStr}) {\n${bodyCode}\n${indent}}`;
      }

      if (node.type === 'if') {
        const bodyCode = programToPreviewCode(node.body, depth + 1);
        let condStr = '';
        if (node.condition?.type === 'compare') {
          const left = node.condition.left?.var ?? node.condition.left;
          const right = node.condition.right?.var ?? node.condition.right;
          condStr = `${left} ${node.condition.op} ${right}`;
        } else {
          condStr = `drone.sensor("${node.sensor || node.condition?.sensor || 'wall'}")`;
        }
        let result = `${indent}if (${condStr}) {\n${bodyCode}\n${indent}}`;
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

export {
  generateCode,
  SUPPORTED_LANGUAGES,
  LANGUAGE_METADATA,
  generateSnippetExport,
  generateRunnableExport,
  buildExportReadme
} from '../../../../../shared/codeGenerators/index.js';

