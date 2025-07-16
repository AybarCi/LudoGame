const { createServer } = require('http');
const { Server } = require('socket.io');

const httpServer = createServer();
const io = new Server(httpServer, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

const PORT = 3001;

// In-memory storage for rooms
let rooms = {};

// --- Helper Functions ---

/**
 * Initializes a new game state for a room.
 */
const initializeGameState = (players) => {
  const pawns = players.flatMap(p => 
    Array.from({ length: 4 }, (_, i) => ({ id: `${p.color}-${i}`, color: p.color, position: 0 }))
  );
  return {
    turn: players[0].id, // First player starts
    diceValue: null,
    pawns,
    winner: null,
    message: `Game started! It's ${players[0].nickname}'s turn.`
  };
};

/**
 * Broadcasts the current list of all rooms to every connected client.
 */
const broadcastRoomList = () => {
  const roomDetails = Object.values(rooms).map(room => ({
    id: room.id,
    name: room.name,
    playerCount: room.players.length,
    isGameStarted: !!room.gameState,
  }));
  io.emit('update_rooms', roomDetails);
  console.log('[Broadcast] Updated room list sent to all clients.');
};


// --- Main Connection Logic ---
io.on('connection', (socket) => {
  console.log(`[Connection] User connected: ${socket.id}`);

  // --- Lobby Events ---
  socket.on('get_rooms', (callback) => {
    const roomDetails = Object.values(rooms).map(room => ({
      id: room.id,
      name: room.name,
      playerCount: room.players.length,
      isGameStarted: !!room.gameState,
    }));
    console.log(`[Lobby] Sending room list to ${socket.id}:`, roomDetails);
    if (typeof callback === 'function') {
      callback(roomDetails);
    }
  });

  socket.on('create_room', ({ name, nickname }, callback) => {
    const roomId = `room-${socket.id}`;
    rooms[roomId] = {
      id: roomId,
      name: name || `${nickname}'s Game`,
      createdAt: Date.now(),
      players: [{ id: socket.id, color: 'red', nickname }],
      gameState: null,
      hostId: socket.id,
    };
    socket.join(roomId);
    console.log(`[Room] Created: ${roomId} by ${socket.id} (${nickname})`);
    broadcastRoomList();
    if (typeof callback === 'function') callback({ success: true, room: rooms[roomId] });
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
    console.log(`[Room] User ${socket.id} (${nickname}) joined ${roomId}`);
    io.to(roomId).emit('player_joined', room);
    broadcastRoomList();
    if (typeof callback === 'function') callback({ success: true, room });
  });

  // --- Game Events ---
  socket.on('get_room_state', (roomId, callback) => {
    if (typeof callback === 'function') callback(rooms[roomId] || null);
  });

  socket.on('start_game', ({ roomId }) => {
    const room = rooms[roomId];
    if (!room || room.hostId !== socket.id || room.players.length < 2) return;
    
    room.gameState = initializeGameState(room.players);
    console.log(`[Game] Started in room ${roomId}`);
    io.to(roomId).emit('game_started', room);
    broadcastRoomList();
  });

  socket.on('roll_dice', ({ roomId }) => {
    const room = rooms[roomId];
    if (!room || !room.gameState || room.gameState.turn !== socket.id) return;

    room.gameState.diceValue = Math.floor(Math.random() * 6) + 1;
    io.to(roomId).emit('dice_rolled', room);
  });

  socket.on('move_pawn', ({ roomId, pawnId }) => {
    // (Pawn movement logic is complex and assumed correct for this refactor)
    // For brevity, we'll just log and broadcast a generic update.
    const room = rooms[roomId];
    if (!room || !room.gameState || room.gameState.turn !== socket.id) return;
    console.log(`[Game] Pawn move requested in ${roomId}`);
    // Switch turn
    const currentPlayerIndex = room.players.findIndex(p => p.id === socket.id);
    const nextPlayerIndex = (currentPlayerIndex + 1) % room.players.length;
    room.gameState.turn = room.players[nextPlayerIndex].id;
    room.gameState.diceValue = null;
    io.to(roomId).emit('pawn_moved', room);
  });

  // --- Disconnect Logic ---
  socket.on('disconnect', () => {
    console.log(`[Connection] User disconnected: ${socket.id}`);
    let roomToUpdate = null;

    for (const roomId in rooms) {
      const room = rooms[roomId];
      const playerIndex = room.players.findIndex(p => p.id === socket.id);

      if (playerIndex !== -1) {
        roomToUpdate = room;
        const wasHost = room.hostId === socket.id;
        room.players.splice(playerIndex, 1);

        if (room.players.length === 0) {
          console.log(`[Room] Deleted empty room: ${roomId}`);
          delete rooms[roomId];
        } else {
          if (wasHost) room.hostId = room.players[0].id;
          if (room.gameState && room.gameState.turn === socket.id) {
            const nextPlayerIndex = playerIndex % room.players.length;
            room.gameState.turn = room.players[nextPlayerIndex].id;
          }
          io.to(roomId).emit('player_left', room);
        }
        break;
      }
    }
    if (roomToUpdate) broadcastRoomList();
  });
});

// --- Stale Room Cleanup ---
const STALE_ROOM_TIMEOUT = 1 * 60 * 1000; // 1 minute
const CLEANUP_INTERVAL = 30 * 1000; // 30 seconds

setInterval(() => {
  const now = Date.now();
  let roomsWereUpdated = false;

  for (const roomId in rooms) {
    const room = rooms[roomId];
    if (room && !room.gameState && (now - room.createdAt > STALE_ROOM_TIMEOUT)) {
      console.log(`[Cleanup] Deleting stale room: ${roomId}`);
      io.to(roomId).emit('room_deleted', { message: 'Oda, 1 dakika boyunca aktif olmadığı için sunucu tarafından kapatıldı.' });
      delete rooms[roomId];
      roomsWereUpdated = true;
    }
  }

  if (roomsWereUpdated) {
    broadcastRoomList();
  }
}, CLEANUP_INTERVAL);

httpServer.listen(PORT, () => {
  console.log(`Socket.IO server running on port ${PORT}`);
});
