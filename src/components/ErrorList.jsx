import React from 'react';

export function ErrorList({ lexicalErrors = [], syntaxErrors = [], errors = [] }) {
  // Support both unified or separate arrays
  const lexList = lexicalErrors.length > 0 ? lexicalErrors : (errors.filter(e => e.toString().includes('Lexical') || !e.expected) || []);
  const synList = syntaxErrors.length > 0 ? syntaxErrors : (errors.filter(e => e.toString().includes('Syntax') || e.expected !== undefined) || []);

  // If passed directly as unified errors array
  const allErrors = (lexicalErrors.length > 0 || syntaxErrors.length > 0)
    ? [...lexicalErrors.map(e => ({ ...e, kind: 'Lexical' })), ...syntaxErrors.map(e => ({ ...e, kind: 'Syntax' }))]
    : errors.map(e => ({ ...e, kind: e.toString().includes('Syntax') ? 'Syntax' : 'Lexical' }));

  if (allErrors.length === 0) {
    return (
      <div className="empty-state success-state">
        <span className="empty-icon">✅</span>
        <p><strong>Analysis Successful!</strong></p>
        <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
          0 lexical or syntax errors found.
        </span>
      </div>
    );
  }

  return (
    <div className="error-container">
      {allErrors.map((err, i) => {
        const isSyntax = err.kind === 'Syntax';
        return (
          <div className={`error-card ${isSyntax ? 'error-card-syntax' : ''}`} key={i}>
            <div className="error-card-header">
              <span className={`error-title ${isSyntax ? 'error-title-syntax' : ''}`}>
                <span>{isSyntax ? '⛔' : '⚠️'}</span> {err.kind} Error #{i + 1}
              </span>
              <span className="error-pos">Line {err.line}, Column {err.column}</span>
            </div>
            <p className="error-desc">{err.message}</p>
          </div>
        );
      })}
    </div>
  );
}
