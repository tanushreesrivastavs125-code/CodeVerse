import { CodeBuilder } from '../codeBuilder.js';
import { ACTION_DESCRIPTIONS, getLoopVar, formatOperand, formatCondition } from '../helpers.js';

/**
 * Generates standard C++ from a CodeVerse AST.
 *
 * @param {Array<object>} ast
 * @param {object} [options={}]
 * @returns {{ code: string, lines: string[], nodeLineMap: object, explanations: Array<object> }}
 */
export function generateCpp(ast, options = {}) {
  const builder = new CodeBuilder('    ');
  const explanations = [
    {
      id: 'helpers',
      title: 'Helper APIs in C++',
      text: 'Methods on the drone reference (such as drone.move() and drone.sensor()) are CodeVerse helper routines controlling the drone on the sector grid.'
    }
  ];

  if (!Array.isArray(ast) || ast.length === 0) {
    builder.addLine(0, '// CodeVerse Mission Program (C++)');
    builder.addLine(0, '// No blocks assembled yet.');
    builder.addLine(0, '// Drag and snap blocks together in the Blocks tab to build your program.');
    return {
      ...builder.getResult(),
      language: 'cpp',
      explanations
    };
  }

  if (options.includeHeader !== false) {
    builder.addLine(0, '// CodeVerse Mission Program (C++)');
    builder.addLine(0, '// Program executes sequentially from top to bottom.');
    builder.addBlank();
  }

  let hasLoop = false;
  let hasSensor = false;
  let hasWhile = false;
  let hasVariables = false;
  let loopGuardCounter = 0;
  const declaredVars = new Set();

  function compileNodes(nodes, depth = 0, loopDepth = 0) {
    for (const node of nodes) {
      if (!node || typeof node !== 'object') {
        throw new Error('Invalid command node in program sequence.');
      }

      if (node.type === 'repeat') {
        hasLoop = true;
        const count = node.count;
        const loopVar = getLoopVar(loopDepth);
        const headerText = `for (int ${loopVar} = 0; ${loopVar} < ${count}; ++${loopVar}) {`;
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
        const condStr = formatCondition(node.condition, null, 'cpp');
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
        const varName = node.variable;
        const valStr = formatOperand(node.value);
        if (!declaredVars.has(varName)) {
          builder.addLine(depth, `int ${varName} = ${valStr};`, node.nodeId, {
            blockId: node.blockId,
            type: 'var_set',
            variable: varName,
            value: valStr
          });
          declaredVars.add(varName);
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
        const varName = node.variable;
        const amt = typeof node.amount === 'number' ? node.amount : Number(formatOperand(node.amount));
        const opStr = amt < 0 ? `-= ${Math.abs(amt)}` : `+= ${amt}`;
        builder.addLine(depth, `${varName} ${opStr};`, node.nodeId, {
          blockId: node.blockId,
          type: 'var_change',
          variable: varName,
          amount: amt
        });
      } else if (node.type === 'if') {
        hasSensor = true;
        const condStr = formatCondition(node.condition, node.sensor, 'cpp');
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
      title: 'C++ For-Loops',
      text: 'The "for (int i = 0; i < count; ++i)" loop uses pre-increment (++i) to iterate through count repetitions.'
    });
  }

  if (hasWhile) {
    explanations.push({
      id: 'while',
      title: 'C++ While Loops',
      text: 'The "while (condition)" loop checks the boolean expression prior to each repetition. Ensure a loop counter is incremented or decremented so the loop terminates.'
    });
  }

  if (hasVariables) {
    explanations.push({
      id: 'variables',
      title: 'C++ Variables',
      text: 'In C++, variables are statically typed. Integer counters are declared with "int counter = 0;" and modified with arithmetic assignment operators like "+=".'
    });
  }

  if (hasSensor) {
    explanations.push({
      id: 'sensor',
      title: 'C++ Branching',
      text: 'If-else statements test conditions returning bool. Scopes delimited by { } ensure structured execution.'
    });
  }

  return {
    ...builder.getResult(),
    language: 'cpp',
    explanations
  };
}
