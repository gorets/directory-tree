/**
 * Helper utilities for SelectableTreeWithConfig component
 */

import type { TreeSyncConfig } from './types';

// Constants
export const ROOT_PARENT_ID = null;
export const CONFIG_DEBOUNCE_MS = 100;

/**
 * Type guard to check if an item has a parentId property
 */
export interface ItemWithParentId {
  parentId?: string | null;
  [key: string]: any;
}

/**
 * Get the parentId from an item
 */
export function getParentId(item: any): string | null {
  return (item as ItemWithParentId).parentId || null;
}

/**
 * Check if an item is a root item (has no parent)
 */
export function isRootItem(item: any): boolean {
  const parentId = getParentId(item);
  return parentId === null;
}

/**
 * Get children of an item from a flat array
 */
export function getChildrenFromFlat<T>(
  items: T[],
  parentId: string | null
): T[] {
  return items.filter(item => {
    const itemParentId = getParentId(item);
    return itemParentId === parentId;
  });
}

/**
 * Find an item by id in a flat array with recursive search through children
 */
export function findItemInFlat<T>(
  items: T[],
  targetId: string,
  getId: (item: T) => string
): T | null {
  // First try direct lookup
  const directMatch = items.find(item => getId(item) === targetId);
  if (directMatch) return directMatch;

  // If not found, do recursive search
  const search = (itemList: T[]): T | null => {
    for (const item of itemList) {
      const itemId = getId(item);
      if (itemId === targetId) return item;

      const children = getChildrenFromFlat(items, itemId);
      const found = search(children);
      if (found) return found;
    }
    return null;
  };

  return search(items);
}

/**
 * Get all descendant IDs of an item
 */
export function getAllDescendantIds<T>(
  items: T[],
  item: T,
  getId: (item: T) => string
): string[] {
  const result: string[] = [];

  const collect = (currentItem: T) => {
    const itemId = getId(currentItem);
    const children = getChildrenFromFlat(items, itemId);

    children.forEach(child => {
      result.push(getId(child));
      collect(child);
    });
  };

  collect(item);
  return result;
}

/**
 * Toggle all items recursively
 */
export function toggleItemsRecursively<T>(
  items: T[],
  item: T,
  check: boolean,
  getId: (item: T) => string,
  checkedSet: Set<string>
): void {
  const itemId = getId(item);

  if (check) {
    checkedSet.add(itemId);
  } else {
    checkedSet.delete(itemId);
  }

  const children = getChildrenFromFlat(items, itemId);
  children.forEach(child => {
    toggleItemsRecursively(items, child, check, getId, checkedSet);
  });
}

/**
 * Filter items by root level
 */
export function getRootItems<T>(items: T[]): T[] {
  return items.filter(isRootItem);
}

/**
 * Get all ancestor IDs of an item (parent, grandparent, etc.)
 */
export function getAncestorIds<T>(
  items: T[],
  itemId: string,
  getId: (item: T) => string
): string[] {
  const ancestors: string[] = [];
  const item = findItemInFlat(items, itemId, getId);
  if (!item) return ancestors;

  let currentItem = item;
  while (currentItem) {
    const parentId = getParentId(currentItem);
    if (parentId === null) break;

    ancestors.push(parentId);
    const parent = findItemInFlat(items, parentId, getId);
    if (!parent) break;
    currentItem = parent;
  }

  return ancestors;
}

/**
 * Optimize config by removing redundant entries.
 * An entry is redundant if its state can be inferred from ancestor states.
 *
 * IMPORTANT: Only optimizes entries that exist in the items array.
 * Items not yet loaded are kept in the config to preserve their state.
 *
 * Rules:
 * - Remove from enabled: if any ancestor is enabled (child inherits enabled state)
 * - Remove from disabled: if any ancestor is disabled OR if no ancestor is enabled (disabled by default)
 *
 * Example: If parent is enabled, child in enabled array is redundant.
 * Example: If parent is disabled, child in disabled array is redundant.
 * Example: If no ancestor is enabled, child in disabled array is redundant (disabled by default).
 *
 * @param items - Flat array of tree items (may be partial if tree is not fully loaded)
 * @param config - Current config with enabled/disabled arrays
 * @param getId - Function to get item ID
 * @returns Optimized config without redundant entries
 */
export function getOptimizedConfig<T>(
  items: T[],
  config: TreeSyncConfig,
  getId: (item: T) => string = (item: any) => item.id
): TreeSyncConfig {
  const enabledSet = new Set(config.enabled);
  const disabledSet = new Set(config.disabled);

  const optimizedEnabled: string[] = [];
  const optimizedDisabled: string[] = [];

  // Check enabled items - keep only if no ancestor is enabled OR item not found
  for (const itemId of config.enabled) {
    const item = findItemInFlat(items, itemId, getId);

    // If item not found in tree, keep it (tree may not be fully loaded)
    if (!item) {
      optimizedEnabled.push(itemId);
      continue;
    }

    const ancestors = getAncestorIds(items, itemId, getId);
    const hasEnabledAncestor = ancestors.some(ancestorId => enabledSet.has(ancestorId));

    if (!hasEnabledAncestor) {
      optimizedEnabled.push(itemId);
    }
  }

  // Check disabled items - keep only if:
  // 1. Item not found (tree may not be fully loaded), OR
  // 2. No ancestor is disabled AND has enabled ancestor (explicit disable within enabled subtree)
  for (const itemId of config.disabled) {
    const item = findItemInFlat(items, itemId, getId);

    // If item not found in tree, keep it (tree may not be fully loaded)
    if (!item) {
      optimizedDisabled.push(itemId);
      continue;
    }

    const ancestors = getAncestorIds(items, itemId, getId);
    const hasDisabledAncestor = ancestors.some(ancestorId => disabledSet.has(ancestorId));
    const hasEnabledAncestor = ancestors.some(ancestorId => enabledSet.has(ancestorId));

    // Keep only if no disabled ancestor AND has enabled ancestor
    // (meaning this is an explicit disable within an enabled subtree)
    if (!hasDisabledAncestor && hasEnabledAncestor) {
      optimizedDisabled.push(itemId);
    }
  }

  return {
    enabled: optimizedEnabled,
    disabled: optimizedDisabled,
  };
}
