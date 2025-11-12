# NPM Package Setup - SelectableTreeView

This document explains the complete npm package setup for `SelectableTreeView`.

## 📦 Package Files Created

All files are located in `src/components/SelectableTreeView/`:

### Configuration Files

1. **package.json** - Package metadata and dependencies
   - Package name: `@your-org/selectable-tree-view`
   - Version: `1.0.0`
   - Entry points: `dist/index.js`, type definitions
   - Build scripts

2. **tsconfig.json** - TypeScript compilation configuration
   - Target: ES2020
   - Module: ESNext
   - Output: `dist/` folder
   - Declarations: Enabled

3. **.npmignore** - Files to exclude from npm package
   - Source TypeScript files (only dist is published)
   - Config and test files
   - Development files

### Documentation Files

4. **README.md** - Updated with npm installation instructions
   - Added installation section
   - Updated import examples
   - Complete API documentation

5. **PUBLISHING.md** - Step-by-step publishing guide
   - Prerequisites
   - Build process
   - Publishing steps
   - Version management
   - Troubleshooting

6. **CHANGELOG.md** - Version history
   - Initial 1.0.0 release notes
   - Features list

7. **LICENSE** - MIT License

## 🚀 Quick Start Guide

### 1. Update Package Name

Edit `src/components/SelectableTreeView/package.json`:

```json
{
  "name": "@your-username/selectable-tree-view",
  "author": "Your Name <your.email@example.com>",
  "repository": {
    "url": "https://github.com/your-username/selectable-tree-view.git"
  }
}
```

### 2. Build the Package

```bash
cd src/components/SelectableTreeView
npm run build
```

This creates the `dist/` folder with:
- ✅ Compiled JavaScript files
- ✅ TypeScript type definitions (.d.ts)
- ✅ CSS stylesheet
- ✅ Source maps

### 3. Test Locally

```bash
# Create a tarball
npm pack

# Install in another project
npm install /path/to/your-username-selectable-tree-view-1.0.0.tgz
```

### 4. Publish to npm

```bash
# Login to npm (first time only)
npm login

# Publish
npm publish --access public
```

## 📋 Package Contents

The published package includes:

```
dist/
├── index.js                          # Main entry
├── index.d.ts                        # Types
├── SelectableTree.js                 # Tree component
├── SelectableTree.d.ts
├── SelectableTree.css                # Styles ⭐
├── SelectableTreeWithConfig.js       # Main component
├── SelectableTreeWithConfig.d.ts
├── helpers.js                        # Helper utilities
├── helpers.d.ts
├── types.js                          # Type definitions
├── types.d.ts
├── utils.js                          # Utility functions
├── utils.d.ts
└── tree-builder.utils.js             # Tree builders
    tree-builder.utils.d.ts
README.md                             # Documentation
LICENSE                               # MIT License
package.json                          # Metadata
CHANGELOG.md                          # Version history
```

**Note:** Source `.ts` and `.tsx` files are NOT included (only compiled `.js` and `.d.ts` files).

## 💡 Usage After Publishing

Users will install and use your package like this:

```bash
npm install @your-username/selectable-tree-view
```

```tsx
import { SelectableTreeWithConfig } from '@your-username/selectable-tree-view';
import '@your-username/selectable-tree-view/dist/SelectableTree.css';

function App() {
  const [config, setConfig] = useState({ enabled: [], disabled: [] });

  return (
    <SelectableTreeWithConfig
      items={items}
      config={config}
      onConfigChange={setConfig}
    />
  );
}
```

## 🔄 Updating the Package

When you make changes:

```bash
# 1. Update version
npm version patch  # 1.0.0 → 1.0.1 (bug fixes)
npm version minor  # 1.0.0 → 1.1.0 (new features)
npm version major  # 1.0.0 → 2.0.0 (breaking changes)

# 2. Update CHANGELOG.md with changes

# 3. Rebuild
npm run build

# 4. Publish
npm publish
```

## 📚 Key Files Explained

### package.json
- **name**: Package identifier on npm
- **main**: Entry point for CommonJS
- **module**: Entry point for ES modules
- **types**: TypeScript type definitions
- **files**: What gets published (only dist, README, LICENSE)
- **peerDependencies**: React 17+ or 18+ required by users
- **devDependencies**: TypeScript and React types for building

### tsconfig.json
- Compiles TypeScript to JavaScript
- Generates type definitions (.d.ts)
- Outputs to dist/ folder
- Preserves source maps for debugging

### .npmignore
- Prevents source files from being published
- Keeps package size small
- Only compiled dist/ folder is published

## ⚠️ Important Notes

1. **Peer Dependencies**: Users must have React installed
2. **CSS Import**: Users must import the CSS file separately
3. **TypeScript**: Full type definitions included
4. **Tree Shaking**: ES module format supports tree shaking
5. **No External Deps**: Package has zero runtime dependencies (except React)

## 🎯 Pre-Publication Checklist

- [ ] Updated package name in package.json
- [ ] Updated author information
- [ ] Updated repository URL
- [ ] Tested build process (`npm run build`)
- [ ] Verified dist/ folder contents
- [ ] Tested package locally with `npm pack`
- [ ] Updated README with correct package name
- [ ] Logged into npm (`npm login`)
- [ ] Ready to publish (`npm publish --access public`)

## 📖 Additional Resources

- [npm Documentation](https://docs.npmjs.com/)
- [TypeScript Publishing Guide](https://www.typescriptlang.org/docs/handbook/declaration-files/publishing.html)
- [Semantic Versioning](https://semver.org/)

## 🔗 Files Reference

All configuration files are in: `src/components/SelectableTreeView/`

- `package.json` - Package configuration
- `tsconfig.json` - TypeScript config
- `.npmignore` - Publish exclusions
- `README.md` - User documentation
- `PUBLISHING.md` - Publisher guide
- `CHANGELOG.md` - Version history
- `LICENSE` - MIT License

## ✅ Build Verification

After running `npm run build`, verify:

```bash
ls -lh dist/

# Should show:
# - Multiple .js files (compiled code)
# - Multiple .d.ts files (type definitions)
# - SelectableTree.css (styles)
# - .d.ts.map files (source maps)
```

## 🎉 Success!

Your package is ready to publish! Follow the steps in `PUBLISHING.md` for detailed instructions.
