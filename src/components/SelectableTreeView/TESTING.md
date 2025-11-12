# Testing Guide

This package includes comprehensive test coverage for all components and utilities.

## Running Tests

### Install Dependencies

First, install all dependencies:

```bash
npm install
```

### Run Tests

Run all tests:

```bash
npm test
```

Run tests in watch mode:

```bash
npm run test:watch
```

Run tests with coverage report:

```bash
npm run test:coverage
```

## Test Coverage

The test suite includes:

### Unit Tests

- **utils.test.ts** - Tests for utility functions
  - `isTreeNode` - Type guard validation
  - `createSafeGetter` - Safe property access
  - `findItemPath` - Path finding in tree structure
  - `findItem` - Item lookup
  - `getAllDescendantIds` - Descendant collection
  - `isItemEnabled` - State calculation with inheritance
  - `getAllEnabledItemIds` - Enabled items collection

- **tree-builder.utils.test.ts** - Tests for tree building utilities
  - `buildGenericTree` - Build tree from flat array
  - `buildItemsTree` - Build specific tree type
  - `buildTree` - Generic tree builder with transform
  - `getSimpleTree` - Convert to simple format
  - `mapTree` - Tree transformation
  - `flattenTree` - Tree to array conversion
  - `findInTree` - Tree search
  - `getDescendants` - Descendant collection
  - `getAncestors` - Ancestor path collection

- **helpers.test.ts** - Tests for helper functions
  - `getParentId` - Parent ID extraction
  - `isRootItem` - Root item detection
  - `getChildrenFromFlat` - Children lookup in flat array
  - `findItemInFlat` - Item search in flat array
  - `getAllDescendantIds` - Descendant ID collection
  - `toggleItemsRecursively` - Recursive state toggle
  - `getRootItems` - Root items filter

### Integration Tests

- **SelectableTreeWithConfig.test.tsx** - Integration tests for main component
  - Config application on mount
  - Checkbox toggle functionality
  - Parent-child state synchronization
  - Minimal config generation
  - State inheritance
  - Explicit action tracking
  - Lazy loading
  - Controlled/uncontrolled expandedNodes
  - Config change debouncing

### Component Tests

- **SelectableTree.test.tsx** - Component rendering tests
  - Item rendering
  - Checkbox rendering and interaction
  - Expand/collapse functionality
  - Loading states
  - Custom render functions
  - Indeterminate states
  - ARIA attributes
  - Nesting levels and padding
  - Deep nesting support

## Coverage Goals

The test suite aims for:
- **Branches**: 80%+
- **Functions**: 80%+
- **Lines**: 80%+
- **Statements**: 80%+

Current coverage can be viewed by running `npm run test:coverage`.

## Writing Tests

### Test Structure

Tests follow this structure:

```typescript
describe('ComponentOrFunction', () => {
  describe('specificFeature', () => {
    it('should do something specific', () => {
      // Arrange
      const input = { /* ... */ };

      // Act
      const result = functionUnderTest(input);

      // Assert
      expect(result).toBe(expected);
    });
  });
});
```

### Testing React Components

Use React Testing Library for component tests:

```typescript
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

it('should handle user interaction', async () => {
  const user = userEvent.setup();
  const mockCallback = jest.fn();

  render(<Component onAction={mockCallback} />);

  const button = screen.getByRole('button');
  await user.click(button);

  expect(mockCallback).toHaveBeenCalled();
});
```

### Testing Async Code

Use `waitFor` for async operations:

```typescript
it('should load data', async () => {
  render(<Component />);

  await waitFor(() => {
    expect(screen.getByText('Loaded data')).toBeInTheDocument();
  });
});
```

## Continuous Integration

Tests should be run as part of CI/CD pipeline:

```yaml
# Example GitHub Actions workflow
- name: Run tests
  run: npm test

- name: Check coverage
  run: npm run test:coverage
```

## Troubleshooting

### Tests Not Running

1. Ensure all dependencies are installed: `npm install`
2. Check Node.js version (requires Node 16+)
3. Clear Jest cache: `npx jest --clearCache`

### Coverage Too Low

1. Run coverage report: `npm run test:coverage`
2. Open `coverage/lcov-report/index.html` in browser
3. Identify uncovered lines
4. Add tests for uncovered code paths

### Flaky Tests

1. Check for race conditions in async tests
2. Use `waitFor` with appropriate timeout
3. Avoid testing implementation details
4. Use `jest.useFakeTimers()` for time-dependent code
