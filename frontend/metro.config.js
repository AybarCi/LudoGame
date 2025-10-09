const { getDefaultConfig } = require('expo/metro-config');

module.exports = (async () => {
  const config = await getDefaultConfig(__dirname);
  
  // Optimize for faster development builds
  config.transformer = {
    ...config.transformer,
    minifierConfig: {
      mangle: false,
      output: {
        ascii_only: true,
        quote_keys: true,
        space_colon: false,
      },
      sourceMap: {
        includeSources: false,
      },
      toplevel: false,
      warnings: false,
    },
  };

  // Optimize resolver for faster resolution
  config.resolver = {
    ...config.resolver,
    // Cache resolution results
    useWatchman: true,
    // Blacklist heavy modules that might slow down bundling
    blacklistRE: /.*\/(test|__tests__|__mocks__)\/.*/,
  };

  // Handle web-specific module resolution for lottie-react-native
  if (process.env.NODE_ENV === 'web') {
    config.resolver.resolveRequest = (context, moduleName, platform) => {
      // Handle lottie-react-native specifically for web
      if (moduleName === 'lottie-react-native' || moduleName.includes('lottie-react-native')) {
        return {
          filePath: require.resolve('./components/shared/LottieWrapper.js'),
          type: 'sourceFile',
        };
      }
      
      // Default resolution for other modules
      return context.resolveRequest(context, moduleName, platform);
    };
  }

  // Reduce memory usage and improve performance
  config.maxWorkers = 2; // Limit workers for better memory management
  
  return config;
})();