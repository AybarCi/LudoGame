export const COLORS = {
  red: '#d9534f',
  green: '#5cb85c',
  yellow: '#f0ad4e',
  blue: '#5bc0de',
  white: '#ffffff',
  gray: '#ffffff',
  path: '#ffffff',
  safe: '#ffffff',
};

export const PLAYER_COLORS = ['red', 'green', 'yellow', 'blue'];

// The board path is a sequence of 52 cells.
// Each player has a specific starting point on this path.
// Safe spots based on the standard Ludo board layout
// SAFE_SPOTS are absolute indices on the MAIN_PATH_COORDS array.
// Includes the starting square for each color and the spot 8 squares ahead.
// SAFE_SPOTS are absolute indices on the MAIN_PATH_COORDS array.
// Includes the starting square for each color and the spot 8 squares ahead.
// SAFE_SPOTS are absolute indices on the MAIN_PATH_COORDS array.
// Includes the starting square for each color and the spot 8 squares ahead.
// SAFE_SPOTS are the absolute indices of the 'castle' squares on the board.
// The starting squares are NOT safe, allowing for captures on them.
// Safe spots are calculated to be 9 squares ahead of each player's start.
// There are no universal safe spots in this version of the game.
// Safety is determined dynamically based on whether a pawn is on its own start square.
export const SAFE_SPOTS = [];

export const PATH_MAP = {
  // NOTE: Final user-specified calibration for the 56-square path.
  red: {
    start: 41,
    homeEntry: 40, // The absolute square number before the home stretch.
    path: Array.from({ length: 56 }, (_, i) => (41 + i) % 56),
  },
  green: {
    start: 55,
    homeEntry: 54, // The absolute square number before the home stretch.
    path: Array.from({ length: 56 }, (_, i) => (55 + i) % 56),
  },
  yellow: {
    start: 13,
    homeEntry: 12, // The absolute square number before the home stretch.
    path: Array.from({ length: 56 }, (_, i) => (13 + i) % 56),
  },
  blue: {
    start: 27,
    homeEntry: 26, // The absolute square number before the home stretch.
    path: Array.from({ length: 56 }, (_, i) => (27 + i) % 56),
  },
};

// --- Development URL Auto-Detection and Overrides ---
// Rule: Fiziki cihazlarla test ediliyor. Bu nedenle, cihazdan erişilebilir IP'yi otomatik algıla.
// Priority order:
// 1) EXPO_PUBLIC_API_URL / EXPO_PUBLIC_SOCKET_URL (explicit overrides)
// 2) Auto-detected host from scriptURL (Metro dev server) or hostname
// 3) Fallback to 192.168.1.134 (updated IP)

import { NativeModules, Platform } from 'react-native';

// Environment-based configuration
const getEnvironmentConfig = () => {
  // Production URLs - gerçek production URL'leri
  const PRODUCTION_API_URL = 'https://ludoturcoapi.istekbilisim.com';
  const PRODUCTION_SOCKET_URL = 'https://ludoturcoapi.istekbilisim.com';
  
  // Development için local IP detection (sadece development modunda)
  const getLocalHost = () => {
    try {
      const scriptURL = NativeModules?.SourceCode?.scriptURL;
      if (scriptURL) {
        const url = new URL(scriptURL);
        if (url.hostname && url.hostname !== 'localhost' && url.hostname !== '127.0.0.1') {
          return url.hostname;
        }
      }
      // Development için localhost fallback
      return 'localhost';
    } catch (e) {
      return 'localhost';
    }
  };

  const DEFAULT_PORT = 3001;
  const localHost = getLocalHost();
  
  // Environment variable'lar öncelikli, sonra environment'a göre default değerler
  return {
    apiUrl: process.env.EXPO_PUBLIC_API_URL || 
            (__DEV__ ? `http://${localHost}:${DEFAULT_PORT}` : PRODUCTION_API_URL),
    socketUrl: process.env.EXPO_PUBLIC_SOCKET_URL || 
               (__DEV__ ? `http://${localHost}:${DEFAULT_PORT}` : PRODUCTION_SOCKET_URL)
  };
};

const config = getEnvironmentConfig();

export const API_BASE_URL = config.apiUrl;
export const SOCKET_URL = config.socketUrl;

export const getApiUrl = (path = '') => `${API_BASE_URL}${path ? path.startsWith('/') ? path : `/${path}` : ''}`;
