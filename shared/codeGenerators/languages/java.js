import { CodeBuilder } from '../codeBuilder.js';
import { ACTION_DESCRIPTIONS, getLoopVar, formatOperand, formatCondition, collectProgramVariables } from '../helpers.js';

/**
 * Generates idiomatic Java from a CodeVerse AST.
 *
 * @param {Array<object>} ast
 * @param {object} [options={}]
 * @returns {{ code: string, lines: string[], nodeLineMap: object, explanations: Array<object> }}
 */
export function generateJava(ast, options = {}) {
  const builder = new CodeBuilder('    ');
  const explanations = [
    {
      id: 'helpers',
      title: 'Helper APIs in Java',
      text: 'Methods on the drone object (such as drone.move() and drone.sensor()) are CodeVerse helper methods that control movement on the sector grid.'
    }
  ];

  if (!Array.isArray(ast) || ast.length === 0) {
    builder.addLine(0, '// CodeVerse Mission Program (Java)');
    builder.addLine(0, '// No blocks assembled yet.');
    builder.addLine(0, '// Drag and snap blocks together in the Blocks tab to build your program.');
    return {
      ...builder.getResult(),
      language: 'java',
      explanations
    };
  }

  if (options.includeHeader !== false) {
    builder.addLine(0, '// CodeVerse Mission Program (Java)');
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
        builder.addLine(0, `Integer ${v} = null;`);
      }
    } else {
      for (const v of programVars) {
        builder.addLine(0, `int ${v};`);
      }
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
        const headerText = `for (int ${loopVar} = 0; ${loopVar} < ${count}; ${loopVar}++) {`;
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
        const condStr = formatCondition(node.condition, null, 'java', options);
        let guardVar = null;
        if (options.boundedLoops) {
          guardVar = `_cv_loop_guard_${++loopGuardCounter}`;
          builder.addLine(depth, `int ${guardVar} = 0;`);
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
        const valStr = formatOperand(node.value, 'java', options);
        if (isRunnable) {
          builder.addLine(depth, `${varName} = drone.varSet("${varName}", ${valStr});`, node.nodeId, {
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
        const amt = typeof node.amount === 'number' ? node.amount : Number(formatOperand(node.amount, 'java', options));
        if (isRunnable) {
          builder.addLine(depth, `${varName} = drone.varChange("${varName}", ${varName}, ${amt});`, node.nodeId, {
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
        const condStr = formatCondition(node.condition, node.sensor, 'java', options);
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
      title: 'Java For-Loops',
      text: 'In Java, "for (int i = 0; i < count; i++)" explicitly specifies the integer loop variable, loop condition, and increment step.'
    });
  }

  if (hasWhile) {
    explanations.push({
      id: 'while',
      title: 'Java While Loops',
      text: 'In Java, "while (condition)" executes the body block as long as the condition evaluates to true. Mutating a counter inside the loop body allows normal termination.'
    });
  }

  if (hasVariables) {
    explanations.push({
      id: 'variables',
      title: 'Java Variables and Counters',
      text: 'Java is strongly typed. Integer variables are declared with "int name = initialValue;", and can be modified with operators such as "+=" or "-=".'
    });
  }

  if (hasSensor) {
    explanations.push({
      id: 'sensor',
      title: 'Java Conditionals',
      text: 'If-statements evaluate a boolean condition enclosed in parentheses. The statements inside { } execute when true.'
    });
  }

  return {
    ...builder.getResult(),
    language: 'java',
    explanations
  };
}
