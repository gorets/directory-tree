/**
 * Helper utilities for SelectableTreeWithConfig component
 */

// Constants
export const ROOT_PARENT_ID = 'root';
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
 * Check if an item is a root item
 */
export function isRootItem(item: any): boolean {
  const parentId = getParentId(item);
  return parentId === ROOT_PARENT_ID || parentId === null;
}

/**
 * Get children of an item from a flat array
 */
export function getChildrenFromFlat<T>(
  items: T[],
  parentId: string,
  getId: (item: T) => string
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

      const children = getChildrenFromFlat(items, itemId, getId);
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
    const children = getChildrenFromFlat(items, itemId, getId);

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

  const children = getChildrenFromFlat(items, itemId, getId);
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
