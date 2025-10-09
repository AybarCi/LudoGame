import React, { useEffect, useCallback, useState, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { initializeAuth, checkTokenExpiry, logout, clearError } from './slices/authSlice';
import { DiamondService } from '../services/DiamondService';
import initializeAuthOnce from './authInitializer';

// ErrorModal'ı lazy load et - hooks kuralları için sabit component kullan
let ErrorModal = null;
try {
  ErrorModal = require('../components/ErrorModal').default;
} catch (error) {
  console.warn('ErrorModal yüklenemedi:', error);
}

export const ReduxAuthProvider = ({ children }) => {
  const dispatch = useDispatch();
  const user = useSelector(state => state.auth.user);
  const isAuthenticated = useSelector(state => state.auth.isAuthenticated);
  const token = useSelector(state => state.auth.token);
  const loading = useSelector(state => state.auth.isLoading);
  const error = useSelector(state => state.auth.error);
  
  const [modalVisible, setModalVisible] = useState(false);
  const [modalError, setModalError] = useState('');

  console.log('ReduxAuthProvider render, isAuthenticated:', isAuthenticated, 'token:', !!token, 'timestamp:', Date.now());

  // Check token expiry periodically - optimize to prevent unnecessary re-renders
  useEffect(() => {
    if (!isAuthenticated || !token) return;

    const checkInterval = setInterval(() => {
      dispatch(checkTokenExpiry());
    }, 300000); // Check every 5 minutes instead of every minute

    return () => clearInterval(checkInterval);
  }, []); // Empty dependency array to run only once when component mounts

  // Sync diamonds when user becomes authenticated
  useEffect(() => {
    if (isAuthenticated && user) {
      DiamondService.syncDiamondsFromServer();
    }
  }, [isAuthenticated, user]);

  // Handle auth errors
  useEffect(() => {
    if (error) {
      console.error('Auth error:', error);
      // Network hatalarını tamamen görmezden gel - hem log hem de UI'da
      if (error.includes('Network request failed') || error.includes('Network error') || error.includes('fetch')) {
        // Network hatalarını sessizce temizle
        dispatch(clearError());
        return;
      }
      
      // Hata mesajlarını kullanıcı dostu hale getir
      let userFriendlyError = error;
      
      if (error.includes('Geçersiz veya süresi dolmuş doğrulama kodu')) {
        userFriendlyError = 'Doğrulama kodu hatalı veya süresi dolmuş. Lütfen yeni bir kod isteyin.';
      } else if (error.includes('Doğrulama kodu gönderilemedi')) {
        userFriendlyError = 'SMS gönderilemedi. Lütfen telefon numaranızı kontrol edip tekrar deneyin.';
      } else if (error.includes('Doğrulama başarısız')) {
        userFriendlyError = 'Doğrulama başarısız. Lütfen kodunuzu kontrol edip tekrar deneyin.';
      } else if (error.includes('Network request failed')) {
        userFriendlyError = 'Bağlantı hatası. Lütfen internet bağlantınızı kontrol edin.';
      }
      
      // Sadece authentication hatalarını kullanıcıya bildir
      setModalError(userFriendlyError);
      setModalVisible(true);
    }
  }, [error, dispatch]);

  // Modal kapatıldığında error'u temizle
  const handleCloseModal = () => {
    setModalVisible(false);
    setModalError('');
    dispatch(clearError());
  };

  // Provide auth context value
  const authContextValue = {
    user,
    isAuthenticated,
    token,
    loading,
    error,
  };

  return (
    <>
      {children}
      {ErrorModal && (
        <ErrorModal 
          visible={modalVisible} 
          error={modalError} 
          onClose={handleCloseModal} 
        />
      )}
    </>
  );
};

export default ReduxAuthProvider;