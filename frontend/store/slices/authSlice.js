import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from '../../constants/game';



// Helper function to check if token is expired
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

// Email/Password Authentication
export const signIn = createAsyncThunk(
  'auth/signIn',
  async ({ email, password }, { rejectWithValue }) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      // Check if response is JSON
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        throw new Error('Network request failed - server returned non-JSON response');
      }

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Login failed');
      }

      const { accessToken, refreshToken, user: userData } = data;
      
      await AsyncStorage.setItem('accessToken', accessToken);
      await AsyncStorage.setItem('refreshToken', refreshToken);
      await AsyncStorage.setItem('user', JSON.stringify(userData));
      
      // Sync diamonds from server after login
      try {
        const diamondResponse = await fetch(`${API_BASE_URL}/api/user/diamonds`, {
          headers: { 'Authorization': `Bearer ${accessToken}` },
        });
        if (diamondResponse.ok) {
          const diamondData = await diamondResponse.json();
          userData.diamonds = diamondData.diamonds; // User objesine elmas bilgisini ekle
          await AsyncStorage.setItem('user', JSON.stringify(userData));
          await AsyncStorage.setItem('user_diamonds', diamondData.diamonds.toString());
        }
      } catch (error) {
        console.error('Error syncing diamonds after login:', error);
        userData.diamonds = 0; // Hata durumunda varsayılan değer
      }

      return { accessToken, refreshToken, user: userData };
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const signUp = createAsyncThunk(
  'auth/signUp',
  async ({ email, password, nickname }, { rejectWithValue }) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, nickname }),
      });

      // Check if response is JSON
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        throw new Error('Network request failed - server returned non-JSON response');
      }

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Registration failed');
      }

      return data;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

// Phone Authentication
export const sendVerificationCode = createAsyncThunk(
  'auth/sendVerificationCode',
  async (phoneNumber, { rejectWithValue, dispatch }) => {
    console.log('🚀 sendVerificationCode BAŞLADI');
    console.log('📞 Telefon numarası:', phoneNumber);
    console.log('🌐 API_BASE_URL:', API_BASE_URL);
    console.log('📡 Endpoint:', `${API_BASE_URL}/api/send-sms-code`);
    
    // Önceki hata mesajlarını temizle
    dispatch(clearError());
    
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 saniye timeout
      
      console.log('⏱️ Timeout başlatıldı: 30 saniye');
      
      const requestBody = JSON.stringify({ phoneNumber });
      console.log('📤 Request body:', requestBody);
      
      const response = await fetch(`${API_BASE_URL}/api/send-sms-code`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: requestBody,
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);
      console.log('✅ Response alındı, status:', response.status);
      console.log('📋 Response headers:', response.headers);

      // Check if response is JSON
      const contentType = response.headers.get('content-type');
      console.log('📄 Content-Type:', contentType);
      
      if (!contentType || !contentType.includes('application/json')) {
        console.log('❌ Response JSON değil, content-type:', contentType);
        throw new Error('Network request failed - server returned non-JSON response');
      }

      const data = await response.json();
      console.log('📊 Response data:', data);

      if (!response.ok) {
        console.log('❌ Response başarısız, status:', response.status);
        throw new Error(data.message || 'Doğrulama kodu gönderilemedi');
      }

      console.log('✅ SMS kodu başarıyla gönderildi');
      return { ...data, phoneNumber };
    } catch (error) {
      console.log('🚨 HATA YAKALANDI:', error);
      console.log('📝 Error message:', error.message);
      console.log('🔍 Error name:', error.name);
      console.log('📍 Error stack:', error.stack);
      
      if (error.name === 'AbortError') {
        console.log('⏰ Request timeout oldu!');
      }
      
      return rejectWithValue(error.message);
    }
  }
);

export const verifyCode = createAsyncThunk(
  'auth/verifyCode',
  async ({ phoneNumber, code }, { rejectWithValue, dispatch }) => {
    try {
      // Önceki hata mesajlarını temizle
      dispatch(clearError());
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 saniye timeout
      
      const response = await fetch(`${API_BASE_URL}/api/verify-phone`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ phoneNumber, verificationCode: code }),
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);

      // Check if response is JSON
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        throw new Error('Network request failed - server returned non-JSON response');
      }

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Doğrulama başarısız');
      }

      return data;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const signInWithPhone = createAsyncThunk(
  'auth/signInWithPhone',
  async ({ phoneNumber, code }, { rejectWithValue }) => {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 saniye timeout
      
      const response = await fetch(`${API_BASE_URL}/api/login-phone`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ phoneNumber, verificationCode: code }),
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);

      // Check if response is JSON
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        throw new Error('Network request failed - server returned non-JSON response');
      }

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Giriş başarısız');
      }

      // Store user data in AsyncStorage
      await AsyncStorage.setItem('user', JSON.stringify(data.user));
      await AsyncStorage.setItem('accessToken', data.accessToken);
      await AsyncStorage.setItem('refreshToken', data.refreshToken);
      // Session data might not be present in phone login, only store if available
      if (data.session) {
        await AsyncStorage.setItem('session', JSON.stringify(data.session));
      }

      return { user: data.user, token: data.accessToken, session: data.session || null };
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const registerWithPhone = createAsyncThunk(
  'auth/registerWithPhone',
  async ({ phoneNumber, code, nickname }, { rejectWithValue }) => {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 saniye timeout
      
      const response = await fetch(`${API_BASE_URL}/api/register-phone`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ phoneNumber, verificationCode: code, nickname }),
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);

      // Check if response is JSON
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        throw new Error('Network request failed - server returned non-JSON response');
      }

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Kayıt başarısız');
      }

      // Store user data in AsyncStorage
      await AsyncStorage.setItem('user', JSON.stringify(data.user));
      // Session data might not be present in phone registration, only store if available
      if (data.session) {
        await AsyncStorage.setItem('session', JSON.stringify(data.session));
      }
      if (data.accessToken) {
        await AsyncStorage.setItem('accessToken', data.accessToken);
      }
      if (data.refreshToken) {
        await AsyncStorage.setItem('refreshToken', data.refreshToken);
      }

      return { user: data.user, token: data.accessToken, session: data.session || null };
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const loadUserFromStorage = createAsyncThunk(
  'auth/loadUserFromStorage',
  async (_, { rejectWithValue }) => {
    try {
      const userData = await AsyncStorage.getItem('user');
      const token = await AsyncStorage.getItem('accessToken');
      const sessionData = await AsyncStorage.getItem('session');

      if (userData && token) {
        const user = JSON.parse(userData);
        const session = sessionData ? JSON.parse(sessionData) : null;
        return { user, token, session };
      }

      return null;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const logout = createAsyncThunk(
  'auth/logout',
  async (_, { rejectWithValue }) => {
    try {
      // Backend'e logout isteği gönder
      const refreshToken = await AsyncStorage.getItem('refreshToken');
      if (refreshToken) {
        try {
          await fetch(`${API_BASE_URL}/api/logout`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ refreshToken }),
          });
        } catch (error) {
          console.error('Logout API error:', error);
        }
      }
      
      await AsyncStorage.removeItem('user');
      await AsyncStorage.removeItem('accessToken');
      await AsyncStorage.removeItem('session');
      await AsyncStorage.removeItem('refreshToken');
      return null;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const refreshAccessToken = createAsyncThunk(
  'auth/refreshAccessToken',
  async (_, { rejectWithValue }) => {
    try {
      const refreshToken = await AsyncStorage.getItem('refreshToken');
      
      if (!refreshToken) {
        throw new Error('No refresh token available');
      }

      const response = await fetch(`${API_BASE_URL}/api/refresh-token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ refreshToken }),
      });

      // Check if response is JSON
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        throw new Error('Network request failed - server returned non-JSON response');
      }

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Token refresh failed');
      }

      const { accessToken, user: userData } = data;
      
      // Store the new tokens
      await AsyncStorage.setItem('accessToken', accessToken);
      await AsyncStorage.setItem('user', JSON.stringify(userData));
      
      return { accessToken, user: userData, session: accessToken };
    } catch (error) {
      // Only clear auth data on actual authentication errors, not network errors
      if (error.message && error.message.includes('Network request failed')) {
        console.error('Network error during token refresh:', error);
        // Re-throw network errors so they can be handled differently
        throw error;
      }
      
      // Clear all auth data on refresh failure (except network errors)
      await AsyncStorage.removeItem('accessToken');
      await AsyncStorage.removeItem('refreshToken');
      await AsyncStorage.removeItem('user');
      
      return rejectWithValue(error.message);
    }
  }
);

// Token management thunk - sadece token yenilemeyi dene, başarısız olursa sessizce devam et
export const checkTokenExpiry = createAsyncThunk(
  'auth/checkTokenExpiry',
  async (_, { getState, dispatch }) => {
    const { auth } = getState();
    const token = auth.token || await AsyncStorage.getItem('accessToken');
    
    // Eğer token yoksa, sessizce çık - hata fırlatma
    if (!token) {
      return;
    }
    
    if (isTokenExpired(token)) {
      try {
        await dispatch(refreshAccessToken());
      } catch (error) {
        // Token yenileme başarısız olursa sessizce devam et, logout yapma
        console.log('Token refresh failed, but continuing without logout');
        // Sadece network hatası değilse logla
        if (!error.message.includes('Network')) {
          console.error('Token refresh error:', error.message);
        }
      }
    }
  }
);

// Initialize auth from storage
export const initializeAuth = createAsyncThunk(
  'auth/initializeAuth',
  async (_, { rejectWithValue }) => {
    try {
      console.log('initializeAuth: Starting auth initialization...');
      
      const accessToken = await AsyncStorage.getItem('accessToken');
      const refreshToken = await AsyncStorage.getItem('refreshToken');
      
      console.log('initializeAuth: Storage data:', {
        hasAccessToken: !!accessToken,
        hasRefreshToken: !!refreshToken
      });

      // Access token varsa doğrula
      if (accessToken) {
        try {
          const response = await fetch(`${API_BASE_URL}/api/user/profile`, {
            headers: {
              'Authorization': `Bearer ${accessToken}`
            }
          });

          if (response.ok) {
            const userData = await response.json();
            console.log('initializeAuth: Access token valid, user:', userData.nickname);
            return {
              user: userData,
              token: accessToken,
              session: accessToken, // Session için token'ı kullan
              isAuthenticated: true
            };
          } else if (response.status === 401 && refreshToken) {
            console.log('initializeAuth: Access token expired, refreshing...');
          } else {
            console.log('initializeAuth: Profile check failed, status:', response.status);
            await AsyncStorage.multiRemove(['accessToken', 'refreshToken', 'user', 'session']);
            return { user: null, token: null, session: null, isAuthenticated: false };
          }
        } catch (error) {
          console.log('initializeAuth: Profile check error:', error.message);
        }
      }

      // Access token yoksa veya geçersizse, refresh token ile yenile
      if (refreshToken) {
        try {
          const response = await fetch(`${API_BASE_URL}/api/refresh-token`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ refreshToken })
          });

          if (response.ok) {
            const data = await response.json();
            console.log('initializeAuth: Token refreshed successfully');
            await AsyncStorage.setItem('accessToken', data.accessToken);
            return {
              user: data.user,
              token: data.accessToken,
              session: data.accessToken, // Session için token'ı kullan
              isAuthenticated: true
            };
          } else {
            console.log('initializeAuth: Token refresh failed, status:', response.status);
            await AsyncStorage.multiRemove(['accessToken', 'refreshToken', 'user', 'session']);
            return { user: null, token: null, session: null, isAuthenticated: false };
          }
        } catch (error) {
          console.log('initializeAuth: Token refresh error:', error.message);
          await AsyncStorage.multiRemove(['accessToken', 'refreshToken', 'user', 'session']);
          return { user: null, token: null, session: null, isAuthenticated: false };
        }
      }

      // Hiçbir token yoksa
      console.log('initializeAuth: No valid tokens found');
      return { user: null, token: null, session: null, isAuthenticated: false };
    } catch (error) {
      console.log('initializeAuth: General error:', error.message);
      await AsyncStorage.multiRemove(['accessToken', 'refreshToken', 'user', 'session']);
      return { user: null, token: null, session: null, isAuthenticated: false };
    }
  }
);

const initialState = {
  user: null,
  token: null,
  session: null,
  isLoading: false,
  error: null,
  isAuthenticated: false,
  verificationStep: false,
  timer: 0,
  phoneNumber: null,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setVerificationStep: (state, action) => {
      state.verificationStep = action.payload;
    },
    setTimer: (state, action) => {
      state.timer = action.payload;
    },
    setPhoneNumber: (state, action) => {
      state.phoneNumber = action.payload;
    },
    clearError: (state) => {
      state.error = null;
    },
    setUser: (state, action) => {
      state.user = action.payload.user;
      state.token = action.payload.token;
      state.session = action.payload.session;
      state.isAuthenticated = true;
      state.isLoading = false;
      state.error = null;
    },
    decrementTimer: (state) => {
      if (state.timer > 0) {
        state.timer -= 1;
      }
    },
  },
  extraReducers: (builder) => {
    builder
      // Send Verification Code
      .addCase(sendVerificationCode.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(sendVerificationCode.fulfilled, (state, action) => {
        state.isLoading = false;
        state.verificationStep = true;
        state.timer = 60;
        state.phoneNumber = action.payload.phoneNumber;
      })
      .addCase(sendVerificationCode.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      
      // Verify Code
      .addCase(verifyCode.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(verifyCode.fulfilled, (state, action) => {
        state.isLoading = false;
      })
      .addCase(verifyCode.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      
      // Sign In with Phone
      .addCase(signInWithPhone.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(signInWithPhone.fulfilled, (state, action) => {
        console.log('[authSlice] signInWithPhone.fulfilled - user payload:', action.payload.user);
        console.log('[authSlice] signInWithPhone.fulfilled - user.id:', action.payload.user?.id);
        console.log('[authSlice] signInWithPhone.fulfilled - user.nickname:', action.payload.user?.nickname);
        console.log('[authSlice] signInWithPhone.fulfilled - user.phoneNumber:', action.payload.user?.phoneNumber);
        console.log('[authSlice] signInWithPhone.fulfilled - user.email:', action.payload.user?.email);
        console.log('[authSlice] signInWithPhone.fulfilled - user.score:', action.payload.user?.score);
        
        state.isLoading = false;
        state.user = action.payload.user;
        state.token = action.payload.token;
        state.session = action.payload.token; // Use the accessToken as session for socket auth
        state.isAuthenticated = true;
        state.verificationStep = false;
        state.error = null;
      })
      .addCase(signInWithPhone.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      
      // Register with Phone
      .addCase(registerWithPhone.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(registerWithPhone.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload.user;
        state.token = action.payload.token;
        state.session = action.payload.token; // Use the accessToken as session for socket auth
        state.isAuthenticated = true;
        state.verificationStep = false;
        state.error = null;
      })
      .addCase(registerWithPhone.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      
      // Load User from Storage
      .addCase(loadUserFromStorage.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(loadUserFromStorage.fulfilled, (state, action) => {
        console.log('[authSlice] loadUserFromStorage.fulfilled - payload:', action.payload);
        if (action.payload) {
          console.log('[authSlice] loadUserFromStorage.fulfilled - user:', action.payload.user);
          console.log('[authSlice] loadUserFromStorage.fulfilled - user.id:', action.payload.user?.id);
          console.log('[authSlice] loadUserFromStorage.fulfilled - user.nickname:', action.payload.user?.nickname);
        }
        state.isLoading = false;
        if (action.payload) {
          state.user = action.payload.user;
          state.token = action.payload.token;
          state.session = action.payload.token; // Use the accessToken as session for socket auth
          state.isAuthenticated = true;
        }
      })
      .addCase(loadUserFromStorage.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      
      // Logout
      .addCase(logout.fulfilled, (state) => {
        state.user = null;
        state.token = null;
        state.session = null;
        state.isAuthenticated = false;
        state.verificationStep = false;
        state.phoneNumber = null;
        state.error = null;
      })
      
      // Refresh Access Token
      .addCase(refreshAccessToken.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(refreshAccessToken.fulfilled, (state, action) => {
        state.isLoading = false;
        state.token = action.payload.accessToken;
        state.user = action.payload.user;
        state.session = action.payload.accessToken; // Update session with new accessToken
        state.isAuthenticated = true;
        state.error = null;
      })
      .addCase(refreshAccessToken.rejected, (state, action) => {
        state.isLoading = false;
        state.user = null;
        state.token = null;
        state.session = null;
        state.isAuthenticated = false;
        state.error = action.payload;
      })
      // Check Token Expiry
      .addCase(checkTokenExpiry.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(checkTokenExpiry.fulfilled, (state) => {
        state.isLoading = false;
        state.error = null;
      })
      .addCase(checkTokenExpiry.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message;
      })
      // Initialize Auth
      .addCase(initializeAuth.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(initializeAuth.fulfilled, (state, action) => {
        if (action.payload) {
          state.user = action.payload.user;
          state.token = action.payload.token;
          state.session = action.payload.token; // Use the accessToken as session for socket auth
          state.isAuthenticated = true;
        }
        state.isLoading = false;
        state.error = null;
      })
      .addCase(initializeAuth.rejected, (state, action) => {
        state.isLoading = false;
        // Token yoksa sessizce logout et, hata gösterme
        if (action.payload === 'No tokens available') {
          state.user = null;
          state.token = null;
          state.session = null;
          state.isAuthenticated = false;
          state.error = null;
        } else {
          state.error = action.payload;
        }
      });
  },
});

export const { 
  setVerificationStep, 
  setTimer, 
  setPhoneNumber, 
  clearError, 
  setUser,
  decrementTimer 
} = authSlice.actions;

export default authSlice.reducer;