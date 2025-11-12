import {
  isTreeNode,
  createSafeGetter,
  isItemEnabled,
  findItemPath,
  findItem,
  getAllDescendantIds,
  getAllEnabledItemIds,
} from '../utils';
import type { TreeNode, TreeSyncConfig } from '../types';

describe('utils', () => {
  describe('isTreeNode', () => {
    it('should return true for valid TreeNode', () => {
      const node: TreeNode = { id: '1', title: 'Node 1' };
      expect(isTreeNode(node)).toBe(true);
    });

    it('should return false for invalid objects', () => {
      expect(isTreeNode(null)).toBe(false);
      expect(isTreeNode(undefined)).toBe(false);
      expect(isTreeNode({})).toBe(false);
      expect(isTreeNode({ id: '1' })).toBe(false);
      expect(isTreeNode({ title: 'Test' })).toBe(false);
      expect(isTreeNode({ id: 123, title: 'Test' })).toBe(false);
    });
  });

  describe('createSafeGetter', () => {
    it('should return property value when exists', () => {
      const getter = createSafeGetter<any, 'name'>('name', 'default');
      const obj = { name: 'John' };
      expect(getter(obj)).toBe('John');
    });

    it('should return fallback when property does not exist', () => {
      const getter = createSafeGetter<any, 'name'>('name', 'default');
      const obj = {};
      expect(getter(obj)).toBe('default');
    });

    it('should return fallback when property is null', () => {
      const getter = createSafeGetter<any, 'name'>('name', 'default');
      const obj = { name: null };
      expect(getter(obj)).toBe('default');
    });

    it('should return fallback when property is undefined', () => {
      const getter = createSafeGetter<any, 'name'>('name', 'default');
      const obj = { name: undefined };
      expect(getter(obj)).toBe('default');
    });

    it('should handle errors gracefully', () => {
      const getter = createSafeGetter<any, 'name'>('name', 'default');
      expect(getter(null)).toBe('default');
      expect(getter(undefined)).toBe('default');
    });
  });

  describe('findItemPath', () => {
    const items: TreeNode[] = [
      {
        id: '1',
        title: 'Parent 1',
        children: [
          {
            id: '1-1',
            title: 'Child 1-1',
            children: [
              { id: '1-1-1', title: 'Grandchild 1-1-1' }
            ]
          },
          { id: '1-2', title: 'Child 1-2' }
        ]
      },
      { id: '2', title: 'Parent 2' }
    ];

    it('should find path to root item', () => {
      const path = findItemPath('1', items);
      expect(path).toHaveLength(1);
      expect(path![0].id).toBe('1');
    });

    it('should find path to nested item', () => {
      const path = findItemPath('1-1-1', items);
      expect(path).toHaveLength(3);
      expect(path![0].id).toBe('1');
      expect(path![1].id).toBe('1-1');
      expect(path![2].id).toBe('1-1-1');
    });

    it('should return null for non-existent item', () => {
      const path = findItemPath('non-existent', items);
      expect(path).toBeNull();
    });
  });

  describe('findItem', () => {
    const items: TreeNode[] = [
      {
        id: '1',
        title: 'Parent 1',
        children: [
          { id: '1-1', title: 'Child 1-1' },
          { id: '1-2', title: 'Child 1-2' }
        ]
      },
      { id: '2', title: 'Parent 2' }
    ];

    it('should find root item', () => {
      const item = findItem('1', items);
      expect(item).toBeDefined();
      expect(item!.id).toBe('1');
      expect(item!.title).toBe('Parent 1');
    });

    it('should find nested item', () => {
      const item = findItem('1-2', items);
      expect(item).toBeDefined();
      expect(item!.id).toBe('1-2');
      expect(item!.title).toBe('Child 1-2');
    });

    it('should return null for non-existent item', () => {
      const item = findItem('non-existent', items);
      expect(item).toBeNull();
    });
  });

  describe('getAllDescendantIds', () => {
    const items: TreeNode[] = [
      {
        id: '1',
        title: 'Parent 1',
        children: [
          {
            id: '1-1',
            title: 'Child 1-1',
            children: [
              { id: '1-1-1', title: 'Grandchild 1-1-1' }
            ]
          },
          { id: '1-2', title: 'Child 1-2' }
        ]
      }
    ];

    it('should return all descendant IDs including self', () => {
      const descendants = getAllDescendantIds(items[0]);
      expect(descendants.size).toBe(4); // 1, 1-1, 1-1-1, 1-2
      expect(descendants.has('1')).toBe(true);
      expect(descendants.has('1-1')).toBe(true);
      expect(descendants.has('1-1-1')).toBe(true);
      expect(descendants.has('1-2')).toBe(true);
    });

    it('should return only self ID for leaf node', () => {
      const leafNode: TreeNode = { id: 'leaf', title: 'Leaf' };
      const descendants = getAllDescendantIds(leafNode);
      expect(descendants.size).toBe(1);
      expect(descendants.has('leaf')).toBe(true);
    });
  });

  describe('isItemEnabled', () => {
    const items: TreeNode[] = [
      {
        id: '1',
        title: 'Parent 1',
        children: [
          { id: '1-1', title: 'Child 1-1' },
          { id: '1-2', title: 'Child 1-2' }
        ]
      },
      { id: '2', title: 'Parent 2' }
    ];

    it('should return false when item not in config', () => {
      const config: TreeSyncConfig = { enabled: [], disabled: [] };
      expect(isItemEnabled('1', config, items)).toBe(false);
    });

    it('should return true when item is enabled', () => {
      const config: TreeSyncConfig = { enabled: ['1'], disabled: [] };
      expect(isItemEnabled('1', config, items)).toBe(true);
    });

    it('should return false when item is disabled', () => {
      const config: TreeSyncConfig = { enabled: [], disabled: ['1'] };
      expect(isItemEnabled('1', config, items)).toBe(false);
    });

    it('should inherit parent enabled state', () => {
      const config: TreeSyncConfig = { enabled: ['1'], disabled: [] };
      expect(isItemEnabled('1-1', config, items)).toBe(true);
    });

    it('should override parent state with explicit disabled', () => {
      const config: TreeSyncConfig = { enabled: ['1'], disabled: ['1-1'] };
      expect(isItemEnabled('1-1', config, items)).toBe(false);
    });

    it('should override parent state with explicit enabled', () => {
      const config: TreeSyncConfig = { enabled: ['1-1'], disabled: ['1'] };
      expect(isItemEnabled('1-1', config, items)).toBe(true);
    });

    it('should return false for non-existent item', () => {
      const config: TreeSyncConfig = { enabled: ['1'], disabled: [] };
      expect(isItemEnabled('non-existent', config, items)).toBe(false);
    });
  });

  describe('getAllEnabledItemIds', () => {
    const items: TreeNode[] = [
      {
        id: '1',
        title: 'Parent 1',
        children: [
          {
            id: '1-1',
            title: 'Child 1-1',
            children: [
              { id: '1-1-1', title: 'Grandchild 1-1-1' }
            ]
          },
          { id: '1-2', title: 'Child 1-2' }
        ]
      },
      {
        id: '2',
        title: 'Parent 2',
        children: [
          { id: '2-1', title: 'Child 2-1' }
        ]
      }
    ];

    it('should return empty set when no items enabled', () => {
      const config: TreeSyncConfig = { enabled: [], disabled: [] };
      const enabledIds = getAllEnabledItemIds(config, items);
      expect(enabledIds.size).toBe(0);
    });

    it('should return enabled item and all descendants', () => {
      const config: TreeSyncConfig = { enabled: ['1'], disabled: [] };
      const enabledIds = getAllEnabledItemIds(config, items);
      expect(enabledIds.size).toBe(4); // 1, 1-1, 1-1-1, 1-2
      expect(enabledIds.has('1')).toBe(true);
      expect(enabledIds.has('1-1')).toBe(true);
      expect(enabledIds.has('1-1-1')).toBe(true);
      expect(enabledIds.has('1-2')).toBe(true);
    });

    it('should exclude disabled children', () => {
      const config: TreeSyncConfig = { enabled: ['1'], disabled: ['1-1'] };
      const enabledIds = getAllEnabledItemIds(config, items);
      expect(enabledIds.size).toBe(2); // 1, 1-2
      expect(enabledIds.has('1')).toBe(true);
      expect(enabledIds.has('1-1')).toBe(false);
      expect(enabledIds.has('1-1-1')).toBe(false);
      expect(enabledIds.has('1-2')).toBe(true);
    });

    it('should include re-enabled grandchildren', () => {
      const config: TreeSyncConfig = {
        enabled: ['1', '1-1-1'],
        disabled: ['1-1']
      };
      const enabledIds = getAllEnabledItemIds(config, items);
      expect(enabledIds.has('1')).toBe(true);
      expect(enabledIds.has('1-1')).toBe(false);
      expect(enabledIds.has('1-1-1')).toBe(true); // Re-enabled
      expect(enabledIds.has('1-2')).toBe(true);
    });

    it('should handle multiple root enabled items', () => {
      const config: TreeSyncConfig = { enabled: ['1', '2'], disabled: [] };
      const enabledIds = getAllEnabledItemIds(config, items);
      expect(enabledIds.size).toBe(6); // All items
      expect(enabledIds.has('1')).toBe(true);
      expect(enabledIds.has('2')).toBe(true);
      expect(enabledIds.has('2-1')).toBe(true);
    });
  });
});
