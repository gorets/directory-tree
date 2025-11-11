# Selectable Tree View Component

Lazy-loading hierarchical tree component with checkbox selection support. Fetches data from API on demand when nodes are expanded.

## Features

- **Lazy Loading**: Root nodes load on mount, child nodes load on expand click
- **Checkboxes**: Select/deselect tree items with support for indeterminate states
- **Loading States**: Visual spinner during data fetch operations
- **Dynamic Hierarchy**: Automatically organizes flat API responses into tree structure
- **Smart Expand Button**: Shows expand button only when children exist or can be loaded

## API Requirements

### Request Format

```json
{
  "parameters": {
    "pages": {
      "spaceId": "string",
      "parentId": "string"
    }
  }
}
```

**Parameters:**
- `spaceId`: Space/collection identifier
- `parentId`: Parent node ID (use 'root' or similar for root level nodes)

### Response Format

```json
{
  "extraInfo": {
    "pages": [
      {
        "id": "string",
        "title": "string",
        "status": "string",
        ...other fields
      }
    ]
  }
}
```

**Important:** API response does NOT include `parentId`. The component automatically assigns `parentId` based on the request parameter.

## Component Props

```tsx
interface SelectableTreeWithConfigProps<T> {
  items: T[];                              // Flat array of items
  config?: TreeSyncConfig;                 // Enabled/disabled items config
  onNodeLoad?: (parentId: string) => Promise<void>;  // Called when node expands
  onConfigChange?: (config: TreeSyncConfig) => void; // Called when selections change
  getId?: (item: T) => string;             // Extract item ID (default: item.id)
  getTitle?: (item: T) => string;          // Extract item title (default: item.title)
  renderTitle?: (item: T, defaultTitle: string) => ReactNode; // Custom title rendering
}
```

## Usage Example

```tsx
import { SelectableTreeWithConfig } from './components/SelectableTreeView';

function App() {
  const [pages, setPages] = useState([]);
  const [config, setConfig] = useState({ enabled: [], disabled: [] });

  const fetchTreeNode = async (parentId: string = 'root') => {
    const response = await fetch('/api/data-sources/pages', {
      method: 'POST',
      body: JSON.stringify({
        parameters: { pages: { spaceId: 'my-space', parentId } }
      })
    });
    const { extraInfo } = await response.json();
    
    // API response doesn't include parentId, component handles it
    setPages(prev => {
      const map = new Map(prev.map(p => [p.id, p]));
      extraInfo.pages.forEach(page => {
        map.set(page.id, { ...page, parentId }); // Set parentId from request
      });
      return Array.from(map.values());
    });
  };

  return (
    <SelectableTreeWithConfig
      items={pages}
      config={config}
      onNodeLoad={fetchTreeNode}
      onConfigChange={setConfig}
    />
  );
}
```

## Data Structure

The component expects a flat array of items with `id`, `parentId`, and `title`:

```tsx
interface TreeItem {
  id: string;
  parentId: string | 'root';
  title: string;
  [key: string]: any;
}
```

Items are automatically organized into a hierarchy based on parent-child relationships.

## How It Works

1. **Initial Load**: Component calls `onNodeLoad('root')` on mount
2. **User Expands**: When user clicks expand button, `onNodeLoad(nodeId)` is called
3. **Data Transform**: Response items are mapped with `parentId` from the request
4. **Hierarchy**: Component filters items by `parentId` to build tree levels
5. **UI Update**: Items appear nested under their parent; expand button hides if no children

## Key Implementation Details

- **Dynamic Children Lookup**: Uses `parentId` field to find children for each node at render time
- **Deduplication**: Items are merged by ID to prevent duplicates
- **Loading Indicator**: Spinner shows during fetch; disappears when done
- **Smart Button**: Expand button only visible if node has children or can load more
