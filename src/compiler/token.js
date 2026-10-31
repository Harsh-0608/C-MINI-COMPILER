/**
 * MINICOMPILER - Phase 1: Lexical Analysis
 * token.js: Defines all token types, keyword maps, and the Token class.
 */

export const TokenType = Object.freeze({
  // Keywords
  KEYWORD_INT: 'KEYWORD_INT',
  KEYWORD_FLOAT: 'KEYWORD_FLOAT',
  KEYWORD_CHAR: 'KEYWORD_CHAR',
  KEYWORD_VOID: 'KEYWORD_VOID',
  KEYWORD_RETURN: 'KEYWORD_RETURN',
  KEYWORD_IF: 'KEYWORD_IF',
  KEYWORD_ELSE: 'KEYWORD_ELSE',
  KEYWORD_WHILE: 'KEYWORD_WHILE',
  KEYWORD_FOR: 'KEYWORD_FOR',
  KEYWORD_STRUCT: 'KEYWORD_STRUCT',
  KEYWORD_UNION: 'KEYWORD_UNION',
  KEYWORD_SWITCH: 'KEYWORD_SWITCH',
  KEYWORD_CASE: 'KEYWORD_CASE',
  KEYWORD_DEFAULT: 'KEYWORD_DEFAULT',
  KEYWORD_BREAK: 'KEYWORD_BREAK',
  KEYWORD_ENUM: 'KEYWORD_ENUM',
  KEYWORD_SIZEOF: 'KEYWORD_SIZEOF',
  KEYWORD_CONST: 'KEYWORD_CONST',
  KEYWORD_TYPEDEF: 'KEYWORD_TYPEDEF',
  KEYWORD_DO: 'KEYWORD_DO',
  KEYWORD_CONTINUE: 'KEYWORD_CONTINUE',
  KEYWORD_UNSIGNED: 'KEYWORD_UNSIGNED',
  KEYWORD_SIGNED: 'KEYWORD_SIGNED',
  KEYWORD_LONG: 'KEYWORD_LONG',
  KEYWORD_SHORT: 'KEYWORD_SHORT',
  KEYWORD_DOUBLE: 'KEYWORD_DOUBLE',

  // Identifiers and Literals
  IDENTIFIER: 'IDENTIFIER',
  INTEGER_LITERAL: 'INTEGER_LITERAL',
  FLOAT_LITERAL: 'FLOAT_LITERAL',
  CHAR_LITERAL: 'CHAR_LITERAL',
  STRING_LITERAL: 'STRING_LITERAL',

  // Arithmetic Operators
  PLUS: 'PLUS',                 // +
  MINUS: 'MINUS',               // -
  MULTIPLY: 'MULTIPLY',         // *
  DIVIDE: 'DIVIDE',             // /
  MODULO: 'MODULO',             // %
  INCREMENT: 'INCREMENT',       // ++
  DECREMENT: 'DECREMENT',       // --

  // Assignment Operators
  ASSIGN: 'ASSIGN',             // =
  ADD_ASSIGN: 'ADD_ASSIGN',     // +=
  SUB_ASSIGN: 'SUB_ASSIGN',     // -=
  MUL_ASSIGN: 'MUL_ASSIGN',     // *=
  DIV_ASSIGN: 'DIV_ASSIGN',     // /=
  MOD_ASSIGN: 'MOD_ASSIGN',     // %=
  AND_ASSIGN: 'AND_ASSIGN',     // &=
  OR_ASSIGN: 'OR_ASSIGN',       // |=
  XOR_ASSIGN: 'XOR_ASSIGN',     // ^=
  SHL_ASSIGN: 'SHL_ASSIGN',     // <<=
  SHR_ASSIGN: 'SHR_ASSIGN',     // >>=

  // Shift Operators
  SHIFT_LEFT: 'SHIFT_LEFT',     // <<
  SHIFT_RIGHT: 'SHIFT_RIGHT',   // >>

  // Relational Operators
  EQUAL: 'EQUAL',               // ==
  NOT_EQUAL: 'NOT_EQUAL',       // !=
  LESS_THAN: 'LESS_THAN',       // <
  LESS_EQUAL: 'LESS_EQUAL',     // <=
  GREATER_THAN: 'GREATER_THAN', // >
  GREATER_EQUAL: 'GREATER_EQUAL', // >=

  // Logical Operators (Conditionals)
  LOGICAL_AND: 'LOGICAL_AND',   // &&
  LOGICAL_OR: 'LOGICAL_OR',     // ||
  LOGICAL_NOT: 'LOGICAL_NOT',   // !

  // Bitwise Operators
  BITWISE_AND: 'BITWISE_AND',   // &
  BITWISE_OR: 'BITWISE_OR',     // |
  BITWISE_XOR: 'BITWISE_XOR',   // ^

  // Ternary Operator
  QUESTION: 'QUESTION',         // ?

  // Member Access Operators
  DOT: 'DOT',                   // . (struct / object member access)
  ARROW: 'ARROW',               // -> (pointer member access)

  // Delimiters
  LPAREN: 'LPAREN',             // (
  RPAREN: 'RPAREN',             // )
  LBRACE: 'LBRACE',             // {
  RBRACE: 'RBRACE',             // }
  LBRACKET: 'LBRACKET',         // [ (for arrays)
  RBRACKET: 'RBRACKET',         // ] (for arrays)
  SEMICOLON: 'SEMICOLON',       // ;
  COLON: 'COLON',               // : (for switch-case & ternary)
  COMMA: 'COMMA',               // , (for function/method calls)

  // Preprocessor / Library Import Directives
  PREPROCESSOR: 'PREPROCESSOR', // #include <stdio.h>

  // End of Input
  EOF: 'EOF'
});

/**
 * Keyword dictionary mapping reserved strings to their TokenTypes.
 */
export const KEYWORDS = Object.freeze({
  'int': TokenType.KEYWORD_INT,
  'float': TokenType.KEYWORD_FLOAT,
  'char': TokenType.KEYWORD_CHAR,
  'void': TokenType.KEYWORD_VOID,
  'return': TokenType.KEYWORD_RETURN,
  'if': TokenType.KEYWORD_IF,
  'else': TokenType.KEYWORD_ELSE,
  'while': TokenType.KEYWORD_WHILE,
  'for': TokenType.KEYWORD_FOR,
  'struct': TokenType.KEYWORD_STRUCT,
  'union': TokenType.KEYWORD_UNION,
  'switch': TokenType.KEYWORD_SWITCH,
  'case': TokenType.KEYWORD_CASE,
  'default': TokenType.KEYWORD_DEFAULT,
  'break': TokenType.KEYWORD_BREAK,
  'enum': TokenType.KEYWORD_ENUM,
  'sizeof': TokenType.KEYWORD_SIZEOF,
  'const': TokenType.KEYWORD_CONST,
  'typedef': TokenType.KEYWORD_TYPEDEF,
  'do': TokenType.KEYWORD_DO,
  'continue': TokenType.KEYWORD_CONTINUE,
  'unsigned': TokenType.KEYWORD_UNSIGNED,
  'signed': TokenType.KEYWORD_SIGNED,
  'long': TokenType.KEYWORD_LONG,
  'short': TokenType.KEYWORD_SHORT,
  'double': TokenType.KEYWORD_DOUBLE
});

/**
 * Represents a single token produced by the Lexer.
 */
export class Token {
  constructor(type, value, line, column) {
    this.type = type;
    this.value = value;
    this.line = line;
    this.column = column;
  }

  getCategory() {
    if (this.type.startsWith('KEYWORD_')) return 'Keyword';
    if (this.type === TokenType.IDENTIFIER) return 'Identifier';
    if (
      this.type === TokenType.INTEGER_LITERAL ||
      this.type === TokenType.FLOAT_LITERAL ||
      this.type === TokenType.CHAR_LITERAL ||
      this.type === TokenType.STRING_LITERAL
    ) {
      return 'Literal';
    }
    if ([
      TokenType.PLUS, TokenType.MINUS, TokenType.MULTIPLY, TokenType.DIVIDE, TokenType.MODULO,
      TokenType.INCREMENT, TokenType.DECREMENT,
      TokenType.ASSIGN, TokenType.ADD_ASSIGN, TokenType.SUB_ASSIGN, TokenType.MUL_ASSIGN,
      TokenType.DIV_ASSIGN, TokenType.MOD_ASSIGN, TokenType.AND_ASSIGN, TokenType.OR_ASSIGN,
      TokenType.XOR_ASSIGN, TokenType.SHL_ASSIGN, TokenType.SHR_ASSIGN,
      TokenType.SHIFT_LEFT, TokenType.SHIFT_RIGHT,
      TokenType.EQUAL, TokenType.NOT_EQUAL,
      TokenType.LESS_THAN, TokenType.LESS_EQUAL, TokenType.GREATER_THAN, TokenType.GREATER_EQUAL,
      TokenType.LOGICAL_AND, TokenType.LOGICAL_OR, TokenType.LOGICAL_NOT,
      TokenType.BITWISE_AND, TokenType.BITWISE_OR, TokenType.BITWISE_XOR,
      TokenType.QUESTION,
      TokenType.DOT, TokenType.ARROW
    ].includes(this.type)) {
      return 'Operator';
    }
    if ([
      TokenType.LPAREN, TokenType.RPAREN, TokenType.LBRACE,
      TokenType.RBRACE, TokenType.LBRACKET, TokenType.RBRACKET,
      TokenType.SEMICOLON, TokenType.COLON, TokenType.COMMA
    ].includes(this.type)) {
      return 'Delimiter';
    }
    if (this.type === TokenType.PREPROCESSOR) return 'Preprocessor';
    if (this.type === TokenType.EOF) return 'End of Input';
    return 'Unknown';
  }

  getDisplayName() {
    switch (this.type) {
      case TokenType.KEYWORD_INT: return 'Keyword (int)';
      case TokenType.KEYWORD_FLOAT: return 'Keyword (float)';
      case TokenType.KEYWORD_CHAR: return 'Keyword (char)';
      case TokenType.KEYWORD_VOID: return 'Keyword (void)';
      case TokenType.KEYWORD_RETURN: return 'Keyword (return)';
      case TokenType.KEYWORD_IF: return 'Keyword (if)';
      case TokenType.KEYWORD_ELSE: return 'Keyword (else)';
      case TokenType.KEYWORD_WHILE: return 'Keyword (while)';
      case TokenType.KEYWORD_FOR: return 'Keyword (for)';
      case TokenType.KEYWORD_STRUCT: return 'Keyword (struct)';
      case TokenType.KEYWORD_UNION: return 'Keyword (union)';
      case TokenType.KEYWORD_SWITCH: return 'Keyword (switch)';
      case TokenType.KEYWORD_CASE: return 'Keyword (case)';
      case TokenType.KEYWORD_DEFAULT: return 'Keyword (default)';
      case TokenType.KEYWORD_BREAK: return 'Keyword (break)';
      case TokenType.KEYWORD_ENUM: return 'Keyword (enum)';
      case TokenType.KEYWORD_SIZEOF: return 'Keyword (sizeof)';
      case TokenType.KEYWORD_CONST: return 'Keyword (const)';
      case TokenType.KEYWORD_TYPEDEF: return 'Keyword (typedef)';
      case TokenType.KEYWORD_DO: return 'Keyword (do)';
      case TokenType.KEYWORD_CONTINUE: return 'Keyword (continue)';
      case TokenType.KEYWORD_UNSIGNED: return 'Keyword (unsigned)';
      case TokenType.KEYWORD_SIGNED: return 'Keyword (signed)';
      case TokenType.KEYWORD_LONG: return 'Keyword (long)';
      case TokenType.KEYWORD_SHORT: return 'Keyword (short)';
      case TokenType.KEYWORD_DOUBLE: return 'Keyword (double)';
      case TokenType.IDENTIFIER: return 'Identifier';
      case TokenType.INTEGER_LITERAL: return 'Integer Literal';
      case TokenType.FLOAT_LITERAL: return 'Float Literal';
      case TokenType.CHAR_LITERAL: return 'Char Literal';
      case TokenType.STRING_LITERAL: return 'String Literal';
      case TokenType.PLUS: return 'Operator (+)';
      case TokenType.MINUS: return 'Operator (-)';
      case TokenType.MULTIPLY: return 'Operator (*)';
      case TokenType.DIVIDE: return 'Operator (/)';
      case TokenType.MODULO: return 'Operator (%)';
      case TokenType.INCREMENT: return 'Operator (++)';
      case TokenType.DECREMENT: return 'Operator (--)';
      case TokenType.ASSIGN: return 'Operator (=)';
      case TokenType.ADD_ASSIGN: return 'Operator (+=)';
      case TokenType.SUB_ASSIGN: return 'Operator (-=)';
      case TokenType.MUL_ASSIGN: return 'Operator (*=)';
      case TokenType.DIV_ASSIGN: return 'Operator (/=)';
      case TokenType.MOD_ASSIGN: return 'Operator (%=)';
      case TokenType.AND_ASSIGN: return 'Operator (&=)';
      case TokenType.OR_ASSIGN: return 'Operator (|=)';
      case TokenType.XOR_ASSIGN: return 'Operator (^=)';
      case TokenType.SHL_ASSIGN: return 'Operator (<<=)';
      case TokenType.SHR_ASSIGN: return 'Operator (>>=)';
      case TokenType.SHIFT_LEFT: return 'Operator (<<)';
      case TokenType.SHIFT_RIGHT: return 'Operator (>>)';
      case TokenType.EQUAL: return 'Operator (==)';
      case TokenType.NOT_EQUAL: return 'Operator (!=)';
      case TokenType.LESS_THAN: return 'Operator (<)';
      case TokenType.LESS_EQUAL: return 'Operator (<=)';
      case TokenType.GREATER_THAN: return 'Operator (>)';
      case TokenType.GREATER_EQUAL: return 'Operator (>=)';
      case TokenType.LOGICAL_AND: return 'Operator (&&)';
      case TokenType.LOGICAL_OR: return 'Operator (||)';
      case TokenType.LOGICAL_NOT: return 'Operator (!)';
      case TokenType.BITWISE_AND: return 'Operator (&)';
      case TokenType.BITWISE_OR: return 'Operator (|)';
      case TokenType.BITWISE_XOR: return 'Operator (^)';
      case TokenType.QUESTION: return 'Operator (?)';
      case TokenType.DOT: return 'Operator (.)';
      case TokenType.ARROW: return 'Operator (->)';
      case TokenType.LPAREN: return 'Delimiter (()';
      case TokenType.RPAREN: return 'Delimiter ())';
      case TokenType.LBRACE: return 'Delimiter ({)';
      case TokenType.RBRACE: return 'Delimiter (})';
      case TokenType.LBRACKET: return 'Delimiter ([)';
      case TokenType.RBRACKET: return 'Delimiter (])';
      case TokenType.SEMICOLON: return 'Delimiter (;)';
      case TokenType.COLON: return 'Delimiter (:)';
      case TokenType.COMMA: return 'Delimiter (,)';
      case TokenType.PREPROCESSOR: return 'Preprocessor Directive';
      case TokenType.EOF: return 'EOF';
      default: return this.type;
    }
  }

  toString() {
    return `Token(${this.type}, "${this.value}", Line ${this.line}, Col ${this.column})`;
  }
}
