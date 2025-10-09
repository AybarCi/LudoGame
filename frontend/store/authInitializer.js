import { store } from './index';
import { initializeAuth } from './slices/authSlice';

// Global initialization state
let initializationStarted = false;
let initializationPromise = null;

export const initializeAuthOnce = async () => {
  // Eğer daha önce başlatıldıysa, aynı promise'ı döndür
  if (initializationStarted) {
    return initializationPromise;
  }
  
  initializationStarted = true;
  console.log('Auth initialization started (singleton)...');
  
  const { dispatch, getState } = store;
  const state = getState();
  const { isAuthenticated, token, user } = state.auth;
  
  // Eğer zaten authenticated durumda değilsek ve token/user yoksa
  if (!isAuthenticated && !token && !user) {
    initializationPromise = dispatch(initializeAuth())
      .unwrap()
      .then(result => {
        console.log('Auth initialization completed:', result ? 'User authenticated' : 'No valid auth');
        return result;
      })
      .catch(error => {
        console.error('Auth initialization failed:', error);
        // Network hatalarında devam et, kullanıcıyı çıkarma
        if (!error.includes('Network request failed') && !error.includes('Network error')) {
          // Sadece ciddi auth hatalarında logout
          const { logout } = require('./slices/authSlice');
          dispatch(logout());
        }
        throw error;
      });
  } else {
    console.log('Auth already initialized or has existing session');
    initializationPromise = Promise.resolve(true);
  }
  
  return initializationPromise;
};

export const resetAuthInitialization = () => {
  initializationStarted = false;
  initializationPromise = null;
};

export default initializeAuthOnce;