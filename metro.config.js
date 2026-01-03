
const { getDefaultConfig } = require('expo/metro-config');
const { FileStore } = require('metro-cache');
const path = require('path');

const config = getDefaultConfig(__dirname);

// ============================================================================
// EXPO SERVER STABILITY CONFIGURATION
// ============================================================================
// This configuration ensures maximum stability and reliability for the
// Metro bundler and Expo development server.
// ============================================================================

// Use file-based cache for better stability
config.cacheStores = [
  new FileStore({ 
    root: path.join(__dirname, 'node_modules', '.cache', 'metro') 
  }),
];

// Increase cache version to force fresh builds when needed
config.cacheVersion = '1.0';

// Configure resolver for better stability
config.resolver = {
  ...config.resolver,
  // Disable package exports if causing issues (can be enabled if needed)
  unstable_enablePackageExports: true,
  // Add source extensions for better resolution
  sourceExts: [
    ...(config.resolver?.sourceExts || []),
  ],
};

// Configure transformer for better error handling
config.transformer = {
  ...config.transformer,
  // Enable inline requires for better performance
  inlineRequires: true,
  // Minify code in production
  minifierConfig: {
    ...config.transformer?.minifierConfig,
  },
};

// Configure server for better stability
config.server = {
  ...config.server,
  // Increase timeout for slow connections
  enhanceMiddleware: (middleware) => {
    return (req, res, next) => {
      // Set longer timeout for requests
      req.setTimeout(60000); // 60 seconds
      res.setTimeout(60000); // 60 seconds
      
      // Log requests in development
      if (process.env.NODE_ENV === 'development') {
        console.log(`[Metro] ${req.method} ${req.url}`);
      }
      
      return middleware(req, res, next);
    };
  },
};

// Configure watcher for better file watching
config.watchFolders = [
  ...(config.watchFolders || []),
  // Add any additional folders to watch
];

// Log configuration in development
if (process.env.NODE_ENV === 'development') {
  console.log('[Metro] Configuration loaded successfully');
  console.log('[Metro] Cache directory:', path.join(__dirname, 'node_modules', '.cache', 'metro'));
  console.log('[Metro] Package exports enabled:', config.resolver.unstable_enablePackageExports);
}

module.exports = config;
