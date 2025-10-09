import { useReducer, useEffect } from 'react';
import { PATH_MAP, PLAYER_COLORS } from '../constants/game';
import { PawnService } from '../services/PawnService';

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

    // Note: The 'cannot jump over teammate' rule is complex to check here
    // without duplicating all of MOVE_PAWN's logic. The primary guard
    // is that the UI won't let you pick an illegal move, and the server-side
    // (MOVE_PAWN) is the final authority. This simplified check is sufficient
    // for highlighting possible moves.

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

  if (JSON.stringify(homeStretchPositions) === JSON.stringify(winningPositions)) {
    return playerColor; // Return the color of the winning player.
  }

  return null; // No winner yet.
};

// AI strategy to select the best move from available options.
const chooseBestMove = (possibleMoves, state) => {
  console.log('[AI] Choosing best move from:', possibleMoves.map(p => p.id));

  let bestMove = null;
  let maxScore = -1;

  for (const pawn of possibleMoves) {
    let score = 0;
    const { position: currentPos, color } = pawn;
    const { diceValue, pawns } = state;
    const nextRelativePos = currentPos === -1 ? 0 : currentPos + diceValue;

    // Priority 1: Land in the goal.
    if (nextRelativePos === 56) {
      score = 100;
    } 
    // Priority 2: Capture an opponent.
    else if (currentPos !== -1 && nextRelativePos <= 55) {
      const absoluteTargetPos = (PATH_MAP[color].start + nextRelativePos) % 56;
      const isOpponentOnCell = pawns.some(
        p => p.color !== color && 
             p.position !== -1 && 
             p.position <= 55 && 
             // A capture is only invalid if the opponent is on their own start square.
             !(((PATH_MAP[p.color].start + p.position) % 56) === PATH_MAP[p.color].start) &&
             ((PATH_MAP[p.color].start + p.position) % 56) === absoluteTargetPos
      );
      if (isOpponentOnCell) score = 80;
    }
    
    // Priority 3: Get a pawn out of home base.
    if (currentPos === -1) {
      score = 60;
    }



    // Base score: Advance the furthest pawn.
    if (score === 0) {
      score = currentPos > 0 ? currentPos : 1; // Give a small score to pawns on board
    }

    if (score > maxScore) {
      maxScore = score;
      bestMove = pawn;
      console.log(`[AI] New best move found: ${pawn.id} with score ${score}`);
    }
  }

  return bestMove || possibleMoves[0]; // Fallback to the first possible move.
};

// --- INITIAL STATE FACTORY ---

const getInitialState = (gameMode, playersInfo) => {
  const players = ['red', 'green', 'yellow', 'blue'];
  const pawns = players.flatMap(color =>
    Array.from({ length: 4 }, (_, i) => ({
      id: `${color}-${i}`,
      color,
      position: -1, // -1: home, 0-55: main path, 56-59: home stretch, 60: goal
    }))
  );

  // If no playersInfo is provided, create a default one.
  let initialPlayersInfo;
  if (playersInfo) {
    // Add selectedPawn to existing playersInfo if not present
    initialPlayersInfo = {};
    Object.keys(playersInfo).forEach(color => {
      initialPlayersInfo[color] = {
        ...playersInfo[color],
        selectedPawn: playersInfo[color].selectedPawn || 'default'
      };
    });
  } else {
    initialPlayersInfo = {
      red: { nickname: 'Player 1', selectedPawn: 'default' },
      green: { nickname: 'Verstappen', selectedPawn: 'default' },
      yellow: { nickname: 'Leclerc', selectedPawn: 'default' },
      blue: { nickname: 'Norris', selectedPawn: 'default' },
    };
  }

  return {
    gamePhase: 'pre-game',
    pawns,
    currentPlayer: 'red',
    diceValue: null,
    winner: null,
    players,
    playersInfo: initialPlayersInfo,
    aiPlayers: gameMode === 'ai' ? players.filter(p => p !== 'red') : [],
    isRolling: false,
    turnOrderRolls: [],
    turnOrderDetermined: false,
    gameMessage: 'Sıra belirlemek için zar atın.',
    isInitialized: !!playersInfo, // Set initial initialized status
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

      // Create a clean state for the 'playing' phase, but make sure
      // to pass the existing player info so it's not lost.
      const playingState = getInitialState(
        state.aiPlayers.length > 0 ? 'ai' : 'local',
        state.playersInfo // Preserve player names!
      );

      return {
        ...playingState,
        gamePhase: 'playing',
        players: newPlayerOrder, // The new turn order
        currentPlayer: firstPlayer, // The first player
        turnOrderDetermined: true,
        gameMessage: `Oyun başlıyor. İlk sıra: ${state.playersInfo[firstPlayer]?.nickname || firstPlayer}.`,
      };
    }

    case 'ROLL_DICE_FOR_TURN_ORDER': {
      if (state.gamePhase !== 'pre-game') return state; // Guard clause

      const diceValue = Math.floor(Math.random() * 6) + 1;
      const newTurnOrderRolls = [...state.turnOrderRolls, { color: state.currentPlayer, roll: diceValue }];
      
      const currentPlayerIndex = state.players.indexOf(state.currentPlayer);
      const nextPlayer = state.players[(currentPlayerIndex + 1) % state.players.length];

      // If all players have now rolled, it's time to determine the final turn order.
      if (newTurnOrderRolls.length === state.players.length) {
        // We call the reducer again, but with the DETERMINE_TURN_ORDER action.
        // We pass the updated rolls so it can work with the latest data.
        // First, return the state showing the final player's roll.
        // The actual turn determination will happen in the useEffect hook.
        return {
          ...state,
          diceValue,
          turnOrderRolls: newTurnOrderRolls,
          gameMessage: `${state.playersInfo[state.currentPlayer].nickname} ${diceValue} attı.`,
        };
      }

      return {
        ...state,
        diceValue,
        turnOrderRolls: newTurnOrderRolls,
        currentPlayer: nextPlayer,
        gameMessage: `${state.playersInfo[state.currentPlayer].nickname} ${diceValue} attı.`,
      };
    }

    case 'ROLL_DICE': {
      // Guard to prevent rolling if it's not the playing phase or if a dice is already active.
      if (state.gamePhase !== 'playing' || state.diceValue !== null) return state;

      const diceValue = Math.floor(Math.random() * 6) + 1;
      const possibleMoves = getPossibleMoves(state.pawns, state.currentPlayer, diceValue);

      const message = possibleMoves.length === 0
        ? `${diceValue} attınız. Hamle yok!`
        : `${diceValue} attınız. Bir piyon seçin.`;

      return {
        ...state,
        diceValue,
        gameMessage: message,
      };
    }

    case 'NEXT_TURN': {
      const currentPlayerIndex = state.players.indexOf(state.currentPlayer);
      const nextPlayer = state.players[(currentPlayerIndex + 1) % state.players.length];
      return {
        ...state,
        currentPlayer: nextPlayer,
        diceValue: null,
        isRolling: false,
        gameMessage: `Sıra ${state.playersInfo[nextPlayer]?.nickname || nextPlayer}'da.`,
      };
    }

    case 'SET_GAME_STATE': {
      return { ...state, ...action.payload };
    }

    case 'MOVE_PAWN': {
      const { pawnId } = action.payload;
      const { diceValue, pawns, currentPlayer, playersInfo } = state;
      const pawnToMove = pawns.find(p => p.id === pawnId);

      // Basic validation
      if (pawnToMove.color !== currentPlayer || !diceValue) return state;
      const possibleMoves = getPossibleMoves(pawns, currentPlayer, diceValue);
      if (!possibleMoves.some(p => p.id === pawnId)) return state;

      let newPosition;
      let capturedPawnIds = [];
      let capturedPawnInfo = null;

      // Case 1: Pawn is at home base (-1)
      if (pawnToMove.position === -1) {
        newPosition = 0; // Moves to the starting square (relative position 0)
      }
      // Case 2: Pawn is on the main path or in its home stretch.
      else {
        const currentPos = pawnToMove.position;
        const playerPath = PATH_MAP[currentPlayer];

        // Subcase 2a: Pawn is on the main path.
        if (currentPos >= 0 && currentPos <= 55) {
          const entryPoint = playerPath.home_entry;
          const distToEntry = (entryPoint - ((playerPath.start + currentPos) % 56) + 56) % 56;
          const stepsToEnterHome = distToEntry + 1;

          if (diceValue >= stepsToEnterHome) {
            const stepsIntoHome = diceValue - stepsToEnterHome;
          // stepsIntoHome is 0-based. 0 is the first square, 3 is the last.
          if (stepsIntoHome > 3) { // Overshot the home path
            return { ...state, gameMessage: 'Hedefi geçemezsin!' };
          }
          // Home stretch positions are 56, 57, 58, 59.
          newPosition = 56 + stepsIntoHome;
          } else {
            newPosition = currentPos + diceValue;
          }
        } 
        // Subcase 2b: Pawn is already in its home stretch (56-59).
        else {
          const potentialEndPos = pawnToMove.position + diceValue;
          // A pawn cannot move past the last home square (59).
          if (potentialEndPos > 59) {
            return { ...state, gameMessage: 'Hedefi tam tutturmalısın, geçemezsin.' };
          }
          newPosition = potentialEndPos;
        }
      }

      // --- DEBUGGING CAPTURE LOGIC --- 
      if (newPosition >= 0 && newPosition <= 55) {
        const absoluteTargetPos = (PATH_MAP[currentPlayer].start + newPosition) % 56;
        console.log('--- CAPTURE CHECK ---');
        console.log(`Player: ${currentPlayer}, Pawn: ${pawnToMove.id}, Dice: ${diceValue}`);
        console.log(`Moving from relative pos ${pawnToMove.position} to ${newPosition}`);
        console.log(`Landing on ABSOLUTE board position: ${absoluteTargetPos}`);

        pawns.forEach(p => {
          if (p.color !== currentPlayer && p.position >= 0 && p.position <= 55) {
            const opponentAbsPos = (PATH_MAP[p.color].start + p.position) % 56;
            console.log(`- Opponent ${p.id} (color ${p.color}, rel_pos ${p.position}) is at ABSOLUTE pos ${opponentAbsPos}`);
          }
        });
      }
      // --- End Debugging ---

      // --- JUMP-OVER AND CAPTURE LOGIC ---
      const startPos = pawnToMove.position;
      const endPos = newPosition;

      // Check for illegal jumps over friendly pawns.
      // This applies to moves on the main path and into/within the home stretch.
      const pathToCheck = [];
      
      // Only check for jumps if we're moving more than 1 position
      // AND we're not moving from home base to start (which is a special case)
      if (endPos > startPos + 1 && !(startPos === -1 && endPos === 0)) {
        // Path on the main board (positions 0-55)
        if (startPos >= 0 && startPos <= 55) {
          // Check if moving within main board or into home stretch
          // Handle circular movement (e.g., 55 -> 0)
          if (endPos <= 55) {
            if (startPos < endPos) {
              // Normal forward movement
              for (let i = startPos + 1; i < endPos; i++) {
                pathToCheck.push(i);
              }
            } else {
              // Wrapping around (55 -> 0, 54 -> 1, etc.)
              for (let i = startPos + 1; i < 56; i++) {
                pathToCheck.push(i);
              }
              for (let i = 0; i < endPos; i++) {
                pathToCheck.push(i);
              }
            }
          } else {
            // Moving into home stretch - only check up to position 55
            for (let i = startPos + 1; i < 56; i++) {
              pathToCheck.push(i);
            }
          }
        }
        
        // Path in the home stretch (positions 56-59)
        if (startPos >= 56 && endPos >= 56) {
          // Only add home stretch positions if we're actually moving within it
          for (let i = startPos + 1; i < endPos; i++) {
            pathToCheck.push(i);
          }
        }
      }

      const isJumpingOverTeammate = pathToCheck.length > 0 && pathToCheck.some(pos =>
        pawns.some(p => p.color === currentPlayer && p.position === pos)
      );

      // Debug logging for jump detection
      console.log(`Jump check: startPos=${startPos}, endPos=${endPos}, pathToCheck=[${pathToCheck.join(', ')}], hasTeammate=${isJumpingOverTeammate}`);
       
      // Special debug for 55->56 transition
      if (startPos === 55 && endPos === 56) {
        console.log(`Special case: 55->56 transition`);
        console.log(`Main path positions (0-55): ${pathToCheck.filter(p => p >= 0 && p <= 55).join(', ')}`);
        console.log(`Home stretch positions (56-59): ${pathToCheck.filter(p => p >= 56 && p <= 59).join(', ')}`);
      }
      
      if (isJumpingOverTeammate) {
        const teammatePositions = pathToCheck.filter(pos => 
          pawns.some(p => p.color === currentPlayer && p.position === pos)
        );
        console.log(`Teammate found at positions: [${teammatePositions.join(', ')}]`);
        console.log(`All current player pawns:`, pawns.filter(p => p.color === currentPlayer).map(p => `pos: ${p.position}`));
      }

      if (isJumpingOverTeammate) {
        return { ...state, gameMessage: 'Kendi piyonunun üzerinden atlayamazsın!' };
      }

      // --- Final, Robust Capture Logic (Handles Circular Paths) ---
      if (startPos >= 0 && endPos <= 55) {
        const absoluteStart = (PATH_MAP[currentPlayer].start + startPos) % 56;
        const absoluteEnd = (PATH_MAP[currentPlayer].start + endPos) % 56;

        // Create an array of all absolute squares the pawn travels over INCLUDING the destination.
        const absolutePath = [];
        let currentPathPos = (absoluteStart + 1) % 56;
        while (currentPathPos !== (absoluteEnd + 1) % 56) {
          absolutePath.push(currentPathPos);
          currentPathPos = (currentPathPos + 1) % 56;
        }

        // Check each square on the path for opponents.
        for (const pathSquareAbsolute of absolutePath) {
          const opponentsOnSquare = pawns.filter(p => {
            if (p.color === currentPlayer || p.position < 0 || p.position > 55) return false;
            const opponentAbsPos = (PATH_MAP[p.color].start + p.position) % 56;
            return opponentAbsPos === pathSquareAbsolute;
          });

          for (const opponent of opponentsOnSquare) {
            // Pawns on their own start square are safe.
            const isOpponentOnOwnStart = PATH_MAP[opponent.color].start === pathSquareAbsolute;
            const alreadyCaptured = capturedPawnIds.includes(opponent.id);

            if (!isOpponentOnOwnStart && !alreadyCaptured) {
              capturedPawnIds.push(opponent.id);
              if (!capturedPawnInfo) {
                capturedPawnInfo = { color: opponent.color, nickname: playersInfo[opponent.color].nickname };
              }
            }
          }
        }
      }
      
      // --- Special case: Capture logic for pawns entering from home base ---
      if (startPos === -1 && endPos <= 55) {
        const absoluteEnd = (PATH_MAP[currentPlayer].start + endPos) % 56;
        
        // Check if there are opponents on the destination square
        const opponentsOnDestination = pawns.filter(p => {
          if (p.color === currentPlayer || p.position < 0 || p.position > 55) return false;
          const opponentAbsPos = (PATH_MAP[p.color].start + p.position) % 56;
          return opponentAbsPos === absoluteEnd;
        });

        for (const opponent of opponentsOnDestination) {
          // Pawns on their own start square are safe.
          const isOpponentOnOwnStart = PATH_MAP[opponent.color].start === absoluteEnd;
          const alreadyCaptured = capturedPawnIds.includes(opponent.id);

          if (!isOpponentOnOwnStart && !alreadyCaptured) {
            capturedPawnIds.push(opponent.id);
            if (!capturedPawnInfo) {
              capturedPawnInfo = { color: opponent.color, nickname: playersInfo[opponent.color].nickname };
            }
          }
        }
      }

      // --- Update Pawns --- 
      const updatedPawns = pawns.map(p => {
        if (p.id === pawnId) return { ...p, position: newPosition };
        if (capturedPawnIds.includes(p.id)) return { ...p, position: -1 }; // Send to home
        return p;
      });

      // --- Check for a Winner --- 
      const winner = checkWinCondition(updatedPawns, currentPlayer);
      if (winner) {
        return {
          ...state,
          pawns: updatedPawns,
          diceValue: null,
          gamePhase: 'game-over',
          winner: winner, // The color of the winner
          gameMessage: `${playersInfo[winner].nickname} oyunu kazandı!`,
        };
      }

      // --- Turn Management --- 
      const currentPlayerIndex = state.players.indexOf(currentPlayer);
      const nextPlayer = state.players[(currentPlayerIndex + 1) % state.players.length];
      const getsAnotherTurn = diceValue === 6 || capturedPawnIds.length > 0;
      const nextTurnPlayer = getsAnotherTurn ? currentPlayer : nextPlayer;

      // --- Set Game Message --- 
      let message = '';
      if (capturedPawnInfo) {
        message = `${capturedPawnInfo.nickname}'ın piyonu yakalandı!`;
      }

      if (getsAnotherTurn) {
        message += (message ? ' ' : '') + 'Tekrar zar atın.';
      } else {
        message = `Sıra ${playersInfo[nextTurnPlayer]?.nickname || ''}'da.`;
      }

      return {
        ...state,
        pawns: updatedPawns,
        currentPlayer: nextTurnPlayer,
        diceValue: null, // Reset dice for the next turn
        gameMessage: message,
      };
    }

    case 'UPDATE_PLAYER_SELECTED_PAWN': {
      const { color, selectedPawn } = action.payload;
      return {
        ...state,
        playersInfo: {
          ...state.playersInfo,
          [color]: {
            ...state.playersInfo[color],
            selectedPawn
          }
        }
      };
    }

    default:
      return state;
  }
};

export const useGameEngine = (socket, gameId, userId, mode, playersInfo) => {
  const [state, dispatch] = useReducer(gameReducer, undefined, () =>
    getInitialState(mode, playersInfo)
  );

  // Load selected pawn for the real user (red player)
  useEffect(() => {
    const loadSelectedPawn = async () => {
      try {
        const selectedPawn = await PawnService.getSelectedPawn();
        if (selectedPawn && selectedPawn !== 'default') {
          dispatch({
            type: 'UPDATE_PLAYER_SELECTED_PAWN',
            payload: { color: 'red', selectedPawn }
          });
        }
      } catch (error) {
        console.log('Error loading selected pawn:', error);
      }
    };
    loadSelectedPawn();
  }, []);

  // This consolidated effect handles the AI's entire turn, with logging.
  useEffect(() => {
    // Exit if it's not an AI's turn or the game is over.
    if (state.gamePhase !== 'playing' || !state.aiPlayers.includes(state.currentPlayer) || state.winner) {
      return;
    }

    const isAITurn = state.aiPlayers.includes(state.currentPlayer);

    if (isAITurn) {
      console.log(`\n---[AI TURN START]--- Player: ${state.currentPlayer}`);

      // Step 1: AI needs to roll the dice.
      if (state.diceValue === null) {
        console.log('[AI] Action: Rolling dice...');
        const timer = setTimeout(() => dispatch({ type: 'ROLL_DICE' }), 1000);
        return () => clearTimeout(timer); // Cleanup timer
      }

      // Step 2: AI has rolled, now needs to move.
      console.log(`[AI] State: Dice is ${state.diceValue}. Evaluating moves...`);
      const possibleMoves = getPossibleMoves(state.pawns, state.currentPlayer, state.diceValue);
      console.log('[AI] Info: Found possible moves for pawns:', possibleMoves.map(p => p.id));

      const moveTimer = setTimeout(() => {
        if (possibleMoves.length > 0) {
          console.log('[AI] Action: Choosing best move...');
          const bestMove = chooseBestMove(possibleMoves, state);
          if (bestMove) {
            console.log(`[AI] Action: Moving pawn ${bestMove.id}.`);
            dispatch({ type: 'MOVE_PAWN', payload: { pawnId: bestMove.id } });
          } else {
            console.error('[AI] CRITICAL ERROR: Had possible moves, but chooseBestMove returned nothing. Turn is stuck.');
          }
        } else {
          console.log('[AI] Action: No possible moves. Passing turn.');
          dispatch({ type: 'NEXT_TURN' });
        }
      }, 1500); // Delay for user to see the move

      return () => clearTimeout(moveTimer); // Cleanup timer
    }
  }, [state.currentPlayer, state.diceValue, state.winner, state.gamePhase]); // Reruns on turn change or dice roll

  // Effect to handle pre-game AI rolls for turn order
  useEffect(() => {
    if (state.gamePhase === 'pre-game' && state.aiPlayers.includes(state.currentPlayer)) {
      const timer = setTimeout(() => dispatch({ type: 'ROLL_DICE_FOR_TURN_ORDER' }), 1000);
      return () => clearTimeout(timer);
    }
  }, [state.currentPlayer, state.gamePhase]);

  // Effect to automatically determine the final turn order
  useEffect(() => {
    if (state.gamePhase === 'pre-game' && state.turnOrderRolls.length === state.players.length && !state.turnOrderDetermined) {
      const timer = setTimeout(() => dispatch({ type: 'DETERMINE_TURN_ORDER' }), 1000);
      return () => clearTimeout(timer);
    }
  }, [state.turnOrderRolls, state.gamePhase]);

  // Effect to automatically pass HUMAN player's turn if no moves are possible
  useEffect(() => {
    if (state.diceValue && state.gamePhase === 'playing' && !state.aiPlayers.includes(state.currentPlayer)) {
      const possibleMoves = getPossibleMoves(state.pawns, state.currentPlayer, state.diceValue);
      if (possibleMoves.length === 0) {
        const timer = setTimeout(() => dispatch({ type: 'NEXT_TURN' }), 1500);
        return () => clearTimeout(timer);
      }
    }
  }, [state.diceValue, state.currentPlayer, state.gamePhase, state.winner]);

  // Effect to determine turn order once all players have rolled.
  useEffect(() => {
    if (
      state.gamePhase === 'pre-game' &&
      state.turnOrderRolls.length === state.players.length &&
      !state.turnOrderDetermined // Add this check to prevent re-running
    ) {
      const timer = setTimeout(() => {
        dispatch({ type: 'DETERMINE_TURN_ORDER' });
      }, 1500); // Wait 1.5s to ensure the last roll is visible.

      return () => clearTimeout(timer); // Cleanup timer
    }
  }, [state]); // Depend on the entire state for robustness


  return { state, dispatch };
};
