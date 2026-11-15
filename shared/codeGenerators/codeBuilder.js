/**
 * CodeBuilder manages sequential line generation, indentation,
 * and precise bidirectional AST node <-> line number mapping.
 */
export class CodeBuilder {
  constructor(indentUnit = '  ') {
    this.indentUnit = indentUnit;
    this.lines = [];
    this.nodeLineMap = {};
  }

  /**
   * Appends a line of text to the code buffer.
   *
   * @param {number} depth - Indentation depth
   * @param {string} text - Content of the line
   * @param {string | null} [nodeId=null] - AST node identifier
   * @param {object} [meta={}] - Extra mapping metadata (e.g. isCondition, isElse, isHeader)
   * @returns {number} 1-based line number of the appended line
   */
  addLine(depth, text, nodeId = null, meta = {}) {
    const indent = this.indentUnit.repeat(Math.max(0, depth));
    const fullLine = text ? `${indent}${text}` : '';
    this.lines.push(fullLine);
    const lineNum = this.lines.length; // 1-based

    if (nodeId) {
      if (!this.nodeLineMap[nodeId]) {
        this.nodeLineMap[nodeId] = {
          nodeId,
          blockId: meta.blockId || null,
          type: meta.type || 'unknown',
          startLine: lineNum,
          endLine: lineNum,
          ...(meta.isCondition ? { conditionLine: lineNum } : {}),
          ...(meta.isElse ? { elseLine: lineNum } : {}),
          ...meta
        };
      } else {
        this.nodeLineMap[nodeId].endLine = lineNum;
        if (meta.blockId && !this.nodeLineMap[nodeId].blockId) {
          this.nodeLineMap[nodeId].blockId = meta.blockId;
        }
        if (meta.type && !this.nodeLineMap[nodeId].type) {
          this.nodeLineMap[nodeId].type = meta.type;
        }
        if (meta.isCondition || meta.conditionLine) {
          this.nodeLineMap[nodeId].conditionLine = meta.conditionLine || lineNum;
        }
        if (meta.isElse || meta.elseLine) {
          this.nodeLineMap[nodeId].elseLine = meta.elseLine || lineNum;
        }
      }
    }

    return lineNum;
  }

  /**
   * Appends an empty spacer line.
   *
   * @returns {number} 1-based line number
   */
  addBlank() {
    this.lines.push('');
    return this.lines.length;
  }

  /**
   * Retrieves final generated source string.
   *
   * @returns {string}
   */
  getCode() {
    return this.lines.join('\n');
  }

  /**
   * Retrieves lines array and line map.
   *
   * @returns {{ lines: string[], nodeLineMap: object }}
   */
  getResult() {
    return {
      code: this.getCode(),
      lines: [...this.lines],
      nodeLineMap: { ...this.nodeLineMap }
    };
  }
}
