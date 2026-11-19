import { CodeBuilder } from '../codeBuilder.js';
import { ACTION_DESCRIPTIONS, formatOperand, formatCondition } from '../helpers.js';

/**
 * Generates clear, hierarchical Plain-English steps from an AST.
 *
 * @param {Array<object>} ast
 * @param {object} [options={}]
 * @returns {{ code: string, lines: string[], nodeLineMap: object, explanations: Array<object> }}
 */
export function generatePlainEnglish(ast, options = {}) {
  const builder = new CodeBuilder('   ');
  const explanations = [
    {
      id: 'helpers',
      title: 'Drone Control Functions',
      text: 'Each numbered step is a direct command transmitted to the drone. Commands run in sequence from top to bottom.'
    }
  ];

  if (!Array.isArray(ast) || ast.length === 0) {
    builder.addLine(0, '# CodeVerse Mission Program (Plain-English Steps)');
    builder.addLine(0, '# No instructions assembled yet.');
    builder.addLine(0, '# Drag and snap blocks together in the Blocks tab to build your program.');
    return {
      ...builder.getResult(),
      language: 'plainEnglish',
      explanations
    };
  }

  if (options.includeHeader !== false) {
    builder.addLine(0, '# CodeVerse Mission Program (Plain-English Steps)');
    builder.addLine(0, '# Execute the following sequence:');
    builder.addBlank();
  }

  let hasLoop = false;
  let hasSensor = false;
  let hasVariable = false;
  let hasWhile = false;

  function formatSequence(nodes, depth = 0, stepPrefix = '') {
    nodes.forEach((node, idx) => {
      if (!node || typeof node !== 'object') {
        throw new Error('Invalid command node in program sequence.');
      }

      const stepNum = depth === 0 ? `${idx + 1}. ` : `${String.fromCharCode(97 + (idx % 26))}. `;
      const fullPrefix = stepNum;

      if (node.type === 'var_set') {
        hasVariable = true;
        const varName = node.variable || node.var || 'count';
        const text = `${fullPrefix}Set variable "${varName}" to ${formatOperand(node.value)}`;
        builder.addLine(depth, text, node.nodeId, {
          blockId: node.blockId,
          type: 'var_set',
          var: varName,
          variable: varName
        });
      } else if (node.type === 'var_change') {
        hasVariable = true;
        const varName = node.variable || node.var || 'count';
        const amount = node.amount ?? 1;
        const text = `${fullPrefix}Change variable "${varName}" by ${amount}`;
        builder.addLine(depth, text, node.nodeId, {
          blockId: node.blockId,
          type: 'var_change',
          var: varName,
          variable: varName,
          amount
        });
      } else if (node.type === 'repeat') {
        hasLoop = true;
        const count = node.count;
        const headerText = `${fullPrefix}Repeat ${count} times:`;
        builder.addLine(depth, headerText, node.nodeId, {
          blockId: node.blockId,
          type: 'repeat',
          count
        });

        if (Array.isArray(node.body) && node.body.length > 0) {
          formatSequence(node.body, depth + 1, `${stepPrefix}  `);
        } else {
          builder.addLine(depth + 1, '(empty loop body)', node.nodeId);
        }
        // Mark end of loop
        builder.addLine(depth, `End repeat`, node.nodeId, {
          blockId: node.blockId,
          type: 'repeat'
        });
      } else if (node.type === 'while') {
        hasWhile = true;
        const condText = formatCondition(node.condition, node.sensor, 'plainEnglish');
        const headerText = `${fullPrefix}While ${condText}:`;
        builder.addLine(depth, headerText, node.nodeId, {
          blockId: node.blockId,
          type: 'while',
          condition: condText,
          isCondition: true
        });

        if (Array.isArray(node.body) && node.body.length > 0) {
          formatSequence(node.body, depth + 1, `${stepPrefix}  `);
        } else {
          builder.addLine(depth + 1, '(empty while loop body)', node.nodeId);
        }

        builder.addLine(depth, `End while`, node.nodeId, {
          blockId: node.blockId,
          type: 'while'
        });
      } else if (node.type === 'if') {
        hasSensor = true;
        const condText = formatCondition(node.condition, node.sensor, 'plainEnglish');
        const headerText = `${fullPrefix}If ${condText}:`;
        builder.addLine(depth, headerText, node.nodeId, {
          blockId: node.blockId,
          type: 'if',
          sensor: node.sensor,
          isCondition: true
        });

        if (Array.isArray(node.body) && node.body.length > 0) {
          formatSequence(node.body, depth + 1, `${stepPrefix}  `);
        } else {
          builder.addLine(depth + 1, '(empty if branch)', node.nodeId);
        }

        if (Array.isArray(node.elseBody) && node.elseBody.length > 0) {
          builder.addLine(depth, `Otherwise:`, node.nodeId, {
            blockId: node.blockId,
            type: 'if',
            isElse: true
          });
          formatSequence(node.elseBody, depth + 1, `${stepPrefix}  `);
        }

        builder.addLine(depth, `End condition`, node.nodeId, {
          blockId: node.blockId,
          type: 'if'
        });
      } else {
        const actionInfo = ACTION_DESCRIPTIONS[node.type];
        if (!actionInfo) {
          throw new Error(`Unsupported command node: "${node.type}".`);
        }
        const text = `${fullPrefix}${actionInfo.english}`;
        builder.addLine(depth, text, node.nodeId, {
          blockId: node.blockId,
          type: node.type
        });
      }
    });
  }

  formatSequence(ast, 0);

  if (hasVariable) {
    explanations.push({
      id: 'variables',
      title: 'Variables & Counters',
      text: 'Variables store named numeric values in memory that can be inspected, updated, and tested in conditions.'
    });
  }

  if (hasWhile) {
    explanations.push({
      id: 'while_loops',
      title: 'While Loops',
      text: 'While loops repeat an action list as long as their condition evaluates to true, ending when the condition becomes false.'
    });
  }

  if (hasLoop) {
    explanations.push({
      id: 'loop',
      title: 'Repetition Steps',
      text: 'Repeat blocks run everything indented beneath them multiple times before moving to the next numbered step.'
    });
  }

  if (hasSensor) {
    explanations.push({
      id: 'sensor',
      title: 'Sensor Conditions',
      text: 'If-conditions scan the sector tile or heading. The indented steps only happen when the condition is true.'
    });
  }

  return {
    ...builder.getResult(),
    language: 'plainEnglish',
    explanations
  };
}
