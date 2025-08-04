import React, { useState, useEffect, createContext, useContext } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3001';

const AuthContext = createContext({});

export const useAuth = () => {
    return useContext(AuthContext);
};

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [session, setSession] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadAuthData = async () => {
            try {
                const token = await AsyncStorage.getItem('token');
                const storedUser = await AsyncStorage.getItem('user');

                if (token && storedUser) {
                    setSession(token);
                    setUser(JSON.parse(storedUser));
                }
            } catch (e) {
                console.error('Failed to load auth data from storage', e);
            } finally {
                setLoading(false);
            }
        };

        loadAuthData();
    }, []);

    const signIn = async (email, password) => {
        setLoading(true);
        try {
            const response = await fetch(`${API_URL}/api/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Login failed');
            }

            const { token, user: userData } = data;
            setSession(token);
            setUser(userData);

            await AsyncStorage.setItem('token', token);
            await AsyncStorage.setItem('user', JSON.stringify(userData));
            
            router.replace('/(auth)/home');
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
            await AsyncStorage.removeItem('token');
            await AsyncStorage.removeItem('user');
            setUser(null);
            setSession(null);
            router.replace('/login');
        } catch (error) {
            console.error('Sign out error:', error);
        } finally {
            setLoading(false);
        }
    };

    const updateScore = async (newScore) => {
        // Placeholder for score update logic
    };

    const value = {
        user,
        session,
        loading,
        signIn,
        signUp,
        signOut,
        updateScore,
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
}
