// Environment variables yükleme
require('dotenv').config();

const express = require('express');
const dbConfig = require('./db-config');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');
const { findOrCreateUser, updateUserAvatar, getUserAvatar } = require('./services/user-service');
const { executeQuery, sql, checkDatabaseConnection } = require('./db');
const { checkProfanity, filterProfanity, profanityTracker, SEVERITY_LEVELS } = require('./utils/messageFilter');
const smsService = require('./services/sms-service');
const { generalSmsLimiter, phoneNumberLimiter, ipDailyPhoneLimit, verificationLimiter } = require('./middleware/rateLimiters');

// --- Game Constants ---
const PAWN_COUNT = 4;
const PATH_LENGTH = 56;
const HOME_STRETCH_LENGTH = 6;
const GOAL_START_INDEX = PATH_LENGTH + HOME_STRETCH_LENGTH; // 58
const MAX_POSITION_INDEX = GOAL_START_INDEX + PAWN_COUNT - 1; // 61
const START_OFFSET = { red: 41, green: 55, yellow: 13, blue: 27 };
const SAFE_SPOTS_GLOBAL = [];
const HOME_POSITIONS = { red: [-1, -1, -1, -1], green: [-1, -1, -1, -1], yellow: [-1, -1, -1, -1], blue: [-1, -1, -1, -1] };
const AI_MALE_NAMES = [
  "Ahmet", "Mehmet", "Mustafa", "Ali", "Hasan", "Hüseyin", "İbrahim", "İsmail", "Ömer", "Yusuf",
  "Murat", "Emre", "Burak", "Serkan", "Özgür", "Tolga", "Kemal", "Erhan", "Fatih", "Selim",
  "Cem", "Deniz", "Kaan", "Berk", "Arda", "Emir", "Eren", "Ege", "Alp", "Barış",
  "Caner", "Doruk", "Furkan", "Gökhan", "Halil", "İlker", "Koray", "Levent", "Mert", "Onur",
  "Ozan", "Polat", "Rıza", "Sinan", "Taner", "Uğur", "Volkan", "Yiğit", "Zafer", "Çağlar",
  "Şahin", "Gürkan", "Tarık", "Serhat", "Orkun", "Kağan", "Batuhan", "Berkay", "Oğuz", "Tunç",
  "Enes", "Yasin", "Recep", "Süleyman", "Abdurrahman", "Yunus", "Salih", "Ramazan", "Kadir", "Bilal",
  "Erdem", "Gökay", "Hakan", "İlhan", "Kerem", "Mete", "Necati", "Orhan", "Poyraz", "Rüzgar",
  "Sarp", "Tuncay", "Umut", "Veli", "Yavuz", "Zeki", "Çetin", "Şükrü", "Gürsel", "Tevfik"
];

const AI_FEMALE_NAMES = [
  "Ayşe", "Fatma", "Emine", "Hatice", "Zeynep", "Elif", "Merve", "Özlem", "Sibel", "Gül",
  "Esra", "Pınar", "Seda", "Burcu", "Aslı", "Gizem", "İlayda", "Buse", "Cansu", "Derya",
  "Ebru", "Funda", "Gamze", "Hande", "İrem", "Jale", "Kübra", "Leman", "Melike", "Nalan",
  "Oya", "Pelin", "Reyhan", "Selin", "Tuba", "Ülkü", "Vildan", "Yelda", "Zehra", "Çiğdem",
  "Şule", "Gülşen", "Tuğba", "Serpil", "Özge", "Kıvılcım", "Begüm", "Berrak", "Özden", "Tülay",
  "Emel", "Yasemin", "Rukiye", "Sümeyye", "Aysel", "Belgin", "Canan", "Dilek", "Esin", "Filiz",
  "Gönül", "Hülya", "İnci", "Jülide", "Kezban", "Leyla", "Meryem", "Nurcan", "Ömür", "Perihan",
  "Rabia", "Sevgi", "Tülin", "Ümran", "Vesile", "Yeliz", "Zeliha", "Çiçek", "Şebnem", "Gülhan",
  "Tuğçe", "Serap", "Betül", "Büşra", "Özgül", "Tülün", "Ece", "Duygu", "Meltem", "Yıldız",
  "Rüya", "Sıla", "Aylin", "Bengü", "Cemre", "Defne", "Ela", "Figen", "Gaye", "Hilal",
  "İpek", "Kader", "Lale", "Mine", "Naz", "Rüveyda", "Seval", "Tijen", "Ufuk", "Veda",
  "Zara", "Çağla", "Şeyda", "Gülizar"
];

// Rastgele AI ismi seçme fonksiyonu (cinsiyet dağılımı ile)
const getRandomAIName = (usedNames = []) => {
  // %60 erkek, %40 kadın dağılımı
  const isMale = Math.random() < 0.6;
  const namePool = isMale ? AI_MALE_NAMES : AI_FEMALE_NAMES;
  
  // Kullanılmamış isimleri filtrele
  const availableNames = namePool.filter(name => !usedNames.includes(name));
  
  // Eğer o cinsiyetten isim kalmadıysa diğer cinsiyetten seç
  if (availableNames.length === 0) {
    const otherPool = isMale ? AI_FEMALE_NAMES : AI_MALE_NAMES;
    const otherAvailable = otherPool.filter(name => !usedNames.includes(name));
    if (otherAvailable.length > 0) {
      return otherAvailable[Math.floor(Math.random() * otherAvailable.length)];
    }
    // Hiç isim kalmadıysa rastgele bir isim döndür
    return namePool[Math.floor(Math.random() * namePool.length)];
  }
  
  return availableNames[Math.floor(Math.random() * availableNames.length)];
};
const ROOM_TIMEOUT = 20000; // 20 seconds

// --- Server Setup ---
const app = express();
app.use(cors());

// Serve static files (avatars)
app.use('/avatars', express.static('/Users/cihanaybar/Projects/Ludo/backend/public/avatars'));

const server = http.createServer(app);
const io = new Server(server, { 
  cors: { origin: "*", methods: ["GET", "POST"] },
  connectionStateRecovery: {
    maxDisconnectionDuration: 10000, // 10 saniye
    skipMiddlewares: true
  },
  pingTimeout: 60000, // 60 saniye
  pingInterval: 25000, // 25 saniye
  upgradeTimeout: 10000, // 10 saniye
  maxHttpBufferSize: 1e6, // 1MB
  transports: ['polling', 'websocket'],
  allowEIO3: true
});
app.use(express.json({ limit: '10mb' })); // Body parser middleware - 10MB limit for avatar uploads

// Request logging middleware
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url} from ${req.ip || req.connection.remoteAddress}`);
  next();
});

// Database availability check middleware for routes that require DB
const requireDatabase = async (req, res, next) => {
  try {
    const dbStatus = await checkDatabaseConnection();
    if (!dbStatus.connected) {
      return res.status(503).json({ 
        error: 'Database unavailable', 
        message: 'Veritabanı bağlantısı mevcut değil. Lütfen daha sonra tekrar deneyin.',
        details: dbStatus.error
      });
    }
    next();
  } catch (error) {
    console.error('Database check error:', error);
    return res.status(503).json({ 
      error: 'Database check failed', 
      message: 'Veritabanı bağlantısı kontrol edilemedi.'
    });
  }
};

const PORT = 3001;

// --- In-Memory State ---
let rooms = {};
let roomTimeouts = {}; // Track timeouts for each room

// --- Helper Functions ---
const isGameWon = (playerPositions) => {
    // A player wins when they have at least one pawn in each home stretch position (56, 57, 58, 59)
    // This means the first player to fill all 4 home stretch positions wins
    const homeStretchPositions = [56, 57, 58, 59];
    const playerPawnsInHomeStretch = playerPositions.filter(pos => pos >= 56 && pos <= 59);
    
    // Check if player has exactly 4 pawns in home stretch and covers all positions
    if (playerPawnsInHomeStretch.length === 4) {
        const sortedPositions = [...playerPawnsInHomeStretch].sort((a, b) => a - b);
        return JSON.stringify(sortedPositions) === JSON.stringify(homeStretchPositions);
    }
    
    return false;
};

const convertPositionsToPawns = (positions) => {
    const pawns = [];
    if (positions) {
        Object.keys(positions).forEach(color => {
            positions[color].forEach((pos, index) => {
                pawns.push({ id: `${color}-${index}`, color, position: pos });
            });
        });
    }
    return pawns;
};

const updateRoom = async (roomId) => {
    const room = rooms[roomId];
    if (room) {
        console.log(`[UPDATE_ROOM] Updating room ${roomId}, phase: ${room.gameState.phase}`);
        console.log(`[UPDATE_ROOM] turnRolls before conversion:`, room.gameState.turnRolls);
        
        // Convert turnRolls to turnOrderRolls format for frontend compatibility
        const turnOrderRolls = room.gameState.turnRolls ? 
            Object.entries(room.gameState.turnRolls).map(([color, rollData]) => ({
                color,
                roll: rollData?.diceValue || rollData // Handle both object and direct value formats
            })) : [];
        
        console.log(`[UPDATE_ROOM] turnOrderRolls after conversion:`, turnOrderRolls);

        // Get selected pawns for all human players
        const playersWithSelectedPawns = await Promise.all(
            room.players.map(async (player) => {
                if (player.isBot || !player.userId) {
                    return { ...player, selectedPawn: 'default' };
                }
                
                try {
                    const result = await executeQuery(
                        'SELECT selected_pawn FROM users WHERE id = @userId',
                        [{ name: 'userId', type: sql.NVarChar(36), value: player.userId }]
                    );
                    

                    
                    return {
                        ...player,
                        selectedPawn: result[0]?.selected_pawn || 'default'
                    };
                } catch (error) {
                    console.error('Error fetching selected pawn for player:', player.userId, error);
                    return { ...player, selectedPawn: 'default' };
                }
            })
        );

        const roomStateForClient = {
            id: room.id,
            roomCode: room.roomCode,
            players: playersWithSelectedPawns,
            hostId: room.hostId,
            gameState: {
                ...room.gameState,
                pawns: convertPositionsToPawns(room.gameState.positions),
                turnOrderRolls
            }
        };
        io.to(roomId).emit('room_updated', roomStateForClient);
        broadcastRoomList();
    }
};

const broadcastRoomList = () => {
    const roomDetails = Object.values(rooms)
        .filter(r => r.players.some(p => !p.isBot))
        .map(r => ({ id: r.id, playerCount: r.players.length, phase: r.gameState.phase, roomCode: r.roomCode }));
    io.emit('update_rooms', roomDetails);
};

const deleteRoom = async (roomId, reason) => {
    if (rooms[roomId]) {
        console.log(`[Temizlik] Oda siliniyor: ${roomId}. Sebep: ${reason}`);
        
        // Clear any existing timeout for this room
        if (roomTimeouts[roomId]) {
            clearTimeout(roomTimeouts[roomId]);
            delete roomTimeouts[roomId];
            console.log(`[Delete Room] Cleared timeout for room ${roomId}`);
        }
        
        io.to(roomId).emit('room_closed', { reason });
        try {
            await executeQuery('DELETE FROM game_players WHERE game_id = @gameId', [{ name: 'gameId', type: sql.NVarChar(36), value: roomId }]);
            await executeQuery('DELETE FROM games WHERE id = @gameId', [{ name: 'gameId', type: sql.NVarChar(36), value: roomId }]);
            console.log(`[DB Cleanup] Successfully deleted game ${roomId} from database.`);
        } catch (dbError) {
            console.error(`[DB Cleanup] Error deleting game ${roomId} from database:`, dbError);
        }
        delete rooms[roomId];
        broadcastRoomList();
    }
};

// --- DB Integrated Room/Player Management ---
const createRoomAsync = async (userId, nickname) => {
    try {
        console.log(`[CREATE_ROOM_ASYNC] Starting room creation for user: ${userId}, nickname: ${nickname}`);
        const hostUser = await findOrCreateUser(userId, nickname);
        console.log(`[CREATE_ROOM_ASYNC] Host user found/created: ${hostUser.id}`);
        
        const gameId = uuidv4();
        
        // Daha benzersiz room code oluştur
        let roomCode;
        let attempts = 0;
        const maxAttempts = 5;
        
        while (attempts < maxAttempts) {
            // UUID'nin farklı bölümlerini kullanarak daha rastgele bir kod oluştur
            const uuidSegments = gameId.split('-');
            if (attempts === 0) {
                roomCode = uuidSegments[0].substring(0, 6).toUpperCase();
            } else {
                // Çakışma durumunda farklı segment kullan
                const segmentIndex = attempts % uuidSegments.length;
                const startIndex = attempts * 2;
                roomCode = uuidSegments[segmentIndex].substring(startIndex % 8, (startIndex % 8) + 6).toUpperCase();
            }
            
            // Bu room code zaten var mı kontrol et
            try {
                const existingRoom = await executeQuery('SELECT id FROM games WHERE room_code = @roomCode', [
                    { name: 'roomCode', type: sql.NVarChar(6), value: roomCode }
                ]);
                
                if (!existingRoom || existingRoom.length === 0) {
                    // Room code kullanılabilir
                    break;
                }
                
                console.log(`[CREATE_ROOM_ASYNC] Room code ${roomCode} already exists, trying alternative...`);
                attempts++;
                
            } catch (checkError) {
                console.error(`[CREATE_ROOM_ASYNC] Room code check error:`, checkError);
                break; // Kontrol edemediysek devam et
            }
        }
        
        if (attempts >= maxAttempts) {
            // Son çare olarak timestamp bazlı kod kullan
            roomCode = Date.now().toString(36).substring(0, 6).toUpperCase();
            console.log(`[CREATE_ROOM_ASYNC] Using timestamp-based room code: ${roomCode}`);
        }
        
        console.log(`[CREATE_ROOM_ASYNC] Generated room code: ${roomCode} (attempts: ${attempts})`);

        try {
            await executeQuery(
                'INSERT INTO games (id, room_code, status, host_id) VALUES (@id, @room_code, @status, @host_id)',
                [
                    { name: 'id', type: sql.NVarChar(36), value: gameId },
                    { name: 'room_code', type: sql.NVarChar(6), value: roomCode },
                    { name: 'status', type: sql.NVarChar(20), value: 'waiting' },
                    { name: 'host_id', type: sql.NVarChar(36), value: hostUser.id },
                ]
            );
            console.log(`[CREATE_ROOM_ASYNC] Room inserted into database successfully`);
        } catch (error) {
            console.error(`[CREATE_ROOM_ASYNC] Database error while creating room:`, {
                error: error.message,
                constraintType: error.constraintType,
                stack: error.stack
            });
            
            if (error.constraintType === 'UNIQUE_KEY') {
                if (error.message.includes('room_code')) {
                    throw new Error(`Oda kodu zaten kullanılıyor. Lütfen tekrar deneyin.`);
                } else {
                    throw new Error(`Oda oluşturulamadı: ${error.message}`);
                }
            }
            throw new Error(`Oda oluşturulurken bir hata oluştu: ${error.message}`);
        }

    const room = {
        id: gameId,
        roomCode,
        players: [],
        hostId: hostUser.id,
        gameState: {
            phase: 'waiting',
            turnOrder: [],
            turnRolls: {},
            currentPlayer: null,
            diceValue: null,
            validMoves: [],
            positions: JSON.parse(JSON.stringify(HOME_POSITIONS)),
            message: 'Oyuncular bekleniyor...'
        },
    };
    rooms[gameId] = room;
    console.log(`[CREATE_ROOM_ASYNC] Room created in memory: ${gameId}`);
    
    // Start the 20-second timeout for adding bots
    startRoomTimeout(gameId);
    
    broadcastRoomList();
    console.log(`[CREATE_ROOM_ASYNC] Room creation completed successfully`);
    return room;
    } catch (error) {
        console.error('[CREATE_ROOM_ASYNC] Error in createRoomAsync:', {
            userId: userId,
            nickname: nickname,
            error: error.message,
            stack: error.stack
        });
        throw error;
    }
};

const joinRoomAsync = async (roomId, userId, nickname, socketId) => {
    try {
        console.log(`[JOIN_ROOM_ASYNC] Starting join room for user: ${userId}, roomId: ${roomId}, nickname: ${nickname}`);
        
        const room = rooms[roomId];
        if (!room) {
            console.error(`[JOIN_ROOM_ASYNC] Room not found: ${roomId}`);
            throw new Error('Oda bulunamadı.');
        }
        
        if (room.players.length >= 4) {
            console.error(`[JOIN_ROOM_ASYNC] Room is full: ${roomId}, players: ${room.players.length}`);
            throw new Error('Oda dolu.');
        }

        const user = await findOrCreateUser(userId, nickname);
        console.log(`[JOIN_ROOM_ASYNC] User found/created: ${user.id}`);
        
        const existingPlayer = room.players.find(p => p.id === user.id);
        if (existingPlayer) {
            existingPlayer.socketId = socketId;
            console.log(`[JOIN_ROOM_ASYNC] ${nickname} reconnected to room ${roomId}.`);
            
            // If room is in pre-game phase, ensure existing player is in turnRolls
            if (room.gameState.phase === 'pre-game') {
                console.log(`[JOIN_ROOM_ASYNC] Room ${roomId} is in pre-game phase, checking ${existingPlayer.color} in turnRolls`);
                if (!room.gameState.turnRolls) {
                    room.gameState.turnRolls = {};
                }
                // Ensure the existing player is in turnRolls (they might not be if they joined before pre-game started)
                if (!(existingPlayer.color in room.gameState.turnRolls)) {
                    room.gameState.turnRolls[existingPlayer.color] = null;
                    console.log(`[JOIN_ROOM_ASYNC] Added ${existingPlayer.color} to turnRolls during reconnection:`, room.gameState.turnRolls);
                }
            }
            
            return { room, player: existingPlayer };
        }

        const availableColors = ['red', 'green', 'blue', 'yellow'].filter(c => !room.players.some(p => p.color === c));
        if (availableColors.length === 0) {
            console.error(`[JOIN_ROOM_ASYNC] No available colors in room: ${roomId}`);
            throw new Error('Uygun renk bulunamadı.');
        }
        const color = availableColors[0];
        console.log(`[JOIN_ROOM_ASYNC] Assigned color: ${color}`);

        const dbPlayerId = uuidv4();
        const playerOrder = room.players.length + 1;
        console.log(`[JOIN_ROOM_ASYNC] Generated player ID: ${dbPlayerId}, order: ${playerOrder}`);
        
        try {
            await executeQuery(
                'INSERT INTO game_players (id, game_id, user_id, socket_id, nickname, color, player_order) VALUES (@id, @game_id, @user_id, @socket_id, @nickname, @color, @player_order)',
                [
                    { name: 'id', type: sql.NVarChar(36), value: dbPlayerId },
                    { name: 'game_id', type: sql.NVarChar(36), value: roomId },
                    { name: 'user_id', type: sql.NVarChar(36), value: user.id },
                    { name: 'socket_id', type: sql.NVarChar(255), value: socketId },
                    { name: 'nickname', type: sql.NVarChar(50), value: nickname },
                    { name: 'color', type: sql.NVarChar(10), value: color },
                    { name: 'player_order', type: sql.Int, value: playerOrder },
                ]
            );
            console.log(`[JOIN_ROOM_ASYNC] Player inserted into database successfully`);
        } catch (error) {
            console.error(`[JOIN_ROOM_ASYNC] Database error while adding player:`, {
                error: error.message,
                constraintType: error.constraintType,
                stack: error.stack
            });
            
            if (error.constraintType === 'UNIQUE_KEY') {
                if (error.message.includes('game_id') && error.message.includes('user_id')) {
                    throw new Error('Bu oyuncu zaten bu oyunda yer alıyor.');
                } else if (error.message.includes('room_code')) {
                    throw new Error('Bu oda kodu zaten kullanılıyor.');
                } else {
                    throw new Error(`Oyuncu odaya eklenemedi: ${error.message}`);
                }
            }
            throw new Error(`Oyuncu odaya eklenirken bir hata oluştu: ${error.message}`);
        }

    // Get user's selected pawn
    let selectedPawn = 'default';
    try {
        const pawnResult = await executeQuery(
            'SELECT selected_pawn FROM users WHERE id = @userId',
            [{ name: 'userId', type: sql.NVarChar(36), value: user.id }]
        );
        selectedPawn = pawnResult[0]?.selected_pawn || 'default';
        console.log(`[JOIN_ROOM_ASYNC] Selected pawn for user: ${selectedPawn}`);

    } catch (error) {
        console.error('[JOIN_ROOM_ASYNC] Error fetching selected pawn:', user.id, error);
    }

    const player = { id: user.id, dbPlayerId, socketId, nickname, color, isBot: false, userId: user.id, selectedPawn };
    room.players.push(player);
    console.log(`[JOIN_ROOM_ASYNC] ${nickname} (${user.id}) joined room ${roomId} as ${color}`);
    
    // If room is in pre-game phase, add the new player to turnRolls
    if (room.gameState.phase === 'pre-game') {
        console.log(`[JOIN_ROOM_ASYNC] Room ${roomId} is in pre-game phase, adding ${color} to turnRolls`);
        if (!room.gameState.turnRolls) {
            room.gameState.turnRolls = {};
        }
        // Add the new player to turnRolls with a default value (they haven't rolled yet)
        room.gameState.turnRolls[color] = null;
        console.log(`[JOIN_ROOM_ASYNC] Updated turnRolls for room ${roomId}:`, room.gameState.turnRolls);
    }
    
    // If room is full with real players, start the game immediately
        if (room.players.length === 4 && room.gameState.phase === 'waiting') {
            console.log(`[JOIN_ROOM_ASYNC] Room ${roomId} is full, starting game immediately`);
            // Clear the timeout since room is full
            if (roomTimeouts[roomId]) {
                clearTimeout(roomTimeouts[roomId]);
                delete roomTimeouts[roomId];
                console.log(`[JOIN_ROOM_ASYNC] Cleared timeout for full room ${roomId}`);
            }
            // Notify clients that countdown is stopped
            console.log(`[JOIN_ROOM_ASYNC] Sending countdown_stopped to room ${roomId} - room is full`);
            io.to(roomId).emit('countdown_stopped');
            room.gameState.message = 'Oda dolu! Oyun başlıyor...';
            await updateRoom(roomId);
            
            // Oyuncu ayrıldı event'ini bildir
            io.to(roomId).emit('player_left', { 
                playerId: player.id, 
                playerNickname: player.nickname,
                isHost: isHostLeaving,
                remainingHumanPlayers: room.players.filter(p => !p.isBot).length
            });
            setTimeout(() => {
                startPreGame(roomId);
            }, 1000); // Small delay to show the message
        }
    
    console.log(`[JOIN_ROOM_ASYNC] Join room completed successfully`);
    return { room, player };
    } catch (error) {
        console.error('[JOIN_ROOM_ASYNC] Error in joinRoomAsync:', {
            userId: userId,
            roomId: roomId,
            nickname: nickname,
            error: error.message,
            stack: error.stack
        });
        throw error;
    }
};

const leaveRoomAsync = async (socketId) => {
    for (const roomId in rooms) {
        const room = rooms[roomId];
        const playerIndex = room.players.findIndex(p => p.socketId === socketId);
        if (playerIndex > -1) {
            const player = room.players[playerIndex];
            console.log(`[Leave Room] ${player.nickname} is leaving room ${roomId}`);
            
            // Check if this is the host leaving during an active game
            const isHostLeaving = room.hostId === player.id;
            const isActiveGame = room.gameState.phase === 'playing' || room.gameState.phase === 'pre-game';
            const humanPlayersBeforeLeave = room.players.filter(p => !p.isBot).length;
            
            console.log(`[Leave Room] Host leaving: ${isHostLeaving}, Active game: ${isActiveGame}, Human players before leave: ${humanPlayersBeforeLeave}`);
            
            await executeQuery('DELETE FROM game_players WHERE id = @dbPlayerId', [{ name: 'dbPlayerId', type: sql.NVarChar(36), value: player.dbPlayerId }]);
            room.players.splice(playerIndex, 1);
            
            if (room.players.length === 0 || room.players.every(p => p.isBot)) {
                // No human players left, delete room
                await deleteRoom(roomId, 'Tüm insan oyuncular ayrıldı.');
            } else {
                // Handle host departure during active game
                if (isHostLeaving && isActiveGame) {
                    const remainingHumanPlayers = room.players.filter(p => !p.isBot);
                    
                    if (remainingHumanPlayers.length === 0) {
                        // No human players left after host departure, delete room
                        console.log(`[Leave Room] Host left active game with no remaining humans, deleting room ${roomId}`);
                        await deleteRoom(roomId, 'Oda kurucusu ayrıldı ve gerçek oyuncu kalmadı.');
                        return;
                    } else {
                        // There are still human players, add AI replacement and continue
                        console.log(`[Leave Room] Host left active game but humans remain, adding AI replacement`);
                        
                        // Assign new host
                        room.hostId = remainingHumanPlayers[0].id;
                        console.log(`[Leave Room] New host for room ${roomId} is ${room.hostId}`);
                        
                        // Add AI player to replace the departed human
                        await addAIPlayersToRoom(roomId);
                        
                        // Update turn order if the departed player was in the current turn
                        if (room.gameState.currentPlayer === player.color) {
                            await updateTurn(room);
                        }
                    }
                } else if (room.hostId === player.id) {
                    // Regular host reassignment (not during active game)
                    room.hostId = room.players.find(p => !p.isBot)?.id || room.players[0].id;
                    console.log(`[Leave Room] New host for room ${roomId} is ${room.hostId}`);
                }
                
                await updateRoom(roomId);
            }
            return;
        }
    }
};

// --- Game Logic Functions ---
const getValidMoves = (player, diceValue, room) => {
    const { color } = player;
    const { positions } = room.gameState;
    const playerPositions = positions[color];
    const validMoves = [];

    playerPositions.forEach((currentPos, pawnIndex) => {
        // Rule 0: A pawn that has reached the goal (59) cannot move again.
        if (currentPos === 59) return;

        let finalLandingPos = -99; // Use a flag for invalid position

        // Case A: Pawn is at home base.
        if (currentPos === -1) {
            if (diceValue === 6) {
                finalLandingPos = 0; // Moves to start
            }
        }
        // Case B: Pawn is in its home stretch.
        else if (currentPos >= 56) {
            if (currentPos + diceValue <= 59) { // A pawn cannot overshoot the goal (59).
                finalLandingPos = currentPos + diceValue;
            }
        }
        // Case C: Pawn is on the main path.
        else {
            // Define home entry points for each color (last square before entering home path)
            // These are the path indices (0-55) where each color enters their home stretch
            const HOME_ENTRY_POINTS = {
                red: 40,   // Main path index 40 (corresponds to square before red home stretch)
                green: 54, // Main path index 54 (corresponds to square before green home stretch) 
                yellow: 12, // Main path index 12 (corresponds to square before yellow home stretch)
                blue: 26   // Main path index 26 (corresponds to square before blue home stretch)
            };
            
            // Define home stretch squares for each color
            const HOME_STRETCH_SQUARES = {
                red: [202, 187, 172, 157],
                green: [106, 107, 108, 109],
                yellow: [22, 37, 52, 67],
                blue: [118, 117, 116, 115]
            };
            
            const homeEntryPoint = HOME_ENTRY_POINTS[color];
            const homeStretchSquares = HOME_STRETCH_SQUARES[color];
            
            // Calculate absolute position on the board
            const startOffset = START_OFFSET[color];
            const currentAbsPos = (startOffset + currentPos) % PATH_LENGTH;
            
            // Calculate steps to reach the home entry point
            let stepsToHomeEntry;
            if (homeEntryPoint >= currentAbsPos) {
                stepsToHomeEntry = homeEntryPoint - currentAbsPos;
            } else {
                stepsToHomeEntry = (PATH_LENGTH - currentAbsPos) + homeEntryPoint;
            }
            
            if (diceValue <= stepsToHomeEntry) {
                // Move stays on main path
                finalLandingPos = currentPos + diceValue;
            } else {
                // Move would enter home stretch
                const stepsIntoHomeStretch = diceValue - stepsToHomeEntry - 1;
                if (stepsIntoHomeStretch <= 3) {
                    // Map to home stretch positions 56-59
                    finalLandingPos = 56 + stepsIntoHomeStretch;
                }
            }
        }

        // Rule 1: If no valid landing spot was found, skip.
        if (finalLandingPos === -99) return;

        // Rule 2: A pawn cannot land on a square that is already occupied by a teammate.
        const isLandingOnTeammate = playerPositions.some(
            (p, idx) => idx !== pawnIndex && p === finalLandingPos
        );
        if (isLandingOnTeammate) return;
        
        // Rule 3: Pawns cannot jump over teammates
        // Rule 3a: In home stretch (56-59), pawns cannot jump over each other
        if (finalLandingPos >= 56 && finalLandingPos <= 59 && currentPos >= 56) {
            // Check if there's any teammate between current position and landing position
            const minPos = Math.min(currentPos, finalLandingPos);
            const maxPos = Math.max(currentPos, finalLandingPos);
            
            for (let pos = minPos + 1; pos <= maxPos; pos++) {
                const isBlocked = playerPositions.some(
                    (p, idx) => idx !== pawnIndex && p === pos
                );
                if (isBlocked) return; // Cannot jump over teammate
            }
        }
        
        // Rule 3b: On main path (0-55), pawns cannot jump over teammates
        if (currentPos >= 0 && currentPos <= 55 && finalLandingPos >= 0 && finalLandingPos <= 55 && currentPos < finalLandingPos) {
            // Check if there's any teammate between current position and landing position
            for (let pos = currentPos + 1; pos < finalLandingPos; pos++) {
                const isBlocked = playerPositions.some(
                    (p, idx) => idx !== pawnIndex && p === pos
                );
                if (isBlocked) return; // Cannot jump over teammate
            }
        }

        validMoves.push({ pawnIndex, from: currentPos, to: finalLandingPos });
    });
    return validMoves;
};

const handlePawnMove = (room, player, move) => {
    const { color } = player;
    const { positions } = room.gameState;
    const { pawnIndex, from: fromPos, to: toPos } = move;
    let capturedAPawn = false;

    console.log(`[CAPTURE DEBUG] ${color} pawn moving from ${fromPos} to ${toPos}`);

    // Check for captures on the main path (0-55) - check all squares in the path including landing
    if (fromPos >= 0 && toPos >= 0 && toPos <= 55) {
        const startOffset = START_OFFSET[color];
        const absoluteStart = (startOffset + fromPos) % PATH_LENGTH;
        const absoluteEnd = (startOffset + toPos) % PATH_LENGTH;
        
        console.log(`[CAPTURE DEBUG] Moving from absolute ${absoluteStart} to ${absoluteEnd}`);

        // Create path of absolute squares the pawn travels through (including landing square)
        const absolutePath = [];
        let currentPathPos = (absoluteStart + 1) % PATH_LENGTH;
        while (true) {
            absolutePath.push(currentPathPos);
            if (currentPathPos === absoluteEnd) break;
            currentPathPos = (currentPathPos + 1) % PATH_LENGTH;
        }
        
        console.log(`[CAPTURE DEBUG] Path squares to check: ${absolutePath.join(', ')}`);

        // Check each square on the path for opponents
        for (const pathSquareAbsolute of absolutePath) {
            for (const otherColor in positions) {
                if (otherColor === color) continue;
                
                positions[otherColor].forEach((otherPawnPos, otherPawnIdx) => {
                    if (otherPawnPos < 0 || otherPawnPos > 55) return;
                    
                    const opponentAbsPos = (START_OFFSET[otherColor] + otherPawnPos) % PATH_LENGTH;
                    
                    if (opponentAbsPos === pathSquareAbsolute) {
                        // Check if opponent is on a safe square
                        // Opponent is safe if they are at relative position 0 (their start square) OR on a global safe spot
                        const isOpponentOnOwnStart = otherPawnPos === 0;
                        const isOpponentOnSafeSpot = SAFE_SPOTS_GLOBAL.includes(opponentAbsPos);
                        const isOpponentSafe = isOpponentOnOwnStart || isOpponentOnSafeSpot;
                        console.log(`[CAPTURE DEBUG] Found ${otherColor} pawn at absolute ${opponentAbsPos} (relative ${otherPawnPos}). On own start: ${isOpponentOnOwnStart}, On safe spot: ${isOpponentOnSafeSpot}, Safe: ${isOpponentSafe}`);
                        
                        if (!isOpponentSafe) {
                            console.log(`[CAPTURE DEBUG] Capturing ${otherColor} pawn at absolute position ${pathSquareAbsolute}!`);
                            positions[otherColor][otherPawnIdx] = -1; // Send to home
                            capturedAPawn = true;
                        }
                    }
                });
            }
        }
    }

    // Before moving, check if we will land on an opponent at the destination
    if (toPos >= 0 && toPos <= 55) {
        const startOffset = START_OFFSET[color];
        const absoluteLandingPos = (startOffset + toPos) % PATH_LENGTH;
        
        console.log(`[CAPTURE DEBUG] Checking landing square ${absoluteLandingPos} for existing opponents`);
        
        for (const otherColor in positions) {
            if (otherColor === color) continue;
            
            positions[otherColor].forEach((otherPawnPos, otherPawnIdx) => {
                if (otherPawnPos < 0 || otherPawnPos > 55) return;
                
                const opponentAbsPos = (START_OFFSET[otherColor] + otherPawnPos) % PATH_LENGTH;
                
                if (opponentAbsPos === absoluteLandingPos) {
                    // Check if opponent is on a safe square
                    // Opponent is safe if they are at relative position 0 (their start square) OR on a global safe spot
                    const isOpponentOnOwnStart = otherPawnPos === 0;
                    const isOpponentOnSafeSpot = SAFE_SPOTS_GLOBAL.includes(opponentAbsPos);
                    const isOpponentSafe = isOpponentOnOwnStart || isOpponentOnSafeSpot;
                    console.log(`[CAPTURE DEBUG] Found ${otherColor} pawn on landing square ${absoluteLandingPos} (relative ${otherPawnPos}). On own start: ${isOpponentOnOwnStart}, On safe spot: ${isOpponentOnSafeSpot}, Safe: ${isOpponentSafe}`);
                    
                    if (!isOpponentSafe) {
                        console.log(`[CAPTURE DEBUG] Capturing ${otherColor} pawn on landing square ${absoluteLandingPos}!`);
                        positions[otherColor][otherPawnIdx] = -1; // Send to home
                        capturedAPawn = true;
                    }
                }
            });
        }
    }

    // Now move the pawn to its new position
    positions[color][pawnIndex] = toPos;
    
    // Check for win condition
    if (isGameWon(positions[color])) {
        room.gameState.phase = 'finished';
        room.gameState.winner = color;
        
        // Oyun bittikten sonra sadece botlar kaldıysa odayı sil
        setTimeout(async () => {
            const humanPlayers = room.players.filter(p => !p.isBot);
            if (humanPlayers.length === 0) {
                console.log(`[Game Finished] Sadece botlar kaldı, oda siliniyor: ${room.id}`);
                await deleteRoom(room.id, 'Oyun bitti ve sadece bot oyuncular kaldı');
            }
        }, 5000); // 5 saniye sonra kontrol et
    }
    
    return capturedAPawn;
};

const updateTurn = async (room) => {
    // Sadece botlar kaldıysa odayı sil
    const humanPlayers = room.players.filter(p => !p.isBot);
    if (humanPlayers.length === 0) {
        console.log(`[Update Turn] Sadece botlar kaldı, oda siliniyor: ${room.id}`);
        await deleteRoom(room.id, 'Sadece bot oyuncular kaldı');
        return;
    }

    const { turnOrder, currentPlayer } = room.gameState;
    if (!turnOrder || turnOrder.length === 0) return;
    const currentIndex = turnOrder.indexOf(currentPlayer);
    const nextIndex = (currentIndex + 1) % turnOrder.length;
    const nextPlayerColor = turnOrder[nextIndex];
    const nextPlayer = room.players.find(p => p.color === nextPlayerColor);

    if (!nextPlayer) {
        console.error(`[Update Turn] Could not find next player with color ${nextPlayerColor}`);
        return;
    }

    room.gameState.currentPlayer = nextPlayerColor;
    room.gameState.diceValue = null;
    room.gameState.validMoves = [];
    room.gameState.message = `Sıra ${nextPlayer.nickname} oyuncusunda.`;
    await updateRoom(room.id);
    playBotTurnIfNeeded(room.id);
};

const chooseBestMove = (validMoves, room, currentPlayer) => {
    if (validMoves.length === 0) return null;
    if (validMoves.length === 1) return validMoves[0];

    const { positions } = room.gameState;
    const playerPositions = positions[currentPlayer.color];

    // Priority 1: Move a pawn to goal (position 59)
    const goalMoves = validMoves.filter(move => move.to === 59);
    if (goalMoves.length > 0) return goalMoves[0];

    // Priority 2: Move a pawn from home (-1) to start (0)
    const homeToStartMoves = validMoves.filter(move => move.from === -1 && move.to === 0);
    if (homeToStartMoves.length > 0) return homeToStartMoves[0];

    // Priority 3: Move a pawn into home stretch (56-59)
    const homeStretchMoves = validMoves.filter(move => move.to >= 56 && move.to < 59);
    if (homeStretchMoves.length > 0) {
        // Prefer the move that gets closest to goal
        return homeStretchMoves.reduce((best, current) => 
            current.to > best.to ? current : best
        );
    }

    // Priority 4: Move the most advanced pawn
    const advancedMoves = validMoves.filter(move => move.from >= 0);
    if (advancedMoves.length > 0) {
        return advancedMoves.reduce((best, current) => 
            current.from > best.from ? current : best
        );
    }

    // Fallback: random move
    return validMoves[Math.floor(Math.random() * validMoves.length)];
};

const playBotTurnIfNeeded = async (roomId) => {
    const room = rooms[roomId];
    if (!room || room.gameState.phase !== 'playing') return;
    const currentPlayer = room.players.find(p => p.color === room.gameState.currentPlayer);
    if (!currentPlayer || !currentPlayer.isBot) return;

    await new Promise(resolve => setTimeout(resolve, 1500));
    const diceValue = Math.floor(Math.random() * 6) + 1;
    room.gameState.diceValue = diceValue;
    room.gameState.message = `${currentPlayer.nickname} ${diceValue} attı.`;
    await updateRoom(roomId);

    await new Promise(resolve => setTimeout(resolve, 1000));
    const validMoves = getValidMoves(currentPlayer, diceValue, room);
    room.gameState.validMoves = validMoves;

    if (validMoves.length > 0) {
        const chosenMove = chooseBestMove(validMoves, room, currentPlayer);
        const capturedPawn = handlePawnMove(room, currentPlayer, chosenMove);
        const pawnFinished = chosenMove.to === 59;
        await updateRoom(roomId);

        if (diceValue === 6 || capturedPawn || pawnFinished) {
            playBotTurnIfNeeded(roomId); // Play again
        } else {
            await updateTurn(room);
        }
    } else {
        await updateTurn(room);
    }
};

const determineTurnOrder = async (roomId) => {
    const room = rooms[roomId];
    if (!room) return;

    console.log(`[DEBUG] determineTurnOrder called for room ${roomId}`);
    console.log(`[DEBUG] Players:`, room.players.map(p => p.color));
    console.log(`[DEBUG] Turn rolls:`, room.gameState.turnRolls);
    console.log(`[DEBUG] All players rolled?`, room.players.every(p => room.gameState.turnRolls[p.color]));
    
    // Check each player's roll status individually
    room.players.forEach(p => {
        console.log(`[DEBUG] Player ${p.color} (${p.nickname}): rolled = ${!!room.gameState.turnRolls[p.color]}`);
    });

    if (room.players.every(p => room.gameState.turnRolls[p.color])) {
        const sortedRolls = Object.entries(room.gameState.turnRolls).sort(([, a], [, b]) => b.diceValue - a.diceValue);
        const turnOrder = sortedRolls.map(([color]) => color);

        // 3 saniye bekle ki oyuncular zar sonuçlarını görebilsin
        setTimeout(async () => {
            room.gameState.turnOrder = turnOrder;
            room.gameState.currentPlayer = turnOrder[0];
            room.gameState.phase = 'playing';
            const startingPlayer = room.players.find(p => p.color === turnOrder[0]);
            room.gameState.message = `${startingPlayer.nickname} oyuna başlıyor!`;
            console.log(`[Game Started] Turn order: ${turnOrder.join(' -> ')}, Starting player: ${startingPlayer.nickname}`);
            io.to(roomId).emit('game_started', room.gameState);
            await updateRoom(roomId);
            playBotTurnIfNeeded(roomId);
        }, 3000);
    }
};

const addAIPlayersToRoom = async (roomId) => {
    const room = rooms[roomId];
    if (!room) return;
    
    // Allow AI players during both waiting and active game phases
    const isWaitingPhase = room.gameState.phase === 'waiting';
    const isActiveGame = room.gameState.phase === 'playing' || room.gameState.phase === 'pre-game';
    
    if (!isWaitingPhase && !isActiveGame) return;
    
    const neededPlayers = isWaitingPhase ? 4 - room.players.length : 1; // Add 1 AI for replacement during active game
    if (neededPlayers <= 0) return;
    
    console.log(`[AI System] Adding ${neededPlayers} AI players to room ${roomId} (phase: ${room.gameState.phase})`);
    
    const availableColors = ['red', 'green', 'blue', 'yellow'].filter(c => !room.players.some(p => p.color === c));
    const usedAINames = room.players.filter(p => p.isBot).map(p => p.nickname);
    
    for (let i = 0; i < neededPlayers && i < availableColors.length; i++) {
        const color = availableColors[i];
        const aiName = getRandomAIName(usedAINames);
        usedAINames.push(aiName); // Aynı oda içinde tekrar kullanılmasını önle
        const aiId = uuidv4();
        const dbPlayerId = uuidv4();
        
        try {
            // First, create the AI user in the users table
            await executeQuery(
                'INSERT INTO users (id, username, nickname, email, password_hash, salt) VALUES (@id, @username, @nickname, @email, @password_hash, @salt)',
                [
                    { name: 'id', type: sql.NVarChar(36), value: aiId },
                    { name: 'username', type: sql.NVarChar(50), value: `ai_${aiId.substring(0, 8)}` },
                    { name: 'nickname', type: sql.NVarChar(50), value: aiName },
                    { name: 'email', type: sql.NVarChar(100), value: `ai_${aiId}@bot.local` },
                    { name: 'password_hash', type: sql.NVarChar(255), value: 'AI_BOT_NO_PASSWORD' },
                    { name: 'salt', type: sql.NVarChar(255), value: 'AI_BOT_NO_SALT' },
                ]
            );
            
            // Then, create the game player record
            const playerOrder = room.players.length + 1;
            await executeQuery(
                'INSERT INTO game_players (id, game_id, user_id, socket_id, nickname, color, player_order) VALUES (@id, @game_id, @user_id, @socket_id, @nickname, @color, @player_order)',
                [
                    { name: 'id', type: sql.NVarChar(36), value: dbPlayerId },
                    { name: 'game_id', type: sql.NVarChar(36), value: roomId },
                    { name: 'user_id', type: sql.NVarChar(36), value: aiId },
                    { name: 'socket_id', type: sql.NVarChar(255), value: `ai_${i}` },
                    { name: 'nickname', type: sql.NVarChar(50), value: aiName },
                    { name: 'color', type: sql.NVarChar(10), value: color },
                    { name: 'player_order', type: sql.Int, value: playerOrder },
                ]
            );
            
            const aiPlayer = {
                id: aiId,
                dbPlayerId,
                socketId: `ai_${i}`,
                nickname: aiName,
                color,
                isBot: true
            };
            
            room.players.push(aiPlayer);
            console.log(`[AI System] Added AI player ${aiName} (${color}) to room ${roomId}`);
            
            // If during active game, add AI to game state
            if (isActiveGame) {
                // Initialize AI player's game state
                if (!room.gameState.pawns) {
                    room.gameState.pawns = {};
                }
                room.gameState.pawns[color] = [
                    { id: `${color}_pawn_1`, position: 'home', isHome: true },
                    { id: `${color}_pawn_2`, position: 'home', isHome: true },
                    { id: `${color}_pawn_3`, position: 'home', isHome: true },
                    { id: `${color}_pawn_4`, position: 'home', isHome: true }
                ];
                
                // Add AI to turn rolls if in pre-game phase
                if (room.gameState.phase === 'pre-game' && room.gameState.turnRolls) {
                    const diceValue = Math.floor(Math.random() * 6) + 1;
                    room.gameState.turnRolls[color] = { nickname: aiName, diceValue };
                    console.log(`[AI System] AI player ${aiName} rolled ${diceValue} for turn order`);
                }
            }
        } catch (error) {
            console.error(`[AI System] Error adding AI player to room ${roomId}:`, error);
        }
    }
    
    updateRoom(roomId);
    
    // Start the game if we have enough players (only during waiting phase)
    if (isWaitingPhase && room.players.length >= 2) {
        console.log(`[AI System] Starting game in room ${roomId} with ${room.players.length} players`);
        startPreGame(roomId);
    }
    
    // If during pre-game phase, check if all players have rolled
    if (isActiveGame && room.gameState.phase === 'pre-game') {
        determineTurnOrder(roomId);
    }
};

const startRoomTimeout = (roomId) => {
    console.log(`[Room Timeout] Starting 20-second timeout for room ${roomId}`);
    
    // Clear any existing timeout for this room
    if (roomTimeouts[roomId]) {
        clearTimeout(roomTimeouts[roomId]);
        console.log(`[Room Timeout] Cleared existing timeout for room ${roomId}`);
    }
    
    // Notify clients that countdown has started
    console.log(`[COUNTDOWN] Sending countdown_started to room ${roomId} with timeLeft: ${ROOM_TIMEOUT / 1000}`);
    io.to(roomId).emit('countdown_started', { timeLeft: ROOM_TIMEOUT / 1000 });
    
    // Send countdown updates every second
    let timeLeft = ROOM_TIMEOUT / 1000;
    const countdownInterval = setInterval(() => {
        timeLeft--;
        if (timeLeft > 0) {
            console.log(`[COUNTDOWN] Sending countdown_update to room ${roomId} with timeLeft: ${timeLeft}`);
            io.to(roomId).emit('countdown_update', { timeLeft });
        } else {
            console.log(`[COUNTDOWN] Countdown finished for room ${roomId}`);
            clearInterval(countdownInterval);
        }
    }, 1000);
    
    roomTimeouts[roomId] = setTimeout(async () => {
        const room = rooms[roomId];
        if (!room || room.gameState.phase !== 'waiting') {
            console.log(`[Room Timeout] Room ${roomId} no longer in waiting phase, timeout cancelled`);
            clearInterval(countdownInterval);
            delete roomTimeouts[roomId];
            return;
        }
        
        const humanPlayers = room.players.filter(p => !p.isBot).length;
        if (humanPlayers === 0) {
            console.log(`[Room Timeout] No human players left in room ${roomId}, deleting room`);
            clearInterval(countdownInterval);
            delete roomTimeouts[roomId];
            await deleteRoom(roomId, 'Timeout - no human players');
            return;
        }
        
        console.log(`[Room Timeout] Timeout reached for room ${roomId}, adding AI players and starting game`);
        room.gameState.message = 'Bekleme süresi doldu, oyun başlıyor...';
        clearInterval(countdownInterval);
        updateRoom(roomId);
        
        await addAIPlayersToRoom(roomId);
        delete roomTimeouts[roomId];
    }, ROOM_TIMEOUT);
};

const startPreGame = (roomId) => {
    const room = rooms[roomId];
    if (!room) return;
    room.gameState.phase = 'pre-game';
    room.gameState.message = 'Sıra belirlemek için zar atın!';
    room.gameState.turnRolls = {};
    updateRoom(roomId);
    
    console.log(`[Pre-Game] Started for room ${roomId}. Players need to roll dice manually.`);
    
    // Auto-roll dice for AI players after a short delay
    setTimeout(() => {
        const aiPlayers = room.players.filter(p => p.isBot);
        aiPlayers.forEach((aiPlayer, index) => {
            setTimeout(() => {
                if (room.gameState.phase === 'pre-game' && !room.gameState.turnRolls[aiPlayer.color]) {
                    const diceValue = Math.floor(Math.random() * 6) + 1;
                    room.gameState.turnRolls[aiPlayer.color] = { nickname: aiPlayer.nickname, diceValue };
                    console.log(`[Pre-Game AI] ${aiPlayer.nickname} rolled: ${diceValue}`);
                    updateRoom(roomId);
                    determineTurnOrder(roomId);
                }
            }, (index + 1) * 1000); // Stagger AI rolls by 1 second each
        });
    }, 2000); // Wait 2 seconds before starting AI rolls
};

// --- Auth API Routes ---
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const JWT_SECRET = 'your-super-secret-key-that-should-be-in-env-vars'; // IMPORTANT: Move to .env file in production
const { encryptPhoneNumber, decryptPhoneNumber, comparePhoneNumbers } = require('./utils/encryption');

app.post('/api/register', async (req, res) => {
    const { email, password, nickname } = req.body;

    if (!email || !password || !nickname) {
        return res.status(400).json({ message: 'Email, password, and nickname are required.' });
    }

    try {
        const password_hash = await bcrypt.hash(password, 10);
        const userId = uuidv4();

        const pool = await sql.connect(dbConfig);
        await pool.request()
            .input('id', sql.NVarChar(36), userId)
            .input('email', sql.NVarChar(255), email)
            .input('password_hash', sql.NVarChar(255), password_hash)
            .input('username', sql.NVarChar(50), nickname) // Use nickname for username
            .input('nickname', sql.NVarChar(50), nickname)
            .input('salt', sql.NVarChar(255), '') // Provide an empty string for the salt column
            .query('INSERT INTO users (id, email, password_hash, username, nickname, salt, score, games_played, wins) VALUES (@id, @email, @password_hash, @username, @nickname, @salt, 0, 0, 0)');

        res.status(201).json({ message: 'User registered successfully' });
    } catch (error) {
        console.error('Register error:', error);
        res.status(500).json({ message: 'Database error', error: error.message });
    }
});

app.post('/api/login', async (req, res) => {
    const { email, password } = req.body;
    console.log('[LOGIN DEBUG] Login attempt for email:', email);
    
    if (!email || !password) {
        console.log('[LOGIN DEBUG] Missing email or password');
        return res.status(400).json({ message: 'Email and password are required.' });
    }

    try {
        console.log('[LOGIN DEBUG] Searching for user in database...');
        const userResult = await executeQuery('SELECT * FROM users WHERE email = @email', [{ name: 'email', type: sql.NVarChar(255), value: email }]);
        console.log('[LOGIN DEBUG] User query result length:', userResult.length);
        
        if (userResult.length === 0) {
            console.log('[LOGIN DEBUG] User not found in database');
            return res.status(401).json({ message: 'Invalid credentials.' });
        }

        const user = userResult[0];
        console.log('[LOGIN DEBUG] User found, checking password...');
        console.log('[LOGIN DEBUG] User ID:', user.id, 'Nickname:', user.nickname);
        
        const isPasswordValid = await bcrypt.compare(password, user.password_hash);
        console.log('[LOGIN DEBUG] Password valid:', isPasswordValid);

        if (!isPasswordValid) {
            console.log('[LOGIN DEBUG] Password validation failed');
            return res.status(401).json({ message: 'Invalid credentials.' });
        }

        // Access token - kısa süreli (1 saat)
        const accessToken = jwt.sign({ userId: user.id, nickname: user.nickname }, JWT_SECRET, { expiresIn: '1h' });
        
        // Refresh token - uzun süreli (3 ay)
        const refreshToken = jwt.sign({ userId: user.id, type: 'refresh' }, JWT_SECRET, { expiresIn: '90d' });
        
        // Refresh token'ı veritabanına kaydet
        const refreshTokenId = uuidv4();
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 90); // 90 gün sonra
        
        await executeQuery(
            'INSERT INTO refresh_tokens (id, user_id, token, expires_at) VALUES (@id, @userId, @token, @expiresAt)',
            [
                { name: 'id', type: sql.NVarChar(36), value: refreshTokenId },
                { name: 'userId', type: sql.NVarChar(36), value: user.id },
                { name: 'token', type: sql.NVarChar(255), value: refreshToken },
                { name: 'expiresAt', type: sql.DateTime2, value: expiresAt }
            ]
        );

        res.json({ 
            accessToken,
            refreshToken,
            user: { 
                id: user.id, 
                email: user.email, 
                nickname: user.nickname, 
                score: user.score 
            } 
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// Refresh token endpoint
app.post('/api/refresh-token', async (req, res) => {
    const { refreshToken } = req.body;
    
    console.log('[REFRESH TOKEN] Request received');
    console.log('[REFRESH TOKEN] Has refresh token:', !!refreshToken);
    
    if (!refreshToken) {
        return res.status(401).json({ message: 'Refresh token is required.' });
    }

    try {
        // Refresh token'ı doğrula
        const decoded = jwt.verify(refreshToken, JWT_SECRET);
        console.log('[REFRESH TOKEN] JWT decoded successfully:', { userId: decoded.userId, type: decoded.type });
        
        if (decoded.type !== 'refresh') {
            console.log('[REFRESH TOKEN] Invalid token type:', decoded.type);
            return res.status(403).json({ message: 'Invalid token type.' });
        }

        // Veritabanından refresh token'ı kontrol et
        console.log('[REFRESH TOKEN] Checking database for token...');
        const tokenResult = await executeQuery(
            'SELECT * FROM refresh_tokens WHERE token = @token AND user_id = @userId AND is_revoked = 0 AND expires_at > GETDATE()',
            [
                { name: 'token', type: sql.NVarChar(255), value: refreshToken },
                { name: 'userId', type: sql.NVarChar(36), value: decoded.userId }
            ]
        );

        console.log('[REFRESH TOKEN] Database check result:', tokenResult.length > 0 ? 'Token found' : 'Token not found');

        if (tokenResult.length === 0) {
            return res.status(403).json({ message: 'Invalid or expired refresh token.' });
        }

        // Kullanıcı bilgilerini getir
        const userResult = await executeQuery(
            'SELECT * FROM users WHERE id = @userId',
            [{ name: 'userId', type: sql.NVarChar(36), value: decoded.userId }]
        );

        if (userResult.length === 0) {
            return res.status(404).json({ message: 'User not found.' });
        }

        const user = userResult[0];
        console.log('[REFRESH TOKEN] User found:', user.nickname);

        // Yeni access token oluştur
        const newAccessToken = jwt.sign(
            { userId: user.id, nickname: user.nickname },
            JWT_SECRET,
            { expiresIn: '1h' }
        );

        console.log('[REFRESH TOKEN] New access token created successfully');

        res.json({
            accessToken: newAccessToken,
            user: {
                id: user.id,
                email: user.email,
                nickname: user.nickname,
                score: user.score
            }
        });
        
        console.log('[REFRESH TOKEN] Response sent successfully');
    } catch (error) {
        console.error('[REFRESH TOKEN] Error:', error);
        if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
            return res.status(403).json({ message: 'Invalid or expired refresh token.' });
        }
        res.status(500).json({ message: 'Internal server error' });
    }
});

// Logout endpoint - refresh token'ı iptal et
app.post('/api/logout', async (req, res) => {
    const { refreshToken } = req.body;
    
    if (refreshToken) {
        try {
            // Refresh token'ı iptal et
            await executeQuery(
                'UPDATE refresh_tokens SET is_revoked = 1 WHERE token = @token',
                [{ name: 'token', type: sql.NVarChar(255), value: refreshToken }]
            );
        } catch (error) {
            console.error('Logout error:', error);
        }
    }
    
    res.json({ message: 'Logged out successfully' });
});

// Middleware to verify JWT
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    console.log('[AUTH DEBUG] Auth header:', authHeader);
    console.log('[AUTH DEBUG] Token exists:', !!token);
    console.log('[AUTH DEBUG] Token length:', token ? token.length : 0);
    
    if (token == null) {
        console.log('[AUTH DEBUG] No token provided, returning 401');
        return res.sendStatus(401); // if there isn't any token
    }

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) {
            console.log('[AUTH DEBUG] JWT verification failed:', err.message);
            console.log('[AUTH DEBUG] JWT error name:', err.name);
            return res.sendStatus(403);
        }
        console.log('[AUTH DEBUG] JWT verification successful for user:', user.userId);
        req.user = user;
        next();
    });
};

app.post('/api/user/score', authenticateToken, async (req, res) => {
    const { amount } = req.body;
    const userId = req.user.userId;

    if (typeof amount !== 'number') {
        return res.status(400).json({ message: 'Amount must be a number.' });
    }

    try {
        // We can use a single query to update the score
        await executeQuery(
            'UPDATE users SET score = score + @amount WHERE id = @userId',
            [
                { name: 'amount', type: sql.Int, value: amount },
                { name: 'userId', type: sql.NVarChar(36), value: userId },
            ]
        );
        res.json({ message: 'Score updated successfully.' });
    } catch (error) {
        console.error('Score update error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// Piyon mağazası endpoint'leri
app.get('/api/shop/pawns', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.userId;
        
        // Kullanıcının sahip olduğu piyonları getir
        const ownedPawns = await executeQuery(
            'SELECT pawn_id FROM UserPawns WHERE user_id = @userId',
            [{ name: 'userId', type: sql.NVarChar(36), value: userId }]
        );
        
        const ownedPawnIds = ownedPawns.map(p => p.pawn_id);
        
        res.json({ 
            success: true, 
            ownedPawns: ownedPawnIds 
        });
    } catch (error) {
        console.error('Error fetching owned pawns:', error);
        res.status(500).json({ error: 'Failed to fetch owned pawns' });
    }
});

app.post('/api/shop/purchase', authenticateToken, async (req, res) => {
    try {
        const { pawnId: pawnIdRaw, itemId, price, currency } = req.body;
        const pawnId = pawnIdRaw || itemId;
        const userId = req.user.userId;
        if (!pawnId) {
            return res.status(400).json({ error: 'Missing pawnId/itemId' });
        }
        
        // Kullanıcının mevcut puanını kontrol et
        const userResult = await executeQuery(
            'SELECT score FROM users WHERE id = @userId',
            [{ name: 'userId', type: sql.NVarChar(36), value: userId }]
        );
        
        if (userResult.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }
        
        const currentScore = userResult[0].score || 0;
        
        // Zaten sahip olup olmadığını kontrol et
        const existingPawn = await executeQuery(
            'SELECT * FROM UserPawns WHERE user_id = @userId AND pawn_id = @pawnId',
            [
                { name: 'userId', type: sql.NVarChar(36), value: userId },
                { name: 'pawnId', type: sql.NVarChar(50), value: pawnId }
            ]
        );
        
        if (existingPawn.length > 0) {
            return res.status(400).json({ error: 'Pawn already owned' });
        }
        
        if (currency === 'points') {
            // Puan ile satın alma
            if (currentScore < price) {
                return res.status(400).json({ error: 'Insufficient points' });
            }
            
            // Puanı düş ve piyonu ekle
            await executeQuery(
                'UPDATE users SET score = score - @price WHERE id = @userId',
                [
                    { name: 'price', type: sql.Int, value: price },
                    { name: 'userId', type: sql.NVarChar(36), value: userId }
                ]
            );
            
            await executeQuery(
                'INSERT INTO UserPawns (user_id, pawn_id, purchased_at) VALUES (@userId, @pawnId, GETDATE())',
                [
                    { name: 'userId', type: sql.NVarChar(36), value: userId },
                    { name: 'pawnId', type: sql.NVarChar(50), value: pawnId }
                ]
            );
            
            res.json({ 
                success: true, 
                message: 'Pawn purchased successfully',
                newScore: currentScore - price
            });
        } else if (currency === 'diamonds') {
            // Elmas ile satın alma - sadece piyonu ekle (elmas düşme işlemi frontend'de yapılıyor)
            console.log('[SHOP DEBUG] Processing diamond purchase for pawn:', pawnId);
            await executeQuery(
                'INSERT INTO UserPawns (user_id, pawn_id, purchased_at) VALUES (@userId, @pawnId, GETDATE())',
                [
                    { name: 'userId', type: sql.NVarChar(36), value: userId },
                    { name: 'pawnId', type: sql.NVarChar(50), value: pawnId }
                ]
            );
            
            console.log('[SHOP DEBUG] Diamond purchase recorded successfully for pawn:', pawnId);
            res.json({ 
                success: true, 
                message: 'Pawn purchased successfully with diamonds'
            });
        } else {
            // Para ile satın alma - şimdilik sadece başarılı mesajı
            await executeQuery(
                'INSERT INTO UserPawns (user_id, pawn_id, purchased_at) VALUES (@userId, @pawnId, GETDATE())',
                [
                    { name: 'userId', type: sql.NVarChar(36), value: userId },
                    { name: 'pawnId', type: sql.NVarChar(50), value: pawnId }
                ]
            );
            
            res.json({ 
                success: true, 
                message: 'Pawn purchased successfully with money'
            });
        }
    } catch (error) {
        console.error('Error purchasing pawn:', error);
        res.status(500).json({ error: 'Failed to purchase pawn' });
    }
});

app.get('/api/user/selected-pawn', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.userId;
        
        const result = await executeQuery(
            'SELECT selected_pawn FROM users WHERE id = @userId',
            [{ name: 'userId', type: sql.NVarChar(36), value: userId }]
        );
        
        res.json({ 
            success: true, 
            selectedPawn: result[0]?.selected_pawn || 'default'
        });
    } catch (error) {
        console.error('Error fetching selected pawn:', error);
        res.status(500).json({ error: 'Failed to fetch selected pawn' });
    }
});

app.post('/api/user/select-pawn', authenticateToken, async (req, res) => {
    console.log('[PAWN SELECT DEBUG] Received pawn selection request');
    try {
        const { pawnId } = req.body;
        const userId = req.user.userId;
        
        console.log('[PAWN SELECT DEBUG] User ID:', userId);
        console.log('[PAWN SELECT DEBUG] Pawn ID:', pawnId);
        
        // Kullanıcının bu piyona sahip olup olmadığını kontrol et
        if (pawnId !== 'default') {
            console.log('[PAWN SELECT DEBUG] Checking if user owns pawn:', pawnId);
            const ownedPawn = await executeQuery(
                'SELECT * FROM UserPawns WHERE user_id = @userId AND pawn_id = @pawnId',
                [
                    { name: 'userId', type: sql.NVarChar(36), value: userId },
                    { name: 'pawnId', type: sql.NVarChar(50), value: pawnId }
                ]
            );
            
            console.log('[PAWN SELECT DEBUG] Owned pawn query result:', ownedPawn);
            
            if (ownedPawn.length === 0) {
                console.log('[PAWN SELECT DEBUG] User does not own this pawn');
                return res.status(400).json({ error: 'Pawn not owned' });
            }
        }
        
        console.log('[PAWN SELECT DEBUG] Updating selected pawn in database');
        // Seçili piyonu güncelle
        await executeQuery(
            'UPDATE users SET selected_pawn = @pawnId WHERE id = @userId',
            [
                { name: 'pawnId', type: sql.NVarChar(50), value: pawnId },
                { name: 'userId', type: sql.NVarChar(36), value: userId }
            ]
        );
        
        console.log('[PAWN SELECT DEBUG] Pawn selection successful');
        res.json({ 
            success: true, 
            message: 'Pawn selected successfully'
        });
    } catch (error) {
        console.error('[PAWN SELECT DEBUG] Error selecting pawn:', error);
        res.status(500).json({ error: 'Failed to select pawn' });
    }
});

// Elmas API endpoint'leri
app.get('/api/user/diamonds', authenticateToken, async (req, res) => {
    const userId = req.user.userId;

    try {
        const result = await executeQuery(
            'SELECT diamonds FROM users WHERE id = @userId',
            [{ name: 'userId', type: sql.NVarChar(36), value: userId }]
        );

        if (result.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.json({ diamonds: result[0].diamonds || 0 });
    } catch (error) {
        console.error('Get diamonds error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.post('/api/user/diamonds/add', authenticateToken, async (req, res) => {
    const { amount } = req.body;
    const userId = req.user.userId;

    if (!amount || amount <= 0) {
        return res.status(400).json({ error: 'Valid amount is required' });
    }

    try {
        await executeQuery(
            'UPDATE users SET diamonds = ISNULL(diamonds, 0) + @amount WHERE id = @userId',
            [
                { name: 'amount', type: sql.Int, value: amount },
                { name: 'userId', type: sql.NVarChar(36), value: userId }
            ]
        );

        // Get updated diamonds count
        const result = await executeQuery(
            'SELECT diamonds FROM users WHERE id = @userId',
            [{ name: 'userId', type: sql.NVarChar(36), value: userId }]
        );

        res.json({ 
            message: 'Diamonds added successfully', 
            diamonds: result[0].diamonds,
            added: amount 
        });
    } catch (error) {
        console.error('Add diamonds error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.post('/api/user/diamonds/spend', authenticateToken, async (req, res) => {
    const { amount } = req.body;
    const userId = req.user.userId;

    if (!amount || amount <= 0) {
        return res.status(400).json({ error: 'Valid amount is required' });
    }

    try {
        // Check current diamonds
        const currentResult = await executeQuery(
            'SELECT diamonds FROM users WHERE id = @userId',
            [{ name: 'userId', type: sql.NVarChar(36), value: userId }]
        );

        if (currentResult.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }

        const currentDiamonds = currentResult[0].diamonds || 0;
        if (currentDiamonds < amount) {
            return res.status(400).json({ error: 'Insufficient diamonds' });
        }

        // Spend diamonds
        await executeQuery(
            'UPDATE users SET diamonds = diamonds - @amount WHERE id = @userId',
            [
                { name: 'amount', type: sql.Int, value: amount },
                { name: 'userId', type: sql.NVarChar(36), value: userId }
            ]
        );

        // Get updated diamonds count
        const result = await executeQuery(
            'SELECT diamonds FROM users WHERE id = @userId',
            [{ name: 'userId', type: sql.NVarChar(36), value: userId }]
        );

        res.json({ 
            message: 'Diamonds spent successfully', 
            diamonds: result[0].diamonds,
            spent: amount 
        });
    } catch (error) {
        console.error('Spend diamonds error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});


// --- Socket.IO Handlers ---
io.on('connection', async (socket) => {
    const userId = socket.handshake.auth.userId || `guest_${socket.id}`;
    const token = socket.handshake.auth.token;
    const nickname = socket.handshake.auth.nickname || 'Unknown';
    const clientIp = socket.handshake.address || socket.request.socket.remoteAddress;
    
    console.log(`[CONNECTION] New connection attempt - Socket: ${socket.id}, UserID: ${userId}, Nickname: ${nickname}, IP: ${clientIp}`);
    console.log(`[CONNECTION] Auth details:`, {
        hasUserId: !!socket.handshake.auth.userId,
        hasToken: !!token,
        hasNickname: !!socket.handshake.auth.nickname,
        fullAuth: socket.handshake.auth
    });
    
    // Connection attempt tracking
    const connectionStartTime = Date.now();
    
    // Verify token if provided
    if (token) {
        try {
            const decoded = jwt.verify(token, JWT_SECRET);
            console.log(`[CONNECTION] Token decoded successfully:`, {
                decodedUserId: decoded.userId,
                socketUserId: userId,
                match: decoded.userId === userId
            });
            if (decoded.userId !== userId) {
                console.log(`[CONNECTION] Token userId mismatch: ${decoded.userId} vs ${userId}`);
                socket.disconnect();
                return;
            }
            console.log(`[CONNECTION] User connected with valid token: ${socket.id} with UserID: ${userId}`);
        } catch (error) {
            console.log(`[CONNECTION] Invalid token for user ${userId}: ${error.message}`);
            console.log(`[CONNECTION] Token details:`, {
                tokenLength: token.length,
                tokenStart: token.substring(0, 20) + '...',
                error: error.message
            });
            socket.disconnect();
            return;
        }
    } else {
        console.log(`[CONNECTION] User connected without token: ${socket.id} with UserID: ${userId}`);
    }
    
    console.log(`[CONNECTION] User successfully connected: ${socket.id} with UserID: ${userId}, Nickname: ${nickname}`);
    
    // Connection error handling with detailed logging
    socket.on('error', (error) => {
        console.error(`[CONNECTION ERROR] Socket error for ${socket.id}:`, {
            error: error.message,
            userId: userId,
            nickname: nickname,
            timestamp: new Date().toISOString()
        });
    });
    
    socket.on('connect_error', (error) => {
        console.error(`[CONNECT ERROR] Connection error for ${socket.id}:`, {
            error: error.message,
            userId: userId,
            nickname: nickname,
            timestamp: new Date().toISOString()
        });
    });
    
    socket.on('disconnect', (reason) => {
        const connectionDuration = Date.now() - connectionStartTime;
        console.log(`[DISCONNECT] User disconnected: ${socket.id}, UserID: ${userId}, Reason: ${reason}, Duration: ${connectionDuration}ms`);
    });

    socket.on('get_rooms', (callback) => {
        const roomList = Object.values(rooms);
        if (typeof callback === 'function') {
            callback(roomList);
        }
        broadcastRoomList();
    });

    socket.on('create_room', async ({ nickname }, callback) => {
        try {
            console.log(`[CREATE_ROOM] Starting room creation for user: ${userId}, nickname: ${nickname}`);
            const room = await createRoomAsync(userId, nickname);
            console.log(`[CREATE_ROOM] Room created successfully: ${room.id}`);
            
            const { player } = await joinRoomAsync(room.id, userId, nickname, socket.id);
            console.log(`[CREATE_ROOM] Player joined room successfully: ${player.nickname}`);
            
            socket.join(room.id);
            updateRoom(room.id);
            
            if (callback) {
                console.log(`[CREATE_ROOM] Sending success response`);
                callback({ success: true, room, player });
            }
        } catch (error) {
            console.error('[CREATE_ROOM] Error during room creation:', {
                userId: userId,
                nickname: nickname,
                error: error.message,
                stack: error.stack
            });
            
            if (callback) {
                const errorMessage = error.message || 'Oda oluşturulurken bir hata oluştu';
                callback({ success: false, message: errorMessage });
            }
        }
    });

    socket.on('join_room', async ({ roomId, nickname }, callback) => {
        try {
            console.log(`[JOIN_ROOM] Starting join room for user: ${userId}, roomId: ${roomId}, nickname: ${nickname}`);
            const { player } = await joinRoomAsync(roomId, userId, nickname, socket.id);
            console.log(`[JOIN_ROOM] Player joined successfully: ${player.nickname}`);
            
            socket.join(roomId);
            updateRoom(roomId);
            
            if (callback) {
                console.log(`[JOIN_ROOM] Sending success response`);
                callback({ success: true, player });
            }
        } catch (error) {
            console.error('[JOIN_ROOM] Error during room join:', {
                userId: userId,
                roomId: roomId,
                nickname: nickname,
                error: error.message,
                stack: error.stack
            });
            
            if (callback) {
                const errorMessage = error.message || 'Odaya katılırken bir hata oluştu';
                callback({ success: false, message: errorMessage });
            }
        }
    });

    socket.on('start_game', (roomId) => {
        const room = rooms[roomId];
        if (!room) return;
        const requestingPlayer = room.players.find(p => p.socketId === socket.id);
        if (room && requestingPlayer && room.hostId === requestingPlayer.id) {
            startPreGame(roomId);
        }
    });

    socket.on('roll_dice_turn_order', ({ roomId }) => {
        console.log(`[Roll Dice Turn Order] Player ${socket.id} rolling dice for turn order in room ${roomId}`);
        
        // Input validation
        if (!roomId) {
            console.error(`[Roll Dice Turn Order] Missing roomId`);
            socket.emit('error', { type: 'INVALID_REQUEST', message: 'Room ID is required' });
            return;
        }
        
        const room = rooms[roomId];
        if (!room) {
            console.log(`[Roll Dice Turn Order] Room ${roomId} not found`);
            socket.emit('error', { type: 'ROOM_NOT_FOUND', message: 'Room not found' });
            return;
        }
        
        const player = room.players.find(p => p.socketId === socket.id);
        if (!player) {
            console.log(`[Roll Dice Turn Order] Player ${socket.id} not found in room ${roomId}`);
            socket.emit('error', { type: 'PLAYER_NOT_FOUND', message: 'Player not found in room' });
            return;
        }

        if (room.gameState.phase !== 'pre-game') {
            console.log(`[Roll Dice Turn Order] Game is not in pre-game phase. Current phase: ${room.gameState.phase}`);
            socket.emit('error', { type: 'WRONG_PHASE', message: 'Game is not in pre-game phase' });
            return;
        }

        // Initialize turnRolls if it doesn't exist
        if (!room.gameState.turnRolls) {
            room.gameState.turnRolls = {};
        }

        console.log(`[Roll Dice Turn Order] Current turnRolls state:`, room.gameState.turnRolls);
        console.log(`[Roll Dice Turn Order] Player ${player.nickname} (${player.color}) attempting to roll`);

        if (room.gameState.turnRolls[player.color]) {
            console.log(`[Roll Dice Turn Order] ${player.nickname} already rolled in pre-game`);
            socket.emit('error', { type: 'ALREADY_ROLLED', message: 'You have already rolled for turn order' });
            return;
        }

        try {
            const diceValue = Math.floor(Math.random() * 6) + 1;
            room.gameState.turnRolls[player.color] = { 
                nickname: player.nickname, 
                diceValue,
                timestamp: Date.now()
            };
            
            console.log(`[Pre-Game] ${player.nickname} rolled: ${diceValue}`);
            console.log(`[Pre-Game] Updated turnRolls:`, room.gameState.turnRolls);
            
            // Send success response to the player
            socket.emit('roll_success', { 
                diceValue, 
                color: player.color,
                message: `You rolled a ${diceValue}!`
            });
            
            updateRoom(roomId);
            determineTurnOrder(roomId);
            
        } catch (error) {
            console.error(`[Roll Dice Turn Order] Error rolling dice:`, error);
            socket.emit('error', { type: 'DICE_ROLL_ERROR', message: 'Error rolling dice. Please try again.' });
        }
    });

    socket.on('roll_dice', ({ roomId }) => {
        console.log(`[Roll Dice] Player ${socket.id} rolling dice in room ${roomId}`);
        
        // Input validation
        if (!roomId) {
            console.error(`[Roll Dice] Missing roomId`);
            socket.emit('error', { type: 'INVALID_REQUEST', message: 'Room ID is required' });
            return;
        }
        
        const room = rooms[roomId];
        if (!room) {
            console.log(`[Roll Dice] Room ${roomId} not found`);
            socket.emit('error', { type: 'ROOM_NOT_FOUND', message: 'Room not found' });
            return;
        }
        
        const player = room.players.find(p => p.socketId === socket.id);
        if (!player) {
            console.log(`[Roll Dice] Player ${socket.id} not found in room ${roomId}`);
            socket.emit('error', { type: 'PLAYER_NOT_FOUND', message: 'Player not found in room' });
            return;
        }

        if (room.gameState.phase !== 'playing') {
            console.log(`[Roll Dice] Game is not in playing phase. Current phase: ${room.gameState.phase}`);
            socket.emit('error', { type: 'WRONG_PHASE', message: 'Game is not in playing phase' });
            return;
        }

        if (player.color !== room.gameState.currentPlayer) {
            console.log(`[Roll Dice] Not ${player.nickname}'s turn. Current: ${room.gameState.currentPlayer}`);
            socket.emit('error', { type: 'NOT_YOUR_TURN', message: 'It is not your turn' });
            return;
        }
        
        if (room.gameState.diceValue !== null) {
            console.log(`[Roll Dice] ${player.nickname} already rolled this turn`);
            socket.emit('error', { type: 'ALREADY_ROLLED', message: 'You have already rolled this turn' });
            return;
        }
        
        try {
            const diceValue = Math.floor(Math.random() * 6) + 1;
            room.gameState.diceValue = diceValue;
            room.gameState.message = `${player.nickname} ${diceValue} attı.`;
            
            console.log(`[Game] ${player.nickname} rolled: ${diceValue}`);
            
            // Send success response
            socket.emit('roll_success', { 
                diceValue, 
                color: player.color,
                message: `You rolled a ${diceValue}!`
            });
            
            const validMoves = getValidMoves(player, diceValue, room);
            room.gameState.validMoves = validMoves;
            updateRoom(roomId);
            
            if (validMoves.length === 0) {
                console.log(`[Game] ${player.nickname} has no valid moves`);
                setTimeout(async () => await updateTurn(room), 1000);
            }
            
        } catch (error) {
            console.error(`[Roll Dice] Error rolling dice:`, error);
            socket.emit('error', { type: 'DICE_ROLL_ERROR', message: 'Error rolling dice. Please try again.' });
        }
    });

    socket.on('move_pawn', async ({ roomId, move }) => {
        console.log(`[MOVE_PAWN] Received move_pawn event:`, { roomId, move });
        const room = rooms[roomId];
        if (!room) {
            console.log(`[MOVE_PAWN] Room not found: ${roomId}`);
            return;
        }
        const player = room.players.find(p => p.socketId === socket.id);
        if (!player) {
            console.log(`[MOVE_PAWN] Player not found for socket: ${socket.id}`);
            return;
        }
        if (player.color !== room.gameState.currentPlayer) {
            console.log(`[MOVE_PAWN] Not player's turn. Current: ${room.gameState.currentPlayer}, Player: ${player.color}`);
            return;
        }

        console.log(`[MOVE_PAWN] ${player.nickname} moving pawn ${move.pawnIndex} from ${move.from} to ${move.to}`);
        const capturedPawn = handlePawnMove(room, player, move);
        const rolledSix = room.gameState.diceValue === 6;

        console.log(`[MOVE_PAWN] Move results - Captured: ${capturedPawn}, Rolled Six: ${rolledSix}`);

        room.gameState.validMoves = [];
        room.gameState.diceValue = null;
        updateRoom(roomId);

        if (rolledSix || capturedPawn) {
            console.log(`[MOVE_PAWN] ${player.nickname} gets another turn`);
            // Player gets another turn, do nothing, wait for next roll
        } else {
            console.log(`[MOVE_PAWN] ${player.nickname} turn ends, switching to next player`);
            await updateTurn(room);
        }
    });

    // Chat events
    socket.on('send_message', ({ roomId, message }) => {
        console.log(`[CHAT] Message from ${socket.id} in room ${roomId}: ${message}`);
        const room = rooms[roomId];
        if (!room) {
            console.log(`[CHAT] Room not found: ${roomId}`);
            return;
        }
        const player = room.players.find(p => p.socketId === socket.id);
        if (!player) {
            console.log(`[CHAT] Player not found for socket: ${socket.id}`);
            return;
        }

        // Kullanıcının ceza durumunu kontrol et
        const penalty = profanityTracker.checkPenalty(player.id);
        if (penalty.shouldBlock) {
            socket.emit('message_blocked', {
                reason: penalty.reason,
                duration: penalty.duration
            });
            console.log(`[CHAT] Message blocked for user ${player.nickname}: ${penalty.reason}`);
            return;
        }

        // Mesajı küfür/hakaret açısından kontrol et
        const profanityCheck = checkProfanity(message);
        let finalMessage = message;
        
        if (profanityCheck.hasProfanity) {
            console.log(`[CHAT] Profanity detected from ${player.nickname}:`, profanityCheck.foundWords);
            
            // İhlali kaydet
            profanityTracker.recordViolation(player.id, profanityCheck.severity);
            
            // Mesajı filtrele
            finalMessage = filterProfanity(message);
            
            // Kullanıcıya uyarı gönder
            socket.emit('profanity_warning', {
                severity: profanityCheck.severity,
                message: profanityCheck.severity >= SEVERITY_LEVELS.HIGH 
                    ? 'Ağır küfür/hakaret tespit edildi. Lütfen nezaket kurallarına uyun.'
                    : 'Uygunsuz dil kullanımı tespit edildi. Lütfen daha nazik olun.'
            });
        }

        const chatMessage = {
            id: uuidv4(),
            userId: player.id,
            userName: player.nickname,
            text: finalMessage,
            timestamp: Date.now(),
            isFiltered: profanityCheck.hasProfanity
        };

        // Initialize chat messages array if it doesn't exist
        if (!room.chatMessages) {
            room.chatMessages = [];
        }

        // Add message to room
        room.chatMessages.push(chatMessage);

        // Keep only last 100 messages
        if (room.chatMessages.length > 100) {
            room.chatMessages = room.chatMessages.slice(-100);
        }

        // Broadcast message to all players in the room
        io.to(roomId).emit('new_message', chatMessage);
        console.log(`[CHAT] Message broadcasted to room ${roomId}${profanityCheck.hasProfanity ? ' (filtered)' : ''}`);
    });

    socket.on('leave_room', async () => { await leaveRoomAsync(socket.id); });
    socket.on('disconnect', async (reason) => {
        console.log(`[DISCONNECT] User disconnected: ${socket.id}, Reason: ${reason}`);
        
        // Disconnect reason'a göre loglama
        if (reason === 'io server disconnect') {
            console.log(`[DISCONNECT] ${socket.id} - Sunucu tarafından kapatıldı`);
        } else if (reason === 'client namespace disconnect') {
            console.log(`[DISCONNECT] ${socket.id} - İstemci tarafından kapatıldı`);
        } else if (reason === 'ping timeout') {
            console.log(`[DISCONNECT] ${socket.id} - Ping timeout`);
        } else if (reason === 'transport close') {
            console.log(`[DISCONNECT] ${socket.id} - Transport bağlantısı kapandı`);
        } else if (reason === 'transport error') {
            console.log(`[DISCONNECT] ${socket.id} - Transport hatası`);
        }
        
        await leaveRoomAsync(socket.id);
    });
});

// --- Health Check Endpoint ---
app.get('/health', async (req, res) => {
    try {
        // Database connection check
        await executeQuery('SELECT 1');
        
        res.status(200).json({
            status: 'healthy',
            timestamp: new Date().toISOString(),
            service: 'ludo-backend',
            database: 'connected',
            port: PORT
        });
    } catch (error) {
        console.error('Health check failed:', error);
        res.status(503).json({
            status: 'unhealthy',
            timestamp: new Date().toISOString(),
            service: 'ludo-backend',
            database: 'disconnected',
            error: error.message
        });
    }
});

// --- Phone Verification API Routes (VatanSMS Entegrasyonu) ---

// Telefon doğrulama kodu gönder (VatanSMS API ile)
app.post('/api/send-sms-code', generalSmsLimiter, phoneNumberLimiter, ipDailyPhoneLimit, async (req, res) => {
    const { phoneNumber } = req.body;
    
    if (!phoneNumber) {
        return res.status(400).json({ message: 'Telefon numarası gerekli.' });
    }

    try {
        // Türkiye formatını kontrol et (5xx xxx xx xx)
        const cleanPhone = phoneNumber.replace(/\s/g, '');
        if (!cleanPhone.match(/^5[0-9]{9}$/)) {
            return res.status(400).json({ message: 'Geçersiz telefon numarası formatı. 5xx xxx xx xx formatında olmalı.' });
        }

        // 6 haneli rastgele kod oluştur
        const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
        const verificationId = uuidv4();
        const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 dakika sonra expires

        // Eski kodları temizle
        await executeQuery(
            'DELETE FROM phone_verifications WHERE phone_number = @phoneNumber',
            [{ name: 'phoneNumber', type: sql.NVarChar(255), value: cleanPhone }]
        );

        // Yeni kodu kaydet
        await executeQuery(
            'INSERT INTO phone_verifications (id, phone_number, verification_code, expires_at) VALUES (@id, @phoneNumber, @code, @expiresAt)',
            [
                { name: 'id', type: sql.NVarChar(36), value: verificationId },
                { name: 'phoneNumber', type: sql.NVarChar(255), value: cleanPhone },
                { name: 'code', type: sql.NVarChar(6), value: verificationCode },
                { name: 'expiresAt', type: sql.DateTime2, value: expiresAt }
            ]
        );

        // VatanSMS API ile SMS gönder
        const smsResult = await smsService.send(cleanPhone, verificationCode);

        if (smsResult.success) {
            console.log(`✅ SMS başarıyla gönderildi: ${cleanPhone} -> OTP: ${verificationCode}`);
            
            res.json({ 
                success: true, 
                message: 'Doğrulama kodu SMS ile gönderildi.',
                phoneNumber: cleanPhone,
                expiresIn: 600, // 10 dakika
                smsStatus: smsResult.message
            });
        } else {
            console.error(`❌ SMS gönderme başarısız: ${cleanPhone}`, smsResult.error);
            
            // SMS gönderme başarısız olsa bile kod DB'ye kaydedildi
            // Development'ta konsola yazdır
            if (process.env.NODE_ENV === 'development') {
                console.log(`[DEVELOPMENT] Telefon: ${cleanPhone}, Kod: ${verificationCode} (10 dakika geçerli)`);
            }
            
            res.json({ 
                success: true, 
                message: 'Doğrulama kodu oluşturuldu. SMS gönderiminde sorun yaşandı.',
                phoneNumber: cleanPhone,
                expiresIn: 600,
                smsStatus: smsResult.message,
                warning: 'SMS gönderimi başarısız - kod konsola yazdırıldı'
            });
        }

    } catch (error) {
        console.error('Send SMS code error:', error);
        res.status(500).json({ message: 'İç sunucu hatası', error: error.message });
    }
});

// Database connection test endpoint
app.get('/api/test-db-connection', async (req, res) => {
    console.log(`[${new Date().toISOString()}] 🧪 Testing database connection...`);
    
    try {
        const startTime = Date.now();
        const result = await executeQuery('SELECT 1 as test, GETDATE() as current_time');
        const endTime = Date.now();
        
        console.log(`[${new Date().toISOString()}] ✅ Database connection test successful`);
        console.log(`[${new Date().toISOString()}] ⏱️  Query time: ${endTime - startTime}ms`);
        console.log(`[${new Date().toISOString()}] 📊 Result:`, result);
        
        res.json({
            success: true,
            message: 'Database connection successful',
            queryTime: `${endTime - startTime}ms`,
            result: result
        });
    } catch (error) {
        console.error(`[${new Date().toISOString()}] ❌ Database connection test failed:`, error);
        res.status(500).json({
            success: false,
            message: 'Database connection failed',
            error: error.message
        });
    }
});

// Telefon doğrulama kodunu kontrol et
app.post('/api/verify-phone', verificationLimiter, async (req, res) => {
    console.log(`[${new Date().toISOString()}] 📞 VERIFY-PHONE REQUEST STARTED`);
    console.log(`[${new Date().toISOString()}] 📱 Request Body:`, JSON.stringify(req.body, null, 2));
    console.log(`[${new Date().toISOString()}] 📝 Headers:`, JSON.stringify(req.headers, null, 2));
    console.log(`[${new Date().toISOString()}] 🔍 IP: ${req.ip || req.connection.remoteAddress}`);
    
    const { phoneNumber, verificationCode } = req.body;
    
    if (!phoneNumber || !verificationCode) {
        console.log(`[${new Date().toISOString()}] ❌ ERROR: Missing phoneNumber or verificationCode`);
        console.log(`[${new Date().toISOString()}] 📞 VERIFY-PHONE REQUEST ENDED - Status: 400`);
        return res.status(400).json({ message: 'Telefon numarası ve doğrulama kodu gerekli.' });
    }

    try {
        const cleanPhone = phoneNumber.replace(/\s/g, '');
        console.log(`[${new Date().toISOString()}] 🧹 Cleaned phone number: ${cleanPhone}`);
        console.log(`[${new Date().toISOString()}] 🔑 Verification code: ${verificationCode}`);

        // Kodu kontrol et
        console.log(`[${new Date().toISOString()}] 🔍 Checking verification code in database...`);
        console.log(`[${new Date().toISOString()}] 📊 Query: SELECT * FROM phone_verifications WHERE phone_number='${cleanPhone}' AND verification_code='${verificationCode}' AND expires_at > GETDATE() AND is_used = 0`);
        
        const queryStartTime = Date.now();
        const result = await executeQuery(
            'SELECT * FROM phone_verifications WHERE phone_number = @phoneNumber AND verification_code = @code AND expires_at > GETDATE() AND is_used = 0',
            [
                { name: 'phoneNumber', type: sql.NVarChar(255), value: cleanPhone },
                { name: 'code', type: sql.NVarChar(6), value: verificationCode }
            ]
        );
        const queryEndTime = Date.now();
        console.log(`[${new Date().toISOString()}] ⏱️  Query execution time: ${queryEndTime - queryStartTime}ms`);

        console.log(`[${new Date().toISOString()}] 📊 Database query result:`, result);

        if (result.length === 0) {
            console.log(`[${new Date().toISOString()}] ❌ ERROR: No valid verification code found in database`);
            console.log(`[${new Date().toISOString()}] 📞 VERIFY-PHONE REQUEST ENDED - Status: 400`);
            return res.status(400).json({ message: 'Geçersiz veya süresi dolmuş doğrulama kodu.' });
        }

        // Kodu kullanıldı olarak işaretle
        console.log(`[${new Date().toISOString()}] ✅ Valid verification code found, marking as used...`);
        await executeQuery(
            'UPDATE phone_verifications SET is_used = 1 WHERE id = @id',
            [{ name: 'id', type: sql.NVarChar(36), value: result[0].id }]
        );

        // Check if user exists with this phone number (şifrelenmiş telefonları kontrol et)
        console.log(`[${new Date().toISOString()}] 🔍 Checking if user exists with phone number...`);
        const allUsers = await executeQuery(
            'SELECT id, nickname, email, phone_number, score, games_played, wins FROM users WHERE phone_number IS NOT NULL'
        );
        
        let user = null;
        for (const dbUser of allUsers) {
            try {
                const decryptedPhone = decryptPhoneNumber(dbUser.phone_number);
                if (decryptedPhone === cleanPhone) {
                    user = dbUser;
                    break;
                }
            } catch (error) {
                // Şifre çözme hatası varsa, bu kullanıcıyı atla
                console.error('Telefon çözme hatası:', error);
                continue;
            }
        }

        let response;
        if (user) {
            // User exists
            console.log(`[${new Date().toISOString()}] ✅ User found:`, user);
            
            // Check if user needs nickname
            const needsNickname = !user.nickname || user.nickname.trim() === '';
            
            // If user has no nickname, auto-generate one from phone number
            if (needsNickname) {
                console.log(`[${new Date().toISOString()}] 📝 User needs nickname, auto-generating...`);
                
                try {
                    const phoneNickname = `User${cleanPhone.slice(-4)}`;
                    
                    // Update user with auto-generated nickname
                    await executeQuery(
                        'UPDATE users SET nickname = @nickname WHERE id = @id',
                        [
                            { name: 'nickname', type: sql.NVarChar(50), value: phoneNickname },
                            { name: 'id', type: sql.NVarChar(36), value: user.id }
                        ]
                    );
                    
                    console.log(`[${new Date().toISOString()}] ✅ User nickname auto-generated:`, phoneNickname);
                    
                    // Return user with auto-generated nickname
                    response = { 
                        success: true, 
                        message: 'Telefon numarası doğrulandı. Rumuz otomatik oluşturuldu.',
                        phoneNumber: cleanPhone,
                        userExists: true,
                        needsNickname: false, // No need for nickname screen since we auto-generated it
                        user: {
                            id: user.id,
                            nickname: phoneNickname,
                            email: user.email,
                            phoneNumber: cleanPhone,
                            score: user.score,
                            gamesPlayed: user.games_played,
                            wins: user.wins
                        }
                    };
                } catch (updateError) {
                    console.error(`[${new Date().toISOString()}] ❌ Auto-generate nickname error:`, updateError);
                    // Fallback to showing nickname screen
                    response = { 
                        success: true, 
                        message: 'Telefon numarası doğrulandı. Rumuz gerekli.',
                        phoneNumber: cleanPhone,
                        userExists: true,
                        needsNickname: true,
                        user: {
                            id: user.id,
                            nickname: user.nickname,
                            email: user.email,
                            phoneNumber: cleanPhone,
                            score: user.score,
                            gamesPlayed: user.games_played,
                            wins: user.wins
                        }
                    };
                }
            } else {
                console.log(`[${new Date().toISOString()}] ✅ User has nickname:`, user.nickname);
                
                response = { 
                    success: true, 
                    message: 'Telefon numarası doğrulandı.',
                    phoneNumber: cleanPhone,
                    userExists: true,
                    needsNickname: false,
                    user: {
                        id: user.id,
                        nickname: user.nickname,
                        email: user.email,
                        phoneNumber: cleanPhone,
                        score: user.score,
                        gamesPlayed: user.games_played,
                        wins: user.wins
                    }
                };
            }
        } else {
            // User doesn't exist, create automatically
            console.log(`[${new Date().toISOString()}] 📱 User not found, creating automatically...`);
            
            try {
                // Auto-create user with auto-generated nickname
                const userId = uuidv4();
                const encryptedPhone = encryptPhoneNumber(cleanPhone);
                const phoneNickname = `User${cleanPhone.slice(-4)}`;
                const tempEmail = `${cleanPhone}@phone.user`;
                const password_hash = await bcrypt.hash(cleanPhone + JWT_SECRET, 10);
                
                await executeQuery(
                    'INSERT INTO users (id, email, password_hash, username, nickname, phone_number, salt, score, games_played, wins) VALUES (@id, @email, @passwordHash, @username, @nickname, @phoneNumber, @salt, 0, 0, 0)',
                    [
                        { name: 'id', type: sql.NVarChar(36), value: userId },
                        { name: 'email', type: sql.NVarChar(255), value: tempEmail },
                        { name: 'passwordHash', type: sql.NVarChar(255), value: password_hash },
                        { name: 'username', type: sql.NVarChar(50), value: phoneNickname },
                        { name: 'nickname', type: sql.NVarChar(50), value: phoneNickname }, // Auto-generated nickname
                        { name: 'phoneNumber', type: sql.NVarChar(255), value: encryptedPhone },
                        { name: 'salt', type: sql.NVarChar(255), value: '' }
                    ]
                );
                
                console.log(`[${new Date().toISOString()}] ✅ Auto-created user:`, userId);
                
                response = { 
                    success: true, 
                    message: 'Telefon numarası doğrulandı. Yeni kullanıcı oluşturuldu.',
                    phoneNumber: cleanPhone,
                    userExists: false,
                    needsNickname: false, // No need for nickname screen since we auto-generated it
                    user: {
                        id: userId,
                        nickname: phoneNickname,
                        email: tempEmail,
                        phoneNumber: cleanPhone,
                        score: 0,
                        gamesPlayed: 0,
                        wins: 0
                    }
                };
            } catch (createError) {
                console.error(`[${new Date().toISOString()}] ❌ Auto-create user error:`, createError);
                response = { 
                    success: true, 
                    message: 'Telefon numarası doğrulandı. Rumuz gerekli.',
                    phoneNumber: cleanPhone,
                    userExists: false,
                    needsNickname: true
                };
            }
        }
        
        console.log(`[${new Date().toISOString()}] ✅ SUCCESS: Verification completed`);
        console.log(`[${new Date().toISOString()}] 📤 Response:`, JSON.stringify(response, null, 2));
        console.log(`[${new Date().toISOString()}] 📞 VERIFY-PHONE REQUEST ENDED - Status: 200`);
        
        res.json(response);
    } catch (error) {
        console.error(`[${new Date().toISOString()}] ❌ VERIFY-PHONE ERROR:`, error);
        console.error(`[${new Date().toISOString()}] 📞 VERIFY-PHONE REQUEST ENDED - Status: 500`);
        res.status(500).json({ message: 'İç sunucu hatası', error: error.message });
    }
});

// Telefonla kayıt ol
app.post('/api/register-phone', async (req, res) => {
    const { phoneNumber, verificationCode, nickname } = req.body;
    
    if (!phoneNumber || !verificationCode || !nickname) {
        return res.status(400).json({ message: 'Telefon numarası, doğrulama kodu ve rumuz gerekli.' });
    }

    try {
        const cleanPhone = phoneNumber.replace(/\s/g, '');

        // Önce doğrulama kodunu kontrol et (kullanılmış kodları da kabul et - zaten doğrulanmış olmalı)
        const verifyResult = await executeQuery(
            'SELECT * FROM phone_verifications WHERE phone_number = @phoneNumber AND verification_code = @code AND expires_at > GETDATE()',
            [
                { name: 'phoneNumber', type: sql.NVarChar(255), value: cleanPhone },
                { name: 'code', type: sql.NVarChar(6), value: verificationCode }
            ]
        );

        if (verifyResult.length === 0) {
            return res.status(400).json({ message: 'Geçersiz veya süresi dolmuş doğrulama kodu.' });
        }

        // Telefon numarasının daha önce kullanılıp kullanılmadığını kontrol et
        const allUsers = await executeQuery(
            'SELECT id, phone_number FROM users WHERE phone_number IS NOT NULL'
        );
        
        let phoneExists = false;
        for (const user of allUsers) {
            try {
                const decryptedPhone = decryptPhoneNumber(user.phone_number);
                if (decryptedPhone === cleanPhone) {
                    phoneExists = true;
                    break;
                }
            } catch (error) {
                // Şifre çözme hatası varsa, bu kullanıcıyı atla
                console.error('Telefon çözme hatası:', error);
                continue;
            }
        }

        if (phoneExists) {
            return res.status(400).json({ message: 'Bu telefon numarası ile zaten kayıt olunmuş.' });
        }

        // Rumuz kontrolü
        const existingNickname = await executeQuery(
            'SELECT * FROM users WHERE nickname = @nickname',
            [{ name: 'nickname', type: sql.NVarChar(50), value: nickname }]
        );

        if (existingNickname.length > 0) {
            return res.status(400).json({ message: 'Bu rumuz zaten kullanılıyor.' });
        }

        // Email kontrolü - telefon numarası formatında email var mı?
        const existingEmail = await executeQuery(
            'SELECT * FROM users WHERE email = @email',
            [{ name: 'email', type: sql.NVarChar(255), value: `${cleanPhone}@phone.user` }]
        );

        let userId;
        let encryptedPhone = encryptPhoneNumber(cleanPhone);

        if (existingEmail.length > 0) {
            // Email zaten varsa, mevcut kullanıcıyı güncelle
            userId = existingEmail[0].id;
            await executeQuery(
                'UPDATE users SET phone_number = @phoneNumber, nickname = @nickname, username = @username WHERE id = @id',
                [
                    { name: 'phoneNumber', type: sql.NVarChar(255), value: encryptedPhone },
                    { name: 'nickname', type: sql.NVarChar(50), value: nickname },
                    { name: 'username', type: sql.NVarChar(50), value: nickname },
                    { name: 'id', type: sql.NVarChar(36), value: userId }
                ]
            );
        } else {
            // Yeni kullanıcı oluştur
            userId = uuidv4();
            const password_hash = await bcrypt.hash(cleanPhone + JWT_SECRET, 10); // Telefon + secret ile geçici şifre
            
            await executeQuery(
                'INSERT INTO users (id, email, password_hash, username, nickname, phone_number, salt, score, games_played, wins) VALUES (@id, @email, @passwordHash, @username, @nickname, @phoneNumber, @salt, 0, 0, 0)',
                [
                    { name: 'id', type: sql.NVarChar(36), value: userId },
                    { name: 'email', type: sql.NVarChar(255), value: `${cleanPhone}@phone.user` }, // Geçici email
                    { name: 'passwordHash', type: sql.NVarChar(255), value: password_hash },
                    { name: 'username', type: sql.NVarChar(50), value: nickname },
                    { name: 'nickname', type: sql.NVarChar(50), value: nickname },
                    { name: 'phoneNumber', type: sql.NVarChar(255), value: encryptedPhone },
                    { name: 'salt', type: sql.NVarChar(255), value: '' }
                ]
            );
        }

        // Kodu kullanıldı olarak işaretle
        await executeQuery(
            'UPDATE phone_verifications SET is_used = 1 WHERE id = @id',
            [{ name: 'id', type: sql.NVarChar(36), value: verifyResult[0].id }]
        );

        // Token'ları oluştur
        const accessToken = jwt.sign({ userId: userId, nickname: nickname }, JWT_SECRET, { expiresIn: '1h' });
        const refreshToken = jwt.sign({ userId: userId, type: 'refresh' }, JWT_SECRET, { expiresIn: '90d' });

        // Refresh token'ı kaydet
        const refreshTokenId = uuidv4();
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 90);

        await executeQuery(
            'INSERT INTO refresh_tokens (id, user_id, token, expires_at) VALUES (@id, @userId, @token, @expiresAt)',
            [
                { name: 'id', type: sql.NVarChar(36), value: refreshTokenId },
                { name: 'userId', type: sql.NVarChar(36), value: userId },
                { name: 'token', type: sql.NVarChar(255), value: refreshToken },
                { name: 'expiresAt', type: sql.DateTime2, value: expiresAt }
            ]
        );

        res.json({
            success: true,
            message: 'Telefonla kayıt başarılı.',
            accessToken,
            refreshToken,
            user: {
                id: userId,
                email: `${cleanPhone}@phone.user`,
                nickname: nickname,
                phoneNumber: cleanPhone,
                score: 0
            }
        });
    } catch (error) {
        console.error('Register phone error:', error);
        res.status(500).json({ message: 'İç sunucu hatası', error: error.message });
    }
});

// Telefonla giriş yap
app.post('/api/login-phone', async (req, res) => {
    const { phoneNumber, verificationCode } = req.body;
    
    if (!phoneNumber || !verificationCode) {
        return res.status(400).json({ message: 'Telefon numarası ve doğrulama kodu gerekli.' });
    }

    try {
        const cleanPhone = phoneNumber.replace(/\s/g, '');

        // Önce doğrulama kodunu kontrol et (kullanılmış kodları da kabul et - zaten doğrulanmış olmalı)
        const verifyResult = await executeQuery(
            'SELECT * FROM phone_verifications WHERE phone_number = @phoneNumber AND verification_code = @code AND expires_at > GETDATE()',
            [
                { name: 'phoneNumber', type: sql.NVarChar(255), value: cleanPhone },
                { name: 'code', type: sql.NVarChar(6), value: verificationCode }
            ]
        );

        if (verifyResult.length === 0) {
            return res.status(400).json({ message: 'Geçersiz veya süresi dolmuş doğrulama kodu.' });
        }

        // Kullanıcıyı telefon numarası ile bul (şifrelenmiş telefonları kontrol et)
        const allUsers = await executeQuery(
            'SELECT id, email, username, nickname, phone_number, score, games_played, wins FROM users WHERE phone_number IS NOT NULL'
        );
        
        let user = null;
        for (const dbUser of allUsers) {
            try {
                const decryptedPhone = decryptPhoneNumber(dbUser.phone_number);
                if (decryptedPhone === cleanPhone) {
                    user = dbUser;
                    break;
                }
            } catch (error) {
                // Şifre çözme hatası varsa, bu kullanıcıyı atla
                console.error('Telefon çözme hatası:', error);
                continue;
            }
        }

        if (!user) {
            return res.status(404).json({ message: 'Bu telefon numarası ile kayıtlı kullanıcı bulunamadı.' });
        }

        // Kodu kullanıldı olarak işaretle
        await executeQuery(
            'UPDATE phone_verifications SET is_used = 1 WHERE id = @id',
            [{ name: 'id', type: sql.NVarChar(36), value: verifyResult[0].id }]
        );

        // Token'ları oluştur
        const accessToken = jwt.sign({ userId: user.id, nickname: user.nickname }, JWT_SECRET, { expiresIn: '1h' });
        const refreshToken = jwt.sign({ userId: user.id, type: 'refresh' }, JWT_SECRET, { expiresIn: '90d' });

        // Refresh token'ı kaydet
        const refreshTokenId = uuidv4();
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 90);

        await executeQuery(
            'INSERT INTO refresh_tokens (id, user_id, token, expires_at) VALUES (@id, @userId, @token, @expiresAt)',
            [
                { name: 'id', type: sql.NVarChar(36), value: refreshTokenId },
                { name: 'userId', type: sql.NVarChar(36), value: user.id },
                { name: 'token', type: sql.NVarChar(255), value: refreshToken },
                { name: 'expiresAt', type: sql.DateTime2, value: expiresAt }
            ]
        );

        res.json({
            success: true,
            message: 'Telefonla giriş başarılı.',
            accessToken,
            refreshToken,
            user: {
                id: user.id,
                email: user.email,
                nickname: user.nickname,
                phoneNumber: user.phone_number,
                score: user.score
            }
        });
    } catch (error) {
        console.error('Login phone error:', error);
        res.status(500).json({ message: 'İç sunucu hatası', error: error.message });
    }
});

// Kullanıcı profili endpoint'i
app.get('/api/user/profile', requireDatabase, async (req, res) => {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ message: 'Yetkilendirme başlığı gerekli.' });
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    try {
        // Verify JWT token
        const decoded = jwt.verify(token, JWT_SECRET);
        const userId = decoded.userId;

        // Get user from database
        const userResult = await executeQuery(
            'SELECT id, email, username, nickname, phone_number, score, games_played, wins FROM users WHERE id = @userId',
            [{ name: 'userId', type: sql.NVarChar(36), value: userId }]
        );

        if (userResult.length === 0) {
            return res.status(404).json({ message: 'Kullanıcı bulunamadı.' });
        }

        const user = userResult[0];
        
        // Telefon numarasını çöz ve maskele
        let maskedPhoneNumber = null;
        if (user.phone_number) {
            try {
                const decryptedPhone = decryptPhoneNumber(user.phone_number);
                console.log('Telefon numarası başarıyla deşifre edildi:', decryptedPhone);
                const { maskPhoneNumber } = require('./utils/encryption');
                maskedPhoneNumber = maskPhoneNumber(decryptedPhone);
                console.log('Maskelenmiş telefon numarası:', maskedPhoneNumber);
            } catch (error) {
                console.error('Telefon numarası çözme hatası:', error);
                console.error('Orijinal şifreli veri:', user.phone_number);
                // Hata durumunda varsayılan maske yerine orijinal veriyi kullan
                maskedPhoneNumber = maskPhoneNumber(user.phone_number.replace(/\s/g, ''));
            }
        }
        
        res.json({
            success: true,
            user: {
                id: user.id,
                email: user.email,
                username: user.username,
                nickname: user.nickname,
                phoneNumber: maskedPhoneNumber, // Maskelenmiş telefon numarası
                score: user.score,
                gamesPlayed: user.games_played,
                wins: user.wins
            }
        });
    } catch (error) {
        console.error('Profile check error:', error);
        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({ message: 'Geçersiz token.' });
        } else if (error.name === 'TokenExpiredError') {
            return res.status(401).json({ message: 'Token süresi dolmuş.' });
        }
        res.status(500).json({ message: 'İç sunucu hatası', error: error.message });
    }
});

// Kullanıcı rumuz güncelleme endpoint'i
app.put('/api/user/nickname', authenticateToken, async (req, res) => {
    try {
        console.log('=== RUMUZ GÜNCELLEME İSTEĞİ BAŞLADI ===');
        console.log('Rumuz güncelleme isteği alındı:', {
            userId: req.user?.userId,
            body: req.body,
            authHeader: req.headers?.authorization?.substring(0, 20) + '...'
        });
        
        const userId = req.user.userId;
        const { nickname } = req.body;
        
        console.log('Body parser sonrası:', { userId, nickname });
        console.log('req.body tipi:', typeof req.body);
        console.log('req.body içeriği:', JSON.stringify(req.body));
        
        console.log('Kullanıcı ID:', userId);
        console.log('Yeni rumuz:', nickname);

        if (!nickname || nickname.trim().length === 0) {
            return res.status(400).json({ message: 'Rumuz gerekli.' });
        }

        // Rumuz uzunluğu kontrolü
        if (nickname.length > 50) {
            return res.status(400).json({ message: 'Rumuz en fazla 50 karakter olabilir.' });
        }

        // Rumuz benzersizlik kontrolü
        const existingUser = await executeQuery(
            'SELECT id FROM users WHERE nickname = @nickname AND id != @userId',
            [
                { name: 'nickname', type: sql.NVarChar(50), value: nickname.trim() },
                { name: 'userId', type: sql.NVarChar(36), value: userId }
            ]
        );

        if (existingUser.length > 0) {
            return res.status(400).json({ message: 'Bu rumuz zaten kullanılıyor.' });
        }

        // Rumuzu güncelle
        await executeQuery(
            'UPDATE users SET nickname = @nickname WHERE id = @userId',
            [
                { name: 'nickname', type: sql.NVarChar(50), value: nickname.trim() },
                { name: 'userId', type: sql.NVarChar(36), value: userId }
            ]
        );

        res.json({ 
            success: true, 
            message: 'Rumuz başarıyla güncellendi.',
            nickname: nickname.trim()
        });

    } catch (error) {
        console.error('Rumuz güncelleme hatası:', error);
        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({ message: 'Geçersiz token.' });
        } else if (error.name === 'TokenExpiredError') {
            return res.status(401).json({ message: 'Token süresi dolmuş.' });
        }
        res.status(500).json({ message: 'İç sunucu hatası', error: error.message });
    }
});

// Avatar yükleme endpoint'i
app.post('/api/avatar', async (req, res) => {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ message: 'Yetkilendirme başlığı gerekli.' });
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    try {
        // Verify JWT token
        const decoded = jwt.verify(token, JWT_SECRET);
        const userId = decoded.userId;
        const { avatarUrl } = req.body;
        
        // Log dosyasına da yaz
        const timestamp = new Date().toISOString();
        const logMessage = `[${timestamp}] [AVATAR UPLOAD] İstek alındı - UserId: ${userId}, AvatarUrl uzunluğu: ${avatarUrl ? avatarUrl.length : 0}`;
        console.log(logMessage);
        
        // Log dosyasına yaz
        const fs = require('fs');
        const logDir = './logs';
        if (!fs.existsSync(logDir)){
            fs.mkdirSync(logDir);
        }
        fs.appendFileSync(`${logDir}/avatar-uploads.log`, logMessage + '\n');
        
        if (!avatarUrl) {
            console.log(`[AVATAR UPLOAD] Hata: Avatar URL eksik`);
            return res.status(400).json({ message: 'Avatar URL\'si gerekli.' });
        }

        // Check avatar URL size (base64 data URLs can be large)
        const base64Data = avatarUrl.split(',')[1]; // Get base64 part after data:image/jpeg;base64,
        const mimeType = avatarUrl.split(';')[0].split(':')[1]; // Get mime type like image/jpeg
        console.log(`[AVATAR UPLOAD] Base64 veri uzunluğu: ${base64Data ? base64Data.length : 0}`);
        
        if (base64Data && base64Data.length > 8 * 1024 * 1024) { // 8MB base64 limit
            console.log(`[AVATAR UPLOAD] Hata: Dosya çok büyük - ${base64Data.length} karakter`);
            return res.status(413).json({ message: 'Avatar dosyası çok büyük. Maksimum 8MB.' });
        }

        console.log(`[AVATAR UPLOAD] Avatar dosyası kaydediliyor...`);
        
        // Kullanıcının var olup olmadığını kontrol et
        const userCheck = await executeQuery(
            'SELECT id, username, nickname FROM users WHERE id = @userId',
            [{ name: 'userId', type: sql.NVarChar(36), value: userId }]
        );
        console.log(`[AVATAR UPLOAD] Kullanıcı kontrolü - Bulunan kayıt sayısı: ${userCheck.length}`);
        if (userCheck.length > 0) {
            console.log(`[AVATAR UPLOAD] Kullanıcı bulundu: ${userCheck[0].username} (${userCheck[0].nickname})`);
        } else {
            console.log(`[AVATAR UPLOAD] Kullanıcı bulunamadı: ${userId}`);
            return res.status(404).json({ message: 'Kullanıcı bulunamadı.' });
        }

        // Dosya uzantısını belirle
        const extension = mimeType.split('/')[1]; // jpeg, png, etc.
        const fileName = `${userId}_${Date.now()}.${extension}`;
        const filePath = `/avatars/${fileName}`;
        const fullPath = `/Users/cihanaybar/Projects/Ludo/backend/public${filePath}`;
        
        // Base64 veriyi buffer'a çevir ve dosyaya yaz
        const imageBuffer = Buffer.from(base64Data, 'base64');
        fs.writeFileSync(fullPath, imageBuffer);
        
        console.log(`[AVATAR UPLOAD] Dosya kaydedildi: ${fullPath} (${imageBuffer.length} bytes)`);
        
        // Veritabanında avatar URL'sini güncelle
        const avatarFileUrl = filePath;
        const success = await updateUserAvatar(userId, avatarFileUrl);
        console.log(`[AVATAR UPLOAD] Veritabanı sonucu: ${success}`);
        
        if (success) {
            console.log(`[AVATAR UPLOAD] Başarılı - avatarUrl geri döndürülüyor`);
            // Return full URL including the base URL
            const baseUrl = process.env.BASE_URL || 'http://192.168.14:3001';
            const fullAvatarUrl = `${baseUrl}${avatarFileUrl}`;
            res.json({ 
                success: true, 
                message: 'Avatar başarıyla güncellendi.',
                avatarUrl: fullAvatarUrl
            });
        } else {
            console.log(`[AVATAR UPLOAD] Başarısız - Kullanıcı bulunamadı`);
            res.status(404).json({ message: 'Kullanıcı bulunamadı.' });
        }
    } catch (error) {
        console.error('[AVATAR UPLOAD] Hata:', error);
        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({ message: 'Geçersiz token.' });
        } else if (error.name === 'TokenExpiredError') {
            return res.status(401).json({ message: 'Token süresi dolmuş.' });
        }
        res.status(500).json({ message: 'İç sunucu hatası', error: error.message });
    }
});

// Avatar getirme endpoint'i
app.get('/api/avatar/:userId', async (req, res) => {
    const { userId } = req.params;
    
    if (!userId) {
        return res.status(400).json({ message: 'Kullanıcı ID\'si gerekli.' });
    }

    try {
        const avatarUrl = await getUserAvatar(userId);
        if (avatarUrl) {
            // Return full URL including the base URL
            const baseUrl = process.env.BASE_URL || 'http://192.168.134:3001';
            const fullAvatarUrl = `${baseUrl}${avatarUrl}`;
            res.json({ success: true, avatarUrl: fullAvatarUrl });
        } else {
            res.json({ success: true, avatarUrl: null });
        }
    } catch (error) {
        console.error('Avatar getirme hatası:', error);
        res.status(500).json({ message: 'İç sunucu hatası', error: error.message });
    }
});

// Hesap silme endpoint'i
app.delete('/api/user/account', async (req, res) => {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ message: 'Yetkilendirme başlığı gerekli.' });
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    try {
        // JWT token doğrulama
        const decoded = jwt.verify(token, JWT_SECRET);
        const userId = decoded.userId;

        // Kullanıcının var olup olmadığını kontrol et
        const userCheck = await executeQuery(
            'SELECT id, nickname FROM users WHERE id = @userId',
            [{ name: 'userId', type: sql.NVarChar(36), value: userId }]
        );

        if (userCheck.length === 0) {
            return res.status(404).json({ message: 'Kullanıcı bulunamadı.' });
        }

        const userNickname = userCheck[0].nickname;
        console.log(`[HESAP SİLME] Kullanıcı hesabı siliniyor: ${userNickname} (${userId})`);

        // User service'deki deleteUserAccount fonksiyonunu çağır
        const { deleteUserAccount } = require('./services/user-service');
        const success = await deleteUserAccount(userId);

        if (success) {
            console.log(`[HESAP SİLME] Hesap başarıyla silindi: ${userNickname} (${userId})`);
            res.json({ 
                success: true, 
                message: 'Hesabınız başarıyla silindi.' 
            });
        } else {
            console.error(`[HESAP SİLME] Hesap silme başarısız: ${userNickname} (${userId})`);
            res.status(500).json({ 
                success: false, 
                message: 'Hesap silme işlemi başarısız oldu.' 
            });
        }
    } catch (error) {
        console.error('Hesap silme hatası:', error);
        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({ message: 'Geçersiz token.' });
        } else if (error.name === 'TokenExpiredError') {
            return res.status(401).json({ message: 'Token süresi dolmuş.' });
        }
        res.status(500).json({ message: 'İç sunucu hatası', error: error.message });
    }
});

// --- Server Listen ---
server.listen(PORT, '0.0.0.0', async () => {
    try {
        const dbStatus = await checkDatabaseConnection();
        if (dbStatus.connected) {
            console.log('✅ Veritabanı bağlantısı başarıyla doğrulandı.');
        } else {
            console.error('❌ Veritabanı bağlantısı başarısız:', dbStatus.error);
            console.warn('⚠️  Sunucu yine de başlatılıyor, ancak veritabanı özellikleri çalışmayabilir.');
            console.warn('💡 Lütfen veritabanı sunucusunun çalıştığından ve bağlantı ayarlarının doğru olduğundan emin olun.');
        }
    } catch (err) {
        console.error('❌ Sunucu başlatılırken veritabanı bağlantısı test edilemedi:', err);
        console.warn('⚠️  Sunucu yine de başlatılıyor, ancak veritabanı özellikleri çalışmayabilir.');
    }
    console.log(`🚀 Sunucu ${PORT} portunda çalışıyor`);
});
