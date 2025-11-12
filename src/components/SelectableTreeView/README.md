# SelectableTreeWithConfig

A production-ready hierarchical tree component with checkboxes, config synchronization, and lazy loading support.

## Installation

```bash
npm install selectable-tree-view
```

or

```bash
yarn add selectable-tree-view
```

## Features

- ✅ **Flat data structure**: Works with flat arrays using `parentId` references
- ✅ **Minimal config**: Stores only explicit user actions, not inherited states
- ✅ **Two-way sync**: Config → UI and UI → Config
- ✅ **State inheritance**: Children automatically inherit parent's checked state
- ✅ **Lazy loading**: Load children on-demand when expanding nodes
- ✅ **Indeterminate state**: Visual indication for partially checked parents
- ✅ **Debounced updates**: Optimized config change notifications

## Usage

```tsx
import { SelectableTreeWithConfig } from 'selectable-tree-view';
import 'selectable-tree-view/dist/SelectableTree.css';

function MyComponent() {
  const [config, setConfig] = useState({ enabled: [], disabled: [] });
  const [items, setItems] = useState([
    { id: '1', parentId: 'root', title: 'Root' },
    { id: '2', parentId: '1', title: 'Child 1' },
    { id: '3', parentId: '1', title: 'Child 2' },
  ]);

  return (
    <SelectableTreeWithConfig
      items={items}
      config={config}
      onConfigChange={setConfig}
      onNodeLoad={(parentId) => loadChildren(parentId)}
      getId={(item) => item.id}
      getTitle={(item) => item.title}
    />
  );
}
```

## API

### Props

#### Required

- **`items`**: `T[]` - Flat array of tree items with `parentId` references
- **`config`**: `TreeSyncConfig` - Config object with `enabled` and `disabled` arrays
- **`onConfigChange`**: `(config: TreeSyncConfig) => void` - Called when user toggles items

#### Optional

- **`getId`**: `(item: T) => string` - Extract item ID (default: `item.id`)
- **`getTitle`**: `(item: T) => string` - Extract item title (default: `item.title`)
- **`getChildren`**: `(item: T) => T[]` - Get item children (default: `item.children || []`)
- **`onNodeLoad`** / **`onLoadNode`**: `(parentId: string) => void | Promise<void>` - Load children for a node
- **`renderTitle`**: `(item: T) => React.ReactNode` - Custom title renderer
- **`expandedNodes`**: `Set<string>` - Controlled expanded state
- **`onExpandedNodesChange`**: `(nodes: Set<string>) => void` - Expanded state change handler

### Types

```typescript
interface TreeSyncConfig {
  enabled: string[];   // IDs of explicitly enabled items
  disabled: string[];  // IDs of explicitly disabled items
}

interface TreeNodeState {
  checked: boolean;        // Is item checked?
  indeterminate: boolean;  // Is item partially checked?
}
```

## How It Works

### 1. Config Structure

The config contains only **explicit user actions**, not inherited states:

```typescript
// User clicks parent → All children become checked
config = { enabled: ['parent-id'], disabled: [] }

// User then unchecks one child
config = { enabled: ['parent-id'], disabled: ['child-id'] }
```

### 2. State Inheritance

Children automatically inherit their parent's state unless explicitly overridden:

```
☑ Parent (in enabled)
  ☑ Child 1 (inherited from parent)
  ☐ Child 2 (in disabled - overrides parent)
```

### 3. Minimal Config

When you toggle an item, all descendant actions are removed (they now inherit):

```typescript
// Before: Parent and child both have explicit actions
explicitActions = {
  'parent': 'disabled',
  'child': 'enabled'
}

// After clicking parent to enable it:
explicitActions = {
  'parent': 'enabled'
  // child removed - now inherits from parent
}
```

### 4. Lazy Loading

When expanding a node with no children, `onNodeLoad` is called:

```typescript
const handleNodeLoad = async (parentId: string) => {
  const children = await fetchChildren(parentId);
  setItems(prev => [...prev, ...children]);
};
```

## Helper Functions

### `getChildrenFromFlat(items, parentId, getId)`
Get direct children of an item from a flat array.

### `findItemInFlat(items, itemId, getId)`
Find an item by ID in a flat array.

### `getAllDescendantIds(items, item, getId)`
Get all descendant IDs of an item.

### `getRootItems(items)`
Filter items to get only root-level items.

### `isRootItem(item)`
Check if an item is a root item.

## Constants

- **`ROOT_PARENT_ID`**: `'root'` - The parentId value for root items
- **`CONFIG_DEBOUNCE_MS`**: `100` - Debounce delay for config changes (ms)

## Architecture

### File Structure

```
SelectableTreeView/
├── SelectableTreeWithConfig.tsx  # Main component with config logic
├── SelectableTree.tsx             # Presentational tree component
├── helpers.ts                     # Utility functions
├── utils.ts                       # Legacy utilities
├── types.ts                       # TypeScript types
└── README.md                      # This file
```

### Key Concepts

1. **explicitActions**: `Map<itemId, 'enabled' | 'disabled'>`
   - Tracks only items explicitly toggled by user
   - Used to generate minimal config

2. **checkedItems**: `Set<string>`
   - All currently checked items (including inherited)
   - Used for UI rendering

3. **checkedState**: `Map<itemId, TreeNodeState>`
   - Calculated states with indeterminate info
   - Recursively computed from leaf nodes up

4. **isApplyingConfig**: `Ref<boolean>`
   - Prevents infinite loops when applying config
   - Distinguishes config updates from user actions

## Performance Optimizations

- ✅ Uses `Set` and `Map` for O(1) lookups instead of arrays
- ✅ Memoizes expensive calculations (`useMemo`)
- ✅ Stable callback references (`useCallback`)
- ✅ Debounces config change notifications
- ✅ Prevents duplicate API calls with `loadedParentsRef`
- ✅ Only calculates states for visible tree nodes

## Testing

This package includes comprehensive test coverage. See [TESTING.md](./TESTING.md) for detailed testing guide.

### Running Tests

```bash
npm test              # Run all tests
npm run test:watch    # Run tests in watch mode
npm run test:coverage # Run tests with coverage report
```

### Test Coverage

The package includes:
- ✅ Unit tests for all utility functions
- ✅ Integration tests for SelectableTreeWithConfig
- ✅ Component tests for SelectableTree
- ✅ 80%+ code coverage across all metrics

### Key Test Scenarios

1. ✅ Clicking parent enables all children
2. ✅ Unchecking child when parent enabled → child goes to disabled
3. ✅ Loading children doesn't add them to config
4. ✅ Toggling parent removes all descendant actions
5. ✅ Config changes are debounced (100ms)
6. ✅ Indeterminate state shows when some children checked
7. ✅ State inheritance from parent to children
8. ✅ Lazy loading with onLoadNode callback
9. ✅ Minimal config generation

