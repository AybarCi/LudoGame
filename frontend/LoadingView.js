// Custom LoadingView module to fix React Native 0.76+ compatibility issues
import React from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';

const LoadingView = {
  show: () => {
    // Mock implementation for compatibility
    console.log('LoadingView.show() called');
  },
  hide: () => {
    // Mock implementation for compatibility
    console.log('LoadingView.hide() called');
  },
  Component: ({ visible, children }) => {
    if (!visible) return children;
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#0000ff" />
      </View>
    );
  }
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
});

export default LoadingView;