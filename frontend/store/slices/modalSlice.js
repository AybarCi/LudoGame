import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  isVisible: false,
  title: '',
  message: '',
  type: 'info', // 'info', 'success', 'error', 'warning'
  onConfirm: null,
  onCancel: null,
  confirmText: 'Tamam',
  cancelText: 'İptal',
  showCancel: false,
};

const modalSlice = createSlice({
  name: 'modal',
  initialState,
  reducers: {
    showModal: (state, action) => {
      state.isVisible = true;
      state.title = action.payload.title || '';
      state.message = action.payload.message || '';
      state.type = action.payload.type || 'info';
      state.confirmText = action.payload.confirmText || 'Tamam';
      state.cancelText = action.payload.cancelText || 'İptal';
      state.showCancel = action.payload.showCancel || false;
      state.onConfirm = action.payload.onConfirm || null;
      state.onCancel = action.payload.onCancel || null;
    },
    hideModal: (state) => {
      state.isVisible = false;
      state.title = '';
      state.message = '';
      state.type = 'info';
      state.onConfirm = null;
      state.onCancel = null;
      state.confirmText = 'Tamam';
      state.cancelText = 'İptal';
      state.showCancel = false;
    },
    updateModal: (state, action) => {
      return {
        ...state,
        ...action.payload,
      };
    },
  },
});

export const { showModal, hideModal, updateModal } = modalSlice.actions;

export default modalSlice.reducer;