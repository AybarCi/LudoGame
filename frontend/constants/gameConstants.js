export const COLORS = ['red', 'green', 'yellow', 'blue'];
export const PAWN_COUNT = 4;

// Board layout
export const PATH_LENGTH = 52; // Main path around the board
export const HOME_STRETCH_LENGTH = 6; // Path from main track to goal
export const GOAL_START_INDEX = PATH_LENGTH + HOME_STRETCH_LENGTH; // 58. The first of the 4 goal slots.

// Start positions for each color on the 52-tile path (global index)
export const START_OFFSET = {
  red: 0,
  green: 13,
  yellow: 26,
  blue: 39,
};

// The local position index where a pawn enters its final home stretch
export const HOME_STRETCH_ENTRY_POINT = 51; // Local position 50 is the last square on main path before turning home.

// Global indices of squares that are safe from capture
export const SAFE_SPOTS_GLOBAL = [0, 8, 13, 21, 26, 34, 39, 47];

/**
 * Checks if a player has won by getting all their pawns into the goal slots.
 * @param {number[]} playerPositions - Array of a single player's pawn positions.
 * @returns {boolean} - True if the player has won.
 */
export const isGameWon = (playerPositions) => {
    const goalPawns = playerPositions.filter(pos => pos >= GOAL_START_INDEX);
    return goalPawns.length === PAWN_COUNT;
};
