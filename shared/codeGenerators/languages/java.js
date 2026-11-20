import { CodeBuilder } from '../codeBuilder.js';
import {
  ACTION_DESCRIPTIONS,
  getLoopVar,
  formatOperand,
  formatCondition,
  collectGlobalVariables,
  collectFunctionLocals,
  collectProgramArrays,
  partitionAst
} from '../helpers.js';

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
  let hasArrays = false;
  let hasFunctions = false;
  let loopGuardCounter = 0;

  const { functions, body } = partitionAst(ast);
  if (functions.length > 0) hasFunctions = true;

  const globalVars = collectGlobalVariables(ast);
  if (globalVars.length > 0) hasVariables = true;
  const globalArrays = collectProgramArrays(ast);
  if (globalArrays.length > 0) hasArrays = true;
  const isRunnable = Boolean(options.isRunnable || options.boundedLoops);

  const functionsBuilder = new CodeBuilder('    ');
  const bodyBuilder = new CodeBuilder('    ');

  if (globalVars.length > 0) {
    if (isRunnable) {
      for (const v of globalVars) {
        builder.addLine(0, `Integer ${v} = null;`);
      }
    } else {
      for (const v of globalVars) {
        builder.addLine(0, `int ${v};`);
      }
      builder.addBlank();
    }
  }

  if (globalArrays.length > 0) {
    if (isRunnable) {
      for (const a of globalArrays) {
        builder.addLine(0, `public static int[] ${a} = new int[0];`);
      }
    } else {
      for (const a of globalArrays) {
        builder.addLine(0, `int[] ${a};`);
      }
      builder.addBlank();
    }
  }

  // Compile function definitions first
  for (const fn of functions) {
    const fnLocals = collectFunctionLocals(fn);
    const paramDecls = (fn.params || []).map(p => `int ${p}`).join(', ');
    builder.addLine(0, `public static void ${fn.name}(${paramDecls}) {`, fn.nodeId, {
      blockId: fn.blockId,
      type: 'fn_def',
      name: fn.name
    });
    functionsBuilder.addLine(0, `public static void ${fn.name}(${paramDecls}) {`);

    if (isRunnable) {
      builder.addLine(1, `_cv_enter_fn("${fn.name}");`);
      functionsBuilder.addLine(1, `_cv_enter_fn("${fn.name}");`);
    }

    if (fnLocals.length > 0) {
      hasVariables = true;
      for (const v of fnLocals) {
        if (isRunnable) {
          builder.addLine(1, `Integer ${v} = null;`);
          functionsBuilder.addLine(1, `Integer ${v} = null;`);
        } else {
          builder.addLine(1, `int ${v};`);
          functionsBuilder.addLine(1, `int ${v};`);
        }
      }
    }

    if (isRunnable) {
      builder.addLine(1, 'try {');
      functionsBuilder.addLine(1, 'try {');
      compileNodes(builder, fn.body || [], 2, 0);
      compileNodes(functionsBuilder, fn.body || [], 2, 0);
      builder.addLine(1, '} finally {');
      functionsBuilder.addLine(1, '} finally {');
      builder.addLine(2, '_cv_exit_fn();');
      functionsBuilder.addLine(2, '_cv_exit_fn();');
      builder.addLine(1, '}');
      functionsBuilder.addLine(1, '}');
    } else {
      compileNodes(builder, fn.body || [], 1, 0);
      compileNodes(functionsBuilder, fn.body || [], 1, 0);
    }

    builder.addLine(0, '}', fn.nodeId, {
      blockId: fn.blockId,
      type: 'fn_def'
    });
    functionsBuilder.addLine(0, '}');
    builder.addBlank();
    functionsBuilder.addBlank();
  }

  function compileNodes(targetBuilder, nodes, depth = 0, loopDepth = 0) {
    for (const node of nodes) {
      if (!node || typeof node !== 'object') {
        throw new Error('Invalid command node in program sequence.');
      }

      if (node.type === 'fn_def') {
        continue;
      }

      if (node.type === 'fn_call') {
        hasFunctions = true;
        const argsStr = (node.args || []).map(a => formatOperand(a, 'java', options)).join(', ');
        targetBuilder.addLine(depth, `${node.name}(${argsStr});`, node.nodeId, {
          blockId: node.blockId,
          type: 'fn_call',
          name: node.name
        });
      } else if (node.type === 'repeat') {
        hasLoop = true;
        const count = node.count;
        const loopVar = getLoopVar(loopDepth, globalVars);
        const headerText = `for (int ${loopVar} = 0; ${loopVar} < ${count}; ${loopVar}++) {`;
        targetBuilder.addLine(depth, headerText, node.nodeId, {
          blockId: node.blockId,
          type: 'repeat',
          count,
          loopVar
        });

        if (Array.isArray(node.body) && node.body.length > 0) {
          compileNodes(targetBuilder, node.body, depth + 1, loopDepth + 1);
        }

        targetBuilder.addLine(depth, '}', node.nodeId, {
          blockId: node.blockId,
          type: 'repeat'
        });
      } else if (node.type === 'while') {
        hasWhile = true;
        const condStr = formatCondition(node.condition, null, 'java', options);
        let guardVar = null;
        if (options.boundedLoops) {
          guardVar = `_cv_loop_guard_${++loopGuardCounter}`;
          targetBuilder.addLine(depth, `int ${guardVar} = 0;`);
        }
        targetBuilder.addLine(depth, `while (${condStr}) {`, node.nodeId, {
          blockId: node.blockId,
          type: 'while',
          isCondition: true
        });

        if (options.boundedLoops && guardVar) {
          targetBuilder.addLine(depth + 1, `if (++${guardVar} > 200) { drone.fail("This loop kept repeating because its condition never became false. Try updating the counter inside it."); break; }`);
        }

        if (Array.isArray(node.body) && node.body.length > 0) {
          compileNodes(targetBuilder, node.body, depth + 1, loopDepth);
        }

        targetBuilder.addLine(depth, '}', node.nodeId, {
          blockId: node.blockId,
          type: 'while'
        });
      } else if (node.type === 'var_set') {
        hasVariables = true;
        const varName = node.variable || node.var;
        const valStr = formatOperand(node.value, 'java', options);
        if (isRunnable) {
          targetBuilder.addLine(depth, `${varName} = drone.varSet("${varName}", ${valStr});`, node.nodeId, {
            blockId: node.blockId,
            type: 'var_set',
            variable: varName,
            value: valStr
          });
        } else {
          targetBuilder.addLine(depth, `${varName} = ${valStr};`, node.nodeId, {
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
          targetBuilder.addLine(depth, `${varName} = drone.varChange("${varName}", ${varName}, ${amt});`, node.nodeId, {
            blockId: node.blockId,
            type: 'var_change',
            variable: varName,
            amount: amt
          });
        } else {
          const opStr = amt < 0 ? `-= ${Math.abs(amt)}` : `+= ${amt}`;
          targetBuilder.addLine(depth, `${varName} ${opStr};`, node.nodeId, {
            blockId: node.blockId,
            type: 'var_change',
            variable: varName,
            amount: amt
          });
        }
      } else if (node.type === 'array_init') {
        hasArrays = true;
        const arrName = node.name || node.array;
        const rawVals = Array.isArray(node.values) ? node.values : (Array.isArray(node.elements) ? node.elements : []);
        const elemsStr = rawVals.map(e => formatOperand(e, 'java', options)).join(', ');
        if (isRunnable) {
          targetBuilder.addLine(depth, `${arrName} = _cv_arr_init("${arrName}", new int[] { ${elemsStr} });`, node.nodeId, {
            blockId: node.blockId,
            type: 'array_init',
            array: arrName
          });
        } else {
          targetBuilder.addLine(depth, `${arrName} = new int[] { ${elemsStr} };`, node.nodeId, {
            blockId: node.blockId,
            type: 'array_init',
            array: arrName
          });
        }
      } else if (node.type === 'array_set') {
        hasArrays = true;
        const arrName = node.name || node.array;
        const idxStr = formatOperand(node.index !== undefined ? node.index : 0, 'java', options);
        const valStr = formatOperand(node.value !== undefined ? node.value : 0, 'java', options);
        if (isRunnable) {
          targetBuilder.addLine(depth, `_cv_arr_set("${arrName}", ${arrName}, ${idxStr}, ${valStr});`, node.nodeId, {
            blockId: node.blockId,
            type: 'array_set',
            array: arrName,
            index: idxStr,
            value: valStr
          });
        } else {
          targetBuilder.addLine(depth, `${arrName}[${idxStr}] = ${valStr};`, node.nodeId, {
            blockId: node.blockId,
            type: 'array_set',
            array: arrName,
            index: idxStr,
            value: valStr
          });
        }
      } else if (node.type === 'if') {
        hasSensor = true;
        const condStr = formatCondition(node.condition, node.sensor, 'java', options);
        const headerText = `if (${condStr}) {`;
        targetBuilder.addLine(depth, headerText, node.nodeId, {
          blockId: node.blockId,
          type: 'if',
          sensor: node.sensor,
          isCondition: true
        });

        if (Array.isArray(node.body) && node.body.length > 0) {
          compileNodes(targetBuilder, node.body, depth + 1, loopDepth);
        }

        if (Array.isArray(node.elseBody) && node.elseBody.length > 0) {
          targetBuilder.addLine(depth, '} else {', node.nodeId, {
            blockId: node.blockId,
            type: 'if',
            isElse: true
          });
          compileNodes(targetBuilder, node.elseBody, depth + 1, loopDepth);
        }

        targetBuilder.addLine(depth, '}', node.nodeId, {
          blockId: node.blockId,
          type: 'if'
        });
      } else {
        const actionInfo = ACTION_DESCRIPTIONS[node.type];
        if (!actionInfo) {
          throw new Error(`Unsupported command node: "${node.type}".`);
        }
        targetBuilder.addLine(depth, `drone.${node.type}();`, node.nodeId, {
          blockId: node.blockId,
          type: node.type
        });
      }
    }
  }

  compileNodes(builder, body, 0, 0);
  compileNodes(bodyBuilder, body, 0, 0);

  if (hasFunctions) {
    explanations.push({
      id: 'functions',
      title: 'Routines and Methods in Java',
      text: 'In Java, "public static void name(params)" declares a procedure. Calling the procedure passes arguments into its parameters.'
    });
  }

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

  if (hasArrays) {
    explanations.push({
      id: 'arrays',
      title: 'Java Arrays and Indexing',
      text: 'Java arrays are fixed-length sequences of integers indexed from 0 to length - 1. Access elements using array[index] and modify them using array[index] = value.'
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
    explanations,
    functionsCode: functionsBuilder.getCode(),
    bodyCode: bodyBuilder.getCode(),
    globalVars,
    globalArrays
  };
}
