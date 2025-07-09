import React, { useEffect, useState } from 'react';
import { View, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { Button, Text } from '@rneui/themed';
import { useRouter } from 'expo-router';
import { useAuth } from '../../store/AuthProvider';
import { supabase } from '../../services/supabase';

const HomeScreen = () => {
  const router = useRouter();
  const { user, signOut, loading } = useAuth();
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    const fetchProfile = async () => {
      if (user) {
        const { data, error } = await supabase
          .from('profiles')
          .select('score, level')
          .eq('id', user.id)
          .single();
        
        if (error) {
          console.error('Error fetching profile:', error.message);
        } else {
          setProfile(data);
        }
      }
    };

    fetchProfile();
  }, [user]);

  useEffect(() => {
    // If loading is finished and there's no user, redirect to login
    if (!loading && !user) {
      router.replace('/');
    }
  }, [user, loading, router]);

  const handlePlayWithAI = () => {
    const playerNickname = user?.user_metadata?.username || 'Oyuncu 1';
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
    router.push({ pathname: '/game', params: { mode: 'online' } });
  };

  if (loading || !user) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text h4 style={styles.welcomeText}>Hoş Geldin, {user?.user_metadata?.username || user?.email}!</Text>
      
      {profile && (
        <View style={styles.profileInfoContainer}>
          <Text style={styles.profileText}>Seviye: {profile.level}</Text>
          <Text style={styles.profileText}>Puan: {profile.score}</Text>
        </View>
      )}

      <Text style={styles.infoText}>Hangi modda oynamak istersin?</Text>
      <Button
        title="🤖 Yapay Zekaya Karşı Oyna"
        onPress={handlePlayWithAI}
        buttonStyle={styles.button}
        containerStyle={styles.buttonContainer}
      />
      <Button
        title="🌐 Online Oyna"
        onPress={handlePlayOnline}
        buttonStyle={styles.button}
        containerStyle={styles.buttonContainer}
      />
      <Button
        title={loading ? 'Çıkış Yapılıyor...' : 'Çıkış Yap'}
        onPress={signOut}
        buttonStyle={styles.button}
        containerStyle={styles.buttonContainer}
        type="outline"
        disabled={loading}
        icon={loading && <ActivityIndicator style={{ marginRight: 10 }} />}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    padding: 20,
  },
  welcomeText: {
    marginBottom: 10,
  },
  infoText: {
    marginBottom: 30,
    fontSize: 16,
    color: 'gray',
  },
  profileInfoContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    backgroundColor: '#e7e7e7',
    borderRadius: 10,
    padding: 15,
    marginVertical: 20,
    width: '80%',
  },
  profileText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  buttonContainer: {
    width: '80%',
    marginVertical: 10,
  },
  button: {
    borderRadius: 10,
    paddingVertical: 15,
  },
});

export default HomeScreen;