import { CodeBuilder } from '../codeBuilder.js';
import { ACTION_DESCRIPTIONS, getLoopVar } from '../helpers.js';

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

  function compileNodes(nodes, depth = 0, loopDepth = 0) {
    for (const node of nodes) {
      if (!node || typeof node !== 'object') {
        throw new Error('Invalid command node in program sequence.');
      }

      if (node.type === 'repeat') {
        hasLoop = true;
        const count = node.count;
        const loopVar = getLoopVar(loopDepth);
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
      } else if (node.type === 'if') {
        hasSensor = true;
        const sensorName = node.sensor;
        const sensorCall = `drone.sensor("${sensorName}")`;
        const headerText = `if (${sensorCall}) {`;
        builder.addLine(depth, headerText, node.nodeId, {
          blockId: node.blockId,
          type: 'if',
          sensor: sensorName,
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
      text: 'A "for (let i = 0; i < count; i++)" loop creates a counter variable and repeats the code enclosed inside curly braces { } exactly count times.'
    });
  }

  if (hasSensor) {
    explanations.push({
      id: 'sensor',
      title: 'Conditional Branching',
      text: 'The "if (drone.sensor(...))" statement checks sector sensors. The body runs only if the condition returns true; otherwise the else-branch executes.'
    });
  }

  return {
    ...builder.getResult(),
    language: 'javascript',
    explanations
  };
}
