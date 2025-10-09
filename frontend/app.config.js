export default {
  expo: {
    name: "Ludo Turco Dev",
    slug: "ludo-turco-dev",
    scheme: "kizmabirader",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/images/icon.png",
    userInterfaceStyle: "automatic",
    newArchEnabled: false, // Disable new architecture for faster dev builds
    ios: {
      supportsTablet: false, // Disable tablet support for faster builds
      bundleIdentifier: "com.aybarc.frontend.dev"
    },
    android: {
      adaptiveIcon: {
        foregroundImage: "./assets/images/logo.png",
        backgroundColor: "#1a1a2e"
      },
      edgeToEdgeEnabled: false, // Disable edge-to-edge for faster builds
      package: "com.aybarc.frontend.dev"
    },
    web: {
      bundler: "metro",
      output: "static",
      favicon: "./assets/images/favicon.png"
    },
    plugins: [
      "expo-router",
      [
        "expo-splash-screen",
        {
          image: "./assets/images/logo.png",
          imageWidth: 200,
          resizeMode: "contain",
          backgroundColor: "#6E00B3"
        }
      ],
      "expo-font"
      // Remove heavy plugins in dev mode
    ],
    experiments: {
      typedRoutes: false // Disable for faster builds
    },
    // Development optimizations for faster loading
    packagerOpts: {
      sourceExts: ['js', 'json', 'ts', 'tsx', 'jsx'],
      assetExts: ['png', 'jpg', 'gif'], // Only essential assets
      minify: false, // Disable minification for faster dev builds
    },
    // Disable heavy features in dev
    extra: {
      __DEV__: true,
      adsEnabled: false,
      // Optimize for development
      devMode: true,
      fastRefresh: true,
    }
  }
};