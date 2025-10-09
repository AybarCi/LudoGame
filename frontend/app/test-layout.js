import React from 'react';
import { Provider, useSelector } from 'react-redux';
import { store } from '../store';
import { Text, View } from 'react-native';

// Minimal test component
const TestComponent = React.memo(() => {
  const auth = useSelector(state => state.auth);
  console.log('TestComponent render, isAuthenticated:', auth.isAuthenticated, 'timestamp:', Date.now());
  
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <Text>Auth Status: {auth.isAuthenticated ? 'Authenticated' : 'Not Authenticated'}</Text>
      <Text>Token: {auth.token ? 'Present' : 'Missing'}</Text>
      <Text>User: {auth.user ? 'Present' : 'Missing'}</Text>
    </View>
  );
});

export default function TestLayout() {
  console.log('TestLayout render');
  
  return (
    <Provider store={store}>
      <TestComponent />
    </Provider>
  );
}