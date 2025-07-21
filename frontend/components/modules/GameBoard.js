import React from 'react';
import { View, StyleSheet, Text } from 'react-native';
import { PATH_MAP, SAFE_SPOTS } from '../../constants/game';

// Define COLORS directly in the component to avoid import issues and crashes.
const COLORS = {
  red: '#D32F2F',
  green: '#388E3C',
  blue: '#1976D2',
  yellow: '#FBC02D',
};

// Semi-transparent colors for player bases
const TRANSPARENT_COLORS = {
  red: 'rgba(211, 47, 47, 0.4)',
  green: 'rgba(56, 142, 60, 0.4)',
  blue: 'rgba(25, 118, 210, 0.4)',
  yellow: 'rgba(251, 192, 45, 0.4)',
};
import Pawn from '../shared/Pawn';

// --- CONSTANTS FOR VISUAL CUES ---

const ARROW_ROTATIONS = {
  red: '0deg',    // Points up
  green: '90deg', // Points right
  yellow: '180deg',// Points down
  blue: '270deg', // Points left
};

// Absolute indices on MAIN_PATH_COORDS for the starting cells of each color.
// This is where the arrow indicating the start position is placed.
const HOME_STRETCH_ENTRANCES = {
  red: 41,
  yellow: 13,
  green: 55,
  blue: 27,
};

// --- HELPER COMPONENTS ---

const Arrow = ({ color }) => (
  <View style={{ transform: [{ rotate: ARROW_ROTATIONS[color] }] }}>
    <Text style={{ color: COLORS[color], fontSize: 12, fontWeight: 'bold' }}>▲</Text>
  </View>
);

const GRID_SIZE = 15;

const MAIN_PATH_COORDS = [
  // Path segment for Green player's side (bottom-left)
  [6, 1], [6, 2], [6, 3], [6, 4], [6, 5], [6, 6], // 0-5 (new corner at 5)
  // Path segment for Yellow player's side (top-left)
  [5, 6], [4, 6], [3, 6], [2, 6], [1, 6], [0, 6], [0, 7], [0, 8], // 6-13
  [1, 8], [2, 8], [3, 8], [4, 8], [5, 8], [6, 8], // 14-19 (new corner at 19)
  // Path segment for Blue player's side (top-right)
  [6, 9], [6, 10], [6, 11], [6, 12], [6, 13], [6, 14], [7, 14], [8, 14], // 20-27
  [8, 13], [8, 12], [8, 11], [8, 10], [8, 9], [8, 8], // 28-33 (new corner at 33)
  // Path segment for Red player's side (bottom-right)
  [9, 8], [10, 8], [11, 8], [12, 8], [13, 8], [14, 8], [14, 7], [14, 6], // 34-41
  [13, 6], [12, 6], [11, 6], [10, 6], [9, 6], [8, 6], // 42-47 (new corner at 47)
  // Final path segment leading back to Green's start
  [8, 5], [8, 4], [8, 3], [8, 2], [8, 1], [8, 0], [7, 0], [6, 0] // 48-55
];

const HOME_STRETCH_COORDS = {
  yellow: [[1, 7], [2, 7], [3, 7], [4, 7]],
  blue: [[7, 13], [7, 12], [7, 11], [7, 10]],
  red: [[13, 7], [12, 7], [11, 7], [10, 7]],
  green: [[7, 1], [7, 2], [7, 3], [7, 4]],
};

const generateBoardLayout = (pawns, currentPlayer, diceValue) => {
  const layout = Array.from({ length: GRID_SIZE * GRID_SIZE }, () => ({ type: 'empty', pawns: [] }));

  const setCell = (row, col, cellData) => {
    const index = row * GRID_SIZE + col;
    layout[index] = { ...layout[index], ...cellData };
  };

  // 1. Draw static board elements (bases, paths, goal)
  const areas = {
    green: { base: [0, 0] },
    yellow: { base: [0, 9] },
    blue: { base: [9, 9] },
    red: { base: [9, 0] },
  };

  for (const color in areas) {
    const { base } = areas[color];
    for (let r = 0; r < 6; r++) {
      for (let c = 0; c < 6; c++) {
        setCell(base[0] + r, base[1] + c, { type: 'base', color });
      }
    }
    HOME_STRETCH_COORDS[color].forEach(([r, c]) => {
      setCell(r, c, { type: 'path', color });
    });
  }

  for (let r = 6; r < 9; r++) for (let c = 6; c < 9; c++) setCell(r, c, { type: 'goal' });
  MAIN_PATH_COORDS.forEach(([r, c], pathIndex) => setCell(r, c, { type: 'path', color: 'path', pathIndex }));

    // Mark all safe spots defined in constants
  SAFE_SPOTS.forEach(spotIndex => {
    const [r, c] = MAIN_PATH_COORDS[spotIndex];
    setCell(r, c, { isSafe: true });
  });

  // Mark start cells for each player
  for (const color in PATH_MAP) {
    const startPosIndex = PATH_MAP[color].start;
    const [r, c] = MAIN_PATH_COORDS[startPosIndex];
    setCell(r, c, { isStartFor: color });
  }

  // 3. Add visual cues (arrows and highlights)
  for (const color in HOME_STRETCH_ENTRANCES) {
    const pathIndex = HOME_STRETCH_ENTRANCES[color];
    const [r, c] = MAIN_PATH_COORDS[pathIndex];
    // Ensure we don't overwrite the cell type, just add the arrow
    const index = r * GRID_SIZE + c;
    layout[index].homeStretchEntranceFor = color;
  }

  const playerHasPawnsAtHome = pawns.some(p => p.color === currentPlayer && p.position === -1);
  if (diceValue === 6 && playerHasPawnsAtHome) {
    const startPosIndex = PATH_MAP[currentPlayer].start;
    const [r, c] = MAIN_PATH_COORDS[startPosIndex];
    const index = r * GRID_SIZE + c;
    layout[index].isHighlighted = true;
  }

  // 2. Place pawns on the generated board
  pawns.forEach(pawn => {
    // 'start' pozisyonunu da 'base' (-1) olarak kabul et
    if (pawn.position === -1 || pawn.position === 'start') { // In base
      const { base } = areas[pawn.color];
      // Hem 'start' hem de -1 pozisyonundaki piyonları say
      const pawnsInBase = pawns.filter(p => p.color === pawn.color && (p.position === -1 || p.position === 'start'));
      const pawnIndex = pawnsInBase.findIndex(p => p.id === pawn.id);
      const pawnSpots = [[1, 1], [1, 4], [4, 1], [4, 4]]; // Evdeki 4 piyonun konumu
      if (pawnIndex !== -1) {
        const [r, c] = pawnSpots[pawnIndex];
        layout[(base[0] + r) * GRID_SIZE + (base[1] + c)].pawns.push(pawn);
      }
    } else if (pawn.position >= 0 && pawn.position <= 55) { // On main path
      const absPos = PATH_MAP[pawn.color].path[pawn.position];
      const coords = MAIN_PATH_COORDS[absPos];
      if (coords) {
        const [r, c] = coords;
        layout[r * GRID_SIZE + c].pawns.push(pawn);
      } else {
        console.error(`Invalid coordinates for main path at position: ${pawn.position}`);
      }
    } else if (pawn.position >= 56 && pawn.position <= 59) { // On home stretch
      const stretchIndex = pawn.position - 56; // Corrected index calculation
      const coords = HOME_STRETCH_COORDS[pawn.color][stretchIndex];
      if (coords) {
        const [r, c] = coords;
        layout[r * GRID_SIZE + c].pawns.push(pawn);
      } else {
        console.error(`Invalid coordinates for home stretch at position: ${pawn.position}`);
      }
    } // Pawns at position 60 (goal) are not rendered on the board
  });

  return layout;
};

const GameBoard = ({ pawns, onPawnPress, currentPlayer, diceValue, playersInfo, style }) => {
  const boardLayout = generateBoardLayout(pawns, currentPlayer, diceValue);

  return (
    <View style={[styles.board, style]}>
      {boardLayout.map((cell, index) => {
        const backgroundColor =
          cell.type === 'base' ? TRANSPARENT_COLORS[cell.color] : // Use transparent colors for bases
          cell.type === 'path' ? (cell.color === 'path' ? 'white' : COLORS[cell.color]) : // Use solid colors for home stretches
          cell.type === 'goal' ? 'rgba(224, 224, 224, 0.3)' : // More transparent goal
          'transparent'; // Default to transparent to show the wood background

        const cellStyle = [styles.cell, { backgroundColor }];
        if (cell.isHighlighted) {
          cellStyle.push(styles.highlightedCell);
        }

        const row = Math.floor(index / GRID_SIZE);
        const col = index % GRID_SIZE;

        // Logic to remove internal borders for player base areas for a seamless look.
        if (cell.type === 'base') {
          const style = {};
          // Check top neighbor
          if (row > 0) {
            const topNeighbor = boardLayout[(row - 1) * GRID_SIZE + col];
            if (topNeighbor.type === 'base' && topNeighbor.color === cell.color) {
              style.borderTopWidth = 0;
            }
          }
          // Check bottom neighbor
          if (row < GRID_SIZE - 1) {
            const bottomNeighbor = boardLayout[(row + 1) * GRID_SIZE + col];
            if (bottomNeighbor.type === 'base' && bottomNeighbor.color === cell.color) {
              style.borderBottomWidth = 0;
            }
          }
          // Check left neighbor
          if (col > 0) {
            const leftNeighbor = boardLayout[row * GRID_SIZE + (col - 1)];
            if (leftNeighbor.type === 'base' && leftNeighbor.color === cell.color) {
              style.borderLeftWidth = 0;
            }
          }
          // Check right neighbor
          if (col < GRID_SIZE - 1) {
            const rightNeighbor = boardLayout[row * GRID_SIZE + (col + 1)];
            if (rightNeighbor.type === 'base' && rightNeighbor.color === cell.color) {
              style.borderRightWidth = 0;
            }
          }
          cellStyle.push(style);
        }

        return (
          <View key={index} style={cellStyle}>
            {cell.homeStretchEntranceFor && !cell.pawns.length && <Arrow color={cell.homeStretchEntranceFor} />}
            {cell.pawns.map(pawn => (
              <Pawn key={pawn.id} color={pawn.color} onPress={() => onPawnPress(pawn.id)} />
            ))}
          </View>
        );
      })}
      {playersInfo && (
        <>
          {playersInfo.red && <Text style={[styles.nickname, styles.nicknameRed]}>{playersInfo.red.nickname}</Text>}
          {playersInfo.green && <Text style={[styles.nickname, styles.nicknameGreen]}>{playersInfo.green.nickname}</Text>}
          {playersInfo.yellow && <Text style={[styles.nickname, styles.nicknameYellow]}>{playersInfo.yellow.nickname}</Text>}
          {playersInfo.blue && <Text style={[styles.nickname, styles.nicknameBlue]}>{playersInfo.blue.nickname}</Text>}
        </>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  cellNumber: {
    position: 'absolute',
    fontSize: 9,
    fontWeight: 'bold',
    color: 'black',
    opacity: 0.6,
  },
  board: {
    width: '100%',
    height: '100%',
    flexDirection: 'row',
    flexWrap: 'wrap',
    position: 'relative',
  },
  cell: {
    width: `${100 / GRID_SIZE}%`,
    height: `${100 / GRID_SIZE}%`,
    borderColor: '#999',
    borderTopWidth: 0.5,
    borderBottomWidth: 0.5,
    borderLeftWidth: 0.5,
    borderRightWidth: 0.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  highlightedCell: {
    borderColor: '#BDBDBD', // A light gray for subtle division
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    elevation: 5, // for Android shadow
    shadowColor: 'gold', // for iOS shadow
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 3,
  },
  nickname: {
    position: 'absolute',
    fontWeight: 'bold',
    color: '#000',
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    padding: 2,
    borderRadius: 3,
    fontSize: 12,
  },
  nicknameRed: { bottom: '25%', left: '10%' },
  nicknameGreen: { top: '25%', left: '10%' },
  nicknameYellow: { top: '25%', right: '10%' },
  nicknameBlue: { bottom: '25%', right: '10%' },
});

export default GameBoard;
