import React from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Animated,
  ActivityIndicator,
} from 'react-native';
import { Text } from '@rneui/themed';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

const HomeButtons = ({ 
  fadeAnim, 
  buttonAnims, 
  handlePlayWithAI, 
  handlePlayOnline, 
  handleFreeMode,
  handleShop, 
  signOut,
  loading,
  logoutLoading,
  showShopButton = true 
}) => {
  return (
    <Animated.View
      style={[
        styles.buttonContainer,
        {
          opacity: fadeAnim
        }
      ]}
    >
      {/* Play with AI Button */}
      <Animated.View 
        style={[
          styles.gameButtonContainer,
          {
            opacity: buttonAnims[0],
            transform: [{
              translateY: buttonAnims[0].interpolate({
                inputRange: [0, 1],
                outputRange: [20, 0]
              })
            }]
          }
        ]}
      >
        <TouchableOpacity
          style={styles.gameButton}
          onPress={handlePlayWithAI}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={['#FFD700', '#FFA000']}
            style={styles.buttonGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <View style={styles.buttonContent}>
              <Ionicons name="hardware-chip" size={28} color="white" style={styles.buttonIcon} />
              <View style={styles.buttonTextContainer}>
                <Text style={styles.buttonText}>Yapay Zeka</Text>
                <Text style={styles.buttonSubtext}>Bilgisayara karşı oyna</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="rgba(255,255,255,0.7)" />
            </View>
          </LinearGradient>
        </TouchableOpacity>
      </Animated.View>

      {/* Online Play Button */}
      <Animated.View 
        style={[
          styles.gameButtonContainer,
          {
            opacity: buttonAnims[1],
            transform: [{
              translateY: buttonAnims[1].interpolate({
                inputRange: [0, 1],
                outputRange: [20, 0]
              })
            }]
          }
        ]}
      >
        <TouchableOpacity
          style={styles.gameButton}
          onPress={handlePlayOnline}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={['#00D9CC', '#00B8A6']}
            style={styles.buttonGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <View style={styles.buttonContent}>
              <Ionicons name="globe" size={28} color="white" style={styles.buttonIcon} />
              <View style={styles.buttonTextContainer}>
                <Text style={styles.buttonText}>Online Oyun</Text>
                <Text style={styles.buttonSubtext}>Gerçek oyunculara karşı</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="rgba(255,255,255,0.7)" />
            </View>
          </LinearGradient>
        </TouchableOpacity>
      </Animated.View>

      {/* Free Mode Button */}
      <Animated.View 
        style={[
          styles.gameButtonContainer,
          {
            opacity: buttonAnims[2],
            transform: [{
              translateY: buttonAnims[2].interpolate({
                inputRange: [0, 1],
                outputRange: [20, 0]
              })
            }]
          }
        ]}
      >
        <TouchableOpacity
          style={styles.gameButton}
          onPress={handleFreeMode}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={['#E61A8D', '#C71585']}
            style={styles.buttonGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <View style={styles.buttonContent}>
              <Ionicons name="people" size={28} color="white" style={styles.buttonIcon} />
              <View style={styles.buttonTextContainer}>
                <Text style={styles.buttonText}>Serbest Mod</Text>
                <Text style={styles.buttonSubtext}>Aynı cihazda çoklu oyuncu</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="rgba(255,255,255,0.7)" />
            </View>
          </LinearGradient>
        </TouchableOpacity>
      </Animated.View>

      {/* Shop Button */}
      {showShopButton && (
        <Animated.View 
          style={[
            styles.gameButtonContainer,
            {
              opacity: buttonAnims[2],
              transform: [{
                translateY: buttonAnims[2].interpolate({
                  inputRange: [0, 1],
                  outputRange: [20, 0]
                })
              }]
            }
          ]}
        >
          <TouchableOpacity
            style={styles.gameButton}
            onPress={handleShop}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={['#6E00B3', '#4A0080']}
              style={styles.buttonGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <View style={styles.buttonContent}>
                <Ionicons name="storefront" size={28} color="white" style={styles.buttonIcon} />
                <View style={styles.buttonTextContainer}>
                  <Text style={styles.buttonText}>Piyon Mağazası</Text>
                  <Text style={styles.buttonSubtext}>Özel piyonlar satın al</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="rgba(255,255,255,0.7)" />
              </View>
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>
      )}


    </Animated.View>
  );
};

const styles = StyleSheet.create({
  buttonContainer: {
    paddingHorizontal: 5,
  },
  gameButtonContainer: {
    marginVertical: 8,
  },
  gameButton: {
    borderRadius: 20,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
  },
  logoutButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  buttonGradient: {
    paddingVertical: 22,
    paddingHorizontal: 30,
    borderRadius: 20,
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  buttonIcon: {
    marginRight: 15,
  },
  buttonTextContainer: {
    flex: 1,
  },
  buttonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  buttonSubtext: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 14,
    marginTop: 2,
  },
  logoutButtonText: {
    color: 'rgba(255, 255, 255, 0.8)',
  },
  logoutButtonSubtext: {
    color: 'rgba(255, 255, 255, 0.6)',
  },
});

export default HomeButtons;