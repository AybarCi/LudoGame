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

    // Rule 3: Check if there are opponent pawns on the path or destination
    let canMove = true;
    
    // Convert positions to absolute board positions for comparison
    const pawnStartAbs = pawn.position === -1 ? PATH_MAP[playerColor].start : (PATH_MAP[playerColor].start + pawn.position) % 56;
    const finalLandingAbs = finalLandingPos < 56 ? (PATH_MAP[playerColor].start + finalLandingPos) % 56 : finalLandingPos;
    
    // Check destination for opponent pawns on their starting position (safe)
    if (finalLandingPos >= 0 && finalLandingPos < 56) {
      const opponentOnDestination = pawns.find(p => {
        if (p.color === playerColor) return false;
        const opponentAbs = (PATH_MAP[p.color].start + p.position) % 56;
        return opponentAbs === finalLandingAbs;
      });
      
      if (opponentOnDestination) {
        const opponentStartPos = PATH_MAP[opponentOnDestination.color]?.start;
        const opponentAbs = (PATH_MAP[opponentOnDestination.color].start + opponentOnDestination.position) % 56;
        const isOpponentOnStartingPosition = opponentAbs === opponentStartPos;
        
        // Opponent on starting position can be landed on (but not captured)
        // This is allowed in Ludo rules - safe pawns can be passed over
        // The capture logic will handle whether to capture or not
      }
    }
    
    // Check path for blocking pawns (both teammates and opponents)
    if (canMove && pawn.position >= 0) {
      // Check if pawn is on starting position (safe pawn can move freely)
      const isOnStartingPosition = pawnStartAbs === PATH_MAP[playerColor].start;
      
      if (pawn.position < 56 && finalLandingPos >= 0 && finalLandingPos < 56 && !isOnStartingPosition) {
        // Main path movement - check for blocking pawns (skip for starting position pawns)
        for (let step = 1; step <= diceValue; step++) {
          const checkPosAbs = (pawnStartAbs + step) % 56;
          
          // Check for teammate blocking the path
          const teammateOnPath = pawns.find(p => {
            if (p.color !== playerColor || p.id === pawn.id) return false;
            const teammateAbs = (PATH_MAP[p.color].start + p.position) % 56;
            return teammateAbs === checkPosAbs;
          });
          
          if (teammateOnPath) {
            // Teammate blocks the path (cannot jump over teammates or land on them)
            canMove = false;
            break;
          }
          
          // Note: Opponent pawns do not block the path in Ludo
          // They can be captured both when passed through and when landed on
          // (if not on safe starting position) but they don't prevent movement
          
          if (checkPosAbs === finalLandingAbs) {
            break;
          }
        }
      } else if (pawn.position >= 56 && finalLandingPos >= 56) {
        // Home stretch movement - check for blocking teammates
        for (let step = 1; step <= diceValue; step++) {
          const checkPos = pawn.position + step;
          
          // Check for teammate blocking the path in home stretch
          const teammateOnPath = pawns.find(p => {
            if (p.color !== playerColor || p.id === pawn.id) return false;
            return p.position === checkPos;
          });
          
          if (teammateOnPath) {
            // Teammate blocks the path in home stretch (cannot jump over teammates or land on them)
            canMove = false;
            break;
          }
          
          if (checkPos === finalLandingPos) {
            break;
          }
        }
      }
    }
    
    if (canMove) {
      movablePawns.push(pawn);
    }
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
    case 'START_ROLLING': {
      return {
        ...state,
        isRolling: true
      };
    }

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
        diceValue: null, // Ensure dice is ready for first roll
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
      if (state.gamePhase !== 'playing') return state;

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

      // Check if landing on teammate (same rule as in getPossibleMoves)
      const isLandingOnTeammate = state.pawns.some(
        p => p.color === pawn.color && p.id !== pawn.id && p.position === newPosition
      );
      if (isLandingOnTeammate) {
        return state; // Invalid move - cannot land on teammate
      }

      // Check if there are teammate pawns blocking the path (same rule as in getPossibleMoves)
      if (pawn.position >= 0) {
        // Check if pawn is on starting position (safe pawn can move freely)
        const pawnStartAbs = (PATH_MAP[pawn.color].start + pawn.position) % 56;
        const isOnStartingPosition = pawnStartAbs === PATH_MAP[pawn.color].start;
        
        if (pawn.position < 56 && newPosition < 56 && !isOnStartingPosition) {
          // Main path movement - check for blocking teammates (skip for starting position pawns)
          for (let step = 1; step <= state.diceValue; step++) {
            const checkPos = pawn.position + step;
            const teammateOnPath = state.pawns.some(
              p => p.color === pawn.color && p.id !== pawn.id && p.position === checkPos
            );
            if (teammateOnPath) {
              return state; // Invalid move - teammate blocking the path (cannot jump over or land on teammates)
            }
          }
        } else if (pawn.position >= 56 && newPosition >= 56) {
          // Home stretch movement - check for blocking teammates
          for (let step = 1; step <= state.diceValue; step++) {
            const checkPos = pawn.position + step;
            const teammateOnPath = state.pawns.some(
              p => p.color === pawn.color && p.id !== pawn.id && p.position === checkPos
            );
            if (teammateOnPath) {
              return state; // Invalid move - teammate blocking the path in home stretch (cannot jump over or land on teammates)
            }
          }
        }
      }

      // Update pawns
      const updatedPawns = state.pawns.map(p => 
        p.id === pawnId ? { ...p, position: newPosition } : p
      );

      // Check for captures along the path and at destination
      const capturedPawns = updatedPawns.map(p => {
        if (p.id !== pawnId && p.color !== pawn.color && p.position >= 0 && p.position < 56) {
          const startPos = pawn.position;
          const endPos = newPosition;
          
          // Convert positions to absolute board positions for comparison
          const movingPawnStartAbs = startPos === -1 ? PATH_MAP[pawn.color].start : (PATH_MAP[pawn.color].start + startPos) % 56;
          const movingPawnEndAbs = endPos < 56 ? (PATH_MAP[pawn.color].start + endPos) % 56 : endPos;
          const opponentPawnAbs = (PATH_MAP[p.color].start + p.position) % 56;
          
          // Check if opponent pawn is on its starting position (safe from capture)
          const opponentStartPos = PATH_MAP[p.color]?.start;
          const isOnStartingPosition = opponentPawnAbs === opponentStartPos;
          
          // If opponent is on starting position, it cannot be captured
          if (isOnStartingPosition) {
            return p; // Safe, cannot be captured
          }
          
          // If moving from home (position -1), only check destination
          if (startPos === -1) {
            if (opponentPawnAbs === movingPawnEndAbs && endPos < 56) {
              return { ...p, position: -1 }; // Send captured pawn home
            }
          } else {
            // Check all positions in the movement path (including destination)
            for (let step = 1; step <= state.diceValue; step++) {
              const checkPosAbs = (movingPawnStartAbs + step) % 56;
              
              if (opponentPawnAbs === checkPosAbs && endPos < 56) {
                return { ...p, position: -1 }; // Send captured pawn home
              }
              
              // If we reached the end position, stop checking
              if (checkPosAbs === movingPawnEndAbs) {
                break;
              }
            }
          }
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

  // Auto-pass turn if no moves possible for all players
  useEffect(() => {
    if (state.diceValue && state.gamePhase === 'playing' && !state.winner) {
      const possibleMoves = getPossibleMoves(state.pawns, state.currentPlayer, state.diceValue);
      if (possibleMoves.length === 0) {
        // If no moves possible, pass turn regardless of dice value (even if 6)
        const timer = setTimeout(() => dispatch({ type: 'NEXT_TURN' }), 1500);
        return () => clearTimeout(timer);
      }
    }
  }, [state.diceValue, state.currentPlayer, state.gamePhase, state.winner]);

  return { state, dispatch, getPossibleMoves };
};
