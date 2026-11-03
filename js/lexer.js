/**
 * MINICOMPILER - Phase 1: Lexical Analysis
 * lexer.js: Tokenizer that converts raw source code into a stream of tokens.
 */

import { TokenType, KEYWORDS, Token } from './token.js';

export class LexicalError {
  constructor(message, line, column) {
    this.message = message;
    this.line = line;
    this.column = column;
  }

  toString() {
    return `Lexical Error [Line ${this.line}, Col ${this.column}]: ${this.message}`;
  }
}

export class Lexer {
  constructor(source = '') {
    this.source = source;
    this.pos = 0;
    this.line = 1;
    this.column = 1;
    this.tokens = [];
    this.errors = [];
  }

  tokenize() {
    this.tokens = [];
    this.errors = [];
    this.pos = 0;
    this.line = 1;
    this.column = 1;

    while (!this.isAtEnd()) {
      this.scanToken();
    }

    this.tokens.push(new Token(TokenType.EOF, '<EOF>', this.line, this.column));

    return {
      tokens: this.tokens,
      errors: this.errors
    };
  }

  isAtEnd() {
    return this.pos >= this.source.length;
  }

  peek(offset = 0) {
    const target = this.pos + offset;
    if (target >= this.source.length) return '\0';
    return this.source[target];
  }

  advance() {
    if (this.isAtEnd()) return '\0';

    const ch = this.source[this.pos];
    this.pos++;

    if (ch === '\r') {
      if (!this.isAtEnd() && this.source[this.pos] === '\n') {
        this.pos++;
      }
      this.line++;
      this.column = 1;
      return '\n';
    } else if (ch === '\n') {
      this.line++;
      this.column = 1;
      return '\n';
    } else {
      this.column++;
      return ch;
    }
  }

  scanToken() {
    const ch = this.peek();

    // 1. Skip Whitespace
    if (ch === ' ' || ch === '\t') {
      this.advance();
      return;
    }

    // 2. Skip Newlines
    if (ch === '\r' || ch === '\n') {
      this.advance();
      return;
    }

    const startLine = this.line;
    const startCol = this.column;

    // 3. Preprocessor Directives / Library Headers (#include <...>)
    if (ch === '#') {
      this.scanPreprocessor(startLine, startCol);
      return;
    }

    // 4. Comments or Division Operator
    if (ch === '/') {
      const next = this.peek(1);
      if (next === '/') {
        this.advance();
        this.advance();
        while (!this.isAtEnd() && this.peek() !== '\n' && this.peek() !== '\r') {
          this.advance();
        }
        return;
      } else if (next === '*') {
        this.advance();
        this.advance();
        let closed = false;

        while (!this.isAtEnd()) {
          if (this.peek() === '*' && this.peek(1) === '/') {
            this.advance();
            this.advance();
            closed = true;
            break;
          }
          this.advance();
        }

        if (!closed) {
          this.errors.push(new LexicalError(
            'Unterminated multi-line comment. Expected "*/" before end of file.',
            startLine,
            startCol
          ));
        }
        return;
      } else if (next === '=') {
        this.advance();
        this.advance();
        this.tokens.push(new Token(TokenType.DIV_ASSIGN, '/=', startLine, startCol));
        return;
      } else {
        this.advance();
        this.tokens.push(new Token(TokenType.DIVIDE, '/', startLine, startCol));
        return;
      }
    }

    // 5. Identifiers and Keywords
    if (this.isAlphaOrUnderscore(ch)) {
      this.scanIdentifierOrKeyword(startLine, startCol);
      return;
    }

    // 6. Numeric Literals
    if (this.isDigit(ch)) {
      this.scanNumber(startLine, startCol);
      return;
    }

    // 7. Character Literals
    if (ch === "'") {
      this.scanCharLiteral(startLine, startCol);
      return;
    }

    // 8. String Literals (e.g. for method calls printf("Hello\n"))
    if (ch === '"') {
      this.scanStringLiteral(startLine, startCol);
      return;
    }

    // 9. Operators and Delimiters
    switch (ch) {
      case '+':
        this.advance();
        if (this.peek() === '+') {
          this.advance();
          this.tokens.push(new Token(TokenType.INCREMENT, '++', startLine, startCol));
        } else if (this.peek() === '=') {
          this.advance();
          this.tokens.push(new Token(TokenType.ADD_ASSIGN, '+=', startLine, startCol));
        } else {
          this.tokens.push(new Token(TokenType.PLUS, '+', startLine, startCol));
        }
        return;
      case '-':
        this.advance();
        if (this.peek() === '>') {
          this.advance();
          this.tokens.push(new Token(TokenType.ARROW, '->', startLine, startCol));
        } else if (this.peek() === '-') {
          this.advance();
          this.tokens.push(new Token(TokenType.DECREMENT, '--', startLine, startCol));
        } else if (this.peek() === '=') {
          this.advance();
          this.tokens.push(new Token(TokenType.SUB_ASSIGN, '-=', startLine, startCol));
        } else {
          this.tokens.push(new Token(TokenType.MINUS, '-', startLine, startCol));
        }
        return;
      case '.':
        this.advance();
        this.tokens.push(new Token(TokenType.DOT, '.', startLine, startCol));
        return;
      case '*':
        this.advance();
        if (this.peek() === '=') {
          this.advance();
          this.tokens.push(new Token(TokenType.MUL_ASSIGN, '*=', startLine, startCol));
        } else {
          this.tokens.push(new Token(TokenType.MULTIPLY, '*', startLine, startCol));
        }
        return;
      case '%':
        this.advance();
        if (this.peek() === '=') {
          this.advance();
          this.tokens.push(new Token(TokenType.MOD_ASSIGN, '%=', startLine, startCol));
        } else {
          this.tokens.push(new Token(TokenType.MODULO, '%', startLine, startCol));
        }
        return;
      case '=':
        this.advance();
        if (this.peek() === '=') {
          this.advance();
          this.tokens.push(new Token(TokenType.EQUAL, '==', startLine, startCol));
        } else {
          this.tokens.push(new Token(TokenType.ASSIGN, '=', startLine, startCol));
        }
        return;
      case '!':
        this.advance();
        if (this.peek() === '=') {
          this.advance();
          this.tokens.push(new Token(TokenType.NOT_EQUAL, '!=', startLine, startCol));
        } else {
          // Logical NOT operator in condition statements
          this.tokens.push(new Token(TokenType.LOGICAL_NOT, '!', startLine, startCol));
        }
        return;
      case '&':
        this.advance();
        if (this.peek() === '&') {
          this.advance();
          this.tokens.push(new Token(TokenType.LOGICAL_AND, '&&', startLine, startCol));
        } else if (this.peek() === '=') {
          this.advance();
          this.tokens.push(new Token(TokenType.AND_ASSIGN, '&=', startLine, startCol));
        } else {
          // Bitwise AND operator between numbers
          this.tokens.push(new Token(TokenType.BITWISE_AND, '&', startLine, startCol));
        }
        return;
      case '|':
        this.advance();
        if (this.peek() === '|') {
          this.advance();
          this.tokens.push(new Token(TokenType.LOGICAL_OR, '||', startLine, startCol));
        } else if (this.peek() === '=') {
          this.advance();
          this.tokens.push(new Token(TokenType.OR_ASSIGN, '|=', startLine, startCol));
        } else {
          // Bitwise OR operator between numbers
          this.tokens.push(new Token(TokenType.BITWISE_OR, '|', startLine, startCol));
        }
        return;
      case '^':
        this.advance();
        if (this.peek() === '=') {
          this.advance();
          this.tokens.push(new Token(TokenType.XOR_ASSIGN, '^=', startLine, startCol));
        } else {
          // Bitwise XOR operator between numbers
          this.tokens.push(new Token(TokenType.BITWISE_XOR, '^', startLine, startCol));
        }
        return;
      case '<':
        this.advance();
        if (this.peek() === '<') {
          this.advance();
          if (this.peek() === '=') {
            this.advance();
            this.tokens.push(new Token(TokenType.SHL_ASSIGN, '<<=', startLine, startCol));
          } else {
            this.tokens.push(new Token(TokenType.SHIFT_LEFT, '<<', startLine, startCol));
          }
        } else if (this.peek() === '=') {
          this.advance();
          this.tokens.push(new Token(TokenType.LESS_EQUAL, '<=', startLine, startCol));
        } else {
          this.tokens.push(new Token(TokenType.LESS_THAN, '<', startLine, startCol));
        }
        return;
      case '>':
        this.advance();
        if (this.peek() === '>') {
          this.advance();
          if (this.peek() === '=') {
            this.advance();
            this.tokens.push(new Token(TokenType.SHR_ASSIGN, '>>=', startLine, startCol));
          } else {
            this.tokens.push(new Token(TokenType.SHIFT_RIGHT, '>>', startLine, startCol));
          }
        } else if (this.peek() === '=') {
          this.advance();
          this.tokens.push(new Token(TokenType.GREATER_EQUAL, '>=', startLine, startCol));
        } else {
          this.tokens.push(new Token(TokenType.GREATER_THAN, '>', startLine, startCol));
        }
        return;
      case '?':
        this.advance();
        this.tokens.push(new Token(TokenType.QUESTION, '?', startLine, startCol));
        return;
      case ':':
        this.advance();
        this.tokens.push(new Token(TokenType.COLON, ':', startLine, startCol));
        return;
      case '(':
        this.advance();
        this.tokens.push(new Token(TokenType.LPAREN, '(', startLine, startCol));
        return;
      case ')':
        this.advance();
        this.tokens.push(new Token(TokenType.RPAREN, ')', startLine, startCol));
        return;
      case '{':
        this.advance();
        this.tokens.push(new Token(TokenType.LBRACE, '{', startLine, startCol));
        return;
      case '}':
        this.advance();
        this.tokens.push(new Token(TokenType.RBRACE, '}', startLine, startCol));
        return;
      case '[':
        this.advance();
        this.tokens.push(new Token(TokenType.LBRACKET, '[', startLine, startCol));
        return;
      case ']':
        this.advance();
        this.tokens.push(new Token(TokenType.RBRACKET, ']', startLine, startCol));
        return;
      case ';':
        this.advance();
        this.tokens.push(new Token(TokenType.SEMICOLON, ';', startLine, startCol));
        return;
      case ',':
        this.advance();
        this.tokens.push(new Token(TokenType.COMMA, ',', startLine, startCol));
        return;
      case '~':
        this.advance();
        this.tokens.push(new Token(TokenType.BITWISE_NOT, '~', startLine, startCol));
        return;
      default:
        const invalidChar = this.advance();
        this.errors.push(new LexicalError(
          `Unexpected character '${invalidChar}'. Illegal symbol for this language.`,
          startLine,
          startCol
        ));
        return;
    }
  }

  scanPreprocessor(startLine, startCol) {
    let directive = '';
    while (!this.isAtEnd() && this.peek() !== '\n' && this.peek() !== '\r') {
      directive += this.advance();
    }
    this.tokens.push(new Token(TokenType.PREPROCESSOR, directive.trim(), startLine, startCol));
  }

  scanIdentifierOrKeyword(startLine, startCol) {
    let lexeme = '';
    while (!this.isAtEnd() && this.isAlphaNumericOrUnderscore(this.peek())) {
      lexeme += this.advance();
    }

    if (Object.prototype.hasOwnProperty.call(KEYWORDS, lexeme)) {
      this.tokens.push(new Token(KEYWORDS[lexeme], lexeme, startLine, startCol));
    } else {
      this.tokens.push(new Token(TokenType.IDENTIFIER, lexeme, startLine, startCol));
    }
  }

  scanNumber(startLine, startCol) {
    let lexeme = '';
    let isFloat = false;

    // Hexadecimal literal support: 0x... or 0X...
    if (this.peek() === '0' && (this.peek(1) === 'x' || this.peek(1) === 'X')) {
      if (this.isHexDigit(this.peek(2))) {
        lexeme += this.advance(); // '0'
        lexeme += this.advance(); // 'x' / 'X'
        while (!this.isAtEnd() && this.isHexDigit(this.peek())) {
          lexeme += this.advance();
        }
        this.consumeIntegerSuffixOrError(lexeme, startLine, startCol);
        return;
      }
    }

    while (!this.isAtEnd() && this.isDigit(this.peek())) {
      lexeme += this.advance();
    }

    if (this.peek() === '.') {
      const nextChar = this.peek(1);
      if (this.isDigit(nextChar)) {
        isFloat = true;
        lexeme += this.advance();
        while (!this.isAtEnd() && this.isDigit(this.peek())) {
          lexeme += this.advance();
        }

        if (this.peek() === '.') {
          while (!this.isAtEnd() && (this.peek() === '.' || this.isAlphaNumericOrUnderscore(this.peek()))) {
            lexeme += this.advance();
          }
          this.errors.push(new LexicalError(
            `Malformed numeric literal: multiple decimal points in '${lexeme}'.`,
            startLine,
            startCol
          ));
          return;
        }
      } else {
        lexeme += this.advance();
        while (!this.isAtEnd() && this.isAlphaNumericOrUnderscore(this.peek())) {
          lexeme += this.advance();
        }
        this.errors.push(new LexicalError(
          `Malformed floating-point literal: expected digit after decimal point in '${lexeme}'.`,
          startLine,
          startCol
        ));
        return;
      }
    }

    // Optional exponent part: e.g. 1e5, 1.5e-3, 2.0E+10
    if (this.peek() === 'e' || this.peek() === 'E') {
      let expOffset = 1;
      if (this.peek(expOffset) === '+' || this.peek(expOffset) === '-') {
        expOffset++;
      }
      if (this.isDigit(this.peek(expOffset))) {
        isFloat = true;
        lexeme += this.advance(); // 'e' or 'E'
        if (this.peek() === '+' || this.peek() === '-') {
          lexeme += this.advance();
        }
        while (!this.isAtEnd() && this.isDigit(this.peek())) {
          lexeme += this.advance();
        }
      }
    }

    if (isFloat) {
      // Check for float suffixes: f, F, l, L (e.g. 13.4567f, 0.5F)
      const nextCh = this.peek();
      if ((nextCh === 'f' || nextCh === 'F' || nextCh === 'l' || nextCh === 'L') && !this.isAlphaNumericOrUnderscore(this.peek(1))) {
        lexeme += this.advance();
      } else if (this.isAlphaOrUnderscore(this.peek())) {
        while (!this.isAtEnd() && this.isAlphaNumericOrUnderscore(this.peek())) {
          lexeme += this.advance();
        }
        this.errors.push(new LexicalError(
          `Invalid identifier or malformed number: identifiers cannot begin with a digit ('${lexeme}').`,
          startLine,
          startCol
        ));
        return;
      }
      this.tokens.push(new Token(TokenType.FLOAT_LITERAL, lexeme, startLine, startCol));
      return;
    }

    // Check for float suffix 'f'/'F' on integer base, or integer suffixes (u, l, ll, ull, llu)
    const nextCh = this.peek();
    if ((nextCh === 'f' || nextCh === 'F') && !this.isAlphaNumericOrUnderscore(this.peek(1))) {
      lexeme += this.advance();
      this.tokens.push(new Token(TokenType.FLOAT_LITERAL, lexeme, startLine, startCol));
      return;
    }

    this.consumeIntegerSuffixOrError(lexeme, startLine, startCol);
  }

  consumeIntegerSuffixOrError(lexeme, startLine, startCol) {
    const c0 = this.peek();
    const c1 = this.peek(1);
    const c2 = this.peek(2);

    // 3-char suffixes: ull, llu (case-insensitive)
    const s3 = (c0 + c1 + c2).toLowerCase();
    if ((s3 === 'ull' || s3 === 'llu') && !this.isAlphaNumericOrUnderscore(this.peek(3))) {
      lexeme += this.advance() + this.advance() + this.advance();
      this.tokens.push(new Token(TokenType.INTEGER_LITERAL, lexeme, startLine, startCol));
      return;
    }

    // 2-char suffixes: ll, ul, lu (case-insensitive)
    const s2 = (c0 + c1).toLowerCase();
    if ((s2 === 'll' || s2 === 'ul' || s2 === 'lu') && !this.isAlphaNumericOrUnderscore(this.peek(2))) {
      lexeme += this.advance() + this.advance();
      this.tokens.push(new Token(TokenType.INTEGER_LITERAL, lexeme, startLine, startCol));
      return;
    }

    // 1-char suffixes: u, l (case-insensitive)
    const s1 = c0.toLowerCase();
    if ((s1 === 'u' || s1 === 'l') && !this.isAlphaNumericOrUnderscore(this.peek(1))) {
      lexeme += this.advance();
      this.tokens.push(new Token(TokenType.INTEGER_LITERAL, lexeme, startLine, startCol));
      return;
    }

    // If followed by invalid alphabetic/underscore chars, report identifier beginning with digit
    if (this.isAlphaOrUnderscore(this.peek())) {
      while (!this.isAtEnd() && this.isAlphaNumericOrUnderscore(this.peek())) {
        lexeme += this.advance();
      }
      this.errors.push(new LexicalError(
        `Invalid identifier or malformed number: identifiers cannot begin with a digit ('${lexeme}').`,
        startLine,
        startCol
      ));
      return;
    }

    this.tokens.push(new Token(TokenType.INTEGER_LITERAL, lexeme, startLine, startCol));
  }

  scanCharLiteral(startLine, startCol) {
    this.advance(); // consume opening '

    if (this.isAtEnd() || this.peek() === '\n' || this.peek() === '\r') {
      this.errors.push(new LexicalError(
        'Unterminated character literal. Expected closing quote "\'".',
        startLine,
        startCol
      ));
      return;
    }

    if (this.peek() === "'") {
      this.advance();
      this.errors.push(new LexicalError(
        'Empty character literal "\'\'" is not allowed.',
        startLine,
        startCol
      ));
      return;
    }

    let charVal = '';
    if (this.peek() === '\\') {
      charVal += this.advance();
      if (this.isAtEnd() || this.peek() === '\n' || this.peek() === '\r') {
        this.errors.push(new LexicalError(
          'Unterminated character escape sequence.',
          startLine,
          startCol
        ));
        return;
      }
      charVal += this.advance();
    } else {
      charVal += this.advance();
    }

    if (this.peek() === "'") {
      this.advance();
      this.tokens.push(new Token(TokenType.CHAR_LITERAL, `'${charVal}'`, startLine, startCol));
    } else {
      let extra = '';
      while (!this.isAtEnd() && this.peek() !== "'" && this.peek() !== '\n' && this.peek() !== '\r') {
        extra += this.advance();
      }
      if (this.peek() === "'") {
        this.advance();
        this.errors.push(new LexicalError(
          `Character literal may only contain a single character: '${charVal}${extra}'.`,
          startLine,
          startCol
        ));
      } else {
        this.errors.push(new LexicalError(
          `Unterminated character literal starting with '${charVal}${extra}'.`,
          startLine,
          startCol
        ));
      }
    }
  }

  scanStringLiteral(startLine, startCol) {
    this.advance(); // consume opening "
    let strVal = '"';
    let closed = false;

    while (!this.isAtEnd()) {
      const ch = this.peek();
      if (ch === '\n' || ch === '\r') {
        break;
      }
      if (ch === '"') {
        strVal += this.advance(); // consume closing "
        closed = true;
        break;
      }
      if (ch === '\\') {
        strVal += this.advance(); // consume \
        if (!this.isAtEnd()) {
          strVal += this.advance(); // consume escaped char
        }
      } else {
        strVal += this.advance();
      }
    }

    if (!closed) {
      this.errors.push(new LexicalError(
        'Unterminated string literal. Expected closing double-quote \'"\'.',
        startLine,
        startCol
      ));
    } else {
      this.tokens.push(new Token(TokenType.STRING_LITERAL, strVal, startLine, startCol));
    }
  }

  isDigit(ch) {
    return ch >= '0' && ch <= '9';
  }

  isHexDigit(ch) {
    return (ch >= '0' && ch <= '9') || (ch >= 'a' && ch <= 'f') || (ch >= 'A' && ch <= 'F');
  }

  isAlphaOrUnderscore(ch) {
    return (ch >= 'a' && ch <= 'z') || (ch >= 'A' && ch <= 'Z') || ch === '_';
  }

  isAlphaNumericOrUnderscore(ch) {
    return this.isAlphaOrUnderscore(ch) || this.isDigit(ch);
  }
}
