import React, { useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { View, StyleSheet, Alert, ActivityIndicator, ImageBackground } from 'react-native';
import { Button, Text } from '@rneui/themed';
import { useRouter } from 'expo-router';
import { useAuth } from '../../store/AuthProvider';


const HomeScreen = () => {
  const router = useRouter();
  const { user, signOut } = useAuth();
  const [loading, setLoading] = useState(false);

  const handlePlayWithAI = () => {
    const playerNickname = user?.nickname || 'Oyuncu 1';
    const playersInfo = {
      red: { nickname: playerNickname, type: 'human' },
      green: { nickname: 'Cansu', type: 'ai' },
      yellow: { nickname: 'Cenk Acar', type: 'ai' },
      blue: { nickname: 'Cihan', type: 'ai' },
    };

    router.push({
      pathname: '/game',
      params: {
        mode: 'ai',
        playersInfo: JSON.stringify(playersInfo),
        playerColor: 'red',
      },
    });
  };

  const handlePlayOnline = () => {
    router.push('/lobby');
  };

  if (!user) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <ImageBackground 
      source={require('../../assets/images/wood-background.png')}
      style={styles.container}
      resizeMode="cover"
    >
      <View style={styles.topContainer}>
        <Text h4 style={styles.welcomeText}>Hoş Geldin, {user?.nickname || 'Misafir'}!</Text>
        
        <View style={styles.profileInfoContainer}>
          <View style={styles.statsContainer}>
            <View style={styles.statBadge}>
              <Text style={styles.statText}>Puan: {user?.score || 0}</Text>
            </View>
            <View style={styles.statBadge}>
              <Text style={styles.statText}>Seviye: {Math.floor((user?.score || 0) / 100) + 1}</Text>
            </View>
          </View>
        </View>
      </View>

      <View style={styles.bottomContainer}>
        <Text style={styles.infoText}>Hangi modda oynamak istersin?</Text>
        <Button
          title="🤖 Yapay Zekaya Karşı Oyna"
          onPress={handlePlayWithAI}
          buttonStyle={styles.button}
          titleStyle={styles.buttonTitle}
          containerStyle={styles.buttonContainer}
        />
        <Button
          title="🌐 Online Oyna"
          onPress={handlePlayOnline}
          buttonStyle={styles.button}
          titleStyle={styles.buttonTitle}
          containerStyle={styles.buttonContainer}
        />
        <Button
          title={loading ? 'Çıkış Yapılıyor...' : 'Çıkış Yap'}
          onPress={signOut}
          buttonStyle={[styles.button, styles.secondaryButton]}
          titleStyle={styles.secondaryButtonTitle}
          containerStyle={styles.buttonContainer}
          disabled={loading}
          icon={loading && <ActivityIndicator style={{ marginRight: 10 }} />}
        />
      </View>
    </ImageBackground>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'space-between',
    paddingVertical: 60,
    paddingHorizontal: 20,
  },
  topContainer: {
    alignItems: 'center',
  },
  bottomContainer: {
    alignItems: 'center',
  },
  welcomeText: {
    fontFamily: 'Poppins_700Bold',
    marginBottom: 10,
    color: '#fff',
    fontSize: 24,
    textShadow: '-1px 1px 10px rgba(0, 0, 0, 0.75)',
  },
  infoText: {
    fontFamily: 'Poppins_600SemiBold',
    marginBottom: 30,
    fontSize: 20,
    color: '#FFFFFF',
    textAlign: 'center',
    textShadow: '1px 1px 8px rgba(0, 0, 0, 0.75)',
  },
  profileInfoContainer: {
    alignItems: 'center',
    marginVertical: 20,
  },
  statsContainer: {
    flexDirection: 'row',
  },
  statBadge: {
    backgroundColor: '#c5363e', // Same as primary buttons
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 15,
    marginHorizontal: 10,
    borderWidth: 1.5,
    borderColor: '#fff', // Same as secondary button border
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 5,
  },
  statText: {
    fontSize: 16,
    color: '#FFFFFF',
    fontFamily: 'Poppins_600SemiBold',
    textShadow: '1px 1px 3px rgba(0, 0, 0, 0.6)',
  },
  buttonContainer: {
    width: '80%',
    marginVertical: 10,
  },
  button: {
    borderRadius: 10,
    paddingVertical: 15,
    backgroundColor: '#c5363e',
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    borderColor: '#fff',
    borderWidth: 2,
  },
  buttonTitle: {
    fontFamily: 'Poppins_600SemiBold',
  },
  secondaryButtonTitle: {
    fontFamily: 'Poppins_600SemiBold',
    color: '#fff'
  }
});

export default HomeScreen;