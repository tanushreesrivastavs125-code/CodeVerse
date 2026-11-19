import { CodeBuilder } from '../codeBuilder.js';
import { ACTION_DESCRIPTIONS, getLoopVar, formatOperand, formatCondition, collectProgramVariables } from '../helpers.js';

/**
 * Generates idiomatic JavaScript from a CodeVerse AST.
 *
 * @param {Array<object>} ast
 * @param {object} [options={}]
 * @returns {{ code: string, lines: string[], nodeLineMap: object, explanations: Array<object> }}
 */
export function generateJavaScript(ast, options = {}) {
  const builder = new CodeBuilder('  ');
  const explanations = [
    {
      id: 'helpers',
      title: 'Helper APIs',
      text: 'Functions like drone.move() and drone.sensor() are CodeVerse helper APIs designed to control the drone on the sector grid, not built-in JavaScript keywords.'
    }
  ];

  if (!Array.isArray(ast) || ast.length === 0) {
    builder.addLine(0, '// CodeVerse Mission Program (JavaScript)');
    builder.addLine(0, '// No blocks assembled yet.');
    builder.addLine(0, '// Drag and snap blocks together in the Blocks tab to build your program.');
    return {
      ...builder.getResult(),
      language: 'javascript',
      explanations
    };
  }

  if (options.includeHeader !== false) {
    builder.addLine(0, '// CodeVerse Mission Program (JavaScript)');
    builder.addLine(0, '// Program executes sequentially from top to bottom.');
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

  if (programVars.length > 0) {
    if (isRunnable) {
      for (const v of programVars) {
        builder.addLine(0, `let ${v} = _cv_uninit('${v}', drone);`);
      }
    } else {
      builder.addLine(0, `let ${programVars.join(', ')};`);
      builder.addBlank();
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
        const headerText = `for (let ${loopVar} = 0; ${loopVar} < ${count}; ${loopVar}++) {`;
        builder.addLine(depth, headerText, node.nodeId, {
          blockId: node.blockId,
          type: 'repeat',
          count,
          loopVar
        });

        if (Array.isArray(node.body) && node.body.length > 0) {
          compileNodes(node.body, depth + 1, loopDepth + 1);
        }

        builder.addLine(depth, '}', node.nodeId, {
          blockId: node.blockId,
          type: 'repeat'
        });
      } else if (node.type === 'while') {
        hasWhile = true;
        const condStr = formatCondition(node.condition, null, 'javascript', options);
        let guardVar = null;
        if (options.boundedLoops) {
          guardVar = `_cv_loop_guard_${++loopGuardCounter}`;
          builder.addLine(depth, `let ${guardVar} = 0;`);
        }
        builder.addLine(depth, `while (${condStr}) {`, node.nodeId, {
          blockId: node.blockId,
          type: 'while',
          isCondition: true
        });

        if (options.boundedLoops && guardVar) {
          builder.addLine(depth + 1, `if (++${guardVar} > 200) { drone.fail("This loop kept repeating because its condition never became false. Try updating the counter inside it."); break; }`);
        }

        if (Array.isArray(node.body) && node.body.length > 0) {
          compileNodes(node.body, depth + 1, loopDepth);
        }

        builder.addLine(depth, '}', node.nodeId, {
          blockId: node.blockId,
          type: 'while'
        });
      } else if (node.type === 'var_set') {
        hasVariables = true;
        const varName = node.variable || node.var;
        const valStr = formatOperand(node.value, 'javascript', options);
        if (isRunnable) {
          builder.addLine(depth, `${varName} = _cv_set(drone, '${varName}', ${valStr});`, node.nodeId, {
            blockId: node.blockId,
            type: 'var_set',
            variable: varName,
            value: valStr
          });
        } else {
          builder.addLine(depth, `${varName} = ${valStr};`, node.nodeId, {
            blockId: node.blockId,
            type: 'var_set',
            variable: varName,
            value: valStr
          });
        }
      } else if (node.type === 'var_change') {
        hasVariables = true;
        const varName = node.variable || node.var;
        const amt = typeof node.amount === 'number' ? node.amount : Number(formatOperand(node.amount, 'javascript', options));
        if (isRunnable) {
          builder.addLine(depth, `${varName} = _cv_change(drone, '${varName}', ${varName}, ${amt});`, node.nodeId, {
            blockId: node.blockId,
            type: 'var_change',
            variable: varName,
            amount: amt
          });
        } else {
          const opStr = amt < 0 ? `-= ${Math.abs(amt)}` : `+= ${amt}`;
          builder.addLine(depth, `${varName} ${opStr};`, node.nodeId, {
            blockId: node.blockId,
            type: 'var_change',
            variable: varName,
            amount: amt
          });
        }
      } else if (node.type === 'if') {
        hasSensor = true;
        const condStr = formatCondition(node.condition, node.sensor, 'javascript', options);
        const headerText = `if (${condStr}) {`;
        builder.addLine(depth, headerText, node.nodeId, {
          blockId: node.blockId,
          type: 'if',
          sensor: node.sensor,
          isCondition: true
        });

        if (Array.isArray(node.body) && node.body.length > 0) {
          compileNodes(node.body, depth + 1, loopDepth);
        }

        if (Array.isArray(node.elseBody) && node.elseBody.length > 0) {
          builder.addLine(depth, '} else {', node.nodeId, {
            blockId: node.blockId,
            type: 'if',
            isElse: true
          });
          compileNodes(node.elseBody, depth + 1, loopDepth);
        }

        builder.addLine(depth, '}', node.nodeId, {
          blockId: node.blockId,
          type: 'if'
        });
      } else {
        const actionInfo = ACTION_DESCRIPTIONS[node.type];
        if (!actionInfo) {
          throw new Error(`Unsupported command node: "${node.type}".`);
        }
        builder.addLine(depth, `drone.${node.type}();`, node.nodeId, {
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
      title: 'Counting For-Loops',
      text: 'A "for" loop creates a loop counter and repeats the code enclosed inside curly braces { } exactly count times.'
    });
  }

  if (hasWhile) {
    explanations.push({
      id: 'while',
      title: 'While Loops',
      text: 'A "while (condition)" loop repeats its body continuously as long as the condition evaluates to true. Updating a variable inside the loop ensures it terminates safely.'
    });
  }

  if (hasVariables) {
    explanations.push({
      id: 'variables',
      title: 'Variables and Counters',
      text: 'Variables store data values in memory. In JavaScript, "let" declares a new variable, which can be modified using operators like += or -=.'
    });
  }

  if (hasSensor) {
    explanations.push({
      id: 'sensor',
      title: 'Conditional Branching',
      text: 'The "if (condition)" statement checks sector conditions or comparisons. The body runs only if the condition returns true; otherwise the else-branch executes.'
    });
  }

  return {
    ...builder.getResult(),
    language: 'javascript',
    explanations
  };
}
