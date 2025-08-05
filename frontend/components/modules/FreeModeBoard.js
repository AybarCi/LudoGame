import React, { useState, useEffect } from 'react';
import { View, TouchableOpacity, Text, Dimensions, ImageBackground } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { useSharedValue, useAnimatedStyle, withSpring, withTiming } from 'react-native-reanimated';

const { width, height } = Dimensions.get('window');
const isTablet = width > 768;

// Game constants
const COLORS = {
  red: '#F44336',
  green: '#4CAF50',
  yellow: '#FFEB3B',
  blue: '#2196F3',
  path: '#FFF'
};

const TRANSPARENT_COLORS = {
  red: '#F4433680',
  green: '#4CAF5080',
  yellow: '#FFEB3B80',
  blue: '#2196F380'
};

// Main path coordinates (56 positions around the board)
const MAIN_PATH_COORDS = [
  // Starting from green start (top-left going clockwise)
  [6, 1], [6, 2], [6, 3], [6, 4], [6, 5], [6, 6], [5, 6], [4, 6], [3, 6], [2, 6], [1, 6], [0, 6], [0, 7], [0, 8],
  [1, 8], [2, 8], [3, 8], [4, 8], [5, 8], [6, 8], [6, 9], [6, 10], [6, 11], [6, 12], [6, 13], [6, 14], [7, 14], [8, 14],
  [8, 13], [8, 12], [8, 11], [8, 10], [8, 9], [8, 8], [9, 8], [10, 8], [11, 8], [12, 8], [13, 8], [14, 8], [14, 7], [14, 6],
  [13, 6], [12, 6], [11, 6], [10, 6], [9, 6], [8, 6], [8, 5], [8, 4], [8, 3], [8, 2], [8, 1], [8, 0], [7, 0], [6, 0]
];

// Home stretch coordinates for each color
const HOME_STRETCH_COORDS = {
  green: [[7, 1], [7, 2], [7, 3], [7, 4], [7, 5]],
  yellow: [[1, 7], [2, 7], [3, 7], [4, 7], [5, 7]],
  blue: [[7, 13], [7, 12], [7, 11], [7, 10], [7, 9]],
  red: [[13, 7], [12, 7], [11, 7], [10, 7], [9, 7]]
};

// Path starting positions for each color
const PATH_MAP = {
  green: { start: 0 },
  yellow: { start: 14 },
  blue: { start: 28 },
  red: { start: 42 }
};

// Safe spots on the main path
const SAFE_SPOTS = [0, 14, 28, 42];

// Home stretch entrance positions
const HOME_STRETCH_ENTRANCES = {
  green: 51,
  yellow: 12,
  blue: 25,
  red: 38
};

const GRID_SIZE = 15;

// Create board layout with cell types
const createBoardLayout = () => {
  const layout = new Array(GRID_SIZE * GRID_SIZE).fill({ type: 'empty' });
  
  // Mark player bases
  const bases = {
    green: { start: [0, 0], size: 6 },
    yellow: { start: [0, 9], size: 6 },
    blue: { start: [9, 9], size: 6 },
    red: { start: [9, 0], size: 6 }
  };
  
  Object.entries(bases).forEach(([color, base]) => {
    for (let r = base.start[0]; r < base.start[0] + base.size; r++) {
      for (let c = base.start[1]; c < base.start[1] + base.size; c++) {
        if (r < GRID_SIZE && c < GRID_SIZE) {
          layout[r * GRID_SIZE + c] = { type: 'base', color };
        }
      }
    }
  });
  
  // Mark center area (3x3 grid in the middle)
  for (let r = 6; r <= 8; r++) {
    for (let c = 6; c <= 8; c++) {
      if (r === 7 && c === 7) {
        layout[r * GRID_SIZE + c] = { type: 'goal' };
      } else {
        layout[r * GRID_SIZE + c] = { type: 'center' };
      }
    }
  }
  
  // Mark main path
  MAIN_PATH_COORDS.forEach((coord, index) => {
    const [row, col] = coord;
    if (row >= 0 && row < GRID_SIZE && col >= 0 && col < GRID_SIZE) {
      layout[row * GRID_SIZE + col] = { 
        type: 'path', 
        position: index,
        isSafe: SAFE_SPOTS.includes(index)
      };
    }
  });
  
  // Mark home stretches
  Object.entries(HOME_STRETCH_COORDS).forEach(([color, coords]) => {
    coords.forEach((coord, index) => {
      const [row, col] = coord;
      if (row >= 0 && row < GRID_SIZE && col >= 0 && col < GRID_SIZE) {
        layout[row * GRID_SIZE + col] = { 
          type: 'home_stretch', 
          color,
          position: 56 + index
        };
      }
    });
  });
  
  // Mark start positions
  Object.entries(PATH_MAP).forEach(([color, info]) => {
    const coord = MAIN_PATH_COORDS[info.start];
    const [row, col] = coord;
    if (row >= 0 && row < GRID_SIZE && col >= 0 && col < GRID_SIZE) {
      const index = row * GRID_SIZE + col;
      layout[index] = { ...layout[index], isStart: true, startColor: color };
    }
  });
  
  return layout;
};

// Free Mode Board Component - Using real Ludo rules and design
const FreeModeBoard = ({ pawns, onPawnPress, currentPlayer, possibleMoves = [], playersInfo = {} }) => {
  const boardLayout = createBoardLayout();
  const [movingPawns, setMovingPawns] = useState(new Set());
  const cellSize = width * 0.06;
  const boardSize = cellSize * GRID_SIZE;
  
  // Convert position to grid coordinates
  const getPositionCoordinates = (position, color) => {
    let coords = [0, 0];
    
    if (position < 0) {
      // Home position - find empty spot in base
      const areas = {
        green: { base: [0, 0] },
        yellow: { base: [0, 9] },
        blue: { base: [9, 9] },
        red: { base: [9, 0] },
      };
      
      const baseArea = areas[color];
      if (baseArea) {
        // Find available spots in base (2x2 grid within 6x6 base)
        const baseSpots = [
          [baseArea.base[0] + 1, baseArea.base[1] + 1],
          [baseArea.base[0] + 1, baseArea.base[1] + 4],
          [baseArea.base[0] + 4, baseArea.base[1] + 1],
          [baseArea.base[0] + 4, baseArea.base[1] + 4]
        ];
        
        // Map position to spot index based on HOME_POSITIONS
        const homePositions = HOME_POSITIONS[color];
        const spotIndex = homePositions.indexOf(position);
        if (spotIndex >= 0 && spotIndex < baseSpots.length) {
          coords = baseSpots[spotIndex];
        } else {
          coords = baseSpots[0]; // fallback
        }
      }
    } else if (position >= 0 && position < MAIN_PATH_COORDS.length) {
      // Main path position
      coords = MAIN_PATH_COORDS[position % MAIN_PATH_COORDS.length];
    } else if (position >= 56 && position <= 59) {
      // Home stretch position
      const homeStretchIndex = position - 56;
      if (HOME_STRETCH_COORDS[color] && HOME_STRETCH_COORDS[color][homeStretchIndex]) {
        coords = HOME_STRETCH_COORDS[color][homeStretchIndex];
      }
    }
    
    return {
      x: coords[1] * cellSize,
      y: coords[0] * cellSize
    };
  };

  // Home position mappings (must match useFreeModeEngine)
  const HOME_POSITIONS = {
    red: [-1, -2, -3, -4],
    blue: [-5, -6, -7, -8],
    green: [-9, -10, -11, -12],
    yellow: [-13, -14, -15, -16]
  };

  // Render individual pawn
  const renderPawn = (pawn) => {
    const position = getPositionCoordinates(pawn.position, pawn.color);
    const isMovable = possibleMoves.some(move => move.id === pawn.id);
    const scale = useSharedValue(1);
    
    const animatedStyle = useAnimatedStyle(() => {
      return {
        transform: [{ scale: scale.value }]
      };
    });

    const handlePress = () => {
      if (isMovable) {
        scale.value = withSpring(1.2, {}, () => {
          scale.value = withSpring(1);
        });
        onPawnPress(pawn.id);
      }
    };

    const pawnColors = {
      red: ['#FF6B6B', '#FF5252'],
      blue: ['#4FC3F7', '#2196F3'],
      green: ['#81C784', '#4CAF50'],
      yellow: ['#FFD54F', '#FFC107']
    };

    return (
      <Animated.View
        key={pawn.id}
        style={[
          {
            position: 'absolute',
            left: position.x - cellSize * 0.15,
            top: position.y - cellSize * 0.15,
            width: cellSize * 0.3,
            height: cellSize * 0.3,
            borderRadius: cellSize * 0.15,
            elevation: isMovable ? 8 : 4,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.3,
            shadowRadius: 4,
          },
          animatedStyle
        ]}
      >
        <TouchableOpacity
          onPress={handlePress}
          disabled={!isMovable}
          style={{
            flex: 1,
            borderRadius: cellSize * 0.15,
            borderWidth: isMovable ? 3 : 2,
            borderColor: isMovable ? '#FFD700' : '#FFF'
          }}
        >
          <LinearGradient
            colors={pawnColors[pawn.color]}
            style={{ flex: 1, borderRadius: cellSize * 0.15, justifyContent: 'center', alignItems: 'center' }}
          >
            <Text style={{
              color: '#FFF',
              fontSize: cellSize * 0.08,
              fontWeight: 'bold'
            }}>
              {pawn.id.slice(-1)}
            </Text>
          </LinearGradient>
        </TouchableOpacity>
      </Animated.View>
    );
  };

  // Render home areas
  const renderHomeAreas = () => {
    const homeColors = {
      red: ['#FFEBEE', '#FFCDD2'],
      blue: ['#E3F2FD', '#BBDEFB'],
      green: ['#E8F5E8', '#C8E6C9'],
      yellow: ['#FFFDE7', '#FFF9C4']
    };

    return Object.keys(homeColors).map(color => {
      const homeArea = {
        red: { x: cellSize * 9, y: 0 },
        blue: { x: cellSize * 9, y: cellSize * 9 },
        green: { x: 0, y: 0 },
        yellow: { x: 0, y: cellSize * 9 }
      };

      return (
        <LinearGradient
          key={`home-${color}`}
          colors={homeColors[color]}
          style={{
            position: 'absolute',
            left: homeArea[color].x,
            top: homeArea[color].y,
            width: cellSize * 6,
            height: cellSize * 6,
            borderRadius: cellSize * 0.3,
            borderWidth: 2,
            borderColor: color === currentPlayer ? '#FFD700' : '#BDBDBD'
          }}
        >
          <Text style={{
            position: 'absolute',
            top: cellSize * 0.1,
            left: cellSize * 0.1,
            color: '#666',
            fontSize: cellSize * 0.12,
            fontWeight: 'bold',
            textTransform: 'capitalize'
          }}>
            {color}
          </Text>
        </LinearGradient>
      );
    });
  };

  return (
    <View style={{
      width: boardSize,
      height: boardSize,
      backgroundColor: '#F5F5F5',
      borderRadius: 20,
      elevation: 10,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 5 },
      shadowOpacity: 0.3,
      shadowRadius: 10,
      alignSelf: 'center',
      marginVertical: 20
    }}>
      <View style={{ flex: 1, borderRadius: 20 }}>
        {/* Render board grid */}
        {Array.from({ length: GRID_SIZE }, (_, row) => (
          <View key={row} style={{ flexDirection: 'row' }}>
            {Array.from({ length: GRID_SIZE }, (_, col) => {
              const cell = boardLayout[row * GRID_SIZE + col];
              return (
                <View
                  key={col}
                  style={[
                    {
                      width: cellSize,
                      height: cellSize,
                      borderWidth: 0.5,
                      borderColor: '#E0E0E0',
                      justifyContent: 'center',
                      alignItems: 'center'
                    },
                    cell.type === 'path' && { backgroundColor: '#FFF8E1' },
                    cell.type === 'home_stretch' && { backgroundColor: TRANSPARENT_COLORS[cell.color] },
                    cell.type === 'base' && { backgroundColor: TRANSPARENT_COLORS[cell.color] },
                    cell.type === 'goal' && { backgroundColor: '#FFD700' },
                    cell.type === 'center' && { backgroundColor: '#E8F5E8' }
                  ]}
                >
                  {/* Safe spot indicator */}
                  {cell.isSafe && (
                    <View style={{
                      width: cellSize * 0.6,
                      height: cellSize * 0.6,
                      borderRadius: cellSize * 0.3,
                      backgroundColor: '#FFD700',
                      justifyContent: 'center',
                      alignItems: 'center'
                    }}>
                      <Text style={{ fontSize: cellSize * 0.1, fontWeight: 'bold' }}>★</Text>
                    </View>
                  )}
                  
                  {/* Start position indicator */}
                  {cell.isStart && (
                    <View style={{
                      position: 'absolute',
                      width: cellSize * 0.3,
                      height: cellSize * 0.3,
                      backgroundColor: COLORS[cell.startColor],
                      borderRadius: cellSize * 0.15,
                      top: cellSize * 0.1,
                      left: cellSize * 0.1,
                      borderWidth: 2,
                      borderColor: '#FFFFFF'
                    }} />
                  )}
                </View>
              );
            })}
          </View>
        ))}
        
        {/* Render home areas */}
        {renderHomeAreas()}
        
        {/* Render pawns */}
        {pawns.map(renderPawn)}
      </View>
    </View>
  );
};

export default FreeModeBoard;