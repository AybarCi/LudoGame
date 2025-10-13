import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from '../../constants/game';

// Helper function to get auth headers
const getAuthHeaders = async () => {
  const token = await AsyncStorage.getItem('accessToken');
  return {
    'Authorization': token ? `Bearer ${token}` : '',
    'Content-Type': 'application/json',
  };
};

// Helper function for authenticated requests with auto token refresh
const authenticatedRequest = async (url, options = {}) => {
  const headers = await getAuthHeaders();
  const requestOptions = {
    ...options,
    headers: {
      ...headers,
      ...options.headers,
    },
  };

  let response = await fetch(url, requestOptions);

  // Handle token refresh on 401/403
  if (response.status === 401 || response.status === 403) {
    try {
      const refreshToken = await AsyncStorage.getItem('refreshToken');
      if (refreshToken) {
        const refreshResponse = await fetch(`${API_BASE_URL}/api/refresh-token`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refreshToken }),
        });

        if (refreshResponse.ok) {
          const { accessToken } = await refreshResponse.json();
          await AsyncStorage.setItem('accessToken', accessToken);
          
          // Retry original request with new token
          requestOptions.headers['Authorization'] = `Bearer ${accessToken}`;
          response = await fetch(url, requestOptions);
        }
      }
    } catch (error) {
      console.error('Token refresh failed:', error);
    }
  }

  return response;
};

// User Profile Operations
export const fetchUserProfile = createAsyncThunk(
  'api/fetchUserProfile',
  async (_, { rejectWithValue }) => {
    try {
      const response = await authenticatedRequest(`${API_BASE_URL}/api/user/profile`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch user profile');
      }
      
      return await response.json();
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const updateUserProfile = createAsyncThunk(
  'api/updateUserProfile',
  async (profileData, { rejectWithValue }) => {
    try {
      const response = await authenticatedRequest(`${API_BASE_URL}/api/user/profile`, {
        method: 'PUT',
        body: JSON.stringify(profileData),
      });
      
      if (!response.ok) {
        throw new Error('Failed to update user profile');
      }
      
      return await response.json();
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

// Diamond Operations
export const fetchUserDiamonds = createAsyncThunk(
  'api/fetchUserDiamonds',
  async (_, { rejectWithValue }) => {
    try {
      const response = await authenticatedRequest(`${API_BASE_URL}/api/user/diamonds`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch user diamonds');
      }
      
      return await response.json();
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const addDiamonds = createAsyncThunk(
  'api/addDiamonds',
  async ({ amount, reason }, { rejectWithValue }) => {
    try {
      const response = await authenticatedRequest(`${API_BASE_URL}/api/user/add-diamonds`, {
        method: 'POST',
        body: JSON.stringify({ amount, reason }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to add diamonds');
      }
      
      return await response.json();
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const spendDiamonds = createAsyncThunk(
  'api/spendDiamonds',
  async ({ amount, reason }, { rejectWithValue }) => {
    try {
      const response = await authenticatedRequest(`${API_BASE_URL}/api/user/spend-diamonds`, {
        method: 'POST',
        body: JSON.stringify({ amount, reason }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to spend diamonds');
      }
      
      return await response.json();
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

// Pawn Operations
export const fetchOwnedPawns = createAsyncThunk(
  'api/fetchOwnedPawns',
  async (_, { rejectWithValue }) => {
    try {
      const response = await authenticatedRequest(`${API_BASE_URL}/api/shop/pawns`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch owned pawns');
      }
      
      return await response.json();
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const selectPawn = createAsyncThunk(
  'api/selectPawn',
  async (pawnId, { rejectWithValue }) => {
    try {
      const response = await authenticatedRequest(`${API_BASE_URL}/api/user/select-pawn`, {
        method: 'POST',
        body: JSON.stringify({ pawnId }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to select pawn');
      }
      
      return await response.json();
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const fetchSelectedPawn = createAsyncThunk(
  'api/fetchSelectedPawn',
  async (_, { rejectWithValue }) => {
    try {
      const response = await authenticatedRequest(`${API_BASE_URL}/api/user/selected-pawn`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch selected pawn');
      }
      
      return await response.json();
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

// Game Operations
export const createGame = createAsyncThunk(
  'api/createGame',
  async (gameData, { rejectWithValue }) => {
    try {
      const response = await authenticatedRequest(`${API_BASE_URL}/api/game/create`, {
        method: 'POST',
        body: JSON.stringify(gameData),
      });
      
      if (!response.ok) {
        throw new Error('Failed to create game');
      }
      
      return await response.json();
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const joinGame = createAsyncThunk(
  'api/joinGame',
  async (gameId, { rejectWithValue }) => {
    try {
      const response = await authenticatedRequest(`${API_BASE_URL}/api/game/${gameId}/join`, {
        method: 'POST',
      });
      
      if (!response.ok) {
        throw new Error('Failed to join game');
      }
      
      return await response.json();
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const fetchGameState = createAsyncThunk(
  'api/fetchGameState',
  async (gameId, { rejectWithValue }) => {
    try {
      const response = await authenticatedRequest(`${API_BASE_URL}/api/game/${gameId}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch game state');
      }
      
      return await response.json();
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const makeMove = createAsyncThunk(
  'api/makeMove',
  async ({ gameId, moveData }, { rejectWithValue }) => {
    try {
      const response = await authenticatedRequest(`${API_BASE_URL}/api/game/${gameId}/move`, {
        method: 'POST',
        body: JSON.stringify(moveData),
      });
      
      if (!response.ok) {
        throw new Error('Failed to make move');
      }
      
      return await response.json();
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

// Leaderboard Operations
export const fetchLeaderboard = createAsyncThunk(
  'api/fetchLeaderboard',
  async ({ type = 'global', limit = 50 } = {}, { rejectWithValue }) => {
    try {
      const response = await authenticatedRequest(
        `${API_BASE_URL}/api/leaderboard?type=${type}&limit=${limit}`
      );
      
      if (!response.ok) {
        throw new Error('Failed to fetch leaderboard');
      }
      
      return await response.json();
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

// Shop Operations
export const fetchShopItems = createAsyncThunk(
  'api/fetchShopItems',
  async (_, { rejectWithValue }) => {
    try {
      const response = await authenticatedRequest(`${API_BASE_URL}/api/shop/items`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch shop items');
      }
      
      return await response.json();
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const purchaseItem = createAsyncThunk(
  'api/purchaseItem',
  async ({ itemId, price }, { rejectWithValue }) => {
    try {
      const response = await authenticatedRequest(`${API_BASE_URL}/api/shop/purchase`, {
        method: 'POST',
        body: JSON.stringify({ itemId, price }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to purchase item');
      }
      
      return await response.json();
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

// Energy Operations
export const fetchEnergyData = createAsyncThunk(
  'api/fetchEnergyData',
  async (_, { rejectWithValue }) => {
    try {
      const response = await authenticatedRequest(`${API_BASE_URL}/api/user/energy`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch energy data');
      }
      
      return await response.json();
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const useEnergy = createAsyncThunk(
  'api/useEnergy',
  async ({ amount, reason }, { rejectWithValue }) => {
    try {
      const response = await authenticatedRequest(`${API_BASE_URL}/api/user/use-energy`, {
        method: 'POST',
        body: JSON.stringify({ amount, reason }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to use energy');
      }
      
      return await response.json();
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

// Statistics Operations
export const fetchUserStats = createAsyncThunk(
  'api/fetchUserStats',
  async (_, { rejectWithValue }) => {
    try {
      const response = await authenticatedRequest(`${API_BASE_URL}/api/user/stats`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch user stats');
      }
      
      return await response.json();
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

// Daily Reward Operations
export const fetchDailyRewardStatus = createAsyncThunk(
  'api/fetchDailyRewardStatus',
  async (_, { rejectWithValue }) => {
    try {
      const response = await authenticatedRequest(`${API_BASE_URL}/api/user/daily-reward`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch daily reward status');
      }
      
      return await response.json();
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const claimDailyReward = createAsyncThunk(
  'api/claimDailyReward',
  async (_, { rejectWithValue }) => {
    try {
      const response = await authenticatedRequest(`${API_BASE_URL}/api/user/claim-daily-reward`, {
        method: 'POST',
      });
      
      if (!response.ok) {
        throw new Error('Failed to claim daily reward');
      }
      
      return await response.json();
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

const apiSlice = createSlice({
  name: 'api',
  initialState: {
    // User Profile
    userProfile: null,
    userProfileLoading: false,
    userProfileError: null,
    
    // Diamonds
    diamonds: 0,
    diamondsLoading: false,
    diamondsError: null,
    
    // Pawns
    ownedPawns: [],
    ownedPawnsLoading: false,
    ownedPawnsError: null,
    selectedPawn: 'default',
    selectedPawnLoading: false,
    selectedPawnError: null,
    
    // Game
    currentGame: null,
    gameLoading: false,
    gameError: null,
    
    // Leaderboard
    leaderboard: [],
    leaderboardLoading: false,
    leaderboardError: null,
    
    // Shop
    shopItems: [],
    shopItemsLoading: false,
    shopItemsError: null,
    
    // Energy
    energy: 100,
    maxEnergy: 100,
    energyLoading: false,
    energyError: null,
    lastEnergyUpdate: null,
    
    // Stats
    userStats: null,
    userStatsLoading: false,
    userStatsError: null,
    
    // Daily Reward
    dailyRewardStatus: null,
    dailyRewardLoading: false,
    dailyRewardError: null,
  },
  reducers: {
    clearApiError: (state, action) => {
      const { key } = action.payload;
      if (state[key]) {
        state[key] = null;
      }
    },
    updateLocalDiamonds: (state, action) => {
      state.diamonds = action.payload;
    },
    updateLocalEnergy: (state, action) => {
      state.energy = action.payload.energy;
      state.maxEnergy = action.payload.maxEnergy;
      state.lastEnergyUpdate = action.payload.lastEnergyUpdate;
    },
  },
  extraReducers: (builder) => {
    // User Profile
    builder
      .addCase(fetchUserProfile.pending, (state) => {
        state.userProfileLoading = true;
        state.userProfileError = null;
      })
      .addCase(fetchUserProfile.fulfilled, (state, action) => {
        state.userProfileLoading = false;
        state.userProfile = action.payload;
      })
      .addCase(fetchUserProfile.rejected, (state, action) => {
        state.userProfileLoading = false;
        state.userProfileError = action.payload;
      });

    // Update User Profile
    builder
      .addCase(updateUserProfile.pending, (state) => {
        state.userProfileLoading = true;
        state.userProfileError = null;
      })
      .addCase(updateUserProfile.fulfilled, (state, action) => {
        state.userProfileLoading = false;
        state.userProfile = action.payload;
      })
      .addCase(updateUserProfile.rejected, (state, action) => {
        state.userProfileLoading = false;
        state.userProfileError = action.payload;
      });

    // Diamonds
    builder
      .addCase(fetchUserDiamonds.pending, (state) => {
        state.diamondsLoading = true;
        state.diamondsError = null;
      })
      .addCase(fetchUserDiamonds.fulfilled, (state, action) => {
        state.diamondsLoading = false;
        state.diamonds = action.payload.diamonds;
      })
      .addCase(fetchUserDiamonds.rejected, (state, action) => {
        state.diamondsLoading = false;
        state.diamondsError = action.payload;
      });

    // Add Diamonds
    builder
      .addCase(addDiamonds.fulfilled, (state, action) => {
        state.diamonds = action.payload.diamonds;
      });

    // Spend Diamonds
    builder
      .addCase(spendDiamonds.fulfilled, (state, action) => {
        state.diamonds = action.payload.diamonds;
      });

    // Owned Pawns
    builder
      .addCase(fetchOwnedPawns.pending, (state) => {
        state.ownedPawnsLoading = true;
        state.ownedPawnsError = null;
      })
      .addCase(fetchOwnedPawns.fulfilled, (state, action) => {
        state.ownedPawnsLoading = false;
        state.ownedPawns = ['default', ...(action.payload.ownedPawns || [])];
      })
      .addCase(fetchOwnedPawns.rejected, (state, action) => {
        state.ownedPawnsLoading = false;
        state.ownedPawnsError = action.payload;
      });

    // Select Pawn
    builder
      .addCase(selectPawn.fulfilled, (state, action) => {
        state.selectedPawn = action.payload.selectedPawn;
      });

    // Fetch Selected Pawn
    builder
      .addCase(fetchSelectedPawn.pending, (state) => {
        state.selectedPawnLoading = true;
        state.selectedPawnError = null;
      })
      .addCase(fetchSelectedPawn.fulfilled, (state, action) => {
        state.selectedPawnLoading = false;
        state.selectedPawn = action.payload.selectedPawn;
      })
      .addCase(fetchSelectedPawn.rejected, (state, action) => {
        state.selectedPawnLoading = false;
        state.selectedPawnError = action.payload;
      });

    // Game Operations
    builder
      .addCase(createGame.pending, (state) => {
        state.gameLoading = true;
        state.gameError = null;
      })
      .addCase(createGame.fulfilled, (state, action) => {
        state.gameLoading = false;
        state.currentGame = action.payload;
      })
      .addCase(createGame.rejected, (state, action) => {
        state.gameLoading = false;
        state.gameError = action.payload;
      });

    builder
      .addCase(joinGame.pending, (state) => {
        state.gameLoading = true;
        state.gameError = null;
      })
      .addCase(joinGame.fulfilled, (state, action) => {
        state.gameLoading = false;
        state.currentGame = action.payload;
      })
      .addCase(joinGame.rejected, (state, action) => {
        state.gameLoading = false;
        state.gameError = action.payload;
      });

    builder
      .addCase(fetchGameState.pending, (state) => {
        state.gameLoading = true;
        state.gameError = null;
      })
      .addCase(fetchGameState.fulfilled, (state, action) => {
        state.gameLoading = false;
        state.currentGame = action.payload;
      })
      .addCase(fetchGameState.rejected, (state, action) => {
        state.gameLoading = false;
        state.gameError = action.payload;
      });

    // Leaderboard
    builder
      .addCase(fetchLeaderboard.pending, (state) => {
        state.leaderboardLoading = true;
        state.leaderboardError = null;
      })
      .addCase(fetchLeaderboard.fulfilled, (state, action) => {
        state.leaderboardLoading = false;
        state.leaderboard = action.payload.leaderboard || [];
      })
      .addCase(fetchLeaderboard.rejected, (state, action) => {
        state.leaderboardLoading = false;
        state.leaderboardError = action.payload;
      });

    // Shop
    builder
      .addCase(fetchShopItems.pending, (state) => {
        state.shopItemsLoading = true;
        state.shopItemsError = null;
      })
      .addCase(fetchShopItems.fulfilled, (state, action) => {
        state.shopItemsLoading = false;
        state.shopItems = action.payload.items || [];
      })
      .addCase(fetchShopItems.rejected, (state, action) => {
        state.shopItemsLoading = false;
        state.shopItemsError = action.payload;
      });

    // Energy
    builder
      .addCase(fetchEnergyData.pending, (state) => {
        state.energyLoading = true;
        state.energyError = null;
      })
      .addCase(fetchEnergyData.fulfilled, (state, action) => {
        state.energyLoading = false;
        state.energy = action.payload.energy;
        state.maxEnergy = action.payload.maxEnergy;
        state.lastEnergyUpdate = action.payload.lastUpdate;
      })
      .addCase(fetchEnergyData.rejected, (state, action) => {
        state.energyLoading = false;
        state.energyError = action.payload;
      });

    // Use Energy
    builder
      .addCase(useEnergy.fulfilled, (state, action) => {
        state.energy = action.payload.energy;
        state.lastEnergyUpdate = action.payload.lastUpdate;
      });

    // User Stats
    builder
      .addCase(fetchUserStats.pending, (state) => {
        state.userStatsLoading = true;
        state.userStatsError = null;
      })
      .addCase(fetchUserStats.fulfilled, (state, action) => {
        state.userStatsLoading = false;
        state.userStats = action.payload;
      })
      .addCase(fetchUserStats.rejected, (state, action) => {
        state.userStatsLoading = false;
        state.userStatsError = action.payload;
      });

    // Daily Reward
    builder
      .addCase(fetchDailyRewardStatus.pending, (state) => {
        state.dailyRewardLoading = true;
        state.dailyRewardError = null;
      })
      .addCase(fetchDailyRewardStatus.fulfilled, (state, action) => {
        state.dailyRewardLoading = false;
        state.dailyRewardStatus = action.payload;
      })
      .addCase(fetchDailyRewardStatus.rejected, (state, action) => {
        state.dailyRewardLoading = false;
        state.dailyRewardError = action.payload;
      });

    builder
      .addCase(claimDailyReward.fulfilled, (state, action) => {
        state.dailyRewardStatus = action.payload;
        // Update diamonds if reward included diamonds
        if (action.payload.diamonds) {
          state.diamonds = action.payload.diamonds;
        }
      });
  },
});

export const {
  clearApiError,
  updateLocalDiamonds,
  updateLocalEnergy,
} = apiSlice.actions;

export default apiSlice.reducer;