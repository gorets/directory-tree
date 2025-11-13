import { ReactNode } from 'react';

/**
 * State of a tree node (checked/indeterminate)
 */
export interface TreeNodeState {
  checked: boolean;
  indeterminate: boolean;
}

/**
 * Base interface for tree data structure
 */
export interface TreeNode {
  id: string;
  title: string;
  children?: TreeNode[];
}

/**
 * Configuration for tree sync (enabled/disabled items)
 */
export interface TreeSyncConfig {
  enabled: string[];
  disabled: string[];
}

/**
 * Props for SelectableTree component
 */
export interface SelectableTreeProps<T> {
  items: T[];
  checkedState: Map<string, TreeNodeState>;
  onToggle: (itemId: string) => void;
  expandedNodes: Set<string>;
  onToggleExpand: (itemId: string) => void;
  getId?: (item: T) => string;
  getTitle?: (item: T) => string;
  getChildren?: (item: T) => T[];
  renderTitle?: (item: T, defaultTitle: string) => ReactNode;
  /**
   * Optional callback to load children for a node.
   * If provided, expand button will always be shown.
   * parentId is null for root nodes, string for specific nodes
   */
  onLoadNode?: (parentId?: string | null) => Promise<any> | void;
  /**
   * Set of node IDs currently loading
   */
  loadingNodes?: Set<string>;
}

/**
 * Props for SelectableTreeWithConfig component
 */
export interface SelectableTreeWithConfigProps<T> {
  items: T[];
  config: TreeSyncConfig;
  /**
   * Optional callback to load children for a given parent id.
   * If not supplied the component expects `items` to already contain full tree.
   * parentId is null for root nodes, string for specific nodes
   */
  onLoadNode?: (parentId?: string | null) => Promise<any> | void;
  /**
   * Alias commonly used in callers: onNodeLoad
   * parentId is null for root nodes, string for specific nodes
   */
  onNodeLoad?: (parentId?: string | null) => Promise<any> | void;
  onConfigChange?: (config: TreeSyncConfig) => void;
  getId?: (item: T) => string;
  getTitle?: (item: T) => string;
  getChildren?: (item: T) => T[];
  renderTitle?: (item: T, defaultTitle: string) => ReactNode;
  expandedNodes?: Set<string>;
  onExpandedNodesChange?: (expandedNodes: Set<string>) => void;
}

/**
 * Confluence-specific types
 */
// export interface ConfluencePage {
//   id: string;
//   title: string;
//   parentId?: string;
//   version: {
//     createdAt?: string;
//   };
// }

// export interface ConfluencePageWithChildren extends ConfluencePage {
//   children: ConfluencePageWithChildren[];
// }

export interface SimpleTreeNode {
  id: string;
  parentId: string;
  title: string;
  updatedAt: string;
  children?: SimpleTreeNode[];
}

export interface SimpleTreeNodeWithChildren extends SimpleTreeNode {
  children: SimpleTreeNodeWithChildren[];
}

