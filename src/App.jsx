import React, { useState, useEffect } from 'react';
import { Header } from './components/Header.jsx';
import { Editor } from './components/Editor.jsx';
import { TokenTable } from './components/TokenTable.jsx';
import { ParseTreeVisualizer } from './components/ParseTreeVisualizer.jsx';
import { ParsingSteps } from './components/ParsingSteps.jsx';
import { ErrorList } from './components/ErrorList.jsx';
import { LanguageSpec } from './components/LanguageSpec.jsx';
import { TestRunner } from './components/TestRunner.jsx';

import { Lexer } from './compiler/lexer.js';
import { Parser } from './compiler/parser.js';
import { SAMPLES } from './compiler/samples.js';
import { runAllTests } from './compiler/tests.js';

export function App() {
  const [selectedSample, setSelectedSample] = useState('arrays-demo');
  const [source, setSource] = useState(SAMPLES['arrays-demo'].code);
  const [tokens, setTokens] = useState([]);
  const [lexicalErrors, setLexicalErrors] = useState([]);
  const [syntaxErrors, setSyntaxErrors] = useState([]);
  const [parseTree, setParseTree] = useState(null);
  const [parsingSteps, setParsingSteps] = useState([]);
  const [parseStatus, setParseStatus] = useState('idle'); // 'idle' | 'success' | 'error'
  const [activeTab, setActiveTab] = useState('tokens');
  const [filterText, setFilterText] = useState('');
  const [testResult, setTestResult] = useState(null);

  // Run initial lexer on mount
  useEffect(() => {
    handleTokenize(SAMPLES['arrays-demo'].code);
  }, []);

  /**
   * Phase 1 Action: Tokenize only
   * Strictly runs lexical analysis and displays tokens table.
   */
  const handleTokenize = (codeToTokenize) => {
    const code = codeToTokenize !== undefined ? codeToTokenize : source;
    const lexer = new Lexer(code);
    const { tokens: scannedTokens, errors: scannedErrors } = lexer.tokenize();

    setTokens(scannedTokens);
    setLexicalErrors(scannedErrors);
    setSyntaxErrors([]);
    setParseTree(null);
    setParsingSteps([]);
    setParseStatus('idle');

    if (scannedErrors.length > 0) {
      setActiveTab('errors');
    } else {
      setActiveTab('tokens');
    }
  };

  /**
   * Phase 2 Action: Parse Source
   * 1. Runs Phase 1 Lexer first.
   * 2. If lexical errors exist, halts and displays them.
   * 3. If lexical analysis passes, feeds tokens directly to Phase 2 Parser.
   */
  const handleParse = (codeToParse) => {
    const code = codeToParse !== undefined ? codeToParse : source;

    // Step 1: Lexical Analysis
    const lexer = new Lexer(code);
    const { tokens: scannedTokens, errors: scannedLexErrors } = lexer.tokenize();

    setTokens(scannedTokens);
    setLexicalErrors(scannedLexErrors);

    // Step 2: Stop if lexical errors exist
    if (scannedLexErrors.length > 0) {
      setSyntaxErrors([]);
      setParseTree(null);
      setParsingSteps([
        'Lexical analysis failed with errors.',
        'Parser execution aborted to prevent cascade failures.'
      ]);
      setParseStatus('error');
      setActiveTab('errors');
      return;
    }

    // Step 3: Run Recursive Descent Parser using the exact token stream
    const parser = new Parser(scannedTokens);
    const { cst, errors: scannedSynErrors, parsingSteps: steps } = parser.parse();

    setParseTree(cst);
    setSyntaxErrors(scannedSynErrors);
    setParsingSteps(steps);

    if (scannedSynErrors.length > 0) {
      setParseStatus('error');
      setActiveTab('errors');
    } else {
      setParseStatus('success');
      setActiveTab('tree');
    }
  };

  const handleSelectSample = (sampleKey) => {
    setSelectedSample(sampleKey);
    if (SAMPLES[sampleKey]) {
      const code = SAMPLES[sampleKey].code;
      setSource(code);
      handleTokenize(code);
    }
  };

  const handleClear = () => {
    setSource('');
    setSelectedSample('');
    setTokens([]);
    setLexicalErrors([]);
    setSyntaxErrors([]);
    setParseTree(null);
    setParsingSteps([]);
    setParseStatus('idle');
    setFilterText('');
  };

  const handleRunTests = () => {
    const result = runAllTests();
    setTestResult(result);
    setActiveTab('tests');
  };

  const totalErrors = lexicalErrors.length + syntaxErrors.length;

  return (
    <div className="app-container">
      <Header
        selectedSample={selectedSample}
        onSelectSample={handleSelectSample}
        onTokenize={() => handleTokenize()}
        onParse={() => handleParse()}
        onClear={handleClear}
        onRunTests={handleRunTests}
      />

      <main className="workspace">
        <Editor
          source={source}
          onChange={(newSource) => setSource(newSource)}
          onTokenize={() => handleTokenize()}
        />

        <section className="panel output-panel">
          <div className="panel-header tabs-header">
            <div className="tabs">
              <button
                className={`tab-btn ${activeTab === 'tokens' ? 'active' : ''}`}
                onClick={() => setActiveTab('tokens')}
              >
                Tokens <span className="badge">{tokens.length}</span>
              </button>

              <button
                className={`tab-btn ${activeTab === 'tree' ? 'active' : ''}`}
                onClick={() => setActiveTab('tree')}
              >
                Parse Tree{' '}
                {parseStatus === 'success' && (
                  <span className="badge badge-success">✓</span>
                )}
                {parseStatus === 'error' && (
                  <span className="badge badge-danger">!</span>
                )}
              </button>

              <button
                className={`tab-btn ${activeTab === 'steps' ? 'active' : ''}`}
                onClick={() => setActiveTab('steps')}
              >
                Parsing Steps{' '}
                {parsingSteps.length > 0 && (
                  <span className="badge">{parsingSteps.length}</span>
                )}
              </button>

              <button
                className={`tab-btn ${activeTab === 'errors' ? 'active' : ''}`}
                onClick={() => setActiveTab('errors')}
              >
                Errors{' '}
                {totalErrors > 0 && (
                  <span className="badge badge-danger">{totalErrors}</span>
                )}
              </button>

              <button
                className={`tab-btn ${activeTab === 'spec' ? 'active' : ''}`}
                onClick={() => setActiveTab('spec')}
              >
                Language Spec
              </button>

              <button
                className={`tab-btn ${activeTab === 'tests' ? 'active' : ''}`}
                onClick={() => setActiveTab('tests')}
              >
                Automated Tests{' '}
                {testResult && (
                  <span
                    className={`badge ${
                      testResult.failed === 0 ? 'badge-success' : 'badge-danger'
                    }`}
                  >
                    {testResult.passed}/{testResult.total}
                  </span>
                )}
              </button>
            </div>
          </div>

          <div className="tab-content-container">
            {activeTab === 'tokens' && (
              <TokenTable
                tokens={tokens}
                filterText={filterText}
                onFilterChange={setFilterText}
              />
            )}

            {activeTab === 'tree' && (
              <ParseTreeVisualizer
                parseTree={parseTree}
                parseStatus={parseStatus}
              />
            )}

            {activeTab === 'steps' && (
              <ParsingSteps steps={parsingSteps} />
            )}

            {activeTab === 'errors' && (
              <ErrorList
                lexicalErrors={lexicalErrors}
                syntaxErrors={syntaxErrors}
              />
            )}

            {activeTab === 'spec' && <LanguageSpec />}

            {activeTab === 'tests' && (
              <TestRunner
                testSuiteResult={testResult}
                onRunTests={handleRunTests}
              />
            )}
          </div>
        </section>
      </main>

      <footer className="app-footer">
        <div className="footer-left">
          <span>
            MINICOMPILER &bull; Phase 1 (Lexer) &bull; Phase 2 (Recursive Descent Parser)
          </span>
        </div>
        <div className="footer-right">
          <span>
            Status:{' '}
            <strong
              style={{
                color:
                  parseStatus === 'success'
                    ? 'var(--success)'
                    : parseStatus === 'error'
                    ? 'var(--danger)'
                    : 'var(--text-muted)'
              }}
            >
              {parseStatus === 'success'
                ? 'Syntax Analysis: Valid ✓'
                : parseStatus === 'error'
                ? 'Errors Detected ⚠'
                : 'Ready'}
            </strong>
          </span>
        </div>
      </footer>
    </div>
  );
}
