import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  current: 5,
  max: 5,
  timeUntilNext: 0,
  isLoading: false,
  lastUpdated: null,
};

const energySlice = createSlice({
  name: 'energy',
  initialState,
  reducers: {
    setEnergy: (state, action) => {
      state.current = action.payload.current;
      state.max = action.payload.max;
      state.timeUntilNext = action.payload.timeUntilNext;
      state.lastUpdated = Date.now();
    },
    setEnergyLoading: (state, action) => {
      state.isLoading = action.payload;
    },
    updateEnergyTime: (state) => {
      if (state.timeUntilNext > 0) {
        state.timeUntilNext = Math.max(0, state.timeUntilNext - 1000);
      }
      state.lastUpdated = Date.now();
    },
    resetEnergy: () => initialState,
  },
});

export const { setEnergy, setEnergyLoading, updateEnergyTime, resetEnergy } = energySlice.actions;
export default energySlice.reducer;