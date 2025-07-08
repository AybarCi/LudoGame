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
