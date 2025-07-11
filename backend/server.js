const { createServer } = require('http');
const { Server } = require('socket.io');

const httpServer = createServer();
const io = new Server(httpServer, {
  cors: {
    origin: "*", // Development only
    methods: ["GET", "POST"]
  }
});

const PORT = 3001;

// --- Ludo Game Constants ---
const PATHS = {
    red: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40, 41, 42, 43, 44, 45, 46, 47, 48, 49, 50, 51, 52, 101, 102, 103, 104, 105, 106],
    green: [14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40, 41, 42, 43, 44, 45, 46, 47, 48, 49, 50, 51, 52, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 201, 202, 203, 204, 205, 206],
    yellow: [27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40, 41, 42, 43, 44, 45, 46, 47, 48, 49, 50, 51, 52, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 301, 302, 303, 304, 305, 306],
    blue: [40, 41, 42, 43, 44, 45, 46, 47, 48, 49, 50, 51, 52, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 401, 402, 403, 404, 405, 406],
};
const SAFE_SPOTS = [1, 9, 14, 22, 27, 35, 40, 48];
const START_GATES = { red: 1, green: 14, yellow: 27, blue: 40 };
const FINISH_POS = { red: 106, green: 206, yellow: 306, blue: 406 };

let rooms = {};

const getPublicRooms = () => {
  const publicRooms = {};
  for (const id in rooms) {
    if (rooms[id]) {
      publicRooms[id] = {
        id,
        playerCount: rooms[id].players.length,
        isGameStarted: !!rooms[id].gameState,
      };
    }
  }
  return publicRooms;
};

io.on('connection', (socket) => {
  console.log(`User connected: ${socket.id}`);

  socket.on('get_rooms', (callback) => {
    // Ensure callback is a function before calling it
    if (typeof callback === 'function') {
      callback(getPublicRooms());
    }
  });

  socket.on('create_room', ({ nickname }, callback) => {
    const roomId = `room-${socket.id}`;
    rooms[roomId] = {
      id: roomId,
      players: [{ id: socket.id, color: 'red', nickname }],
      gameState: null,
      hostId: socket.id,
    };
    socket.join(roomId);
    console.log(`Room created: ${roomId} by ${socket.id} (${nickname})`);
    io.emit('update_rooms', getPublicRooms());
    callback({ success: true, room: rooms[roomId] });
  });

  socket.on('join_room', ({ roomId, nickname }, callback) => {
    const room = rooms[roomId];
    if (!room) return callback({ success: false, message: 'Room not found' });
    if (room.players.some(p => p.id === socket.id)) return callback({ success: false, message: 'You are already in this room.' });
    if (room.players.length >= 4) return callback({ success: false, message: 'Room is full.' });
    if (room.gameState) return callback({ success: false, message: 'Game has already started.' });

    const assignedColors = room.players.map(p => p.color);
    const availableColors = ['green', 'yellow', 'blue'].filter(c => !assignedColors.includes(c));
    if (availableColors.length === 0) return callback({ success: false, message: 'No available colors left.' });

    const newPlayer = { id: socket.id, color: availableColors[0], nickname };
    room.players.push(newPlayer);
    socket.join(roomId);
    console.log(`User ${socket.id} (${nickname}) joined room ${roomId} as ${newPlayer.color}`);
    io.emit('update_rooms', getPublicRooms());
    io.to(roomId).emit('player_joined', room);
    callback({ success: true, room });
  });

  socket.on('start_game', (roomId, callback) => {
    const room = rooms[roomId];
    if (!room || room.hostId !== socket.id) return callback({ success: false, message: 'Only the host can start.' });
    if (room.players.length < 2) return callback({ success: false, message: 'Need at least 2 players.' });

    const pawns = room.players.flatMap(p => Array.from({ length: 4 }, (_, i) => ({ id: `${p.color}-${i}`, color: p.color, position: 0 })));
    room.gameState = {
      turn: room.players[0].id,
      diceValue: null,
      pawns,
      winner: null,
      message: `Game started! It's ${room.players[0].nickname}'s turn.`
    };
    
    console.log(`Game started in room ${roomId}`);
    io.emit('update_rooms', getPublicRooms());
    io.to(roomId).emit('game_started', room);
    callback({ success: true });
  });

  socket.on('roll_dice', (roomId) => {
    const room = rooms[roomId];
    if (!room || !room.gameState || room.gameState.turn !== socket.id) return;

    const diceValue = Math.floor(Math.random() * 6) + 1;
    room.gameState.diceValue = diceValue;
    const player = room.players.find(p => p.id === socket.id);
    room.gameState.message = `${player.nickname} rolled a ${diceValue}.`;
    io.to(roomId).emit('update_game_state', room.gameState);
  });

  socket.on('move_pawn', ({ roomId, pawnId }) => {
    const room = rooms[roomId];
    if (!room || !room.gameState || room.gameState.turn !== socket.id) return;
    const { gameState } = room;
    const { diceValue } = gameState;
    if (!diceValue) return;

    const player = room.players.find(p => p.id === socket.id);
    const pawn = gameState.pawns.find(p => p.id === pawnId && p.color === player.color);
    if (!pawn) return;

    let givesExtraTurn = false;
    const path = PATHS[player.color];
    
    if (pawn.position === 0) { // Move out of base
      if (diceValue === 6) {
        pawn.position = START_GATES[player.color];
        givesExtraTurn = true;
        gameState.message = `${player.nickname} moved a pawn out!`;
      } else return;
    } else { // Move on board
      const currentPathIndex = path.indexOf(pawn.position);
      const newPathIndex = currentPathIndex + diceValue;
      if (newPathIndex >= path.length) return; // Overshot

      const newPos = path[newPathIndex];
      if (!SAFE_SPOTS.includes(newPos)) {
        gameState.pawns.forEach(p => {
          if (p.position === newPos && p.color !== player.color) {
            p.position = 0; // Send back to base
            givesExtraTurn = true;
            gameState.message = `${player.nickname} hit a pawn!`;
          }
        });
      }
      pawn.position = newPos;
    }

    if (diceValue === 6) givesExtraTurn = true;

    if (gameState.pawns.filter(p => p.color === player.color).every(p => p.position === FINISH_POS[player.color])) {
      gameState.winner = player.id;
      gameState.message = `${player.nickname} wins!`;
    } else if (!givesExtraTurn) {
      const currentPlayerIndex = room.players.findIndex(p => p.id === socket.id);
      const nextPlayerIndex = (currentPlayerIndex + 1) % room.players.length;
      gameState.turn = room.players[nextPlayerIndex].id;
      gameState.message = `It's ${room.players[nextPlayerIndex].nickname}'s turn.`;
    } else {
      gameState.message += ` ${player.nickname} gets an extra turn.`;
    }
    
    gameState.diceValue = null;
    io.to(roomId).emit('update_game_state', gameState);
  });

  socket.on('disconnect', () => {
    console.log(`User disconnected: ${socket.id}`);
    let roomIdFound = null;
    for (const id in rooms) {
        const room = rooms[id];
        if (!room || !room.players) continue; // Defensive check
            const playerIndex = room.players.findIndex(p => p.id === socket.id);
        if (playerIndex !== -1) {
            roomIdFound = id;
            const wasHost = room.hostId === socket.id;
            room.players.splice(playerIndex, 1);

            if (room.players.length === 0) {
                delete rooms[id];
                console.log(`Room ${id} deleted.`);
            } else {
                if (wasHost) room.hostId = room.players[0].id;
                if(room.gameState && room.gameState.turn === socket.id && !room.gameState.winner) {
                    room.gameState.turn = room.players[0].id; // Pass turn to new host
                    room.gameState.message = `A player left. It's now ${room.players[0].nickname}'s turn.`;
                }
                io.to(id).emit('player_left', room);
            }
            break;
        }
    }
    if (roomIdFound) io.emit('update_rooms', getPublicRooms());
  });
});

httpServer.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
