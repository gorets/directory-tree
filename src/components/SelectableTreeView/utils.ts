import type { TreeSyncConfig, TreeNode } from './types.js';

/**
 * Type guard to check if object is a valid TreeNode
 */
export function isTreeNode(obj: unknown): obj is TreeNode {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    'id' in obj &&
    typeof (obj as any).id === 'string' &&
    'title' in obj &&
    typeof (obj as any).title === 'string'
  );
}

/**
 * Creates a safe getter function with validation and fallback
 * @param key - Property key to access
 * @param fallback - Fallback value if property doesn't exist
 */
export function createSafeGetter<T, K extends keyof any>(
  key: K,
  fallback: any
): (item: T) => any {
  return (item: T): any => {
    try {
      if (item && typeof item === 'object' && key in item) {
        const value = (item as any)[key];
        if (value !== undefined && value !== null) {
          return value;
        }
      }
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.warn(`[SelectableTree] Error accessing property "${String(key)}"`, error);
      }
    }
    return fallback;
  };
}

/**
 * Determines if an item is enabled based on config and inheritance rules
 */
export function isItemEnabled<T>(
  itemId: string,
  config: TreeSyncConfig,
  items: T[],
  getId: (item: T) => string = (item: any) => item.id,
  getChildren: (item: T) => T[] = (item: any) => item.children || []
): boolean {
  const path = findItemPath(itemId, items, getId, getChildren);
  if (!path) return false;
  
  // Convert to Set for fast lookup O(1)
  const enabledSet = new Set(config.enabled);
  const disabledSet = new Set(config.disabled);
  
  let currentState = false;
  for (const item of path) {
    const id = getId(item);
    if (enabledSet.has(id)) {
      currentState = true;
    } else if (disabledSet.has(id)) {
      currentState = false;
    }
  }
  
  return currentState;
}

/**
 * Finds the path from root to target item
 */
export function findItemPath<T>(
  targetId: string,
  items: T[],
  getId: (item: T) => string = (item: any) => item.id,
  getChildren: (item: T) => T[] = (item: any) => item.children || []
): T[] | null {
  for (const item of items) {
    const id = getId(item);
    if (id === targetId) return [item];
    
    const children = getChildren(item);
    const childPath = findItemPath(targetId, children, getId, getChildren);
    if (childPath) return [item, ...childPath];
  }
  
  return null;
}

/**
 * Finds a specific item by ID in the tree
 */
export function findItem<T>(
  itemId: string,
  items: T[],
  getId: (item: T) => string = (item: any) => item.id,
  getChildren: (item: T) => T[] = (item: any) => item.children || []
): T | null {
  for (const item of items) {
    const id = getId(item);
    if (id === itemId) return item;
    
    const children = getChildren(item);
    const found = findItem(itemId, children, getId, getChildren);
    if (found) return found;
  }
  
  return null;
}

/**
 * Gets all descendant IDs for a given item
 */
export function getAllDescendantIds<T>(
  item: T,
  getId: (item: T) => string = (item: any) => item.id,
  getChildren: (item: T) => T[] = (item: any) => item.children || []
): Set<string> {
  const ids = new Set<string>([getId(item)]);
  
  const collectIds = (currentItem: T) => {
    ids.add(getId(currentItem));
    getChildren(currentItem).forEach(collectIds);
  };
  
  getChildren(item).forEach(collectIds);
  return ids;
}

/**
 * Gets all enabled item IDs based on config with inheritance
 */
export function getAllEnabledItemIds<T>(
  config: TreeSyncConfig,
  items: T[],
  getId: (item: T) => string = (item: any) => item.id,
  getChildren: (item: T) => T[] = (item: any) => item.children || []
): Set<string> {
  const enabledIds = new Set<string>();
  
  // Convert to Set for fast lookup O(1)
  const enabledSet = new Set(config.enabled);
  const disabledSet = new Set(config.disabled);
  
  const traverse = (itemList: T[], parentEnabled: boolean) => {
    for (const item of itemList) {
      const itemId = getId(item);
      const isExplicitlyEnabled = enabledSet.has(itemId);
      const isExplicitlyDisabled = disabledSet.has(itemId);
      
      let currentEnabled = parentEnabled;
      if (isExplicitlyEnabled) {
        currentEnabled = true;
      } else if (isExplicitlyDisabled) {
        currentEnabled = false;
      }
      
      if (currentEnabled) {
        enabledIds.add(itemId);
      }
      
      traverse(getChildren(item), currentEnabled);
    }
  };
  
  traverse(items, false);
  return enabledIds;
}

