/**
 * MINICOMPILER - Phase 2: Syntax Analysis
 * ast.js: Represents Concrete Syntax Tree (Parse Tree) nodes.
 */

export class ParseNode {
  /**
   * @param {string} type - Node type (e.g. 'Program', 'VarDeclaration', 'BinaryExpression')
   * @param {string|null} value - Value or operator string (e.g. '=', '+', 'x')
   * @param {number} line - 1-based source line
   * @param {number} column - 1-based source column
   */
  constructor(type, value = null, line = 0, column = 0) {
    this.type = type;
    this.value = value;
    this.line = line;
    this.column = column;
    this.children = [];
  }

  /**
   * Adds one or more child nodes to this tree node.
   * @param {ParseNode|ParseNode[]} child
   * @returns {ParseNode}
   */
  addChild(child) {
    if (!child) return this;
    if (Array.isArray(child)) {
      child.forEach((c) => {
        if (c) this.children.push(c);
      });
    } else {
      this.children.push(child);
    }
    return this;
  }

  /**
   * Formats the tree node as a multi-line indented string.
   * @param {string} indent
   * @returns {string}
   */
  toPrettyString(indent = '') {
    let result = `${indent}${this.type}${this.value !== null ? ` ("${this.value}")` : ''} [L${this.line}:C${this.column}]\n`;
    for (const child of this.children) {
      if (child instanceof ParseNode) {
        result += child.toPrettyString(indent + '  ');
      } else {
        result += `${indent}  ${String(child)}\n`;
      }
    }
    return result;
  }

  /**
   * Returns a JSON-serializable representation suitable for UI tree rendering.
   */
  toJSON() {
    return {
      type: this.type,
      value: this.value,
      line: this.line,
      column: this.column,
      children: this.children.map((c) => (c instanceof ParseNode ? c.toJSON() : { type: 'Leaf', value: String(c) }))
    };
  }
}

