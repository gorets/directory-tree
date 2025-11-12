# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2025-11-12

### Added
- Initial release
- `SelectableTreeWithConfig` component with checkbox support
- Flat array data structure support with `parentId` references
- Two-way config synchronization (enabled/disabled arrays)
- State inheritance from parent to children
- Minimal config approach (only explicit user actions stored)
- Lazy loading support for tree nodes
- Indeterminate state for partially checked parents
- Debounced config change notifications (100ms)
- Helper functions for tree operations:
  - `getChildrenFromFlat()`
  - `findItemInFlat()`
  - `getAllDescendantIds()`
  - `toggleItemsRecursively()`
  - `getRootItems()`
  - `isRootItem()`
- Utility functions:
  - `isItemEnabled()`
  - `findItemPath()`
  - `findItem()`
  - `getAllEnabledItemIds()`
- Complete TypeScript type definitions
- Comprehensive documentation
- CSS styles for tree rendering

### Features
- Production-ready code quality
- Full TypeScript support
- React 17+ and 18+ compatible
- Performance optimized with `useMemo` and `useCallback`
- No external dependencies (except React)
- Tree builder utilities for flat/hierarchical conversion
- Support for controlled/uncontrolled expanded nodes
- Custom title rendering support

### Testing
- Comprehensive test suite with Jest and React Testing Library
- Unit tests for all utility functions (utils.ts, helpers.ts, tree-builder.utils.ts)
- Integration tests for SelectableTreeWithConfig component
- Component tests for SelectableTree component
- 80%+ code coverage across all metrics
- Test configuration with jest.config.js
- Testing guide documentation (TESTING.md)

### Documentation
- Complete README with examples
- API reference
- Architecture explanation
- Publishing guide
- Migration guide from complex optimization approach
- Testing guide with coverage reports
