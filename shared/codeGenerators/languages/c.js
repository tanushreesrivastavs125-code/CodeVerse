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
 * Generates standard C99 from a CodeVerse AST.
 *
 * @param {Array<object>} ast
 * @param {object} [options={}]
 * @returns {{ code: string, lines: string[], nodeLineMap: object, explanations: Array<object> }}
 */
export function generateC(ast, options = {}) {
  const builder = new CodeBuilder('    ');
  const explanations = [
    {
      id: 'helpers',
      title: 'Helper Functions in C',
      text: 'Procedural functions such as drone_move() and drone_sensor() are CodeVerse library helpers that communicate with the sector grid.'
    }
  ];

  if (!Array.isArray(ast) || ast.length === 0) {
    builder.addLine(0, '// CodeVerse Mission Program (C)');
    builder.addLine(0, '// No blocks assembled yet.');
    builder.addLine(0, '// Drag and snap blocks together in the Blocks tab to build your program.');
    return {
      ...builder.getResult(),
      language: 'c',
      explanations
    };
  }

  if (options.includeHeader !== false) {
    builder.addLine(0, '// CodeVerse Mission Program (C)');
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

  const prototypesBuilder = new CodeBuilder('    ');
  const functionsBuilder = new CodeBuilder('    ');
  const bodyBuilder = new CodeBuilder('    ');

  if (globalVars.length > 0) {
    if (isRunnable) {
      for (const v of globalVars) {
        builder.addLine(0, `CvVar ${v} = _cv_var_init("${v}");`);
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
        builder.addLine(0, `static CvArray ${a};`);
      }
    } else {
      for (const a of globalArrays) {
        builder.addLine(0, `CvArray ${a};`);
      }
      builder.addBlank();
    }
  }

  // Prototypes for functions
  for (const fn of functions) {
    const paramDecls = fn.params?.length
      ? (isRunnable ? fn.params.map(p => `int _cv_param_${p}`).join(', ') : fn.params.map(p => `int ${p}`).join(', '))
      : 'void';
    builder.addLine(0, `void ${fn.name}(${paramDecls});`);
    prototypesBuilder.addLine(0, `void ${fn.name}(${paramDecls});`);
  }
  if (functions.length > 0) {
    builder.addBlank();
    prototypesBuilder.addBlank();
  }

  // Function definitions
  for (const fn of functions) {
    const fnLocals = collectFunctionLocals(fn);
    const paramDecls = fn.params?.length
      ? (isRunnable ? fn.params.map(p => `int _cv_param_${p}`).join(', ') : fn.params.map(p => `int ${p}`).join(', '))
      : 'void';
    builder.addLine(0, `void ${fn.name}(${paramDecls}) {`, fn.nodeId, {
      blockId: fn.blockId,
      type: 'fn_def',
      name: fn.name
    });
    functionsBuilder.addLine(0, `void ${fn.name}(${paramDecls}) {`);

    if (isRunnable) {
      builder.addLine(1, `_cv_enter_fn("${fn.name}");`);
      functionsBuilder.addLine(1, `_cv_enter_fn("${fn.name}");`);
      builder.addLine(1, 'if (g_crashed) return;');
      functionsBuilder.addLine(1, 'if (g_crashed) return;');

      if (fn.params?.length) {
        hasVariables = true;
        for (const p of fn.params) {
          builder.addLine(1, `CvVar ${p} = _cv_var_init("${p}");`);
          functionsBuilder.addLine(1, `CvVar ${p} = _cv_var_init("${p}");`);
          builder.addLine(1, `_cv_var_set(&${p}, _cv_param_${p});`);
          functionsBuilder.addLine(1, `_cv_var_set(&${p}, _cv_param_${p});`);
        }
      }
    }

    if (fnLocals.length > 0) {
      hasVariables = true;
      for (const v of fnLocals) {
        if (isRunnable) {
          builder.addLine(1, `CvVar ${v} = _cv_var_init("${v}");`);
          functionsBuilder.addLine(1, `CvVar ${v} = _cv_var_init("${v}");`);
        } else {
          builder.addLine(1, `int ${v} = 0;`);
          functionsBuilder.addLine(1, `int ${v} = 0;`);
        }
      }
    }

    compileNodes(builder, fn.body || [], 1, 0);
    compileNodes(functionsBuilder, fn.body || [], 1, 0);

    if (isRunnable) {
      builder.addLine(1, `_cv_exit_fn();`);
      functionsBuilder.addLine(1, `_cv_exit_fn();`);
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
        const argsStr = (node.args || []).map(a => formatOperand(a, 'c', options)).join(', ');
        targetBuilder.addLine(depth, `${node.name}(${argsStr});`, node.nodeId, {
          blockId: node.blockId,
          type: 'fn_call',
          name: node.name
        });
      } else if (node.type === 'repeat') {
        hasLoop = true;
        const count = node.count;
        const loopVar = getLoopVar(loopDepth, globalVars);
        const headerText = `for (int ${loopVar} = 0; ${loopVar} < ${count}; ++${loopVar}) {`;
        targetBuilder.addLine(depth, headerText, node.nodeId, {
          blockId: node.blockId,
          type: 'repeat',
          count,
          loopVar
        });

        if (isRunnable) {
          targetBuilder.addLine(depth + 1, 'if (g_crashed) break;');
        }

        if (Array.isArray(node.body) && node.body.length > 0) {
          compileNodes(targetBuilder, node.body, depth + 1, loopDepth + 1);
        }

        targetBuilder.addLine(depth, '}', node.nodeId, {
          blockId: node.blockId,
          type: 'repeat'
        });
      } else if (node.type === 'while') {
        hasWhile = true;
        const condStr = formatCondition(node.condition, null, 'c', options);
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

        if (isRunnable) {
          targetBuilder.addLine(depth + 1, 'if (g_crashed) break;');
        }

        if (options.boundedLoops && guardVar) {
          targetBuilder.addLine(depth + 1, `if (++${guardVar} > 200) { drone_fail("This loop kept repeating because its condition never became false. Try updating the counter inside it."); break; }`);
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
        const valStr = formatOperand(node.value, 'c', options);
        if (isRunnable) {
          targetBuilder.addLine(depth, `_cv_var_set(&${varName}, ${valStr});`, node.nodeId, {
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
        const amt = typeof node.amount === 'number' ? node.amount : Number(formatOperand(node.amount, 'c', options));
        if (isRunnable) {
          targetBuilder.addLine(depth, `_cv_var_change(&${varName}, ${amt});`, node.nodeId, {
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
        const elemsStr = rawVals.map(e => formatOperand(e, 'c', options)).join(', ');
        targetBuilder.addLine(depth, `{ int _init_vals[] = { ${elemsStr.length ? elemsStr : '0'} }; _cv_arr_init(&${arrName}, "${arrName}", _init_vals, ${rawVals.length}); }`, node.nodeId, {
          blockId: node.blockId,
          type: 'array_init',
          array: arrName
        });
      } else if (node.type === 'array_set') {
        hasArrays = true;
        const arrName = node.name || node.array;
        const idxStr = formatOperand(node.index !== undefined ? node.index : 0, 'c', options);
        const valStr = formatOperand(node.value !== undefined ? node.value : 0, 'c', options);
        targetBuilder.addLine(depth, `_cv_arr_set(&${arrName}, ${idxStr}, ${valStr});`, node.nodeId, {
          blockId: node.blockId,
          type: 'array_set',
          array: arrName,
          index: idxStr,
          value: valStr
        });
      } else if (node.type === 'if') {
        hasSensor = true;
        const condStr = formatCondition(node.condition, node.sensor, 'c', options);
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
        targetBuilder.addLine(depth, `drone_${node.type}();`, node.nodeId, {
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
      title: 'Procedural Routines in C',
      text: 'In C99, functions bundle reusable instructions. Function prototypes declare the name and parameter signature before invocation.'
    });
  }

  if (hasLoop) {
    explanations.push({
      id: 'loop',
      title: 'C99 For-Loops',
      text: 'In C99, loop counters can be declared inside the for statement: "for (int i = 0; i < count; ++i)".'
    });
  }

  if (hasWhile) {
    explanations.push({
      id: 'while',
      title: 'C While Loops',
      text: 'The "while (condition)" loop checks the expression on each pass. Modifying the loop variable inside the body prevents indefinite loops.'
    });
  }

  if (hasVariables) {
    explanations.push({
      id: 'variables',
      title: 'C Variables',
      text: 'In C99, variables are typed and can be declared anywhere in the block: "int counter = 0;". They are updated using assignment operators like "+=".'
    });
  }

  if (hasArrays) {
    explanations.push({
      id: 'arrays',
      title: 'C Arrays and Indexing',
      text: 'In C, arrays are contiguous blocks of memory indexed from 0 to length - 1. Safe access checks index bounds to avoid illegal memory access.'
    });
  }

  if (hasSensor) {
    explanations.push({
      id: 'sensor',
      title: 'C Conditionals',
      text: 'Sensor functions return non-zero (true) when detected, or 0 (false) when clear, which drives if-else branching.'
    });
  }

  return {
    ...builder.getResult(),
    language: 'c',
    explanations,
    prototypesCode: prototypesBuilder.getCode(),
    functionsCode: functionsBuilder.getCode(),
    bodyCode: bodyBuilder.getCode(),
    globalVars,
    globalArrays
  };
}
