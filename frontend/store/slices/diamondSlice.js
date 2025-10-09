import { createSlice } from '@reduxjs/toolkit';

const diamondSlice = createSlice({
  name: 'diamonds',
  initialState: {
    count: 0,
    lastUpdated: null,
  },
  reducers: {
    setDiamonds: (state, action) => {
      state.count = action.payload;
      state.lastUpdated = new Date().toISOString();
    },
    addDiamonds: (state, action) => {
      state.count += action.payload;
      state.lastUpdated = new Date().toISOString();
    },
    spendDiamonds: (state, action) => {
      state.count = Math.max(0, state.count - action.payload);
      state.lastUpdated = new Date().toISOString();
    },
  },
});

export const { setDiamonds, addDiamonds, spendDiamonds } = diamondSlice.actions;
export default diamondSlice.reducer;