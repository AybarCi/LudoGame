// Bu dosya, sunucu ve istemci arasındaki oyun sabitlerini senkronize eder.
// Tek doğru kaynak frontend/constants/game.js dosyasıdır.

const PLAYER_COLORS = ['red', 'green', 'yellow', 'blue'];

// Corresponds to the four squares in each player's base.
const HOME_POSITIONS = {
    red: [100, 101, 102, 103],
    green: [104, 105, 106, 107],
    yellow: [108, 109, 110, 111],
    blue: [112, 113, 114, 115],
};

// The absolute index on the 56-square path where each color starts.
const START_POSITIONS = {
    red: 41,
    green: 55,
    yellow: 13,
    blue: 27,
};

// The absolute index on the 56-square path just before entering the home stretch.
const HOME_ENTRANCE = {
    red: 40,
    green: 54,
    yellow: 12,
    blue: 26,
};

const PATH_LENGTH = 56; // Total squares on the main circular path.
const HOME_STRETCH_LENGTH = 6; // 5 squares in home path + 1 final goal square.
const GOAL_POSITION = PATH_LENGTH + HOME_STRETCH_LENGTH; // A position value that signifies a pawn has finished.

// Maps a player's relative progress (0-55) to an absolute position on the 56-square path.
const PATH_MAP = {
    red: Array.from({ length: PATH_LENGTH }, (_, i) => (START_POSITIONS.red + i) % PATH_LENGTH),
    green: Array.from({ length: PATH_LENGTH }, (_, i) => (START_POSITIONS.green + i) % PATH_LENGTH),
    yellow: Array.from({ length: PATH_LENGTH }, (_, i) => (START_POSITIONS.yellow + i) % PATH_LENGTH),
    blue: Array.from({ length: PATH_LENGTH }, (_, i) => (START_POSITIONS.blue + i) % PATH_LENGTH),
};

// In this ruleset, there are no universally safe spots. 
// A player's own start square is considered safe only for their own pawns.
// This logic is handled within getValidMoves, not with a static list.
const SAFE_SPOTS = [];

module.exports = {
    PLAYER_COLORS,
    HOME_POSITIONS,
    START_POSITIONS,
    HOME_ENTRANCE,
    PATH_LENGTH,
    HOME_STRETCH_LENGTH,
    GOAL_POSITION,
    PATH_MAP,
    SAFE_SPOTS,
};
