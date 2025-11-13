import {
  buildGenericTree,
  buildItemsTree,
  buildTree,
  getSimpleTree,
  mapTree,
  flattenTree,
  findInTree,
  getDescendants,
  getAncestors,
  type TreeItem,
  type TreeItemWithChildren,
} from '../src/tree-builder.utils';
import type { SimpleTreeNode, SimpleTreeNodeWithChildren } from '../src/types';

describe('tree-builder.utils', () => {
  describe('buildGenericTree', () => {
    it('should build tree from flat array', () => {
      const items = [
        { id: '1', parentId: null, name: 'Parent 1' },
        { id: '2', parentId: null, name: 'Parent 2' },
        { id: '1-1', parentId: '1', name: 'Child 1-1' },
        { id: '1-2', parentId: '1', name: 'Child 1-2' },
      ];

      const tree = buildGenericTree(items);

      expect(tree).toHaveLength(2);
      expect(tree[0].id).toBe('1');
      expect(tree[0].children).toHaveLength(2);
      expect(tree[0].children[0].id).toBe('1-1');
      expect(tree[0].children[1].id).toBe('1-2');
      expect(tree[1].id).toBe('2');
      expect(tree[1].children).toHaveLength(0);
    });

    it('should handle items with null parentId', () => {
      const items = [
        { id: '1', parentId: null, name: 'Root' },
        { id: '2', parentId: '1', name: 'Child' },
      ];

      const tree = buildGenericTree(items);

      expect(tree).toHaveLength(1);
      expect(tree[0].id).toBe('1');
      expect(tree[0].children).toHaveLength(1);
      expect(tree[0].children[0].id).toBe('2');
    });

    it('should handle missing parent references', () => {
      const items = [
        { id: '1', parentId: 'root', name: 'Parent' },
        { id: '2', parentId: 'non-existent', name: 'Orphan' },
      ];

      const tree = buildGenericTree(items);

      // Both items have non-existent parents, so both should be treated as roots
      expect(tree).toHaveLength(2);
      expect(tree[0].id).toBe('1');
      expect(tree[1].id).toBe('2');
    });

    it('should handle deeply nested structures', () => {
      const items = [
        { id: '1', parentId: 'root', name: 'Level 1' },
        { id: '1-1', parentId: '1', name: 'Level 2' },
        { id: '1-1-1', parentId: '1-1', name: 'Level 3' },
        { id: '1-1-1-1', parentId: '1-1-1', name: 'Level 4' },
      ];

      const tree = buildGenericTree(items);

      expect(tree).toHaveLength(1);
      expect(tree[0].children[0].children[0].children[0].id).toBe('1-1-1-1');
    });
  });

  describe('buildItemsTree', () => {
    it('should build tree from SimpleTreeNode array', () => {
      const items: SimpleTreeNode[] = [
        { id: '1', parentId: '', title: 'Parent', updatedAt: '2024-01-01' },
        { id: '1-1', parentId: '1', title: 'Child', updatedAt: '2024-01-02' },
      ];

      const tree = buildItemsTree(items);

      expect(tree).toHaveLength(1);
      expect(tree[0].id).toBe('1');
      expect(tree[0].children).toHaveLength(1);
      expect(tree[0].children[0].id).toBe('1-1');
    });

    it('should handle items without parentId as roots', () => {
      const items: SimpleTreeNode[] = [
        { id: '1', parentId: '', title: 'Root 1', updatedAt: '2024-01-01' },
        { id: '2', parentId: '', title: 'Root 2', updatedAt: '2024-01-02' },
      ];

      const tree = buildItemsTree(items);

      expect(tree).toHaveLength(2);
    });
  });

  describe('buildTree', () => {
    interface CustomItem extends TreeItem {
      name: string;
    }

    interface CustomItemWithChildren extends TreeItemWithChildren<CustomItemWithChildren> {
      name: string;
    }

    it('should build tree with custom transform', () => {
      const items: CustomItem[] = [
        { id: '1', parentId: '', name: 'Parent' },
        { id: '1-1', parentId: '1', name: 'Child' },
      ];

      const transform = (item: CustomItem): CustomItemWithChildren => ({
        id: item.id,
        parentId: item.parentId,
        name: item.name.toUpperCase(),
        children: [],
      });

      const tree = buildTree(items, transform);

      expect(tree).toHaveLength(1);
      expect(tree[0].name).toBe('PARENT');
      expect(tree[0].children[0].name).toBe('CHILD');
    });
  });

  describe('getSimpleTree', () => {
    it('should convert tree with children to simple format', () => {
      const itemsAsTree: SimpleTreeNodeWithChildren[] = [
        {
          id: '1',
          parentId: 'root',
          title: 'Parent',
          updatedAt: '2024-01-01',
          children: [
            {
              id: '1-1',
              parentId: '1',
              title: 'Child',
              updatedAt: '2024-01-02',
              children: [],
            },
          ],
        },
      ];

      const simpleTree = getSimpleTree(itemsAsTree);

      expect(simpleTree).toHaveLength(1);
      expect(simpleTree[0].id).toBe('1');
      expect(simpleTree[0].children).toHaveLength(1);
      expect(simpleTree[0].children![0].id).toBe('1-1');
    });

    it('should not include children property for leaf nodes', () => {
      const itemsAsTree: SimpleTreeNodeWithChildren[] = [
        {
          id: '1',
          parentId: 'root',
          title: 'Leaf',
          updatedAt: '2024-01-01',
          children: [],
        },
      ];

      const simpleTree = getSimpleTree(itemsAsTree);

      expect(simpleTree[0].children).toBeUndefined();
    });
  });

  describe('mapTree', () => {
    interface SourceNode {
      id: string;
      value: number;
      children?: SourceNode[];
    }

    interface TargetNode {
      id: string;
      doubledValue: number;
      children?: TargetNode[];
    }

    it('should map tree structure with transformation', () => {
      const source: SourceNode[] = [
        {
          id: '1',
          value: 10,
          children: [
            { id: '1-1', value: 5 },
          ],
        },
      ];

      const mapper = (item: SourceNode) => ({
        id: item.id,
        doubledValue: item.value * 2,
      });

      const result = mapTree<SourceNode, TargetNode>(source, mapper);

      expect(result[0].doubledValue).toBe(20);
      expect(result[0].children![0].doubledValue).toBe(10);
    });

    it('should preserve tree structure', () => {
      const source: SourceNode[] = [
        {
          id: '1',
          value: 1,
          children: [
            {
              id: '1-1',
              value: 2,
              children: [
                { id: '1-1-1', value: 3 },
              ],
            },
          ],
        },
      ];

      const mapper = (item: SourceNode) => ({
        id: item.id,
        doubledValue: item.value,
      });

      const result = mapTree<SourceNode, TargetNode>(source, mapper);

      expect(result[0].children![0].children![0].id).toBe('1-1-1');
    });
  });

  describe('flattenTree', () => {
    it('should flatten tree to array', () => {
      const tree = [
        {
          id: '1',
          children: [
            {
              id: '1-1',
              children: [
                { id: '1-1-1' },
              ],
            },
            { id: '1-2' },
          ],
        },
        { id: '2' },
      ];

      const flat = flattenTree(tree);

      expect(flat).toHaveLength(5);
      expect(flat.map(item => item.id)).toEqual(['1', '1-1', '1-1-1', '1-2', '2']);
    });

    it('should handle tree without children', () => {
      const tree = [{ id: '1' }, { id: '2' }];
      const flat = flattenTree(tree);

      expect(flat).toHaveLength(2);
    });

    it('should handle empty tree', () => {
      const flat = flattenTree([]);
      expect(flat).toHaveLength(0);
    });
  });

  describe('findInTree', () => {
    const tree = [
      {
        id: '1',
        children: [
          { id: '1-1' },
          { id: '1-2' },
        ],
      },
      { id: '2' },
    ];

    it('should find root item', () => {
      const item = findInTree(tree, '1');
      expect(item).toBeDefined();
      expect(item!.id).toBe('1');
    });

    it('should find nested item', () => {
      const item = findInTree(tree, '1-2');
      expect(item).toBeDefined();
      expect(item!.id).toBe('1-2');
    });

    it('should return undefined for non-existent item', () => {
      const item = findInTree(tree, 'non-existent');
      expect(item).toBeUndefined();
    });
  });

  describe('getDescendants', () => {
    const tree = [
      {
        id: '1',
        children: [
          {
            id: '1-1',
            children: [
              { id: '1-1-1' },
            ],
          },
          { id: '1-2' },
        ],
      },
      { id: '2' },
    ];

    it('should return all descendants', () => {
      const descendants = getDescendants(tree, '1');
      expect(descendants).toHaveLength(3);
      expect(descendants.map(d => d.id)).toEqual(['1-1', '1-1-1', '1-2']);
    });

    it('should return empty array for leaf node', () => {
      const descendants = getDescendants(tree, '1-1-1');
      expect(descendants).toHaveLength(0);
    });

    it('should return empty array for non-existent node', () => {
      const descendants = getDescendants(tree, 'non-existent');
      expect(descendants).toHaveLength(0);
    });
  });

  describe('getAncestors', () => {
    const items: TreeItem[] = [
      { id: '1', parentId: 'root' },
      { id: '1-1', parentId: '1' },
      { id: '1-1-1', parentId: '1-1' },
      { id: '2', parentId: 'root' },
    ];

    it('should return all ancestors', () => {
      const ancestors = getAncestors(items, '1-1-1');
      expect(ancestors).toHaveLength(2);
      expect(ancestors.map(a => a.id)).toEqual(['1-1', '1']);
    });

    it('should return empty array for root item', () => {
      const ancestors = getAncestors(items, '1');
      expect(ancestors).toHaveLength(0);
    });

    it('should return empty array for non-existent item', () => {
      const ancestors = getAncestors(items, 'non-existent');
      expect(ancestors).toHaveLength(0);
    });

    it('should return immediate parent only for depth 1', () => {
      const ancestors = getAncestors(items, '1-1');
      expect(ancestors).toHaveLength(1);
      expect(ancestors[0].id).toBe('1');
    });
  });
});
