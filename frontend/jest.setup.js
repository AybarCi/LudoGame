// Jest setup file for React Native testing

// Mock react-native modules
jest.mock('react-native/Libraries/TurboModule/TurboModuleRegistry', () => ({
  getEnforcing: jest.fn(() => ({})),
  get: jest.fn(() => ({})),
}));

jest.mock('react-native', () => {
  const RN = jest.requireActual('react-native');
  return {
    ...RN,
    Platform: {
      OS: 'ios',
      Version: 14,
      select: jest.fn((obj) => obj.ios),
    },
    Dimensions: {
      get: jest.fn(() => ({ width: 375, height: 667 })),
    },
    NativeModules: {},
    NativeEventEmitter: jest.fn(),
  };
});

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => ({
  setItem: jest.fn(),
  getItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
}));

// Mock expo-router
jest.mock('expo-router', () => ({
  router: {
    replace: jest.fn(),
    push: jest.fn(),
    back: jest.fn(),
  },
  useRouter: () => ({
    replace: jest.fn(),
    push: jest.fn(),
    back: jest.fn(),
  }),
  useSegments: () => [],
  Stack: {
    Screen: () => null,
  },
  SplashScreen: {
    preventAutoHideAsync: jest.fn(),
    hideAsync: jest.fn(),
  },
}));

// Mock expo-font
jest.mock('expo-font', () => ({
  loadAsync: jest.fn(),
  isLoaded: jest.fn(() => true),
}));

// Mock expo-splash-screen
jest.mock('expo-splash-screen', () => ({
  preventAutoHideAsync: jest.fn(),
  hideAsync: jest.fn(),
}));

// Mock @expo-google-fonts/poppins
jest.mock('@expo-google-fonts/poppins', () => ({
  Poppins_400Regular: 'Poppins_400Regular',
  Poppins_600SemiBold: 'Poppins_600SemiBold',
  Poppins_700Bold: 'Poppins_700Bold',
  useFonts: () => [true, null],
}));

// Mock react-redux
jest.mock('react-redux', () => ({
  ...jest.requireActual('react-redux'),
  useSelector: jest.fn(),
  useDispatch: () => jest.fn(),
}));

// Global test setup
global.fetch = jest.fn();
global.console = {
  ...console,
  error: jest.fn(),
  warn: jest.fn(),
  log: jest.fn(),
};