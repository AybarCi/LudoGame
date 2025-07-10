import { useReducer, useEffect, useCallback } from 'react';
import { useSocket } from '../store/SocketProvider';
import { useAuth } from '../store/AuthProvider';

function gameReducer(state, action) {
  switch (action.type) {
    case 'SET_INITIAL_STATE':
      return { ...action.payload, isInitialized: true };
    case 'UPDATE_GAME_STATE':
      return { ...state, ...action.payload };
    default:
      return state;
  }
}

const useOnlineGameEngine = (initialState) => {
  const { user } = useAuth();
  const { socket } = useSocket();
  const [state, dispatch] = useReducer(gameReducer, { isInitialized: false });

  useEffect(() => {
    if (initialState) {
        dispatch({ type: 'SET_INITIAL_STATE', payload: initialState });
    }
  }, [initialState]);

  useEffect(() => {
    if (!socket) return;

    const handleGameStateUpdate = (newState) => {
      console.log('Received game state update from server');
      dispatch({ type: 'UPDATE_GAME_STATE', payload: newState });
    };

    socket.on('game_state_update', handleGameStateUpdate);

    return () => {
      socket.off('game_state_update', handleGameStateUpdate);
    };
  }, [socket]);

  const handleRollDice = useCallback(() => {
    if (socket && state.isInitialized && state.currentPlayerId === user.id) {
      socket.emit('roll_dice', { roomId: state.roomId, playerId: user.id });
    }
  }, [socket, state.isInitialized, state.currentPlayerId, user?.id, state.roomId]);

  const handlePawnPress = useCallback((pawnId) => {
    if (socket && state.isInitialized && state.currentPlayerId === user.id) {
      socket.emit('move_pawn', { roomId: state.roomId, playerId: user.id, pawnId });
    }
  }, [socket, state.isInitialized, state.currentPlayerId, user?.id, state.roomId]);

  return {
    state,
    handleRollDice,
    handlePawnPress,
  };
};

export default useOnlineGameEngine;
