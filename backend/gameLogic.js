const PATH_MAP = {
  red: {
    start: 41,
    homeEntry: 40,
  },
  green: {
    start: 55,
    homeEntry: 54,
  },
  yellow: {
    start: 13,
    homeEntry: 12,
  },
  blue: {
    start: 27,
    homeEntry: 26,
  },
};

const getPossibleMoves = (pawns, playerColor, diceValue) => {
  const movablePawns = [];
  for (const pawn of pawns.filter(p => p.color === playerColor)) {
    if (pawn.position === 59) continue; // Already at goal

    let finalLandingPos = -99;

    if (pawn.position === -1) { // At home base
      if (diceValue === 6) finalLandingPos = 0;
    } else if (pawn.position >= 56) { // In home stretch
      if (pawn.position + diceValue <= 59) finalLandingPos = pawn.position + diceValue;
    } else { // On main path
      const currentRelativePos = pawn.position;
      const startAbsPos = PATH_MAP[playerColor].start;
      const homeEntryAbsPos = PATH_MAP[playerColor].homeEntry;
      const currentAbsPos = (startAbsPos + currentRelativePos) % 56;
      let stepsToHomeEntry = homeEntryAbsPos >= currentAbsPos ? homeEntryAbsPos - currentAbsPos : (56 - currentAbsPos) + homeEntryAbsPos;
      const stepsToEnterHomeStretch = stepsToHomeEntry + 1;

      if (diceValue < stepsToEnterHomeStretch) {
        finalLandingPos = currentRelativePos + diceValue;
      } else {
        const stepsIntoHomeStretch = diceValue - stepsToEnterHomeStretch;
        if (stepsIntoHomeStretch <= 3) {
          finalLandingPos = 56 + stepsIntoHomeStretch;
        }
      }
    }

    if (finalLandingPos === -99) continue;

    const isLandingOnTeammate = pawns.some(p => p.color === playerColor && p.id !== pawn.id && p.position === finalLandingPos);
    if (isLandingOnTeammate) continue;

    movablePawns.push(pawn);
  }
  return movablePawns;
};

const checkWinCondition = (pawns, playerColor) => {
  const playerPawns = pawns.filter(p => p.color === playerColor);
  return playerPawns.every(p => p.position >= 56);
};

const handleRollDice = (gameState, player) => {
  if (gameState.turn !== player.id) return { ...gameState, message: "Not your turn." };

  const diceValue = Math.floor(Math.random() * 6) + 1;
  const possibleMoves = getPossibleMoves(gameState.pawns, player.color, diceValue);

  const message = possibleMoves.length === 0 ? `You rolled a ${diceValue}. No possible moves.` : `You rolled a ${diceValue}. Select a pawn to move.`

  return {
    ...gameState,
    diceValue,
    message,
    possibleMoves: possibleMoves.map(p => p.id),
  };
};

const handleMovePawn = (gameState, player, pawnId) => {
  const { pawns, diceValue, turn, players } = gameState;
  if (turn !== player.id) return { ...gameState, message: "Not your turn." };

  const pawnToMove = pawns.find(p => p.id === pawnId);
  if (!pawnToMove || pawnToMove.color !== player.color) return { ...gameState, message: "Invalid pawn selected." };

  const possibleMoves = getPossibleMoves(pawns, player.color, diceValue);
  if (!possibleMoves.some(p => p.id === pawnId)) return { ...gameState, message: "This pawn cannot be moved." };

  let newPosition;
  if (pawnToMove.position === -1) {
    newPosition = 0;
  } else if (pawnToMove.position >= 56) {
    newPosition = pawnToMove.position + diceValue;
  } else {
    const currentRelativePos = pawnToMove.position;
    const startAbsPos = PATH_MAP[player.color].start;
    const homeEntryAbsPos = PATH_MAP[player.color].homeEntry;
    const currentAbsPos = (startAbsPos + currentRelativePos) % 56;
    let stepsToHomeEntry = homeEntryAbsPos >= currentAbsPos ? homeEntryAbsPos - currentAbsPos : (56 - currentAbsPos) + homeEntryAbsPos;
    const stepsToEnterHomeStretch = stepsToHomeEntry + 1;

    if (diceValue < stepsToEnterHomeStretch) {
      newPosition = currentRelativePos + diceValue;
    } else {
      const stepsIntoHomeStretch = diceValue - stepsToEnterHomeStretch;
      newPosition = 56 + stepsIntoHomeStretch;
    }
  }

  const newPawns = pawns.map(p => p.id === pawnId ? { ...p, position: newPosition } : p);

  // Capture logic
  const landingAbsPos = (PATH_MAP[player.color].start + newPosition) % 56;
  let message = `Pawn moved.`;
  newPawns.forEach(pawn => {
    if (pawn.color !== player.color && pawn.position !== -1 && pawn.position < 56) {
      const opponentAbsPos = (PATH_MAP[pawn.color].start + pawn.position) % 56;
      if (opponentAbsPos === landingAbsPos) {
        pawn.position = -1; // Send back to base
        message = `Pawn moved and captured an opponent!`;
      }
    }
  });

  const winner = checkWinCondition(newPawns, player.color) ? player.id : null;
  if (winner) {
    return { ...gameState, pawns: newPawns, winner, message: `${player.nickname} has won the game!` };
  }

  const currentPlayerIndex = players.findIndex(p => p.id === player.id);
  const nextPlayer = diceValue === 6 ? players[currentPlayerIndex] : players[(currentPlayerIndex + 1) % players.length];

  return {
    ...gameState,
    pawns: newPawns,
    turn: nextPlayer.id,
    diceValue: null,
    possibleMoves: [],
    message: `${message} It's now ${nextPlayer.nickname}'s turn.`
  };
};

module.exports = { handleRollDice, handleMovePawn };
