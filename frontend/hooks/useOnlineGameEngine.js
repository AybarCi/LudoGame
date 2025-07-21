import { useEffect, useReducer } from 'react';
import { useSocket } from '../store/SocketProvider';
import { useAuth } from '../store/AuthProvider';

const initialState = {
  players: [],
  gameState: null,
  isMyTurn: false,
  gamePhase: 'connecting', // connecting, waiting, pre-game, playing, finished
  message: 'Sunucuya bağlanılıyor...',
  winner: null,
  turnOrderRolls: [],
};

function gameReducer(state, action) {
    switch (action.type) {
        case 'SET_GAME_STATE': {
            const { gameState, players, user, socketId } = action.payload;

            if (!gameState || !players || !user || !socketId) {
                return { ...state, gamePhase: 'error', message: 'Sunucudan eksik veri alındı.' };
            }

            const gamePhase = gameState.gamePhase || 'waiting';
            const myPlayer = players.find(p => p.id === socketId);
            
            const pawns = [];
            if (gameState.positions) {
                Object.keys(gameState.positions).forEach(color => {
                    if (Array.isArray(gameState.positions[color])) {
                        gameState.positions[color].forEach((position, index) => {
                            pawns.push({ id: `${color}-${index}`, color, position });
                        });
                    }
                });
            }

            const newGameState = { ...gameState, pawns };
            const isMyTurn = myPlayer ? newGameState.currentPlayer === myPlayer.color : false;

            return {
                ...state, // Önceki state'i koru
                players: players,
                gameState: newGameState,
                isMyTurn: isMyTurn,
                gamePhase: gamePhase,
                message: newGameState.message || (gamePhase === 'waiting' ? 'Diğer oyuncular bekleniyor...' : ''),
                winner: newGameState.winner || null,
                turnOrderRolls: newGameState.turnOrderRolls || [],
            };
        }
        case 'SET_GAME_PHASE':
            return {
                ...state,
                gamePhase: action.payload,
            };
        default:
            return state;
    }
}

export function useOnlineGameEngine(roomId) {
  const { socket } = useSocket();
  const { user } = useAuth();
  const [state, dispatch] = useReducer(gameReducer, initialState);

  useEffect(() => {
    if (!socket || !roomId || !user) return;

    const handleRoomUpdate = (room) => {
        if (room && room.gameState && room.players) {
            dispatch({ 
                type: 'SET_GAME_STATE', 
                payload: { gameState: room.gameState, players: room.players, user, socketId: socket.id } 
            });
        }
    };

    const handleUpdateRooms = (roomsArray) => {
      const foundRoom = roomsArray.find(r => r.id === roomId);
      if (foundRoom && foundRoom.phase !== state.gamePhase) {
        console.log(`[useOnlineGameEngine] Phase changed via update_rooms: ${state.gamePhase} -> ${foundRoom.phase}`);
        dispatch({ type: 'SET_GAME_PHASE', payload: foundRoom.phase });
      }
    };

    socket.on('room_updated', handleRoomUpdate);
    socket.on('update_rooms', handleUpdateRooms);

    socket.emit('get_room_state', roomId, (room) => {
        if (room) {
            handleRoomUpdate(room);
        }
    });

    return () => {
      socket.off('room_updated', handleRoomUpdate);
      socket.off('update_rooms', handleUpdateRooms);
    };
  }, [socket, roomId, user]);





  const movePawn = (pawnId) => {
    if (state.isMyTurn) {
      socket.emit('move_pawn', { roomId, pawnId });
    }
  };

  return { state, movePawn };
}
