import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { Text } from '@rneui/themed';
import { Stack, useRouter } from 'expo-router';
import { useSelector } from 'react-redux';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { PawnService } from '../../services/PawnService';
import Svg, { Circle, Path, Text as SvgText, Line } from 'react-native-svg';

const PawnCollectionScreen = () => {
  const router = useRouter();
  const user = useSelector(state => state.auth.user);
  const actualUser = user?.success && user?.user ? user.user : user;

  const [ownedPawns, setOwnedPawns] = useState(['default']);
  const [selectedPawn, setSelectedPawn] = useState('default');
  const [selectedCategory, setSelectedCategory] = useState('teams');
  const reduxOwnedPawns = useSelector(state => state.api?.ownedPawns || []);

  useEffect(() => {
    loadOwnedPawns();
    loadSelectedPawn();
  }, []);

  const loadOwnedPawns = async () => {
    try {
      let initial = Array.isArray(reduxOwnedPawns) && reduxOwnedPawns.length > 0 ? reduxOwnedPawns : null;
      if (!initial) {
        const cachedOwnedPawns = await AsyncStorage.getItem('ownedPawns');
        if (cachedOwnedPawns) {
          initial = JSON.parse(cachedOwnedPawns);
        }
      }
      setOwnedPawns(initial || ['default']);
    } catch (error) {
      console.error('[COLLECTION] Error loading owned pawns:', error);
    }
  };

  const loadSelectedPawn = async () => {
    try {
      const cachedSelectedPawn = await AsyncStorage.getItem('selectedPawn');
      if (cachedSelectedPawn) {
        setSelectedPawn(cachedSelectedPawn);
      }
      const serverSelectedPawn = await PawnService.getSelectedPawn();
      setSelectedPawn(serverSelectedPawn || 'default');
    } catch (error) {
      console.error('[COLLECTION] Error loading selected pawn:', error);
    }
  };

  const categories = [
    { key: 'teams', name: 'Takımlar', icon: '⚽' },
    { key: 'brands', name: 'Marka', icon: '🏷️' },
    { key: 'emoji', name: 'Emoji', icon: '😊' },
    { key: 'animals', name: 'Hayvan', icon: '🐾' },
    { key: 'nature', name: 'Doğa', icon: '🌿' },
    { key: 'vehicles', name: 'Araç', icon: '🚗' },
  ];

  const filterByCategory = (ids, categoryKey) => {
    switch (categoryKey) {
      case 'teams':
        return ids.filter(id => id.startsWith('team_'));
      case 'brands':
        return ids.filter(id => id.startsWith('brand_'));
      case 'emoji':
        return ids.filter(id => id.startsWith('emoji_'));
      case 'animals':
        return ids.filter(id => id.startsWith('animal_'));
      case 'nature':
        return ids.filter(id => id.startsWith('nature_'));
      case 'vehicles':
        return ids.filter(id => id.startsWith('vehicle_'));
      default:
        return [];
    }
  };

  const brandLogoMap = {
    'brand_1': 'aura',
    'brand_2': 'vortex',
    'brand_3': 'stellar',
    'brand_4': 'nexus',
    'brand_5': 'phoenix',
    'brand_6': 'titan',
    'brand_7': 'merseles',
    'brand_8': 'avudi',
    'brand_9': 'bememe'
  };

  const renderTeamColors = (colors) => (
    <Svg width="40" height="40" viewBox="0 0 40 40">
      <Path d="M8 12 L8 36 L32 36 L32 12 L28 8 L24 6 L20 4 L16 6 L12 8 Z" fill={colors[0]} stroke="#000" strokeWidth="1" />
      <Path d="M8 12 L4 16 L4 22 L8 18 Z" fill={colors[0]} stroke="#000" strokeWidth="1" />
      <Path d="M32 12 L36 16 L36 22 L32 18 Z" fill={colors[0]} stroke="#000" strokeWidth="1" />
      <Path d="M16 6 L20 4 L24 6 L22 8 L18 8 Z" fill="none" stroke="#000" strokeWidth="1" />
      <Line x1="12" y1="12" x2="12" y2="36" stroke={colors[1]} strokeWidth="2" />
      <Line x1="16" y1="12" x2="16" y2="36" stroke={colors[1]} strokeWidth="2" />
      <Line x1="20" y1="12" x2="20" y2="36" stroke={colors[1]} strokeWidth="2" />
      <Line x1="24" y1="12" x2="24" y2="36" stroke={colors[1]} strokeWidth="2" />
      <Line x1="28" y1="12" x2="28" y2="36" stroke={colors[1]} strokeWidth="2" />
    </Svg>
  );

  const renderBrandLogo = (logoType) => {
    const logoProps = { width: 40, height: 40, viewBox: '0 0 40 40' };
    switch (logoType) {
      case 'aura':
        return (
          <Svg {...logoProps}>
            <Circle cx="20" cy="20" r="18" fill="#1a1a1a" stroke="#C0C0C0" strokeWidth="2" />
            <Circle cx="20" cy="20" r="12" fill="none" stroke="#C0C0C0" strokeWidth="2" />
            <Path d="M14 20 L20 14 L26 20 L20 26 Z" fill="#C0C0C0" />
            <SvgText x="20" y="35" textAnchor="middle" fontFamily="Arial" fontSize="8" fill="#1a1a1a" fontWeight="bold">AURA</SvgText>
          </Svg>
        );
      case 'vortex':
        return (
          <Svg {...logoProps}>
            <Circle cx="20" cy="20" r="18" fill="#2E3440" stroke="#88C0D0" strokeWidth="2" />
            <Path d="M20 8 Q28 12 24 20 Q28 28 20 32 Q12 28 16 20 Q12 12 20 8 Z" fill="#88C0D0" />
            <SvgText x="20" y="35" textAnchor="middle" fontFamily="Arial" fontSize="7" fill="#2E3440" fontWeight="bold">VORTEX</SvgText>
          </Svg>
        );
      case 'stellar':
        return (
          <Svg {...logoProps}>
            <Circle cx="20" cy="20" r="18" fill="#0F1419" stroke="#FFD700" strokeWidth="2" />
            <Path d="M20 6 L22 16 L32 16 L24 22 L26 32 L20 26 L14 32 L16 22 L8 16 L18 16 Z" fill="#FFD700" />
            <SvgText x="20" y="35" textAnchor="middle" fontFamily="Arial" fontSize="6" fill="#0F1419" fontWeight="bold">STELLAR</SvgText>
          </Svg>
        );
      case 'nexus':
        return (
          <Svg {...logoProps}>
            <Circle cx="20" cy="20" r="18" fill="#1E1E1E" stroke="#00D4AA" strokeWidth="2" />
            <Path d="M12 12 L28 12 L28 16 L16 16 L16 24 L28 24 L28 28 L12 28 Z" fill="#00D4AA" />
            <Circle cx="24" cy="20" r="2" fill="#00D4AA" />
            <SvgText x="20" y="35" textAnchor="middle" fontFamily="Arial" fontSize="7" fill="#1E1E1E" fontWeight="bold">NEXUS</SvgText>
          </Svg>
        );
      case 'phoenix':
        return (
          <Svg {...logoProps}>
            <Circle cx="20" cy="20" r="18" fill="#2D1B69" stroke="#FF6B35" strokeWidth="2" />
            <Path d="M20 8 Q24 12 20 16 Q16 12 20 8 M16 16 Q20 20 24 16 Q20 24 16 16 M20 24 Q24 28 20 32 Q16 28 20 24" fill="#FF6B35" />
            <SvgText x="20" y="35" textAnchor="middle" fontFamily="Arial" fontSize="6" fill="#2D1B69" fontWeight="bold">PHOENIX</SvgText>
          </Svg>
        );
      case 'titan':
        return (
          <Svg {...logoProps}>
            <Circle cx="20" cy="20" r="18" fill="#1C1C1C" stroke="#E74C3C" strokeWidth="2" />
            <Path d="M8 14 L32 14 L32 18 L22 18 L22 26 L18 26 L18 18 L8 18 Z" fill="#E74C3C" />
            <SvgText x="20" y="35" textAnchor="middle" fontFamily="Arial" fontSize="7" fill="#1C1C1C" fontWeight="bold">TITAN</SvgText>
          </Svg>
        );
      case 'merseles':
        return (
          <Svg {...logoProps}>
            <Circle cx="20" cy="20" r="18" fill="#0F1419" stroke="#C0C0C0" strokeWidth="2" />
            <Circle cx="20" cy="20" r="14" fill="none" stroke="#C0C0C0" strokeWidth="1" />
            <Path d="M20 8 L26 20 L20 32 L14 20 Z" fill="#C0C0C0" />
            <Circle cx="20" cy="20" r="3" fill="#C0C0C0" />
            <SvgText x="20" y="35" textAnchor="middle" fontFamily="Arial" fontSize="6" fill="#0F1419" fontWeight="bold">MERSELES</SvgText>
          </Svg>
        );
      case 'avudi':
        return (
          <Svg {...logoProps}>
            <Circle cx="20" cy="20" r="18" fill="#8B0000" stroke="#C0C0C0" strokeWidth="2" />
            <Circle cx="14" cy="20" r="6" fill="none" stroke="#C0C0C0" strokeWidth="2" />
            <Circle cx="20" cy="20" r="6" fill="none" stroke="#C0C0C0" strokeWidth="2" />
            <Circle cx="26" cy="20" r="6" fill="none" stroke="#C0C0C0" strokeWidth="2" />
            <Circle cx="32" cy="20" r="6" fill="none" stroke="#C0C0C0" strokeWidth="2" />
            <SvgText x="20" y="35" textAnchor="middle" fontFamily="Arial" fontSize="7" fill="#8B0000" fontWeight="bold">AVUDI</SvgText>
          </Svg>
        );
      case 'bememe':
        return (
          <Svg {...logoProps}>
            <Circle cx="20" cy="20" r="18" fill="#1E3A8A" stroke="#FFFFFF" strokeWidth="2" />
            <Circle cx="20" cy="20" r="14" fill="none" stroke="#FFFFFF" strokeWidth="2" />
            <Path d="M20 8 L20 32 M8 20 L32 20" stroke="#FFFFFF" strokeWidth="2" />
            <Circle cx="15" cy="15" r="4" fill="#FFFFFF" />
            <Circle cx="25" cy="15" r="4" fill="#1E3A8A" />
            <Circle cx="15" cy="25" r="4" fill="#1E3A8A" />
            <Circle cx="25" cy="25" r="4" fill="#FFFFFF" />
            <SvgText x="20" y="35" textAnchor="middle" fontFamily="Arial" fontSize="6" fill="#1E3A8A" fontWeight="bold">BEMEME</SvgText>
          </Svg>
        );
      default:
        return null;
    }
  };

  const guessEmoji = (id) => {
    // Known mappings
    const known = PawnService.getPawnEmoji(id);
    if (known !== '●' || id === 'default') return known;
    if (id.startsWith('emoji_')) return '😊';
    if (id.startsWith('animal_')) return '🐾';
    if (id.startsWith('nature_')) return '🌿';
    if (id.startsWith('vehicle_')) return '🚗';
    return '●';
  };

  const formatName = (id) => {
    if (id === 'default') return 'Varsayılan';
    const [prefix, num] = id.split('_');
    const map = {
      team: 'Takım',
      brand: 'Marka',
      emoji: 'Emoji',
      animal: 'Hayvan',
      nature: 'Doğa',
      vehicle: 'Araç',
    };
    const base = map[prefix] || prefix;
    return `${base} ${num}`;
  };

  const handleSelectPawn = async (pawnId) => {
    try {
      const ok = await PawnService.setSelectedPawn(pawnId);
      if (ok) {
        setSelectedPawn(pawnId);
        await AsyncStorage.setItem('selectedPawn', pawnId);
        Alert.alert('Başarılı', 'Piyon seçildi!');
      } else {
        Alert.alert('Hata', 'Piyon seçimi başarısız oldu.');
      }
    } catch (error) {
      console.error('[COLLECTION] Error selecting pawn:', error);
      Alert.alert('Hata', 'Piyon seçimi sırasında bir hata oluştu.');
    }
  };

  const renderPawnTile = (id) => {
    const isSelected = selectedPawn === id;
    const isTeam = id.startsWith('team_');
    const isBrand = id.startsWith('brand_');
    const colors = isTeam ? PawnService.getTeamColors(id) : [];
    const logoType = isBrand ? brandLogoMap[id] : null;

    return (
      <TouchableOpacity
        key={id}
        style={[styles.pawnTile, isSelected && styles.selectedTile]}
        onPress={() => handleSelectPawn(id)}
        activeOpacity={0.8}
      >
        <View style={styles.tileIconWrap}>
          {isTeam && colors.length ? (
            renderTeamColors(colors)
          ) : isBrand && logoType ? (
            renderBrandLogo(logoType)
          ) : (
            <Text style={styles.tileEmoji}>{guessEmoji(id)}</Text>
          )}
          {isSelected && (
            <View style={styles.selectedBadge}>
              <Ionicons name="star" size={16} color="#FFD700" />
            </View>
          )}
        </View>
        <Text style={styles.tileLabel}>{formatName(id)}</Text>
      </TouchableOpacity>
    );
  };

  const ownedInCategory = filterByCategory(ownedPawns, selectedCategory);

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <LinearGradient colors={['#6E00B3', '#4A0080', '#1a1a2e']} style={styles.container} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={20} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={styles.title}>Piyon Koleksiyonum</Text>
          <Text style={styles.subtitle}>{actualUser?.nickname || 'Misafir'}</Text>
        </View>

        <View style={styles.categoryTabs}>
          {categories.map((cat) => (
            <TouchableOpacity
              key={cat.key}
              style={[styles.categoryTab, selectedCategory === cat.key && styles.activeCategoryTab]}
              onPress={() => setSelectedCategory(cat.key)}
            >
              <Text style={styles.categoryIcon}>{cat.icon}</Text>
              <Text style={[styles.categoryText, selectedCategory === cat.key && styles.activeCategoryText]}>
                {cat.name}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <ScrollView contentContainerStyle={styles.grid}>
          {ownedInCategory.length === 0 ? (
            <Text style={styles.emptyText}>Bu kategoride piyonun yok.</Text>
          ) : (
            ownedInCategory.map(renderPawnTile)
          )}
        </ScrollView>
      </LinearGradient>
      </>
    );
  };

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { alignItems: 'center', paddingTop: 80, paddingBottom: 20 },
  backButton: { position: 'absolute', left: 20, top: 80, backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 18, padding: 8 },
  title: { fontSize: 24, color: '#00D9CC', fontFamily: 'Poppins_700Bold', marginBottom: 4 },
  subtitle: { fontSize: 14, color: 'rgba(255,255,255,0.85)', fontFamily: 'Poppins_400Regular' },

  categoryTabs: { flexDirection: 'row', justifyContent: 'center', flexWrap: 'wrap', paddingHorizontal: 12, marginBottom: 10 },
  categoryTab: { flexDirection: 'row', alignItems: 'center', margin: 6, paddingVertical: 8, paddingHorizontal: 12, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.12)' },
  categoryIcon: { fontSize: 16, marginRight: 6 },
  categoryText: { color: '#FFFFFF', fontFamily: 'Poppins_500Medium' },
  activeCategoryTab: { backgroundColor: '#00D9CC' },
  activeCategoryText: { color: '#1a1a2e', fontFamily: 'Poppins_700Bold' },

  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', paddingHorizontal: 12, paddingBottom: 60 },
  pawnTile: { width: 100, height: 120, margin: 8, borderRadius: 16, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.08)', position: 'relative' },
  selectedTile: { borderColor: '#FFD700', borderWidth: 2 },
  tileIconWrap: { width: 60, height: 60, alignItems: 'center', justifyContent: 'center' },
  tileEmoji: { fontSize: 36 },
  selectedBadge: { position: 'absolute', top: 8, right: 8, backgroundColor: 'rgba(0,0,0,0.35)', borderRadius: 12, width: 24, height: 24, alignItems: 'center', justifyContent: 'center' },
  tileLabel: { marginTop: 8, color: '#FFFFFF', fontFamily: 'Poppins_500Medium' },
  emptyText: { color: 'rgba(255,255,255,0.85)', fontFamily: 'Poppins_400Regular', marginTop: 20 }
});

export default PawnCollectionScreen;