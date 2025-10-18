const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

module.exports = (async () => {
  const config = await getDefaultConfig(__dirname);
  
  // Reset to defaults to avoid conflicts
  config.transformer = {
    ...config.transformer,
  };

  config.resolver = {
    ...config.resolver,
    // Fix for LoadingView import error in React Native 0.76+
    resolverMainFields: ['react-native', 'browser', 'main'],
    // Alias the missing LoadingView module to our custom implementation
    extraNodeModules: {
      'react-native/Libraries/Utilities/LoadingView': path.resolve(__dirname, 'LoadingView.js'),
      ...config.resolver.extraNodeModules,
    },
    // Handle platform-specific module resolution
    platforms: ['ios', 'android', 'web'],
    // Block problematic web dependencies for native builds
    blacklistRE: /node_modules\/.*\/.*\.web\.js$/,
    // Add nodeModulesPaths to help with module resolution
    nodeModulesPaths: [
      path.resolve(__dirname, 'node_modules'),
      ...(config.resolver.nodeModulesPaths || []),
    ],
  };

  return config;
})();