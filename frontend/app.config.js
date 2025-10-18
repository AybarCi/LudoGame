export default {
  expo: {
    name: "Ludo Turco",
    slug: "ludo-turco-dev",
    version: "1.0.0",
    scheme: "ludoturco", // Linking için scheme
    orientation: "portrait",
    icon: "./assets/images/icon.png",
    userInterfaceStyle: "automatic",
    newArchEnabled: false, // DISABLED: Fix folly/coro error for iOS build
    ios: {
      supportsTablet: false, // Disable tablet support for faster builds
      bundleIdentifier: "com.aybarc.ludoturco",
      infoPlist: {
        ITSAppUsesNonExemptEncryption: false,
        NSCameraUsageDescription: 'Uygulama kamera erişimi gerekiyor',
        NSPhotoLibraryUsageDescription: 'Fotoğraf galerisine erişim gerekiyor',
        NSPhotoLibraryAddUsageDescription: 'Fotoğraf kaydetmek için erişim gerekiyor',
        NSMicrophoneUsageDescription: 'Mikrofon erişimi gerekiyor',
        // Network ve multiplayer için
        NSLocalNetworkUsageDescription: 'Oyun bağlantıları için yerel ağ erişimi gerekiyor',
        // Arkaplanda müzik/oyun sesleri için
        UIBackgroundModes: ['audio', 'fetch'],
        // Push bildirimleri (isteğe bağlı)
        // NSUserNotificationUsageDescription: 'Oyun bildirimleri için izin gerekiyor',
      }
    },
    android: {
      adaptiveIcon: {
        foregroundImage: "./assets/images/logo.png",
        backgroundColor: "#1a1a2e"
      },
      edgeToEdgeEnabled: false, // Disable edge-to-edge for faster builds
      package: "com.aybarc.ludoturco"
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
          "image": "./assets/images/splash-icon.png",
          "imageWidth": 200,
          "resizeMode": "contain",
          "backgroundColor": "#0a0a0a"
        }
      ],
      "expo-font",
      [
        "expo-build-properties",
        {
          "ios": {
            "useFrameworks": "static",
            "deploymentTarget": "15.0",
            "flipper": false
          }
        }
      ]
    ],
    experiments: {
      typedRoutes: true
    },
    // Disable heavy features in dev
    extra: {
      __DEV__: false, // Gerçek reklamlar için dev modunu kapat
      adsEnabled: false, // CRASH PREVENTION: Reklamları geçici olarak kapat
      // Optimize for development
      devMode: false,
      fastRefresh: false,
      // CRASH PREVENTION: Disable potentially problematic features
      disableAnimations: true,
      crashReporting: true,
      eas: {
        projectId: "b8e01f31-8965-439c-a7b9-15d597018d93"
      }
    }
  },
  // AdMob Configuration
  "react-native-google-mobile-ads": {
    "android_app_id": "ca-app-pub-1743455537598911~1127881197",
    "ios_app_id": "ca-app-pub-1743455537598911~5406887612"
  }
};