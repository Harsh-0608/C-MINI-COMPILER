import React from 'react';
import { SAMPLES } from '../compiler/samples.js';

export function Header({
  selectedSample,
  onSelectSample,
  onTokenize,
  onParse,
  onClear,
  onRunTests
}) {
  return (
    <header className="app-header">
      <div className="brand">
        <div className="brand-icon">⚡</div>
        <div>
          <h1>MINICOMPILER</h1>
          <p className="subtitle">Compiler Design Lab • React Edition • Phase 1: Lexer & Phase 2: Parser</p>
        </div>
      </div>

      <div className="header-actions">
        <div className="sample-select-wrapper">
          <label htmlFor="sampleSelect">Load Sample:</label>
          <select
            id="sampleSelect"
            value={selectedSample}
            onChange={(e) => onSelectSample(e.target.value)}
          >
            <option value="" disabled>-- Choose a Program --</option>
            <optgroup label="Core Feature Samples">
              <option value="for-loop-demo">{SAMPLES['for-loop-demo'].name}</option>
              <option value="stack-queue-struct">{SAMPLES['stack-queue-struct'].name}</option>
              <option value="member-access">{SAMPLES['member-access'].name}</option>
              <option value="bitwise-demo">{SAMPLES['bitwise-demo'].name}</option>
              <option value="arrays-demo">{SAMPLES['arrays-demo'].name}</option>
              <option value="methods-modulo-conditions">{SAMPLES['methods-modulo-conditions'].name}</option>
              <option value="no-library-demo">{SAMPLES['no-library-demo'].name}</option>
              <option value="basic-decl">{SAMPLES['basic-decl'].name}</option>
              <option value="if-else">{SAMPLES['if-else'].name}</option>
              <option value="while-loop">{SAMPLES['while-loop'].name}</option>
              <option value="comments-demo">{SAMPLES['comments-demo'].name}</option>
              <option value="all-operators">{SAMPLES['all-operators'].name}</option>
            </optgroup>
            <optgroup label="Lexical Error Test Cases">
              <option value="err-invalid-char">{SAMPLES['err-invalid-char'].name}</option>
              <option value="err-malformed-float">{SAMPLES['err-malformed-float'].name}</option>
              <option value="err-ident-digit">{SAMPLES['err-ident-digit'].name}</option>
              <option value="err-unclosed-comment">{SAMPLES['err-unclosed-comment'].name}</option>
              <option value="err-char-literal">{SAMPLES['err-char-literal'].name}</option>
            </optgroup>
          </select>
        </div>

        <button
          className="btn btn-secondary"
          onClick={onRunTests}
          title="Run automated unit test suite"
        >
          <span className="btn-icon">🧪</span> Run Tests
        </button>

        <button
          className="btn btn-outline"
          onClick={onClear}
          title="Clear editor and results"
        >
          <span className="btn-icon">🗑️</span> Clear
        </button>

        <button
          className="btn btn-primary"
          onClick={onTokenize}
          title="Execute Lexical Analysis (Ctrl+Enter)"
        >
          <span className="btn-icon">▶</span> Tokenize Source
        </button>

        <button
          className="btn btn-parse"
          onClick={onParse}
          title="Execute Syntax Analysis (Recursive Descent Parser)"
        >
          <span className="btn-icon">🌳</span> Parse Source
        </button>
      </div>
    </header>
  );
}
