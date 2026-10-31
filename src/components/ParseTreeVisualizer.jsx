import React, { useState } from 'react';

/**
 * Individual collapsible node in the parse tree.
 */
function TreeNode({ node, defaultExpanded = true }) {
  const [expanded, setExpanded] = useState(defaultExpanded);

  if (!node) return null;

  const hasChildren = node.children && node.children.length > 0;

  // Color badge class based on node type
  const getNodeBadgeClass = (type) => {
    if (type === 'Program') return 'tree-badge tree-badge-root';
    if (type.includes('Declaration') || type.includes('Type')) return 'tree-badge tree-badge-decl';
    if (type.includes('Statement') || type.includes('Assignment')) return 'tree-badge tree-badge-stmt';
    if (type.includes('Expression') || type.includes('Group') || type.includes('Access')) return 'tree-badge tree-badge-expr';
    if (type === 'Identifier') return 'tree-badge tree-badge-id';
    if (type.includes('Literal')) return 'tree-badge tree-badge-lit';
    if (type === 'EOF') return 'tree-badge tree-badge-eof';
    return 'tree-badge';
  };

  return (
    <div className="tree-node-wrapper">
      <div className="tree-node-row">
        {hasChildren ? (
          <button
            className="tree-toggle-btn"
            onClick={() => setExpanded(!expanded)}
            title={expanded ? 'Collapse subtree' : 'Expand subtree'}
          >
            {expanded ? '▼' : '▶'}
          </button>
        ) : (
          <span className="tree-toggle-placeholder">•</span>
        )}

        <span className={getNodeBadgeClass(node.type)}>{node.type}</span>

        {node.value !== null && node.value !== undefined && (
          <span className="tree-node-value">"{node.value}"</span>
        )}

        {node.line > 0 && (
          <span className="tree-pos-tag">
            L{node.line}:C{node.column}
          </span>
        )}
      </div>

      {hasChildren && expanded && (
        <div className="tree-children-container">
          {node.children.map((child, idx) => (
            <TreeNode key={idx} node={child} defaultExpanded={defaultExpanded} />
          ))}
        </div>
      )}
    </div>
  );
}

export function ParseTreeVisualizer({ parseTree, parseStatus }) {
  const [expandAllKey, setExpandAllKey] = useState(0);
  const [defaultExpand, setDefaultExpand] = useState(true);

  if (!parseTree || !parseTree.children || parseTree.children.length === 0) {
    return (
      <div className="empty-state">
        <span className="empty-icon">🌳</span>
        <p><strong>No Parse Tree Available</strong></p>
        <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
          Click <strong>"Parse Source"</strong> in the top header to run syntax analysis and generate the tree.
        </span>
      </div>
    );
  }

  const handleToggleAll = (expand) => {
    setDefaultExpand(expand);
    setExpandAllKey((prev) => prev + 1);
  };

  return (
    <div className="parse-tree-container">
      <div className="tree-controls-bar">
        <div className="tree-status-info">
          <span className="tree-icon">🌲</span>
          <span>
            Concrete Syntax Tree (Parse Tree) &bull;{' '}
            <strong style={{ color: parseStatus === 'success' ? 'var(--success)' : 'var(--warning)' }}>
              {parseStatus === 'success' ? 'Syntax Valid' : 'Syntax Completed with Warnings/Errors'}
            </strong>
          </span>
        </div>

        <div className="tree-actions">
          <button className="btn btn-outline btn-sm" onClick={() => handleToggleAll(true)}>
            Expand All
          </button>
          <button className="btn btn-outline btn-sm" onClick={() => handleToggleAll(false)}>
            Collapse All
          </button>
        </div>
      </div>

      <div className="tree-scroll-viewport" key={expandAllKey}>
        <TreeNode node={parseTree} defaultExpanded={defaultExpand} />
      </div>
    </div>
  );
}

