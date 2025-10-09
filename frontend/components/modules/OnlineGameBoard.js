import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Text, ImageBackground } from 'react-native';
import {
  COLORS,
  PATH_MAP,
  SAFE_SPOTS
} from '../../constants/game';

// Fallback sabitler (constants/game.js'de yoksa buradan alınır)
const MAIN_PATH_COORDS = global.MAIN_PATH_COORDS || [
  [6, 1], [6, 2], [6, 3], [6, 4], [6, 5], [6, 6],
  [5, 6], [4, 6], [3, 6], [2, 6], [1, 6], [0, 6], [0, 7], [0, 8],
  [1, 8], [2, 8], [3, 8], [4, 8], [5, 8], [6, 8],
  [6, 9], [6, 10], [6, 11], [6, 12], [6, 13], [6, 14], [7, 14], [8, 14],
  [8, 13], [8, 12], [8, 11], [8, 10], [8, 9], [8, 8],
  [9, 8], [10, 8], [11, 8], [12, 8], [13, 8], [14, 8], [14, 7], [14, 6],
  [13, 6], [12, 6], [11, 6], [10, 6], [9, 6], [8, 6],
  [8, 5], [8, 4], [8, 3], [8, 2], [8, 1], [8, 0], [7, 0], [6, 0]
];
const HOME_STRETCH_COORDS = global.HOME_STRETCH_COORDS || {
  yellow: [[1, 7], [2, 7], [3, 7], [4, 7]],
  blue: [[7, 13], [7, 12], [7, 11], [7, 10]],
  red: [[13, 7], [12, 7], [11, 7], [10, 7]],
  green: [[7, 1], [7, 2], [7, 3], [7, 4]],
};
const HOME_STRETCH_ENTRANCES = global.HOME_STRETCH_ENTRANCES || {
  red: 41,
  yellow: 13,
  green: 55,
  blue: 27,
};
const TRANSPARENT_COLORS = global.TRANSPARENT_COLORS || {
  red: 'rgba(211, 47, 47, 0.4)',
  green: 'rgba(56, 142, 60, 0.4)',
  blue: 'rgba(25, 118, 210, 0.4)',
  yellow: 'rgba(251, 192, 45, 0.4)',
};
// Tüm sabitler constants/game.js'de yoksa fallback olarak burada tanımlı.

import AnimatedPawn from '../shared/AnimatedPawn';
import { PawnService } from '../../services/PawnService';

// --- CONSTANTS FOR VISUAL CUES ---

const ARROW_ROTATIONS = {
  red: '0deg',    // Points up
  green: '90deg', // Points right
  yellow: '180deg',// Points down
  blue: '270deg', // Points left
};
// HOME_STRETCH_ENTRANCES artık sadece constants/game.js'den geliyor.
// --- HELPER COMPONENTS ---

const Arrow = ({ color }) => (
  <View style={{ transform: [{ rotate: ARROW_ROTATIONS[color] }] }}>
    <Text style={{ color: COLORS[color], fontSize: 12, fontWeight: 'bold' }}>▲</Text>
  </View>
);

const GRID_SIZE = 15;
// MAIN_PATH_COORDS ve HOME_STRETCH_COORDS artık sadece constants/game.js'den geliyor.
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
      // Piyonun kendi sırasını (0-3) kullanmak yerine, evdeki piyonlar arasındaki sırasını buluyoruz.
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

const OnlineGameBoard = ({ players = [], gameState = {}, onPawnPress, currentPlayer, diceValue, playersInfo, style }) => {
  // Hareket animasyonlarını yönetmek için state'ler
  const [movingPawns, setMovingPawns] = useState(new Set());
  const [lastGameState, setLastGameState] = useState(null);

  // Çevrimiçi modda seçili piyon bilgisi players prop'undan gelir
  // Yerel depolamadan yükleme yapmıyoruz

  // Tek doğru kaynak olan gameState.positions'tan piyonları oluştur
  const pawns = players.flatMap(player => {
    const playerPositions = gameState.positions[player.color] || [];
    return playerPositions.map((position, pawnIndex) => ({
      position: position,
      color: player.color,
      id: `${player.color}-${pawnIndex}`,
      pawnIndex: pawnIndex
    }));
  });

  // Piyon hareketlerini tespit et ve animasyon başlat
  useEffect(() => {
    if (lastGameState && gameState.positions) {
      const newMovingPawns = new Set();
      
      // Her oyuncu için pozisyon değişikliklerini kontrol et
      Object.keys(gameState.positions).forEach(color => {
        const currentPositions = gameState.positions[color] || [];
        const lastPositions = lastGameState.positions[color] || [];
        
        currentPositions.forEach((currentPos, pawnIndex) => {
          const lastPos = lastPositions[pawnIndex];
          if (lastPos !== undefined && lastPos !== currentPos) {
            // Piyon hareket etti
            const pawnId = `${color}-${pawnIndex}`;
            newMovingPawns.add(pawnId);
            
            // Hareket mesafesini hesapla
            let moveSteps = 1;
            if (typeof currentPos === 'number' && typeof lastPos === 'number') {
              if (lastPos === -1 && currentPos === 0) {
                moveSteps = 1; // Evden çıkış
              } else if (lastPos >= 0 && currentPos >= 0) {
                moveSteps = Math.abs(currentPos - lastPos);
              }
            }
            
            console.log(`[Animation] Pawn ${pawnId} moving from ${lastPos} to ${currentPos}, steps: ${moveSteps}`);
          }
        });
      });
      
      if (newMovingPawns.size > 0) {
        setMovingPawns(newMovingPawns);
        
        // Animasyon tamamlandıktan sonra moving state'i temizle
        setTimeout(() => {
          setMovingPawns(new Set());
        }, newMovingPawns.size * 300 + 500); // Her step 300ms + buffer
      }
    }
    
    setLastGameState(gameState);
  }, [gameState.positions]);

  // Prop guard: undefined veya yanlış tip gelirse default değer kullan
  const safePawns = Array.isArray(pawns) ? pawns : [];
  const safeCurrentPlayer = typeof currentPlayer === 'string' ? currentPlayer : null;
  const safeDiceValue = typeof diceValue === 'number' ? diceValue : null;
  const safePlayersInfo = typeof playersInfo === 'object' && playersInfo !== null ? playersInfo : {};

  const boardLayout = generateBoardLayout(safePawns, safeCurrentPlayer, safeDiceValue);

  // Hareket eden piyon için step sayısını hesapla
  const getMoveSteps = (pawnId) => {
    if (!lastGameState || !movingPawns.has(pawnId)) return 0;
    
    const [color, pawnIndex] = pawnId.split('-');
    const currentPos = gameState.positions[color]?.[parseInt(pawnIndex)];
    const lastPos = lastGameState.positions[color]?.[parseInt(pawnIndex)];
    
    if (typeof currentPos === 'number' && typeof lastPos === 'number') {
      if (lastPos === -1 && currentPos === 0) {
        return 1; // Evden çıkış
      } else if (lastPos >= 0 && currentPos >= 0) {
        return Math.abs(currentPos - lastPos);
      }
    }
    return 1;
  };

  return (
    <View style={[styles.boardContainer, style]}>
      <ImageBackground 
        source={require('../../assets/images/wood-background.png')}
        style={styles.board}
        resizeMode="cover"
      >
      {boardLayout.map((cell, index) => {
        const backgroundColor =
          cell.type === 'base' ? TRANSPARENT_COLORS[cell.color] : // Use transparent colors for bases
          cell.type === 'path' ? (cell.color === 'path' ? 'rgba(255, 255, 255, 0.9)' : COLORS[cell.color]) : // Use solid colors for home stretches
          cell.type === 'goal' ? 'rgba(224, 224, 224, 0.3)' : // More transparent goal
          'transparent'; // Default to transparent to show the wood background

        const cellStyle = [styles.cell, { backgroundColor }];
        
        // Add border radius for home stretch paths
        if (cell.type === 'path' && cell.color !== 'path') {
          cellStyle.push({ borderRadius: 8 });
        }
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

        // Ana yol pozisyonunu hesapla
        const getMainPathPosition = (gridIndex) => {
          const row = Math.floor(gridIndex / GRID_SIZE);
          const col = gridIndex % GRID_SIZE;
          
          // MAIN_PATH_COORDS dizisinde bu koordinatın pozisyonunu bul
          for (let i = 0; i < MAIN_PATH_COORDS.length; i++) {
            if (MAIN_PATH_COORDS[i][0] === row && MAIN_PATH_COORDS[i][1] === col) {
              return i;
            }
          }
          return null;
        };
        
        const mainPathPos = getMainPathPosition(index);
        
        return (
          <View key={index} style={cellStyle}>
            {/* <Text style={styles.cellNumber}>{index}</Text> */}
            {/* {mainPathPos !== null && (
              <Text style={styles.mainPathNumber}>{mainPathPos}</Text>
            )} */}
            {cell.homeStretchEntranceFor && !cell.pawns.length && <Arrow color={cell.homeStretchEntranceFor} />}
            {cell.pawns.map((pawn, pawnIndex) => {
              const isMoving = movingPawns.has(pawn.id);
              const moveSteps = getMoveSteps(pawn.id);
              
              // Her oyuncunun kendi seçili piyonunu kullan
              const player = players.find(p => p.color === pawn.color);
              const playerSelectedPawn = player?.selectedPawn;
              
              // Eğer bu oyuncunun seçili piyonu varsa onu kullan, yoksa varsayılan emoji
              const pawnEmoji = playerSelectedPawn ? 
                PawnService.getPawnEmoji(playerSelectedPawn) : '●';
              
              // Takım piyonu kontrolü
              const isTeam = playerSelectedPawn ? PawnService.isTeamPawn(playerSelectedPawn) : false;
              const teamColors = isTeam ? PawnService.getTeamColors(playerSelectedPawn) : [];
              
              return (
                <AnimatedPawn 
                  key={pawn.id} 
                  color={pawn.color} 
                  emoji={pawnEmoji}
                  onPress={() => onPawnPress(pawn.pawnIndex, pawn.position)}
                  isMoving={isMoving}
                  moveSteps={moveSteps}
                  isTeam={isTeam}
                  teamColors={teamColors}
                />
              );
            })}
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
      </ImageBackground>
    </View>
  );
};

const styles = StyleSheet.create({
  cellNumber: {
    position: 'absolute',
    top: 1,
    left: 1,
    fontSize: 8,
    fontWeight: 'bold',
    color: 'rgba(0,0,0,0.4)',
  },
  mainPathNumber: {
    position: 'absolute',
    top: 1,
    right: 1,
    fontSize: 8,
    fontWeight: 'bold',
    color: 'rgba(255,0,0,0.8)',
    backgroundColor: 'rgba(255,255,255,0.8)',
    borderRadius: 2,
    paddingHorizontal: 2,
  },
  boardContainer: {
    width: '100%',
    height: '100%',
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 10,
    aspectRatio: 1, // Kare oranını koru
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
    borderColor: 'rgba(255, 255, 255, 0.6)',
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderLeftWidth: 1,
    borderRightWidth: 1,
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
    color: '#fff',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    padding: 6,
    borderRadius: 12,
    fontSize: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  nicknameRed: { bottom: '25%', left: '10%' },
  nicknameGreen: { top: '25%', left: '10%' },
  nicknameYellow: { top: '25%', right: '10%' },
  nicknameBlue: { bottom: '25%', right: '10%' },
});

export default OnlineGameBoard;
