import React from 'react';

export function LanguageSpec() {
  return (
    <div className="spec-container">
      <h3>Language Specification &amp; Grammar Elements</h3>
      <p className="spec-note">
        Full C compiler specification supporting function prototypes, enumerations (<code>enum</code>), pointer expressions, type casting, and inbuilt sorting (<code>qsort</code> with <code>sizeof</code>).
      </p>

      <div className="spec-grid">
        <div className="spec-card">
          <h4>1. Supported Data Types, Suffixes &amp; Format Specifiers</h4>
          <ul>
            <li><code>int</code>, <code>short</code>, <code>long</code>, <code>long long</code>: Integers &amp; 64-bit literals (<code>42</code>, <code>100L</code>, <code>123456789LL</code>, <code>0xFF</code>)</li>
            <li><code>unsigned</code>: Unsigned variants (<code>unsigned int</code>, <code>unsigned long long ull = 987654321ULL;</code>, <code>100u</code>)</li>
            <li><code>float</code>, <code>double</code>: Floating-point literals with optional suffixes (<code>13.4567f</code>, <code>3.14159</code>, <code>0.05F</code>, <code>1.5L</code>)</li>
            <li><code>char</code>: Single ASCII character literals (e.g. <code>'a'</code>, <code>'Z'</code>, <code>{'\''}\n{'\''}</code>)</li>
            <li><code>void</code>: Void return type and generic pointers (<code>void*</code>)</li>
            <li><strong>Format Specifiers:</strong> <code>%lld</code> (long long), <code>%llu</code> (unsigned long long), <code>%d</code>/<code>%i</code>, <code>%u</code>, <code>%f</code>, <code>%lf</code>, <code>%c</code>, <code>%s</code>, <code>%p</code></li>
          </ul>
        </div>

        <div className="spec-card">
          <h4>2. Keywords</h4>
          <div className="token-chips">
            <span className="chip chip-kw">int</span>
            <span className="chip chip-kw">float</span>
            <span className="chip chip-kw">double</span>
            <span className="chip chip-kw">char</span>
            <span className="chip chip-kw">void</span>
            <span className="chip chip-kw">unsigned</span>
            <span className="chip chip-kw">signed</span>
            <span className="chip chip-kw">long</span>
            <span className="chip chip-kw">short</span>
            <span className="chip chip-kw">return</span>
            <span className="chip chip-kw">if</span>
            <span className="chip chip-kw">else</span>
            <span className="chip chip-kw">while</span>
            <span className="chip chip-kw">do</span>
            <span className="chip chip-kw">for</span>
            <span className="chip chip-kw">switch</span>
            <span className="chip chip-kw">case</span>
            <span className="chip chip-kw">default</span>
            <span className="chip chip-kw">break</span>
            <span className="chip chip-kw">continue</span>
            <span className="chip chip-kw">struct</span>
            <span className="chip chip-kw">union</span>
            <span className="chip chip-kw">enum</span>
            <span className="chip chip-kw">sizeof</span>
            <span className="chip chip-kw">const</span>
            <span className="chip chip-kw">typedef</span>
          </div>
        </div>

        <div className="spec-card">
          <h4>3. Arithmetic, Compound Assignment, Shift &amp; Bitwise</h4>
          <ul>
            <li><strong>Arithmetic:</strong> <code>+</code>, <code>-</code>, <code>*</code>, <code>/</code>, <code>%</code></li>
            <li><strong>Increment/Decrement:</strong> <code>++</code>, <code>--</code> (e.g. <code>i++</code>, <code>*p++</code>, <code>(*p)++</code>)</li>
            <li><strong>Assignment:</strong> <code>=</code>, <code>+=</code>, <code>-=</code>, <code>*=</code>, <code>/=</code>, <code>%=</code></li>
            <li><strong>Bitwise &amp; Shifts:</strong> <code>{'&'}</code>, <code>|</code>, <code>^</code>, <code>{'<<'}</code>, <code>{'>>'}</code></li>
            <li><strong>Bitwise Assignments:</strong> <code>{'&='}</code>, <code>|=</code>, <code>^=</code>, <code>{'<<='}</code>, <code>{'>>='}</code></li>
          </ul>
        </div>

        <div className="spec-card">
          <h4>4. Loops, Conditionals, Ternary &amp; Switch-Case</h4>
          <ul>
            <li><strong>Loops:</strong> <code>{'while (cond) { ... }'}</code>, <code>{'for (int i = 0; i < n; i++) { ... }'}</code></li>
            <li><strong>Do-While Loop:</strong> <code>{'do { i++; } while (i < 10);'}</code></li>
            <li><strong>Jump Statements:</strong> <code>{'break;'}</code> and <code>{'continue;'}</code></li>
            <li><strong>Ternary Operator (<code>? :</code>):</strong> <code>{'max = (a > b) ? a : b;'}</code></li>
            <li><strong>Switch-Case:</strong> <code>{'switch (x) { case 1: ... break; default: ... }'}</code></li>
            <li><strong>Relational &amp; Logical:</strong> <code>==</code>, <code>!=</code>, <code>{'<'}</code>, <code>{'>'}</code>, <code>{'&&'}</code>, <code>{'||'}</code>, <code>!</code></li>
          </ul>
        </div>

        <div className="spec-card">
          <h4>5. Function Declarations, Prototypes &amp; Function Pointers</h4>
          <ul>
            <li><strong>Function Definitions:</strong> <code>{'int add(int a, int b) { return a + b; }'}</code></li>
            <li><strong>Function Prototypes:</strong> <code>{'void sort(int arr[], int n);'}</code>, <code>{'int sum(int, int);'}</code></li>
            <li><strong>Function Pointer Variables:</strong> <code>{'int (*a)(int);'}</code>, <code>{'void (*fn)(void) = myTask;'}</code></li>
            <li><strong>Arrays of Function Pointers:</strong> <code>{'int (*ops[4])(int, int);'}</code></li>
            <li><strong>Callback Parameters:</strong> <code>{'int (*cmp)(const void*, const void*)'}</code></li>
            <li><strong>Typedef Function Pointers:</strong> <code>{'typedef int (*BinaryOp)(int, int);'}</code></li>
          </ul>
        </div>

        <div className="spec-card">
          <h4>6. Enumerations (enum &amp; typedef)</h4>
          <ul>
            <li><strong>Enum Definition:</strong> <code>{'enum State { IDLE, RUNNING = 1, STOPPED };'}</code></li>
            <li><strong>Typedef Enum:</strong> <code>{'typedef enum { OFF, ON } Switch;'}</code></li>
            <li><strong>Enum Variables:</strong> <code>{'enum State current = IDLE; Switch s = ON;'}</code></li>
            <li><strong>Typedef Structs:</strong> <code>{'typedef struct { int x; int y; } Point;'}</code></li>
          </ul>
        </div>

        <div className="spec-card">
          <h4>7. Pointer Expressions, Const Pointers &amp; Type Casts</h4>
          <ul>
            <li><strong>Pointer Declarations:</strong> <code>{'int *p = &x; const void *ptr;'}</code></li>
            <li><strong>Const Pointers (All Types):</strong> <code>{'int *const a = &x;'}</code>, <code>{'const int *const b = &y;'}</code></li>
            <li><strong>Struct/Custom Const Pointers:</strong> <code>{'struct Node *const head = &n;'}</code>, <code>{'void *const buf;'}</code></li>
            <li><strong>Dereferencing Assignments:</strong> <code>{'*p = 10; *p += 5; *p = *q;'}</code></li>
            <li><strong>Pointer Statements:</strong> <code>{'*p++; (*p)++; (*p) = 20; *(p + 1) = 30;'}</code></li>
            <li><strong>Type Casts:</strong> <code>{'*(int*)ptr'}</code>, <code>{'(char*)p'}</code>, <code>{'(float)total'}</code></li>
            <li><strong>Pointer Arithmetic:</strong> <code>{'int diff = p2 - p1; ptr = arr + i;'}</code></li>
          </ul>
        </div>

        <div className="spec-card">
          <h4>8. Inbuilt Sorting &amp; sizeof Operator</h4>
          <ul>
            <li><strong>Inbuilt Sorting (<code>qsort</code>):</strong> <code>{'qsort(arr, n, sizeof(int), compare);'}</code></li>
            <li><strong>sizeof on Arrays:</strong> <code>{'int n = sizeof(arr) / sizeof(arr[0]);'}</code></li>
            <li><strong>sizeof on Types:</strong> <code>{'sizeof(int)'}</code>, <code>{'sizeof(void*)'}</code>, <code>{'sizeof(struct Node)'}</code></li>
            <li><strong>Comparator Functions:</strong> <code>{'int compare(const void *a, const void *b) { return (*(int*)a - *(int*)b); }'}</code></li>
          </ul>
        </div>

        <div className="spec-card">
          <h4>9. Arrays, Method Calls &amp; Member Access</h4>
          <ul>
            <li><strong>Array Initializer Lists:</strong> <code>{'int arr[5] = {1, 2, 3, 4, 5};'}</code> or <code>{'int arr[] = {1, 2, 3};'}</code></li>
            <li><strong>Multidimensional Arrays:</strong> <code>{'int m[2][2] = {{1, 2}, {3, 4}};'}</code> and <code>m[0][1] = 99;</code></li>
            <li><strong>Member Access (<code>.</code> and <code>{'-&gt;'}</code>):</strong> <code>{'tokens[i].type = type;'}</code> or <code>{'node->val = 100;'}</code></li>
            <li><strong>Library Imports:</strong> <code>{'#include <stdio.h>'}</code>, <code>{'#include <stdlib.h>'}</code></li>
          </ul>
        </div>
      </div>
    </div>
  );
}
