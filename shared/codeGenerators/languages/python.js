import { CodeBuilder } from '../codeBuilder.js';
import { ACTION_DESCRIPTIONS, getLoopVar, formatOperand, formatCondition, collectProgramVariables } from '../helpers.js';

/**
 * Generates idiomatic Python 3 from a CodeVerse AST.
 *
 * @param {Array<object>} ast
 * @param {object} [options={}]
 * @returns {{ code: string, lines: string[], nodeLineMap: object, explanations: Array<object> }}
 */
export function generatePython(ast, options = {}) {
  const builder = new CodeBuilder('    ');
  const explanations = [
    {
      id: 'helpers',
      title: 'Helper APIs',
      text: 'Functions like drone.move() and drone.sensor() are CodeVerse helper APIs designed to control the drone on the sector grid, not built-in Python keywords.'
    }
  ];

  if (!Array.isArray(ast) || ast.length === 0) {
    builder.addLine(0, '# CodeVerse Mission Program (Python 3)');
    builder.addLine(0, '# No blocks assembled yet.');
    builder.addLine(0, '# Drag and snap blocks together in the Blocks tab to build your program.');
    return {
      ...builder.getResult(),
      language: 'python',
      explanations
    };
  }

  if (options.includeHeader !== false) {
    builder.addLine(0, '# CodeVerse Mission Program (Python 3)');
    builder.addLine(0, '# Program executes sequentially from top to bottom.');
    builder.addBlank();
  }

  let hasLoop = false;
  let hasSensor = false;
  let hasWhile = false;
  let hasVariables = false;
  let loopGuardCounter = 0;
  const programVars = collectProgramVariables(ast);
  if (programVars.length > 0) hasVariables = true;
  const isRunnable = Boolean(options.isRunnable || options.boundedLoops);

  if (isRunnable && programVars.length > 0) {
    for (const v of programVars) {
      builder.addLine(0, `${v} = _cv_uninit('${v}', drone)`);
    }
  }

  function compileNodes(nodes, depth = 0, loopDepth = 0) {
    for (const node of nodes) {
      if (!node || typeof node !== 'object') {
        throw new Error('Invalid command node in program sequence.');
      }

      if (node.type === 'repeat') {
        hasLoop = true;
        const count = node.count;
        const loopVar = getLoopVar(loopDepth, programVars);
        const headerText = `for ${loopVar} in range(${count}):`;
        builder.addLine(depth, headerText, node.nodeId, {
          blockId: node.blockId,
          type: 'repeat',
          count,
          loopVar
        });

        if (Array.isArray(node.body) && node.body.length > 0) {
          compileNodes(node.body, depth + 1, loopDepth + 1);
        } else {
          builder.addLine(depth + 1, 'pass', node.nodeId);
        }
      } else if (node.type === 'while') {
        hasWhile = true;
        const condStr = formatCondition(node.condition, null, 'python', options);
        let guardVar = null;
        if (options.boundedLoops) {
          guardVar = `_cv_loop_guard_${++loopGuardCounter}`;
          builder.addLine(depth, `${guardVar} = 0`);
        }
        builder.addLine(depth, `while ${condStr}:`, node.nodeId, {
          blockId: node.blockId,
          type: 'while',
          isCondition: true
        });

        if (options.boundedLoops && guardVar) {
          builder.addLine(depth + 1, `${guardVar} += 1`);
          builder.addLine(depth + 1, `if ${guardVar} > 200:`);
          builder.addLine(depth + 2, `drone.fail("This loop kept repeating because its condition never became false. Try updating the counter inside it.")`);
          builder.addLine(depth + 2, `break`);
        }

        if (Array.isArray(node.body) && node.body.length > 0) {
          compileNodes(node.body, depth + 1, loopDepth);
        } else if (!options.boundedLoops) {
          builder.addLine(depth + 1, 'pass', node.nodeId);
        }
      } else if (node.type === 'var_set') {
        hasVariables = true;
        const varName = node.variable || node.var;
        const valStr = formatOperand(node.value, 'python', options);
        if (isRunnable) {
          builder.addLine(depth, `${varName} = _cv_set(drone, '${varName}', ${valStr})`, node.nodeId, {
            blockId: node.blockId,
            type: 'var_set',
            variable: varName,
            value: valStr
          });
        } else {
          builder.addLine(depth, `${varName} = ${valStr}`, node.nodeId, {
            blockId: node.blockId,
            type: 'var_set',
            variable: varName,
            value: valStr
          });
        }
      } else if (node.type === 'var_change') {
        hasVariables = true;
        const varName = node.variable || node.var;
        const amt = typeof node.amount === 'number' ? node.amount : Number(formatOperand(node.amount, 'python', options));
        if (isRunnable) {
          builder.addLine(depth, `${varName} = _cv_change(drone, '${varName}', ${varName}, ${amt})`, node.nodeId, {
            blockId: node.blockId,
            type: 'var_change',
            variable: varName,
            amount: amt
          });
        } else {
          const opStr = amt < 0 ? `-= ${Math.abs(amt)}` : `+= ${amt}`;
          builder.addLine(depth, `${varName} ${opStr}`, node.nodeId, {
            blockId: node.blockId,
            type: 'var_change',
            variable: varName,
            amount: amt
          });
        }
      } else if (node.type === 'if') {
        hasSensor = true;
        const condStr = formatCondition(node.condition, node.sensor, 'python', options);
        const headerText = `if ${condStr}:`;
        builder.addLine(depth, headerText, node.nodeId, {
          blockId: node.blockId,
          type: 'if',
          sensor: node.sensor,
          isCondition: true
        });

        if (Array.isArray(node.body) && node.body.length > 0) {
          compileNodes(node.body, depth + 1, loopDepth);
        } else {
          builder.addLine(depth + 1, 'pass', node.nodeId);
        }

        if (Array.isArray(node.elseBody) && node.elseBody.length > 0) {
          builder.addLine(depth, 'else:', node.nodeId, {
            blockId: node.blockId,
            type: 'if',
            isElse: true
          });
          compileNodes(node.elseBody, depth + 1, loopDepth);
        }
      } else {
        const actionInfo = ACTION_DESCRIPTIONS[node.type];
        if (!actionInfo) {
          throw new Error(`Unsupported command node: "${node.type}".`);
        }
        builder.addLine(depth, `drone.${node.type}()`, node.nodeId, {
          blockId: node.blockId,
          type: node.type
        });
      }
    }
  }

  compileNodes(ast, 0, 0);

  if (hasLoop) {
    explanations.push({
      id: 'loop',
      title: 'Counting For-Loops in Python',
      text: 'In Python, "for i in range(count):" runs the indented code block count times. Python uses indentation (4 spaces) rather than curly braces to define code blocks.'
    });
  }

  if (hasWhile) {
    explanations.push({
      id: 'while',
      title: 'While Loops in Python',
      text: 'In Python, "while condition:" executes repeatedly as long as the condition evaluates to True. Changing a counter variable inside the loop body allows it to complete.'
    });
  }

  if (hasVariables) {
    explanations.push({
      id: 'variables',
      title: 'Variables and Counters in Python',
      text: 'Variables are assigned directly using "name = value". Counter variables can be updated using augmented assignments like "count += 1".'
    });
  }

  if (hasSensor) {
    explanations.push({
      id: 'sensor',
      title: 'Python If-Else Conditions',
      text: 'The "if condition:" statement checks sensor values or numerical comparisons. The indented block below it executes only if the condition is True.'
    });
  }

  return {
    ...builder.getResult(),
    language: 'python',
    explanations
  };
}
