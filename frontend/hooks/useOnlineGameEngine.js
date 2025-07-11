import { useReducer, useEffect, useMemo } from 'react';
import { useSocket } from '@/store/SocketProvider';
import { useAuth } from '@/store/AuthProvider';

const initialState = {
  gamePhase: 'connecting', // connecting, waiting, playing, finished
  players: [],
  pawns: [],
  currentPlayer: null,
  diceValue: null,
  gameMessage: '',
  winner: null,
  playersInfo: {},
};

function gameReducer(state, action) {
  switch (action.type) {
    case 'SET_STATE':
      return { ...state, ...action.payload };
    case 'GAME_STARTED':
      return { ...state, gamePhase: 'playing', ...action.payload };
    case 'DICE_ROLLED':
        return { ...state, ...action.payload };
    case 'PAWN_MOVED':
        return { ...state, ...action.payload };
    default:
      return state;
  }
}

export const useOnlineGameEngine = (roomId) => {
  const { socket } = useSocket();
  const { user } = useAuth();
  const [state, dispatch] = useReducer(gameReducer, initialState);

  useEffect(() => {
    if (!socket || !roomId) return;

    const handleRoomState = (room) => {
      const gameState = room.gameState || {};
      const players = room.players || [];
      const gamePhase = room.gameState ? 'playing' : 'waiting';
      dispatch({ type: 'SET_STATE', payload: { ...gameState, players, gamePhase } });
    };

    const handleGameStarted = (gameState) => {
      dispatch({ type: 'GAME_STARTED', payload: gameState });
    };

    const handlePlayerJoined = (room) => {
        dispatch({ type: 'SET_STATE', payload: { players: room.players } });
    };

    // Initial fetch for room state when component mounts
    socket.emit('get_room_state', roomId, (response) => {
      if (response.success) {
        handleRoomState(response.room);
      } else {
        console.error('Failed to get room state:', response.message);
        // Handle error, e.g., navigate back
      }
    });

    const handleDiceRolled = (data) => {
        dispatch({ type: 'DICE_ROLLED', payload: { diceValue: data.diceValue, currentPlayer: data.currentPlayer, gameMessage: data.gameMessage } });
    };

    // Listen for subsequent updates
    socket.on('player_joined', handlePlayerJoined);
    const handlePawnMoved = (data) => {
        dispatch({ type: 'PAWN_MOVED', payload: { pawns: data.pawns, currentPlayer: data.currentPlayer, gameMessage: data.gameMessage, winner: data.winner } });
        if (data.winner) {
            // Handle game over
        }
    };

    socket.on('game_started', handleGameStarted);
    socket.on('dice_rolled', handleDiceRolled);
    socket.on('pawn_moved', handlePawnMoved);

    return () => {
      socket.off('player_joined', handlePlayerJoined);
      socket.off('game_started', handleGameStarted);
      socket.off('dice_rolled', handleDiceRolled);
      socket.off('pawn_moved', handlePawnMoved);
    };
  }, [socket, roomId]);

  const startGame = () => {
    if (!socket) return;
    socket.emit('start_game', { roomId }, (response) => {
      if (!response.success) {
        console.error('Failed to start game:', response.message);
        // Optionally alert the user
      }
    });
  };

  const isHost = useMemo(() => {
    if (!state.players || state.players.length === 0 || !user) {
      return false;
    }
    // The user object from useAuth contains the socket.id as `id`
    return state.players[0].id === user.id;
  }, [state.players, user]);

  const rollDice = () => {
    if (!socket || state.currentPlayer !== user.id) return;
    socket.emit('roll_dice', { roomId });
  };
  const movePawn = (pawnId) => {
    if (!socket || state.currentPlayer !== user.id) return;
    socket.emit('move_pawn', { roomId, pawnId });
  };

  return { state, isHost, startGame, rollDice, movePawn };
};
