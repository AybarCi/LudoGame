const express = require('express');
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

// --- Oyun Sabitleri ---
const SAFE_POSITIONS = [0, 8, 13, 21, 26, 34, 39, 47];
const START_POSITIONS = { red: 0, green: 13, blue: 39, yellow: 26 };
const HOME_ENTRANCES = { red: 51, green: 12, blue: 38, yellow: 25 };
const HOME_PATH_STARTS = { red: 52, green: 58, yellow: 70, blue: 64 };
const WINNING_POSITIONS = { red: 57, green: 63, yellow: 75, blue: 69 };

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
            ...room,
            gameState: {
                ...room.gameState,
                pawns: convertPositionsToPawns(room.gameState.positions)
            }
        };
        io.to(roomId).emit('room_updated', roomStateForClient);
        broadcastRoomList();
    }
};

const broadcastRoomList = () => {
    const roomDetails = Object.values(rooms).map(r => ({ id: r.id, playerCount: r.players.length, phase: r.gameState.phase }));
    io.emit('update_rooms', roomDetails);
};

const deleteRoom = (roomId, reason) => {
    if (rooms[roomId]) {
        // Timeout'u temizle
        if (roomTimeouts[roomId]) {
            clearTimeout(roomTimeouts[roomId]);
            delete roomTimeouts[roomId];
        }
        console.log(`[Temizlik] Oda siliniyor: ${roomId}. Sebep: ${reason}`);
        io.to(roomId).emit('room_closed', { reason });
        delete rooms[roomId];
        broadcastRoomList();
    }
};

const getValidMoves = (color, diceValue, positions) => {
    const moves = [];
    const playerPawns = positions[color];
    const startPosition = START_POSITIONS[color];

    if (diceValue === 6 && playerPawns.includes(-1)) {
        const isStartOccupiedBySelf = playerPawns.some(p => p === startPosition);
        if (!isStartOccupiedBySelf) {
            const pawnIndex = playerPawns.findIndex(p => p === -1);
            moves.push({ type: 'start', pawnIndex, from: -1, to: startPosition });
        }
    }

    for (let i = 0; i < playerPawns.length; i++) {
        const currentPos = playerPawns[i];
        if (currentPos < 0) continue;

        const homeEntrance = HOME_ENTRANCES[color];
        const homePathStart = HOME_PATH_STARTS[color];
        const winningPosition = WINNING_POSITIONS[color];
        let newPos;

        if (currentPos >= 52) { // Ev yolunda
            newPos = currentPos + diceValue;
        } else { // Ana tahtada
            const movesToHomeEntrance = (homeEntrance - currentPos + 52) % 52;
            if (diceValue > movesToHomeEntrance) {
                newPos = homePathStart + (diceValue - movesToHomeEntrance - 1);
            } else {
                newPos = (currentPos + diceValue) % 52;
            }
        }

        if (newPos > winningPosition || playerPawns.includes(newPos)) continue;

        moves.push({ type: 'move', pawnIndex: i, from: currentPos, to: newPos });
    }
    return moves;
};

const handlePawnMove = (room, player, move) => {
    const { color } = player;
    const { pawnIndex, to } = move;
    room.gameState.positions[color][pawnIndex] = to;

    let capturedPawn = false;
    if (move.type === 'move' && !SAFE_POSITIONS.includes(to) && to < 52) {
        Object.keys(room.gameState.positions).forEach(otherColor => {
            if (otherColor !== color) {
                room.gameState.positions[otherColor] = room.gameState.positions[otherColor].map(pawnPos => {
                    if (pawnPos === to) {
                        capturedPawn = true;
                        return -1;
                    }
                    return pawnPos;
                });
            }
        });
    }

    const pawnsAtHome = room.gameState.positions[color].filter(p => p >= WINNING_POSITIONS[color]).length;
    if (pawnsAtHome === 4) {
        room.gameState.phase = 'finished';
        room.gameState.winner = color;
        room.gameState.message = `${player.nickname} oyunu kazandı!`;
    }

    return capturedPawn;
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
    if (!room || room.gameState.phase !== 'playing') return;

    const currentPlayer = room.players.find(p => p.color === room.gameState.currentPlayer);
    if (!currentPlayer || !currentPlayer.isBot) return;

    setTimeout(() => {
        const diceValue = Math.floor(Math.random() * 6) + 1;
        room.gameState.diceValue = diceValue;
        
        const validMoves = getValidMoves(currentPlayer.color, diceValue, room.gameState.positions);
        room.gameState.validMoves = validMoves;
        updateRoom(roomId);

        setTimeout(() => {
            if (validMoves.length > 0) {
                const chosenMove = validMoves[Math.floor(Math.random() * validMoves.length)];
                
                const capturedPawn = handlePawnMove(room, currentPlayer, chosenMove);
                const pawnFinished = chosenMove.to >= WINNING_POSITIONS[currentPlayer.color];
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
        const player = { id: socket.id, nickname, color: 'red', isBot: false, isReady: true };
        const room = {
            id: roomId,
            players: [player],
            gameState: {
                phase: 'waiting',
                currentPlayer: null, diceValue: null, turnOrder: [], turnOrderRolls: [], validMoves: [],
                positions: { red: [-1,-1,-1,-1], green: [-1,-1,-1,-1], blue: [-1,-1,-1,-1], yellow: [-1,-1,-1,-1] },
                message: 'Oyuncular bekleniyor...'
            },
            hostId: socket.id
        };
        rooms[roomId] = room;
        socket.join(roomId);
        
        const colors = ['green', 'blue', 'yellow'];
        const availableBotNames = [...BOT_NAMES];
        for (let i = 0; i < playerCount - 1; i++) {
            const botNameIndex = Math.floor(Math.random() * availableBotNames.length);
            const botName = availableBotNames.splice(botNameIndex, 1)[0];
            room.players.push({ id: `bot-${Date.now()}-${i}`, nickname: botName, color: colors[i], isBot: true, isReady: true });
        }

        if (typeof callback === 'function') callback({ success: true, room });

        // Eğer oda hemen dolduysa (1 insan + 3 bot), oyunu başlat
        if (room.players.length === 4) {
            room.gameState.phase = 'pre-game';
            console.log(`[Room Full] Room ${roomId} is full after creation, starting pre-game.`);
        }

        updateRoom(roomId);
        broadcastRoomList();
    });

    socket.on('join_room', ({ roomId, nickname }, callback) => {
        const room = rooms[roomId];
        if (!room) {
            return callback({ success: false, message: 'Oda bulunamadı.' });
        }
        if (room.players.length >= 4) {
            return callback({ success: false, message: 'Oda dolu.' });
        }

        const color = ['red', 'green', 'blue', 'yellow'].find(c => !room.players.some(p => p.color === c));
        if (!color) {
            return callback({ success: false, message: 'Oda için uygun renk bulunamadı.'});
        }
        const player = { id: socket.id, nickname, color, isBot: false, isReady: true };
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
                    currentRoom.players.push({ id: `bot-${Date.now()}-${i}`, nickname: botName, color, isBot: true, isReady: true });
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
        
        const validMoves = getValidMoves(player.color, diceValue, room.gameState.positions);
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

        const [color, pawnIndexStr] = pawnId.split('-');
        const pawnIndex = parseInt(pawnIndexStr, 10);

        const move = room.gameState.validMoves.find(m => m.pawnIndex === pawnIndex);
        if (!move) return console.error('Geçersiz hamle denemesi!');

        const capturedPawn = handlePawnMove(room, player, move);
        const pawnFinished = move.to >= WINNING_POSITIONS[player.color];
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
        room.players = room.players.filter(p => p.id !== socket.id);

        if (room.players.filter(p => !p.isBot).length === 0) {
            deleteRoom(roomId, 'Tüm oyuncular ayrıldı.');
        } else {
            if (room.hostId === socket.id) {
                const newHost = room.players.find(p => !p.isBot);
                if (newHost) room.hostId = newHost.id;
            }
            updateRoom(roomId);
        }
    });
});

server.listen(PORT, () => {
    console.log(`Sunucu ${PORT} portunda çalışıyor...`);
});
