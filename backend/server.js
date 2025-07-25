const express = require('express');
const { 
    HOME_POSITIONS,
    PATH_LENGTH,
    START_OFFSET,
    SAFE_SPOTS_GLOBAL,
    GOAL_POSITION_INDEX
} = require('./gameConstants');
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
const BOT_NAMES = ["Aslı", "Can", "Efe", "Gizem","Cenk","Cihan", "Acar","Buse","Burcu","İlayda"];



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
    const { color } = player;
    const { gameState } = room;
    const playerPositions = gameState.positions[color];
    const moves = [];

    playerPositions.forEach((currentPos, pawnIndex) => {
        // Piyon evdeyse ve 6 atıldıysa
        if (currentPos < 0) {
            if (diceValue === 6) {
                const startPos = 0;
                const isStartOccupied = playerPositions.some(p => p === startPos);
                if (!isStartOccupied) {
                    moves.push({ pawnIndex, from: currentPos, to: startPos, type: 'enter' });
                }
            }
            return; // Sonraki piyona geç
        }

        // Piyon oyun alanındaysa
        const newPos = currentPos + diceValue;

        // Hedefi geçmemeli
        if (newPos > GOAL_POSITION_INDEX) {
            return;
        }

        // Kendi piyonunun üzerine gelmemeli
        const isOccupiedBySelf = playerPositions.some((p, idx) => idx !== pawnIndex && p === newPos);
        if (!isOccupiedBySelf) {
            moves.push({ pawnIndex, from: currentPos, to: newPos, type: 'move' });
        }
    });

    return moves;
};

const handlePawnMove = (room, player, move) => {
    const { color } = player;
    const { gameState } = room;
    const { positions } = gameState;
    const { pawnIndex, to: newLocalPos } = move;
    let capturedAPawn = false;

    // 1. Piyon Kırma Mantığı: ÖNCE KIR, SONRA GİT
    const movedPawnGlobalPos = (newLocalPos + START_OFFSET[color]) % PATH_LENGTH;

    // Güvenli alanlar hariç, hedefte rakip piyon var mı diye kontrol et
    if (newLocalPos < PATH_LENGTH && !SAFE_SPOTS_GLOBAL.includes(movedPawnGlobalPos)) {
        // .map() kullanmak yerine, durumu doğrudan değiştirelim.
        for (const otherColor in positions) {
            if (otherColor !== color) {
                positions[otherColor].forEach((otherPawnPos, otherPawnIdx) => {
                    if (otherPawnPos < 0 || otherPawnPos >= PATH_LENGTH) {
                        return; // Evdeki veya bitiş yolundaki piyonları es geç
                    }
                    const otherPawnGlobalPos = (otherPawnPos + START_OFFSET[otherColor]) % PATH_LENGTH;

                    // Eğer rakip piyon bizim hedefimizdeyse, ONU EVİNE GÖNDER
                    if (otherPawnGlobalPos === movedPawnGlobalPos) {
                        console.log(`[Capture] ${color} pawn captures ${otherColor} pawn at global pos ${movedPawnGlobalPos}`);
                        positions[otherColor][otherPawnIdx] = HOME_POSITIONS[otherColor][otherPawnIdx];
                        capturedAPawn = true;
                    }
                });
            }
        }
    }

    // 2. Hareket Eden Piyonun Pozisyonunu GÜNCELLE
    positions[color][pawnIndex] = newLocalPos;

    // 3. Kazanma Kontrolü
    const pawnsInGoal = positions[color].filter(p => p === GOAL_POSITION_INDEX).length;
    if (pawnsInGoal === 4) {
        gameState.winner = color;
        gameState.phase = 'finished';
        console.log(`[Game Over] Player ${color} has won!`);
    }

    return capturedAPawn;
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

const playBotTurnIfNeeded = async (roomId) => {
    const room = rooms[roomId];
    if (!room || !room.gameState || room.gameState.phase !== 'playing') return;

    const currentPlayer = room.players.find(p => p.color === room.gameState.currentPlayer);
    if (!currentPlayer || !currentPlayer.isBot) return;

    let keepRolling = true;

    while (keepRolling) {
        // Stop if the game is finished
        if (room.gameState.phase === 'finished') {
            updateRoom(roomId);
            return;
        }

        // Wait a moment to simulate the bot 'thinking'
        await new Promise(resolve => setTimeout(resolve, 1500));

        const diceValue = Math.floor(Math.random() * 6) + 1;
        room.gameState.diceValue = diceValue;
        room.gameState.message = `${currentPlayer.nickname} ${diceValue} attı.`;
        updateRoom(roomId);

        // Wait a moment to show the dice roll
        await new Promise(resolve => setTimeout(resolve, 1000));

        const validMoves = getValidMoves(currentPlayer, diceValue, room);
        room.gameState.validMoves = validMoves;

        if (validMoves.length > 0) {
            const chosenMove = validMoves[Math.floor(Math.random() * validMoves.length)];
            
            const capturedPawn = handlePawnMove(room, currentPlayer, chosenMove);
            const pawnFinished = chosenMove.to === GOAL_POSITION_INDEX;
            
            // The bot gets to roll again if they roll a 6, capture a pawn, or get a pawn home.
            keepRolling = diceValue === 6 || capturedPawn || pawnFinished;

            room.gameState.message = `${currentPlayer.nickname} piyonunu oynadı.`;
            updateRoom(roomId);

            if (keepRolling) {
                room.gameState.message = `${currentPlayer.nickname} tekrar oynayacak.`;
                // CRITICAL: Reset dice value and moves before the next roll in the loop
                room.gameState.diceValue = null;
                room.gameState.validMoves = [];
                updateRoom(roomId);
            }

        } else {
            // No valid moves, so the bot cannot roll again.
            keepRolling = false;
            room.gameState.message = `${currentPlayer.nickname} oynayacak hamlesi yok.`;
            updateRoom(roomId);
        }
    }

    // Wait a final moment before passing the turn
    await new Promise(resolve => setTimeout(resolve, 1500));
    updateTurn(room);
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
        
        // Oyunun başladığını odadaki herkese duyur
        io.to(roomId).emit('game_started', room);
        
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
  // İstemciden gelen kimliği sunucudaki soket nesnesine ata
  socket.userId = socket.handshake.auth.userId;

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

        socket.on('create_room', ({ nickname, playerCount, userId }, callback) => {
        const roomId = uuidv4().substring(0, 6);
        const hostPlayer = {
            id: socket.userId, // Kalıcı kimlik
            socketId: socket.id, // Geçici bağlantı kimliği
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

        // Botların sıralama turu için zar atmasını tetikle
        handleBotTurnOrderRolls(roomId);
    });

        socket.on('join_room', ({ roomId, nickname }, callback) => {
      const room = rooms[roomId];
      if (!room) {
        return callback({ success: false, message: 'Oda bulunamadı.' });
      }
      if (room.players.find(p => p.id === socket.userId)){
        return callback({ success: false, message: 'Zaten bu odadasınız.' });
      }
      if (room.players.length >= 4) {
        return callback({ success: false, message: 'Oda dolu.' });
      }

      const availableColors = PLAYER_COLORS.filter(c => !room.players.some(p => p.color === c));
      if (availableColors.length === 0) {
        return callback({ success: false, message: 'Uygun renk bulunamadı.' });
      }

        const newPlayer = {
            id: socket.userId, // Kalıcı kimlik
            socketId: socket.id, // Geçici bağlantı kimliği
            nickname,
            color: availableColors[0],
            isBot: false,
            isReady: true,
            pawns: HOME_POSITIONS[availableColors[0]].map(pos => ({ position: pos }))
        };

      room.players.push(newPlayer);
      socket.join(roomId);

      console.log(`[Player Joined] ${nickname} (ID: ${socket.userId}) joined room ${roomId}.`);

      io.to(roomId).emit('room_updated', room);
      updateLobby();

      if (room.players.filter(p => !p.isBot).length === room.playerCount) {
        startPreGame(room);
      }

      if (callback) callback({ success: true, room });
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
        // Find the player by checking both the permanent userId and the temporary socketId
        const player = room?.players.find(p => p.id === socket.userId || p.socketId === socket.id);
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
        // Find the player by checking both the permanent userId and the temporary socketId
        const player = room?.players.find(p => p.id === socket.userId || p.socketId === socket.id);
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

    socket.on('move_pawn', ({ roomId, move }) => {
        const room = rooms[roomId];
        // Find the player by checking both the permanent userId and the temporary socketId
        // Find the player by checking both the permanent userId and the temporary socketId
        const player = room?.players.find(p => p.id === socket.userId || p.socketId === socket.id);
        if (!room || !player || player.color !== room.gameState.currentPlayer) return;

        // --- KRİTİK HATA AYIKLAMA --- //
        console.log(`[MOVE_PAWN] Received from ${player.nickname} (${player.color}).`);
        console.log(`[MOVE_PAWN] Client sent move:`, JSON.stringify(move, null, 2));
        console.log(`[MOVE_PAWN] Server's valid moves:`, JSON.stringify(room.gameState.validMoves, null, 2));
        // --------------------------- //

        console.log(`[SERVER LOG] Received 'move_pawn' from player: ${player.nickname} (${player.color})`);
        console.log('[SERVER LOG] Move data received from client:', JSON.stringify(move, null, 2));
        console.log('[SERVER LOG] Server-side valid moves:', JSON.stringify(room.gameState.validMoves, null, 2));

        // --- YENİ GÜVENLİK KONTROLÜ (GEÇİCİ OLARAK DEVRE DIŞI) ---
        // TODO: pawnId'nin istemciden gönderilmesi gerekiyor. Şimdilik bu kontrol atlanıyor.
        // const pawnColor = pawnId.split('-')[0];
        // if (pawnColor !== player.color) {
        //     console.error(`[SECURITY] Player ${player.nickname} (${player.color}) tried to move opponent's pawn ${pawnId}.`);
        //     return; // Hamleyi reddet
        // }

        // const [color, pawnIndexStr] = pawnId.split('-');
        // const pawnIndex = parseInt(pawnIndexStr, 10);

        const isValidMove = room.gameState.validMoves.some(validMove => 
            validMove.pawnIndex === move.pawnIndex &&
            validMove.from === move.from &&
            validMove.to === move.to
        );

        if (isValidMove) {
            const capturedAPawn = handlePawnMove(room, player, move);
            const pawnFinished = move.to === GOAL_POSITION_INDEX;
            const diceValue = room.gameState.diceValue;

            // Oyuncu 6 attığında, piyon yediğinde veya piyonu bitirdiğinde tekrar oynar.
            const getsAnotherTurn = diceValue === 6 || capturedAPawn || pawnFinished;

            if (room.gameState.phase === 'finished') {
                updateRoom(roomId);
                return;
            }

            if (getsAnotherTurn) {
                // Oyuncu tekrar oynayacak, sırayı değiştirme.
                room.gameState.message = `${player.nickname} bir daha oynayacak.`;
                room.gameState.diceValue = null; // Yeni zar atabilmesi için zarı sıfırla
                room.gameState.validMoves = [];
                updateRoom(roomId);
            } else {
                // Sıradaki oyuncuya geç.
                updateTurn(room);
            }
        } else {
            console.error(`[SECURITY] Invalid move received from ${player.nickname}:`, move);
        }
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

    socket.on('leave_room', ({ roomId }) => {
        const room = rooms[roomId];
        if (!room) {
            console.log(`[Leave Room] Player ${socket.id} tried to leave a non-existent room: ${roomId}`);
            return;
        }

        const playerIndex = room.players.findIndex(p => p.id === socket.id);
        if (playerIndex === -1) {
            console.log(`[Leave Room] Player ${socket.id} not found in room: ${roomId}`);
            return;
        }

        const leavingPlayer = room.players[playerIndex];
        console.log(`[Leave Room] Player ${leavingPlayer.nickname} (${socket.id}) is leaving room ${roomId}.`);

        const realPlayers = room.players.filter(p => !p.isBot);

        if (realPlayers.length <= 1) {
            // This is the last human player, delete the room.
            console.log(`[Leave Room] Last human player left. Deleting room ${roomId}.`);
            deleteRoom(roomId, 'Odadaki son oyuncu da ayrıldı.');
        } else {
            // Replace the player with a bot.
            const botNameIndex = Math.floor(Math.random() * BOT_NAMES.length);
            const botName = BOT_NAMES[botNameIndex];

            const botPlayer = {
                id: `bot-${uuidv4()}`,
                nickname: botName,
                color: leavingPlayer.color,
                isBot: true,
                isReady: true,
                pawns: leavingPlayer.pawns, // Keep the pawn state
            };

            room.players.splice(playerIndex, 1, botPlayer);
            console.log(`[Leave Room] Player ${leavingPlayer.nickname} was replaced by bot ${botName} in room ${roomId}.`);

            // If it was the leaving player's turn, advance the turn.
            if (room.gameState.currentPlayer === leavingPlayer.color) {
                console.log(`[Leave Room] It was the leaving player's turn. Advancing turn.`);
                updateTurn(room);
            } else {
                // Otherwise, just update the room for everyone.
                updateRoom(roomId);
            }
        }
    });

    socket.on('roll_dice_turn_order', ({ roomId }) => {
        const room = rooms[roomId];
        if (!room || room.gameState.phase !== 'pre-game') return;

        // Oyuncuyu socket.id veya socket.userId ile bul
        const player = room.players.find(p => p.id === socket.id || p.id === socket.userId);

        if (player) {
            const alreadyRolled = room.gameState.turnOrderRolls.some(r => r.color === player.color);
            if (!alreadyRolled) {
                const roll = Math.floor(Math.random() * 6) + 1;
                room.gameState.turnOrderRolls.push({ nickname: player.nickname, roll, color: player.color });
                console.log(`[Turn Order] Player ${player.nickname} rolled a ${roll} in room ${roomId}`);
                
                updateRoom(roomId);
                determineTurnOrder(roomId); // Her atıştan sonra sırayı belirlemeyi dene

                // İnsan oyuncu attıktan sonra botları tetikle
                handleBotTurnOrderRolls(roomId);
            }
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

server.listen(PORT, '10.22.111.93', () => {
    console.log(`Sunucu ${PORT} portunda çalışıyor (10.22.111.93)...`);
});
