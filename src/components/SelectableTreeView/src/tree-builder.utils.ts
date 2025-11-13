/**
 * Tree building utilities with generic support
 */

import type {
  // ConfluencePage,
  // ConfluencePageWithChildren,
  SimpleTreeNode,
  SimpleTreeNodeWithChildren
} from './types';

/**
 * Generic interface for items that can be organized into a tree
 */
export interface TreeItem {
  id: string;
  parentId?: string;
}

/**
 * Generic interface for items with children
 */
export interface TreeItemWithChildren<T> extends TreeItem {
  children: T[];
}

/**
 * Build hierarchical tree structure from flat array of items with any structure
 * As long as items have id and parentId, this will work
 */
export function buildGenericTree<T extends { id: string; parentId?: string | null }>(
  items: T[]
): (T & { children: (T & { children: any[] })[] })[] {
  const itemsMap = new Map<string, T & { children: any[] }>();

  // Create map with children array
  items.forEach((item) => {
    itemsMap.set(item.id, { ...item, children: [] } as any);
  });

  const rootItems: (T & { children: any[] })[] = [];

  items.forEach((item) => {
    const itemWithChildren = itemsMap.get(item.id)!;
    const isRootItem = !item.parentId;

    if (isRootItem) {
      rootItems.push(itemWithChildren);
    } else if (item.parentId) {
      const parent = itemsMap.get(item.parentId);
      if (parent) {
        parent.children.push(itemWithChildren);
      }
    }
  });

  return rootItems;
}

/**
 * Build hierarchical tree structure from flat array of items
 */
export function buildItemsTree(items: SimpleTreeNode[]): SimpleTreeNodeWithChildren[] {
  // Create a map for quick item lookup
  const itemsMap = new Map<string, SimpleTreeNodeWithChildren>();

  items.forEach(item => {
    itemsMap.set(item.id, { ...item, children: [] });
  });

  const rootItems: SimpleTreeNodeWithChildren[] = [];

  items.forEach(item => {
    const itemWithChildren = itemsMap.get(item.id)!;
    const isRootItem = !item.parentId;

    if (isRootItem) {
      rootItems.push(itemWithChildren);
    } else if (item.parentId) {
      const parent = itemsMap.get(item.parentId);
      if (parent) {
        parent.children.push(itemWithChildren);
      }
    }
  });

  return rootItems;
}

/**
 * Generic function to build hierarchical tree from flat array
 */
export function buildTree<T extends TreeItem, R extends TreeItemWithChildren<R>>(
  items: T[],
  transform: (item: T) => R
): R[] {
  const itemMap = new Map<string, R>();

  items.forEach(item => {
    const transformed = transform(item);
    itemMap.set(item.id, transformed);
  });

  const rootItems: R[] = [];

  items.forEach(item => {
    const transformedItem = itemMap.get(item.id)!;
    const isRoot = !item.parentId;

    if (isRoot) {
      rootItems.push(transformedItem);
    } else if (item.parentId) {
      const parent = itemMap.get(item.parentId);
      if (parent) {
        parent.children.push(transformedItem);
      }
    }
  });

  return rootItems;
}

/**
 * Convert full item tree to simplified tree structure
 */
export function getSimpleTree(itemsAsTree: SimpleTreeNodeWithChildren[]): SimpleTreeNode[] {
  const tree: SimpleTreeNode[] = [];

  for (const item of itemsAsTree) {
    const node: SimpleTreeNode = {
      id: item.id,
      parentId: item.parentId,
      title: item.title,
      updatedAt: item.updatedAt || '',
    };

    if (item.children && item.children.length > 0) {
      node.children = getSimpleTree(item.children);
    }

    tree.push(node);
  }

  return tree;
}

/**
 * Generic function to map tree structure
 */
export function mapTree<T extends { children?: T[] }, R extends { children?: R[] }>(
  items: T[],
  mapper: (item: T) => Omit<R, 'children'>
): R[] {
  return items.map(item => {
    const mapped = mapper(item) as R;

    if (item.children && item.children.length > 0) {
      mapped.children = mapTree(item.children, mapper);
    }

    return mapped;
  });
}

/**
 * Flatten tree structure into array
 */
export function flattenTree<T extends { id: string; children?: T[] }>(items: T[]): T[] {
  const result: T[] = [];

  function traverse(nodes: T[]) {
    for (const node of nodes) {
      result.push(node);
      if (node.children && node.children.length > 0) {
        traverse(node.children);
      }
    }
  }

  traverse(items);
  return result;
}

/**
 * Find item in tree by id
 */
export function findInTree<T extends { id: string; children?: T[] }>(
  items: T[],
  id: string
): T | undefined {
  for (const item of items) {
    if (item.id === id) {
      return item;
    }
    if (item.children && item.children.length > 0) {
      const found = findInTree(item.children, id);
      if (found) {
        return found;
      }
    }
  }
  return undefined;
}

/**
 * Get all descendants of a node
 */
export function getDescendants<T extends { id: string; children?: T[] }>(
  items: T[],
  id: string
): T[] {
  const node = findInTree(items, id);
  if (!node || !node.children) {
    return [];
  }
  return flattenTree(node.children);
}

/**
 * Get all ancestors of a node
 */
export function getAncestors<T extends TreeItem>(
  items: T[],
  id: string
): T[] {
  const itemMap = new Map<string, T>();
  items.forEach(item => itemMap.set(item.id, item));

  const ancestors: T[] = [];
  let current = itemMap.get(id);

  while (current && current.parentId) {
    const parent = itemMap.get(current.parentId);
    if (parent) {
      ancestors.push(parent);
      current = parent;
    } else {
      break;
    }
  }

  return ancestors;
}
