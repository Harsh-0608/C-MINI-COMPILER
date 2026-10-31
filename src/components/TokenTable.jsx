import React from 'react';
import { TokenType } from '../compiler/token.js';

export function TokenTable({ tokens, filterText, onFilterChange }) {
  const filteredTokens = tokens.filter((token) => {
    if (!filterText) return true;
    const q = filterText.toLowerCase();
    return (
      token.value.toLowerCase().includes(q) ||
      token.type.toLowerCase().includes(q) ||
      token.getCategory().toLowerCase().includes(q)
    );
  });

  const getBadgeClass = (token) => {
    const category = token.getCategory();
    if (category === 'Keyword') return 'badge-token badge-kw';
    if (category === 'Identifier') return 'badge-token badge-id';
    if (category.includes('Literal')) return 'badge-token badge-lit';
    if (category === 'Operator') return 'badge-token badge-op';
    if (category === 'Delimiter') return 'badge-token badge-delim';
    if (category === 'Preprocessor') return 'badge-token badge-pre';
    if (token.type === TokenType.EOF) return 'badge-token badge-eof';
    return 'badge-token';
  };

  return (
    <div className="tab-pane-content">
      <div className="table-filter-bar">
        <input
          type="text"
          className="search-input"
          placeholder="Filter tokens..."
          value={filterText}
          onChange={(e) => onFilterChange(e.target.value)}
        />
        <span className="filter-count">
          Showing {filteredTokens.length} of {tokens.length} tokens
        </span>
      </div>

      <div className="table-container">
        <table className="token-table">
          <thead>
            <tr>
              <th style={{ width: '48px' }}>#</th>
              <th>Lexeme</th>
              <th>Token Type</th>
              <th>Category</th>
              <th style={{ width: '70px' }}>Line</th>
              <th style={{ width: '70px' }}>Column</th>
            </tr>
          </thead>
          <tbody>
            {filteredTokens.length === 0 ? (
              <tr className="empty-row">
                <td colSpan={6}>
                  {tokens.length === 0
                    ? 'No tokens scanned yet. Click "Tokenize Source" above.'
                    : 'No tokens match the filter query.'}
                </td>
              </tr>
            ) : (
              filteredTokens.map((token, idx) => (
                <tr key={idx}>
                  <td style={{ color: 'var(--text-dim)' }}>{idx + 1}</td>
                  <td>
                    <span className="lexeme-code">{token.value}</span>
                  </td>
                  <td>
                    <span className={getBadgeClass(token)}>
                      {token.getDisplayName()}
                    </span>
                  </td>
                  <td style={{ color: 'var(--text-muted)' }}>{token.getCategory()}</td>
                  <td>
                    <span className="pos-tag">L{token.line}</span>
                  </td>
                  <td>
                    <span className="pos-tag">C{token.column}</span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

