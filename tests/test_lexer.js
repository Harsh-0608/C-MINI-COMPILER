/**
 * Automated test suite for MINICOMPILER Phase 1 (Lexical Analysis)
 * Can be executed with: node tests/test_lexer.js or npm test
 */

import { runAllTests } from '../src/compiler/tests.js';

console.log('========================================================');
console.log('   MINICOMPILER (React Edition) - Stage 1 Lexer Tests');
console.log('========================================================\n');

const testSuite = runAllTests();

let currentSuite = '';
testSuite.results.forEach(res => {
  if (res.suite !== currentSuite) {
    currentSuite = res.suite;
    console.log(`\n${currentSuite}`);
  }
  if (res.passed) {
    console.log(`  ✓ PASS: ${res.description}`);
  } else {
    console.error(`  ✗ FAIL: ${res.description} ${res.details}`);
  }
});

console.log('\n========================================================');
console.log(`Test Summary: Total: ${testSuite.total} | Passed: ${testSuite.passed} | Failed: ${testSuite.failed}`);
console.log('========================================================');

if (testSuite.failed > 0) {
  process.exit(1);
} else {
  console.log('\n🎉 ALL STAGE 1 LEXER TESTS PASSED!\n');
}
