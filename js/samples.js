/**
 * Pre-defined code samples for demonstration and viva presentation.
 */

export const SAMPLES = {
  'qsort-demo': {
    name: '1. Inbuilt Sorting (qsort), sizeof & Function Prototypes',
    code: `// Inbuilt Sorting with qsort, sizeof, and Comparator Function
#include <stdio.h>
#include <stdlib.h>

// 1. Function Prototypes (Declarations)
void sort(int arr[], int n);
void printArray(int arr[], int n);
int compare(const void *a, const void *b);

// 2. Standard C Comparator using Pointer Casting & Dereferencing
int compare(const void *a, const void *b) {
    return (*(int*)a - *(int*)b);
}

int main() {
    int arr[] = { 64, 34, 25, 12, 22, 11, 90 };
    int n = sizeof(arr) / sizeof(arr[0]);

    // 3. Inbuilt Sorting Call using qsort
    qsort(arr, n, sizeof(int), compare);

    return 0;
}`
  },

  'enum-pointer-demo': {
    name: '2. Enums, Pointer Expressions, Dereferencing & Type Casts',
    code: `// Enumerations, Pointer Arithmetic, Dereferencing & Type Casts
#include <stdio.h>

// 1. Enum Definition with Explicit Values
enum State {
    IDLE = 0,
    RUNNING = 1,
    PAUSED = 2,
    STOPPED = 3
};

// 2. Typedef Enum
typedef enum {
    OFF = 0,
    ON = 1
} SwitchState;

int main() {
    // 3. Enum Variable Declarations
    enum State current = IDLE;
    SwitchState pwr = ON;

    // 4. Pointer Expressions and Dereferencing
    int x = 42;
    int *p = &x;
    int *q = p;

    // 5. Pointer Dereferencing Assignments
    *p = 100;
    *p += 5;
    *p = *q;

    // 6. Pointer Increments and Expressions
    *p++;
    (*p)++;
    (*p) = 250;
    *(p + 1) = 300;

    // 7. Pointer Type Casting
    int val = *(int*)p;
    char *ptr = (char*)p;

    return 0;
}`
  },

  'dowhile-types-demo': {
    name: '3. Do-While Loops, Continue, Multi-Word Types (long long, ull, float) & %lld/%llu',
    code: `// Demonstration of Do-While Loop, Continue Statement, Multi-Word Types & Format Specifiers
#include <stdio.h>

int main() {
    // 1. Float declarations with 'f' suffix
    float f = 13.4567f;
    double d = 3.1415926535;

    // 2. Long Long & Unsigned Long Long with 'll'/'ull' suffixes
    long long ll = 123456789012345LL;
    unsigned long long ull = 987654321012345ULL;
    unsigned int u = 4294967295U;

    // 3. Output with format specifiers (%lld, %llu, %f, %lf, %u)
    printf("Float value: %f\\n", f);
    printf("Double value: %lf\\n", d);
    printf("Signed 64-bit int: %lld\\n", ll);
    printf("Unsigned 64-bit int: %llu\\n", ull);

    // 4. Do-While Loop with Continue Statement
    int counter = 0;
    do {
        counter++;
        if (counter == 3) {
            // Skip processing for 3
            continue;
        }
        ull += counter;
    } while (counter < 5);

    // 5. While Loop with Continue Statement
    int j = 0;
    while (j < 10) {
        j++;
        if (j % 2 == 0) {
            continue;
        }
        ll += j;
    }

    return 0;
}`
  },

  'ternary-compound-demo': {
    name: '1. Ternary Operator & Compound Assignments (+=, -=, <<=, ? :)',
    code: `// Ternary Operators (? :) & Compound Assignments
#include <stdio.h>

int a = 15;
int b = 25;

// 1. Ternary Conditional Operator (condition ? then : else)
int maxVal = (a > b) ? a : b;
int minVal = (a < b) ? a : b;

// 2. Nested Ternary Operator (right-associative)
int x = -5;
int sign = (x > 0) ? 1 : (x < 0) ? -1 : 0;

// 3. Arithmetic Compound Assignments (+=, -=, *=, /=, %=)
int total = 100;
total += 50;
total -= 20;
total *= 2;
total /= 4;
total %= 7;

// 4. Bitwise & Shift Compound Assignments (&=, |=, ^=, <<=, >>=)
int flags = 0xFF;
flags &= 0x0F;
flags |= 0x20;
flags ^= 0x01;
flags <<= 2;
flags >>= 1;

// 5. Compound Assignments in Loops and Arrays
int buffer[5] = {1, 2, 3, 4, 5};
buffer[0] += 10;
buffer[1] *= 3;

for (int i = 0; i < 5; i += 1) {
    buffer[i] += i;
}`
  },

  'switch-case-demo': {
    name: '1. Switch-Case Statements & Break',
    code: `// Switch-Case Statements with Multiple Cases, Fallthrough & Default
#include <stdio.h>

int processCommand(int opcode, int operand) {
    int result = 0;

    switch (opcode) {
        case 1:
            result = operand + 10;
            break;

        case 2:
            result = operand * 2;
            break;

        // Fallthrough example: cases 3 and 4 share execution logic
        case 3:
        case 4:
            result = operand << 2;
            break;

        case 5:
            // Ternary expression inside case statement
            result = (operand > 0) ? operand : -operand;
            break;

        default:
            result = -1;
            break;
    }

    return result;
}

int main() {
    int op = 3;
    int res = processCommand(op, 15);
    printf("Result: %d\\n", res);
    return 0;
}`
  },

  'for-loop-demo': {
    name: '1. For Loops, Increment & Decrement (++, --)',
    code: `// For Loops, Postfix Increment (++) & Decrement (--)
#include <stdio.h>

int numbers[10];
int sum = 0;

// 1. Standard for loop with declaration and post-increment (i++)
for (int i = 0; i < 10; i++) {
    numbers[i] = (i + 1) * 5;
    sum = sum + numbers[i];
}

// 2. Decrementing for loop (j--)
for (int j = 9; j >= 0; j--) {
    printf("Number: %d\\n", numbers[j]);
}

// 3. Standalone increments and array index increments
int tokenCount = 0;
int type = 10;
tokens[tokenCount++].type = type;
tokenCount++;
++sum;`
  },

  'stack-queue-struct': {
    name: '1. Structs, Unions, Custom Types (Stack/Queue) & Pointers',
    code: `// Data Structures: Structs, Unions, Custom Types & Pointers
#include <stdio.h>

// 1. Structure Definition
struct Token {
    int type;
    char text[50];
    int line;
};

// 2. Union Definition
union Value {
    int intVal;
    float floatVal;
};

// 3. Custom Types: Stack & Queue
struct Stack {
    int items[50];
    int top;
};

// Function accepting Custom Type Pointer parameter
void push(Stack *s, int val) {
    s->items[s->top] = val;
    s->top = s->top + 1;
}

// Function with Pointer Return Type
struct Token* getTopToken(struct Token *arr, int index) {
    return &arr[index];
}

int main() {
    // Variable Declarations with Custom Types & Structs
    struct Token tokens[100];
    Stack s;
    Queue q;
    int *ptr;
    int x = 42;

    // Pointer assignment and dereferencing
    ptr = &x;
    *ptr = 100;

    // Struct & Array member assignment
    tokens[0].type = 1;
    tokens[0].line = 10;

    // Calling functions with pointer arguments
    push(&s, *ptr);

    return 0;
}`
  },

  'member-access': {
    name: '1. Member Access (tokens[tokenCount].type = type)',
    code: `// Structure & Member Access (. and ->) with Arrays
// Valid C-compiler syntax: tokens[tokenCount].type = type;
int tokenCount = 0;
int type = 1;

// Assign struct member in an array element
tokens[tokenCount].type = type;
tokens[tokenCount].value = 42;

// Access member in expression
int currentType = tokens[tokenCount].type;

// Pointer member access with arrow operator (->)
node->val = 100;
int nextVal = head->next->data;

if (tokens[tokenCount].type == 1) {
    tokenCount = tokenCount + 1;
}`
  },

  'bitwise-demo': {
    name: '1. Binary/Bitwise Operations (^, &, |)',
    code: `// 1. Binary / Bitwise Operations (^, &, |) between numbers
int a = 12; // binary: 1100
int b = 10; // binary: 1010

// Bitwise AND (&): result is 8 (1000)
int bitAnd = a & b;

// Bitwise OR (|): result is 14 (1110)
int bitOr = a | b;

// Bitwise XOR (^): result is 6 (0110)
int bitXor = a ^ b;

// Precedence test: arithmetic (+) binds before bitwise (&), which binds before (^) and (|)
int result = a & b + 2 ^ (a | b);

if ((a & 1) == 0) {
    int evenFlag = 1;
}`
  },

  'arrays-demo': {
    name: '2. Arrays (Initializers, Multidimensional & Operations)',
    code: `// C Array Features: Initializers, Multidimensional & Operations
#include <stdio.h>

// 1. Array with Braced Initializer List
int numbers[5] = {10, 20, 30, 40, 50};

// 2. Unsized Array (size deduced from initializers)
int primes[] = {2, 3, 5, 7, 11};
char greeting[] = "Hello";

// 3. Multidimensional (2D) Array with Nested Initializers
int matrix[2][2] = {{1, 2}, {3, 4}};

// 4. Function with Array Parameter
int sumArray(int arr[5], int n) {
    int total = 0;
    for (int i = 0; i < n; i++) {
        total = total + arr[i];
    }
    return total;
}

int main() {
    // Array indexing and modification
    matrix[0][1] = 99;
    numbers[0]++;

    int result = sumArray(numbers, 5);
    printf("Sum: %d\\n", result);

    return 0;
}`
  },

  'methods-modulo-conditions': {
    name: '2. Method Calls, Modulo & Conditions',
    code: `// 1. Method calls, Modulo (%) & Logical Conditionals
#include <stdio.h>

void printMessage(char status) {
    printf("Status is: %c\\n", status);
}

int calculate(int a, int b) {
    int remainder = a % b; // Modulo operator (%)
    return remainder;
}

int main() {
    int x = 25;
    int y = 4;
    int rem = calculate(x, y);

    // Condition statements with logical operators (&&, ||, !)
    if (rem != 0 && (x > 20 || !y)) {
        printMessage('P');
    } else {
        printMessage('F');
    }

    return 0;
}`
  },

  'no-library-demo': {
    name: '2. Without Libraries (Libraries Can Be Missed)',
    code: `// 2. Program without any #include or library imports
// In MINICOMPILER, library imports can be completely missed/omitted!
int add(int a, int b) {
    return a + b;
}

int a = 15;
int b = 6;
int mod = a % b; // Modulo operator

if (mod > 0 && a >= 10) {
    int result = add(a, b);
}`
  },

  'basic-decl': {
    name: '3. Declarations (int, float, char)',
    code: `// 3. Variable Declarations with int, float, and char
int counter = 0;
float pi = 3.14159;
float temperature = 98.6;
char grade = 'A';
char newline = '\\n';`
  },

  'if-else': {
    name: '4. If-Else Control Flow & Logic',
    code: `// 4. If-Else Control Flow with Logical Operators
int x = 20;
int max = 0;

if (x > 10 && x <= 50) {
    max = x;
} else {
    max = 10;
}`
  },

  'while-loop': {
    name: '5. While Loop & Arithmetic',
    code: `// 5. While Loop with Modulo and Arithmetic
int count = 10;
int sum = 0;

while (count >= 1) {
    if (count % 2 == 0) {
        sum = sum + count;
    }
    count = count - 1;
}`
  },

  'comments-demo': {
    name: '6. Comments (Single & Multi-line)',
    code: `// 6. Demonstrating Single and Multi-line Comments
// This is a single-line comment.
int alpha = 100; // Inline single-line comment

/*
   This is a multi-line comment.
   It spans across multiple lines.
   The lexer safely strips this away while tracking line and col.
*/
float beta = 250.75;
/* inline block comment */ char flag = 'Z';`
  },

  'all-operators': {
    name: '7. All Supported Operators',
    code: `// 7. All Supported Operators: +, -, *, /, %, =, ==, !=, <, <=, >, >=, &&, ||, !
int a = 15;
int b = 4;

int add = a + b;
int sub = a - b;
int mul = a * b;
int div = a / b;
int mod = a % b; // Modulo

if (a == b || a != b) { a = 0; }
if (a < b && a <= b)  { a = 1; }
if (!(a > b) && a >= b) { a = 2; }`
  },

  'err-invalid-char': {
    name: '8. Error: Invalid Characters (@, $, ~)',
    code: `// 8. Lexical Error: Invalid Characters
int total = 100;
int @score = 50;   // '@' is illegal
int price$ = 20;   // '$' is illegal
int invalid~ = 1;  // '~' is illegal`
  },

  'err-malformed-float': {
    name: '9. Error: Multiple Decimal Points (12.34.56)',
    code: `// 9. Lexical Error: Malformed Float Literals
float rate = 12.34.56; // Multiple decimal points
float ratio = 55.;     // Trailing dot with no digits`
  },

  'err-ident-digit': {
    name: '10. Error: Identifier Starting With Digit (99bottles)',
    code: `// 10. Lexical Error: Identifiers Starting With Digit
int 99bottles = 99; // Identifiers cannot start with digit
float 3point = 3.0;`
  },

  'err-unclosed-comment': {
    name: '11. Error: Unterminated Multi-line Comment',
    code: `// 11. Lexical Error: Unterminated Multi-line Comment
int validVar = 10;

/* This comment is never closed!
The lexer will scan until EOF and flag this as an error.`
  },

  'err-char-literal': {
    name: '12. Error: Malformed Char Literals',
    code: `// 12. Lexical Error: Malformed Char Literals
char empty = '';        // Empty literal
char multi = 'toolong'; // More than one character
char unclosed = 'A;     // Missing closing quote`
  }
};
