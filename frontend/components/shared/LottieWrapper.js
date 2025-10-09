import React from 'react';
import { Platform, View } from 'react-native';

// Conditional Lottie component that works on both web and native
let LottieComponent;

if (Platform.OS === 'web') {
  // For web, create a simple placeholder
  LottieComponent = ({ source, style, autoPlay, loop, ...props }) => {
    // Return a simple colored view as placeholder for web
    return (
      <View 
        style={[
          style, 
          { 
            backgroundColor: '#4A90E2', 
            borderRadius: 10,
            justifyContent: 'center',
            alignItems: 'center'
          }
        ]} 
        {...props}
      />
    );
  };
} else {
  // For native platforms, use the real Lottie
  try {
    const LottieView = require('lottie-react-native');
    LottieComponent = LottieView.default || LottieView;
  } catch (error) {
    // Fallback if Lottie fails to load
    LottieComponent = ({ source, style, ...props }) => (
      <View style={[style, { backgroundColor: '#4A90E2', borderRadius: 10 }]} {...props} />
    );
  }
}

export default LottieComponent;