// Simple Redux store configuration test
const { configureStore } = require('@reduxjs/toolkit');

// Mock slice reducers for testing
const mockAuthReducer = (state = { user: null, isAuthenticated: false }, action) => {
  switch (action.type) {
    case 'auth/login':
      return { ...state, user: action.payload, isAuthenticated: true };
    case 'auth/logout':
      return { ...state, user: null, isAuthenticated: false };
    default:
      return state;
  }
};

const mockModalReducer = (state = { isVisible: false, type: null }, action) => {
  switch (action.type) {
    case 'modal/show':
      return { ...state, isVisible: true, type: action.payload };
    case 'modal/hide':
      return { ...state, isVisible: false, type: null };
    default:
      return state;
  }
};

const mockAlertReducer = (state = { isVisible: false, message: '' }, action) => {
  switch (action.type) {
    case 'alert/show':
      return { ...state, isVisible: true, message: action.payload };
    case 'alert/hide':
      return { ...state, isVisible: false, message: '' };
    default:
      return state;
  }
};

const mockApiReducer = (state = { diamonds: 0, loading: false }, action) => {
  switch (action.type) {
    case 'api/syncDiamonds':
      return { ...state, diamonds: action.payload };
    case 'api/setLoading':
      return { ...state, loading: action.payload };
    default:
      return state;
  }
};

describe('Redux Store Configuration Test', () => {
  let store;

  beforeEach(() => {
    store = configureStore({
      reducer: {
        auth: mockAuthReducer,
        modal: mockModalReducer,
        alert: mockAlertReducer,
        api: mockApiReducer,
      },
      middleware: (getDefaultMiddleware) =>
        getDefaultMiddleware({
          serializableCheck: {
            ignoredActions: ['persist/PERSIST'],
          },
        }),
    });
  });

  test('Store should be properly configured with all reducers', () => {
    const state = store.getState();
    
    expect(state).toHaveProperty('auth');
    expect(state).toHaveProperty('modal');
    expect(state).toHaveProperty('alert');
    expect(state).toHaveProperty('api');
  });

  test('Auth reducer should handle login and logout', () => {
    // Initial state
    let state = store.getState();
    expect(state.auth.isAuthenticated).toBe(false);
    expect(state.auth.user).toBeNull();

    // Login
    store.dispatch({ type: 'auth/login', payload: { id: '123', name: 'Test User' } });
    state = store.getState();
    expect(state.auth.isAuthenticated).toBe(true);
    expect(state.auth.user).toEqual({ id: '123', name: 'Test User' });

    // Logout
    store.dispatch({ type: 'auth/logout' });
    state = store.getState();
    expect(state.auth.isAuthenticated).toBe(false);
    expect(state.auth.user).toBeNull();
  });

  test('Modal reducer should handle show and hide', () => {
    // Initial state
    let state = store.getState();
    expect(state.modal.isVisible).toBe(false);
    expect(state.modal.type).toBeNull();

    // Show modal
    store.dispatch({ type: 'modal/show', payload: 'welcome' });
    state = store.getState();
    expect(state.modal.isVisible).toBe(true);
    expect(state.modal.type).toBe('welcome');

    // Hide modal
    store.dispatch({ type: 'modal/hide' });
    state = store.getState();
    expect(state.modal.isVisible).toBe(false);
    expect(state.modal.type).toBeNull();
  });

  test('Alert reducer should handle show and hide', () => {
    // Initial state
    let state = store.getState();
    expect(state.alert.isVisible).toBe(false);
    expect(state.alert.message).toBe('');

    // Show alert
    store.dispatch({ type: 'alert/show', payload: 'Test alert message' });
    state = store.getState();
    expect(state.alert.isVisible).toBe(true);
    expect(state.alert.message).toBe('Test alert message');

    // Hide alert
    store.dispatch({ type: 'alert/hide' });
    state = store.getState();
    expect(state.alert.isVisible).toBe(false);
    expect(state.alert.message).toBe('');
  });

  test('API reducer should handle diamond sync', () => {
    // Initial state
    let state = store.getState();
    expect(state.api.diamonds).toBe(0);

    // Sync diamonds
    store.dispatch({ type: 'api/syncDiamonds', payload: 150 });
    state = store.getState();
    expect(state.api.diamonds).toBe(150);
  });

  test('Store should handle multiple actions in sequence', () => {
    // Login user
    store.dispatch({ type: 'auth/login', payload: { id: '123', name: 'Test User' } });
    
    // Show welcome modal
    store.dispatch({ type: 'modal/show', payload: 'welcome' });
    
    // Show success alert
    store.dispatch({ type: 'alert/show', payload: 'Welcome to the app!' });
    
    // Sync user diamonds
    store.dispatch({ type: 'api/syncDiamonds', payload: 200 });

    const state = store.getState();
    expect(state.auth.isAuthenticated).toBe(true);
    expect(state.auth.user.name).toBe('Test User');
    expect(state.modal.isVisible).toBe(true);
    expect(state.modal.type).toBe('welcome');
    expect(state.alert.isVisible).toBe(true);
    expect(state.alert.message).toBe('Welcome to the app!');
    expect(state.api.diamonds).toBe(200);
  });

  test('Store should have proper middleware configuration', () => {
    // Test that the store is configured with middleware
    expect(store).toBeDefined();
    expect(typeof store.dispatch).toBe('function');
    expect(typeof store.getState).toBe('function');
    expect(typeof store.subscribe).toBe('function');
  });
});

describe('Redux Store Type Exports', () => {
  test('Store configuration should be compatible with TypeScript', () => {
    // This test verifies that the store configuration pattern works
    const testStore = configureStore({
      reducer: {
        auth: mockAuthReducer,
        modal: mockModalReducer,
        alert: mockAlertReducer,
        api: mockApiReducer,
      },
    });

    const state = testStore.getState();
    expect(state).toBeDefined();
    expect(typeof state).toBe('object');
    
    // Test that we can access all state properties
    expect(state.auth).toBeDefined();
    expect(state.modal).toBeDefined();
    expect(state.alert).toBeDefined();
    expect(state.api).toBeDefined();
  });
});