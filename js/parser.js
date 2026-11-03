/**
 * MINICOMPILER - Phase 2: Syntax Analysis
 * parser.js: Recursive-Descent Parser consuming tokens from Phase 1.
 * Produces a concrete parse tree (CST/AST) and detailed syntax diagnostics.
 */

import { TokenType } from './token.js';
import { ParseNode } from './ast.js';

export class SyntaxError {
  /**
   * @param {string} message - Descriptive error message
   * @param {number} line - 1-based line number
   * @param {number} column - 1-based column number
   * @param {string|null} expected - What the grammar expected
   * @param {string|null} found - What token was actually found
   */
  constructor(message, line, column, expected = null, found = null) {
    this.message = message;
    this.line = line;
    this.column = column;
    this.expected = expected;
    this.found = found;
  }

  toString() {
    return `Syntax Error [Line ${this.line}, Col ${this.column}]: ${this.message}`;
  }
}

/**
 * Internal exception used for unwinding the call stack on syntax error
 * before statement-level synchronization.
 */
class ParseException extends Error {
  constructor(syntaxError) {
    super(syntaxError.message);
    this.syntaxError = syntaxError;
  }
}

/**
 * Comprehensive set of standard C library headers across C89, C95, C99, C11, C23,
 * and standard POSIX/system headers.
 */
export const STANDARD_C_LIBRARIES = new Set([
  // ANSI C (C89 / C90)
  'assert.h',
  'ctype.h',
  'errno.h',
  'float.h',
  'limits.h',
  'locale.h',
  'math.h',
  'setjmp.h',
  'signal.h',
  'stdarg.h',
  'stddef.h',
  'stdio.h',
  'stdlib.h',
  'string.h',
  'time.h',

  // C95 Amendment 1
  'iso646.h',
  'wchar.h',
  'wctype.h',

  // C99
  'complex.h',
  'fenv.h',
  'inttypes.h',
  'stdbool.h',
  'stdint.h',
  'tgmath.h',

  // C11
  'stdalign.h',
  'stdatomic.h',
  'stdnoreturn.h',
  'threads.h',
  'uchar.h',

  // C23
  'stdbit.h',
  'stdckdint.h',

  // Common POSIX & Standard OS Headers
  'unistd.h',
  'fcntl.h',
  'sys/types.h',
  'sys/stat.h',
  'sys/time.h',
  'sys/wait.h',
  'sys/socket.h',
  'netinet/in.h',
  'arpa/inet.h',
  'netdb.h',
  'conio.h',
  'windows.h',
  'pthread.h',
  'memory.h',
  'malloc.h',
  'dirent.h',
  'strings.h',
  'alloca.h',
  'utime.h'
]);

/**
 * Common C++ headers to distinguish C++ imports and provide helpful diagnostics.
 */
const CPP_COMMON_HEADERS = new Set([
  'iostream', 'vector', 'string', 'map', 'set', 'algorithm', 'cmath', 'cstdio',
  'cstdlib', 'cstring', 'sstream', 'fstream', 'queue', 'stack', 'deque', 'list',
  'utility', 'tuple', 'memory', 'numeric', 'functional', 'chrono', 'thread',
  'mutex', 'condition_variable', 'type_traits', 'bitset', 'unordered_map', 'unordered_set',
  'iostream.h', 'fstream.h', 'strstream.h'
]);

/**
 * Valid preprocessor directives in C.
 */
const VALID_DIRECTIVES = new Set([
  'include', 'define', 'undef', 'ifdef', 'ifndef', 'endif', 'else', 'elif', 'line', 'error', 'pragma'
]);

/**
 * Helper to compute Levenshtein distance for fuzzy typo matching.
 */
function levenshteinDistance(a, b) {
  const m = a.length;
  const n = b.length;
  const dp = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));
  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      dp[i][j] = Math.min(
        dp[i - 1][j] + 1,
        dp[i][j - 1] + 1,
        dp[i - 1][j - 1] + cost
      );
    }
  }
  return dp[m][n];
}

export class Parser {
  /**
   * @param {Token[]} tokens - Stream of tokens produced by Phase 1 Lexer
   */
  constructor(tokens = []) {
    this.tokens = tokens || [];
    this.pos = 0;
    this.errors = [];
    this.steps = [];
  }

  /**
   * Main entry point to parse the token stream.
   * @returns {{ cst: ParseNode, errors: SyntaxError[], parsingSteps: string[] }}
   */
  parse() {
    this.pos = 0;
    this.errors = [];
    this.steps = [];

    this.logStep('Starting Syntax Analysis (Recursive Descent)');
    const root = new ParseNode('Program', null, 1, 1);

    if (!this.tokens || this.tokens.length === 0) {
      this.recordError('Empty token stream received. No code to parse.', 1, 1);
      return { cst: root, errors: this.errors, parsingSteps: this.steps };
    }

    // Top-level program loop
    while (!this.isAtEnd()) {
      try {
        const topNode = this.parseTopLevelItem();
        if (topNode) {
          root.addChild(topNode);
        }
      } catch (err) {
        if (err instanceof ParseException) {
          // Error already recorded in this.errors; synchronize to next statement
          this.synchronize();
        } else {
          throw err;
        }
      }
    }

    // Consume the EOF token
    const eofToken = this.peek();
    root.addChild(new ParseNode('EOF', eofToken.value, eofToken.line, eofToken.column));
    this.logStep('Reached EOF. Syntax Analysis Complete.');

    return {
      cst: root,
      errors: this.errors,
      parsingSteps: this.steps
    };
  }

  /* =========================================================================
     Lookahead & Consumption Helper Methods
     ========================================================================= */

  peek(offset = 0) {
    const target = this.pos + offset;
    if (target >= this.tokens.length) {
      return this.tokens[this.tokens.length - 1]; // Return EOF
    }
    return this.tokens[target];
  }

  previous() {
    return this.tokens[this.pos - 1];
  }

  isAtEnd() {
    return this.peek().type === TokenType.EOF;
  }

  check(type) {
    if (this.isAtEnd()) return type === TokenType.EOF;
    return this.peek().type === type;
  }

  match(...types) {
    for (const type of types) {
      if (this.check(type)) {
        this.advance();
        return true;
      }
    }
    return false;
  }

  isAssignmentOperator(tok) {
    if (!tok) return false;
    return [
      TokenType.ASSIGN,
      TokenType.ADD_ASSIGN,
      TokenType.SUB_ASSIGN,
      TokenType.MUL_ASSIGN,
      TokenType.DIV_ASSIGN,
      TokenType.MOD_ASSIGN,
      TokenType.AND_ASSIGN,
      TokenType.OR_ASSIGN,
      TokenType.XOR_ASSIGN,
      TokenType.SHL_ASSIGN,
      TokenType.SHR_ASSIGN
    ].includes(tok.type);
  }

  matchAssignmentOperator() {
    if (this.isAssignmentOperator(this.peek())) {
      return this.advance();
    }
    return null;
  }

  advance() {
    if (!this.isAtEnd()) this.pos++;
    return this.previous();
  }

  consume(type, errorMessage) {
    if (this.check(type)) {
      return this.advance();
    }
    const current = this.peek();
    const error = new SyntaxError(
      `${errorMessage} (found '${current.value}')`,
      current.line,
      current.column,
      type,
      current.type
    );
    this.errors.push(error);
    this.logStep(`ERROR: ${error.message} at L${error.line}:C${error.column}`);
    throw new ParseException(error);
  }

  recordError(message, line, column, expected = null, found = null) {
    const error = new SyntaxError(message, line, column, expected, found);
    this.errors.push(error);
    this.logStep(`ERROR: ${message} at L${line}:C${column}`);
    return error;
  }

  logStep(step) {
    this.steps.push(step);
  }

  /**
   * Recovers parser state to a safe statement boundary after a syntax error,
   * guaranteeing progress to prevent infinite loops.
   */
  synchronize() {
    this.logStep('Synchronizing parser state after error...');
    this.advance();

    while (!this.isAtEnd()) {
      if (this.previous().type === TokenType.SEMICOLON) return;

      switch (this.peek().type) {
        case TokenType.PREPROCESSOR:
        case TokenType.KEYWORD_INT:
        case TokenType.KEYWORD_FLOAT:
        case TokenType.KEYWORD_DOUBLE:
        case TokenType.KEYWORD_CHAR:
        case TokenType.KEYWORD_UNSIGNED:
        case TokenType.KEYWORD_SIGNED:
        case TokenType.KEYWORD_LONG:
        case TokenType.KEYWORD_SHORT:
        case TokenType.KEYWORD_VOID:
        case TokenType.KEYWORD_STRUCT:
        case TokenType.KEYWORD_UNION:
        case TokenType.KEYWORD_ENUM:
        case TokenType.KEYWORD_CONST:
        case TokenType.KEYWORD_TYPEDEF:
        case TokenType.KEYWORD_IF:
        case TokenType.KEYWORD_WHILE:
        case TokenType.KEYWORD_DO:
        case TokenType.KEYWORD_FOR:
        case TokenType.KEYWORD_SWITCH:
        case TokenType.KEYWORD_CASE:
        case TokenType.KEYWORD_DEFAULT:
        case TokenType.KEYWORD_BREAK:
        case TokenType.KEYWORD_CONTINUE:
        case TokenType.KEYWORD_RETURN:
        case TokenType.LBRACE:
        case TokenType.RBRACE:
          return;
        default:
          this.advance();
      }
    }
  }

  /* =========================================================================
     Grammar Rule Parsers (Recursive Descent)
     ========================================================================= */

  /**
   * Top-level item: Preprocessor Directive (#include), Struct/Union Definition, Function, or Statement.
   */
  parseTopLevelItem() {
    // 1. Preprocessor Directive
    if (this.match(TokenType.PREPROCESSOR)) {
      const tok = this.previous();
      return this.parsePreprocessorDirective(tok);
    }

    // 2. Typedef declaration: typedef ...
    if (this.match(TokenType.KEYWORD_TYPEDEF)) {
      return this.parseTypedef();
    }

    // 3. Enum Definition: enum State { ... }
    if (this.check(TokenType.KEYWORD_ENUM)) {
      if (
        (this.peek(1).type === TokenType.IDENTIFIER && this.peek(2).type === TokenType.LBRACE) ||
        this.peek(1).type === TokenType.LBRACE
      ) {
        return this.parseEnumDefinition();
      }
    }

    // 4. Struct or Union Definition: struct Token { ... } or union Data { ... }
    if (this.check(TokenType.KEYWORD_STRUCT) || this.check(TokenType.KEYWORD_UNION)) {
      if (
        (this.peek(1).type === TokenType.IDENTIFIER && this.peek(2).type === TokenType.LBRACE) ||
        this.peek(1).type === TokenType.LBRACE
      ) {
        return this.parseStructOrUnionDefinition();
      }
    }

    // 5. Check for Function Declaration (prototype or definition):
    // Pattern: ReturnType IDENTIFIER '('
    if (this.isFunctionDeclaration()) {
      return this.parseFunctionDeclaration();
    }

    // 6. Otherwise, regular statement (variable decl, loop, if, assignment, etc.)
    return this.parseStatement();
  }

  /**
   * PreprocessorDirective ::= "#" DirectiveName ( HeaderPath | MacroDef | ... )
   * Validates preprocessor directive syntax, standard C libraries, and header paths.
   */
  parsePreprocessorDirective(tok) {
    this.logStep(`Parsing Preprocessor Directive: '${tok.value}'`);
    const node = new ParseNode('PreprocessorDirective', tok.value, tok.line, tok.column);

    let raw = tok.value.trim();

    // Strip trailing comments (// or /* ... */) from the directive line
    const lineCommentIdx = raw.indexOf('//');
    if (lineCommentIdx !== -1) {
      raw = raw.substring(0, lineCommentIdx).trim();
    }
    const blockCommentIdx = raw.indexOf('/*');
    if (blockCommentIdx !== -1) {
      const blockEnd = raw.indexOf('*/', blockCommentIdx + 2);
      if (blockEnd !== -1) {
        raw = (raw.substring(0, blockCommentIdx) + raw.substring(blockEnd + 2)).trim();
      } else {
        raw = raw.substring(0, blockCommentIdx).trim();
      }
    }

    if (!raw.startsWith('#')) {
      this.recordError(
        `Invalid preprocessor directive '${raw}'. Directives must begin with '#'.`,
        tok.line,
        tok.column,
        "#<directive>",
        raw
      );
      return node;
    }

    const afterHash = raw.substring(1).trim();
    if (afterHash === '') {
      this.recordError(
        "Empty preprocessor directive '#'. Expected directive name such as '#include <stdio.h>'.",
        tok.line,
        tok.column,
        "#include <...>",
        raw
      );
      return node;
    }

    const match = afterHash.match(/^([a-zA-Z_]\w*)(.*)$/s);
    if (!match) {
      this.recordError(
        `Invalid preprocessor directive '${raw}'. Expected directive identifier (e.g. '#include').`,
        tok.line,
        tok.column,
        "#include",
        raw
      );
      return node;
    }

    const dirName = match[1];
    const rest = match[2].trim();
    node.addChild(new ParseNode('DirectiveName', dirName, tok.line, tok.column));

    const isInclude = dirName === 'include';
    const isDefine = dirName === 'define';
    const isOtherValid = VALID_DIRECTIVES.has(dirName);

    // Check if directive name itself is invalid or misspelled
    if (!isInclude && !isDefine && !isOtherValid) {
      const lowerDir = dirName.toLowerCase();
      const distToInclude = levenshteinDistance(lowerDir, 'include');
      if (distToInclude <= 3 || lowerDir.startsWith('inc') || lowerDir.endsWith('clude')) {
        this.recordError(
          `Invalid preprocessor directive '#${dirName}'. Did you mean '#include'?`,
          tok.line,
          tok.column,
          "#include",
          `#${dirName}`
        );
      } else {
        const distToDefine = levenshteinDistance(lowerDir, 'define');
        if (distToDefine <= 2) {
          this.recordError(
            `Invalid preprocessor directive '#${dirName}'. Did you mean '#define'?`,
            tok.line,
            tok.column,
            "#define",
            `#${dirName}`
          );
        } else {
          this.recordError(
            `Unknown preprocessor directive '#${dirName}'. Valid directives: #include, #define, #undef, #ifdef, #ifndef, #endif, #pragma.`,
            tok.line,
            tok.column,
            "#include",
            `#${dirName}`
          );
        }
      }
    }

    // If directive is include or clearly intended as include (e.g. #incude <stdio>), validate the header!
    const lowerDir = dirName.toLowerCase();
    const intendedAsInclude = isInclude ||
      lowerDir.startsWith('inc') ||
      lowerDir.endsWith('clude') ||
      rest.startsWith('<') ||
      rest.startsWith('"');

    if (intendedAsInclude) {
      this.validateIncludeDirective(dirName, rest, tok, node);
    } else if (isDefine) {
      this.validateDefineDirective(rest, tok, node);
    }

    return node;
  }

  /**
   * Validates header inclusion syntax and library names for '#include'.
   */
  validateIncludeDirective(dirName, rest, tok, node) {
    if (!rest || rest.length === 0) {
      this.recordError(
        `Expected header file after '#${dirName}'. Format: #include <header.h> or #include "header.h".`,
        tok.line,
        tok.column + dirName.length + 1,
        "<filename.h> or \"filename.h\"",
        "empty"
      );
      return;
    }

    const startsAngle = rest.startsWith('<');
    const startsQuote = rest.startsWith('"');

    if (!startsAngle && !startsQuote) {
      const cleanName = rest.replace(/^[<"]+|[>"]+$/g, '').trim();
      const suggested = cleanName.endsWith('.h') ? cleanName : `${cleanName}.h`;
      this.recordError(
        `Invalid #include syntax '${tok.value}'. Expected header path enclosed in '<...>' or '\"...\"' (e.g. '#include <${suggested}>').`,
        tok.line,
        tok.column,
        `<${suggested}>`,
        rest
      );
      return;
    }

    let header = '';
    let isSystem = false;
    let trailing = '';

    if (startsAngle) {
      isSystem = true;
      const closingIdx = rest.indexOf('>');
      if (closingIdx === -1) {
        this.recordError(
          `Unterminated header in '#${dirName}'. Missing closing '>' after '${rest}'.`,
          tok.line,
          tok.column,
          `${rest}>`,
          rest
        );
        return;
      }
      header = rest.substring(1, closingIdx).trim();
      trailing = rest.substring(closingIdx + 1).trim();
    } else {
      isSystem = false;
      const closingIdx = rest.indexOf('"', 1);
      if (closingIdx === -1) {
        this.recordError(
          `Unterminated header in '#${dirName}'. Missing closing '\"' after '${rest}'.`,
          tok.line,
          tok.column,
          `${rest}\"`,
          rest
        );
        return;
      }
      header = rest.substring(1, closingIdx).trim();
      trailing = rest.substring(closingIdx + 1).trim();
    }

    if (trailing.length > 0) {
      this.recordError(
        `Extra tokens after preprocessor directive: '${trailing}'.`,
        tok.line,
        tok.column,
        "end of line",
        trailing
      );
    }

    if (header === '') {
      this.recordError(
        `Empty header filename in '#include' directive. Expected a valid header like <stdio.h>.`,
        tok.line,
        tok.column,
        "<stdio.h>",
        isSystem ? "<>" : '""'
      );
      return;
    }

    node.addChild(new ParseNode('HeaderPath', isSystem ? `<${header}>` : `"${header}"`, tok.line, tok.column));

    // Validate characters in header filename
    if (/[^a-zA-Z0-9_\-\.\/]/.test(header)) {
      this.recordError(
        `Invalid character in header filename '${header}'. Header names may only contain letters, numbers, underscores, dots, hyphens, and slashes.`,
        tok.line,
        tok.column,
        "valid path",
        header
      );
      return;
    }

    const lowerHeader = header.toLowerCase();
    const hasHExtension = lowerHeader.endsWith('.h');

    if (!hasHExtension) {
      // Check if it's a known C++ standard header
      if (CPP_COMMON_HEADERS.has(lowerHeader)) {
        let suggestion = '<stdio.h>';
        if (lowerHeader === 'string') suggestion = '<string.h>';
        else if (lowerHeader === 'cmath') suggestion = '<math.h>';
        else if (lowerHeader === 'cstdio') suggestion = '<stdio.h>';
        else if (lowerHeader === 'cstdlib') suggestion = '<stdlib.h>';
        else if (lowerHeader === 'cstring') suggestion = '<string.h>';
        this.recordError(
          `'${isSystem ? `<${header}>` : `"${header}"`}' is a C++ standard library header. This C mini-compiler requires standard C headers ending in '.h' (such as ${suggestion}).`,
          tok.line,
          tok.column,
          suggestion,
          header
        );
        return;
      }

      // Check if adding .h matches a standard C library
      if (STANDARD_C_LIBRARIES.has(`${lowerHeader}.h`)) {
        this.recordError(
          `Invalid library header '<${header}>'. Standard C library headers must end with '.h'. Did you mean '<${lowerHeader}.h>'?`,
          tok.line,
          tok.column,
          `<${lowerHeader}.h>`,
          `<${header}>`
        );
        return;
      }

      // Any other header missing .h
      this.recordError(
        `Invalid library header '${isSystem ? `<${header}>` : `"${header}"`}'. Standard C library headers must end with '.h' (e.g., '<${header}.h>').`,
        tok.line,
        tok.column,
        `<${header}.h>`,
        header
      );
      return;
    }

    // Header has .h extension!
    if (isSystem) {
      if (STANDARD_C_LIBRARIES.has(lowerHeader)) {
        this.logStep(`Validated Standard C Library: <${header}>`);
        return;
      }

      // System header with .h that is NOT in STANDARD_C_LIBRARIES:
      // Check for typo in standard C library names
      let closest = null;
      let minDistance = 999;
      for (const stdLib of STANDARD_C_LIBRARIES) {
        const dist = levenshteinDistance(lowerHeader, stdLib);
        if (dist < minDistance) {
          minDistance = dist;
          closest = stdLib;
        }
      }

      if (minDistance <= 2 && closest) {
        this.recordError(
          `Unknown standard library header '<${header}>'. Did you mean '<${closest}>'?`,
          tok.line,
          tok.column,
          `<${closest}>`,
          `<${header}>`
        );
      } else {
        this.recordError(
          `Unknown standard library header '<${header}>'. Standard C libraries include <stdio.h>, <stdlib.h>, <string.h>, <math.h>, <ctype.h>, <stdbool.h>, <stdint.h>, etc. For custom headers, use double quotes: "${header}".`,
          tok.line,
          tok.column,
          "<stdio.h>",
          `<${header}>`
        );
      }
    } else {
      // User header: "myheader.h"
      this.logStep(`Validated User Header: "${header}"`);
    }
  }

  /**
   * Validates '#define' macro definitions.
   */
  validateDefineDirective(rest, tok, node) {
    if (!rest || rest.length === 0) {
      this.recordError(
        "Expected macro identifier after '#define'. Example: '#define MAX 100'.",
        tok.line,
        tok.column,
        "#define <NAME> <VALUE>",
        "#define"
      );
      return;
    }
    const match = rest.match(/^([a-zA-Z_]\w*)(.*)$/s);
    if (!match) {
      this.recordError(
        `Invalid macro identifier in '#define ${rest}'. Identifiers must begin with a letter or underscore.`,
        tok.line,
        tok.column,
        "valid identifier",
        rest
      );
      return;
    }
    const macroName = match[1];
    const macroVal = match[2].trim();
    node.addChild(new ParseNode('MacroName', macroName, tok.line, tok.column));
    if (macroVal) {
      node.addChild(new ParseNode('MacroValue', macroVal, tok.line, tok.column));
    }
  }

  /**
   * Checks lookahead to see if current tokens form a function declaration:
   * ReturnType IDENTIFIER '('
   * ReturnType can be void, int, float, char, struct Name, union Name, enum Name, CustomType, with optional '*'.
   */
  isFunctionDeclaration() {
    let offset = 0;

    // Optional 'const'
    if (this.peek(offset).type === TokenType.KEYWORD_CONST) {
      offset++;
    }

    const first = this.peek(offset);

    // 1. Return type start:
    if (
      first.type === TokenType.KEYWORD_VOID ||
      first.type === TokenType.KEYWORD_INT ||
      first.type === TokenType.KEYWORD_FLOAT ||
      first.type === TokenType.KEYWORD_DOUBLE ||
      first.type === TokenType.KEYWORD_CHAR ||
      first.type === TokenType.KEYWORD_UNSIGNED ||
      first.type === TokenType.KEYWORD_SIGNED ||
      first.type === TokenType.KEYWORD_LONG ||
      first.type === TokenType.KEYWORD_SHORT ||
      first.type === TokenType.IDENTIFIER
    ) {
      while (
        this.peek(offset).type === TokenType.KEYWORD_UNSIGNED ||
        this.peek(offset).type === TokenType.KEYWORD_SIGNED ||
        this.peek(offset).type === TokenType.KEYWORD_LONG ||
        this.peek(offset).type === TokenType.KEYWORD_SHORT ||
        this.peek(offset).type === TokenType.KEYWORD_INT ||
        this.peek(offset).type === TokenType.KEYWORD_FLOAT ||
        this.peek(offset).type === TokenType.KEYWORD_DOUBLE ||
        this.peek(offset).type === TokenType.KEYWORD_CHAR ||
        this.peek(offset).type === TokenType.KEYWORD_VOID
      ) {
        offset++;
      }
      if (first.type === TokenType.IDENTIFIER) {
        offset++;
      }
    } else if (
      first.type === TokenType.KEYWORD_STRUCT ||
      first.type === TokenType.KEYWORD_UNION ||
      first.type === TokenType.KEYWORD_ENUM
    ) {
      offset++;
      if (this.peek(offset).type !== TokenType.IDENTIFIER) return false;
      offset++; // skip struct/union/enum tag name
    } else {
      return false;
    }

    // 2. Optional pointer stars: *
    while (this.peek(offset).type === TokenType.MULTIPLY || this.peek(offset).type === TokenType.KEYWORD_CONST) {
      offset++;
    }

    // 3. Function name (IDENTIFIER)
    if (this.peek(offset).type !== TokenType.IDENTIFIER) {
      return false;
    }
    offset++;

    // 4. Must be followed by '('
    return this.peek(offset).type === TokenType.LPAREN;
  }

  /**
   * EnumDefinition ::= "enum" IDENTIFIER? "{" EnumMemberList? "}" (IDENTIFIER ("," IDENTIFIER)*)? ";"
   */
  parseEnumDefinition() {
    this.logStep('Entering parseEnumDefinition');
    const enumTok = this.advance(); // consume 'enum'
    let tag = null;
    if (this.match(TokenType.IDENTIFIER)) {
      tag = this.previous().value;
      this.logStep(`Parsing enum '${tag}'`);
    }

    this.consume(TokenType.LBRACE, "Expected '{' for enum body");
    const enumNode = new ParseNode('EnumDefinition', tag, enumTok.line, enumTok.column);
    if (tag) {
      enumNode.addChild(new ParseNode('TypeName', tag, enumTok.line, enumTok.column));
    }

    const membersNode = new ParseNode('EnumMemberList', null, enumTok.line, enumTok.column);
    if (!this.check(TokenType.RBRACE)) {
      do {
        if (this.check(TokenType.RBRACE)) break; // trailing comma support: enum { A, B, }
        const idTok = this.consume(TokenType.IDENTIFIER, "Expected identifier for enum member");
        const memNode = new ParseNode('EnumMember', idTok.value, idTok.line, idTok.column);
        if (this.match(TokenType.ASSIGN)) {
          const eqTok = this.previous();
          const valExpr = this.parseExpression();
          const valNode = new ParseNode('EnumValue', '=', eqTok.line, eqTok.column);
          valNode.addChild(valExpr);
          memNode.addChild(valNode);
        }
        membersNode.addChild(memNode);
      } while (this.match(TokenType.COMMA));
    }

    this.consume(TokenType.RBRACE, "Expected '}' to close enum definition");
    enumNode.addChild(membersNode);

    // Optional instance variables: enum State { S1, S2 } s1, s2;
    if (!this.check(TokenType.SEMICOLON)) {
      const initList = new ParseNode('InstanceList', null, enumTok.line, enumTok.column);
      do {
        initList.addChild(this.parseVarInit());
      } while (this.match(TokenType.COMMA));
      enumNode.addChild(initList);
    }

    this.consume(TokenType.SEMICOLON, "Expected ';' after enum definition");
    this.logStep(`Completed parseEnumDefinition '${tag || ''}'`);
    return enumNode;
  }

  /**
   * TypedefDeclaration ::= "typedef" ( StructOrUnionDef | EnumDef | Type "* "* IDENTIFIER ) ";"
   */
  parseTypedef() {
    this.logStep('Entering parseTypedef');
    const typedefTok = this.previous();
    const node = new ParseNode('TypedefDeclaration', 'typedef', typedefTok.line, typedefTok.column);

    if (this.check(TokenType.KEYWORD_STRUCT) || this.check(TokenType.KEYWORD_UNION)) {
      const def = this.parseStructOrUnionDefinition();
      node.addChild(def);
      return node;
    }

    if (this.check(TokenType.KEYWORD_ENUM)) {
      const def = this.parseEnumDefinition();
      node.addChild(def);
      return node;
    }

    const typeNode = this.parseType('Type', true);
    node.addChild(typeNode);

    // Check for typedef of function pointer: typedef int (*OpFunc)(int, int);
    if (this.isFunctionPointerVarLookahead()) {
      const fnPtrNode = this.parseFunctionPointerVarInit();
      node.addChild(fnPtrNode);
      this.consume(TokenType.SEMICOLON, "Expected ';' after typedef");
      this.logStep('Completed parseTypedef function pointer');
      return node;
    }

    let pointerDepth = 0;
    while (this.match(TokenType.MULTIPLY)) {
      pointerDepth++;
      if (this.match(TokenType.KEYWORD_CONST)) {
        // const pointer
      }
    }

    const aliasTok = this.consume(TokenType.IDENTIFIER, "Expected alias identifier in typedef");
    const aliasNode = new ParseNode('Alias', aliasTok.value, aliasTok.line, aliasTok.column);
    if (pointerDepth > 0) {
      aliasNode.addChild(new ParseNode('PointerDepth', String(pointerDepth), aliasTok.line, aliasTok.column));
    }
    node.addChild(aliasNode);

    this.consume(TokenType.SEMICOLON, "Expected ';' after typedef");
    this.logStep(`Completed parseTypedef for '${aliasTok.value}'`);
    return node;
  }

  /**
   * StructOrUnionDefinition ::= ("struct" | "union") IDENTIFIER? "{" MemberDeclaration* "}" (IDENTIFIER ("," IDENTIFIER)*)? ";"
   */
  parseStructOrUnionDefinition() {
    this.logStep('Entering parseStructOrUnionDefinition');
    const kindTok = this.advance(); // consume 'struct' or 'union'
    const isUnion = kindTok.type === TokenType.KEYWORD_UNION;
    const nodeName = isUnion ? 'UnionDefinition' : 'StructDefinition';

    let tag = null;
    if (this.match(TokenType.IDENTIFIER)) {
      tag = this.previous().value;
      this.logStep(`Parsing ${kindTok.value} '${tag}'`);
    }

    this.consume(TokenType.LBRACE, `Expected '{' for ${kindTok.value} body`);
    const defNode = new ParseNode(nodeName, tag, kindTok.line, kindTok.column);
    if (tag) {
      defNode.addChild(new ParseNode('TypeName', tag, kindTok.line, kindTok.column));
    }

    const membersNode = new ParseNode('MemberList', null, kindTok.line, kindTok.column);
    while (!this.check(TokenType.RBRACE) && !this.isAtEnd()) {
      try {
        membersNode.addChild(this.parseVarDeclaration());
      } catch (err) {
        if (err instanceof ParseException) {
          this.synchronize();
        } else {
          throw err;
        }
      }
    }
    this.consume(TokenType.RBRACE, `Expected '}' to close ${kindTok.value} definition`);
    defNode.addChild(membersNode);

    // Optional instance variables: struct Point { int x; int y; } p1, p2;
    if (!this.check(TokenType.SEMICOLON)) {
      const initList = new ParseNode('InstanceList', null, kindTok.line, kindTok.column);
      do {
        initList.addChild(this.parseVarInit());
      } while (this.match(TokenType.COMMA));
      defNode.addChild(initList);
    }

    this.consume(TokenType.SEMICOLON, `Expected ';' after ${kindTok.value} definition`);
    this.logStep(`Completed parseStructOrUnionDefinition '${tag || ''}'`);
    return defNode;
  }

  /**
   * FunctionDeclaration ::= ReturnType IDENTIFIER "(" ParameterList? ")" ( Block | ";" )
   */
  parseFunctionDeclaration() {
    this.logStep('Entering parseFunctionDeclaration');
    const returnTypeNode = this.parseReturnType();
    const nameToken = this.consume(TokenType.IDENTIFIER, 'Expected function name after return type');
    this.logStep(`Parsing function: '${nameToken.value}'`);

    const funcNode = new ParseNode('FunctionDeclaration', nameToken.value, nameToken.line, nameToken.column);
    funcNode.addChild(returnTypeNode);
    funcNode.addChild(new ParseNode('FunctionName', nameToken.value, nameToken.line, nameToken.column));

    this.consume(TokenType.LPAREN, "Expected '(' after function name");
    const paramsNode = new ParseNode('ParameterList', null, this.previous().line, this.previous().column);

    if (!this.check(TokenType.RPAREN)) {
      do {
        paramsNode.addChild(this.parseParameter());
      } while (this.match(TokenType.COMMA));
    }

    this.consume(TokenType.RPAREN, "Expected ')' after parameter list");
    funcNode.addChild(paramsNode);

    // If followed by semicolon, this is a function prototype / forward declaration!
    if (this.match(TokenType.SEMICOLON)) {
      funcNode.addChild(new ParseNode('IsPrototype', 'true', nameToken.line, nameToken.column));
      this.logStep(`Completed parsing function prototype '${nameToken.value}'`);
      return funcNode;
    }

    const bodyNode = this.parseBlock();
    funcNode.addChild(bodyNode);
    this.logStep(`Completed parsing function '${nameToken.value}'`);
    return funcNode;
  }

  parseReturnType() {
    let isConst = false;
    if (this.match(TokenType.KEYWORD_CONST)) {
      isConst = true;
    }

    if (this.match(TokenType.KEYWORD_VOID)) {
      const tok = this.previous();
      let typeName = isConst ? 'const void' : 'void';
      while (this.match(TokenType.MULTIPLY)) {
        typeName += '*';
      }
      return new ParseNode('ReturnType', typeName, tok.line, tok.column);
    }

    const typeNode = this.parseType('ReturnType', true);
    if (isConst && !typeNode.value.startsWith('const ')) {
      typeNode.value = `const ${typeNode.value}`;
    }
    return typeNode;
  }

  isFunctionPointerParamLookahead() {
    let offset = 0;
    if (this.peek(offset).type === TokenType.KEYWORD_CONST) {
      offset++;
    }
    const tok = this.peek(offset);
    if (
      tok.type === TokenType.KEYWORD_VOID ||
      tok.type === TokenType.KEYWORD_INT ||
      tok.type === TokenType.KEYWORD_FLOAT ||
      tok.type === TokenType.KEYWORD_DOUBLE ||
      tok.type === TokenType.KEYWORD_CHAR ||
      tok.type === TokenType.KEYWORD_UNSIGNED ||
      tok.type === TokenType.KEYWORD_SIGNED ||
      tok.type === TokenType.KEYWORD_LONG ||
      tok.type === TokenType.KEYWORD_SHORT ||
      tok.type === TokenType.IDENTIFIER
    ) {
      while (
        this.peek(offset).type === TokenType.KEYWORD_UNSIGNED ||
        this.peek(offset).type === TokenType.KEYWORD_SIGNED ||
        this.peek(offset).type === TokenType.KEYWORD_LONG ||
        this.peek(offset).type === TokenType.KEYWORD_SHORT ||
        this.peek(offset).type === TokenType.KEYWORD_INT ||
        this.peek(offset).type === TokenType.KEYWORD_FLOAT ||
        this.peek(offset).type === TokenType.KEYWORD_DOUBLE ||
        this.peek(offset).type === TokenType.KEYWORD_CHAR ||
        this.peek(offset).type === TokenType.KEYWORD_VOID
      ) {
        offset++;
      }
      if (tok.type === TokenType.IDENTIFIER) {
        offset++;
      }
    } else if (
      tok.type === TokenType.KEYWORD_STRUCT ||
      tok.type === TokenType.KEYWORD_UNION ||
      tok.type === TokenType.KEYWORD_ENUM
    ) {
      offset++;
      if (this.peek(offset).type !== TokenType.IDENTIFIER) return false;
      offset++;
    } else {
      return false;
    }

    while (this.peek(offset).type === TokenType.MULTIPLY) {
      offset++;
    }

    if (this.peek(offset).type !== TokenType.LPAREN) return false;
    offset++;
    if (this.peek(offset).type !== TokenType.MULTIPLY) return false;
    offset++;
    if (this.peek(offset).type !== TokenType.IDENTIFIER) return false;
    offset++;
    if (this.peek(offset).type !== TokenType.RPAREN) return false;
    offset++;
    return this.peek(offset).type === TokenType.LPAREN;
  }

  parseFunctionPointerParameter(isConst = false) {
    this.logStep('Parsing function pointer parameter');
    const returnTypeNode = this.parseReturnType();
    this.consume(TokenType.LPAREN, "Expected '(' for function pointer parameter");
    this.consume(TokenType.MULTIPLY, "Expected '*' for function pointer");
    const nameTok = this.consume(TokenType.IDENTIFIER, "Expected identifier for function pointer name");
    this.consume(TokenType.RPAREN, "Expected ')' after function pointer name");

    this.consume(TokenType.LPAREN, "Expected '(' for function pointer argument types");
    const argTypesNode = new ParseNode('FnPtrArgList', null, nameTok.line, nameTok.column);
    if (!this.check(TokenType.RPAREN)) {
      do {
        argTypesNode.addChild(this.parseParameter());
      } while (this.match(TokenType.COMMA));
    }
    this.consume(TokenType.RPAREN, "Expected ')' after function pointer argument types");

    const fnPtrNode = new ParseNode('FunctionPointerParameter', nameTok.value, nameTok.line, nameTok.column);
    if (isConst) {
      fnPtrNode.addChild(new ParseNode('Qualifier', 'const', nameTok.line, nameTok.column));
    }
    fnPtrNode.addChild(returnTypeNode);
    fnPtrNode.addChild(new ParseNode('Identifier', nameTok.value, nameTok.line, nameTok.column));
    fnPtrNode.addChild(argTypesNode);
    return fnPtrNode;
  }

  parseParameter() {
    // 1. Check for 'void' as sole parameter: (void)
    if (this.check(TokenType.KEYWORD_VOID) && this.peek(1).type === TokenType.RPAREN) {
      const voidTok = this.advance();
      return new ParseNode('Parameter', 'void', voidTok.line, voidTok.column);
    }

    let isConst = false;
    if (this.match(TokenType.KEYWORD_CONST)) {
      isConst = true;
    }

    // 2. Check for function pointer parameter: int (*cmp)(const void*, const void*)
    if (this.isFunctionPointerParamLookahead()) {
      return this.parseFunctionPointerParameter(isConst);
    }

    // 3. Regular parameter
    const typeNode = this.parseType('ParamType', false);

    // Optional pointer on parameter name: Stack *s, void *a, int *const a
    let pointerCount = 0;
    let isConstPointer = false;
    while (this.match(TokenType.MULTIPLY)) {
      pointerCount++;
      if (this.match(TokenType.KEYWORD_CONST)) {
        isConstPointer = true;
      }
    }

    // Parameter identifier is optional in prototypes: int add(int, int); or int add(int a, int b);
    let paramName = '';
    let idTok = null;
    if (this.match(TokenType.IDENTIFIER)) {
      idTok = this.previous();
      paramName = idTok.value;
    }

    const paramNode = new ParseNode('Parameter', paramName || typeNode.value, typeNode.line, typeNode.column);
    if (isConst || isConstPointer) {
      paramNode.addChild(new ParseNode('Qualifier', 'const', typeNode.line, typeNode.column));
    }
    paramNode.addChild(typeNode);
    if (pointerCount > 0) {
      paramNode.addChild(new ParseNode('PointerDepth', String(pointerCount), typeNode.line, typeNode.column));
    }
    if (paramName) {
      paramNode.addChild(new ParseNode('Identifier', paramName, idTok.line, idTok.column));
    }

    // Support array parameter: int arr[], int arr[10], int matrix[][10]
    while (this.match(TokenType.LBRACKET)) {
      const openBracket = this.previous();
      let dimVal = '';
      if (!this.check(TokenType.RBRACKET)) {
        if (this.match(TokenType.INTEGER_LITERAL, TokenType.IDENTIFIER)) {
          dimVal = this.previous().value;
        } else {
          const expr = this.parseExpression();
          dimVal = expr.value || '';
        }
      }
      this.consume(TokenType.RBRACKET, "Expected ']' for array parameter");
      paramNode.addChild(new ParseNode('ArrayDimension', dimVal ? `[${dimVal}]` : '[]', openBracket.line, openBracket.column));
    }
    return paramNode;
  }

  /**
   * Statement ::= VarDeclaration
   *             | AssignmentOrCallStatement
   *             | IfStatement
   *             | WhileStatement
   *             | ReturnStatement
   *             | Block
   *             | ";"
   */
  parseStatement() {
    this.logStep('Entering parseStatement');

    // 0. Preprocessor Directive inside block
    if (this.match(TokenType.PREPROCESSOR)) {
      const tok = this.previous();
      return this.parsePreprocessorDirective(tok);
    }

    // 0b. Typedef declaration inside block
    if (this.match(TokenType.KEYWORD_TYPEDEF)) {
      return this.parseTypedef();
    }

    // 1. Enum Definition or Variable Declaration
    if (this.check(TokenType.KEYWORD_ENUM)) {
      if (
        (this.peek(1).type === TokenType.IDENTIFIER && this.peek(2).type === TokenType.LBRACE) ||
        this.peek(1).type === TokenType.LBRACE
      ) {
        return this.parseEnumDefinition();
      }
      return this.parseVarDeclaration();
    }

    // 2. Struct or Union Definition inside block
    if (this.check(TokenType.KEYWORD_STRUCT) || this.check(TokenType.KEYWORD_UNION)) {
      if (
        (this.peek(1).type === TokenType.IDENTIFIER && this.peek(2).type === TokenType.LBRACE) ||
        this.peek(1).type === TokenType.LBRACE
      ) {
        return this.parseStructOrUnionDefinition();
      }
      // Otherwise, struct/union variable declaration: struct Token tokens[100];
      return this.parseVarDeclaration();
    }

    // 3. Const variable or function declaration
    if (this.check(TokenType.KEYWORD_CONST)) {
      if (this.isFunctionDeclaration()) {
        return this.parseFunctionDeclaration();
      }
      return this.parseVarDeclaration();
    }

    // 4. Function Declaration (prototype or local function) inside block
    if (this.isFunctionDeclaration()) {
      return this.parseFunctionDeclaration();
    }

    // Explicit error check: 'void' used as variable type
    if (this.check(TokenType.KEYWORD_VOID)) {
      if (this.peek(1).type === TokenType.MULTIPLY || this.peek(1).type === TokenType.LPAREN) {
        return this.parseVarDeclaration(); // void *p; or void (*fp)(int); allowed
      }
      const voidTok = this.advance();
      const err = this.recordError(
        `'void' cannot be used as a variable type (only valid as function return type)`,
        voidTok.line,
        voidTok.column
      );
      throw new ParseException(err);
    }

    // 5. Primitive & composite Variable Declaration: int, float, double, char, unsigned, signed, long, short
    if (
      this.check(TokenType.KEYWORD_INT) ||
      this.check(TokenType.KEYWORD_FLOAT) ||
      this.check(TokenType.KEYWORD_DOUBLE) ||
      this.check(TokenType.KEYWORD_CHAR) ||
      this.check(TokenType.KEYWORD_UNSIGNED) ||
      this.check(TokenType.KEYWORD_SIGNED) ||
      this.check(TokenType.KEYWORD_LONG) ||
      this.check(TokenType.KEYWORD_SHORT)
    ) {
      return this.parseVarDeclaration();
    }

    // 6. Custom type variable declaration (e.g. Stack s; Queue *q; Token t;)
    if (this.check(TokenType.IDENTIFIER)) {
      if (this.isCustomTypeDeclaration()) {
        return this.parseVarDeclaration();
      }
    }

    // 7. Pointer dereference assignment or statement: *p = 10; or *p++; or *(p + i) = 20;
    if (this.check(TokenType.MULTIPLY)) {
      return this.parseDereferenceAssignmentOrStatement();
    }

    // 8. Parenthesized statement: (*p) = 20; (*p)++; ((void)0); etc.
    if (this.check(TokenType.LPAREN)) {
      return this.parseParenStatement();
    }

    // 9. Control flow: if statement
    if (this.match(TokenType.KEYWORD_IF)) {
      return this.parseIfStatement();
    }

    // 10. Loop: while statement
    if (this.match(TokenType.KEYWORD_WHILE)) {
      return this.parseWhileStatement();
    }

    // 11. Loop: do-while statement
    if (this.match(TokenType.KEYWORD_DO)) {
      return this.parseDoWhileStatement();
    }

    // 12. Loop: for statement
    if (this.match(TokenType.KEYWORD_FOR)) {
      return this.parseForStatement();
    }

    // 13. Control flow: switch statement
    if (this.match(TokenType.KEYWORD_SWITCH)) {
      return this.parseSwitchStatement();
    }

    // 14. Jump: break statement
    if (this.match(TokenType.KEYWORD_BREAK)) {
      const tok = this.previous();
      this.consume(TokenType.SEMICOLON, "Expected ';' after 'break'");
      return new ParseNode('BreakStatement', 'break', tok.line, tok.column);
    }

    // 15. Jump: continue statement
    if (this.match(TokenType.KEYWORD_CONTINUE)) {
      const tok = this.previous();
      this.consume(TokenType.SEMICOLON, "Expected ';' after 'continue'");
      return new ParseNode('ContinueStatement', 'continue', tok.line, tok.column);
    }

    // 14. Prefix increment / decrement statement: ++i; or --i;
    if (this.match(TokenType.INCREMENT, TokenType.DECREMENT)) {
      const opTok = this.previous();
      const operand = this.parseUnary();
      this.consume(TokenType.SEMICOLON, "Expected ';' after statement");
      const stmt = new ParseNode('UpdateStatement', opTok.value, opTok.line, opTok.column);
      stmt.addChild(operand);
      return stmt;
    }

    // 15. Return statement
    if (this.match(TokenType.KEYWORD_RETURN)) {
      return this.parseReturnStatement();
    }

    // 16. Block: { ... }
    if (this.check(TokenType.LBRACE)) {
      return this.parseBlock();
    }

    // 17. Empty statement: ;
    if (this.match(TokenType.SEMICOLON)) {
      const tok = this.previous();
      return new ParseNode('EmptyStatement', ';', tok.line, tok.column);
    }

    // 18. Assignment or Method Call Statement (starting with IDENTIFIER)
    if (this.check(TokenType.IDENTIFIER)) {
      return this.parseAssignmentOrCallStatement();
    }

    // Unexpected statement start
    const unexpected = this.peek();
    const err = this.recordError(
      `Unexpected token '${unexpected.value}' where statement was expected`,
      unexpected.line,
      unexpected.column
    );
    throw new ParseException(err);
  }

  isCustomTypeDeclaration() {
    // Current is IDENTIFIER (e.g. 'Stack', 'Queue', 'Token')
    // Followed by '*' -> Stack *s; Stack *const s;
    if (this.peek(1).type === TokenType.MULTIPLY) {
      return true;
    }
    // Followed by IDENTIFIER -> Stack s; Queue q;
    if (this.peek(1).type === TokenType.IDENTIFIER) {
      return true;
    }
    // Followed by 'const' -> Stack const *s;
    if (this.peek(1).type === TokenType.KEYWORD_CONST) {
      return true;
    }
    // Followed by '(' starting a function pointer -> Stack (*fp)(int);
    if (this.peek(1).type === TokenType.LPAREN && this.isFunctionPointerVarLookahead(1)) {
      return true;
    }
    return false;
  }

  parseDereferenceAssignmentOrStatement() {
    this.logStep('Entering parseDereferenceAssignmentOrStatement');
    const starTok = this.consume(TokenType.MULTIPLY, "Expected '*' for pointer dereference");
    const derefTarget = new ParseNode('DereferenceTarget', '*', starTok.line, starTok.column);
    const ptrOperand = this.parseUnary();
    derefTarget.addChild(ptrOperand);

    // Case 1: Postfix increment/decrement: *p++; or *p--;
    if (this.match(TokenType.INCREMENT, TokenType.DECREMENT)) {
      const opTok = this.previous();
      this.consume(TokenType.SEMICOLON, `Expected ';' after '${opTok.value}'`);
      const stmt = new ParseNode('UpdateStatement', opTok.value, starTok.line, starTok.column);
      stmt.addChild(derefTarget);
      return stmt;
    }

    // Case 2: Just *p; (evaluated for side-effects, e.g. *p++; where ++ was inside unary)
    if (this.match(TokenType.SEMICOLON)) {
      const stmt = new ParseNode('DereferenceStatement', '*', starTok.line, starTok.column);
      stmt.addChild(derefTarget);
      return stmt;
    }

    // Case 3: Assignment: *p = expr; or *p += expr;
    const assignTok = this.matchAssignmentOperator();
    if (assignTok) {
      const valExpr = this.parseExpression();
      this.consume(TokenType.SEMICOLON, "Expected ';' after assignment");

      const stmt = new ParseNode('AssignmentStatement', assignTok.value, starTok.line, starTok.column);
      stmt.addChild(derefTarget);
      stmt.addChild(valExpr);
      this.logStep('Completed pointer dereference assignment');
      return stmt;
    }

    const cur = this.peek();
    const err = this.recordError(
      `Expected assignment operator ('=', '+=', etc.), '++', '--', or ';' after pointer dereference (found '${cur.value}')`,
      cur.line,
      cur.column
    );
    throw new ParseException(err);
  }

  parseParenStatement() {
    this.logStep('Entering parseParenStatement');
    const startTok = this.peek();
    const expr = this.parsePrimary(); // parses parenthesized expression: (*p) or (p + 1)

    // Case 1: Postfix increment/decrement: (*p)++; or (*p)--;
    if (this.match(TokenType.INCREMENT, TokenType.DECREMENT)) {
      const opTok = this.previous();
      this.consume(TokenType.SEMICOLON, `Expected ';' after '${opTok.value}'`);
      const stmt = new ParseNode('UpdateStatement', opTok.value, startTok.line, startTok.column);
      stmt.addChild(expr);
      return stmt;
    }

    // Case 2: Assignment: (*p) = 20; or (*(p + 1)) += 5;
    const assignTok = this.matchAssignmentOperator();
    if (assignTok) {
      const valExpr = this.parseExpression();
      this.consume(TokenType.SEMICOLON, "Expected ';' after assignment");
      const stmt = new ParseNode('AssignmentStatement', assignTok.value, startTok.line, startTok.column);
      stmt.addChild(expr);
      stmt.addChild(valExpr);
      return stmt;
    }

    // Case 3: Direct semicolon: ((void)0);
    if (this.match(TokenType.SEMICOLON)) {
      const stmt = new ParseNode('ExpressionStatement', null, startTok.line, startTok.column);
      stmt.addChild(expr);
      return stmt;
    }

    // Case 4: Any further binary expression
    const fullExpr = this.parseRemainingBinary(expr);
    this.consume(TokenType.SEMICOLON, "Expected ';' after statement");
    const stmt = new ParseNode('ExpressionStatement', null, startTok.line, startTok.column);
    stmt.addChild(fullExpr);
    return stmt;
  }

  parseRemainingBinary(expr) {
    let cur = expr;
    while (
      this.match(
        TokenType.PLUS, TokenType.MINUS, TokenType.MULTIPLY, TokenType.DIVIDE, TokenType.MODULO,
        TokenType.SHIFT_LEFT, TokenType.SHIFT_RIGHT,
        TokenType.BITWISE_AND, TokenType.BITWISE_OR, TokenType.BITWISE_XOR
      )
    ) {
      const op = this.previous();
      const right = this.parseMultiplicative();
      const binNode = new ParseNode('BinaryExpression', op.value, op.line, op.column);
      binNode.addChild(cur);
      binNode.addChild(right);
      cur = binNode;
    }
    return cur;
  }

  /**
   * VarDeclaration ::= VarType VarInit ( "," VarInit )* ";"
   */
  parseVarDeclaration() {
    this.logStep('Entering parseVarDeclaration');
    let isConst = false;
    if (this.match(TokenType.KEYWORD_CONST)) {
      isConst = true;
    }
    const typeNode = this.parseVarType('VarType');
    if (isConst && !typeNode.value.startsWith('const ')) {
      typeNode.value = `const ${typeNode.value}`;
    }
    const declNode = new ParseNode('VarDeclaration', null, typeNode.line, typeNode.column);
    if (isConst) {
      declNode.addChild(new ParseNode('Qualifier', 'const', typeNode.line, typeNode.column));
    }
    declNode.addChild(typeNode);

    const initList = new ParseNode('InitList', null, typeNode.line, typeNode.column);
    do {
      initList.addChild(this.parseVarInit());
    } while (this.match(TokenType.COMMA));

    declNode.addChild(initList);
    this.consume(TokenType.SEMICOLON, "Expected ';' after variable declaration");
    this.logStep('Completed parseVarDeclaration');
    return declNode;
  }

  /**
   * General Type Parser supporting primitives, struct, union, enum, custom types, and pointers.
   * Type ::= ( "struct" IDENTIFIER | "union" IDENTIFIER | "enum" IDENTIFIER | "void" | "int" | "float" | "char" | IDENTIFIER ) "* "*
   */
  parseType(nodeLabel = 'Type', allowVoid = false) {
    let typeName = '';
    const startTok = this.peek();

    let isConst = false;
    if (this.match(TokenType.KEYWORD_CONST)) {
      isConst = true;
    }

    // 1. struct Name, union Name, or enum Name
    if (this.match(TokenType.KEYWORD_STRUCT, TokenType.KEYWORD_UNION, TokenType.KEYWORD_ENUM)) {
      const kind = this.previous().value;
      const nameTok = this.consume(TokenType.IDENTIFIER, `Expected identifier after '${kind}'`);
      typeName = `${kind} ${nameTok.value}`;
    }
    // 2. void (valid for return types, or void pointers void*, or void function pointers void(*fp)())
    else if (this.match(TokenType.KEYWORD_VOID)) {
      typeName = 'void';
      if (!allowVoid && !this.check(TokenType.MULTIPLY) && !this.isFunctionPointerVarLookahead()) {
        const err = this.recordError(
          `'void' cannot be used as a variable type (only valid as function return type)`,
          startTok.line,
          startTok.column
        );
        throw new ParseException(err);
      }
    }
    // 3. Primitives & composite type specifiers: int, float, double, char, unsigned, signed, long, short
    else if (
      this.check(TokenType.KEYWORD_INT) ||
      this.check(TokenType.KEYWORD_FLOAT) ||
      this.check(TokenType.KEYWORD_DOUBLE) ||
      this.check(TokenType.KEYWORD_CHAR) ||
      this.check(TokenType.KEYWORD_UNSIGNED) ||
      this.check(TokenType.KEYWORD_SIGNED) ||
      this.check(TokenType.KEYWORD_LONG) ||
      this.check(TokenType.KEYWORD_SHORT)
    ) {
      const parts = [];
      while (
        this.match(
          TokenType.KEYWORD_UNSIGNED,
          TokenType.KEYWORD_SIGNED,
          TokenType.KEYWORD_LONG,
          TokenType.KEYWORD_SHORT,
          TokenType.KEYWORD_INT,
          TokenType.KEYWORD_FLOAT,
          TokenType.KEYWORD_DOUBLE,
          TokenType.KEYWORD_CHAR
        )
      ) {
        parts.push(this.previous().value);
      }
      typeName = parts.join(' ');
    }
    // 4. Custom type identifier: Stack, Queue, Token, Node, etc.
    else if (this.match(TokenType.IDENTIFIER)) {
      typeName = this.previous().value;
    } else {
      const cur = this.peek();
      const err = this.recordError(
        `Expected data type, but found '${cur.value}'`,
        cur.line,
        cur.column
      );
      throw new ParseException(err);
    }

    // Allow 'const' AFTER the base type: e.g. int const, void const, struct Node const
    if (this.match(TokenType.KEYWORD_CONST)) {
      isConst = true;
    }

    if (isConst && !typeName.startsWith('const ')) {
      typeName = `const ${typeName}`;
    }

    // Optional pointer stars attached to type: * (e.g. int*, int* const, void*)
    let pointerCount = 0;
    while (this.match(TokenType.MULTIPLY)) {
      pointerCount++;
      typeName += '*';
      if (this.match(TokenType.KEYWORD_CONST)) {
        typeName += ' const';
      }
    }

    const typeNode = new ParseNode(nodeLabel, typeName, startTok.line, startTok.column);
    if (pointerCount > 0) {
      typeNode.addChild(new ParseNode('PointerDepth', String(pointerCount), startTok.line, startTok.column));
    }
    return typeNode;
  }

  parseVarType(nodeLabel = 'Type') {
    return this.parseType(nodeLabel, false);
  }

  isFunctionPointerVarLookahead(offset = 0) {
    if (this.peek(offset).type !== TokenType.LPAREN) return false;
    offset++;

    if (this.peek(offset).type !== TokenType.MULTIPLY) return false;
    offset++;

    while (this.peek(offset).type === TokenType.MULTIPLY || this.peek(offset).type === TokenType.KEYWORD_CONST) {
      offset++;
    }

    if (this.peek(offset).type !== TokenType.IDENTIFIER) return false;
    offset++;

    // Optional array dimensions on function pointer: (*handlers[10])
    while (this.peek(offset).type === TokenType.LBRACKET) {
      while (this.peek(offset).type !== TokenType.RBRACKET && !this.isAtEnd()) {
        offset++;
      }
      if (this.peek(offset).type === TokenType.RBRACKET) {
        offset++;
      }
    }

    if (this.peek(offset).type !== TokenType.RPAREN) return false;
    offset++;

    return this.peek(offset).type === TokenType.LPAREN;
  }

  parseFunctionPointerVarInit() {
    this.logStep('Entering parseFunctionPointerVarInit');
    const openParen = this.consume(TokenType.LPAREN, "Expected '(' for function pointer");
    let pointerDepth = 0;
    let isConst = false;

    while (this.match(TokenType.MULTIPLY)) {
      pointerDepth++;
      if (this.match(TokenType.KEYWORD_CONST)) {
        isConst = true;
      }
    }

    const idTok = this.consume(TokenType.IDENTIFIER, "Expected identifier for function pointer");
    const fnPtrNode = new ParseNode('FunctionPointerInit', idTok.value, idTok.line, idTok.column);
    fnPtrNode.addChild(new ParseNode('Identifier', idTok.value, idTok.line, idTok.column));
    if (pointerDepth > 0) {
      fnPtrNode.addChild(new ParseNode('PointerDepth', String(pointerDepth), idTok.line, idTok.column));
    }
    if (isConst) {
      fnPtrNode.addChild(new ParseNode('Qualifier', 'const', idTok.line, idTok.column));
    }

    // Optional array dimensions: (*handlers[10])
    while (this.match(TokenType.LBRACKET)) {
      const openBracket = this.previous();
      let sizeVal = '';
      if (!this.check(TokenType.RBRACKET)) {
        if (this.match(TokenType.INTEGER_LITERAL, TokenType.IDENTIFIER)) {
          sizeVal = this.previous().value;
        } else {
          const expr = this.parseExpression();
          sizeVal = expr.value || '';
        }
      }
      this.consume(TokenType.RBRACKET, "Expected ']' after array size");
      fnPtrNode.addChild(new ParseNode('ArrayDimension', sizeVal ? `[${sizeVal}]` : '[]', openBracket.line, openBracket.column));
    }

    this.consume(TokenType.RPAREN, "Expected ')' after function pointer identifier");

    // Parameters: (int) or (int, float) or (void) or ()
    this.consume(TokenType.LPAREN, "Expected '(' for function pointer parameters");
    const paramsNode = new ParseNode('ParameterList', null, this.previous().line, this.previous().column);
    if (!this.check(TokenType.RPAREN)) {
      do {
        paramsNode.addChild(this.parseParameter());
      } while (this.match(TokenType.COMMA));
    }
    this.consume(TokenType.RPAREN, "Expected ')' after function pointer parameters");
    fnPtrNode.addChild(paramsNode);

    // Optional initialization: = myFunc or = &myFunc
    if (this.match(TokenType.ASSIGN)) {
      const eqToken = this.previous();
      const initVal = this.parseInitializer();
      const assignNode = new ParseNode('Initializer', '=', eqToken.line, eqToken.column);
      assignNode.addChild(initVal);
      fnPtrNode.addChild(assignNode);
    }

    this.logStep(`Completed parseFunctionPointerVarInit '${idTok.value}'`);
    return fnPtrNode;
  }

  /**
   * VarInit ::= ( "* "* IDENTIFIER | FunctionPointerVarInit ) ( "[" INTEGER_LITERAL "]" )? ( "=" Expression )?
   */
  parseVarInit() {
    // 1. Check for function pointer variable declarator: (*a)(int, float)
    if (this.isFunctionPointerVarLookahead()) {
      return this.parseFunctionPointerVarInit();
    }

    let pointerDepth = 0;
    let isConstPointer = false;
    while (this.match(TokenType.MULTIPLY)) {
      pointerDepth++;
      if (this.match(TokenType.KEYWORD_CONST)) {
        isConstPointer = true;
      }
    }

    const idToken = this.consume(TokenType.IDENTIFIER, 'Expected variable identifier');
    const initNode = new ParseNode('VarInit', idToken.value, idToken.line, idToken.column);
    if (pointerDepth > 0) {
      initNode.addChild(new ParseNode('PointerDepth', String(pointerDepth), idToken.line, idToken.column));
    }
    if (isConstPointer) {
      initNode.addChild(new ParseNode('Qualifier', 'const', idToken.line, idToken.column));
    }
    initNode.addChild(new ParseNode('Identifier', idToken.value, idToken.line, idToken.column));

    // Array dimensions: e.g. [10], [], [n], [3][3], [2][4][6]
    while (this.match(TokenType.LBRACKET)) {
      const openBracket = this.previous();
      let sizeVal = '';
      let sizeNode = null;
      if (!this.check(TokenType.RBRACKET)) {
        if (this.match(TokenType.INTEGER_LITERAL, TokenType.IDENTIFIER)) {
          sizeVal = this.previous().value;
          sizeNode = new ParseNode('Size', sizeVal, openBracket.line, openBracket.column);
        } else {
          sizeNode = this.parseExpression();
          sizeVal = sizeNode.value || 'expr';
        }
      }
      this.consume(TokenType.RBRACKET, "Expected ']' after array size");
      const arrDimNode = new ParseNode('ArrayDimension', sizeVal, openBracket.line, openBracket.column);
      if (sizeNode) arrDimNode.addChild(sizeNode);
      initNode.addChild(arrDimNode);
      this.logStep(`Parsed array dimension: '[${sizeVal}]'`);
    }

    // Optional Initialization: = Expression OR = { 1, 2, 3 }
    if (this.match(TokenType.ASSIGN)) {
      const eqToken = this.previous();
      this.logStep(`Matched '=' assignment for variable '${idToken.value}'`);
      const initVal = this.parseInitializer();
      const assignNode = new ParseNode('Initializer', '=', eqToken.line, eqToken.column);
      assignNode.addChild(initVal);
      initNode.addChild(assignNode);
    }

    return initNode;
  }

  /**
   * Parses initializer which can be an expression or a braced list: { 1, 2, 3 }
   */
  parseInitializer() {
    if (this.check(TokenType.LBRACE)) {
      return this.parseInitializerList();
    }
    return this.parseExpression();
  }

  /**
   * InitializerList ::= "{" ( ( Expression | InitializerList ) ( "," ( Expression | InitializerList ) )* )? ","? "}"
   */
  parseInitializerList() {
    this.logStep('Entering parseInitializerList');
    const openBrace = this.consume(TokenType.LBRACE, "Expected '{' to start initializer list");
    const listNode = new ParseNode('InitializerList', '{}', openBrace.line, openBrace.column);

    if (!this.check(TokenType.RBRACE)) {
      do {
        if (this.check(TokenType.RBRACE)) break; // trailing comma support: { 1, 2, }
        if (this.check(TokenType.LBRACE)) {
          listNode.addChild(this.parseInitializerList());
        } else {
          listNode.addChild(this.parseExpression());
        }
      } while (this.match(TokenType.COMMA));
    }

    this.consume(TokenType.RBRACE, "Expected '}' after initializer list");
    this.logStep('Completed parseInitializerList');
    return listNode;
  }

  /**
   * AssignmentOrCallStatement ::= IDENTIFIER ( ( "[" Expression "]" )? "=" Expression | "(" ArgumentList? ")" ) ";"
   * Also supports member access assignments:
   *   tokens[tokenCount].type = type;
   *   obj.member = val;
   *   ptr->member = val;
   */
  parseAssignmentOrCallStatement() {
    this.logStep('Entering parseAssignmentOrCallStatement');
    const idToken = this.advance(); // consume IDENTIFIER

    // Case A: Simple Function / Method Call -> id(arg1, arg2);
    if (this.check(TokenType.LPAREN)) {
      const callNode = this.finishMethodCall(idToken);
      this.consume(TokenType.SEMICOLON, "Expected ';' after function call");
      const stmtNode = new ParseNode('CallStatement', idToken.value, idToken.line, idToken.column);
      stmtNode.addChild(callNode);
      return stmtNode;
    }

    // Case Postfix Update: id++; or id--;
    if (this.match(TokenType.INCREMENT, TokenType.DECREMENT)) {
      const opTok = this.previous();
      this.consume(TokenType.SEMICOLON, `Expected ';' after '${opTok.value}'`);
      const stmt = new ParseNode('UpdateStatement', opTok.value, idToken.line, idToken.column);
      stmt.addChild(new ParseNode('Identifier', idToken.value, idToken.line, idToken.column));
      return stmt;
    }

    // Case B: Standard Single Variable Assignment -> x = expr; or x += expr;
    const assignTok = this.matchAssignmentOperator();
    if (assignTok) {
      this.logStep(`Parsing assignment '${assignTok.value}' to '${idToken.value}'`);
      const valExpr = this.parseExpression();
      this.consume(TokenType.SEMICOLON, "Expected ';' after assignment");

      const stmt = new ParseNode('AssignmentStatement', assignTok.value, assignTok.line, assignTok.column);
      stmt.addChild(new ParseNode('Identifier', idToken.value, idToken.line, idToken.column));
      stmt.addChild(valExpr);
      this.logStep(`Completed assignment to '${idToken.value}'`);
      return stmt;
    }

    // Case C: Array or Member Access chain:
    // Examples:
    //   arr[index] = expr;
    //   arr[index] += expr;
    //   tokens[tokenCount].type = type;
    //   record.field += expr;
    //   ptr->member *= expr;
    if (this.check(TokenType.LBRACKET) || this.check(TokenType.DOT) || this.check(TokenType.ARROW)) {
      // First check if it is a simple single array indexing: arr[index] = expr;
      if (this.match(TokenType.LBRACKET)) {
        const openBracket = this.previous();
        this.logStep(`Parsing array indexing for '${idToken.value}'`);
        const indexExpr = this.parseExpression();
        this.consume(TokenType.RBRACKET, "Expected ']' after array index");

        // If directly followed by an assignment operator, this is a standard ArrayAssignment
        const arrAssignTok = this.matchAssignmentOperator();
        if (arrAssignTok) {
          const valExpr = this.parseExpression();
          this.consume(TokenType.SEMICOLON, "Expected ';' after assignment");

          const stmt = new ParseNode('ArrayAssignment', arrAssignTok.value, arrAssignTok.line, arrAssignTok.column);
          const targetNode = new ParseNode('ArrayTarget', idToken.value, idToken.line, idToken.column);
          targetNode.addChild(new ParseNode('Identifier', idToken.value, idToken.line, idToken.column));
          targetNode.addChild(new ParseNode('IndexExpression', null, openBracket.line, openBracket.column).addChild(indexExpr));

          stmt.addChild(targetNode);
          stmt.addChild(valExpr);
          this.logStep(`Completed array assignment '${idToken.value}[...]'`);
          return stmt;
        }

        // Otherwise, it continues into a chained postfix access (e.g. tokens[tokenCount].type)
        let target = new ParseNode('ArrayAccess', idToken.value, openBracket.line, openBracket.column);
        target.addChild(new ParseNode('Identifier', idToken.value, idToken.line, idToken.column));
        target.addChild(new ParseNode('IndexExpression', null, openBracket.line, openBracket.column).addChild(indexExpr));

        target = this.parseRemainingPostfix(target);

        const postAssignTok = this.matchAssignmentOperator();
        if (postAssignTok) {
          const valExpr = this.parseExpression();
          this.consume(TokenType.SEMICOLON, "Expected ';' after assignment");

          const stmt = new ParseNode('MemberAssignment', postAssignTok.value, postAssignTok.line, postAssignTok.column);
          stmt.addChild(target);
          stmt.addChild(valExpr);
          this.logStep(`Completed member assignment for '${idToken.value}'`);
          return stmt;
        }

        if (this.match(TokenType.INCREMENT, TokenType.DECREMENT)) {
          const opTok = this.previous();
          this.consume(TokenType.SEMICOLON, `Expected ';' after '${opTok.value}'`);
          const stmt = new ParseNode('UpdateStatement', opTok.value, idToken.line, idToken.column);
          stmt.addChild(target);
          return stmt;
        }

        if (this.check(TokenType.LPAREN)) {
          const callNode = this.finishMethodCallOnTarget(target);
          this.consume(TokenType.SEMICOLON, "Expected ';' after method call");
          const stmt = new ParseNode('CallStatement', target.value, idToken.line, idToken.column);
          stmt.addChild(callNode);
          return stmt;
        }

        const cur = this.peek();
        const err = this.recordError(
          `Expected assignment operator ('=', '+=', etc.), '++', '--', or '(' after member/array access (found '${cur.value}')`,
          cur.line,
          cur.column
        );
        throw new ParseException(err);
      }

      // Member access starting immediately after identifier: obj.field = expr; or ptr->val += expr;
      let target = new ParseNode('Identifier', idToken.value, idToken.line, idToken.column);
      target = this.parseRemainingPostfix(target);

      const memAssignTok = this.matchAssignmentOperator();
      if (memAssignTok) {
        const valExpr = this.parseExpression();
        this.consume(TokenType.SEMICOLON, "Expected ';' after assignment");

        const stmt = new ParseNode('MemberAssignment', memAssignTok.value, memAssignTok.line, memAssignTok.column);
        stmt.addChild(target);
        stmt.addChild(valExpr);
        this.logStep(`Completed member assignment for '${idToken.value}'`);
        return stmt;
      }

      if (this.match(TokenType.INCREMENT, TokenType.DECREMENT)) {
        const opTok = this.previous();
        this.consume(TokenType.SEMICOLON, `Expected ';' after '${opTok.value}'`);
        const stmt = new ParseNode('UpdateStatement', opTok.value, idToken.line, idToken.column);
        stmt.addChild(target);
        return stmt;
      }

      if (this.check(TokenType.LPAREN)) {
        const callNode = this.finishMethodCallOnTarget(target);
        this.consume(TokenType.SEMICOLON, "Expected ';' after method call");
        const stmt = new ParseNode('CallStatement', target.value, idToken.line, idToken.column);
        stmt.addChild(callNode);
        return stmt;
      }

      const cur = this.peek();
      const err = this.recordError(
        `Expected assignment operator ('=', '+=', etc.), '++', '--', or '(' after member access (found '${cur.value}')`,
        cur.line,
        cur.column
      );
      throw new ParseException(err);
    }

    // Unexpected symbol after identifier
    const cur = this.peek();
    const err = this.recordError(
      `Expected assignment operator ('=', '+=', etc.), '[', '.', '->', '++', '--', or '(' after identifier '${idToken.value}'`,
      cur.line,
      cur.column
    );
    throw new ParseException(err);
  }

  /**
   * Helper to parse chained member accesses (. and ->) and array accesses ([]).
   */
  parseRemainingPostfix(baseNode) {
    let target = baseNode;
    while (this.check(TokenType.DOT) || this.check(TokenType.ARROW) || this.check(TokenType.LBRACKET)) {
      if (this.match(TokenType.DOT, TokenType.ARROW)) {
        const opTok = this.previous();
        const memberTok = this.consume(TokenType.IDENTIFIER, `Expected member identifier after '${opTok.value}'`);
        const nodeType = opTok.type === TokenType.ARROW ? 'PointerMemberAccess' : 'MemberAccess';
        const memNode = new ParseNode(nodeType, opTok.value, opTok.line, opTok.column);
        memNode.addChild(target);
        memNode.addChild(new ParseNode('Member', memberTok.value, memberTok.line, memberTok.column));
        target = memNode;
      } else if (this.match(TokenType.LBRACKET)) {
        const openBracket = this.previous();
        const indexExpr = this.parseExpression();
        this.consume(TokenType.RBRACKET, "Expected ']' after array index");
        const arrNode = new ParseNode('ArrayAccess', target.value, openBracket.line, openBracket.column);
        arrNode.addChild(target);
        arrNode.addChild(new ParseNode('IndexExpression', null, openBracket.line, openBracket.column).addChild(indexExpr));
        target = arrNode;
      }
    }
    return target;
  }

  /**
   * IfStatement ::= "if" "(" Condition ")" Statement ( "else" Statement )?
   */
  parseIfStatement() {
    this.logStep('Entering parseIfStatement');
    const ifToken = this.previous();
    const ifNode = new ParseNode('IfStatement', 'if', ifToken.line, ifToken.column);

    this.consume(TokenType.LPAREN, "Expected '(' after 'if'");
    const condNode = this.parseCondition();
    this.consume(TokenType.RPAREN, "Expected ')' after 'if' condition");

    ifNode.addChild(new ParseNode('Condition', null, ifToken.line, ifToken.column).addChild(condNode));

    this.logStep('Parsing then-branch statement');
    const thenBranch = this.parseStatement();
    ifNode.addChild(new ParseNode('ThenBranch', null, thenBranch.line, thenBranch.column).addChild(thenBranch));

    if (this.match(TokenType.KEYWORD_ELSE)) {
      this.logStep("Matched 'else' branch");
      const elseBranch = this.parseStatement();
      ifNode.addChild(new ParseNode('ElseBranch', null, elseBranch.line, elseBranch.column).addChild(elseBranch));
    }

    this.logStep('Completed parseIfStatement');
    return ifNode;
  }

  /**
   * WhileStatement ::= "while" "(" Condition ")" Statement
   */
  parseWhileStatement() {
    this.logStep('Entering parseWhileStatement');
    const whileToken = this.previous();
    const whileNode = new ParseNode('WhileStatement', 'while', whileToken.line, whileToken.column);

    this.consume(TokenType.LPAREN, "Expected '(' after 'while'");
    const condNode = this.parseCondition();
    this.consume(TokenType.RPAREN, "Expected ')' after 'while' condition");

    whileNode.addChild(new ParseNode('Condition', null, whileToken.line, whileToken.column).addChild(condNode));

    this.logStep('Parsing while-loop body statement');
    const body = this.parseStatement();
    whileNode.addChild(new ParseNode('LoopBody', null, body.line, body.column).addChild(body));

    this.logStep('Completed parseWhileStatement');
    return whileNode;
  }

  /**
   * DoWhileStatement ::= "do" Statement "while" "(" Condition ")" ";"
   */
  parseDoWhileStatement() {
    this.logStep('Entering parseDoWhileStatement');
    const doToken = this.previous();
    const doNode = new ParseNode('DoWhileStatement', 'do-while', doToken.line, doToken.column);

    this.logStep('Parsing do-while loop body statement');
    const body = this.parseStatement();
    doNode.addChild(new ParseNode('LoopBody', null, body.line, body.column).addChild(body));

    this.consume(TokenType.KEYWORD_WHILE, "Expected 'while' after do-while body");
    this.consume(TokenType.LPAREN, "Expected '(' after 'while'");
    const condNode = this.parseCondition();
    this.consume(TokenType.RPAREN, "Expected ')' after 'while' condition");
    this.consume(TokenType.SEMICOLON, "Expected ';' after do-while statement");

    doNode.addChild(new ParseNode('Condition', null, doToken.line, doToken.column).addChild(condNode));

    this.logStep('Completed parseDoWhileStatement');
    return doNode;
  }

  /**
   * ForStatement ::= "for" "(" ( VarDeclaration | ForStepExpression? ";" ) Condition? ";" ForStepExpression? ")" Statement
   */
  parseForStatement() {
    this.logStep('Entering parseForStatement');
    const forToken = this.previous();
    const forNode = new ParseNode('ForStatement', 'for', forToken.line, forToken.column);

    this.consume(TokenType.LPAREN, "Expected '(' after 'for'");

    // 1. Initialization clause:
    // Can be: int i = 0; or i = 0; or ;
    const initClause = new ParseNode('ForInit', null, forToken.line, forToken.column);
    if (this.match(TokenType.SEMICOLON)) {
      this.logStep('For-loop has empty initialization');
    } else if (
      this.isTypeLookahead() ||
      (this.check(TokenType.IDENTIFIER) && this.isCustomTypeDeclaration())
    ) {
      this.logStep('Parsing variable declaration in for-loop init');
      const varDecl = this.parseVarDeclaration();
      initClause.addChild(varDecl);
    } else {
      this.logStep('Parsing expression in for-loop init');
      const initExpr = this.parseForStepExpression();
      this.consume(TokenType.SEMICOLON, "Expected ';' after for-loop initialization");
      initClause.addChild(initExpr);
    }
    forNode.addChild(initClause);

    // 2. Condition clause:
    // Can be: i < 10; or ;
    const condClause = new ParseNode('Condition', null, forToken.line, forToken.column);
    if (!this.check(TokenType.SEMICOLON)) {
      this.logStep('Parsing condition in for-loop');
      const condExpr = this.parseCondition();
      condClause.addChild(condExpr);
    }
    this.consume(TokenType.SEMICOLON, "Expected ';' after for-loop condition");
    forNode.addChild(condClause);

    // 3. Step / Update clause:
    // Can be: i++ or i = i + 1 or ++i or empty
    const stepClause = new ParseNode('ForUpdate', null, forToken.line, forToken.column);
    if (!this.check(TokenType.RPAREN)) {
      this.logStep('Parsing step expression in for-loop');
      const stepExpr = this.parseForStepExpression();
      stepClause.addChild(stepExpr);
    }
    this.consume(TokenType.RPAREN, "Expected ')' after for-loop clauses");
    forNode.addChild(stepClause);

    // 4. Body statement:
    this.logStep('Parsing for-loop body');
    const body = this.parseStatement();
    forNode.addChild(new ParseNode('LoopBody', null, body.line, body.column).addChild(body));

    this.logStep('Completed parseForStatement');
    return forNode;
  }

  /**
   * SwitchStatement ::= "switch" "(" Expression ")" "{" ( "case" Expression ":" Statement* | "default" ":" Statement* )* "}"
   */
  parseSwitchStatement() {
    this.logStep('Entering parseSwitchStatement');
    const switchTok = this.previous();
    const switchNode = new ParseNode('SwitchStatement', 'switch', switchTok.line, switchTok.column);

    this.consume(TokenType.LPAREN, "Expected '(' after 'switch'");
    const expr = this.parseExpression();
    switchNode.addChild(new ParseNode('SwitchExpression', null, switchTok.line, switchTok.column).addChild(expr));
    this.consume(TokenType.RPAREN, "Expected ')' after switch expression");

    this.consume(TokenType.LBRACE, "Expected '{' to start switch body");
    const bodyNode = new ParseNode('SwitchBody', '{}', switchTok.line, switchTok.column);

    while (!this.check(TokenType.RBRACE) && !this.isAtEnd()) {
      if (this.match(TokenType.KEYWORD_CASE)) {
        const caseTok = this.previous();
        const caseNode = new ParseNode('CaseClause', 'case', caseTok.line, caseTok.column);
        const caseVal = this.parseExpression();
        caseNode.addChild(new ParseNode('CaseValue', null, caseTok.line, caseTok.column).addChild(caseVal));
        this.consume(TokenType.COLON, "Expected ':' after case value");

        const caseStmts = new ParseNode('CaseStatements', null, caseTok.line, caseTok.column);
        while (
          !this.check(TokenType.KEYWORD_CASE) &&
          !this.check(TokenType.KEYWORD_DEFAULT) &&
          !this.check(TokenType.RBRACE) &&
          !this.isAtEnd()
        ) {
          caseStmts.addChild(this.parseStatement());
        }
        caseNode.addChild(caseStmts);
        bodyNode.addChild(caseNode);
      } else if (this.match(TokenType.KEYWORD_DEFAULT)) {
        const defTok = this.previous();
        const defNode = new ParseNode('DefaultClause', 'default', defTok.line, defTok.column);
        this.consume(TokenType.COLON, "Expected ':' after 'default'");

        const defStmts = new ParseNode('DefaultStatements', null, defTok.line, defTok.column);
        while (
          !this.check(TokenType.KEYWORD_CASE) &&
          !this.check(TokenType.KEYWORD_DEFAULT) &&
          !this.check(TokenType.RBRACE) &&
          !this.isAtEnd()
        ) {
          defStmts.addChild(this.parseStatement());
        }
        defNode.addChild(defStmts);
        bodyNode.addChild(defNode);
      } else {
        const cur = this.peek();
        const err = this.recordError(
          `Expected 'case', 'default', or '}' in switch body (found '${cur.value}')`,
          cur.line,
          cur.column
        );
        throw new ParseException(err);
      }
    }

    this.consume(TokenType.RBRACE, "Expected '}' after switch body");
    switchNode.addChild(bodyNode);
    this.logStep('Completed parseSwitchStatement');
    return switchNode;
  }

  parseForStepExpression() {
    // 1. Prefix increment / decrement: ++i or --i
    if (this.match(TokenType.INCREMENT, TokenType.DECREMENT)) {
      const op = this.previous();
      const id = this.consume(TokenType.IDENTIFIER, `Expected identifier after '${op.value}'`);
      const node = new ParseNode('PrefixExpression', op.value, op.line, op.column);
      node.addChild(new ParseNode('Identifier', id.value, id.line, id.column));
      return node;
    }

    // 2. Identifier: could be assignment (i = i + 1), member assignment, or postfix (i++)
    if (this.check(TokenType.IDENTIFIER)) {
      const idTok = this.advance();
      let target = new ParseNode('Identifier', idTok.value, idTok.line, idTok.column);

      // Postfix increment / decrement: i++ or i--
      if (this.match(TokenType.INCREMENT, TokenType.DECREMENT)) {
        const op = this.previous();
        const node = new ParseNode('PostfixExpression', op.value, op.line, op.column);
        node.addChild(target);
        return node;
      }

      // Check for array / member access: arr[i] or tokens[i].type
      if (this.check(TokenType.LBRACKET) || this.check(TokenType.DOT) || this.check(TokenType.ARROW)) {
        target = this.parseRemainingPostfix(target);
      }

      // Assignment: target = expr or target += expr
      const assignTok = this.matchAssignmentOperator();
      if (assignTok) {
        const valExpr = this.parseExpression();
        const node = new ParseNode('AssignmentExpression', assignTok.value, assignTok.line, assignTok.column);
        node.addChild(target);
        node.addChild(valExpr);
        return node;
      }

      // Method call: foo(1, 2)
      if (this.check(TokenType.LPAREN)) {
        return this.finishMethodCallOnTarget(target);
      }

      return target;
    }

    return this.parseExpression();
  }

  /**
   * ReturnStatement ::= "return" Expression? ";"
   */
  parseReturnStatement() {
    this.logStep('Entering parseReturnStatement');
    const retToken = this.previous();
    const retNode = new ParseNode('ReturnStatement', 'return', retToken.line, retToken.column);

    if (!this.check(TokenType.SEMICOLON)) {
      retNode.addChild(this.parseExpression());
    }

    this.consume(TokenType.SEMICOLON, "Expected ';' after return statement");
    return retNode;
  }

  /**
   * Block ::= "{" Statement* "}"
   */
  parseBlock() {
    this.logStep('Entering parseBlock');
    const openBrace = this.consume(TokenType.LBRACE, "Expected '{' to start block");
    const blockNode = new ParseNode('Block', '{}', openBrace.line, openBrace.column);

    while (!this.check(TokenType.RBRACE) && !this.isAtEnd()) {
      try {
        const stmt = this.parseStatement();
        if (stmt) blockNode.addChild(stmt);
      } catch (err) {
        if (err instanceof ParseException) {
          this.synchronize();
        } else {
          throw err;
        }
      }
    }

    this.consume(TokenType.RBRACE, "Expected '}' to close block");
    this.logStep('Completed parseBlock');
    return blockNode;
  }

  /* =========================================================================
     Condition & Logical Expressions
     ========================================================================= */

  parseCondition() {
    return this.parseConditional();
  }

  /**
   * ConditionalExpression (Ternary) ::= LogicalOr ( "?" Expression ":" ConditionalExpression )?
   */
  parseConditional() {
    let expr = this.parseLogicalOr();

    if (this.match(TokenType.QUESTION)) {
      const qTok = this.previous();
      this.logStep("Matched ternary operator '?'");
      const thenExpr = this.parseExpression();
      this.consume(TokenType.COLON, "Expected ':' in ternary conditional expression");
      const elseExpr = this.parseConditional();

      const node = new ParseNode('TernaryExpression', '?:', qTok.line, qTok.column);
      node.addChild(new ParseNode('Condition', null, qTok.line, qTok.column).addChild(expr));
      node.addChild(new ParseNode('ThenBranch', null, qTok.line, qTok.column).addChild(thenExpr));
      node.addChild(new ParseNode('ElseBranch', null, qTok.line, qTok.column).addChild(elseExpr));
      return node;
    }

    return expr;
  }

  parseLogicalOr() {
    let expr = this.parseLogicalAnd();

    while (this.match(TokenType.LOGICAL_OR)) {
      const op = this.previous();
      this.logStep("Matched logical operator '||'");
      const right = this.parseLogicalAnd();
      const node = new ParseNode('LogicalOrExpression', op.value, op.line, op.column);
      node.addChild(expr);
      node.addChild(right);
      expr = node;
    }

    return expr;
  }

  parseLogicalAnd() {
    let expr = this.parseBitwiseOr();

    while (this.match(TokenType.LOGICAL_AND)) {
      const op = this.previous();
      this.logStep("Matched logical operator '&&'");
      const right = this.parseBitwiseOr();
      const node = new ParseNode('LogicalAndExpression', op.value, op.line, op.column);
      node.addChild(expr);
      node.addChild(right);
      expr = node;
    }

    return expr;
  }

  parseBitwiseOr() {
    let expr = this.parseBitwiseXor();

    while (this.match(TokenType.BITWISE_OR)) {
      const op = this.previous();
      this.logStep("Matched bitwise operator '|'");
      const right = this.parseBitwiseXor();
      const node = new ParseNode('BinaryExpression', op.value, op.line, op.column);
      node.addChild(expr);
      node.addChild(right);
      expr = node;
    }

    return expr;
  }

  parseBitwiseXor() {
    let expr = this.parseBitwiseAnd();

    while (this.match(TokenType.BITWISE_XOR)) {
      const op = this.previous();
      this.logStep("Matched bitwise operator '^'");
      const right = this.parseBitwiseAnd();
      const node = new ParseNode('BinaryExpression', op.value, op.line, op.column);
      node.addChild(expr);
      node.addChild(right);
      expr = node;
    }

    return expr;
  }

  parseBitwiseAnd() {
    let expr = this.parseEquality();

    while (this.match(TokenType.BITWISE_AND)) {
      const op = this.previous();
      this.logStep("Matched bitwise operator '&'");
      const right = this.parseEquality();
      const node = new ParseNode('BinaryExpression', op.value, op.line, op.column);
      node.addChild(expr);
      node.addChild(right);
      expr = node;
    }

    return expr;
  }

  parseEquality() {
    let expr = this.parseRelational();

    while (this.match(TokenType.EQUAL, TokenType.NOT_EQUAL)) {
      const op = this.previous();
      this.logStep(`Matched equality operator '${op.value}'`);
      const right = this.parseRelational();
      const node = new ParseNode('EqualityExpression', op.value, op.line, op.column);
      node.addChild(expr);
      node.addChild(right);
      expr = node;
    }

    return expr;
  }

  parseRelational() {
    let expr = this.parseShift();

    if (this.match(TokenType.LESS_THAN, TokenType.LESS_EQUAL, TokenType.GREATER_THAN, TokenType.GREATER_EQUAL)) {
      const op = this.previous();
      this.logStep(`Matched relational operator '${op.value}'`);
      const right = this.parseShift();
      const node = new ParseNode('RelationalExpression', op.value, op.line, op.column);
      node.addChild(expr);
      node.addChild(right);
      expr = node;
    }

    return expr;
  }

  parseShift() {
    let expr = this.parseAdditive();

    while (this.match(TokenType.SHIFT_LEFT, TokenType.SHIFT_RIGHT)) {
      const op = this.previous();
      this.logStep(`Matched shift operator '${op.value}'`);
      const right = this.parseAdditive();
      const node = new ParseNode('BinaryExpression', op.value, op.line, op.column);
      node.addChild(expr);
      node.addChild(right);
      expr = node;
    }

    return expr;
  }

  /* =========================================================================
     Arithmetic Expression Precedence Climbing
     ========================================================================= */

  parseExpression() {
    return this.parseCondition(); // Allows condition/expression interchangeability
  }

  parseAdditive() {
    let expr = this.parseMultiplicative();

    while (this.match(TokenType.PLUS, TokenType.MINUS)) {
      const op = this.previous();
      this.logStep(`Matched additive operator '${op.value}'`);
      const right = this.parseMultiplicative();
      const node = new ParseNode('BinaryExpression', op.value, op.line, op.column);
      node.addChild(expr);
      node.addChild(right);
      expr = node;
    }

    return expr;
  }

  parseMultiplicative() {
    let expr = this.parseUnary();

    while (this.match(TokenType.MULTIPLY, TokenType.DIVIDE, TokenType.MODULO)) {
      const op = this.previous();
      this.logStep(`Matched multiplicative/modulo operator '${op.value}'`);
      const right = this.parseUnary();
      const node = new ParseNode('BinaryExpression', op.value, op.line, op.column);
      node.addChild(expr);
      node.addChild(right);
      expr = node;
    }

    return expr;
  }

  parseUnary() {
    // 1. Prefix increment / decrement: ++i or --i
    if (this.match(TokenType.INCREMENT, TokenType.DECREMENT)) {
      const op = this.previous();
      this.logStep(`Matched prefix operator '${op.value}'`);
      const right = this.parseUnary();
      const node = new ParseNode('PrefixExpression', op.value, op.line, op.column);
      node.addChild(right);
      return node;
    }

    // 2. sizeof operator: sizeof(int), sizeof(arr), sizeof(int*)
    if (this.match(TokenType.KEYWORD_SIZEOF)) {
      const sizeTok = this.previous();
      this.logStep("Matched 'sizeof' operator");

      // Check if followed by '(' and a type name: sizeof(int), sizeof(void*), etc.
      if (this.check(TokenType.LPAREN) && this.isTypeLookahead(1)) {
        this.consume(TokenType.LPAREN, "Expected '(' after 'sizeof'");
        const typeNode = this.parseType('SizeofType', true);
        while (this.match(TokenType.MULTIPLY)) {
          typeNode.value += '*';
        }
        this.consume(TokenType.RPAREN, "Expected ')' after sizeof type");
        const node = new ParseNode('SizeofExpression', `sizeof(${typeNode.value})`, sizeTok.line, sizeTok.column);
        node.addChild(typeNode);
        return node;
      }

      // Otherwise sizeof(expression) or sizeof expr:
      const operand = this.parseUnary();
      const node = new ParseNode('SizeofExpression', 'sizeof', sizeTok.line, sizeTok.column);
      node.addChild(operand);
      return node;
    }

    // 3. Type Cast Expression: (int*)ptr, (void*)arr, (float)x
    if (this.check(TokenType.LPAREN) && this.isTypeCastLookahead()) {
      const openParen = this.advance(); // consume '('
      const typeNode = this.parseType('CastType', true);
      while (this.match(TokenType.MULTIPLY)) {
        typeNode.value += '*';
      }
      this.consume(TokenType.RPAREN, "Expected ')' after cast type");
      const operand = this.parseUnary();
      const castNode = new ParseNode('CastExpression', `(${typeNode.value})`, openParen.line, openParen.column);
      castNode.addChild(typeNode);
      castNode.addChild(operand);
      return castNode;
    }

    // 4. Unary !, -, +, *, & (Dereference, AddressOf, UnaryExpression)
    if (this.match(TokenType.LOGICAL_NOT, TokenType.MINUS, TokenType.PLUS, TokenType.MULTIPLY, TokenType.BITWISE_AND)) {
      const op = this.previous();
      const nodeName = op.type === TokenType.MULTIPLY ? 'Dereference' : op.type === TokenType.BITWISE_AND ? 'AddressOf' : 'UnaryExpression';
      this.logStep(`Matched unary operator '${op.value}' (${nodeName})`);
      const right = this.parseUnary();
      const node = new ParseNode(nodeName, op.value, op.line, op.column);
      node.addChild(right);
      return node;
    }

    return this.parsePrimary();
  }

  isTypeLookahead(offset = 0) {
    if (this.peek(offset).type === TokenType.KEYWORD_CONST) {
      offset++;
    }
    const tok = this.peek(offset);
    if (
      tok.type === TokenType.KEYWORD_INT ||
      tok.type === TokenType.KEYWORD_FLOAT ||
      tok.type === TokenType.KEYWORD_DOUBLE ||
      tok.type === TokenType.KEYWORD_CHAR ||
      tok.type === TokenType.KEYWORD_UNSIGNED ||
      tok.type === TokenType.KEYWORD_SIGNED ||
      tok.type === TokenType.KEYWORD_LONG ||
      tok.type === TokenType.KEYWORD_SHORT ||
      tok.type === TokenType.KEYWORD_VOID
    ) {
      return true;
    }
    if (
      tok.type === TokenType.KEYWORD_STRUCT ||
      tok.type === TokenType.KEYWORD_UNION ||
      tok.type === TokenType.KEYWORD_ENUM
    ) {
      return true;
    }
    return false;
  }

  isTypeCastLookahead() {
    let offset = 1;
    let isConst = false;
    if (this.peek(offset).type === TokenType.KEYWORD_CONST) {
      isConst = true;
      offset++;
    }
    const tok = this.peek(offset);
    let isPrimitiveOrStruct = false;
    let isCustomId = false;

    if (
      tok.type === TokenType.KEYWORD_INT ||
      tok.type === TokenType.KEYWORD_FLOAT ||
      tok.type === TokenType.KEYWORD_DOUBLE ||
      tok.type === TokenType.KEYWORD_CHAR ||
      tok.type === TokenType.KEYWORD_UNSIGNED ||
      tok.type === TokenType.KEYWORD_SIGNED ||
      tok.type === TokenType.KEYWORD_LONG ||
      tok.type === TokenType.KEYWORD_SHORT ||
      tok.type === TokenType.KEYWORD_VOID
    ) {
      isPrimitiveOrStruct = true;
      while (
        this.peek(offset).type === TokenType.KEYWORD_UNSIGNED ||
        this.peek(offset).type === TokenType.KEYWORD_SIGNED ||
        this.peek(offset).type === TokenType.KEYWORD_LONG ||
        this.peek(offset).type === TokenType.KEYWORD_SHORT ||
        this.peek(offset).type === TokenType.KEYWORD_INT ||
        this.peek(offset).type === TokenType.KEYWORD_FLOAT ||
        this.peek(offset).type === TokenType.KEYWORD_DOUBLE ||
        this.peek(offset).type === TokenType.KEYWORD_CHAR ||
        this.peek(offset).type === TokenType.KEYWORD_VOID
      ) {
        offset++;
      }
    } else if (
      tok.type === TokenType.KEYWORD_STRUCT ||
      tok.type === TokenType.KEYWORD_UNION ||
      tok.type === TokenType.KEYWORD_ENUM
    ) {
      isPrimitiveOrStruct = true;
      offset++;
      if (this.peek(offset).type !== TokenType.IDENTIFIER) return false;
      offset++;
    } else if (tok.type === TokenType.IDENTIFIER) {
      isCustomId = true;
      offset++;
    } else {
      return false;
    }

    let starCount = 0;
    while (this.peek(offset).type === TokenType.MULTIPLY) {
      offset++;
      starCount++;
    }

    if (this.peek(offset).type !== TokenType.RPAREN) {
      return false;
    }

    // For custom identifiers (e.g. Node, Stack), require at least one pointer star '*'
    // or 'const' qualifier to distinguish from parenthesized variable expression (e.g. (arr))
    if (isCustomId && starCount === 0 && !isConst) {
      return false;
    }

    return true;
  }

  parsePrimary() {
    // 1. Literal numbers
    if (this.match(TokenType.INTEGER_LITERAL)) {
      const tok = this.previous();
      return new ParseNode('IntegerLiteral', tok.value, tok.line, tok.column);
    }

    if (this.match(TokenType.FLOAT_LITERAL)) {
      const tok = this.previous();
      return new ParseNode('FloatLiteral', tok.value, tok.line, tok.column);
    }

    // 2. Character Literal
    if (this.match(TokenType.CHAR_LITERAL)) {
      const tok = this.previous();
      return new ParseNode('CharLiteral', tok.value, tok.line, tok.column);
    }

    // 3. String Literal
    if (this.match(TokenType.STRING_LITERAL)) {
      const tok = this.previous();
      return new ParseNode('StringLiteral', tok.value, tok.line, tok.column);
    }

    // 4. Identifier (variable, array element, member access, or method call)
    if (this.match(TokenType.IDENTIFIER)) {
      const tok = this.previous();

      // Check for direct method call: id(arg1, arg2)
      if (this.check(TokenType.LPAREN)) {
        return this.finishMethodCall(tok);
      }

      let expr = new ParseNode('Identifier', tok.value, tok.line, tok.column);

      // Postfix chain: [index], .member, ->member
      while (true) {
        if (this.match(TokenType.LBRACKET)) {
          const openBrack = this.previous();
          const indexExpr = this.parseExpression();
          this.consume(TokenType.RBRACKET, "Expected ']' after array index");
          const arrAccess = new ParseNode('ArrayAccess', tok.value, openBrack.line, openBrack.column);
          arrAccess.addChild(expr);
          arrAccess.addChild(new ParseNode('Index', null, openBrack.line, openBrack.column).addChild(indexExpr));
          expr = arrAccess;
        } else if (this.match(TokenType.DOT, TokenType.ARROW)) {
          const opTok = this.previous();
          const memberTok = this.consume(TokenType.IDENTIFIER, `Expected member identifier after '${opTok.value}'`);
          const nodeType = opTok.type === TokenType.ARROW ? 'PointerMemberAccess' : 'MemberAccess';
          const memberNode = new ParseNode(nodeType, opTok.value, opTok.line, opTok.column);
          memberNode.addChild(expr);
          memberNode.addChild(new ParseNode('Member', memberTok.value, memberTok.line, memberTok.column));
          expr = memberNode;
        } else if (this.check(TokenType.LPAREN) && (expr.type === 'MemberAccess' || expr.type === 'PointerMemberAccess')) {
          expr = this.finishMethodCallOnTarget(expr);
        } else if (this.match(TokenType.INCREMENT, TokenType.DECREMENT)) {
          const opTok = this.previous();
          const postNode = new ParseNode('PostfixExpression', opTok.value, opTok.line, opTok.column);
          postNode.addChild(expr);
          expr = postNode;
          break;
        } else {
          break;
        }
      }

      return expr;
    }

    // 5. Parenthesized expression: ( expr )
    if (this.match(TokenType.LPAREN)) {
      const openParen = this.previous();
      this.logStep("Matched '(' in expression");
      const expr = this.parseExpression();
      this.consume(TokenType.RPAREN, "Expected ')' after parenthesized expression");
      const groupNode = new ParseNode('ParenGroup', '()', openParen.line, openParen.column);
      groupNode.addChild(expr);
      return groupNode;
    }

    // Missing operand or unexpected token
    const cur = this.peek();
    const err = this.recordError(
      `Expected expression or operand, but found '${cur.value}'`,
      cur.line,
      cur.column
    );
    throw new ParseException(err);
  }

  finishMethodCall(nameToken) {
    this.consume(TokenType.LPAREN, "Expected '(' for method call");
    this.logStep(`Parsing argument list for method call '${nameToken.value}'`);
    const callNode = new ParseNode('MethodCall', nameToken.value, nameToken.line, nameToken.column);
    callNode.addChild(new ParseNode('MethodName', nameToken.value, nameToken.line, nameToken.column));

    const argList = new ParseNode('ArgumentList', null, nameToken.line, nameToken.column);
    if (!this.check(TokenType.RPAREN)) {
      do {
        argList.addChild(this.parseExpression());
      } while (this.match(TokenType.COMMA));
    }

    this.consume(TokenType.RPAREN, "Expected ')' after method arguments");
    callNode.addChild(argList);
    this.logStep(`Completed parsing method call '${nameToken.value}'`);
    return callNode;
  }

  finishMethodCallOnTarget(target) {
    this.consume(TokenType.LPAREN, "Expected '(' for method call");
    this.logStep(`Parsing argument list for method call on target`);
    const callNode = new ParseNode('MethodCall', target.value, target.line, target.column);
    callNode.addChild(target);

    const argList = new ParseNode('ArgumentList', null, target.line, target.column);
    if (!this.check(TokenType.RPAREN)) {
      do {
        argList.addChild(this.parseExpression());
      } while (this.match(TokenType.COMMA));
    }

    this.consume(TokenType.RPAREN, "Expected ')' after method arguments");
    callNode.addChild(argList);
    this.logStep(`Completed parsing method call on target`);
    return callNode;
  }
}
