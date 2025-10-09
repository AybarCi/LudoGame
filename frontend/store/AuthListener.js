import { useEffect } from 'react';
import { useSelector } from 'react-redux';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { DiamondService } from '../services/DiamondService';

export const AuthListener = ({ children }) => {
  const { user, token, isLoading } = useSelector((state) => state.auth);

  useEffect(() => {
    // Sadece token süresi dolmuşsa logout yap, yönlendirme yapma
    if (isLoading) {
      console.log('AuthListener: Loading, skipping auth check');
      return;
    }
    
    const handleAuthChange = async () => {
      if (user && token) {
        // Kullanıcı giriş yaptığında elmaslarını sunucudan senkronize et
        try {
          await DiamondService.syncDiamondsFromServer();
        } catch (error) {
          console.error('Error syncing diamonds after login:', error);
        }
        
        console.log('AuthListener: User authenticated, token valid');
      } else if (!user && !token) {
        // Token yoksa sadece logla, yönlendirme SplashScreen'de yapılıyor
        console.log('AuthListener: User not authenticated, no token');
      }
    };

    handleAuthChange();
  }, [user, token, isLoading]);

  return children;
};