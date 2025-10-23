import { useDispatch, useSelector } from 'react-redux';
import { useCallback, useEffect } from 'react';
import {
  // User Profile
  fetchUserProfile,
  updateUserProfile,
  
  // Diamonds
  fetchUserDiamonds,
  addDiamonds,
  spendDiamonds,
  
  // Pawns
  fetchOwnedPawns,
  selectPawn,
  fetchSelectedPawn,
  
  // Game
  createGame,
  joinGame,
  fetchGameState,
  makeMove,
  
  // Leaderboard
  fetchLeaderboard,
  
  // Shop
  fetchShopItems,
  purchaseItem,
  
  // Energy
  fetchEnergyData,
  useEnergy as useEnergyAction,
  
  // Stats
  fetchUserStats,
  
  // Daily Reward
  fetchDailyRewardStatus,
  claimDailyReward,
  
  // Actions
  clearApiError,
  updateLocalDiamonds,
  updateLocalEnergy,
} from '../store/slices/apiSlice';

export const useApi = () => {
  const dispatch = useDispatch();
  const apiState = useSelector((state) => state.api);

  // User Profile Hooks
  const loadUserProfile = useCallback(() => {
    return dispatch(fetchUserProfile());
  }, [dispatch]);

  const updateProfile = useCallback((profileData) => {
    return dispatch(updateUserProfile(profileData));
  }, [dispatch]);

  // Diamond Hooks
  const loadDiamonds = useCallback(() => {
    return dispatch(fetchUserDiamonds());
  }, [dispatch]);

  const addUserDiamonds = useCallback((amount, reason) => {
    return dispatch(addDiamonds({ amount, reason }));
  }, [dispatch]);

  const spendUserDiamonds = useCallback((amount, reason) => {
    return dispatch(spendDiamonds({ amount, reason }));
  }, [dispatch]);

  const setLocalDiamonds = useCallback((amount) => {
    dispatch(updateLocalDiamonds(amount));
  }, [dispatch]);

  // Pawn Hooks
  const loadOwnedPawns = useCallback(() => {
    return dispatch(fetchOwnedPawns());
  }, [dispatch]);

  const selectUserPawn = useCallback((pawnId) => {
    return dispatch(selectPawn(pawnId));
  }, [dispatch]);

  const loadSelectedPawn = useCallback(() => {
    return dispatch(fetchSelectedPawn());
  }, [dispatch]);

  // Game Hooks
  const createNewGame = useCallback((gameData) => {
    return dispatch(createGame(gameData));
  }, [dispatch]);

  const joinExistingGame = useCallback((gameId) => {
    return dispatch(joinGame(gameId));
  }, [dispatch]);

  const loadGameState = useCallback((gameId) => {
    return dispatch(fetchGameState(gameId));
  }, [dispatch]);

  const makeGameMove = useCallback((gameId, moveData) => {
    return dispatch(makeMove({ gameId, moveData }));
  }, [dispatch]);

  // Leaderboard Hooks
  const loadLeaderboard = useCallback((type = 'global', limit = 50) => {
    return dispatch(fetchLeaderboard({ type, limit }));
  }, [dispatch]);

  // Shop Hooks
  const loadShopItems = useCallback(() => {
    return dispatch(fetchShopItems());
  }, [dispatch]);

  const purchaseShopItem = useCallback((itemId, price) => {
    return dispatch(purchaseItem({ itemId, price }));
  }, [dispatch]);

  // Energy Hooks
  const loadEnergyData = useCallback(() => {
    return dispatch(fetchEnergyData());
  }, [dispatch]);

  const useUserEnergy = useCallback((amount, reason) => {
    return dispatch(useEnergyAction({ amount, reason }));
  }, [dispatch]);

  const setLocalEnergy = useCallback((energyData) => {
    dispatch(updateLocalEnergy(energyData));
  }, [dispatch]);

  // Stats Hooks
  const loadUserStats = useCallback(() => {
    return dispatch(fetchUserStats());
  }, [dispatch]);

  // Daily Reward Hooks
  const loadDailyRewardStatus = useCallback(() => {
    return dispatch(fetchDailyRewardStatus());
  }, [dispatch]);

  const claimUserDailyReward = useCallback(() => {
    return dispatch(claimDailyReward());
  }, [dispatch]);

  // Error Handling
  const clearError = useCallback((key) => {
    dispatch(clearApiError({ key }));
  }, [dispatch]);

  // Auto-load data hook
  const useAutoLoad = (loadFunction, dependencies = []) => {
    useEffect(() => {
      loadFunction();
    }, [loadFunction, ...dependencies]);
  };

  return {
    // State
    ...apiState,
    
    // User Profile
    loadUserProfile,
    updateProfile,
    
    // Diamonds
    loadDiamonds,
    addUserDiamonds,
    spendUserDiamonds,
    setLocalDiamonds,
    
    // Pawns
    loadOwnedPawns,
    selectUserPawn,
    loadSelectedPawn,
    
    // Game
    createNewGame,
    joinExistingGame,
    loadGameState,
    makeGameMove,
    
    // Leaderboard
    loadLeaderboard,
    
    // Shop
    loadShopItems,
    purchaseShopItem,
    
    // Energy
    loadEnergyData,
    useUserEnergy,
    setLocalEnergy,
    
    // Stats
    loadUserStats,
    
    // Daily Reward
    loadDailyRewardStatus,
    claimUserDailyReward,
    
    // Error Handling
    clearError,
    
    // Utilities
    useAutoLoad,
  };
};

// Specialized hooks for common patterns
export const useUserData = () => {
  const { loadUserProfile, userProfile, userProfileLoading, userProfileError } = useApi();
  
  useEffect(() => {
    loadUserProfile();
  }, [loadUserProfile]);
  
  return { userProfile, userProfileLoading, userProfileError };
};

export const useDiamonds = () => {
  const { loadDiamonds, diamonds, diamondsLoading, diamondsError, addUserDiamonds, spendUserDiamonds } = useApi();
  
  useEffect(() => {
    loadDiamonds();
  }, [loadDiamonds]);
  
  return { diamonds, diamondsLoading, diamondsError, addUserDiamonds, spendUserDiamonds };
};

export const usePawns = () => {
  const { loadOwnedPawns, loadSelectedPawn, ownedPawns, selectedPawn, ownedPawnsLoading, selectUserPawn } = useApi();
  
  useEffect(() => {
    loadOwnedPawns();
    loadSelectedPawn();
  }, [loadOwnedPawns, loadSelectedPawn]);
  
  return { ownedPawns, selectedPawn, ownedPawnsLoading, selectUserPawn };
};

export const useEnergyApi = () => {
  const { loadEnergyData, energy, maxEnergy, energyLoading, energyError, useUserEnergy } = useApi();
  
  useEffect(() => {
    loadEnergyData();
  }, [loadEnergyData]);
  
  return { energy, maxEnergy, energyLoading, energyError, useUserEnergy };
};

export const useDailyReward = () => {
  const { loadDailyRewardStatus, claimUserDailyReward, dailyRewardStatus, dailyRewardLoading } = useApi();
  
  useEffect(() => {
    loadDailyRewardStatus();
  }, [loadDailyRewardStatus]);
  
  return { dailyRewardStatus, dailyRewardLoading, claimUserDailyReward };
};