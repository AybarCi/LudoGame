const express = require('express');
const { PLAYER_COLORS, HOME_POSITIONS, START_POSITIONS, HOME_ENTRANCE, PATH_LENGTH, HOME_STRETCH_LENGTH, GOAL_POSITION, PATH_MAP, SAFE_SPOTS } = require('./constants');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');

const app = express();
app.use(cors());
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

const PORT = 3001;
const BOT_NAMES = ["Aslı", "Can", "Efe", "Gizem"];



let rooms = {};
const roomTimeouts = {}; // roomId: timeoutId

// --- Veri Yapısı Dönüştürücüleri ---
const convertPositionsToPawns = (positions) => {
    const pawns = [];
    Object.keys(positions).forEach(color => {
        positions[color].forEach((pos, index) => {
            pawns.push({ id: `${color}-${index}`, color, position: pos });
        });
    });
    return pawns;
};

// --- Yardımcı Fonksiyonlar ---
const updateRoom = (roomId) => {
    const room = rooms[roomId];
    if (room) {
        // Her güncellemede pozisyonları piyon formatına çevir
        const roomStateForClient = {
            id: room.id,
            players: room.players,
            hostId: room.hostId,
            phase: room.gameState?.phase,
            gameState: {
                phase: room.gameState.phase,
                currentPlayer: room.gameState.currentPlayer,
                diceValue: room.gameState.diceValue,
                turnOrder: room.gameState.turnOrder,
                turnOrderRolls: room.gameState.turnOrderRolls,
                validMoves: room.gameState.validMoves,
                positions: room.gameState.positions,
                message: room.gameState.message,
                pawns: convertPositionsToPawns(room.gameState.positions)
            }
        };
        io.to(roomId).emit('room_updated', roomStateForClient);
        broadcastRoomList();
    }
};

const broadcastRoomList = () => {
    // Oda listesinde sadece botlardan oluşan odaları asla gösterme!
    const roomDetails = Object.values(rooms)
        .filter(r => r.players.some(p => !p.isBot)) // En az 1 insan varsa göster
        .map(r => ({ id: r.id, playerCount: r.players.length, phase: r.gameState.phase }));
    io.emit('update_rooms', roomDetails);
};

const deleteRoom = (roomId, reason) => {
    if (rooms[roomId]) {
        const room = rooms[roomId];
        console.log(`[DEBUG] deleteRoom called for roomId=${roomId}, reason='${reason}'. Room state before delete:`, JSON.stringify({
            players: room.players,
            phase: room.gameState?.phase,
            hostId: room.hostId,
            createdAt: room.createdAt
        }, null, 2));
        // Timeout'u temizle
        if (roomTimeouts[roomId]) {
            clearTimeout(roomTimeouts[roomId]);
            delete roomTimeouts[roomId];
        }
        console.log(`[Temizlik] Oda siliniyor: ${roomId}. Sebep: ${reason}`);
        io.to(roomId).emit('room_closed', { reason });
        console.log(`[DEBUG] room_closed event emitted for roomId=${roomId}, reason='${reason}'`);
        delete rooms[roomId];
        broadcastRoomList();
    }
};

const getValidMoves = (player, diceValue, room) => {
    const { color, pawns } = player;
    const { players } = room.gameState;
    const moves = [];

    const startPos = START_POSITIONS[color];
    const homeEntry = HOME_ENTRANCE[color];
    const playerPath = PATH_MAP[color];

    pawns.forEach((pawn, pawnIndex) => {
        const currentPos = pawn.position;

        // 1. Handle starting a pawn from home
        if (currentPos >= 100 && diceValue === 6) {
            const targetPos = startPos;
            const isOccupiedByOwnPawn = pawns.some(p => p.position === targetPos);
            if (!isOccupiedByOwnPawn) {
                moves.push({ pawnIndex, from: currentPos, to: targetPos, type: 'start' });
            }
        }
        // 2. Handle moves for pawns already on the board
        else if (currentPos < 100) {
            const relativePosition = playerPath.indexOf(currentPos);
            const newRelativePosition = relativePosition + diceValue;

            // 2a. Handle finishing a pawn
            if (newRelativePosition >= PATH_LENGTH) {
                const stepsIntoHome = newRelativePosition - PATH_LENGTH;
                if (stepsIntoHome < HOME_STRETCH_LENGTH) {
                    const targetPos = PATH_LENGTH + stepsIntoHome; // e.g., 56, 57, ...
                    const isOccupiedByOwnPawn = pawns.some(p => p.position === targetPos);
                     if (!isOccupiedByOwnPawn) {
                        moves.push({ pawnIndex, from: currentPos, to: targetPos, type: 'home' });
                    }
                }
            }
            // 2b. Handle a regular move on the main path
            else {
                const targetPos = playerPath[newRelativePosition];
                const isOccupiedByOwnPawn = pawns.some(p => p.position === targetPos);
                if (!isOccupiedByOwnPawn) {
                    moves.push({ pawnIndex, from: currentPos, to: targetPos, type: 'move' });
                }
            }
        }
    });

    return moves;
};

const handlePawnMove = (room, player, move) => {
    const { players } = room.gameState;
    const { color } = player;
    const pawnToMove = player.pawns[move.pawnIndex];
    pawnToMove.position = move.to;

    let capturedPawnInfo = null;

    // Capture logic: only on the main path and not on safe spots.
    if (move.to < PATH_LENGTH && !SAFE_POSITIONS.includes(move.to)) {
        for (const otherPlayer of players) {
            if (otherPlayer.color !== color) {
                for (let i = 0; i < otherPlayer.pawns.length; i++) {
                    if (otherPlayer.pawns[i].position === move.to) {
                        // A pawn was captured, send it home.
                        otherPlayer.pawns[i].position = HOME_POSITIONS[otherPlayer.color][i];
                        capturedPawnInfo = { color: otherPlayer.color, pawnIndex: i };
                        console.log(`[Capture] ${color} captured ${otherPlayer.color}'s pawn at ${move.to}`);
                        break; // Only one pawn can be captured at a time.
                    }
                }
            }
            if (capturedPawnInfo) break;
        }
    }

    // Check for win condition
    const pawnsInGoal = player.pawns.filter(p => p.position >= PATH_LENGTH).length;
    if (pawnsInGoal === 4) {
        room.gameState.phase = 'finished';
        room.gameState.winner = color;
        room.gameState.message = `${player.nickname} oyunu kazandı!`;
        console.log(`[Game Over] Player ${player.nickname} (${color}) won the game in room ${room.id}.`);
    }

    return capturedPawnInfo;
};

const updateTurn = (room) => {
    const { turnOrder, currentPlayer } = room.gameState;
    const currentIndex = turnOrder.indexOf(currentPlayer);
    const nextIndex = (currentIndex + 1) % turnOrder.length;
    const nextPlayerColor = turnOrder[nextIndex];
    
    room.gameState.currentPlayer = nextPlayerColor;
    room.gameState.diceValue = null;
    room.gameState.validMoves = [];
    const nextPlayer = room.players.find(p => p.color === nextPlayerColor);
    room.gameState.message = `Sıra ${nextPlayer.nickname} oyuncusunda.`;
    
    updateRoom(room.id);
    playBotTurnIfNeeded(room.id);
};

const playBotTurnIfNeeded = (roomId) => {
    const room = rooms[roomId];

    // Safety check: Ensure the room, its game state, and the phase are correct before proceeding.
    if (!room || !room.gameState || room.gameState.phase !== 'playing') {
        // console.log(`[Bot Turn] Skipped for room ${roomId}. Reason: No room, no gameState, or phase is not 'playing'.`);
        return;
    }

    const currentPlayer = room.players.find(p => p.color === room.gameState.currentPlayer);
    if (!currentPlayer || !currentPlayer.isBot) return;

    setTimeout(() => {
        const diceValue = Math.floor(Math.random() * 6) + 1;
        room.gameState.diceValue = diceValue;
        
        const validMoves = getValidMoves(currentPlayer, diceValue, room);
        room.gameState.validMoves = validMoves;
        updateRoom(roomId);

        setTimeout(() => {
            if (validMoves.length > 0) {
                const chosenMove = validMoves[Math.floor(Math.random() * validMoves.length)];
                
                const capturedPawn = handlePawnMove(room, currentPlayer, chosenMove);
                const pawnFinished = chosenMove.to === GOAL_POSITION;
                const moveAgain = diceValue === 6 || capturedPawn || pawnFinished;

                if (room.gameState.phase === 'finished') {
                     updateRoom(roomId);
                     return;
                }

                if (moveAgain) {
                    room.gameState.diceValue = null;
                    room.gameState.validMoves = [];
                    room.gameState.message = `${currentPlayer.nickname} tekrar oynayacak.`;
                } else {
                    updateTurn(room);
                }
            } else {
                updateTurn(room);
            }
        }, 1000);
    }, 1500);
};

const determineTurnOrder = (roomId) => {
    const room = rooms[roomId];
    if (!room || room.players.length < 2) return;

    // Tüm oyuncular (botlar dahil) zar attı mı kontrol et
    if (room.gameState.turnOrderRolls.length === room.players.length) {
        console.log(`[Turn Order] All players rolled in room ${roomId}. Determining order.`);
        room.gameState.turnOrderRolls.sort((a, b) => b.roll - a.roll);
        const turnOrder = room.gameState.turnOrderRolls.map(r => r.color);
        room.gameState.turnOrder = turnOrder;
        room.gameState.currentPlayer = turnOrder[0];
        room.gameState.phase = 'playing';
        room.gameState.message = `${room.gameState.turnOrderRolls[0].nickname} oyuna başlıyor!`
        
        // Emit game_started event to all players in the room
        room.players.forEach(player => {
            io.to(player.id).emit('game_started', room);
        });
        
        updateRoom(roomId);
        playBotTurnIfNeeded(roomId); // İlk oyuncu botsa, oynaması için tetikle
    }
};

const handleBotTurnOrderRolls = (roomId) => {
    const room = rooms[roomId];
    if (!room || room.gameState.phase !== 'pre-game') return;

    const botsToRoll = room.players.filter(p => p.isBot && !room.gameState.turnOrderRolls.some(r => r.color === p.color));

    if (botsToRoll.length === 0) {
        // Bot kalmadıysa, sırayı belirlemeyi dene (belki de son atan insandı)
        determineTurnOrder(roomId);
        return;
    }

    botsToRoll.forEach((bot, index) => {
        setTimeout(() => {
            if (!rooms[roomId]) return; // Oda zaman aşımıyla silinmiş olabilir
            const roll = Math.floor(Math.random() * 6) + 1;
            room.gameState.turnOrderRolls.push({ nickname: bot.nickname, roll, color: bot.color });
            console.log(`[Bot Turn Order] Bot ${bot.nickname} rolled a ${roll} in room ${roomId}`);
            updateRoom(roomId);

            // Her bot attıktan sonra sıranın belirlenip belirlenmediğini kontrol et
            determineTurnOrder(roomId);

        }, (index + 1) * 1000); // Botların atışları arasına 1 saniye ekle
    });
};

// --- Socket.IO Bağlantı Mantığı ---
io.on('connection', (socket) => {
    console.log('Bir kullanıcı bağlandı:', socket.id);

    socket.on('get_rooms', (callback) => {
        const roomDetails = Object.values(rooms).map(r => ({ id: r.id, playerCount: r.players.length, phase: r.gameState.phase }));
        if (typeof callback === 'function') callback(roomDetails);
    });

    socket.on('get_room_state', (roomId, callback) => {
        const room = rooms[roomId];
        if (room) {
            const roomStateForClient = {
                ...room,
                gameState: {
                    ...room.gameState,
                    pawns: convertPositionsToPawns(room.gameState.positions)
                }
            };
            if (typeof callback === 'function') callback(roomStateForClient);
        }
    });

    socket.on('create_room', ({ nickname, playerCount }, callback) => {
        const roomId = uuidv4().substring(0, 6);
        const hostPlayer = {
            id: socket.id,
            nickname,
            color: 'red',
            isBot: false,
            isReady: true,
            pawns: HOME_POSITIONS['red'].map(pos => ({ position: pos }))
        };
        const room = {
            id: roomId,
            players: [hostPlayer],
            gameState: {
                phase: 'waiting',
                currentPlayer: null, 
                diceValue: null, 
                turnOrder: [], 
                turnOrderRolls: [], 
                validMoves: [],
                positions: { 
                    red: [-1,-1,-1,-1], 
                    green: [-1,-1,-1,-1], 
                    blue: [-1,-1,-1,-1], 
                    yellow: [-1,-1,-1,-1] 
                },
                message: 'Oyuncular bekleniyor...'
            },
            hostId: socket.id
        };
        rooms[roomId] = room;
        socket.join(roomId);
        
        if (typeof callback === 'function') callback({ success: true, room });

        updateRoom(roomId);
        broadcastRoomList();

        // 20 saniye bekleme süresi başlat (her zaman, oda dolsa bile)
        roomTimeouts[roomId] = setTimeout(() => {
            const currentRoom = rooms[roomId];
            if (!currentRoom) return;
            
            const playerCount = currentRoom.players.length;
            const maxPlayers = 4;
            const colors = ['green', 'blue', 'yellow'];
            const usedColors = currentRoom.players.map(p => p.color);
            const availableColors = colors.filter(c => !usedColors.includes(c));
            const availableBotNames = [...BOT_NAMES];

            // Eksik oyuncuları bot ile tamamla
            for (let i = 0; i < maxPlayers - playerCount; i++) {
                const color = availableColors[i];
                const botNameIndex = Math.floor(Math.random() * availableBotNames.length);
                const botName = availableBotNames.splice(botNameIndex, 1)[0];
                const botPlayer = {
                    id: `bot-${uuidv4()}`,
                    nickname: botName,
                    color,
                    isBot: true,
                    isReady: true,
                    pawns: HOME_POSITIONS[color].map(pos => ({ position: pos }))
                };
                currentRoom.players.push(botPlayer);
            }
            
            currentRoom.gameState.phase = 'pre-game';
            currentRoom.gameState.message = 'Sırayı belirlemek için zar atın!';
            console.log(`[Auto Start] Room ${roomId} starting pre-game after waiting period.`);
            updateRoom(roomId);
        }, 20000);
    });

    socket.on('join_room', ({ roomId, nickname }, callback) => {
        const room = rooms[roomId];
        if (!room) {
            return callback({ success: false, message: 'Oda bulunamadı.' });
        }

        // Reconnect logic
        const disconnectedPlayer = room.players.find(p => p.nickname === nickname && p.disconnected);
        if (disconnectedPlayer) {
            clearTimeout(disconnectedPlayer.disconnectTimer);
            delete disconnectedPlayer.disconnected;
            delete disconnectedPlayer.disconnectTimer;
            disconnectedPlayer.id = socket.id; // Update socket id
            socket.join(roomId);
            console.log(`[Reconnect] Player ${nickname} reconnected to room ${roomId}.`);
            updateRoom(roomId);
            return callback({ success: true, room });
        }

        if (room.players.length >= 4) {
            return callback({ success: false, message: 'Oda dolu.' });
        }

        const color = ['red', 'green', 'blue', 'yellow'].find(c => !room.players.some(p => p.color === c));
        if (!color) {
            return callback({ success: false, message: 'Oda için uygun renk bulunamadı.'});
        }
        const player = {
            id: socket.id,
            nickname,
            color,
            isBot: false,
            isReady: true,
            pawns: HOME_POSITIONS[color].map(pos => ({ position: pos }))
        };
        room.players.push(player);
        socket.join(roomId);

        if (typeof callback === 'function') callback({ success: true, room });

        console.log(`[Player Joined] ${nickname} joined room ${roomId}. Total players: ${room.players.length}`);

        // Eğer katılan oyuncuyla oda dolduysa, oyunu başlat
        if (room.players.length === 4) {
            room.gameState.phase = 'pre-game';
            console.log(`[Room Full] Room ${roomId} is now full, starting pre-game.`);
            if(roomTimeouts[roomId]) {
                clearTimeout(roomTimeouts[roomId]);
                delete roomTimeouts[roomId];
            }
        }

        updateRoom(roomId);
        broadcastRoomList();

        // 20 saniye bekleme süresi başlat (eğer oda dolmadıysa)
        if (room.players.length < 4 && !roomTimeouts[roomId]) {
            roomTimeouts[roomId] = setTimeout(() => {
                const currentRoom = rooms[roomId];
                if (!currentRoom || currentRoom.players.length === 4) return;
                
                const playerCount = currentRoom.players.length;
                const maxPlayers = 4;
                const colors = ['red', 'green', 'blue', 'yellow'];
                const usedColors = currentRoom.players.map(p => p.color);
                const availableColors = colors.filter(c => !usedColors.includes(c));
                const availableBotNames = [...BOT_NAMES];

                for (let i = 0; i < maxPlayers - playerCount; i++) {
                    const color = availableColors[i];
                    const botNameIndex = Math.floor(Math.random() * availableBotNames.length);
                    const botName = availableBotNames.splice(botNameIndex, 1)[0];
                    const botPlayer = {
                        id: `bot-${uuidv4()}`,
                        nickname: botName,
                        color,
                        isBot: true,
                        isReady: true,
                        pawns: HOME_POSITIONS[color].map(pos => ({ position: pos }))
                    };
                    currentRoom.players.push(botPlayer);
                }
                currentRoom.gameState.phase = 'pre-game';
                currentRoom.gameState.message = 'Sırayı belirlemek için zar atın!';
                console.log(`[Auto Start] Room ${roomId} auto-starting with bots.`);
                updateRoom(roomId);
            }, 20000);
        }
    });

    socket.on('roll_dice_for_turn_order', ({ roomId }) => {
        const room = rooms[roomId];
        const player = room?.players.find(p => p.id === socket.id);
        if (!room || !player || room.gameState.phase !== 'pre-game') return;
        if (room.gameState.turnOrderRolls.some(r => r.color === player.color)) return;

        const roll = Math.floor(Math.random() * 6) + 1;
        room.gameState.turnOrderRolls.push({ nickname: player.nickname, roll, color: player.color });
        
        updateRoom(roomId);
        // İnsan oyuncu attıktan sonra botları tetikle
        handleBotTurnOrderRolls(roomId);
    });

    socket.on('roll_dice', ({ roomId }) => {
        const room = rooms[roomId];
        const player = room?.players.find(p => p.id === socket.id);
        if (!room || !player || player.color !== room.gameState.currentPlayer || room.gameState.diceValue) return;

        const diceValue = Math.floor(Math.random() * 6) + 1;
        room.gameState.diceValue = diceValue;
        
        const validMoves = getValidMoves(player, diceValue, room);
        room.gameState.validMoves = validMoves;

        if (validMoves.length === 0) {
            room.gameState.message = `${player.nickname} oynayacak hamlesi yok.`;
            updateRoom(roomId);
            setTimeout(() => updateTurn(room), 1500);
        } else {
            room.gameState.message = `${player.nickname} piyonunu seç.`;
            updateRoom(roomId);
        }
    });

    socket.on('move_pawn', ({ roomId, pawnId }) => {
        const room = rooms[roomId];
        const player = room?.players.find(p => p.id === socket.id);
        if (!room || !player || player.color !== room.gameState.currentPlayer) return;

        // --- YENİ GÜVENLİK KONTROLÜ ---
        // Oyuncunun sadece kendi piyonunu oynayabildiğinden emin ol.
        const pawnColor = pawnId.split('-')[0];
        if (pawnColor !== player.color) {
            console.error(`[SECURITY] Player ${player.nickname} (${player.color}) tried to move opponent's pawn ${pawnId}.`);
            return; // Hamleyi reddet
        }

        const [color, pawnIndexStr] = pawnId.split('-');
        const pawnIndex = parseInt(pawnIndexStr, 10);

        const move = room.gameState.validMoves.find(m => m.pawnIndex === pawnIndex);
        if (!move) return console.error('Geçersiz hamle denemesi!');

        const capturedPawn = handlePawnMove(room, player, move);
        const pawnFinished = move.to === GOAL_POSITION;
        const moveAgain = room.gameState.diceValue === 6 || capturedPawn || pawnFinished;

        if (room.gameState.phase === 'finished') {
            updateRoom(roomId);
            return;
        }

        if (moveAgain) {
            room.gameState.diceValue = null;
            room.gameState.validMoves = [];
            room.gameState.message = `${player.nickname} tekrar oynayacak.`;
        } else {
            updateTurn(room);
        }
        updateRoom(roomId);
    });

    socket.on('leave_room', () => {
        const roomId = Array.from(socket.rooms).find(r => r !== socket.id);
        if (!roomId || !rooms[roomId]) return;
        const room = rooms[roomId];
        const isHost = room.hostId === socket.id;
        const phase = room.gameState.phase;
        room.players = room.players.filter(p => p.id !== socket.id);
        socket.leave(roomId);
        socket.emit('left_room_success');

        // Eğer oda kurucusu çıkıyor ve oyun başlamadıysa (waiting veya pre-game), odayı sil
        if (isHost && (phase === 'waiting' || phase === 'pre-game')) {
            deleteRoom(roomId, 'Oda kurucusu çıkınca oda silindi.');
            return;
        }

        if (room.players.filter(p => !p.isBot).length === 0) {
            deleteRoom(roomId, 'Tüm oyuncular ayrıldı.');
        } else {
            // Ekstra güvenlik: Sadece botlar kaldıysa odayı sil (ghost room fix)
            if (room.players.every(p => p.isBot)) {
                console.warn(`[GhostRoomFix] Bot-only room detected after leave_room, force deleting: ${roomId}`);
                deleteRoom(roomId, 'Sadece botlar kaldı (ghost room fix)');
                return;
            }
            if (isHost) {
                const newHost = room.players.find(p => !p.isBot);
                if (newHost) room.hostId = newHost.id;
            }
            updateRoom(roomId);
        }
    });

    socket.on('disconnect', () => {
        console.log('Bir kullanıcı ayrıldı:', socket.id);
        const roomId = Object.keys(rooms).find(id => rooms[id].players.some(p => p.id === socket.id));
        if (!roomId) return;

        const room = rooms[roomId];
        const player = room.players.find(p => p.id === socket.id);

        if (player && !player.isBot) {
            // Oyuncuyu hemen çıkar
            const currentRoom = rooms[roomId];
            if (currentRoom) {
                currentRoom.players = currentRoom.players.filter(p => p.id !== socket.id);
                console.log(`[Disconnect] Player ${player.nickname} removed from room ${roomId} (disconnect).`);

                // Eğer artık insan oyuncu yoksa odayı hemen sil
                if (currentRoom.players.filter(p => !p.isBot).length === 0) {
                    deleteRoom(roomId, 'Tüm insan oyuncular ayrıldı.');
                } else {
                    // Ekstra güvenlik: Sadece botlar kaldıysa odayı sil (ghost room fix)
                    if (currentRoom.players.every(p => p.isBot)) {
                        console.warn(`[GhostRoomFix] Bot-only room detected after disconnect, force deleting: ${roomId}`);
                        deleteRoom(roomId, 'Sadece botlar kaldı (ghost room fix)');
                        return;
                    }
                    // Eğer ayrılan host ise yeni bir host ata
                    if (currentRoom.hostId === socket.id) {
                        const newHost = currentRoom.players.find(p => !p.isBot);
                        if (newHost) currentRoom.hostId = newHost.id;
                    }
                    updateRoom(roomId);
                }
            }
        }
    });
});

server.listen(PORT, '192.168.1.6', () => {
    console.log(`Sunucu ${PORT} portunda çalışıyor (192.168.1.6)...`);
});
