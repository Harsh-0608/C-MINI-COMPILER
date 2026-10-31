/**
 * Automated test suite runner for MINICOMPILER Phase 1 (Lexical Analysis).
 */

import { Lexer } from './lexer.js';
import { TokenType } from './token.js';

export function runAllTests() {
  const results = [];
  let passedCount = 0;
  let failedCount = 0;

  function record(suite, description, condition, details = '') {
    if (condition) {
      passedCount++;
      results.push({ suite, description, passed: true, details });
    } else {
      failedCount++;
      results.push({ suite, description, passed: false, details });
    }
  }

  // Suite 1: Keywords vs Identifiers
  {
    const suite = 'Suite 1: Keywords vs Identifiers';
    const input = 'int integer float floating char character void voidFunc return retVal if iffy else elsewhere while whileLoop';
    const { tokens, errors } = new Lexer(input).tokenize();
    record(suite, 'No errors in keyword/identifier scanning', errors.length === 0);
    record(suite, "'int' is recognized as KEYWORD_INT", tokens[0].type === TokenType.KEYWORD_INT && tokens[0].value === 'int');
    record(suite, "'integer' is recognized as IDENTIFIER", tokens[1].type === TokenType.IDENTIFIER && tokens[1].value === 'integer');
    record(suite, "'float' is recognized as KEYWORD_FLOAT", tokens[2].type === TokenType.KEYWORD_FLOAT && tokens[2].value === 'float');
    record(suite, "'floating' is recognized as IDENTIFIER", tokens[3].type === TokenType.IDENTIFIER && tokens[3].value === 'floating');
    record(suite, "'char' is recognized as KEYWORD_CHAR", tokens[4].type === TokenType.KEYWORD_CHAR && tokens[4].value === 'char');
    record(suite, "'character' is recognized as IDENTIFIER", tokens[5].type === TokenType.IDENTIFIER && tokens[5].value === 'character');
    record(suite, "'void' is recognized as KEYWORD_VOID", tokens[6].type === TokenType.KEYWORD_VOID && tokens[6].value === 'void');
    record(suite, "'voidFunc' is recognized as IDENTIFIER", tokens[7].type === TokenType.IDENTIFIER && tokens[7].value === 'voidFunc');
    record(suite, "'return' is recognized as KEYWORD_RETURN", tokens[8].type === TokenType.KEYWORD_RETURN && tokens[8].value === 'return');
    record(suite, "'retVal' is recognized as IDENTIFIER", tokens[9].type === TokenType.IDENTIFIER && tokens[9].value === 'retVal');
    record(suite, "'if' is recognized as KEYWORD_IF", tokens[10].type === TokenType.KEYWORD_IF && tokens[10].value === 'if');
    record(suite, "'iffy' is recognized as IDENTIFIER", tokens[11].type === TokenType.IDENTIFIER && tokens[11].value === 'iffy');
    record(suite, "'else' is recognized as KEYWORD_ELSE", tokens[12].type === TokenType.KEYWORD_ELSE && tokens[12].value === 'else');
    record(suite, "'elsewhere' is recognized as IDENTIFIER", tokens[13].type === TokenType.IDENTIFIER && tokens[13].value === 'elsewhere');
    record(suite, "'while' is recognized as KEYWORD_WHILE", tokens[14].type === TokenType.KEYWORD_WHILE && tokens[14].value === 'while');
    record(suite, "'whileLoop' is recognized as IDENTIFIER", tokens[15].type === TokenType.IDENTIFIER && tokens[15].value === 'whileLoop');
  }

  // Suite 2: Modulo & Arithmetic Operators
  {
    const suite = 'Suite 2: Modulo & Arithmetic Operators';
    const input = 'a % b + c - d * e / f';
    const { tokens, errors } = new Lexer(input).tokenize();
    record(suite, 'No errors in modulo and arithmetic test', errors.length === 0);
    record(suite, "Token 1 is MODULO operator '%'", tokens[1].type === TokenType.MODULO && tokens[1].value === '%');
    record(suite, "Token 3 is PLUS operator '+'", tokens[3].type === TokenType.PLUS);
    record(suite, "Token 5 is MINUS operator '-'", tokens[5].type === TokenType.MINUS);
    record(suite, "Token 7 is MULTIPLY operator '*'", tokens[7].type === TokenType.MULTIPLY);
    record(suite, "Token 9 is DIVIDE operator '/'", tokens[9].type === TokenType.DIVIDE);
  }

  // Suite 3: Condition Statements & Logical Operators (&&, ||, !)
  {
    const suite = 'Suite 3: Condition Statements & Logical Operators';
    const input = 'if (x > 0 && y < 10 || !flag)';
    const { tokens, errors } = new Lexer(input).tokenize();
    record(suite, 'No errors in condition statements logic', errors.length === 0);
    const andTok = tokens.find(t => t.type === TokenType.LOGICAL_AND);
    const orTok = tokens.find(t => t.type === TokenType.LOGICAL_OR);
    const notTok = tokens.find(t => t.type === TokenType.LOGICAL_NOT);
    record(suite, "'&&' recognized as LOGICAL_AND", !!andTok && andTok.value === '&&');
    record(suite, "'||' recognized as LOGICAL_OR", !!orTok && orTok.value === '||');
    record(suite, "'!' recognized as LOGICAL_NOT", !!notTok && notTok.value === '!');
  }

  // Suite 4: Method Calls & Delimiters
  {
    const suite = 'Suite 4: Method Calls & Delimiters';
    const input = 'calculate(x, y, 10); printf("Result: %d\\n", val);';
    const { tokens, errors } = new Lexer(input).tokenize();
    record(suite, 'No errors in method calls', errors.length === 0);
    record(suite, "'calculate' is IDENTIFIER for method", tokens[0].type === TokenType.IDENTIFIER && tokens[0].value === 'calculate');
    record(suite, "'(' opens argument list", tokens[1].type === TokenType.LPAREN);
    record(suite, "',' separates method arguments", tokens[3].type === TokenType.COMMA && tokens[3].value === ',');
    record(suite, "')' closes argument list", tokens[7].type === TokenType.RPAREN);
    record(suite, "String literal argument in method call recognized", tokens[11].type === TokenType.STRING_LITERAL);
  }

  // Suite 5: Arrays Support (Square Brackets [ ])
  {
    const suite = 'Suite 5: Arrays Support (Brackets [ ])';
    const input = 'int arr[10]; arr[0] = arr[i + 1] * 2;';
    const { tokens, errors } = new Lexer(input).tokenize();
    record(suite, 'No errors in array declaration and indexing', errors.length === 0);
    const lbrackets = tokens.filter(t => t.type === TokenType.LBRACKET);
    const rbrackets = tokens.filter(t => t.type === TokenType.RBRACKET);
    record(suite, "Recognized opening square brackets '[' as LBRACKET", lbrackets.length === 3);
    record(suite, "Recognized closing square brackets ']' as RBRACKET", rbrackets.length === 3);
    record(suite, "First '[' is at Line 1, Col 8", lbrackets[0].line === 1 && lbrackets[0].column === 8);
    record(suite, "First ']' is at Line 1, Col 11", rbrackets[0].line === 1 && rbrackets[0].column === 11);
  }

  // Suite 6: Libraries Handling (Optional Inclusion)
  {
    const suite = 'Suite 6: Libraries Handling (Optional Inclusion)';
    // Program with libraries included
    const withLib = '#include <stdio.h>\nint x = 5;';
    const res1 = new Lexer(withLib).tokenize();
    record(suite, 'No error when library is included (#include)', res1.errors.length === 0);
    record(suite, "'#include <stdio.h>' captured as PREPROCESSOR token", res1.tokens[0].type === TokenType.PREPROCESSOR && res1.tokens[0].value === '#include <stdio.h>');

    // Program with library missed (omitted)
    const withoutLib = 'int x = 5;\nint y = x % 2;';
    const res2 = new Lexer(withoutLib).tokenize();
    record(suite, 'No error when library is missed/omitted', res2.errors.length === 0);
  }

  // Suite 7: Numbers & Literals
  {
    const suite = 'Suite 7: Numbers & Literals';
    const input = '0 42 3.14159 "Hello World" \'A\' 13.4567f 123456789LL 987654321ULL';
    const { tokens, errors } = new Lexer(input).tokenize();
    record(suite, 'No errors in numbers and literals', errors.length === 0);
    record(suite, "'0' is INTEGER_LITERAL", tokens[0].type === TokenType.INTEGER_LITERAL && tokens[0].value === '0');
    record(suite, "'42' is INTEGER_LITERAL", tokens[1].type === TokenType.INTEGER_LITERAL && tokens[1].value === '42');
    record(suite, "'3.14159' is FLOAT_LITERAL", tokens[2].type === TokenType.FLOAT_LITERAL && tokens[2].value === '3.14159');
    record(suite, "'\"Hello World\"' is STRING_LITERAL", tokens[3].type === TokenType.STRING_LITERAL && tokens[3].value === '"Hello World"');
    record(suite, "''A'' is CHAR_LITERAL", tokens[4].type === TokenType.CHAR_LITERAL && tokens[4].value === "'A'");
    record(suite, "'13.4567f' is FLOAT_LITERAL", tokens[5].type === TokenType.FLOAT_LITERAL && tokens[5].value === '13.4567f');
    record(suite, "'123456789LL' is INTEGER_LITERAL", tokens[6].type === TokenType.INTEGER_LITERAL && tokens[6].value === '123456789LL');
    record(suite, "'987654321ULL' is INTEGER_LITERAL", tokens[7].type === TokenType.INTEGER_LITERAL && tokens[7].value === '987654321ULL');
  }

  // Suite 8: Comments Handling
  {
    const suite = 'Suite 8: Comments Handling';
    const input = `// Single-line comment
int a = 5; // inline comment
/* Multi-line
   comment */
int b = 10;`;
    const { tokens, errors } = new Lexer(input).tokenize();
    record(suite, 'No errors in comment handling', errors.length === 0);
    const tokenVals = tokens.map(t => t.value);
    record(suite, 'All variables captured across comments', tokenVals.includes('a') && tokenVals.includes('b'));
    record(suite, 'Comment text stripped from token stream', !tokenVals.some(v => v.includes('comment')));
  }

  // Suite 9: Error Traps & Malformed Literals
  {
    const suite = 'Suite 9: Error Traps & Malformed Literals';
    const r1 = new Lexer('float x = 12.34.56;').tokenize();
    record(suite, 'Trapped multiple decimal points in 12.34.56', r1.errors.length > 0 && r1.errors[0].message.includes('multiple decimal points'));

    const r2 = new Lexer('int 42total = 5;').tokenize();
    record(suite, 'Trapped identifier starting with digit 42total', r2.errors.length > 0 && r2.errors[0].message.includes('cannot begin with a digit'));

    const r3 = new Lexer('int @bad = 10;').tokenize();
    record(suite, 'Trapped illegal symbol @', r3.errors.length > 0 && r3.errors[0].message.includes('@'));

    const r4 = new Lexer('int x = a ~ b;').tokenize();
    record(suite, "Trapped illegal symbol ~", r4.errors.length > 0 && r4.errors[0].message.includes('~'));

    const r5 = new Lexer('int y = a $ b;').tokenize();
    record(suite, "Trapped illegal symbol $", r5.errors.length > 0 && r5.errors[0].message.includes('$'));

    const r6 = new Lexer('"unterminated string').tokenize();
    record(suite, 'Trapped unterminated string literal', r6.errors.length > 0 && r6.errors[0].message.includes('Unterminated string literal'));
  }

  // Suite 10: Line & Column Tracking
  {
    const suite = 'Suite 10: Line & Column Tracking';
    const input = `int a = 1;
float b = a % 2;
if (b == 0) {
  printf("even");
}`;
    const { tokens } = new Lexer(input).tokenize();
    record(suite, "Line 1: 'int' is at (1, 1)", tokens[0].line === 1 && tokens[0].column === 1);
    record(suite, "Line 1: 'a' is at (1, 5)", tokens[1].line === 1 && tokens[1].column === 5);

    const modTok = tokens.find(t => t.value === '%');
    record(suite, "Line 2: '%' is at (2, 13)", modTok && modTok.line === 2 && modTok.column === 13);

    const printTok = tokens.find(t => t.value === 'printf');
    record(suite, "Line 4: 'printf' is at (4, 3)", printTok && printTok.line === 4 && printTok.column === 3);
  }

  return {
    results,
    total: results.length,
    passed: passedCount,
    failed: failedCount
  };
}
