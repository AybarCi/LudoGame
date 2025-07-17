import { useEffect, useReducer, useRef } from 'react';
import { useSocket } from '../store/SocketProvider';
import { useAuth } from '../store/AuthProvider';

const initialState = {
  room: null,
  gameState: null,
  players: [],
  isHost: false,
  turn: null,
  winner: null,
  diceValue: null,
  message: '',
  isRoomDeleted: false,
  gamePhase: 'waiting',
};

function gameReducer(state, action) {
  switch (action.type) {
    case 'SET_STATE':
      return { ...state, ...action.payload };
    case 'ROOM_DELETED':
      console.log('[Reducer] State is being updated to isRoomDeleted: true');
      return { ...state, isRoomDeleted: true };
    default:
      return state;
  }
}

export function useOnlineGameEngine(roomId) {
  const { socket } = useSocket();
  const { user } = useAuth();
  const [state, dispatch] = useReducer(gameReducer, initialState);

  const handlersRef = useRef(null);

  useEffect(() => {
    handlersRef.current = {
      updateState: (room) => {
        if (!room) {
          dispatch({ type: 'ROOM_DELETED' });
          return;
        }
        let gamePhase = 'waiting';
        if (room.gameState?.winner) {
          gamePhase = 'finished';
        } else if (room.gameState) {
          gamePhase = 'playing';
        }

        const newState = {
          room,
          gameState: room.gameState,
          players: room.players,
          isHost: room.hostId === user?.id,
          turn: room.gameState?.turn,
          winner: room.gameState?.winner,
          diceValue: room.gameState?.diceValue,
          message: room.gameState?.message || '',
          isRoomDeleted: false,
          gamePhase: gamePhase, // Set as a concrete value
        };
        dispatch({ type: 'SET_STATE', payload: newState });
      },
      roomDeleted: () => {
        console.log('[Hook] Client received `room_deleted` event. Dispatching action.');
        dispatch({ type: 'ROOM_DELETED' });
      },
    };
  }, [user?.id]);

  useEffect(() => {
    if (!socket || !roomId) return;

    const onUpdateState = (room) => handlersRef.current.updateState(room);
    const onRoomDeleted = () => handlersRef.current.roomDeleted();

    socket.on('player_joined', onUpdateState);
    socket.on('player_left', onUpdateState);
    socket.on('game_started', onUpdateState);
    socket.on('dice_rolled', onUpdateState);
    socket.on('pawn_moved', onUpdateState);
    socket.on('room_deleted', onRoomDeleted);

    socket.emit('get_room_state', roomId, onUpdateState);

    return () => {
      socket.off('player_joined', onUpdateState);
      socket.off('player_left', onUpdateState);
      socket.off('game_started', onUpdateState);
      socket.off('dice_rolled', onUpdateState);
      socket.off('pawn_moved', onUpdateState);
      socket.off('room_deleted', onRoomDeleted);
    };
  }, [socket, roomId]);

  const startGame = () => {
    if (state.isHost) socket.emit('start_game', { roomId });
  };

  const rollDice = () => {
    if (state.turn === user?.id) socket.emit('roll_dice', { roomId });
  };

  const movePawn = (pawnId) => {
    if (state.turn === user?.id) socket.emit('move_pawn', { roomId, pawnId });
  };



  return { state, startGame, rollDice, movePawn };
}
