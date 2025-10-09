import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  isVisible: false,
  title: '',
  message: '',
  type: 'info', // 'info', 'success', 'error', 'warning'
  duration: 3000,
  autoClose: true,
};

const alertSlice = createSlice({
  name: 'alert',
  initialState,
  reducers: {
    showAlert: (state, action) => {
      const { title, message, type = 'info', duration = 3000, autoClose = true } = action.payload;
      state.isVisible = true;
      state.title = title;
      state.message = message;
      state.type = type;
      state.duration = duration;
      state.autoClose = autoClose;
    },
    hideAlert: (state) => {
      state.isVisible = false;
      state.title = '';
      state.message = '';
      state.type = 'info';
    },
    updateAlert: (state, action) => {
      return {
        ...state,
        ...action.payload,
      };
    },
  },
});

export const { showAlert, hideAlert, updateAlert } = alertSlice.actions;

export default alertSlice.reducer;