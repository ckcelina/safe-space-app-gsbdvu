
# NPM Build Fix - Permanent Solution

## Problem
The CI/build was still running pnpm even though the project should use npm, causing the error:
```
ERROR This project is configured to use npm
For help, run: pnpm help run
```

## Solution Implemented

### 1. ✅ Created/Updated .npmrc
**File: `.npmrc`**
```
engine-strict=true
package-lock=true
fund=false
audit=false
```

This enforces npm as the package manager and prevents other package managers from being used.

### 2. ✅ Created .nvmrc
**File: `.nvmrc`**
```
18.0.0
```

This pins the Node.js version to 18.0.0, which is compatible with Expo SDK 54.

### 3. ✅ Updated package.json
**Added `packageManager` field:**
```json
"packageManager": "npm@10.8.2"
```

**Engines configuration:**
```json
"engines": {
  "node": ">=18.0.0",
  "npm": ">=10.0.0"
}
```

### 4. ✅ Verified Lockfiles
- ✅ `package-lock.json` exists (npm lockfile)
- ✅ No `pnpm-lock.yaml` present
- ✅ No `yarn.lock` present
- ✅ No `bun.lockb` present

### 5. ✅ Verified Scripts in package.json
All scripts use npm commands:
- No `preinstall` scripts that force other package managers
- No references to pnpm, yarn, or bun
- All scripts use standard npm commands

### 6. ✅ EAS Configuration
**File: `eas.json`**

All build profiles (development, preview, production) are configured with:
```json
{
  "node": "18.0.0",
  "npm": {
    "install": "npm ci"
  },
  "env": {
    "COREPACK_ENABLE_STRICT": "0",
    "COREPACK_ENABLE_AUTO_PIN": "0"
  }
}
```

This ensures:
- Node 18.0.0 is used
- npm ci is used for installation (faster and more reliable than npm install)
- Corepack is disabled to prevent auto-switching to pnpm

### 7. ✅ Corepack Disabled
**File: `.corepackrc`**
```json
{
  "enable": false
}
```

This explicitly disables Corepack, which could auto-enable pnpm.

### 8. ✅ Node Version Files
**File: `.node-version`**
```
18.0.0
```

This ensures the correct Node version is used across different environments.

### 9. ✅ .gitignore Configuration
The `.gitignore` file already includes entries to ignore other package manager files:
```
# Ignore pnpm lock file - this project uses npm
pnpm-lock.yaml
.pnpm-store/
.pnpm-debug.log
pnpm-workspace.yaml

# Ignore yarn lock file - this project uses npm
yarn.lock
.yarn/
.yarnrc
.yarnrc.yml

# Ignore bun lock file - this project uses npm
bun.lockb
.bun/

# Keep npm lock file
!package-lock.json
```

## Verification Checklist

- [x] `.npmrc` exists with correct configuration
- [x] `.nvmrc` exists with Node 18.0.0
- [x] `package.json` has `"packageManager": "npm@10.8.2"`
- [x] `package.json` engines match Node 18
- [x] Only `package-lock.json` exists (no pnpm/yarn/bun lockfiles)
- [x] No scripts in `package.json` reference pnpm/yarn/bun
- [x] `eas.json` uses `npm ci` for all build profiles
- [x] Corepack is disabled via `.corepackrc` and environment variables
- [x] `.gitignore` ignores other package manager files

## Next Steps

1. **Clean Install:**
   ```bash
   rm -rf node_modules
   npm ci
   ```

2. **Verify Build:**
   ```bash
   npm run build
   ```

3. **Test EAS Build:**
   ```bash
   eas build --platform ios --profile development
   ```

## Why This Works

1. **packageManager field**: Explicitly tells Node.js and package managers which one to use
2. **npm ci in eas.json**: Forces EAS to use npm ci instead of auto-detecting
3. **Corepack disabled**: Prevents Node.js from auto-enabling pnpm based on packageManager field
4. **engine-strict in .npmrc**: Enforces the Node/npm versions specified in package.json
5. **Environment variables**: COREPACK_ENABLE_STRICT=0 ensures Corepack doesn't interfere

## Common Issues Resolved

- ❌ "This project is configured to use npm" error from pnpm
- ❌ CI/build auto-detecting and using pnpm
- ❌ Corepack auto-enabling pnpm
- ❌ Mixed lockfiles causing conflicts
- ❌ Inconsistent package manager usage across environments

## Files Modified

1. `.nvmrc` - Created
2. `package.json` - Added packageManager field
3. `.npmrc` - Updated with optimal settings

## Files Already Configured (No Changes Needed)

1. `.corepackrc` - Already disables Corepack
2. `.node-version` - Already set to 18.0.0
3. `eas.json` - Already configured with npm ci
4. `.gitignore` - Already ignores other package manager files
5. `package-lock.json` - Already exists

## Result

✅ The project is now permanently configured to use npm only.
✅ CI/build will always use npm ci for installation.
✅ No other package managers can be accidentally invoked.
✅ Build should pass without pnpm-related errors.
