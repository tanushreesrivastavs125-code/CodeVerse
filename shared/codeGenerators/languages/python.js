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

  if (isRunnable && globalVars.length > 0) {
    for (const v of globalVars) {
      builder.addLine(0, `${v} = _cv_uninit('${v}', drone)`);
    }
  }

  if (isRunnable && globalArrays.length > 0) {
    for (const a of globalArrays) {
      builder.addLine(0, `${a} = []`);
    }
  }

  // Compile function definitions first
  for (const fn of functions) {
    const fnLocals = collectFunctionLocals(fn);
    builder.addLine(0, `def ${fn.name}(${(fn.params || []).join(', ')}):`, fn.nodeId, {
      blockId: fn.blockId,
      type: 'fn_def',
      name: fn.name
    });

    if (isRunnable) {
      builder.addLine(1, `_cv_enter_fn('${fn.name}')`);
      if (fnLocals.length > 0) {
        hasVariables = true;
        for (const v of fnLocals) {
          builder.addLine(1, `${v} = _cv_uninit('${v}', drone)`);
        }
      }
      builder.addLine(1, 'try:');
      if (Array.isArray(fn.body) && fn.body.length > 0) {
        compileNodes(fn.body, 2, 0);
      } else {
        builder.addLine(2, 'pass');
      }
      builder.addLine(1, 'finally:');
      builder.addLine(2, '_cv_exit_fn()');
    } else {
      if (Array.isArray(fn.body) && fn.body.length > 0) {
        compileNodes(fn.body, 1, 0);
      } else {
        builder.addLine(1, 'pass');
      }
    }
    builder.addBlank();
  }

  function compileNodes(nodes, depth = 0, loopDepth = 0) {
    for (const node of nodes) {
      if (!node || typeof node !== 'object') {
        throw new Error('Invalid command node in program sequence.');
      }

      if (node.type === 'fn_def') {
        continue;
      }

      if (node.type === 'fn_call') {
        hasFunctions = true;
        const argsStr = (node.args || []).map(a => formatOperand(a, 'python', options)).join(', ');
        builder.addLine(depth, `${node.name}(${argsStr})`, node.nodeId, {
          blockId: node.blockId,
          type: 'fn_call',
          name: node.name
        });
      } else if (node.type === 'repeat') {
        hasLoop = true;
        const count = node.count;
        const loopVar = getLoopVar(loopDepth, globalVars);
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
      } else if (node.type === 'array_init') {
        hasArrays = true;
        const arrName = node.name || node.array;
        const rawVals = Array.isArray(node.values) ? node.values : (Array.isArray(node.elements) ? node.elements : []);
        const elemsStr = rawVals.map(e => formatOperand(e, 'python', options)).join(', ');
        if (isRunnable) {
          builder.addLine(depth, `${arrName} = _cv_arr_init(drone, '${arrName}', [${elemsStr}])`, node.nodeId, {
            blockId: node.blockId,
            type: 'array_init',
            array: arrName
          });
        } else {
          builder.addLine(depth, `${arrName} = [${elemsStr}]`, node.nodeId, {
            blockId: node.blockId,
            type: 'array_init',
            array: arrName
          });
        }
      } else if (node.type === 'array_set') {
        hasArrays = true;
        const arrName = node.name || node.array;
        const idxStr = formatOperand(node.index !== undefined ? node.index : 0, 'python', options);
        const valStr = formatOperand(node.value !== undefined ? node.value : 0, 'python', options);
        if (isRunnable) {
          builder.addLine(depth, `_cv_arr_set(drone, '${arrName}', ${arrName}, ${idxStr}, ${valStr})`, node.nodeId, {
            blockId: node.blockId,
            type: 'array_set',
            array: arrName,
            index: idxStr,
            value: valStr
          });
        } else {
          builder.addLine(depth, `${arrName}[${idxStr}] = ${valStr}`, node.nodeId, {
            blockId: node.blockId,
            type: 'array_set',
            array: arrName,
            index: idxStr,
            value: valStr
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

  compileNodes(body, 0, 0);

  if (hasFunctions) {
    explanations.push({
      id: 'functions',
      title: 'Routines and Functions in Python',
      text: 'In Python, "def name(params):" defines a reusable routine. Calling the routine creates an isolated local frame for its parameters and variables.'
    });
  }

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

  if (hasArrays) {
    explanations.push({
      id: 'arrays',
      title: 'Lists and Indexing',
      text: 'Lists in Python store an ordered collection of values indexed starting at 0. Access items with items[i] and update items with items[i] = value.'
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
