import { memo, useCallback, ReactNode } from 'react';
import type { TreeNodeState, SelectableTreeProps } from './types';
import './SelectableTree.css';

interface SelectableTreeNodeProps<T> {
  item: T;
  level: number;
  checkedState: Map<string, TreeNodeState>;
  onToggle: (itemId: string) => void;
  expandedNodes: Set<string>;
  onToggleExpand: (itemId: string) => void;
  getId: (item: T) => string;
  getTitle: (item: T) => string;
  getChildren: (item: T) => T[];
  renderTitle?: (item: T, defaultTitle: string) => ReactNode;
  onLoadNode?: (parentId?: string) => Promise<any> | void;
  loadingNodes?: Set<string>;
}

const SelectableTreeNode = memo(function SelectableTreeNode<T>({
  item,
  level,
  checkedState,
  onToggle,
  expandedNodes,
  onToggleExpand,
  getId,
  getTitle,
  getChildren,
  renderTitle,
  onLoadNode,
  loadingNodes,
}: SelectableTreeNodeProps<T>) {
  const itemId = getId(item);
  const itemTitle = getTitle(item);
  const itemChildren = getChildren(item);
  const hasChildren = itemChildren.length > 0;
  const isLoading = loadingNodes?.has(itemId) ?? false;
  // Show expand button only if:
  // 1. Has children, OR
  // 2. Currently loading, OR  
  // 3. Not yet expanded (might have children after loading)
  const isExpanded = expandedNodes.has(itemId);
  const shouldShowExpandButton = hasChildren || isLoading || (!isExpanded && !!onLoadNode);
  const state = checkedState.get(itemId) || { checked: false, indeterminate: false };
  
  const handleToggle = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    e.stopPropagation();
    onToggle(itemId);
  }, [onToggle, itemId]);
  
  const handleExpand = useCallback(() => {
    onToggleExpand(itemId);
  }, [onToggleExpand, itemId]);

  const titleContent = renderTitle ? renderTitle(item, itemTitle) : itemTitle;

  const checkboxRef = useCallback((node: HTMLInputElement | null) => {
    if (node) {
      node.indeterminate = state.indeterminate;
    }
  }, [state.indeterminate]);

  return (
    <div 
      className="category-tree-item" 
      role="treeitem" 
      aria-level={level + 1} 
      aria-expanded={hasChildren ? isExpanded : undefined}
    >
      <div 
        className="category-tree-item-content"
        style={{ paddingLeft: `${level * 24}px` }}
      >
        {shouldShowExpandButton ? (
          isLoading ? (
            <div className="category-tree-loader" aria-label="Loading">
              <svg 
                className="category-tree-spinner" 
                viewBox="0 0 24 24"
              >
                <circle 
                  cx="12" 
                  cy="12" 
                  r="10" 
                  fill="none" 
                  stroke="currentColor" 
                  strokeWidth="2" 
                  opacity="0.2"
                />
                <circle 
                  cx="12" 
                  cy="12" 
                  r="10" 
                  fill="none" 
                  stroke="currentColor" 
                  strokeWidth="2" 
                  strokeDasharray="15.7 47.1"
                  style={{ animation: 'spin 1s linear infinite' }}
                />
              </svg>
            </div>
          ) : (
            <button
              className="category-tree-expand-btn"
              onClick={handleExpand}
              aria-label={isExpanded ? 'Collapse' : 'Expand'}
              type="button"
              disabled={isLoading}
            >
              <svg 
                className="category-tree-icon" 
                viewBox="0 0 24 24"
                style={{ transform: isExpanded ? 'rotate(0deg)' : 'rotate(-90deg)' }}
              >
                <path d="M7.41 8.59L12 13.17l4.59-4.58L18 10l-6 6-6-6 1.41-1.41z" />
              </svg>
            </button>
          )
        ) : (
          <span className="category-tree-spacer" aria-hidden="true" />
        )}
        
        <label className="category-tree-label">
          <input
            ref={checkboxRef}
            type="checkbox"
            className="category-tree-checkbox"
            checked={state.checked}
            onChange={handleToggle}
            aria-label={`Select ${itemTitle}`}
          />
          <span className="category-tree-title">{titleContent}</span>
        </label>
      </div>

      {shouldShowExpandButton && isExpanded && (
        <div className="category-tree-children" role="group">
          {itemChildren.map((child) => (
            <SelectableTreeNode
              key={getId(child)}
              item={child}
              level={level + 1}
              checkedState={checkedState}
              onToggle={onToggle}
              expandedNodes={expandedNodes}
              onToggleExpand={onToggleExpand}
              getId={getId}
              getTitle={getTitle}
              getChildren={getChildren}
              renderTitle={renderTitle}
              onLoadNode={onLoadNode}
              loadingNodes={loadingNodes}
            />
          ))}
        </div>
      )}
    </div>
  );
}) as <T>(props: SelectableTreeNodeProps<T>) => JSX.Element;

export function SelectableTree<T>({
  items,
  checkedState,
  onToggle,
  expandedNodes,
  onToggleExpand,
  getId = (item: any) => item.id,
  getTitle = (item: any) => item.title,
  getChildren = (item: any) => item.children || [],
  renderTitle,
  onLoadNode,
  loadingNodes,
}: SelectableTreeProps<T>) {
  
  return (
    <div className="category-tree" role="tree" aria-label="Category tree">
      {items.map((item) => (
        <SelectableTreeNode
          key={getId(item)}
          item={item}
          level={0}
          checkedState={checkedState}
          onToggle={onToggle}
          expandedNodes={expandedNodes}
          onToggleExpand={onToggleExpand}
          getId={getId}
          getTitle={getTitle}
          getChildren={getChildren}
          renderTitle={renderTitle}
          onLoadNode={onLoadNode}
          loadingNodes={loadingNodes}
        />
      ))}
    </div>
  );
}
