export default {
  expo: {
    name: "Ludo Turco",
    slug: "ludo-turco-dev",
    version: "1.0.0",
    scheme: "ludoturco", // Linking için scheme
    orientation: "portrait",
    icon: "./assets/images/icon.png",
    userInterfaceStyle: "automatic",
    newArchEnabled: true, // ENABLED: Required for Reanimated
    ios: {
      supportsTablet: false, // Disable tablet support for faster builds
      bundleIdentifier: "com.aybarc.ludoturco",
      icon: "./assets/images/icon.png", // iOS icon eklendi
      splash: {
        backgroundColor: "#1a1a2e",
        image: "./assets/images/splash-logos/logo-large.png",
        resizeMode: "contain",
        tabletImage: "./assets/images/splash-logos/logo-large.png"
      },
      infoPlist: {
        ITSAppUsesNonExemptEncryption: false,
        NSCameraUsageDescription: 'Uygulama kamera erişimi gerekiyor',
        NSPhotoLibraryUsageDescription: 'Fotoğraf galerisine erişim gerekiyor',
        NSPhotoLibraryAddUsageDescription: 'Fotoğraf kaydetmek için erişim gerekiyor',
        NSMicrophoneUsageDescription: 'Mikrofon erişimi gerekiyor',
        NSUserTrackingUsageDescription: 'Reklamları kişiselleştirmek ve uygulama deneyimini iyileştirmek için izleme izni gerekiyor',
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
      splash: {
        backgroundColor: "#1a1a2e",
        image: "./assets/images/splash-logos/logo-large.png",
        resizeMode: "contain",
        mdpi: "./assets/images/splash-logos/logo-mdpi.png",
        hdpi: "./assets/images/splash-logos/logo-hdpi.png",
        xhdpi: "./assets/images/splash-logos/logo-xhdpi.png",
        xxhdpi: "./assets/images/splash-logos/logo-xxhdpi.png",
        xxxhdpi: "./assets/images/splash-logos/logo-xxxhdpi.png"
      },
      edgeToEdgeEnabled: false, // Disable edge-to-edge for faster builds
      package: "com.aybarc.ludoturco",
      // CAMERA iznini kaldırmak ve yalnızca gerekli izinleri talep etmek için
      // Android izinlerini açıkça tanımlıyoruz.
      permissions: [
        "INTERNET",
        "ACCESS_NETWORK_STATE",
        // Eski cihazlarla geriye uyumluluk (Android < 13)
        "READ_EXTERNAL_STORAGE"
      ],
      // Google Mobile Ads App ID - Sabit değerlerle build pipeline sorunlarını önler
      googleMobileAdsAppId: "ca-app-pub-1743455537598911~1127881197",
      // Android config - Google Mobile Ads için gerekli
      config: {
        googleMobileAdsAppId: "ca-app-pub-1743455537598911~1127881197"
      }
    },
    web: {
      bundler: "metro",
      output: "static",
      favicon: "./assets/images/favicon.png"
    },
    plugins: [
      "expo-router",
      "expo-font",
      [
        "expo-splash-screen",
        {
          "backgroundColor": "#1a1a2e",
          "image": "./assets/images/logo.png",
          "imageWidth": 200,
          "resizeMode": "contain",
          "dark": {
            "backgroundColor": "#1a1a2e",
            "image": "./assets/images/logo.png"
          }
        }
      ],
      [
        "expo-build-properties",
        {
          "ios": {
            "useFrameworks": "static",
            "deploymentTarget": "15.1",
            "flipper": false
          }
        }
      ],
      [
        "react-native-google-mobile-ads",
        {
          "android_app_id": "ca-app-pub-1743455537598911~1127881197",
          "ios_app_id": "ca-app-pub-1743455537598911~5406887612"
        }
      ]

    ],
    experiments: {
      typedRoutes: true
    },
    // Disable heavy features in dev
    extra: {
      __DEV__: false, // Gerçek reklamlar için dev modunu kapat
      adsEnabled: false, // Reklamlar aktif
      // Optimize for development
      devMode: false,
      fastRefresh: false,
      // CRASH PREVENTION: Disable potentially problematic features
      disableAnimations: false,
      crashReporting: true,
      eas: {
        projectId: "b8e01f31-8965-439c-a7b9-15d597018d93"
      }
    }
  }
};