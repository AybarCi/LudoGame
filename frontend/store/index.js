import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import modalReducer from './slices/modalSlice';
import alertReducer from './slices/alertSlice';
import apiReducer from './slices/apiSlice';
import diamondReducer from './slices/diamondSlice';
import energyReducer from './slices/energySlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    modal: modalReducer,
    alert: alertReducer,
    api: apiReducer,
    diamonds: diamondReducer,
    energy: energyReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['persist/PERSIST'],
      },
    }),
});

// Store seviyesinde auth initialization yapma - SplashScreen'de yapılacak

// TypeScript type exports removed - this is a JavaScript file
// For TypeScript support, create a separate index.d.ts file or use JSDoc comments

// JSDoc type annotations for better IDE support
/**
 * @typedef {Object} RootState
 * @property {import('./slices/authSlice').AuthState} auth
 * @property {import('./slices/modalSlice').ModalState} modal
 * @property {import('./slices/alertSlice').AlertState} alert
 * @property {import('./slices/apiSlice').ApiState} api
 */

/**
 * @typedef {import('@reduxjs/toolkit').Dispatch} AppDispatch
 */