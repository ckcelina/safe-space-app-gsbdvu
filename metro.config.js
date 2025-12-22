
const { getDefaultConfig } = require('expo/metro-config');
const { FileStore } = require('metro-cache');
const path = require('path');

// Force offline/local mode to prevent tunnel attempts
process.env.EXPO_OFFLINE = '1';
process.env.EXPO_NO_DOTENV = '1';

const config = getDefaultConfig(__dirname);

// Use turborepo to restore the cache when possible
config.cacheStores = [
    new FileStore({ root: path.join(__dirname, 'node_modules', '.cache', 'metro') }),
  ];

module.exports = config;
