# MINICOMPILER — Phases 1 & 2 (Lexical & Syntax Analysis)

An interactive, educational compiler front-end built in **React** (Vite + React 18) for college Compiler Design laboratory examinations and viva voce.

This project implements:
1. **Phase 1: Lexical Analysis (Scanner)**
2. **Phase 2: Syntax Analysis (Recursive-Descent Parser & Concrete Parse Tree Visualization)**

---

## 1. Project Architecture & Pipeline

```
          Source Code Input (React Editor)
                         │
                         ▼
             ┌─────────────────────────┐
             │  PHASE 1: LEXER         │
             │ (Character Scanner)     │
             └───────────┬─────────────┘
                         │
                  ┌──────┴──────┐
                  ▼             ▼
          [Valid Tokens]   [Lexical Errors]
                 │          (Halts parsing if any)
                 ▼
             ┌─────────────────────────┐
             │  PHASE 2: PARSER        │
             │ (Recursive Descent)     │
             └───────────┬─────────────┘
                         │
                  ┌──────┴──────┐
                  ▼             ▼
          [Concrete Parse]  [Syntax Errors]
          [   Tree       ]  (Missing ';', '()',
                            unexpected tokens)
                 │
                 ▼
       Interactive Tree Viewer &
          Parsing Steps Trace
```

---

## 2. Supported Language Specification

### 1. Data Types & Literals:
- `int`: Signed 32-bit integers (e.g. `0`, `42`, `1000`).
- `float`: Floating-point numbers with decimal notation (e.g. `3.14`, `0.05`, `98.6`).
- `char`: Single ASCII/Unicode character in single quotes (e.g. `'a'`, `'Z'`, `'\n'`).
- `string`: String literals in double quotes (e.g. `"Result: %d\n"`), used in method calls.
- `void`: **Strictly restricted to function return types** (e.g., `void printMsg() { ... }`). `void` is **forbidden** as a variable type (`void x;` triggers a syntax error).

### 2. Variables & Arrays:
- **Scalar Declarations:** `int a;`, `float b = 3.14;`, `char c = 'x';`
- **Array Declarations:** `int arr[10];`, `float nums[5];`
- **Array Element Assignment:** `arr[0] = 5;`, `arr[i + 1] = arr[i] * 2;`

### 3. Arithmetic, Modulo & Bitwise Expressions:
- **Operators:** `+`, `-`, `*`, `/`, `%`, `&`, `|`, `^`
- **Precedence Hierarchy:**
  1. Primary (`id`, `literal`, `arr[i]`, `func()`, `(expr)`)
  2. Unary (`!`, `-`, `+`)
  3. Multiplicative (`*`, `/`, `%`)
  4. Additive (`+`, `-`)
  5. Relational (`<`, `<=`, `>`, `>=`)
  6. Equality (`==`, `!=`)
  7. Bitwise AND (`&`)
  8. Bitwise XOR (`^`)
  9. Bitwise OR (`|`)
  10. Logical AND (`&&`)
  11. Logical OR (`||`)
- **Parentheses:** `((a & b) ^ (c | d))` override default precedence.

### 4. Control Flow & Conditions:
- **If / If-Else:** `if (Condition) Statement (else Statement)?`
- **While Loops:** `while (Condition) Statement`
- **Logical Conditions:** `&&`, `||`, `!`, `==`, `!=`, `<`, `<=`, `>`, `>=`
- **Blocks:** `{ Statement* }`

### 5. Functions & Method Calls:
- **Function Definitions:** `int add(int a, int b) { return a + b; }`, `void log() { ... }`
- **Method Calls:** `printf("Value: %d\n", val);`, `calculate(x, y);`

### 6. Libraries:
- **Optional Inclusion:** Programs run with or without `#include <stdio.h>`.
- Preprocessor lines are recognized as `PREPROCESSOR` directive nodes.

---

## 3. Project File Structure & Responsibilities

```text
MINICOMPILER/
├── package.json              # Scripts: test:lexer, test:parser, test, dev, build
├── vite.config.js            # Vite bundler configuration
├── index.html                # Vite HTML entry point
│
├── src/
│   ├── main.jsx              # React DOM root bootstrapping
│   ├── App.jsx               # Main React state container & tab coordinator
│   ├── index.css             # IDE dark theme CSS & parse-tree visualizer styles
│   │
│   ├── compiler/             # Compiler Core Engine
│   │   ├── token.js          # [Phase 1 Protected] Token types, KEYWORDS, Token class
│   │   ├── lexer.js          # [Phase 1 Protected] Character-by-character scanner
│   │   ├── ast.js            # [Phase 2] ParseNode class for Concrete Syntax Trees
│   │   ├── parser.js         # [Phase 2] Recursive Descent Parser & Syntax Diagnostics
│   │   ├── samples.js        # 12 pre-loaded demonstration programs
│   │   └── tests.js          # [Phase 1 Protected] In-browser Phase 1 unit tests
│   │
│   └── components/           # React UI Components
│       ├── Header.jsx        # Top bar with "Tokenize Source" & "Parse Source"
│       ├── Editor.jsx        # Source code editor with line number gutter
│       ├── TokenTable.jsx    # Table displaying token type, category, line, col
│       ├── ParseTreeVisualizer.jsx # [Phase 2] Collapsible tree node visualizer
│       ├── ParsingSteps.jsx  # [Phase 2] Chronological parser trace log
│       ├── ErrorList.jsx     # Diagnostic cards for Lexical and Syntax errors
│       ├── LanguageSpec.jsx  # Grammar and syntax reference cheatsheet
│       └── TestRunner.jsx    # In-browser test runner tab
│
└── tests/
    ├── test_lexer.js         # [Phase 1 Protected] Standalone CLI Lexer test suite
    └── test_parser.js        # [Phase 2] Standalone CLI Parser test suite
```

---

## 4. How Phase 2 Connects to Phase 1

1. **Token Flow**:
   When the user clicks **"Parse Source"**, `handleParse()` runs `new Lexer(source).tokenize()`.
2. **Lexical Gatekeeper**:
   If `lexicalErrors.length > 0`, the system displays the lexical error cards and **aborts parser execution**. This prevents bogus cascades caused by broken characters.
3. **Direct Consumption**:
   If lexical analysis succeeds, the exact `tokens` array (ending with the `EOF` token) is passed directly to `new Parser(tokens).parse()`.
4. **Output Generation**:
   The parser constructs a concrete parse tree (`ParseNode`) and traces every grammar rule choice into `parsingSteps`.
5. **Phase 1 Preservation**:
   Clicking **"Tokenize Source"** still runs *only* Phase 1, updating the Token Table without affecting parser state.

---

## 5. How to Run the Project & Test Commands

### 1. Launch the React Web Application
```bash
npm run dev
```
Open `http://localhost:3000` in your web browser.

### 2. Run the Phase 1 Lexer Tests (60 Assertions)
```bash
npm run test:lexer
```

### 3. Run the Phase 2 Parser Tests (39 Assertions)
```bash
npm run test:parser
```

### 4. Run Both Test Suites Combined (99 Assertions)
```bash
npm test
```

### Verified Test Results:
```text
========================================================
   MINICOMPILER (React Edition) - Stage 1 Lexer Tests
========================================================
Test Summary: Total: 60 | Passed: 60 | Failed: 0 (100%)
🎉 ALL STAGE 1 LEXER TESTS PASSED!

========================================================
   MINICOMPILER (React Edition) - Stage 2 Parser Tests
========================================================
Test Summary: Total: 53 | Passed: 53 | Failed: 0 (100%)
🎉 ALL STAGE 2 PARSER TESTS PASSED!
```

---

## 6. Testing Valid and Invalid Programs (Manual Verification)

### A. Valid Programs
1. Select **Sample 1 ("1. Arrays (Declaration, Indexing & Loops)")** or **Sample 2 ("2. Method Calls, Modulo & Conditions")**.
2. Click **"Parse Source"**.
3. The interface will switch to the **"Parse Tree"** tab, displaying the full hierarchical tree with collapsible branches.
4. Click **"Parsing Steps"** to inspect the step-by-step trace of parser functions called.

### B. Testing Syntax Errors
Try typing these into the editor and clicking **"Parse Source"**:
* **Missing semicolon:** `int x = 10`  
  ➜ `Expected ';' after variable declaration (found '<EOF>') at Line 1, Column 11`
* **Missing expression:** `a = ;`  
  ➜ `Expected expression or operand, but found ';' at Line 1, Column 5`
* **Unmatched parenthesis:** `a = (2 + 3;`  
  ➜ `Expected ')' after parenthesized expression (found ';') at Line 1, Column 11`
* **Invalid `void` variable:** `void x;`  
  ➜ `'void' cannot be used as a variable type (only valid as function return type) at Line 1, Column 1`
* **Unclosed loop body:** `while (x > 0) { x = x - 1;`  
  ➜ `Expected '}' to close block (found '<EOF>')`

---

## 7. College Viva Voce Questions & Answers (Phase 2)

### Q1: What is a Recursive Descent Parser?
**Answer:** A top-down syntax analysis technique where the grammar is implemented directly as a collection of recursive functions. Each non-terminal in the grammar corresponds to a function (e.g. `parseStatement()`, `parseExpression()`). It parses the input by descending down the grammar tree.

### Q2: Why is Left Recursion forbidden in Recursive Descent Parsers?
**Answer:** If a grammar has left recursion like `E -> E + T`, the function `parseE()` will immediately call `parseE()` again without consuming any token, leading to an **infinite recursion (stack overflow)**. We eliminate left recursion by rewriting the grammar using iteration (`*` loops in EBNF).

### Q3: How is Operator Precedence enforced in the Parser?
**Answer:** By structuring the grammar in hierarchy layers:
- `parseExpression()` calls `parseLogicalOr()`
- `parseLogicalOr()` calls `parseLogicalAnd()`
- `parseLogicalAnd()` calls `parseEquality()`
- `parseEquality()` calls `parseRelational()`
- `parseRelational()` calls `parseAdditive()` (`+`, `-`)
- `parseAdditive()` calls `parseMultiplicative()` (`*`, `/`, `%`)
- `parseMultiplicative()` calls `parseUnary()`
- `parseUnary()` calls `parsePrimary()` (numbers, identifiers, `(expr)`)
Because higher-precedence operators are deeper in the call hierarchy, they are parsed lower in the tree and evaluated first.

### Q4: How does the parser differentiate between array assignment, variable assignment, and function call?
**Answer:** It uses LL(1) / LL(2) lookahead after seeing an `IDENTIFIER`:
- If followed by `[` ➜ Array assignment: `arr[index] = expr;`
- If followed by `=` ➜ Variable assignment: `x = expr;`
- If followed by `(` ➜ Function call: `func(arg1, arg2);`

### Q5: How does the parser recover from syntax errors without entering an infinite loop?
**Answer:** When an unexpected token is encountered, the parser records the error and executes `synchronize()`. `synchronize()` skips invalid tokens until it finds a statement boundary (such as a semicolon `;` or a keyword like `int`, `if`, `while`, `}`), advancing at least one token if necessary so the parser is guaranteed to make forward progress towards `EOF`.
