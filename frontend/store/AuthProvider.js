import React, { useState, useEffect, createContext, useContext } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import { DiamondService } from '../services/DiamondService';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://192.168.1.135:3001';

const AuthContext = createContext({});

export const useAuth = () => {
    return useContext(AuthContext);
};

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [session, setSession] = useState(null);
    const [loading, setLoading] = useState(true);

    // Token yenileme fonksiyonu
    const refreshAccessToken = async () => {
        try {
            const refreshToken = await AsyncStorage.getItem('refreshToken');
            if (!refreshToken) {
                throw new Error('No refresh token available');
            }

            const response = await fetch(`${API_URL}/api/refresh-token`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ refreshToken }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Token refresh failed');
            }

            const { accessToken, user: userData } = data;
            setSession(accessToken);
            setUser(userData);

            await AsyncStorage.setItem('accessToken', accessToken);
            await AsyncStorage.setItem('user', JSON.stringify(userData));

            return accessToken;
        } catch (error) {
            console.error('Token refresh error:', error);
            // Refresh token da geçersizse çıkış yap
            await signOut();
            throw error;
        }
    };

    // Token'ın geçerliliğini kontrol eden fonksiyon
    const isTokenExpired = (token) => {
        if (!token) return true;
        try {
            const payload = JSON.parse(atob(token.split('.')[1]));
            const currentTime = Date.now() / 1000;
            return payload.exp < currentTime;
        } catch (error) {
            console.error('Token parsing error:', error);
            return true;
        }
    };

    useEffect(() => {
        const loadAuthData = async () => {
            try {
                const accessToken = await AsyncStorage.getItem('accessToken');
                const refreshToken = await AsyncStorage.getItem('refreshToken');
                const storedUser = await AsyncStorage.getItem('user');

                if (accessToken && refreshToken && storedUser) {
                    // Token'ın süresini kontrol et
                    if (isTokenExpired(accessToken)) {
                        console.log('Access token expired, attempting refresh...');
                        try {
                            await refreshAccessToken();
                        } catch (error) {
                            console.error('Failed to refresh token on load:', error);
                            await signOut();
                        }
                    } else {
                        setSession(accessToken);
                        setUser(JSON.parse(storedUser));
                    }
                } else {
                    console.log('No valid auth data found');
                }
            } catch (e) {
                console.error('Failed to load auth data from storage', e);
            } finally {
                setLoading(false);
            }
        };

        loadAuthData();
    }, []);

    // Token'ı periyodik olarak kontrol eden useEffect
    useEffect(() => {
        if (!session) return;

        const checkTokenExpiry = () => {
            if (isTokenExpired(session)) {
                console.log('Token expired, refreshing...');
                refreshAccessToken().catch(error => {
                    console.error('Failed to refresh token:', error);
                });
            }
        };

        // Her 5 dakikada bir token'ı kontrol et
        const interval = setInterval(checkTokenExpiry, 5 * 60 * 1000);

        return () => clearInterval(interval);
    }, [session]);

    const signIn = async (email, password) => {
        setLoading(true);
        try {
            console.log('API_URL:', API_URL);
            console.log('Request URL:', `${API_URL}/api/login`);
            const response = await fetch(`${API_URL}/api/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password }),
            });

            console.log('Response status:', response.status);
            console.log('Response headers:', response.headers);
            const responseText = await response.text();
            console.log('Response text:', responseText);
            
            const data = JSON.parse(responseText);

            if (!response.ok) {
                throw new Error(data.message || 'Login failed');
            }

            const { accessToken, refreshToken, user: userData } = data;
            setSession(accessToken);
            setUser(userData);

            await AsyncStorage.setItem('accessToken', accessToken);
            await AsyncStorage.setItem('refreshToken', refreshToken);
            await AsyncStorage.setItem('user', JSON.stringify(userData));
            
            // Kullanıcı giriş yaptığında elmaslarını sunucudan senkronize et
            try {
                await DiamondService.syncDiamondsFromServer();
            } catch (error) {
                console.error('Error syncing diamonds after login:', error);
            }
            
            // Navigation will be handled by the layout's useEffect
            return {};
        } catch (error) {
            console.error('Sign in error:', error);
            return { error };
        } finally {
            setLoading(false);
        }
    };

    const signUp = async (email, password, nickname) => {
        setLoading(true);
        try {
            const response = await fetch(`${API_URL}/api/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password, nickname }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Registration failed');
            }
            
            return {};
        } catch (error) {
            console.error('Sign up error:', error);
            return { error };
        } finally {
            setLoading(false);
        }
    };

    const signOut = async () => {
        setLoading(true);
        try {
            const refreshToken = await AsyncStorage.getItem('refreshToken');
            
            // Backend'e logout isteği gönder
            if (refreshToken) {
                try {
                    await fetch(`${API_URL}/api/logout`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ refreshToken }),
                    });
                } catch (error) {
                    console.error('Logout API error:', error);
                }
            }
            
            await AsyncStorage.removeItem('accessToken');
            await AsyncStorage.removeItem('refreshToken');
            await AsyncStorage.removeItem('user');
            setUser(null);
            setSession(null);
            // Root Layout'un mount edilmesini beklemek için setTimeout kullan
            setTimeout(() => {
                router.replace('/login');
            }, 300);
        } catch (error) {
            console.error('Sign out error:', error);
        } finally {
            setLoading(false);
        }
    };

    const updateScore = async (newScore) => {
        // Placeholder for score update logic
    };

    // Telefon doğrulama kodu gönder
    const sendPhoneVerificationCode = async (phoneNumber) => {
        setLoading(true);
        try {
            const response = await fetch(`${API_URL}/api/send-sms-code`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ phoneNumber }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Doğrulama kodu gönderilemedi');
            }
            
            return { success: true, message: data.message };
        } catch (error) {
            console.error('Send phone verification code error:', error);
            return { error };
        } finally {
            setLoading(false);
        }
    };

    // Telefon doğrulama kodunu kontrol et
    const verifyPhoneCode = async (phoneNumber, verificationCode) => {
        setLoading(true);
        try {
            const response = await fetch(`${API_URL}/api/verify-phone`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ phoneNumber, verificationCode }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Doğrulama başarısız');
            }
            
            return { success: true, message: data.message };
        } catch (error) {
            console.error('Verify phone code error:', error);
            return { error };
        } finally {
            setLoading(false);
        }
    };

    // Telefonla kayıt ol
    const signUpWithPhone = async (phoneNumber, verificationCode, nickname) => {
        setLoading(true);
        try {
            const response = await fetch(`${API_URL}/api/register-phone`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ phoneNumber, verificationCode, nickname }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Kayıt başarısız');
            }

            const { accessToken, refreshToken, user: userData } = data;
            setSession(accessToken);
            setUser(userData);

            await AsyncStorage.setItem('accessToken', accessToken);
            await AsyncStorage.setItem('refreshToken', refreshToken);
            await AsyncStorage.setItem('user', JSON.stringify(userData));
            
            // Kullanıcı giriş yaptığında elmaslarını sunucudan senkronize et
            try {
                await DiamondService.syncDiamondsFromServer();
            } catch (error) {
                console.error('Error syncing diamonds after login:', error);
            }
            
            return { success: true };
        } catch (error) {
            console.error('Sign up with phone error:', error);
            return { error };
        } finally {
            setLoading(false);
        }
    };

    // Telefonla giriş yap
    const signInWithPhone = async (phoneNumber, verificationCode) => {
        setLoading(true);
        try {
            const response = await fetch(`${API_URL}/api/login-phone`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ phoneNumber, verificationCode }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Giriş başarısız');
            }

            const { accessToken, refreshToken, user: userData } = data;
            setSession(accessToken);
            setUser(userData);

            await AsyncStorage.setItem('accessToken', accessToken);
            await AsyncStorage.setItem('refreshToken', refreshToken);
            await AsyncStorage.setItem('user', JSON.stringify(userData));
            
            // Kullanıcı giriş yaptığında elmaslarını sunucudan senkronize et
            try {
                await DiamondService.syncDiamondsFromServer();
            } catch (error) {
                console.error('Error syncing diamonds after login:', error);
            }
            
            return { success: true };
        } catch (error) {
            console.error('Sign in with phone error:', error);
            return { error };
        } finally {
            setLoading(false);
        }
    };

    const value = {
        user,
        session,
        loading,
        signIn,
        signUp,
        signOut,
        updateScore,
        refreshAccessToken,
        sendPhoneVerificationCode,
        verifyPhoneCode,
        signUpWithPhone,
        signInWithPhone,
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
}
