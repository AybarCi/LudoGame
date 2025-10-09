import { store } from './index';

// TypeScript type definitions for the Redux store
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;