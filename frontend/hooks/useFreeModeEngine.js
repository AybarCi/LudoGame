import { useReducer, useEffect } from 'react';
import { PLAYER_COLORS } from '../constants/game';

// Free Mode specific constants
const FREE_MODE_BOARD_SIZE = 40; // Simplified board for tablet play
const SAFE_POSITIONS = [0, 10, 20, 30]; // Safe spots on the board
const HOME_POSITIONS = {
  red: [-1, -2, -3, -4],
  blue: [-5, -6, -7, -8],
  green: [-9, -10, -11, -12],
  yellow: [-13, -14, -15, -16]
};

// Helper function to get possible moves for free mode
const getFreeModeMovablePawns = (pawns, playerColor, diceValue) => {
  const movablePawns = [];
  const playerPawns = pawns.filter(p => p.color === playerColor);

  for (const pawn of playerPawns) {
    // If pawn is at home and dice is 6, can move to start
    if (pawn.position < 0 && diceValue === 6) {
      movablePawns.push({ ...pawn, newPosition: 0 });
    }
    // If pawn is on board, can move forward
    else if (pawn.position >= 0) {
      const newPos = (pawn.position + diceValue) % FREE_MODE_BOARD_SIZE;
      movablePawns.push({ ...pawn, newPosition: newPos });
    }
  }

  return movablePawns;
};

// Check if a player has won (all pawns completed a full circle)
const checkFreeModeWin = (pawns, playerColor) => {
  const playerPawns = pawns.filter(p => p.color === playerColor);
  return playerPawns.every(pawn => pawn.completedLaps >= 1);
};

// Initialize free mode game state
const getFreeModeInitialState = (playerCount, playerColors, playerNames) => {
  const players = playerColors.slice(0, playerCount);
  const pawns = [];
  
  // Create pawns for each player
  players.forEach((color, playerIndex) => {
    const homePositions = HOME_POSITIONS[color];
    for (let i = 0; i < 4; i++) {
      pawns.push({
        id: `${color}_${i}`,
        color,
        position: homePositions[i],
        completedLaps: 0,
        isActive: true
      });
    }
  });

  return {
    gamePhase: 'playing', // No pre-game phase in free mode
    players,
    currentPlayer: players[0],
    pawns,
    diceValue: null,
    isRolling: false,
    gameMessage: `Oyun başladı! Sıra ${playerNames[players[0]] || players[0]}'da.`,
    winner: null,
    playerNames,
    canRoll: true,
    lastMovePlayer: null
  };
};

// Free mode game reducer
const freeModeReducer = (state, action) => {
  switch (action.type) {
    case 'INITIALIZE_FREE_MODE': {
      const { playerCount, playerColors, playerNames } = action.payload;
      return getFreeModeInitialState(playerCount, playerColors, playerNames);
    }

    case 'ROLL_DICE': {
      if (!state.canRoll || state.diceValue !== null) return state;

      const diceValue = Math.floor(Math.random() * 6) + 1;
      const possibleMoves = getFreeModeMovablePawns(state.pawns, state.currentPlayer, diceValue);
      
      const playerName = state.playerNames[state.currentPlayer] || state.currentPlayer;
      const message = possibleMoves.length === 0
        ? `${playerName} ${diceValue} attı. Hamle yok!`
        : `${playerName} ${diceValue} attı. Bir piyon seç!`;

      return {
        ...state,
        diceValue,
        gameMessage: message,
        canRoll: false,
        isRolling: false
      };
    }

    case 'MOVE_PAWN': {
      const { pawnId } = action.payload;
      const pawn = state.pawns.find(p => p.id === pawnId);
      
      if (!pawn || pawn.color !== state.currentPlayer) return state;

      const possibleMoves = getFreeModeMovablePawns(state.pawns, state.currentPlayer, state.diceValue);
      const validMove = possibleMoves.find(p => p.id === pawnId);
      
      if (!validMove) return state;

      const updatedPawns = state.pawns.map(p => {
        if (p.id === pawnId) {
          let completedLaps = p.completedLaps;
          // Check if pawn completed a lap
          if (p.position >= 0 && validMove.newPosition < p.position) {
            completedLaps += 1;
          }
          
          return {
            ...p,
            position: validMove.newPosition,
            completedLaps
          };
        }
        return p;
      });

      // Check for win condition
      const hasWon = checkFreeModeWin(updatedPawns, state.currentPlayer);
      const playerName = state.playerNames[state.currentPlayer] || state.currentPlayer;
      
      if (hasWon) {
        return {
          ...state,
          pawns: updatedPawns,
          winner: state.currentPlayer,
          gameMessage: `🎉 ${playerName} kazandı!`,
          diceValue: null,
          canRoll: false
        };
      }

      // Continue turn if rolled 6, otherwise next player
      const continuesTurn = state.diceValue === 6;
      const nextPlayerIndex = continuesTurn 
        ? state.players.indexOf(state.currentPlayer)
        : (state.players.indexOf(state.currentPlayer) + 1) % state.players.length;
      const nextPlayer = state.players[nextPlayerIndex];
      const nextPlayerName = state.playerNames[nextPlayer] || nextPlayer;

      return {
        ...state,
        pawns: updatedPawns,
        currentPlayer: nextPlayer,
        diceValue: null,
        canRoll: true,
        gameMessage: continuesTurn 
          ? `${playerName} 6 attı, tekrar oynuyor!`
          : `Sıra ${nextPlayerName}'da.`,
        lastMovePlayer: state.currentPlayer
      };
    }

    case 'NEXT_TURN': {
      const currentPlayerIndex = state.players.indexOf(state.currentPlayer);
      const nextPlayer = state.players[(currentPlayerIndex + 1) % state.players.length];
      const nextPlayerName = state.playerNames[nextPlayer] || nextPlayer;
      
      return {
        ...state,
        currentPlayer: nextPlayer,
        diceValue: null,
        canRoll: true,
        gameMessage: `Sıra ${nextPlayerName}'da.`
      };
    }

    case 'RESET_GAME': {
      return getFreeModeInitialState(
        state.players.length,
        state.players,
        state.playerNames
      );
    }

    default:
      return state;
  }
};

// Free Mode Game Engine Hook
export const useFreeModeEngine = (playerCount, playerColors, playerNames) => {
  const [state, dispatch] = useReducer(freeModeReducer, null, () =>
    getFreeModeInitialState(playerCount, playerColors, playerNames)
  );

  // Auto pass turn if no moves available
  useEffect(() => {
    if (state.diceValue && !state.winner && !state.canRoll) {
      const possibleMoves = getFreeModeMovablePawns(state.pawns, state.currentPlayer, state.diceValue);
      if (possibleMoves.length === 0) {
        const timer = setTimeout(() => {
          dispatch({ type: 'NEXT_TURN' });
        }, 2000);
        return () => clearTimeout(timer);
      }
    }
  }, [state.diceValue, state.currentPlayer, state.canRoll, state.winner]);

  return { state, dispatch };
};