const express = require('express');
const dbConfig = require('./db-config');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');
const { findOrCreateUser } = require('./services/user-service');
const { executeQuery, sql } = require('./db');

// --- Game Constants ---
const PAWN_COUNT = 4;
const PATH_LENGTH = 56;
const HOME_STRETCH_LENGTH = 6;
const GOAL_START_INDEX = PATH_LENGTH + HOME_STRETCH_LENGTH; // 58
const MAX_POSITION_INDEX = GOAL_START_INDEX + PAWN_COUNT - 1; // 61
const START_OFFSET = { red: 41, green: 55, yellow: 13, blue: 27 };
const SAFE_SPOTS_GLOBAL = [0, 8, 21, 34, 39, 47];
const HOME_POSITIONS = { red: [-1, -1, -1, -1], green: [-1, -1, -1, -1], yellow: [-1, -1, -1, -1], blue: [-1, -1, -1, -1] };
const AI_PLAYER_NAMES = ["Aslı", "Can", "Efe", "Gizem", "Cenk", "Cihan", "Acar", "Buse", "Burcu", "İlayda"];
const ROOM_TIMEOUT = 20000; // 20 seconds

// --- Server Setup ---
const app = express();
app.use(cors());
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*", methods: ["GET", "POST"] } });
app.use(express.json()); // Body parser middleware
const PORT = 3001;

// --- In-Memory State ---
let rooms = {};
let roomTimeouts = {}; // Track timeouts for each room

// --- Helper Functions ---
const isGameWon = (playerPositions) => {
    // A player wins when all 4 pawns are in their home stretch (positions 56-59)
    // Position 59 is the final goal position for all colors
    return playerPositions.every(pos => pos === 59);
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

const updateRoom = (roomId) => {
    const room = rooms[roomId];
    if (room) {
        // Convert turnRolls to turnOrderRolls format for frontend compatibility
        const turnOrderRolls = room.gameState.turnRolls ? 
            Object.entries(room.gameState.turnRolls).map(([color, rollData]) => ({
                color,
                roll: rollData.diceValue
            })) : [];

        const roomStateForClient = {
            id: room.id,
            roomCode: room.roomCode,
            players: room.players,
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
    const hostUser = await findOrCreateUser(userId, nickname);
    const gameId = uuidv4();
    const roomCode = gameId.substring(0, 6).toUpperCase();

    await executeQuery(
        'INSERT INTO games (id, room_code, status, host_id) VALUES (@id, @room_code, @status, @host_id)',
        [
            { name: 'id', type: sql.NVarChar(36), value: gameId },
            { name: 'room_code', type: sql.NVarChar(6), value: roomCode },
            { name: 'status', type: sql.NVarChar(20), value: 'waiting' },
            { name: 'host_id', type: sql.NVarChar(36), value: hostUser.id },
        ]
    );

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
    console.log(`[Create Room] Room created in DB & Memory: ${gameId}`);
    
    // Start the 20-second timeout for adding bots
    startRoomTimeout(gameId);
    
    broadcastRoomList();
    return room;
};

const joinRoomAsync = async (roomId, userId, nickname, socketId) => {
    const room = rooms[roomId];
    if (!room) throw new Error('Oda bulunamadı.');
    if (room.players.length >= 4) throw new Error('Oda dolu.');

    const user = await findOrCreateUser(userId, nickname);
    const existingPlayer = room.players.find(p => p.id === user.id);
    if (existingPlayer) {
        existingPlayer.socketId = socketId;
        console.log(`[Join Room] ${nickname} reconnected to room ${roomId}.`);
        return { room, player: existingPlayer };
    }

    const availableColors = ['red', 'green', 'blue', 'yellow'].filter(c => !room.players.some(p => p.color === c));
    if (availableColors.length === 0) throw new Error('Uygun renk bulunamadı.');
    const color = availableColors[0];

    const dbPlayerId = uuidv4();
    const playerOrder = room.players.length + 1; // Assign player order based on join sequence
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

    const player = { id: user.id, dbPlayerId, socketId, nickname, color, isBot: false };
    room.players.push(player);
    console.log(`[Join Room] ${nickname} (${user.id}) joined room ${roomId} as ${color}`);
    
    // If room is full with real players, start the game immediately
    if (room.players.length === 4 && room.gameState.phase === 'waiting') {
        console.log(`[Join Room] Room ${roomId} is full, starting game immediately`);
        // Clear the timeout since room is full
        if (roomTimeouts[roomId]) {
            clearTimeout(roomTimeouts[roomId]);
            delete roomTimeouts[roomId];
            console.log(`[Join Room] Cleared timeout for full room ${roomId}`);
        }
        room.gameState.message = 'Oda dolu! Oyun başlıyor...';
        updateRoom(roomId);
        setTimeout(() => {
            startPreGame(roomId);
        }, 1000); // Small delay to show the message
    }
    
    return { room, player };
};

const leaveRoomAsync = async (socketId) => {
    for (const roomId in rooms) {
        const room = rooms[roomId];
        const playerIndex = room.players.findIndex(p => p.socketId === socketId);
        if (playerIndex > -1) {
            const player = room.players[playerIndex];
            console.log(`[Leave Room] ${player.nickname} is leaving room ${roomId}`);
            await executeQuery('DELETE FROM game_players WHERE id = @dbPlayerId', [{ name: 'dbPlayerId', type: sql.NVarChar(36), value: player.dbPlayerId }]);
            room.players.splice(playerIndex, 1);
            if (room.players.length === 0 || room.players.every(p => p.isBot)) {
                await deleteRoom(roomId, 'Tüm insan oyuncular ayrıldı.');
            } else {
                if (room.hostId === player.id && room.players.length > 0) {
                    room.hostId = room.players.find(p => !p.isBot)?.id || room.players[0].id;
                    console.log(`[Leave Room] New host for room ${roomId} is ${room.hostId}`);
                }
                updateRoom(roomId);
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
        
        // Rule 3: In home stretch (56-59), pawns cannot jump over each other
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
    }
    
    return capturedAPawn;
};

const updateTurn = (room) => {
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
    updateRoom(room.id);
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
    updateRoom(roomId);

    await new Promise(resolve => setTimeout(resolve, 1000));
    const validMoves = getValidMoves(currentPlayer, diceValue, room);
    room.gameState.validMoves = validMoves;

    if (validMoves.length > 0) {
        const chosenMove = chooseBestMove(validMoves, room, currentPlayer);
        const capturedPawn = handlePawnMove(room, currentPlayer, chosenMove);
        const pawnFinished = chosenMove.to === 59;
        updateRoom(roomId);

        if (diceValue === 6 || capturedPawn || pawnFinished) {
            playBotTurnIfNeeded(roomId); // Play again
        } else {
            updateTurn(room);
        }
    } else {
        updateTurn(room);
    }
};

const determineTurnOrder = (roomId) => {
    const room = rooms[roomId];
    if (!room) return;

    console.log(`[DEBUG] determineTurnOrder called for room ${roomId}`);
    console.log(`[DEBUG] Players:`, room.players.map(p => p.color));
    console.log(`[DEBUG] Turn rolls:`, room.gameState.turnRolls);
    console.log(`[DEBUG] All players rolled?`, room.players.every(p => room.gameState.turnRolls[p.color]));

    if (room.players.every(p => room.gameState.turnRolls[p.color])) {
        const sortedRolls = Object.entries(room.gameState.turnRolls).sort(([, a], [, b]) => b.diceValue - a.diceValue);
        const turnOrder = sortedRolls.map(([color]) => color);

        room.gameState.turnOrder = turnOrder;
        room.gameState.currentPlayer = turnOrder[0];
        room.gameState.phase = 'playing';
        const startingPlayer = room.players.find(p => p.color === turnOrder[0]);
        room.gameState.message = `${startingPlayer.nickname} oyuna başlıyor!`;
        console.log(`[Game Started] Turn order: ${turnOrder.join(' -> ')}, Starting player: ${startingPlayer.nickname}`);
        io.to(roomId).emit('game_started', room.gameState);
        updateRoom(roomId);
        playBotTurnIfNeeded(roomId);
    }
};

const addAIPlayersToRoom = async (roomId) => {
    const room = rooms[roomId];
    if (!room || room.gameState.phase !== 'waiting') return;
    
    const neededPlayers = 4 - room.players.length;
    if (neededPlayers <= 0) return;
    
    console.log(`[AI System] Adding ${neededPlayers} AI players to room ${roomId}`);
    
    const availableColors = ['red', 'green', 'blue', 'yellow'].filter(c => !room.players.some(p => p.color === c));
    const usedAINames = room.players.filter(p => p.isBot).map(p => p.nickname);
    const availableAINames = AI_PLAYER_NAMES.filter(name => !usedAINames.includes(name));
    
    for (let i = 0; i < neededPlayers && i < availableColors.length; i++) {
        const color = availableColors[i];
        const aiName = availableAINames[i % availableAINames.length];
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
        } catch (error) {
            console.error(`[AI System] Error adding AI player to room ${roomId}:`, error);
        }
    }
    
    updateRoom(roomId);
    
    // Start the game if we have enough players
    if (room.players.length >= 2) {
        console.log(`[AI System] Starting game in room ${roomId} with ${room.players.length} players`);
        startPreGame(roomId);
    }
};

const startRoomTimeout = (roomId) => {
    console.log(`[Room Timeout] Starting 20-second timeout for room ${roomId}`);
    
    // Clear any existing timeout for this room
    if (roomTimeouts[roomId]) {
        clearTimeout(roomTimeouts[roomId]);
        console.log(`[Room Timeout] Cleared existing timeout for room ${roomId}`);
    }
    
    roomTimeouts[roomId] = setTimeout(async () => {
        const room = rooms[roomId];
        if (!room || room.gameState.phase !== 'waiting') {
            console.log(`[Room Timeout] Room ${roomId} no longer in waiting phase, timeout cancelled`);
            delete roomTimeouts[roomId];
            return;
        }
        
        const humanPlayers = room.players.filter(p => !p.isBot).length;
        if (humanPlayers === 0) {
            console.log(`[Room Timeout] No human players left in room ${roomId}, deleting room`);
            delete roomTimeouts[roomId];
            await deleteRoom(roomId, 'Timeout - no human players');
            return;
        }
        
        console.log(`[Room Timeout] Timeout reached for room ${roomId}, adding AI players and starting game`);
        room.gameState.message = 'Bekleme süresi doldu, oyun başlıyor...';
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
    if (!email || !password) {
        return res.status(400).json({ message: 'Email and password are required.' });
    }

    try {
        const userResult = await executeQuery('SELECT * FROM users WHERE email = @email', [{ name: 'email', type: sql.NVarChar(255), value: email }]);
        if (userResult.length === 0) {
            return res.status(401).json({ message: 'Invalid credentials.' });
        }

        const user = userResult[0];
        const isPasswordValid = await bcrypt.compare(password, user.password_hash);

        if (!isPasswordValid) {
            return res.status(401).json({ message: 'Invalid credentials.' });
        }

        const token = jwt.sign({ userId: user.id, nickname: user.nickname }, JWT_SECRET, { expiresIn: '1h' });

        res.json({ 
            token, 
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

// Middleware to verify JWT
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (token == null) return res.sendStatus(401); // if there isn't any token

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) return res.sendStatus(403);
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


// --- Socket.IO Handlers ---
io.on('connection', (socket) => {
    const userId = socket.handshake.auth.userId || `guest_${socket.id}`;
    console.log(`User connected: ${socket.id} with UserID: ${userId}`);

    socket.on('get_rooms', (callback) => {
        const roomList = Object.values(rooms);
        if (typeof callback === 'function') {
            callback(roomList);
        }
        broadcastRoomList();
    });

    socket.on('create_room', async ({ nickname }, callback) => {
        try {
            const room = await createRoomAsync(userId, nickname);
            const { player } = await joinRoomAsync(room.id, userId, nickname, socket.id);
            socket.join(room.id);
            updateRoom(room.id);
            if (callback) callback({ success: true, room, player });
        } catch (error) {
            console.error('Create room error:', error);
            if (callback) callback({ success: false, message: error.message });
        }
    });

    socket.on('join_room', async ({ roomId, nickname }, callback) => {
        try {
            const { room, player } = await joinRoomAsync(roomId, userId, nickname, socket.id);
            socket.join(roomId);
            updateRoom(roomId);
            if (callback) callback({ success: true, room, player });
        } catch (error) {
            console.error('Join room error:', error);
            if (callback) callback({ success: false, message: error.message });
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
        const room = rooms[roomId];
        if (!room) {
            console.log(`[Roll Dice Turn Order] Room ${roomId} not found`);
            return;
        }
        const player = room.players.find(p => p.socketId === socket.id);
        if (!player) {
            console.log(`[Roll Dice Turn Order] Player ${socket.id} not found in room ${roomId}`);
            return;
        }

        if (room.gameState.phase !== 'pre-game') {
            console.log(`[Roll Dice Turn Order] Game is not in pre-game phase. Current phase: ${room.gameState.phase}`);
            return;
        }

        if (room.gameState.turnRolls[player.color]) {
            console.log(`[Roll Dice Turn Order] ${player.nickname} already rolled in pre-game`);
            return;
        }

        const diceValue = Math.floor(Math.random() * 6) + 1;
        room.gameState.turnRolls[player.color] = { nickname: player.nickname, diceValue };
        console.log(`[Pre-Game] ${player.nickname} rolled: ${diceValue}`);
        updateRoom(roomId);
        determineTurnOrder(roomId);
    });

    socket.on('roll_dice', ({ roomId }) => {
        console.log(`[Roll Dice] Player ${socket.id} rolling dice in room ${roomId}`);
        const room = rooms[roomId];
        if (!room) {
            console.log(`[Roll Dice] Room ${roomId} not found`);
            return;
        }
        const player = room.players.find(p => p.socketId === socket.id);
        if (!player) {
            console.log(`[Roll Dice] Player ${socket.id} not found in room ${roomId}`);
            return;
        }

        if (room.gameState.phase !== 'playing') {
            console.log(`[Roll Dice] Game is not in playing phase. Current phase: ${room.gameState.phase}`);
            return;
        }

        if (player.color !== room.gameState.currentPlayer) {
            console.log(`[Roll Dice] Not ${player.nickname}'s turn. Current: ${room.gameState.currentPlayer}`);
            return;
        }
        if (room.gameState.diceValue !== null) {
            console.log(`[Roll Dice] ${player.nickname} already rolled this turn`);
            return;
        }
        const diceValue = Math.floor(Math.random() * 6) + 1;
        room.gameState.diceValue = diceValue;
        room.gameState.message = `${player.nickname} ${diceValue} attı.`;
        console.log(`[Game] ${player.nickname} rolled: ${diceValue}`);
        const validMoves = getValidMoves(player, diceValue, room);
        room.gameState.validMoves = validMoves;
        updateRoom(roomId);
        if (validMoves.length === 0) {
            console.log(`[Game] ${player.nickname} has no valid moves`);
            setTimeout(() => updateTurn(room), 1000);
        }
    });

    socket.on('move_pawn', ({ roomId, move }) => {
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
        const pawnFinished = move.to === 59; // Goal position is 59
        const rolledSix = room.gameState.diceValue === 6;

        console.log(`[MOVE_PAWN] Move results - Captured: ${capturedPawn}, Finished: ${pawnFinished}, Rolled Six: ${rolledSix}`);

        room.gameState.validMoves = [];
        room.gameState.diceValue = null;
        updateRoom(roomId);

        if (rolledSix || capturedPawn || pawnFinished) {
            console.log(`[MOVE_PAWN] ${player.nickname} gets another turn`);
            // Player gets another turn, do nothing, wait for next roll
        } else {
            console.log(`[MOVE_PAWN] ${player.nickname} turn ends, switching to next player`);
            updateTurn(room);
        }
    });

    socket.on('leave_room', async () => { await leaveRoomAsync(socket.id); });
    socket.on('disconnect', async () => {
        console.log(`User disconnected: ${socket.id}`);
        await leaveRoomAsync(socket.id);
    });
});

// --- Server Listen ---
server.listen(PORT, async () => {
    try {
        await executeQuery('SELECT 1');
        console.log('Veritabanı bağlantısı başarıyla doğrulandı.');
    } catch (err) {
        console.error('Sunucu başlatılırken veritabanına bağlanılamadı:', err);
        process.exit(1);
    }
    console.log(`Sunucu ${PORT} portunda çalışıyor`);
});
