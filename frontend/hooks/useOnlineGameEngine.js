import { useEffect, useCallback } from 'react';
import { useSocket } from '../store/SocketProvider';
import { useAuth } from '../store/AuthProvider';

export const useOnlineGameEngine = () => {
  const { 
    socket, 
    room, 
    setRoom,
    connect,
    joinRoom,
    leaveRoom,
    disconnect,
    gameState,
    players,
    currentTurn,
    roomClosed
  } = useSocket();
  const { user } = useAuth();

  // --- NORMALIZED BOARD STATE ---
  // playersInfo: { red: {...}, green: {...}, ... }
  const playersInfo = (players && Array.isArray(players)) ? players.reduce((acc, player) => {
    acc[player.color] = {
      nickname: player.nickname || '',
      user_id: player.user_id || '',
      isBot: !!player.isBot,
      color: player.color,
    };
    return acc;
  }, {}) : {};

  // pawns: always array
  const pawns = (gameState && Array.isArray(gameState.pawns)) ? gameState.pawns : [];

  // currentPlayer: string|null
  const currentPlayer = (gameState && typeof gameState.currentPlayer === 'string') ? gameState.currentPlayer : null;

  // diceValue: number|null
  const diceValue = (gameState && typeof gameState.diceValue === 'number') ? gameState.diceValue : null;

  // myColor: string|null
  const myColor = (players && socket?.id) ? (players.find(p => p.id === socket.id)?.color || null) : null;

  // isMyTurn: boolean
  const isMyTurn = !!(gameState && myColor && gameState.currentPlayer === myColor);

  // onPawnPress: function
  const movePawn = useCallback((pawn, move) => {
    if (socket && room) {
      socket.emit('move-pawn', { roomId: room.id, pawn, move });
    }
  }, [socket, room]);

  // Sunucudan gelen genel olayları dinlemek için ana useEffect
  useEffect(() => {
    if (!socket) return;

    const handleRoomCreated = (newRoom) => {
      console.log('EVENT: room-created', newRoom);
      setRoom(newRoom); // Merkezi state'i güncelle
    };

    const handleRoomJoined = (joinedRoom) => {
      console.log('EVENT: room-joined', joinedRoom);
      setRoom(joinedRoom);
    };

    const handleRoomNotFound = () => {
      console.error('EVENT: room-not-found');
      alert('Oda bulunamadı!');
      setRoom(null);
    };

    const handleUpdateState = (newState) => {
      console.log("EVENT: update-state", newState);
      // State updates are handled through room object in SocketProvider
      // No direct setters needed since values are computed from room
    };

    const handleTurnOrder = (turnOrder) => {
      console.log("EVENT: turn-order", turnOrder);
      // Turn order is handled through room object in SocketProvider
    };

    const handlePreGameRoll = (rolls) => {
      console.log("EVENT: pre-game-roll", rolls);
      // Pre-game rolls are handled through room object in SocketProvider
    };

    const handleRoomClosed = (data) => {
      console.log(`EVENT: room-closed: ${data.message}`);
      alert(`Oda kapatıldı: ${data.message}`);
      setRoom(null); 
      // Room closed state is handled in SocketProvider
    };

    // Olay dinleyicilerini ekle
    socket.on('room-created', handleRoomCreated);
    socket.on('room-joined', handleRoomJoined);
    socket.on('room-not-found', handleRoomNotFound);
    socket.on('update-state', handleUpdateState);
    socket.on('turn-order', handleTurnOrder);
    socket.on('pre-game-roll', handlePreGameRoll);
    socket.on('room-closed', handleRoomClosed);

    // Temizleme fonksiyonu
    return () => {
      socket.off('room-created', handleRoomCreated);
      socket.off('room-joined', handleRoomJoined);
      socket.off('room-not-found', handleRoomNotFound);
      socket.off('update-state', handleUpdateState);
      socket.off('turn-order', handleTurnOrder);
      socket.off('pre-game-roll', handlePreGameRoll);
      socket.off('room-closed', handleRoomClosed);
    };
  }, [socket, setRoom]);

  // Sunucuya olay göndermek için kullanılan fonksiyonlar
  const createRoom = useCallback(() => {
    if (socket && user) {
      console.log(`[useOnlineGameEngine] Emitting create-room for user: ${user.id}`);
      socket.emit('create-room', { userId: user.id, nickname: user.nickname });
    }
  }, [socket, user]);

  // joinRoom and leaveRoom functions are imported from SocketProvider
  // No need to redefine them here

  const rollDice = useCallback(() => {
    if (socket && room) {
      console.log(`[useOnlineGameEngine] Emitting roll-dice for room: ${room.id}`);
      socket.emit('roll-dice', { roomId: room.id });
    }
  }, [socket, room]);

  // Eski fonksiyonlar + yeni normalize edilmiş board state'i döndür
  return {
    createRoom,
    joinRoom,
    leaveRoom,
    rollDice,
    movePawn,
    boardState: {
      pawns,
      playersInfo,
      currentPlayer,
      diceValue,
      myColor,
      isMyTurn,
      onPawnPress: movePawn
    }
  };
};
