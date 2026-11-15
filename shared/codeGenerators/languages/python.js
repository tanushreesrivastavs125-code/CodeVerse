import { CodeBuilder } from '../codeBuilder.js';
import { ACTION_DESCRIPTIONS, getLoopVar } from '../helpers.js';

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

  function compileNodes(nodes, depth = 0, loopDepth = 0) {
    for (const node of nodes) {
      if (!node || typeof node !== 'object') {
        throw new Error('Invalid command node in program sequence.');
      }

      if (node.type === 'repeat') {
        hasLoop = true;
        const count = node.count;
        const loopVar = getLoopVar(loopDepth);
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
      } else if (node.type === 'if') {
        hasSensor = true;
        const sensorName = node.sensor;
        const headerText = `if drone.sensor("${sensorName}"):`;
        builder.addLine(depth, headerText, node.nodeId, {
          blockId: node.blockId,
          type: 'if',
          sensor: sensorName,
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

  if (hasSensor) {
    explanations.push({
      id: 'sensor',
      title: 'Python If-Else Conditions',
      text: 'The "if drone.sensor(...):" statement checks sector sensors. The indented block below it executes only if the condition is true.'
    });
  }

  return {
    ...builder.getResult(),
    language: 'python',
    explanations
  };
}
