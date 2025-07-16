const COLORS = ['red', 'green', 'blue', 'yellow'];

const getInitialPawns = (players) => {
  const pawns = {};
  players.forEach((player) => {
    for (let i = 0; i < 4; i++) {
      const pawnId = `${player.color}-${i}`;
      pawns[pawnId] = {
        id: pawnId,
        color: player.color,
        position: -1, // -1 means in base
        step: -1,
        isHome: false,
      };
    }
  });
  return pawns;
};

const getInitialState = (players, hostId) => {
    const playersInfo = {};
    const turnOrder = [];

    // Assign colors and initial info to players
    players.forEach((player, index) => {
        const color = COLORS[index];
        playersInfo[player.id] = { ...player, color };
        turnOrder.push(player.id);
    });
    
    const coloredPlayers = players.map((p, i) => ({...p, color: COLORS[i]}));

    return {
        gamePhase: 'waiting', // waiting, playing, game-over
        pawns: getInitialPawns(coloredPlayers),
        currentPlayerId: null,
        diceValue: null,
        isRolling: false,
        winner: null,
        gameMessage: 'Waiting for players...',
        turnOrder: turnOrder,
        playersInfo: playersInfo,
        hostId: hostId,
    };
};

// A very simplified dice roll handler
const handleDiceRoll = (gameState, userId) => {
    if (gameState.currentPlayerId !== userId) {
        console.log(`Not player's turn. Current: ${gameState.currentPlayerId}, Requester: ${userId}`);
        return gameState; // Not your turn
    }

    const newState = { ...gameState };
    newState.diceValue = Math.floor(Math.random() * 6) + 1;
    newState.gameMessage = `${newState.playersInfo[userId].username} rolled a ${newState.diceValue}`;
    newState.isRolling = false; // Allow piece move

    return newState;
};

// A very simplified piece move handler
const handlePieceMove = (gameState, userId, pieceIndex) => {
    if (gameState.currentPlayerId !== userId) {
        return gameState; // Not your turn
    }

    const newState = { ...gameState };
    // TODO: Implement actual move logic
    console.log(`Player ${userId} wants to move piece ${pieceIndex} with dice ${newState.diceValue}`);

    // Advance turn
    const currentIndex = newState.turnOrder.indexOf(userId);
    const nextPlayerId = newState.turnOrder[(currentIndex + 1) % newState.turnOrder.length];
    newState.currentPlayerId = nextPlayerId;
    newState.diceValue = null;
    newState.gameMessage = `It's ${newState.playersInfo[nextPlayerId].username}'s turn.`;

    return newState;
};


module.exports = { getInitialState, handleDiceRoll, handlePieceMove };
