import React, { useState } from 'react';
import { runAllTests } from '../compiler/tests.js';

export function TestRunner({ testSuiteResult, onRunTests }) {
  const [suiteFilter, setSuiteFilter] = useState('ALL');

  const hasRun = !!testSuiteResult;
  const suites = hasRun
    ? ['ALL', ...new Set(testSuiteResult.results.map((r) => r.suite))]
    : [];

  const displayedResults = hasRun
    ? testSuiteResult.results.filter(
        (r) => suiteFilter === 'ALL' || r.suite === suiteFilter
      )
    : [];

  return (
    <div className="tests-runner-container">
      <div className="tests-header">
        <div>
          <h3>Stage 1 Automated Test Suite</h3>
          <p id="testsStatusText">
            {hasRun
              ? `Completed ${testSuiteResult.total} assertions: ${testSuiteResult.passed} passed, ${testSuiteResult.failed} failed.`
              : 'Click "Run Tests Now" to execute all automated test suites.'}
          </p>
        </div>
        <button className="btn btn-primary btn-sm" onClick={onRunTests}>
          Run Tests Now
        </button>
      </div>

      {hasRun && (
        <>
          <div className="tests-summary-box">
            <div className="summary-stat">
              <span className="stat-label">Total Assertions</span>
              <span className="stat-value">{testSuiteResult.total}</span>
            </div>
            <div className="summary-stat">
              <span className="stat-label">Passed</span>
              <span className="stat-value" style={{ color: 'var(--success)' }}>
                {testSuiteResult.passed}
              </span>
            </div>
            <div className="summary-stat">
              <span className="stat-label">Failed</span>
              <span
                className="stat-value"
                style={{
                  color:
                    testSuiteResult.failed > 0
                      ? 'var(--danger)'
                      : 'var(--text-dim)'
                }}
              >
                {testSuiteResult.failed}
              </span>
            </div>
            <div className="summary-stat">
              <span className="stat-label">Status</span>
              <span
                className="stat-value"
                style={{
                  color:
                    testSuiteResult.failed === 0
                      ? 'var(--success)'
                      : 'var(--danger)'
                }}
              >
                {testSuiteResult.failed === 0
                  ? 'ALL TESTS PASSED 🎉'
                  : 'FAILURES DETECTED ❌'}
              </span>
            </div>
          </div>

          <div className="suite-filter-bar">
            <span>Filter Suite:</span>
            <select
              value={suiteFilter}
              onChange={(e) => setSuiteFilter(e.target.value)}
              className="suite-select"
            >
              {suites.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>

          <div className="tests-list">
            {displayedResults.map((r, i) => (
              <div
                key={i}
                className={`test-item ${r.passed ? 'pass' : 'fail'}`}
              >
                <span>{r.passed ? '✓' : '✗'}</span>
                <span>{r.description}</span>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

