import { useReducer, useEffect } from 'react';
import { PATH_MAP, PLAYER_COLORS } from '../constants/game';

// --- HELPER FUNCTIONS ---

// Determines which of the current player's pawns can legally move.
const getPossibleMoves = (pawns, playerColor, diceValue) => {
  const movablePawns = [];

  for (const pawn of pawns.filter(p => p.color === playerColor)) {
    // Rule 0: A pawn that has reached the goal (59) cannot move again.
    if (pawn.position === 59) {
      continue;
    }

    let finalLandingPos = -99; // Use a flag for invalid position

    // Case A: Pawn is at home base.
    if (pawn.position === -1) {
      if (diceValue === 6) {
        finalLandingPos = 0; // Moves to start
      }
    }
    // Case B: Pawn is in its home stretch.
    else if (pawn.position >= 56) {
      if (pawn.position + diceValue <= 59) { // A pawn cannot overshoot the goal (59).
        finalLandingPos = pawn.position + diceValue;
      }
    }
    // Case C: Pawn is on the main path.
    else {
      const currentRelativePos = pawn.position;
      const startAbsPos = PATH_MAP[playerColor].start;
      const homeEntryAbsPos = PATH_MAP[playerColor].homeEntry;

      // Calculate the pawn's current absolute position on the 56-square board.
      const currentAbsPos = (startAbsPos + currentRelativePos) % 56;

      // Calculate the number of squares from the current position to the home entry square.
      let stepsToHomeEntry;
      if (homeEntryAbsPos >= currentAbsPos) {
        stepsToHomeEntry = homeEntryAbsPos - currentAbsPos;
      } else {
        // The path wraps around from 55 to 0.
        stepsToHomeEntry = (56 - currentAbsPos) + homeEntryAbsPos;
      }

      // The number of steps needed to *enter* the home stretch is one more than reaching the entry square.
      const stepsToEnterHomeStretch = stepsToHomeEntry + 1;

      if (diceValue < stepsToEnterHomeStretch) {
        // The move is entirely on the main path and does not reach the home stretch.
        finalLandingPos = currentRelativePos + diceValue;
      } else {
        // The move enters the home stretch.
        const stepsIntoHomeStretch = diceValue - stepsToEnterHomeStretch;
        
        // The home stretch is 4 steps long. The goal is the 4th step.
        // stepsIntoHomeStretch: 0 (1st square), 1 (2nd), 2 (3rd), 3 (4th/goal).
        if (stepsIntoHomeStretch <= 3) {
          // Map to home stretch positions 56 (step 0) to 59 (step 3).
          finalLandingPos = 56 + stepsIntoHomeStretch;
        } 
        // else, it's an overshoot, and finalLandingPos remains -99.
      }
    }

    // Rule 1: If no valid landing spot was found, skip.
    if (finalLandingPos === -99) {
      continue;
    }

    // Rule 2: A pawn cannot land on a square that is already occupied by a teammate.
    const isLandingOnTeammate = pawns.some(
      p => p.color === playerColor && p.id !== pawn.id && p.position === finalLandingPos
    );
    if (isLandingOnTeammate) {
      continue; // This move is illegal.
    }

    movablePawns.push(pawn);
  }

  return movablePawns;
};

// --- Win Condition Logic ---
const checkWinCondition = (pawns, playerColor) => {
  // A player wins when their 4 pawns occupy all home stretch positions (56, 57, 58, 59).
  const playerPawns = pawns.filter(p => p.color === playerColor);
  const homeStretchPositions = playerPawns.map(p => p.position).sort((a, b) => a - b);

  const winningPositions = [56, 57, 58, 59];
  return JSON.stringify(homeStretchPositions) === JSON.stringify(winningPositions);
};

// --- AI Logic ---
const chooseBestMove = (possibleMoves, state) => {
  if (possibleMoves.length === 0) return null;
  if (possibleMoves.length === 1) return possibleMoves[0];

  // Simple AI strategy: prioritize moves that get pawns out of home
  const pawnsAtHome = possibleMoves.filter(p => p.position === -1);
  if (pawnsAtHome.length > 0) {
    return pawnsAtHome[0];
  }

  // Otherwise, move the pawn that's furthest along
  return possibleMoves.reduce((best, current) => 
    current.position > best.position ? current : best
  );
};

// --- Initial State ---
const getInitialState = (mode, playersInfo) => {
  // Get active players from playersInfo
  const players = playersInfo ? Object.keys(playersInfo) : ['red', 'green', 'yellow', 'blue'];
  
  // Create pawns only for active players
  const pawns = players.flatMap(color =>
    Array.from({ length: 4 }, (_, i) => ({
      id: `${color}-${i}`,
      color,
      position: -1, // -1: home, 0-55: main path, 56-59: home stretch, 59: goal
    }))
  );

  // If no playersInfo is provided, create a default one.
  const initialPlayersInfo = playersInfo || {
    red: { nickname: 'Oyuncu 1' },
    green: { nickname: 'Oyuncu 2' },
    yellow: { nickname: 'Oyuncu 3' },
    blue: { nickname: 'Oyuncu 4' },
  };

  return {
    gamePhase: 'pre-game',
    pawns,
    currentPlayer: players[0], // Start with first player
    diceValue: null,
    winner: null,
    players,
    playersInfo: initialPlayersInfo,
    aiPlayers: mode === 'ai' ? players.filter(p => p !== players[0]) : [],
    isRolling: false,
    turnOrderRolls: [],
    turnOrderDetermined: false,
    gameMessage: 'Sıra belirlemek için zar atın.',
    isInitialized: true,
  };
};

// --- GAME REDUCER ---
const gameReducer = (state, action) => {
  switch (action.type) {
    case 'RESET_GAME': {
      // Pass the existing playersInfo to preserve nicknames on reset
      return getInitialState(state.aiPlayers.length > 0 ? 'ai' : 'local', state.playersInfo);
    }

    case 'INITIALIZE_GAME': {
      const { mode, playersInfo } = action.payload;
      const initialState = getInitialState(mode, playersInfo);
      return { ...initialState, isInitialized: true };
    }

    case 'DETERMINE_TURN_ORDER': {
      // Guard to prevent this from running at the wrong time.
      if (state.gamePhase !== 'pre-game' || state.turnOrderDetermined) {
        return state;
      }

      // Determine the new player order.
      const sortedRolls = [...state.turnOrderRolls].sort((a, b) => b.roll - a.roll);
      const newPlayerOrder = sortedRolls.map(r => r.color);
      const firstPlayer = newPlayerOrder[0];

      // Create a clean state for the 'playing' phase
      const playingState = getInitialState(
        state.aiPlayers.length > 0 ? 'ai' : 'local',
        state.playersInfo
      );

      return {
        ...playingState,
        gamePhase: 'playing',
        players: newPlayerOrder,
        currentPlayer: firstPlayer,
        turnOrderDetermined: true,
        gameMessage: `Oyun başlıyor. İlk sıra: ${state.playersInfo[firstPlayer]?.nickname || firstPlayer}.`,
      };
    }

    case 'ROLL_DICE_FOR_TURN_ORDER': {
      if (state.gamePhase !== 'pre-game') return state;

      const diceValue = Math.floor(Math.random() * 6) + 1;
      const newTurnOrderRolls = [...state.turnOrderRolls, { color: state.currentPlayer, roll: diceValue }];
      
      const currentPlayerIndex = state.players.indexOf(state.currentPlayer);
      const nextPlayer = state.players[(currentPlayerIndex + 1) % state.players.length];
      
      // Check if all players have rolled
      const allPlayersRolled = newTurnOrderRolls.length === state.players.length;

      return {
        ...state,
        diceValue: allPlayersRolled ? diceValue : null, // Keep dice value only if all players rolled
        turnOrderRolls: newTurnOrderRolls,
        currentPlayer: nextPlayer,
        gameMessage: `${state.playersInfo[state.currentPlayer]?.nickname || state.currentPlayer} ${diceValue} attı.`,
        isRolling: false,
      };
    }

    case 'ROLL_DICE': {
      if (state.gamePhase !== 'playing' || state.isRolling) return state;

      const diceValue = Math.floor(Math.random() * 6) + 1;
      const possibleMoves = getPossibleMoves(state.pawns, state.currentPlayer, diceValue);
      
      let gameMessage;
      if (possibleMoves.length === 0) {
        gameMessage = `${state.playersInfo[state.currentPlayer]?.nickname || state.currentPlayer} ${diceValue} attı. Hareket edebilecek piyon yok.`;
      } else {
        gameMessage = `${state.playersInfo[state.currentPlayer]?.nickname || state.currentPlayer} ${diceValue} attı. Bir piyon seçin.`;
      }

      return {
        ...state,
        diceValue,
        gameMessage,
        isRolling: false,
      };
    }

    case 'MOVE_PAWN': {
      const { pawnId } = action.payload;
      const pawn = state.pawns.find(p => p.id === pawnId);
      
      if (!pawn || pawn.color !== state.currentPlayer || !state.diceValue) {
        return state;
      }

      // Calculate new position
      let newPosition;
      if (pawn.position === -1 && state.diceValue === 6) {
        newPosition = 0; // Move from home to start
      } else if (pawn.position >= 56) {
        // In home stretch
        if (pawn.position + state.diceValue <= 59) {
          newPosition = pawn.position + state.diceValue;
        } else {
          return state; // Invalid move
        }
      } else if (pawn.position >= 0) {
        // On main path
        const currentRelativePos = pawn.position;
        const startAbsPos = PATH_MAP[pawn.color].start;
        const homeEntryAbsPos = PATH_MAP[pawn.color].homeEntry;
        const currentAbsPos = (startAbsPos + currentRelativePos) % 56;
        
        let stepsToHomeEntry;
        if (homeEntryAbsPos >= currentAbsPos) {
          stepsToHomeEntry = homeEntryAbsPos - currentAbsPos;
        } else {
          stepsToHomeEntry = (56 - currentAbsPos) + homeEntryAbsPos;
        }
        
        const stepsToEnterHomeStretch = stepsToHomeEntry + 1;
        
        if (state.diceValue < stepsToEnterHomeStretch) {
          newPosition = currentRelativePos + state.diceValue;
        } else {
          const stepsIntoHomeStretch = state.diceValue - stepsToEnterHomeStretch;
          if (stepsIntoHomeStretch <= 3) {
            newPosition = 56 + stepsIntoHomeStretch;
          } else {
            return state; // Invalid move
          }
        }
      } else {
        return state; // Invalid move
      }

      // Update pawns
      const updatedPawns = state.pawns.map(p => 
        p.id === pawnId ? { ...p, position: newPosition } : p
      );

      // Check for captures
      const capturedPawns = updatedPawns.map(p => {
        if (p.id !== pawnId && p.position === newPosition && p.color !== pawn.color && newPosition < 56) {
          return { ...p, position: -1 }; // Send captured pawn home
        }
        return p;
      });

      // Check win condition
      const winner = checkWinCondition(capturedPawns, state.currentPlayer) ? state.currentPlayer : null;
      
      // Determine if player gets another turn (rolled 6 or captured)
      const rolledSix = state.diceValue === 6;
      const capturedSomeone = capturedPawns.some(p => p.id !== pawnId && p.position === -1 && 
        state.pawns.find(orig => orig.id === p.id)?.position !== -1);
      
      const getAnotherTurn = rolledSix || capturedSomeone;
      
      let nextPlayer = state.currentPlayer;
      if (!getAnotherTurn && !winner) {
        const currentIndex = state.players.indexOf(state.currentPlayer);
        nextPlayer = state.players[(currentIndex + 1) % state.players.length];
      }

      let gameMessage;
      if (winner) {
        gameMessage = `🎉 ${state.playersInfo[winner]?.nickname || winner} kazandı!`;
      } else if (getAnotherTurn) {
        gameMessage = `${state.playersInfo[state.currentPlayer]?.nickname || state.currentPlayer} tekrar oynuyor.`;
      } else {
        gameMessage = `Sıra: ${state.playersInfo[nextPlayer]?.nickname || nextPlayer}`;
      }

      return {
        ...state,
        pawns: capturedPawns,
        currentPlayer: nextPlayer,
        diceValue: getAnotherTurn && !winner ? null : null,
        winner,
        gameMessage,
      };
    }

    case 'NEXT_TURN': {
      if (state.winner) return state;
      
      const currentIndex = state.players.indexOf(state.currentPlayer);
      const nextPlayer = state.players[(currentIndex + 1) % state.players.length];
      
      return {
        ...state,
        currentPlayer: nextPlayer,
        diceValue: null,
        gameMessage: `Sıra: ${state.playersInfo[nextPlayer]?.nickname || nextPlayer}`,
      };
    }

    case 'START_ROLLING': {
      return {
        ...state,
        isRolling: true,
      };
    }

    default:
      return state;
  }
};

// --- MAIN HOOK ---
export const useFreeModeEngine = (mode, playersInfo) => {
  const [state, dispatch] = useReducer(gameReducer, undefined, () =>
    getInitialState(mode, playersInfo)
  );

  // AI turn handling
  useEffect(() => {
    if (state.gamePhase !== 'playing' || !state.aiPlayers.includes(state.currentPlayer) || state.winner) {
      return;
    }

    const isAITurn = state.aiPlayers.includes(state.currentPlayer);

    if (isAITurn) {
      // Step 1: AI needs to roll the dice
      if (state.diceValue === null) {
        const timer = setTimeout(() => dispatch({ type: 'ROLL_DICE' }), 1000);
        return () => clearTimeout(timer);
      }

      // Step 2: AI has rolled, now needs to move
      const possibleMoves = getPossibleMoves(state.pawns, state.currentPlayer, state.diceValue);
      
      const moveTimer = setTimeout(() => {
        if (possibleMoves.length > 0) {
          const bestMove = chooseBestMove(possibleMoves, state);
          if (bestMove) {
            dispatch({ type: 'MOVE_PAWN', payload: { pawnId: bestMove.id } });
          }
        } else {
          dispatch({ type: 'NEXT_TURN' });
        }
      }, 1500);

      return () => clearTimeout(moveTimer);
    }
  }, [state.currentPlayer, state.diceValue, state.winner, state.gamePhase]);

  // Pre-game AI rolls for turn order
  useEffect(() => {
    if (state.gamePhase === 'pre-game' && state.aiPlayers.includes(state.currentPlayer)) {
      const timer = setTimeout(() => dispatch({ type: 'ROLL_DICE_FOR_TURN_ORDER' }), 1000);
      return () => clearTimeout(timer);
    }
  }, [state.currentPlayer, state.gamePhase]);

  // Automatically determine turn order
  useEffect(() => {
    if (state.gamePhase === 'pre-game' && state.turnOrderRolls.length === state.players.length && !state.turnOrderDetermined) {
      const timer = setTimeout(() => dispatch({ type: 'DETERMINE_TURN_ORDER' }), 1000);
      return () => clearTimeout(timer);
    }
  }, [state.turnOrderRolls, state.gamePhase]);

  // Auto-pass turn if no moves possible for human players
  useEffect(() => {
    if (state.diceValue && state.gamePhase === 'playing' && !state.aiPlayers.includes(state.currentPlayer)) {
      const possibleMoves = getPossibleMoves(state.pawns, state.currentPlayer, state.diceValue);
      if (possibleMoves.length === 0) {
        const timer = setTimeout(() => dispatch({ type: 'NEXT_TURN' }), 1500);
        return () => clearTimeout(timer);
      }
    }
  }, [state.diceValue, state.currentPlayer, state.gamePhase, state.winner]);

  return { state, dispatch, getPossibleMoves };
};
