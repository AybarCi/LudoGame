const HOME_POSITIONS = {
    red: [-1, -2, -3, -4],
    green: [-5, -6, -7, -8],
    blue: [-9, -10, -11, -12],
    yellow: [-13, -14, -15, -16],
};

// The position of a pawn is its INDEX in its color's specific path (0-57).
// 0 is the start of the path, 51 is the last square on the main loop for that color.
// 52-57 are the home stretch squares.
// 58 is the goal.

const PATH_LENGTH = 52; // Number of steps on the main loop
const HOME_STRETCH_LENGTH = 6; // Number of steps in the home stretch
const TOTAL_PATH_LENGTH = PATH_LENGTH + HOME_STRETCH_LENGTH; // 58
const GOAL_POSITION_INDEX = 58;

// Each color's starting position on the global 52-step path.
const START_OFFSET = {
    red: 0,
    green: 13,
    blue: 26,
    yellow: 39,
};

// Global safe spots, identified by their position on the 52-step main path.
const SAFE_SPOTS_GLOBAL = [0, 8, 13, 21, 26, 34, 39, 47];

module.exports = { 
    HOME_POSITIONS,
    PATH_LENGTH,
    HOME_STRETCH_LENGTH,
    TOTAL_PATH_LENGTH,
    GOAL_POSITION_INDEX,
    START_OFFSET,
    SAFE_SPOTS_GLOBAL,
};
