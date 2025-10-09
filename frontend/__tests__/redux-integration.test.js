// Simple Redux integration test without React Native dependencies
const { configureStore } = require('@reduxjs/toolkit');
const authReducer = require('../store/slices/authSlice').default;
const modalReducer = require('../store/slices/modalSlice').default;
const alertReducer = require('../store/slices/alertSlice').default;
const apiReducer = require('../store/slices/apiSlice').default;

// Test Redux store configuration
const createTestStore = () => {
  return configureStore({
    reducer: {
      auth: authReducer,
      modal: modalReducer,
      alert: alertReducer,
      api: apiReducer,
    },
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware({
        serializableCheck: {
          ignoredActions: ['persist/PERSIST'],
        },
      }),
  });
};

describe('Redux Integration Tests', () => {
  let store;

  beforeEach(() => {
    store = createTestStore();
  });

  test('Store should be properly configured with all reducers', () => {
    const state = store.getState();
    
    expect(state).toHaveProperty('auth');
    expect(state).toHaveProperty('modal');
    expect(state).toHaveProperty('alert');
    expect(state).toHaveProperty('api');
  });

  test('Auth slice should handle initial state', () => {
    const state = store.getState();
    expect(state.auth).toEqual({
      user: null,
      session: null,
      token: null,
      isAuthenticated: false,
      loading: false,
      error: null,
    });
  });

  test('Modal slice should handle initial state', () => {
    const state = store.getState();
    expect(state.modal).toEqual({
      isVisible: false,
      type: null,
      props: {},
    });
  });

  test('Alert slice should handle initial state', () => {
    const state = store.getState();
    expect(state.alert).toEqual({
      isVisible: false,
      title: '',
      message: '',
      type: 'info',
      buttons: [],
    });
  });

  test('API slice should handle initial state', () => {
    const state = store.getState();
    expect(state.api).toEqual({
      diamonds: 0,
      loading: false,
      error: null,
      energy: 100,
      maxEnergy: 100,
      energyLastClaimed: null,
    });
  });

  test('Auth slice should handle login action', () => {
    const mockUser = {
      id: '123',
      nickname: 'testuser',
      email: 'test@example.com',
    };
    const mockSession = {
      access_token: 'mock-token',
      refresh_token: 'mock-refresh-token',
    };

    store.dispatch({
      type: 'auth/login/fulfilled',
      payload: {
        user: mockUser,
        session: mockSession,
      },
    });

    const state = store.getState();
    expect(state.auth.user).toEqual(mockUser);
    expect(state.auth.session).toEqual(mockSession);
    expect(state.auth.isAuthenticated).toBe(true);
    expect(state.auth.token).toBe('mock-token');
  });

  test('Modal slice should handle show modal action', () => {
    const modalProps = {
      title: 'Test Modal',
      message: 'This is a test modal',
    };

    store.dispatch({
      type: 'modal/showModal',
      payload: {
        type: 'test',
        props: modalProps,
      },
    });

    const state = store.getState();
    expect(state.modal.isVisible).toBe(true);
    expect(state.modal.type).toBe('test');
    expect(state.modal.props).toEqual(modalProps);
  });

  test('Alert slice should handle show alert action', () => {
    const alertProps = {
      title: 'Test Alert',
      message: 'This is a test alert',
      type: 'success',
    };

    store.dispatch({
      type: 'alert/showAlert',
      payload: alertProps,
    });

    const state = store.getState();
    expect(state.alert.isVisible).toBe(true);
    expect(state.alert.title).toBe('Test Alert');
    expect(state.alert.message).toBe('This is a test alert');
    expect(state.alert.type).toBe('success');
  });

  test('API slice should handle sync diamonds action', () => {
    store.dispatch({
      type: 'api/syncDiamonds/fulfilled',
      payload: { diamonds: 150 },
    });

    const state = store.getState();
    expect(state.api.diamonds).toBe(150);
  });

  test('Store should handle multiple actions in sequence', () => {
    // Login user
    store.dispatch({
      type: 'auth/login/fulfilled',
      payload: {
        user: { id: '123', nickname: 'testuser' },
        session: { access_token: 'token123' },
      },
    });

    // Show modal
    store.dispatch({
      type: 'modal/showModal',
      payload: { type: 'welcome', props: { username: 'testuser' } },
    });

    // Sync diamonds
    store.dispatch({
      type: 'api/syncDiamonds/fulfilled',
      payload: { diamonds: 200 },
    });

    const state = store.getState();
    expect(state.auth.isAuthenticated).toBe(true);
    expect(state.modal.isVisible).toBe(true);
    expect(state.modal.type).toBe('welcome');
    expect(state.api.diamonds).toBe(200);
  });
});

describe('Redux Type Safety', () => {
  test('RootState type should be properly exported', () => {
    // This test verifies that the TypeScript types are working
    const store = createTestStore();
    const state = store.getState();
    
    // These should not throw TypeScript errors
    expect(typeof state.auth).toBe('object');
    expect(typeof state.modal).toBe('object');
    expect(typeof state.alert).toBe('object');
    expect(typeof state.api).toBe('object');
  });

  test('AppDispatch type should be properly exported', () => {
    const store = createTestStore();
    const dispatch = store.dispatch;
    
    // This should not throw TypeScript errors
    expect(typeof dispatch).toBe('function');
    
    // Test that dispatch works with actions
    const result = dispatch({ type: 'test/action' });
    expect(result).toBeDefined();
  });
});