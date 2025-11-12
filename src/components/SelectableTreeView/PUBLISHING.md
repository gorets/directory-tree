# Publishing Guide

This guide explains how to publish the SelectableTreeView package to npm.

## Prerequisites

1. **npm account**: Create one at [npmjs.com](https://www.npmjs.com/signup) if you don't have one
2. **npm login**: Run `npm login` in your terminal
3. **Package name**: Update the package name in `package.json` to match your organization or username

## Steps to Publish

### 1. Update Package Information

Edit `package.json` and update:

```json
{
  "name": "@your-org/selectable-tree-view",  // Change to your scope
  "version": "1.0.0",
  "author": "Your Name <your.email@example.com>",
  "repository": {
    "url": "https://github.com/your-org/selectable-tree-view.git"
  }
}
```

### 2. Build the Package

```bash
cd src/components/SelectableTreeView
npm run build
```

This will:
- Compile TypeScript to JavaScript
- Generate type definitions (.d.ts files)
- Copy CSS files to dist/

### 3. Test the Build

Check that the `dist/` folder contains:
- `index.js` - Main entry point
- `index.d.ts` - Type definitions
- `*.js` files for all components
- `*.d.ts` files for all TypeScript files
- `SelectableTree.css` - Styles

### 4. Test Locally (Optional)

You can test the package locally before publishing:

```bash
# In the SelectableTreeView directory
npm pack

# This creates a .tgz file that you can install in another project
npm install /path/to/your-org-selectable-tree-view-1.0.0.tgz
```

### 5. Publish to npm

```bash
# For scoped packages (recommended)
npm publish --access public

# For non-scoped packages
npm publish
```

### 6. Verify Publication

Visit your package page:
- https://www.npmjs.com/package/@your-org/selectable-tree-view

## Updating the Package

When you make changes and want to publish a new version:

1. Update the version in `package.json`:
   ```bash
   npm version patch  # 1.0.0 → 1.0.1
   npm version minor  # 1.0.0 → 1.1.0
   npm version major  # 1.0.0 → 2.0.0
   ```

2. Rebuild and publish:
   ```bash
   npm run build
   npm publish
   ```

## File Structure

The published package will include:

```
dist/
├── index.js                          # Main entry point
├── index.d.ts                        # Type definitions
├── SelectableTree.js
├── SelectableTree.d.ts
├── SelectableTree.css                # Styles
├── SelectableTreeWithConfig.js
├── SelectableTreeWithConfig.d.ts
├── helpers.js
├── helpers.d.ts
├── types.js
├── types.d.ts
├── utils.js
├── utils.d.ts
└── tree-builder.utils.js
    tree-builder.utils.d.ts
README.md                             # Documentation
LICENSE                               # MIT License
package.json                          # Package metadata
```

## Troubleshooting

### Build Errors

If you get TypeScript errors during build:
```bash
# Check TypeScript version
npx tsc --version

# Install dependencies
npm install
```

### Import Errors

If imports fail after publishing, check:
1. All `.js` extensions are removed from imports in TypeScript files
2. The `main`, `module`, and `types` fields in package.json are correct
3. The `files` array in package.json includes `dist`

### CSS Not Loading

Users need to import the CSS file:
```tsx
import '@your-org/selectable-tree-view/dist/SelectableTree.css';
```

## Best Practices

1. **Semantic Versioning**: Follow semver (major.minor.patch)
   - Major: Breaking changes
   - Minor: New features (backwards compatible)
   - Patch: Bug fixes

2. **Changelog**: Maintain a CHANGELOG.md with version history

3. **Testing**: Test thoroughly before publishing

4. **Documentation**: Keep README.md up to date

5. **License**: Make sure LICENSE file is included

## Additional Resources

- [npm Documentation](https://docs.npmjs.com/)
- [Semantic Versioning](https://semver.org/)
- [TypeScript Package Publishing](https://www.typescriptlang.org/docs/handbook/declaration-files/publishing.html)
