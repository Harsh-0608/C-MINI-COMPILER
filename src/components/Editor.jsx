import React, { useRef, useEffect } from 'react';

export function Editor({ source, onChange, onTokenize }) {
  const textareaRef = useRef(null);
  const lineNumbersRef = useRef(null);

  const lines = source.split('\n');
  const lineCount = lines.length;

  const handleScroll = () => {
    if (textareaRef.current && lineNumbersRef.current) {
      lineNumbersRef.current.scrollTop = textareaRef.current.scrollTop;
    }
  };

  const handleKeyDown = (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      onTokenize();
    }
  };

  let lineNumbersText = '';
  for (let i = 1; i <= lineCount; i++) {
    lineNumbersText += i + '\n';
  }

  return (
    <section className="panel editor-panel">
      <div className="panel-header">
        <div className="panel-title">
          <span className="panel-icon">📝</span>
          <h2>Source Code Input</h2>
        </div>
        <div className="editor-meta">
          <span>Lines: {lineCount} | Chars: {source.length}</span>
        </div>
      </div>

      <div className="editor-wrapper">
        <div
          className="line-numbers"
          ref={lineNumbersRef}
          onWheel={(e) => {
            if (textareaRef.current) {
              textareaRef.current.scrollTop += e.deltaY;
            }
          }}
        >
          {lineNumbersText}
        </div>
        <textarea
          ref={textareaRef}
          value={source}
          onChange={(e) => onChange(e.target.value)}
          onScroll={handleScroll}
          onKeyDown={handleKeyDown}
          spellCheck={false}
          placeholder="// Enter your program here..."
        />
      </div>

      <div className="editor-footer">
        <span className="shortcut-hint"><kbd>Ctrl</kbd> + <kbd>Enter</kbd> to analyze</span>
        <span className="grammar-hint">Supported types: <code>int</code>, <code>float</code>, <code>char</code></span>
      </div>
    </section>
  );
}

