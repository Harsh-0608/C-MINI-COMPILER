import React, { useState } from 'react';

export function ParsingSteps({ steps }) {
  const [filterQuery, setFilterQuery] = useState('');

  if (!steps || steps.length === 0) {
    return (
      <div className="empty-state">
        <span className="empty-icon">📜</span>
        <p><strong>No Parsing Steps Recorded</strong></p>
        <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
          Click <strong>"Parse Source"</strong> to watch the recursive-descent parser trace its decisions step by step.
        </span>
      </div>
    );
  }

  const filteredSteps = steps.filter((step) =>
    step.toLowerCase().includes(filterQuery.toLowerCase())
  );

  return (
    <div className="parsing-steps-container">
      <div className="steps-header-bar">
        <div className="steps-summary-info">
          <span>Total Steps: <strong>{steps.length}</strong></span>
        </div>
        <input
          type="text"
          className="search-input"
          placeholder="Filter steps..."
          value={filterQuery}
          onChange={(e) => setFilterQuery(e.target.value)}
        />
      </div>

      <div className="steps-list-viewport">
        {filteredSteps.map((step, idx) => {
          const isError = step.startsWith('ERROR:');
          const isEntering = step.startsWith('Entering ');
          const isMatched = step.startsWith('Matched ');
          const isParsed = step.startsWith('Parsed ');

          let itemClass = 'step-item';
          if (isError) itemClass += ' step-error';
          else if (isEntering) itemClass += ' step-entering';
          else if (isMatched) itemClass += ' step-matched';
          else if (isParsed) itemClass += ' step-parsed';

          return (
            <div key={idx} className={itemClass}>
              <span className="step-index">{idx + 1}</span>
              <span className="step-text">{step}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

