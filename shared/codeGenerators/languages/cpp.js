import { CodeBuilder } from '../codeBuilder.js';
import {
  ACTION_DESCRIPTIONS,
  getLoopVar,
  formatOperand,
  formatCondition,
  collectGlobalVariables,
  collectFunctionLocals,
  partitionAst
} from '../helpers.js';

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
  let hasFunctions = false;
  let loopGuardCounter = 0;

  const { functions, body } = partitionAst(ast);
  if (functions.length > 0) hasFunctions = true;

  const globalVars = collectGlobalVariables(ast);
  if (globalVars.length > 0) hasVariables = true;
  const isRunnable = Boolean(options.isRunnable || options.boundedLoops);

  const prototypesBuilder = new CodeBuilder('    ');
  const functionsBuilder = new CodeBuilder('    ');
  const bodyBuilder = new CodeBuilder('    ');

  if (globalVars.length > 0) {
    if (isRunnable) {
      for (const v of globalVars) {
        builder.addLine(0, `CvVar ${v}("${v}", &drone);`);
      }
    } else {
      for (const v of globalVars) {
        builder.addLine(0, `int ${v};`);
      }
      builder.addBlank();
    }
  }

  // Forward declarations (prototypes) for functions
  for (const fn of functions) {
    const paramDecls = (fn.params || []).map(p => `int ${p}`).join(', ');
    builder.addLine(0, `void ${fn.name}(${paramDecls});`);
    prototypesBuilder.addLine(0, `void ${fn.name}(${paramDecls});`);
  }
  if (functions.length > 0) {
    builder.addBlank();
    prototypesBuilder.addBlank();
  }

  // Compile function definitions first
  for (const fn of functions) {
    const fnLocals = collectFunctionLocals(fn);
    const paramDecls = (fn.params || []).map(p => `int ${p}`).join(', ');
    builder.addLine(0, `void ${fn.name}(${paramDecls}) {`, fn.nodeId, {
      blockId: fn.blockId,
      type: 'fn_def',
      name: fn.name
    });
    functionsBuilder.addLine(0, `void ${fn.name}(${paramDecls}) {`);

    if (isRunnable) {
      builder.addLine(1, `_cv_enter_fn("${fn.name}");`);
      functionsBuilder.addLine(1, `_cv_enter_fn("${fn.name}");`);
    }

    if (fnLocals.length > 0) {
      hasVariables = true;
      for (const v of fnLocals) {
        if (isRunnable) {
          builder.addLine(1, `CvVar ${v}("${v}", &drone);`);
          functionsBuilder.addLine(1, `CvVar ${v}("${v}", &drone);`);
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
        const argsStr = (node.args || []).map(a => formatOperand(a, 'cpp', options)).join(', ');
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

        if (Array.isArray(node.body) && node.body.length > 0) {
          compileNodes(targetBuilder, node.body, depth + 1, loopDepth + 1);
        }

        targetBuilder.addLine(depth, '}', node.nodeId, {
          blockId: node.blockId,
          type: 'repeat'
        });
      } else if (node.type === 'while') {
        hasWhile = true;
        const condStr = formatCondition(node.condition, null, 'cpp', options);
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
        const valStr = formatOperand(node.value, 'cpp', options);
        targetBuilder.addLine(depth, `${varName} = ${valStr};`, node.nodeId, {
          blockId: node.blockId,
          type: 'var_set',
          variable: varName,
          value: valStr
        });
      } else if (node.type === 'var_change') {
        hasVariables = true;
        const varName = node.variable || node.var;
        const amt = typeof node.amount === 'number' ? node.amount : Number(formatOperand(node.amount, 'cpp', options));
        const opStr = amt < 0 ? `-= ${Math.abs(amt)}` : `+= ${amt}`;
        targetBuilder.addLine(depth, `${varName} ${opStr};`, node.nodeId, {
          blockId: node.blockId,
          type: 'var_change',
          variable: varName,
          amount: amt
        });
      } else if (node.type === 'if') {
        hasSensor = true;
        const condStr = formatCondition(node.condition, node.sensor, 'cpp', options);
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
      title: 'Routines and Functions in C++',
      text: 'In C++, "void name(params)" defines a procedure. Calling the procedure passes arguments into local parameters.'
    });
  }

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
    explanations,
    prototypesCode: prototypesBuilder.getCode(),
    functionsCode: functionsBuilder.getCode(),
    bodyCode: bodyBuilder.getCode(),
    globalVars
  };
}
