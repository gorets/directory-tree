import {
  ROOT_PARENT_ID,
  CONFIG_DEBOUNCE_MS,
  getParentId,
  isRootItem,
  getChildrenFromFlat,
  findItemInFlat,
  getAllDescendantIds,
  toggleItemsRecursively,
  getRootItems,
} from '../helpers';

interface TestItem {
  id: string;
  parentId?: string | null;
  name: string;
}

describe('helpers', () => {
  describe('constants', () => {
    it('should have ROOT_PARENT_ID defined', () => {
      expect(ROOT_PARENT_ID).toBe('root');
    });

    it('should have CONFIG_DEBOUNCE_MS defined', () => {
      expect(CONFIG_DEBOUNCE_MS).toBe(100);
    });
  });

  describe('getParentId', () => {
    it('should return parentId when present', () => {
      const item = { id: '1', parentId: 'parent', name: 'Item' };
      expect(getParentId(item)).toBe('parent');
    });

    it('should return null when parentId is missing', () => {
      const item = { id: '1', name: 'Item' };
      expect(getParentId(item)).toBeNull();
    });

    it('should return null when parentId is null', () => {
      const item = { id: '1', parentId: null, name: 'Item' };
      expect(getParentId(item)).toBeNull();
    });

    it('should return null when parentId is empty string', () => {
      const item = { id: '1', parentId: '', name: 'Item' };
      expect(getParentId(item)).toBeNull();
    });
  });

  describe('isRootItem', () => {
    it('should return true for item with parentId "root"', () => {
      const item = { id: '1', parentId: 'root', name: 'Root Item' };
      expect(isRootItem(item)).toBe(true);
    });

    it('should return true for item with null parentId', () => {
      const item = { id: '1', parentId: null, name: 'Root Item' };
      expect(isRootItem(item)).toBe(true);
    });

    it('should return true for item without parentId', () => {
      const item = { id: '1', name: 'Root Item' };
      expect(isRootItem(item)).toBe(true);
    });

    it('should return false for item with non-root parentId', () => {
      const item = { id: '1', parentId: 'parent', name: 'Child Item' };
      expect(isRootItem(item)).toBe(false);
    });
  });

  describe('getChildrenFromFlat', () => {
    const items: TestItem[] = [
      { id: '1', parentId: 'root', name: 'Parent 1' },
      { id: '2', parentId: 'root', name: 'Parent 2' },
      { id: '1-1', parentId: '1', name: 'Child 1-1' },
      { id: '1-2', parentId: '1', name: 'Child 1-2' },
      { id: '2-1', parentId: '2', name: 'Child 2-1' },
    ];

    const getId = (item: TestItem) => item.id;

    it('should return children of specified parent', () => {
      const children = getChildrenFromFlat(items, '1', getId);
      expect(children).toHaveLength(2);
      expect(children.map(c => c.id)).toEqual(['1-1', '1-2']);
    });

    it('should return empty array for item without children', () => {
      const children = getChildrenFromFlat(items, '1-1', getId);
      expect(children).toHaveLength(0);
    });

    it('should return root items when parent is "root"', () => {
      const children = getChildrenFromFlat(items, 'root', getId);
      expect(children).toHaveLength(2);
      expect(children.map(c => c.id)).toEqual(['1', '2']);
    });
  });

  describe('findItemInFlat', () => {
    const items: TestItem[] = [
      { id: '1', parentId: 'root', name: 'Parent 1' },
      { id: '1-1', parentId: '1', name: 'Child 1-1' },
      { id: '1-1-1', parentId: '1-1', name: 'Grandchild 1-1-1' },
      { id: '2', parentId: 'root', name: 'Parent 2' },
    ];

    const getId = (item: TestItem) => item.id;

    it('should find item by direct lookup', () => {
      const item = findItemInFlat(items, '1', getId);
      expect(item).toBeDefined();
      expect(item!.id).toBe('1');
      expect(item!.name).toBe('Parent 1');
    });

    it('should find nested item', () => {
      const item = findItemInFlat(items, '1-1-1', getId);
      expect(item).toBeDefined();
      expect(item!.id).toBe('1-1-1');
      expect(item!.name).toBe('Grandchild 1-1-1');
    });

    it('should return null for non-existent item', () => {
      const item = findItemInFlat(items, 'non-existent', getId);
      expect(item).toBeNull();
    });

    it('should handle empty array', () => {
      const item = findItemInFlat([], '1', getId);
      expect(item).toBeNull();
    });
  });

  describe('getAllDescendantIds', () => {
    const items: TestItem[] = [
      { id: '1', parentId: 'root', name: 'Parent 1' },
      { id: '1-1', parentId: '1', name: 'Child 1-1' },
      { id: '1-1-1', parentId: '1-1', name: 'Grandchild 1-1-1' },
      { id: '1-2', parentId: '1', name: 'Child 1-2' },
      { id: '2', parentId: 'root', name: 'Parent 2' },
    ];

    const getId = (item: TestItem) => item.id;

    it('should return all descendant IDs', () => {
      const parentItem = items[0]; // '1'
      const descendants = getAllDescendantIds(items, parentItem, getId);
      expect(descendants).toHaveLength(3);
      expect(descendants).toContain('1-1');
      expect(descendants).toContain('1-1-1');
      expect(descendants).toContain('1-2');
    });

    it('should return empty array for leaf item', () => {
      const leafItem = items[2]; // '1-1-1'
      const descendants = getAllDescendantIds(items, leafItem, getId);
      expect(descendants).toHaveLength(0);
    });

    it('should return immediate children only', () => {
      const parentItem = items[1]; // '1-1'
      const descendants = getAllDescendantIds(items, parentItem, getId);
      expect(descendants).toHaveLength(1);
      expect(descendants).toContain('1-1-1');
    });
  });

  describe('toggleItemsRecursively', () => {
    const items: TestItem[] = [
      { id: '1', parentId: 'root', name: 'Parent 1' },
      { id: '1-1', parentId: '1', name: 'Child 1-1' },
      { id: '1-1-1', parentId: '1-1', name: 'Grandchild 1-1-1' },
      { id: '1-2', parentId: '1', name: 'Child 1-2' },
    ];

    const getId = (item: TestItem) => item.id;

    it('should check item and all descendants', () => {
      const checkedSet = new Set<string>();
      const parentItem = items[0]; // '1'

      toggleItemsRecursively(items, parentItem, true, getId, checkedSet);

      expect(checkedSet.size).toBe(4);
      expect(checkedSet.has('1')).toBe(true);
      expect(checkedSet.has('1-1')).toBe(true);
      expect(checkedSet.has('1-1-1')).toBe(true);
      expect(checkedSet.has('1-2')).toBe(true);
    });

    it('should uncheck item and all descendants', () => {
      const checkedSet = new Set<string>(['1', '1-1', '1-1-1', '1-2']);
      const parentItem = items[0]; // '1'

      toggleItemsRecursively(items, parentItem, false, getId, checkedSet);

      expect(checkedSet.size).toBe(0);
    });

    it('should check only leaf item if it has no children', () => {
      const checkedSet = new Set<string>();
      const leafItem = items[2]; // '1-1-1'

      toggleItemsRecursively(items, leafItem, true, getId, checkedSet);

      expect(checkedSet.size).toBe(1);
      expect(checkedSet.has('1-1-1')).toBe(true);
    });

    it('should work with partially checked tree', () => {
      const checkedSet = new Set<string>(['1-2']);
      const parentItem = items[0]; // '1'

      toggleItemsRecursively(items, parentItem, true, getId, checkedSet);

      expect(checkedSet.size).toBe(4);
      expect(checkedSet.has('1')).toBe(true);
      expect(checkedSet.has('1-1')).toBe(true);
      expect(checkedSet.has('1-1-1')).toBe(true);
      expect(checkedSet.has('1-2')).toBe(true);
    });
  });

  describe('getRootItems', () => {
    const items: TestItem[] = [
      { id: '1', parentId: 'root', name: 'Root 1' },
      { id: '2', parentId: 'root', name: 'Root 2' },
      { id: '1-1', parentId: '1', name: 'Child 1-1' },
      { id: '3', parentId: null, name: 'Root 3' },
      { id: '4', name: 'Root 4' }, // no parentId
    ];

    it('should return only root items', () => {
      const roots = getRootItems(items);
      expect(roots).toHaveLength(4);
      expect(roots.map(r => r.id)).toEqual(['1', '2', '3', '4']);
    });

    it('should return empty array when no root items', () => {
      const childItems: TestItem[] = [
        { id: '1-1', parentId: '1', name: 'Child 1-1' },
        { id: '1-2', parentId: '1', name: 'Child 1-2' },
      ];

      const roots = getRootItems(childItems);
      expect(roots).toHaveLength(0);
    });

    it('should handle empty array', () => {
      const roots = getRootItems([]);
      expect(roots).toHaveLength(0);
    });
  });
});
