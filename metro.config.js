
const { getDefaultConfig } = require('expo/metro-config');
const { FileStore } = require('metro-cache');
const path = require('path');

/**
 * Metro bundler configuration for Expo
 * 
 * Developer note: If you encounter build issues or stale cache problems:
 * - Run: npx expo start --clear
 * - Or manually delete: node_modules/.cache/metro
 */

const config = getDefaultConfig(__dirname);

config.resolver.unstable_enablePackageExports = true;

// Use turborepo to restore the cache when possible
config.cacheStores = [
    new FileStore({ root: path.join(__dirname, 'node_modules', '.cache', 'metro') }),
  ];

module.exports = config;
