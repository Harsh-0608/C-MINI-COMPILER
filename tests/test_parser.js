/**
 * Automated test suite for MINICOMPILER Phase 2 (Syntax Analysis)
 * Can be executed with: node tests/test_parser.js or npm run test:parser
 */

import { Lexer } from '../src/compiler/lexer.js';
import { Parser } from '../src/compiler/parser.js';

let totalTests = 0;
let passedTests = 0;
let failedTests = 0;

function assert(condition, message) {
  totalTests++;
  if (condition) {
    passedTests++;
    console.log(`  ✓ PASS: ${message}`);
  } else {
    failedTests++;
    console.error(`  ✗ FAIL: ${message}`);
  }
}

function parseCode(source) {
  const { tokens, errors: lexErrors } = new Lexer(source).tokenize();
  if (lexErrors.length > 0) {
    return { cst: null, errors: lexErrors, isLexError: true };
  }
  const parser = new Parser(tokens);
  return parser.parse();
}

console.log('========================================================');
console.log('   MINICOMPILER (React Edition) - Stage 2 Parser Tests');
console.log('========================================================\n');

// ---------------------------------------------------------------------
// Suite 1: Variable Declarations
// ---------------------------------------------------------------------
console.log('Suite 1: Variable Declarations');
{
  // Simple declaration
  const res1 = parseCode('int a;');
  assert(res1.errors.length === 0, "'int a;' parses with 0 syntax errors");
  assert(res1.cst.children[0].type === 'VarDeclaration', "Top node is 'VarDeclaration'");

  // Declaration with initializer
  const res2 = parseCode('int a = 10;');
  assert(res2.errors.length === 0, "'int a = 10;' parses with 0 syntax errors");

  // Float and char declarations
  const res3 = parseCode("float pi = 3.14; char grade = 'A';");
  assert(res3.errors.length === 0, 'Multiple variable declarations parse with 0 errors');

  // Array declaration
  const res4 = parseCode('int arr[10];');
  assert(res4.errors.length === 0, "'int arr[10];' parses with 0 syntax errors");
}

// ---------------------------------------------------------------------
// Suite 2: Arithmetic Expressions & Precedence
// ---------------------------------------------------------------------
console.log('\nSuite 2: Arithmetic Expressions & Operator Precedence');
{
  // Operator precedence: * binds tighter than +
  const res1 = parseCode('a = 2 + 3 * 4;');
  assert(res1.errors.length === 0, "'a = 2 + 3 * 4;' parses with 0 errors");
  const assignNode = res1.cst.children[0];
  assert(assignNode.type === 'AssignmentStatement', 'Statement is AssignmentStatement');
  // Top binary expression should be '+' and its right child should be '*'
  const expr = assignNode.children[1];
  assert(expr.type === 'BinaryExpression' && expr.value === '+', "Outer expression is '+'");
  const rightTerm = expr.children[1];
  assert(rightTerm.type === 'BinaryExpression' && rightTerm.value === '*', "Inner expression is '*'");

  // Nested expressions with parentheses
  const res2 = parseCode('a = ((2 + 3) * (4 - 1));');
  assert(res2.errors.length === 0, "'a = ((2 + 3) * (4 - 1));' parses with 0 errors");

  // Modulo operator precedence
  const res3 = parseCode('rem = x % y + 5;');
  assert(res3.errors.length === 0, "'rem = x % y + 5;' parses with 0 errors");
}

// ---------------------------------------------------------------------
// Suite 3: Control Statements (if/else, while, blocks)
// ---------------------------------------------------------------------
console.log('\nSuite 3: Control Statements & Conditionals');
{
  // If statement with block
  const res1 = parseCode('if (x > 0) { a = 1; }');
  assert(res1.errors.length === 0, "'if (x > 0) { a = 1; }' parses with 0 errors");
  assert(res1.cst.children[0].type === 'IfStatement', "Top node is 'IfStatement'");

  // If-Else statement
  const res2 = parseCode('if (x > 0) { a = 1; } else { a = 0; }');
  assert(res2.errors.length === 0, "'if/else' block parses with 0 errors");
  assert(res2.cst.children[0].children.some(c => c.type === 'ElseBranch'), "Contains 'ElseBranch'");

  // While loop
  const res3 = parseCode('while (count >= 1) { count = count - 1; }');
  assert(res3.errors.length === 0, "'while' loop parses with 0 errors");
  assert(res3.cst.children[0].type === 'WhileStatement', "Top node is 'WhileStatement'");

  // Compound condition with &&, ||, !
  const res4 = parseCode('if (a > 0 && b < 10 || !flag) { x = 42; }');
  assert(res4.errors.length === 0, 'Compound condition with &&, ||, ! parses with 0 errors');
}

// ---------------------------------------------------------------------
// Suite 4: Array Assignments & Method Calls
// ---------------------------------------------------------------------
console.log('\nSuite 4: Arrays & Method Calls');
{
  // Array assignment
  const res1 = parseCode('arr[0] = 5;');
  assert(res1.errors.length === 0, "'arr[0] = 5;' parses with 0 errors");
  assert(res1.cst.children[0].type === 'ArrayAssignment', "Node is 'ArrayAssignment'");

  // Array access in expression
  const res2 = parseCode('sum = arr[0] + arr[i + 1];');
  assert(res2.errors.length === 0, "'sum = arr[0] + arr[i + 1];' parses with 0 errors");

  // Function / method call statement
  const res3 = parseCode('printf("Result: %d\\n", val);');
  assert(res3.errors.length === 0, "'printf(...);' call statement parses with 0 errors");
  assert(res3.cst.children[0].type === 'CallStatement', "Node is 'CallStatement'");

  // Function definition
  const res4 = parseCode('int add(int a, int b) { return a + b; }');
  assert(res4.errors.length === 0, "Function 'int add(...) { ... }' parses with 0 errors");
  assert(res4.cst.children[0].type === 'FunctionDeclaration', "Node is 'FunctionDeclaration'");

  // Void function definition
  const res5 = parseCode('void doWork() { int x = 1; }');
  assert(res5.errors.length === 0, "Function 'void doWork() { ... }' parses with 0 errors");
}

// ---------------------------------------------------------------------
// Suite 5: Syntax Error Detection (Invalid Programs)
// ---------------------------------------------------------------------
console.log('\nSuite 5: Syntax Error Traps & Diagnostics');
{
  // 1. Missing semicolon
  const err1 = parseCode('int a = 10');
  assert(err1.errors.length > 0, "Trapped missing semicolon: 'int a = 10'");
  assert(err1.errors[0].message.includes("Expected ';'"), "Error message specifies expected ';'");

  // 2. Missing expression after '='
  const err2 = parseCode('a = ;');
  assert(err2.errors.length > 0, "Trapped missing expression: 'a = ;'");
  assert(err2.errors[0].message.includes('Expected expression') || err2.errors[0].message.includes('operand'), 'Error message specifies missing expression');

  // 3. Unmatched parentheses in expression
  const err3 = parseCode('a = (2 + 3;');
  assert(err3.errors.length > 0, "Trapped unmatched parenthesis: 'a = (2 + 3;'");
  assert(err3.errors.some(e => e.message.includes("')'")), "Error message mentions expected ')'");

  // 4. Missing operand in binary expression
  const err4 = parseCode('a = 2 + ;');
  assert(err4.errors.length > 0, "Trapped missing operand: 'a = 2 + ;'");

  // 5. Unclosed block / invalid structure
  const err5 = parseCode('while (x > 0) { a = 1;');
  assert(err5.errors.length > 0, "Trapped unclosed block: 'while (x > 0) { a = 1;'");
  assert(err5.errors.some(e => e.message.includes("'}'")), "Error message mentions expected '}'");

  // 6. 'void' forbidden as variable type
  const err6 = parseCode('void x;');
  assert(err6.errors.length > 0, "Trapped 'void' used as variable type: 'void x;'");
  assert(err6.errors[0].message.includes('cannot be used as a variable type'), "Error message explains 'void' is only valid as return type");

  // 7. Missing condition parentheses in if statement
  const err7 = parseCode('if x > 0 { a = 1; }');
  assert(err7.errors.length > 0, "Trapped missing '(' after 'if'");

  // 8. Missing closing parenthesis in while statement
  const err8 = parseCode('while (x > 0 { a = 1; }');
  assert(err8.errors.length > 0, "Trapped missing ')' in while condition");
}

// ---------------------------------------------------------------------
// Suite 6: Binary & Bitwise Operations (^, &, |)
// ---------------------------------------------------------------------
console.log('\nSuite 6: Binary & Bitwise Operations (^, &, |)');
{
  // Bitwise AND (&)
  const res1 = parseCode('int mask = a & b;');
  assert(res1.errors.length === 0, "'int mask = a & b;' parses with 0 errors");
  const init1 = res1.cst.children[0].children[1].children[0].children[1].children[0];
  assert(init1.type === 'BinaryExpression' && init1.value === '&', "Bitwise AND node is '&'");

  // Bitwise OR (|)
  const res2 = parseCode('int flags = a | b;');
  assert(res2.errors.length === 0, "'int flags = a | b;' parses with 0 errors");
  const init2 = res2.cst.children[0].children[1].children[0].children[1].children[0];
  assert(init2.type === 'BinaryExpression' && init2.value === '|', "Bitwise OR node is '|'");

  // Bitwise XOR (^)
  const res3 = parseCode('int diff = a ^ b;');
  assert(res3.errors.length === 0, "'int diff = a ^ b;' parses with 0 errors");
  const init3 = res3.cst.children[0].children[1].children[0].children[1].children[0];
  assert(init3.type === 'BinaryExpression' && init3.value === '^', "Bitwise XOR node is '^'");

  // Bitwise Precedence: & binds tighter than ^, and ^ binds tighter than |
  // a | b ^ c & d  =>  a | (b ^ (c & d))
  const res4 = parseCode('res = a | b ^ c & d;');
  assert(res4.errors.length === 0, "'res = a | b ^ c & d;' parses with 0 errors");
  const topOp = res4.cst.children[0].children[1];
  assert(topOp.type === 'BinaryExpression' && topOp.value === '|', "Top bitwise operator is '|'");
  const xorOp = topOp.children[1];
  assert(xorOp.type === 'BinaryExpression' && xorOp.value === '^', "Middle bitwise operator is '^'");
  const andOp = xorOp.children[1];
  assert(andOp.type === 'BinaryExpression' && andOp.value === '&', "Innermost bitwise operator is '&'");

  // Bitwise with arithmetic: a & b + 5  => a & (b + 5)
  const res5 = parseCode('val = a & b + 5;');
  assert(res5.errors.length === 0, "'val = a & b + 5;' parses with 0 errors");
  const bitAndNode = res5.cst.children[0].children[1];
  assert(bitAndNode.type === 'BinaryExpression' && bitAndNode.value === '&', "Outer operator is '&'");
  assert(bitAndNode.children[1].value === '+', "Inner operator is '+'");

  // Parenthesized bitwise expression
  const res6 = parseCode('int out = (a | b) ^ (c & d);');
  assert(res6.errors.length === 0, "'int out = (a | b) ^ (c & d);' parses with 0 errors");
}

// ---------------------------------------------------------------------
// Suite 7: Member Access & Chained Postfix Expressions (. and ->)
// ---------------------------------------------------------------------
console.log('\nSuite 7: Member Access & Chained Postfix Expressions (. and ->)');
{
  // 1. Array element member assignment (struct in array, C-style compiler tokens)
  const res1 = parseCode('tokens[tokenCount].type = type;');
  assert(res1.errors.length === 0, "'tokens[tokenCount].type = type;' parses with 0 errors");
  assert(res1.cst.children[0].type === 'MemberAssignment', "Top statement node is 'MemberAssignment'");
  const target1 = res1.cst.children[0].children[0];
  assert(target1.type === 'MemberAccess' && target1.value === '.', "Target has 'MemberAccess' with '.'");
  assert(target1.children[0].type === 'ArrayAccess', "Base of member access is 'ArrayAccess'");
  assert(target1.children[1].type === 'Member' && target1.children[1].value === 'type', "Member accessed is 'type'");

  // 2. Member access inside variable initializer expression
  const res2 = parseCode('int t = tokens[tokenCount].type;');
  assert(res2.errors.length === 0, "'int t = tokens[tokenCount].type;' parses with 0 errors");
  const initExpr = res2.cst.children[0].children[1].children[0].children[1].children[0];
  assert(initExpr.type === 'MemberAccess', "Expression node is 'MemberAccess'");

  // 3. Pointer member assignment: ptr->member = value;
  const res3 = parseCode('p->val = 10;');
  assert(res3.errors.length === 0, "'p->val = 10;' parses with 0 errors");
  const target3 = res3.cst.children[0].children[0];
  assert(target3.type === 'PointerMemberAccess' && target3.value === '->', "Target is 'PointerMemberAccess' with '->'");

  // 4. Chained pointer member access in expression: x = head->next->data;
  const res4 = parseCode('x = head->next->data;');
  assert(res4.errors.length === 0, "'x = head->next->data;' parses with 0 errors");

  // 5. Direct struct member assignment: token.type = 1;
  const res5 = parseCode('token.type = 1;');
  assert(res5.errors.length === 0, "'token.type = 1;' parses with 0 errors");

  // 6. Error trap: missing member identifier after '.'
  const err1 = parseCode('tokens[tokenCount]. = 1;');
  assert(err1.errors.length > 0, "Trapped missing identifier after '.'");
  assert(err1.errors[0].message.includes("Expected member identifier after '.'"), "Error message specifies missing member after '.'");
}

// ---------------------------------------------------------------------
// Suite 8: Structures, Unions, Custom Types (Stack/Queue) & Pointers
// ---------------------------------------------------------------------
console.log('\nSuite 8: Structures, Unions, Custom Types (Stack/Queue) & Pointers');
{
  // 1. Struct Definition
  const res1 = parseCode('struct Token { int type; char text[50]; };');
  assert(res1.errors.length === 0, "'struct Token { ... };' parses with 0 errors");
  assert(res1.cst.children[0].type === 'StructDefinition', "Node is 'StructDefinition'");

  // 2. Union Definition
  const res2 = parseCode('union Value { int i; float f; };');
  assert(res2.errors.length === 0, "'union Value { ... };' parses with 0 errors");
  assert(res2.cst.children[0].type === 'UnionDefinition', "Node is 'UnionDefinition'");

  // 3. Custom Data Types (Stack, Queue, Token)
  const res3 = parseCode('Stack s; Queue q; Token tok;');
  assert(res3.errors.length === 0, "'Stack s; Queue q; Token tok;' parses with 0 errors");
  assert(res3.cst.children[0].type === 'VarDeclaration', "Top node is 'VarDeclaration'");
  assert(res3.cst.children[0].children[0].value === 'Stack', "Type is 'Stack'");

  // 4. Pointer Variable Declarations
  const res4 = parseCode('int *p; Stack *s; struct Node *head;');
  assert(res4.errors.length === 0, "'int *p; Stack *s; struct Node *head;' parses with 0 errors");

  // 5. Function accepting Custom Data Types & Pointers
  const res5 = parseCode('void push(Stack *s, int val) { s->top = s->top + 1; }');
  assert(res5.errors.length === 0, "'void push(Stack *s, int val) { ... }' parses with 0 errors");
  assert(res5.cst.children[0].type === 'FunctionDeclaration', "Top node is 'FunctionDeclaration'");

  // 6. Function returning Pointer / Custom Type
  const res6 = parseCode('struct Node* createNode(int d) { struct Node *n; return n; }');
  assert(res6.errors.length === 0, "'struct Node* createNode(...) { ... }' parses with 0 errors");

  // 7. Pointer Dereferencing Assignment: *p = 20;
  const res7 = parseCode('*p = 20;');
  assert(res7.errors.length === 0, "'*p = 20;' parses with 0 errors");
  assert(res7.cst.children[0].children[0].type === 'DereferenceTarget', "Target is 'DereferenceTarget'");

  // 8. Address-of and Dereference in Expressions: p = &x; val = *p + 5;
  const res8 = parseCode('p = &x; val = *p + 5;');
  assert(res8.errors.length === 0, "'p = &x; val = *p + 5;' parses with 0 errors");
}

// ---------------------------------------------------------------------
// Suite 9: For Loops & Increment/Decrement (++, --)
// ---------------------------------------------------------------------
console.log('\nSuite 9: For Loops & Increment/Decrement (++, --)');
{
  // 1. Standard for loop with declaration and post-increment
  const res1 = parseCode('for (int i = 0; i < 10; i++) { sum = sum + i; }');
  assert(res1.errors.length === 0, "'for (int i = 0; i < 10; i++) { ... }' parses with 0 errors");
  assert(res1.cst.children[0].type === 'ForStatement', "Top node is 'ForStatement'");
  assert(res1.cst.children[0].children[0].type === 'ForInit', "First child is 'ForInit'");
  assert(res1.cst.children[0].children[1].type === 'Condition', "Second child is 'Condition'");
  assert(res1.cst.children[0].children[2].type === 'ForUpdate', "Third child is 'ForUpdate'");

  // 2. For loop with assignment step
  const res2 = parseCode('for (i = 0; i < 5; i = i + 1) { arr[i] = i * 2; }');
  assert(res2.errors.length === 0, "'for (i = 0; i < 5; i = i + 1)' parses with 0 errors");

  // 3. Postfix increment statement: tokenCount++;
  const res3 = parseCode('tokenCount++;');
  assert(res3.errors.length === 0, "'tokenCount++;' parses with 0 errors");
  assert(res3.cst.children[0].type === 'UpdateStatement', "Node is 'UpdateStatement'");

  // 4. Prefix increment statement: ++count;
  const res4 = parseCode('++count;');
  assert(res4.errors.length === 0, "'++count;' parses with 0 errors");

  // 5. Postfix increment in array index: tokens[tokenCount++].type = type;
  const res5 = parseCode('tokens[tokenCount++].type = type;');
  assert(res5.errors.length === 0, "'tokens[tokenCount++].type = type;' parses with 0 errors");

  // 6. For loop with empty clauses: for (;;) { breakFlag = 1; }
  const res6 = parseCode('for (;;) { breakFlag = 1; }');
  assert(res6.errors.length === 0, "'for (;;)' parses with 0 errors");
}

// ---------------------------------------------------------------------
// Suite 10: Arrays & Initializer Lists
// ---------------------------------------------------------------------
console.log('\nSuite 10: Arrays & Initializer Lists');
{
  // 1. Array declaration with braced initializer list
  const res1 = parseCode('int arr[5] = {1, 2, 3, 4, 5};');
  assert(res1.errors.length === 0, "'int arr[5] = {1, 2, 3, 4, 5};' parses with 0 errors");
  assert(res1.cst.children[0].type === 'VarDeclaration', "Node is 'VarDeclaration'");

  // 2. Unsized array with initializer list
  const res2 = parseCode('int arr[] = {1, 2, 3};');
  assert(res2.errors.length === 0, "'int arr[] = {1, 2, 3};' parses with 0 errors");

  // 3. String literal initialized char array
  const res3 = parseCode('char str[] = "hello";');
  assert(res3.errors.length === 0, "'char str[] = \"hello\";' parses with 0 errors");

  // 4. Multidimensional array declaration
  const res4 = parseCode('int matrix[3][3];');
  assert(res4.errors.length === 0, "'int matrix[3][3];' parses with 0 errors");

  // 5. Nested initializer list for 2D array
  const res5 = parseCode('int m[2][2] = {{1, 2}, {3, 4}};');
  assert(res5.errors.length === 0, "'int m[2][2] = {{1, 2}, {3, 4}};' parses with 0 errors");

  // 6. Variable-sized array declaration: int arr[n];
  const res6 = parseCode('int arr[n];');
  assert(res6.errors.length === 0, "'int arr[n];' parses with 0 errors");

  // 7. Sized array parameter in function declaration
  const res7 = parseCode('int sum(int arr[10]) { return arr[0]; }');
  assert(res7.errors.length === 0, "'int sum(int arr[10]) { ... }' parses with 0 errors");

  // 8. Multidimensional array parameter
  const res8 = parseCode('void process(int matrix[][10]) { matrix[0][0] = 1; }');
  assert(res8.errors.length === 0, "'void process(int matrix[][10]) { ... }' parses with 0 errors");

  // 9. Multidimensional assignment: matrix[1][2] = 5;
  const res9 = parseCode('matrix[1][2] = 5;');
  assert(res9.errors.length === 0, "'matrix[1][2] = 5;' parses with 0 errors");

  // 10. Array element increment: arr[i]++;
  const res10 = parseCode('arr[i]++;');
  assert(res10.errors.length === 0, "'arr[i]++;' parses with 0 errors");
}

// ---------------------------------------------------------------------
// Suite 11: Ternary Conditional Operator (? :)
// ---------------------------------------------------------------------
console.log('\nSuite 11: Ternary Conditional Operator (? :)');
{
  // 1. Basic ternary in variable declaration
  const res1 = parseCode('int max = a > b ? a : b;');
  assert(res1.errors.length === 0, "'int max = a > b ? a : b;' parses with 0 errors");
  assert(res1.cst.children[0].type === 'VarDeclaration', "Top node is 'VarDeclaration'");

  // 2. Ternary in assignment statement
  const res2 = parseCode('res = flag ? 10 : 20;');
  assert(res2.errors.length === 0, "'res = flag ? 10 : 20;' parses with 0 errors");
  assert(res2.cst.children[0].type === 'AssignmentStatement', "Node is 'AssignmentStatement'");

  // 3. Nested ternary (right-associative)
  const res3 = parseCode('int sign = x > 0 ? 1 : x < 0 ? -1 : 0;');
  assert(res3.errors.length === 0, "'int sign = x > 0 ? 1 : x < 0 ? -1 : 0;' parses with 0 errors");

  // 4. Ternary in function argument
  const res4 = parseCode('printf("%d", a > b ? a : b);');
  assert(res4.errors.length === 0, "'printf(\"%d\", a > b ? a : b);' parses with 0 errors");
}

// ---------------------------------------------------------------------
// Suite 12: Switch-Case Statements & Break
// ---------------------------------------------------------------------
console.log('\nSuite 12: Switch-Case Statements & Break');
{
  // 1. Standard switch statement with case, break, and default
  const switchCode = `switch (choice) {
    case 1:
      val = 10;
      break;
    case 2:
      val = 20;
      break;
    default:
      val = 0;
      break;
  }`;
  const res1 = parseCode(switchCode);
  assert(res1.errors.length === 0, "Standard 'switch/case/default' block parses with 0 errors");
  assert(res1.cst.children[0].type === 'SwitchStatement', "Top node is 'SwitchStatement'");
  const body = res1.cst.children[0].children.find(c => c.type === 'SwitchBody');
  assert(!!body && body.children.some(c => c.type === 'CaseClause'), "Contains 'CaseClause'");
  assert(!!body && body.children.some(c => c.type === 'DefaultClause'), "Contains 'DefaultClause'");

  // 2. Switch with fallthrough (consecutive cases)
  const fallthroughCode = `switch (code) {
    case 1:
    case 2:
      out = 1;
      break;
    default:
      out = 0;
  }`;
  const res2 = parseCode(fallthroughCode);
  assert(res2.errors.length === 0, "Switch with case fallthrough parses with 0 errors");

  // 3. Standalone break statement
  const res3 = parseCode('break;');
  assert(res3.errors.length === 0, "'break;' parses with 0 errors");
  assert(res3.cst.children[0].type === 'BreakStatement', "Node is 'BreakStatement'");
}

// ---------------------------------------------------------------------
// Suite 13: Compound Assignment Operators & Shift Operators
// ---------------------------------------------------------------------
console.log('\nSuite 13: Compound Assignment Operators & Shift Operators');
{
  // 1. Arithmetic compound assignments: +=, -=, *=, /=, %=
  const res1 = parseCode('a += 5; a -= 2; a *= 3; a /= 4; a %= 5;');
  assert(res1.errors.length === 0, "Arithmetic compound assignments (+=, -=, *=, /=, %=) parse with 0 errors");
  assert(res1.cst.children[0].value === '+=', "First operator is '+='");

  // 2. Bitwise compound assignments: &=, |=, ^=
  const res2 = parseCode('a &= 1; a |= 2; a ^= 3;');
  assert(res2.errors.length === 0, "Bitwise compound assignments (&=, |=, ^=) parse with 0 errors");
  assert(res2.cst.children[0].value === '&=', "Operator is '&='");

  // 3. Shift compound assignments: <<=, >>=
  const res3 = parseCode('a <<= 1; a >>= 2;');
  assert(res3.errors.length === 0, "Shift compound assignments (<<=, >>=) parse with 0 errors");
  assert(res3.cst.children[0].value === '<<=', "Operator is '<<='");

  // 4. Compound assignments on arrays, members, and pointers
  const res4 = parseCode('arr[i] += 10; tokens[i].val *= 2; ptr->count -= 1; *p += 5;');
  assert(res4.errors.length === 0, "Compound assignments on array, member, and pointer targets parse with 0 errors");

  // 5. Compound assignment in for-loop update clause
  const res5 = parseCode('for (int i = 0; i < 100; i += 5) { sum += i; }');
  assert(res5.errors.length === 0, "'for (int i = 0; i < 100; i += 5) { sum += i; }' parses with 0 errors");

  // 6. Shift operators in expressions: << and >>
  const res6 = parseCode('int x = a << 2; int y = b >> 1;');
  assert(res6.errors.length === 0, "Shift expressions (<<, >>) parse with 0 errors");
  const initExpr = res6.cst.children[0].children[1].children[0].children[1].children[0];
  assert(initExpr.type === 'BinaryExpression' && initExpr.value === '<<', "Expression operator is '<<'");
}

// ---------------------------------------------------------------------
// Suite 14: Function Declarations & Prototypes
// ---------------------------------------------------------------------
console.log('\nSuite 14: Function Declarations & Prototypes');
{
  // 1. Standard function prototype ending with semicolon
  const res1 = parseCode('int add(int a, int b);');
  assert(res1.errors.length === 0, "'int add(int a, int b);' parses with 0 errors");
  assert(res1.cst.children[0].type === 'FunctionDeclaration', "Top node is 'FunctionDeclaration'");
  assert(res1.cst.children[0].children.some(c => c.type === 'IsPrototype'), "Node marked as 'IsPrototype'");

  // 2. Prototype with unnamed parameter types
  const res2 = parseCode('int sum(int, int);');
  assert(res2.errors.length === 0, "'int sum(int, int);' parses with 0 errors");

  // 3. Array parameter prototype
  const res3 = parseCode('void sort(int arr[], int n);');
  assert(res3.errors.length === 0, "'void sort(int arr[], int n);' parses with 0 errors");

  // 4. (void) parameter prototype
  const res4 = parseCode('void run(void);');
  assert(res4.errors.length === 0, "'void run(void);' parses with 0 errors");

  // 5. Pointer return type
  const res5 = parseCode('int* getPtr(int size);');
  assert(res5.errors.length === 0, "'int* getPtr(int size);' parses with 0 errors");

  // 6. Callback / Function pointer parameter (e.g. for qsort)
  const res6 = parseCode('void qsort(void *base, int n, int size, int (*cmp)(const void*, const void*));');
  assert(res6.errors.length === 0, "Function pointer parameter in prototype parses with 0 errors");
}

// ---------------------------------------------------------------------
// Suite 15: Enumerations (enum & typedef enum)
// ---------------------------------------------------------------------
console.log('\nSuite 15: Enumerations (enum & typedef enum)');
{
  // 1. Enum definition with explicit values and trailing comma
  const res1 = parseCode('enum State { IDLE, RUNNING = 1, STOPPED, };');
  assert(res1.errors.length === 0, "'enum State { IDLE, RUNNING = 1, STOPPED, };' parses with 0 errors");
  assert(res1.cst.children[0].type === 'EnumDefinition', "Top node is 'EnumDefinition'");

  // 2. Enum with instance variables
  const res2 = parseCode('enum Color { RED, GREEN, BLUE } c1, c2;');
  assert(res2.errors.length === 0, "'enum Color { RED, GREEN, BLUE } c1, c2;' parses with 0 errors");

  // 3. Typedef enum
  const res3 = parseCode('typedef enum { OFF, ON } Switch;');
  assert(res3.errors.length === 0, "'typedef enum { OFF, ON } Switch;' parses with 0 errors");
  assert(res3.cst.children[0].type === 'TypedefDeclaration', "Top node is 'TypedefDeclaration'");

  // 4. Enum variable declaration and initialization
  const res4 = parseCode('enum State current = IDLE;');
  assert(res4.errors.length === 0, "'enum State current = IDLE;' parses with 0 errors");
  assert(res4.cst.children[0].type === 'VarDeclaration', "Top node is 'VarDeclaration'");
}

// ---------------------------------------------------------------------
// Suite 16: Advanced Pointer Expressions & Dereferencing
// ---------------------------------------------------------------------
console.log('\nSuite 16: Advanced Pointer Expressions & Dereferencing');
{
  // 1. Pointer dereference assignments
  const res1 = parseCode('*p = 10; *p += 5; *p = *q;');
  assert(res1.errors.length === 0, "'*p = 10; *p += 5; *p = *q;' parses with 0 errors");

  // 2. Pointer increment/decrement statements
  const res2 = parseCode('*p++; (*p)++; (*p) = 20; *(p + 1) = 30;');
  assert(res2.errors.length === 0, "'*p++; (*p)++; (*p) = 20; *(p + 1) = 30;' parses with 0 errors");

  // 3. Type cast expressions and dereference
  const res3 = parseCode('int val = *(int*)p; char *str = (char*)ptr;');
  assert(res3.errors.length === 0, "Type casts '*(int*)p' and '(char*)ptr' parse with 0 errors");

  // 4. Pointer arithmetic expressions
  const res4 = parseCode('int diff = p2 - p1; p = arr + i;');
  assert(res4.errors.length === 0, "Pointer arithmetic expressions parse with 0 errors");
}

// ---------------------------------------------------------------------
// Suite 17: Inbuilt Sorting (qsort, sizeof, Comparator)
// ---------------------------------------------------------------------
console.log('\nSuite 17: Inbuilt Sorting (qsort, sizeof, Comparator)');
{
  // 1. Standard comparator function
  const cmpCode = `int compare(const void *a, const void *b) {
    return (*(int*)a - *(int*)b);
  }`;
  const res1 = parseCode(cmpCode);
  assert(res1.errors.length === 0, "Comparator function with 'const void*' and '*(int*)' parses with 0 errors");

  // 2. sizeof on arrays and division
  const res2 = parseCode('int n = sizeof(arr) / sizeof(arr[0]);');
  assert(res2.errors.length === 0, "'sizeof(arr) / sizeof(arr[0])' parses with 0 errors");

  // 3. sizeof on primitive and custom types
  const res3 = parseCode('int sz1 = sizeof(int); int sz2 = sizeof(struct Node*);');
  assert(res3.errors.length === 0, "'sizeof(int)' and 'sizeof(struct Node*)' parse with 0 errors");

  // 4. Inbuilt qsort call
  const sortCode = `void testSort() {
    int arr[5] = {5, 2, 4, 1, 3};
    int n = sizeof(arr) / sizeof(arr[0]);
    qsort(arr, n, sizeof(int), compare);
  }`;
  const res4 = parseCode(sortCode);
  assert(res4.errors.length === 0, "Full 'qsort(arr, n, sizeof(int), compare);' block parses with 0 errors");
}

// ---------------------------------------------------------------------
// Suite 18: Const Pointer Declarations across All Data Types
// ---------------------------------------------------------------------
console.log('\nSuite 18: Const Pointer Declarations across All Data Types');
{
  // 1. Primitive const pointers (int *const, float *const, char *const, void *const)
  const res1 = parseCode('int *const a = &x; float *const b; char *const c; void *const d = &x;');
  assert(res1.errors.length === 0, "Primitive 'T *const' declarations parse with 0 errors");

  // 2. Struct, union, enum, and custom type const pointers
  const res2 = parseCode('struct Node *const p1; union Value *const p2; enum State *const p3; Stack *const p4;');
  assert(res2.errors.length === 0, "Struct/union/enum/custom 'T *const' declarations parse with 0 errors");

  // 3. Const data with const pointer (const T *const)
  const res3 = parseCode('const int *const cp1 = &x; const void *const cp2 = &x;');
  assert(res3.errors.length === 0, "'const T *const' declarations parse with 0 errors");

  // 4. Trailing const on base type (T const *a and T const *const a)
  const res4 = parseCode('int const *p1 = &x; int const *const p2 = &x;');
  assert(res4.errors.length === 0, "'T const *' and 'T const *const' parse with 0 errors");

  // 5. Multi-level const pointers (int *const *const p)
  const res5 = parseCode('int *const *const multi = &ptr;');
  assert(res5.errors.length === 0, "Multi-level 'int *const *const' parses with 0 errors");
}

// ---------------------------------------------------------------------
// Suite 19: Function Pointer Declarations across All Data Types
// ---------------------------------------------------------------------
console.log('\nSuite 19: Function Pointer Declarations across All Data Types');
{
  // 1. Basic function pointers across primitive types
  const res1 = parseCode('int (*fp1)(int); void (*fp2)(int); float (*fp3)(float, float); char (*fp4)(char);');
  assert(res1.errors.length === 0, "Function pointers for primitive types parse with 0 errors");

  // 2. Function pointers with various spacings: int(*a)(int), int (*a) (int)
  const res2 = parseCode('int(*a)(int); int (*b) (int);');
  assert(res2.errors.length === 0, "Function pointers with varied token spacing parse with 0 errors");

  // 3. Function pointers returning pointers & custom types
  const res3 = parseCode('char* (*fp5)(int, char*); struct Node* (*fp6)(int); Stack* (*fp7)(Stack*);');
  assert(res3.errors.length === 0, "Function pointers returning pointers and custom types parse with 0 errors");

  // 4. Function pointer with initialization, void params, and empty params
  const res4 = parseCode('int (*fp8)(int) = myFunc; void (*fp9)(void); void (*fp10)();');
  assert(res4.errors.length === 0, "Function pointers with initializers and (void) params parse with 0 errors");

  // 5. Array of function pointers
  const res5 = parseCode('int (*handlers[10])(int);');
  assert(res5.errors.length === 0, "Array of function pointers 'int (*handlers[10])(int);' parses with 0 errors");

  // 6. Typedef of function pointer
  const res6 = parseCode('typedef int (*BinaryOp)(int, int); typedef void (*Action)(void);');
  assert(res6.errors.length === 0, "Typedef of function pointers parses with 0 errors");
}

// ---------------------------------------------------------------------
// Suite 20: Do-While Loops, Continue Statements, Multi-Word Types & Suffix Literals
// ---------------------------------------------------------------------
console.log('\nSuite 20: Do-While Loops, Continue Statements, Multi-Word Types & Suffix Literals');
{
  // 1. Do-While loop with block and single statement
  const res1 = parseCode('int i = 0; do { i++; } while (i < 10); do i++; while (i < 20);');
  assert(res1.errors.length === 0, "'do { ... } while (...);' and 'do stmt; while (...);' parse with 0 errors");
  assert(res1.cst.children[1].type === 'DoWhileStatement', "Node is 'DoWhileStatement'");

  // 2. Continue statement inside while, do-while, and for loops
  const contCode = `void testContinue() {
    int i = 0;
    while (i < 10) {
      i++;
      if (i == 5) continue;
    }
    do {
      i--;
      continue;
    } while (i > 0);
    for (int j = 0; j < 5; j++) {
      if (j == 2) continue;
    }
  }`;
  const res2 = parseCode(contCode);
  assert(res2.errors.length === 0, "'continue;' inside while, do-while, and for loops parses with 0 errors");

  // 3. Float declarations with 'f' suffix and multi-word types (long long, unsigned long long)
  const typesCode = `void testTypes() {
    float f = 13.4567f;
    long long ll = 123456789LL;
    unsigned long long ull = 987654321ULL;
    unsigned int u = 100u;
    double d = 3.14159;
    long double ld = 1.5L;
    short s = 10;
    unsigned short us = 20;
  }`;
  const res3 = parseCode(typesCode);
  assert(res3.errors.length === 0, "Float literals ('13.4567f'), 'unsigned long long', and 'long long' parse with 0 errors");

  // 4. Format specifiers in printf and scanf
  const printCode = `void testPrint() {
    long long ll = 1000000000LL;
    unsigned long long ull = 5000000000ULL;
    float f = 13.4567f;
    printf("%lld %llu %f\\n", ll, ull, f);
    scanf("%lld %llu", &ll, &ull);
  }`;
  const res4 = parseCode(printCode);
  assert(res4.errors.length === 0, "Method calls with '%lld', '%llu', and '%f' format specifiers parse with 0 errors");

  // 5. Multi-word type casts and function return/parameter types
  const castCode = `unsigned long long compute(unsigned long long a, long long b) {
    unsigned long long val = (unsigned long long)a + (unsigned long long)b;
    return val;
  }`;
  const res5 = parseCode(castCode);
  assert(res5.errors.length === 0, "Functions and type casts with 'unsigned long long' and 'long long' parse with 0 errors");
}

console.log('\n========================================================');
console.log(`Test Summary: Total: ${totalTests} | Passed: ${passedTests} | Failed: ${failedTests}`);
console.log('========================================================');

if (failedTests > 0) {
  process.exit(1);
} else {
  console.log('\n🎉 ALL STAGE 2 PARSER TESTS PASSED!\n');
}

