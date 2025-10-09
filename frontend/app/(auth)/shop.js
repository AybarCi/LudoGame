import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ImageBackground,
  Animated,
  Dimensions,
  Image,
  Modal
} from 'react-native';
import { Text } from '@rneui/themed';
import { useRouter } from 'expo-router';
import { useSelector } from 'react-redux';
import { setDiamonds, addDiamonds, spendDiamonds } from '../../store/slices/diamondSlice';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { DiamondService } from '../../services/DiamondService';
import { useDispatch } from 'react-redux';
import { showAlert } from '../../store/slices/alertSlice';
import Svg, { Circle, Path, Text as SvgText, Line, Rect } from 'react-native-svg';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://192.168.1.135:3001';

const { width, height } = Dimensions.get('window');

// Piyon kategorilerini oluşturan yardımcı fonksiyon
const generatePawnItems = (baseItems, categoryPrefix, count = 100) => {
  const items = [...baseItems];
  const emojis = {
    emoji: ['😀', '😃', '😄', '😁', '😆', '😅', '🤣', '😂', '🙂', '🙃', '😉', '😊', '😇', '🥰', '😍', '🤩', '😘', '😗', '☺️', '😚', '😙', '🥲', '😋', '😛', '😜', '🤪', '😝', '🤑', '🤗', '🤭', '🤫', '🤔', '🤐', '🤨', '😐', '😑', '😶', '😏', '😒', '🙄', '😬', '🤥', '😌', '😔', '😪', '🤤', '😴', '😷', '🤒', '🤕', '🤢', '🤮', '🤧', '🥵', '🥶', '🥴', '😵', '🤯', '🤠', '🥳', '🥸', '😎', '🤓', '🧐', '😕', '😟', '🙁', '☹️', '😮', '😯', '😲', '😳', '🥺', '😦', '😧', '😨', '😰', '😥', '😢', '😭', '😱', '😖', '😣', '😞', '😓', '😩', '😫', '🥱', '😤', '😡', '😠', '🤬', '😈', '👿', '💀', '☠️', '💩', '🤡', '👹', '👺', '👻', '👽', '👾', '🤖', '🎃', '😺', '😸', '😹', '😻', '😼', '😽', '🙀', '😿', '😾'],
    animals: ['🐱', '🐶', '🐭', '🐹', '🐰', '🦊', '🐻', '🐼', '🐨', '🐯', '🦁', '🐮', '🐷', '🐽', '🐸', '🐵', '🙈', '🙉', '🙊', '🐒', '🐔', '🐧', '🐦', '🐤', '🐣', '🐥', '🦆', '🦅', '🦉', '🦇', '🐺', '🐗', '🐴', '🦄', '🐝', '🐛', '🦋', '🐌', '🐞', '🐜', '🦟', '🦗', '🕷️', '🕸️', '🦂', '🐢', '🐍', '🦎', '🦖', '🦕', '🐙', '🦑', '🦐', '🦞', '🦀', '🐡', '🐠', '🐟', '🐬', '🐳', '🐋', '🦈', '🐊', '🐅', '🐆', '🦓', '🦍', '🦧', '🐘', '🦛', '🦏', '🐪', '🐫', '🦒', '🦘', '🐃', '🐂', '🐄', '🐎', '🐖', '🐏', '🐑', '🦙', '🐐', '🦌', '🐕', '🐩', '🦮', '🐕‍🦺', '🐈', '🐈‍⬛', '🐓', '🦃', '🦚', '🦜', '🦢', '🦩', '🕊️', '🐇', '🦝', '🦨', '🦡', '🦦', '🦥', '🐁', '🐀', '🐿️', '🦔'],
    nature: ['🌸', '🌺', '🌻', '🌷', '🌹', '🥀', '🌾', '🌿', '🍀', '🍃', '🍂', '🍁', '🌱', '🌲', '🌳', '🌴', '🌵', '🌶️', '🍄', '🌰', '🌟', '⭐', '🌠', '☀️', '🌞', '🌝', '🌛', '🌜', '🌚', '🌕', '🌖', '🌗', '🌘', '🌑', '🌒', '🌓', '🌔', '🌙', '⚡', '⛈️', '🌩️', '🔥', '💥', '❄️', '🌨️', '☃️', '⛄', '🌬️', '💨', '🌪️', '🌊', '💧', '💦', '☔', '🌈', '🌤️', '⛅', '🌥️', '☁️', '🌦️', '🌧️', '⛈️', '🌩️', '🌨️', '❄️', '☃️', '⛄', '🌬️', '💨', '🌪️', '🌫️', '🌊', '💧', '💦', '☔', '🌈', '🌍', '🌎', '🌏', '🌐', '🗺️', '🗾', '🧭', '🏔️', '⛰️', '🌋', '🗻', '🏕️', '🏖️', '🏜️', '🏝️', '🏞️', '🏟️', '🏛️', '🏗️', '🧱', '🪨', '🪵', '🛖', '🏘️', '🏚️', '🏠', '🏡', '🏢', '🏣', '🏤', '🏥', '🏦', '🏨', '🏩', '🏪', '🏫', '🏬', '🏭', '🏯', '🏰', '🗼', '🗽', '⛪', '🕌', '🛕', '🕍', '⛩️', '🕋', '⛲', '⛺', '🌁', '🌃', '🏙️', '🌄', '🌅', '🌆', '🌇', '🌉', '♨️', '🎠', '🎡', '🎢', '💈', '🎪', '🚂', '🚃', '🚄', '🚅', '🚆', '🚇', '🚈', '🚉', '🚊', '🚝', '🚞', '🚋', '🚌', '🚍', '🚎', '🚐', '🚑', '🚒', '🚓', '🚔', '🚕', '🚖', '🚗', '🚘', '🚙', '🛻', '🚚', '🚛', '🚜', '🏎️', '🏍️', '🛵', '🦽', '🦼', '🛴', '🚲', '🛺', '🚁', '🚟', '🚠', '🚡', '🛰️', '🚀', '🛸', '🛶', '⛵', '🚤', '🛥️', '🛳️', '⛴️', '🚢', '⚓', '⛽', '🚧', '🚨', '🚥', '🚦', '🛑', '🚏', '🗺️', '🗿', '🗽', '🗼', '🏛️', '🎡', '🎢', '🎠', '⛲', '⛱️', '🏖️', '🏝️', '🏜️', '🌋', '⛰️', '🏔️', '🗻', '🏕️', '⛺', '🏠', '🏡', '🏘️', '🏚️', '🏗️', '🏭', '🏢', '🏬', '🏣', '🏤', '🏥', '🏦', '🏨', '🏪', '🏫', '🏩', '💒', '🏛️', '⛪', '🕌', '🕍', '🛕', '🕋', '⛩️', '🛤️', '🛣️', '🗾', '🎑', '🏞️', '🌅', '🌄', '🌠', '🎇', '🎆', '🌇', '🌆', '🏙️', '🌃', '🌌', '🌉', '🌁'],
    vehicles: ['🚗', '🚕', '🚙', '🚌', '🚎', '🏎️', '🚓', '🚑', '🚒', '🚐', '🛻', '🚚', '🚛', '🚜', '🏍️', '🛵', '🚲', '🛴', '🛺', '🚁', '🛸', '🚀', '✈️', '🛩️', '🛫', '🛬', '🪂', '💺', '🚂', '🚃', '🚄', '🚅', '🚆', '🚇', '🚈', '🚉', '🚊', '🚝', '🚞', '🚋', '🚟', '🚠', '🚡', '⛵', '🛶', '🚤', '🛥️', '🛳️', '⛴️', '🚢', '⚓', '⛽', '🚧', '🚨', '🚥', '🚦', '🛑', '🚏', '🛤️', '🛣️', '🗺️', '🧭', '🚘', '🚖', '🚔', '🚍', '🚒', '🚑', '🚓', '🚕', '🚗', '🚙', '🛻', '🚚', '🚛', '🚜', '🏎️', '🏍️', '🛵', '🚲', '🛴', '🛺', '🚁', '🛸', '🚀', '✈️', '🛩️', '🛫', '🛬', '🪂', '💺', '🚂', '🚃', '🚄', '🚅', '🚆', '🚇', '🚈', '🚉', '🚊', '🚝', '🚞', '🚋', '🚟', '🚠', '🚡', '⛵', '🛶', '🚤', '🛥️', '🛳️', '⛴️', '🚢']
  };
  
  const categoryEmojis = emojis[categoryPrefix] || emojis.emoji;
  
  for (let i = items.length + 1; i <= count; i++) {
    const emojiIndex = (i - 1) % categoryEmojis.length;
    const priceVariation = Math.floor(Math.random() * 16) + 5; // 5-20 arası rastgele fiyat
    const isMoneyItem = i % 10 === 0; // Her 10. item para ile satın alınabilir
    
    // Özel fiyatlandırma için kontrol
    let itemPrice = isMoneyItem ? (Math.random() * 5 + 1).toFixed(2) : priceVariation;
    let itemCurrency = isMoneyItem ? 'money' : 'diamonds';
    
    // Hayvan 11 ve Hayvan 28 için özel fiyat
    if (categoryPrefix === 'animals' && (i === 11 || i === 28)) {
      itemPrice = '5.00';
      itemCurrency = 'money';
    }
    
    items.push({
      id: `${categoryPrefix}_${i}`,
      emoji: categoryEmojis[emojiIndex],
      name: `${categoryPrefix === 'emoji' ? 'Emoji' : categoryPrefix === 'animals' ? 'Hayvan' : categoryPrefix === 'vehicles' ? 'Araç' : 'Doğa'} ${i}`,
      price: itemPrice,
      currency: itemCurrency
    });
  }
  
  return items;
};

const PAWN_CATEGORIES = {
    teams: {
      name: 'Takımlar',
      icon: '⚽',
    items: [
      { id: 'team_1', name: 'Takım 1', price: 45, currency: 'diamonds', isTeam: true, colors: ['#000000', '#FFFFFF'] },
      { id: 'team_2', name: 'Takım 2', price: 45, currency: 'diamonds', isTeam: true, colors: ['#FFD700', '#FF0000'] },
      { id: 'team_3', name: 'Takım 3', price: 45, currency: 'diamonds', isTeam: true, colors: ['#FFFF00', '#000080'] },
      { id: 'team_4', name: 'Takım 4', price: 40, currency: 'diamonds', isTeam: true, colors: ['#800080', '#87CEEB'] },
      { id: 'team_5', name: 'Takım 5', price: 35, currency: 'diamonds', isTeam: true, colors: ['#FF4500', '#000080'] },
      { id: 'team_6', name: 'Takım 6', price: 30, currency: 'diamonds', isTeam: true, colors: ['#FF4500', '#008000'] },
      { id: 'team_7', name: 'Takım 7', price: 30, currency: 'diamonds', isTeam: true, colors: ['#FF0000', '#FFFFFF'] },
      { id: 'team_8', name: 'Takım 8', price: 25, currency: 'diamonds', isTeam: true, colors: ['#008000', '#FFFFFF'] },
      { id: 'team_9', name: 'Takım 9', price: 25, currency: 'diamonds', isTeam: true, colors: ['#FF0000', '#FFFFFF'] },
      { id: 'team_10', name: 'Takım 10', price: 25, currency: 'diamonds', isTeam: true, colors: ['#FF0000', '#FFD700'] },
      { id: 'team_11', name: 'Takım 11', price: 20, currency: 'diamonds', isTeam: true, colors: ['#0000FF', '#008000'] },
      { id: 'team_12', name: 'Takım 12', price: 20, currency: 'diamonds', isTeam: true, colors: ['#FF0000', '#000000'] }
    ]
  },
  emoji: {
    name: 'Emoji',
    icon: '😊',
    items: generatePawnItems([
       { id: 'emoji_1', emoji: '😀', name: 'Mutlu Yüz', price: 5, currency: 'diamonds' },
       { id: 'emoji_2', emoji: '😎', name: 'Havalı', price: 8, currency: 'diamonds' },
       { id: 'emoji_3', emoji: '🤩', name: 'Yıldız Gözlü', price: 12, currency: 'diamonds' },
       { id: 'emoji_4', emoji: '🥳', name: 'Parti', price: 15, currency: 'diamonds' },
       { id: 'emoji_5', emoji: '👑', name: 'Kral Tacı', price: 25, currency: 'diamonds' },
       { id: 'emoji_6', emoji: '💎', name: 'Elmas', price: 2.99, currency: 'money' },
       { id: 'emoji_7', emoji: '🚀', name: 'Roket', price: 30, currency: 'diamonds' }
     ], 'emoji', 100)
  },
  animals: {
    name: 'Hayvan',
    icon: '🐾',
    items: generatePawnItems([
       { id: 'animal_1', emoji: '🐱', name: 'Kedi', price: 6, currency: 'diamonds' },
       { id: 'animal_2', emoji: '🐶', name: 'Köpek', price: 6, currency: 'diamonds' },
       { id: 'animal_3', emoji: '🦁', name: 'Aslan', price: 18, currency: 'diamonds' },
       { id: 'animal_4', emoji: '🐯', name: 'Kaplan', price: 20, currency: 'diamonds' },
       { id: 'animal_5', emoji: '🦄', name: 'Unicorn', price: 4.99, currency: 'money' },
       { id: 'animal_6', emoji: '🐉', name: 'Ejder', price: 6.99, currency: 'money' }
     ], 'animals', 100)
  },
  nature: {
    name: 'Doğa',
    icon: '🌿',
    items: generatePawnItems([
       { id: 'nature_1', emoji: '🌸', name: 'Kiraz Çiçeği', price: 5, currency: 'diamonds' },
       { id: 'nature_2', emoji: '🌺', name: 'Hibiskus', price: 5, currency: 'diamonds' },
       { id: 'nature_3', emoji: '🌟', name: 'Yıldız', price: 10, currency: 'diamonds' },
       { id: 'nature_4', emoji: '⚡', name: 'Şimşek', price: 12, currency: 'diamonds' },
       { id: 'nature_5', emoji: '🔥', name: 'Ateş', price: 3.99, currency: 'money' },
       { id: 'nature_6', emoji: '❄️', name: 'Kar Tanesi', price: 3.99, currency: 'money' }
     ], 'nature', 100)
  },
  vehicles: {
    name: 'Araç',
    icon: '🚗',
    items: generatePawnItems([
      { id: 'brand_1', emoji: '🏷️', name: 'Aura Motors', price: 35, currency: 'diamonds', isBrand: true, logoType: 'aura' },
      { id: 'brand_2', emoji: '🏷️', name: 'Vortex Auto', price: 40, currency: 'diamonds', isBrand: true, logoType: 'vortex' },
      { id: 'brand_3', emoji: '🏷️', name: 'Stellar Cars', price: 45, currency: 'diamonds', isBrand: true, logoType: 'stellar' },
      { id: 'brand_4', emoji: '🏷️', name: 'Nexus Motors', price: 50, currency: 'diamonds', isBrand: true, logoType: 'nexus' },
      { id: 'brand_5', emoji: '🏷️', name: 'Phoenix Auto', price: 12.99, currency: 'money', isBrand: true, logoType: 'phoenix' },
      { id: 'brand_6', emoji: '🏷️', name: 'Titan Motors', price: 15.99, currency: 'money', isBrand: true, logoType: 'titan' },
      { id: 'brand_7', emoji: '🏷️', name: 'Merseles', price: 60, currency: 'diamonds', isBrand: true, logoType: 'merseles' },
      { id: 'brand_8', emoji: '🏷️', name: 'Avudi', price: 55, currency: 'diamonds', isBrand: true, logoType: 'avudi' },
      { id: 'brand_9', emoji: '🏷️', name: 'Bememe', price: 65, currency: 'diamonds', isBrand: true, logoType: 'bememe' },
      { id: 'vehicle_1', emoji: '🚗', name: 'Araba', price: 8, currency: 'diamonds' },
      { id: 'vehicle_2', emoji: '🚕', name: 'Taksi', price: 10, currency: 'diamonds' },
      { id: 'vehicle_3', emoji: '🚌', name: 'Otobüs', price: 15, currency: 'diamonds' },
      { id: 'vehicle_4', emoji: '🏎️', name: 'Yarış Arabası', price: 25, currency: 'diamonds' },
      { id: 'vehicle_5', emoji: '🚁', name: 'Helikopter', price: 7.99, currency: 'money' },
      { id: 'vehicle_6', emoji: '✈️', name: 'Uçak', price: 9.99, currency: 'money' }
    ], 'vehicles', 100)
  }
};

// Takım renkleri render fonksiyonu
  const renderTeamColors = (colors) => {
    return (
      <Svg width="40" height="40" viewBox="0 0 40 40">
        {/* Forma ana gövdesi */}
        <Path
          d="M8 12 L8 36 L32 36 L32 12 L28 8 L24 6 L20 4 L16 6 L12 8 Z"
          fill={colors[0]}
          stroke="#000"
          strokeWidth="1"
        />
        
        {/* Kollar */}
        <Path
          d="M8 12 L4 16 L4 22 L8 18 Z"
          fill={colors[0]}
          stroke="#000"
          strokeWidth="1"
        />
        <Path
          d="M32 12 L36 16 L36 22 L32 18 Z"
          fill={colors[0]}
          stroke="#000"
          strokeWidth="1"
        />
        
        {/* Yaka */}
        <Path
          d="M16 6 L20 4 L24 6 L22 8 L18 8 Z"
          fill="none"
          stroke="#000"
          strokeWidth="1"
        />
        
        {/* Dikey çizgiler - ikinci renk */}
        <Line x1="12" y1="12" x2="12" y2="36" stroke={colors[1]} strokeWidth="2" />
        <Line x1="16" y1="12" x2="16" y2="36" stroke={colors[1]} strokeWidth="2" />
        <Line x1="20" y1="12" x2="20" y2="36" stroke={colors[1]} strokeWidth="2" />
        <Line x1="24" y1="12" x2="24" y2="36" stroke={colors[1]} strokeWidth="2" />
        <Line x1="28" y1="12" x2="28" y2="36" stroke={colors[1]} strokeWidth="2" />
      </Svg>
    );
  };

// Logo render fonksiyonu
const renderBrandLogo = (logoType) => {
  const logoProps = {
    width: 40,
    height: 40,
    viewBox: "0 0 40 40"
  };

  switch (logoType) {
    case 'aura':
      return (
        <Svg {...logoProps}>
          <Circle cx="20" cy="20" r="18" fill="#1a1a1a" stroke="#C0C0C0" strokeWidth="2"/>
          <Circle cx="20" cy="20" r="12" fill="none" stroke="#C0C0C0" strokeWidth="2"/>
          <Path d="M14 20 L20 14 L26 20 L20 26 Z" fill="#C0C0C0"/>
          <SvgText x="20" y="35" textAnchor="middle" fontFamily="Arial" fontSize="8" fill="#1a1a1a" fontWeight="bold">AURA</SvgText>
        </Svg>
      );
    case 'vortex':
      return (
        <Svg {...logoProps}>
          <Circle cx="20" cy="20" r="18" fill="#2E3440" stroke="#88C0D0" strokeWidth="2"/>
          <Path d="M20 8 Q28 12 24 20 Q28 28 20 32 Q12 28 16 20 Q12 12 20 8 Z" fill="#88C0D0"/>
          <SvgText x="20" y="35" textAnchor="middle" fontFamily="Arial" fontSize="7" fill="#2E3440" fontWeight="bold">VORTEX</SvgText>
        </Svg>
      );
    case 'stellar':
      return (
        <Svg {...logoProps}>
          <Circle cx="20" cy="20" r="18" fill="#0F1419" stroke="#FFD700" strokeWidth="2"/>
          <Path d="M20 6 L22 16 L32 16 L24 22 L26 32 L20 26 L14 32 L16 22 L8 16 L18 16 Z" fill="#FFD700"/>
          <SvgText x="20" y="35" textAnchor="middle" fontFamily="Arial" fontSize="6" fill="#0F1419" fontWeight="bold">STELLAR</SvgText>
        </Svg>
      );
    case 'nexus':
      return (
        <Svg {...logoProps}>
          <Circle cx="20" cy="20" r="18" fill="#1E1E1E" stroke="#00D4AA" strokeWidth="2"/>
          <Path d="M12 12 L28 12 L28 16 L16 16 L16 24 L28 24 L28 28 L12 28 Z" fill="#00D4AA"/>
          <Circle cx="24" cy="20" r="2" fill="#00D4AA"/>
          <SvgText x="20" y="35" textAnchor="middle" fontFamily="Arial" fontSize="7" fill="#1E1E1E" fontWeight="bold">NEXUS</SvgText>
        </Svg>
      );
    case 'phoenix':
      return (
        <Svg {...logoProps}>
          <Circle cx="20" cy="20" r="18" fill="#2D1B69" stroke="#FF6B35" strokeWidth="2"/>
          <Path d="M20 8 Q24 12 20 16 Q16 12 20 8 M16 16 Q20 20 24 16 Q20 24 16 16 M20 24 Q24 28 20 32 Q16 28 20 24" fill="#FF6B35"/>
          <SvgText x="20" y="35" textAnchor="middle" fontFamily="Arial" fontSize="6" fill="#2D1B69" fontWeight="bold">PHOENIX</SvgText>
        </Svg>
      );
    case 'titan':
       return (
         <Svg {...logoProps}>
           <Circle cx="20" cy="20" r="18" fill="#1C1C1C" stroke="#E74C3C" strokeWidth="2"/>
           <Path d="M8 14 L32 14 L32 18 L22 18 L22 26 L18 26 L18 18 L8 18 Z" fill="#E74C3C"/>
           <SvgText x="20" y="35" textAnchor="middle" fontFamily="Arial" fontSize="7" fill="#1C1C1C" fontWeight="bold">TITAN</SvgText>
         </Svg>
       );
     case 'merseles':
       return (
         <Svg {...logoProps}>
           <Circle cx="20" cy="20" r="18" fill="#0F1419" stroke="#C0C0C0" strokeWidth="2"/>
           <Circle cx="20" cy="20" r="14" fill="none" stroke="#C0C0C0" strokeWidth="1"/>
           <Path d="M20 8 L26 20 L20 32 L14 20 Z" fill="#C0C0C0"/>
           <Circle cx="20" cy="20" r="3" fill="#C0C0C0"/>
           <SvgText x="20" y="35" textAnchor="middle" fontFamily="Arial" fontSize="6" fill="#0F1419" fontWeight="bold">MERSELES</SvgText>
         </Svg>
       );
     case 'avudi':
       return (
         <Svg {...logoProps}>
           <Circle cx="20" cy="20" r="18" fill="#8B0000" stroke="#C0C0C0" strokeWidth="2"/>
           <Circle cx="14" cy="20" r="6" fill="none" stroke="#C0C0C0" strokeWidth="2"/>
           <Circle cx="20" cy="20" r="6" fill="none" stroke="#C0C0C0" strokeWidth="2"/>
           <Circle cx="26" cy="20" r="6" fill="none" stroke="#C0C0C0" strokeWidth="2"/>
           <Circle cx="32" cy="20" r="6" fill="none" stroke="#C0C0C0" strokeWidth="2"/>
           <SvgText x="20" y="35" textAnchor="middle" fontFamily="Arial" fontSize="7" fill="#8B0000" fontWeight="bold">AVUDI</SvgText>
         </Svg>
       );
     case 'bememe':
       return (
         <Svg {...logoProps}>
           <Circle cx="20" cy="20" r="18" fill="#1E3A8A" stroke="#FFFFFF" strokeWidth="2"/>
           <Circle cx="20" cy="20" r="14" fill="none" stroke="#FFFFFF" strokeWidth="2"/>
           <Path d="M20 8 L20 32 M8 20 L32 20" stroke="#FFFFFF" strokeWidth="2"/>
           <Circle cx="15" cy="15" r="4" fill="#FFFFFF"/>
           <Circle cx="25" cy="15" r="4" fill="#1E3A8A"/>
           <Circle cx="15" cy="25" r="4" fill="#1E3A8A"/>
           <Circle cx="25" cy="25" r="4" fill="#FFFFFF"/>
           <SvgText x="20" y="35" textAnchor="middle" fontFamily="Arial" fontSize="6" fill="#1E3A8A" fontWeight="bold">BEMEME</SvgText>
         </Svg>
       );
     default:
       return null;
  }
};

const ShopScreen = () => {
  const router = useRouter();
  const user = useSelector(state => state.auth.user);
  
  // Extract actual user object if it's wrapped in success property
  const actualUser = user?.success && user?.user ? user.user : user;
  const [selectedCategory, setSelectedCategory] = useState('teams');
  const [purchaseModal, setPurchaseModal] = useState({ visible: false, item: null });
  const [ownedPawns, setOwnedPawns] = useState(['default']); // Varsayılan piyon her zaman sahip olunan
  const [selectedPawn, setSelectedPawn] = useState('default');
  const [loading, setLoading] = useState(true);
  const diamonds = useSelector(state => state.diamonds?.count ?? 0);
  const dispatch = useDispatch();
  
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    loadOwnedPawns();
    loadSelectedPawn();
    loadDiamonds();
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      })
    ]).start();
  }, []);

  const loadDiamonds = async () => {
    // Sadece ilk yüklemede AsyncStorage'dan okuyup Redux store'una yaz
    const currentDiamonds = await DiamondService.getDiamonds();
    dispatch(setDiamonds(currentDiamonds));
  };

  // Token yenileme fonksiyonu
  const refreshToken = async () => {
    try {
      const refreshTokenValue = await AsyncStorage.getItem('refreshToken');
      if (!refreshTokenValue) {
        throw new Error('No refresh token available');
      }

      const response = await fetch(`${API_URL}/api/refresh-token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken: refreshTokenValue }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Token refresh failed');
      }

      const { accessToken, user: userData } = data;
      await AsyncStorage.setItem('accessToken', accessToken);
      await AsyncStorage.setItem('user', JSON.stringify(userData));

      return accessToken;
    } catch (error) {
      console.error('Token refresh error:', error);
      throw error;
    }
  };

  // API isteği yapma fonksiyonu (otomatik token yenileme ile)
  const makeAuthenticatedRequest = async (url, options = {}) => {
    let token = await AsyncStorage.getItem('accessToken');
    
    if (!token) {
      throw new Error('No access token available');
    }

    const requestOptions = {
      ...options,
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        ...options.headers
      }
    };

    let response;
    try {
      response = await fetch(url, requestOptions);
    } catch (networkError) {
      console.error('[SHOP DEBUG] Network error:', networkError);
      throw new Error('Network request failed');
    }

    // 401 veya 403 hatası alırsak token yenilemeyi dene
    if (response.status === 401 || response.status === 403) {
      try {
        token = await refreshToken();
        requestOptions.headers['Authorization'] = `Bearer ${token}`;
        response = await fetch(url, requestOptions);
      } catch (refreshError) {
        console.error('Token refresh failed:', refreshError);
        // Refresh token da geçersizse çıkış yap
        dispatch(showAlert({
          title: 'Oturum Süresi Doldu',
          message: 'Oturumunuzun süresi dolmuş. Lütfen tekrar giriş yapın.',
          type: 'warning',
          buttons: [
            {
              text: 'Tamam',
              onPress: async () => {
                await AsyncStorage.removeItem('accessToken');
                await AsyncStorage.removeItem('refreshToken');
                await AsyncStorage.removeItem('user');
                router.replace('/login');
              }
            }
          ]
        }));
        throw new Error('Authentication failed');
      }
    }

    return response;
  };

  const loadOwnedPawns = async () => {
    try {
      // Önce AsyncStorage'dan yükle
      const cachedOwnedPawns = await AsyncStorage.getItem('ownedPawns');
      if (cachedOwnedPawns) {
        const parsedPawns = JSON.parse(cachedOwnedPawns);
        console.log('[SHOP DEBUG] Loaded owned pawns from AsyncStorage:', parsedPawns);
        setOwnedPawns(parsedPawns);
      }
      
      const token = await AsyncStorage.getItem('accessToken');
      console.log('[SHOP DEBUG] Access token exists:', !!token);
      console.log('[SHOP DEBUG] Access token length:', token ? token.length : 0);
      if (!token) {
        console.log('[SHOP DEBUG] No access token found');
        return;
      }

      console.log('[SHOP DEBUG] Making request to /api/shop/pawns');
      console.log('[SHOP DEBUG] API_URL:', API_URL);
      const response = await makeAuthenticatedRequest(`${API_URL}/api/shop/pawns`);

      console.log('[SHOP DEBUG] Response status:', response.status);
      console.log('[SHOP DEBUG] Response headers:', response.headers);
      if (response.ok) {
        let data;
        try {
          data = await response.json();
          console.log('[SHOP DEBUG] Received owned pawns data from server:', data);
        } catch (jsonError) {
          console.error('[SHOP DEBUG] JSON parse error:', jsonError);
          const responseText = await response.text();
          console.log('[SHOP DEBUG] Response text:', responseText);
          return;
        }
        
        if (!data || !data.ownedPawns || !Array.isArray(data.ownedPawns)) {
          console.error('[SHOP DEBUG] Invalid response data structure:', data);
          console.error('[SHOP DEBUG] Expected { ownedPawns: [] }, got:', data);
          return;
        }
        
        const serverOwnedPawns = ['default', ...data.ownedPawns];
        setOwnedPawns(serverOwnedPawns);
        
        // AsyncStorage'ı server verisiyle güncelle
        try {
          await AsyncStorage.setItem('ownedPawns', JSON.stringify(serverOwnedPawns));
          console.log('[SHOP DEBUG] Updated AsyncStorage with server data:', serverOwnedPawns);
        } catch (storageError) {
          console.error('[SHOP DEBUG] Error updating AsyncStorage:', storageError);
        }
        
        console.log('[SHOP DEBUG] Set owned pawns:', serverOwnedPawns);
      } else {
        const errorText = await response.text();
        console.log('[SHOP DEBUG] Response not ok. Status:', response.status);
        console.log('[SHOP DEBUG] Error text:', errorText);
        console.log('[SHOP DEBUG] Response headers:', Object.fromEntries(response.headers.entries()));
      }
    } catch (error) {
      console.error('[SHOP DEBUG] Error loading owned pawns:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadSelectedPawn = async () => {
    try {
      // Önce AsyncStorage'dan yükle
      const cachedSelectedPawn = await AsyncStorage.getItem('selectedPawn');
      if (cachedSelectedPawn) {
        console.log('[SHOP DEBUG] Loaded selected pawn from AsyncStorage:', cachedSelectedPawn);
        setSelectedPawn(cachedSelectedPawn);
      }
      
      const token = await AsyncStorage.getItem('accessToken');
      if (!token) return;

      const response = await makeAuthenticatedRequest(`${API_URL}/api/user/selected-pawn`);

      if (response.ok) {
        const data = await response.json();
        const serverSelectedPawn = data.selectedPawn || 'default';
        setSelectedPawn(serverSelectedPawn);
        
        // AsyncStorage'ı server verisiyle güncelle
        try {
          await AsyncStorage.setItem('selectedPawn', serverSelectedPawn);
          console.log('[SHOP DEBUG] Updated AsyncStorage with server selected pawn:', serverSelectedPawn);
        } catch (storageError) {
          console.error('[SHOP DEBUG] Error updating selected pawn in AsyncStorage:', storageError);
        }
      }
    } catch (error) {
      console.error('Error loading selected pawn:', error);
    }
  };

  const handlePurchase = (item) => {
    setPurchaseModal({ visible: true, item });
  };

  const handleSelectPawn = async (pawnId) => {
    console.log('[PAWN SELECT DEBUG] Starting pawn selection for:', pawnId);
    try {
      const token = await AsyncStorage.getItem('accessToken');
      console.log('[PAWN SELECT DEBUG] Token exists:', !!token);
      if (!token) {
        console.log('[PAWN SELECT DEBUG] No token found, returning');
        return;
      }

      console.log('[PAWN SELECT DEBUG] Making request to:', `${API_URL}/api/user/select-pawn`);
      console.log('[PAWN SELECT DEBUG] Request body:', JSON.stringify({ pawnId }));
      
      const response = await makeAuthenticatedRequest(`${API_URL}/api/user/select-pawn`, {
        method: 'POST',
        body: JSON.stringify({ pawnId })
      });

      console.log('[PAWN SELECT DEBUG] Response status:', response.status);
      console.log('[PAWN SELECT DEBUG] Response ok:', response.ok);
      
      if (response.ok) {
        const responseData = await response.json();
        console.log('[PAWN SELECT DEBUG] Response data:', responseData);
        setSelectedPawn(pawnId);
        
        // AsyncStorage'a seçili piyonu kaydet
        try {
          await AsyncStorage.setItem('selectedPawn', pawnId);
          console.log('[PAWN SELECT DEBUG] Selected pawn saved to AsyncStorage:', pawnId);
        } catch (error) {
          console.error('[PAWN SELECT DEBUG] Error saving selected pawn to AsyncStorage:', error);
        }
        
        dispatch(showAlert({
          title: 'Başarılı!',
          message: 'Piyon seçildi!',
          type: 'success',
          buttons: []
        }));
      } else {
        const errorData = await response.text();
        console.log('[PAWN SELECT DEBUG] Error response:', errorData);
        dispatch(showAlert({
          title: 'Hata',
          message: `Piyon seçimi başarısız: ${errorData}`,
          type: 'error',
          buttons: []
        }));
      }
    } catch (error) {
      console.error('[PAWN SELECT DEBUG] Error selecting pawn:', error);
      dispatch(showAlert({
        title: 'Hata',
        message: 'Piyon seçimi sırasında bir hata oluştu.',
        type: 'error',
        buttons: []
      }));
    }
  };

  const confirmPurchase = async () => {
    const { item } = purchaseModal;
    
    try {
      const token = await AsyncStorage.getItem('accessToken');
      if (!token) {
        dispatch(showAlert({
          title: 'Hata',
          message: 'Oturum açmanız gerekiyor.',
          type: 'error',
          buttons: []
        }));
        return;
      }

      // Elmas ile satın alma kontrolü
      if (item.currency === 'diamonds') {
        if (diamonds < item.price) {
          dispatch(showAlert({
            title: 'Yetersiz Elmas',
            message: 'Bu ürünü satın almak için yeterli elmasınız yok.',
            type: 'warning',
            buttons: []
          }));
          setPurchaseModal({ visible: false, item: null });
          return;
        }
        
        // Elmasları düş
        const success = await DiamondService.spendDiamonds(item.price);
        if (success) {
          setDiamonds(prev => prev - item.price);
          
          // Backend'e de piyon satın alma isteği gönder
          try {
            console.log('[SHOP DEBUG] Making diamond purchase request to backend for:', item.id);
            const backendResponse = await makeAuthenticatedRequest(`${API_URL}/api/shop/purchase`, {
              method: 'POST',
              body: JSON.stringify({
                pawnId: item.id,
                price: item.price,
                currency: 'diamonds'
              })
            });
            
            console.log('[SHOP DEBUG] Backend diamond purchase response status:', backendResponse.status);
            
            if (backendResponse.ok) {
              console.log('[SHOP DEBUG] Diamond purchase successfully recorded in backend');
            } else {
              console.error('[SHOP DEBUG] Failed to record diamond purchase in backend');
            }
          } catch (backendError) {
            console.error('[SHOP DEBUG] Error recording diamond purchase in backend:', backendError);
          }
          
          // Ürünü sahip olunan listesine ekle
          const newOwnedPawns = [...ownedPawns, item.id];
          setOwnedPawns(newOwnedPawns);
          
          // AsyncStorage'a kaydet
          try {
            await AsyncStorage.setItem('ownedPawns', JSON.stringify(newOwnedPawns));
            console.log('[SHOP DEBUG] Owned pawns saved to AsyncStorage:', newOwnedPawns);
          } catch (error) {
            console.error('[SHOP DEBUG] Error saving owned pawns to AsyncStorage:', error);
          }
          
          dispatch(showAlert({
            title: 'Başarılı!',
            message: `${item.name} satın alındı!`,
            type: 'success',
            buttons: []
          }));
        } else {
          dispatch(showAlert({
          title: 'Hata',
          message: 'Satın alma işlemi başarısız oldu.',
          type: 'error',
          buttons: []
        }));
        }
        setPurchaseModal({ visible: false, item: null });
        return;
      }

      // Para ile satın alma (mevcut sistem)
      console.log('[SHOP DEBUG] Making purchase request for:', item.id);
      console.log('[SHOP DEBUG] Token exists for purchase:', !!token);
      const response = await makeAuthenticatedRequest(`${API_URL}/api/shop/purchase`, {
        method: 'POST',
        body: JSON.stringify({
          pawnId: item.id,
          price: item.price,
          currency: item.currency
        })
      });

      console.log('[SHOP DEBUG] Purchase response status:', response.status);
      console.log('[SHOP DEBUG] Purchase response headers:', Object.fromEntries(response.headers.entries()));
      
      let data;
      try {
        data = await response.json();
        console.log('[SHOP DEBUG] Purchase response data:', data);
      } catch (jsonError) {
        console.error('[SHOP DEBUG] Purchase response JSON parse error:', jsonError);
        const responseText = await response.text();
        console.log('[SHOP DEBUG] Purchase response text:', responseText);
        
        dispatch(showAlert({
          title: 'Hata',
          message: 'Sunucudan geçersiz yanıt alındı.',
          type: 'error',
          buttons: []
        }));
        setPurchaseModal({ visible: false, item: null });
        return;
      }

      if (response.ok) {
        const newOwnedPawns = [...ownedPawns, item.id];
        setOwnedPawns(newOwnedPawns);
        
        // AsyncStorage'a kaydet
        try {
          await AsyncStorage.setItem('ownedPawns', JSON.stringify(newOwnedPawns));
          console.log('[SHOP DEBUG] Owned pawns saved to AsyncStorage after purchase:', newOwnedPawns);
        } catch (error) {
          console.error('[SHOP DEBUG] Error saving owned pawns to AsyncStorage after purchase:', error);
        }
        
        dispatch(showAlert({
          title: 'Başarılı!',
          message: `${item.name} satın alındı!`,
          type: 'success',
          buttons: []
        }));
        
        // Kullanıcının puanını güncelle (eğer puan ile satın aldıysa)
        if (item.currency === 'points' && data.newScore !== undefined) {
          // Burada user context'ini güncelleyebiliriz
        }
      } else {
        if (data.error === 'Insufficient points') {
          dispatch(showAlert({
            title: 'Yetersiz Puan',
            message: 'Bu ürünü satın almak için yeterli puanınız yok.',
            type: 'warning',
            buttons: []
          }));
        } else if (data.error === 'Pawn already owned') {
          dispatch(showAlert({
            title: 'Zaten Sahipsiniz',
            message: 'Bu piyona zaten sahipsiniz.',
            type: 'info',
            buttons: []
          }));
        } else {
          dispatch(showAlert({
            title: 'Hata',
            message: data.error || 'Satın alma işlemi başarısız.',
            type: 'error',
            buttons: []
          }));
        }
      }
    } catch (error) {
      console.error('Purchase error:', error);
      dispatch(showAlert({
        title: 'Hata',
        message: 'Satın alma işlemi sırasında bir hata oluştu.',
        type: 'error',
        buttons: []
      }));
    }
    
    setPurchaseModal({ visible: false, item: null });
  };

  const renderCategoryTabs = () => {
    return (
      <View style={styles.categoryTabs}>
        {Object.entries(PAWN_CATEGORIES).map(([key, category]) => (
          <TouchableOpacity
            key={key}
            style={[
              styles.categoryTab,
              selectedCategory === key && styles.activeCategoryTab
            ]}
            onPress={() => setSelectedCategory(key)}
          >
            <Text style={styles.categoryIcon}>{category.icon}</Text>
            <Text style={[
              styles.categoryText,
              selectedCategory === key && styles.activeCategoryText
            ]}>
              {category.name}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  const renderPawnItem = (item) => {
    const isOwned = ownedPawns.includes(item.id);
    const isSelected = selectedPawn === item.id;
    const canAfford = item.currency === 'diamonds' ? diamonds >= item.price : 
                     item.currency === 'points' ? (user?.score || 0) >= item.price : true;
    
    return (
      <TouchableOpacity
        key={item.id}
        style={[
          styles.pawnItem,
          isOwned && styles.ownedPawnItem,
          isSelected && styles.selectedPawnItem,
          !canAfford && !isOwned && styles.unaffordablePawnItem
        ]}
        onPress={() => {
          if (isOwned && !isSelected) {
            handleSelectPawn(item.id);
          } else if (!isOwned) {
            handlePurchase(item);
          }
        }}
        disabled={false}
      >
        <View style={styles.pawnEmojiContainer}>
          {item.isTeam && item.colors ? (
            <View style={styles.brandLogoContainer}>
              {renderTeamColors(item.colors)}
            </View>
          ) : item.isBrand && item.logoType ? (
            <View style={styles.brandLogoContainer}>
              {renderBrandLogo(item.logoType)}
            </View>
          ) : (
            <Text style={styles.pawnEmoji}>{item.emoji}</Text>
          )}
          {isOwned && (
            <View style={styles.ownedBadge}>
              <Ionicons name="checkmark" size={16} color="white" />
            </View>
          )}
          {isSelected && (
            <View style={styles.selectedBadge}>
              <Ionicons name="star" size={16} color="#FFD700" />
            </View>
          )}
        </View>
        
        <Text style={styles.pawnName}>{item.name}</Text>
        
        <View style={styles.priceContainer}>
          {item.currency === 'diamonds' ? (
            <>
              <Ionicons name="diamond" size={16} color="#9C27B0" />
              <Text style={[
                styles.priceText,
                !canAfford && !isOwned && styles.unaffordablePrice
              ]}>
                {item.price}
              </Text>
            </>
          ) : item.currency === 'points' ? (
            <>
              <Ionicons name="trophy" size={16} color="#FFD700" />
              <Text style={[
                styles.priceText,
                !canAfford && !isOwned && styles.unaffordablePrice
              ]}>
                {item.price}
              </Text>
            </>
          ) : (
            <>
              <Ionicons name="card" size={16} color="#4CAF50" />
              <Text style={styles.priceText}>${item.price}</Text>
            </>
          )}
        </View>
        
        {isOwned ? (
          <TouchableOpacity
            style={[
              styles.selectButton,
              isSelected && styles.selectedButton
            ]}
            onPress={() => !isSelected && handleSelectPawn(item.id)}
            disabled={isSelected}
          >
            <Text style={[
              styles.selectButtonText,
              isSelected && styles.selectedButtonText
            ]}>
              {isSelected ? 'Seçili' : 'Seç'}
            </Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={[
              styles.buyButton,
              !canAfford && styles.disabledBuyButton
            ]}
            onPress={() => handlePurchase(item)}
            disabled={!canAfford}
          >
            <Text style={[
              styles.buyButtonText,
              !canAfford && styles.disabledBuyButtonText
            ]}>
              {canAfford ? 'Satın Al' : 'Yetersiz'}
            </Text>
          </TouchableOpacity>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#1a0033', '#330066', '#4d0099']}
        style={styles.gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={24} color="white" />
          </TouchableOpacity>
          
          <View style={styles.headerTitleContainer}>
            <Text style={styles.headerTitle}>Piyon Mağazası</Text>
          </View>

          {/* Elmas Gösterimi */}
          <View style={styles.diamondDisplay}>
            <Ionicons name="diamond" size={20} color="#00D9CC" />
            <Text style={styles.diamondText}>{diamonds}</Text>
          </View>
        </View>

        {/* Elmas Kazanma Butonu */}
        <View style={styles.earnDiamondsContainer}>
          <TouchableOpacity 
            style={styles.earnDiamondsButton}
            onPress={() => router.push('/(auth)/earndiamonds')}
          >
            <Ionicons name="diamond" size={20} color="#FFD700" />
            <Text style={styles.earnDiamondsText}>Elmas Kazan</Text>
            <Ionicons name="chevron-forward" size={16} color="#FFD700" />
          </TouchableOpacity>
        </View>

        {renderCategoryTabs()}

        <Animated.View 
          style={[
            styles.content,
            { opacity: fadeAnim }
          ]}
        >
          <ScrollView 
            style={styles.scrollView}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollViewContent}
          >
            <View style={styles.pawnGrid}>
              {PAWN_CATEGORIES[selectedCategory].items.map(renderPawnItem)}
            </View>
          </ScrollView>
        </Animated.View>

        {/* Satın Alma Modal */}
        <Modal
          visible={purchaseModal.visible}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setPurchaseModal({ visible: false, item: null })}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              {purchaseModal.item && (
                <>
                  <Text style={styles.modalEmoji}>{purchaseModal.item.emoji}</Text>
                  <Text style={styles.modalTitle}>{purchaseModal.item.name}</Text>
                  
                  <View style={styles.modalPriceContainer}>
                    {purchaseModal.item.currency === 'diamonds' ? (
                      <>
                        <Ionicons name="diamond" size={24} color="#FFD700" />
                        <Text style={styles.modalPrice}>{purchaseModal.item.price} Elmas</Text>
                      </>
                    ) : purchaseModal.item.currency === 'points' ? (
                      <>
                        <Ionicons name="trophy" size={24} color="#E61A8D" />
                        <Text style={styles.modalPrice}>{purchaseModal.item.price} Puan</Text>
                      </>
                    ) : (
                      <>
                        <Ionicons name="card" size={24} color="#4CAF50" />
                        <Text style={styles.modalPrice}>${purchaseModal.item.price}</Text>
                      </>
                    )}
                  </View>
                  
                  <Text style={styles.modalDescription}>
                    Bu piyonu satın almak istediğinizden emin misiniz?
                  </Text>
                  
                  <View style={styles.modalButtons}>
                    <TouchableOpacity 
                      style={styles.modalCancelButton}
                      onPress={() => setPurchaseModal({ visible: false, item: null })}
                    >
                      <Text style={styles.modalCancelText}>İptal</Text>
                    </TouchableOpacity>
                    
                    <TouchableOpacity 
                      style={styles.modalConfirmButton}
                      onPress={confirmPurchase}
                    >
                      <Text style={styles.modalConfirmText}>Satın Al</Text>
                    </TouchableOpacity>
                  </View>
                </>
              )}
            </View>
          </View>
        </Modal>

      </LinearGradient>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 20,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  headerTitleContainer: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    color: '#FFD700',
    fontSize: 24,
    fontFamily: 'Poppins_700Bold',
    textShadowColor: 'rgba(255, 215, 0, 0.5)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  diamondDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 217, 204, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(0, 217, 204, 0.4)',
  },
  diamondText: {
    color: '#00D9CC',
    fontSize: 16,
    fontFamily: 'Poppins_600SemiBold',
    marginLeft: 5,
  },
  categoryTabs: {
    flexDirection: 'row',
    paddingHorizontal: 15,
    paddingTop: 10,
    marginBottom: 20,
  },
  categoryTab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
    marginHorizontal: 5,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  activeCategoryTab: {
    backgroundColor: 'rgba(255, 215, 0, 0.2)',
    borderColor: 'rgba(255, 215, 0, 0.4)',
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  categoryIcon: {
    fontSize: 20,
    marginBottom: 4,
  },
  categoryText: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 11,
    fontFamily: 'Poppins_500Medium',
  },
  activeCategoryText: {
    color: '#FFD700',
    fontFamily: 'Poppins_600SemiBold',
  },
  earnDiamondsContainer: {
    paddingHorizontal: 20,
    paddingTop: 10,
    marginBottom: 15,
  },
  earnDiamondsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 215, 0, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.4)',
    borderRadius: 20,
    paddingVertical: 12,
    paddingHorizontal: 20,
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 8,
  },
  earnDiamondsText: {
    color: '#FFD700',
    fontSize: 16,
    fontFamily: 'Poppins_700Bold',
    marginHorizontal: 8,
  },
  content: {
    flex: 1,
    paddingHorizontal: 15,
  },
  scrollView: {
    flex: 1,
  },
  scrollViewContent: {
    paddingBottom: 30,
  },
  pawnGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  pawnItem: {
    width: (width - 45) / 2,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 20,
    padding: 15,
    marginBottom: 15,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  ownedPawnItem: {
    borderColor: '#FFD700',
    backgroundColor: 'rgba(255, 215, 0, 0.1)',
    shadowColor: '#FFD700',
    shadowOpacity: 0.4,
  },
  selectedPawnItem: {
    borderColor: '#FFD700',
    backgroundColor: 'rgba(255, 215, 0, 0.15)',
    borderWidth: 2,
    shadowColor: '#FFD700',
    shadowOpacity: 0.6,
  },
  unaffordablePawnItem: {
    opacity: 0.4,
  },
  pawnEmojiContainer: {
    position: 'relative',
    marginBottom: 12,
  },
  pawnEmoji: {
    fontSize: 45,
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  brandLogoContainer: {
    width: 55,
    height: 55,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  brandLogo: {
    width: 45,
    height: 45,
  },
  ownedBadge: {
    position: 'absolute',
    top: -8,
    right: -8,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#FFD700',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 4,
  },
  selectedBadge: {
    position: 'absolute',
    top: -8,
    left: -8,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#FFD700',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 4,
  },
  pawnName: {
    color: 'white',
    fontSize: 14,
    fontFamily: 'Poppins_600SemiBold',
    textAlign: 'center',
    marginBottom: 8,
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  priceText: {
    color: '#FFD700',
    fontSize: 16,
    fontFamily: 'Poppins_700Bold',
    marginLeft: 5,
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  unaffordablePrice: {
    color: '#FF6B6B',
  },
  buyButton: {
    backgroundColor: 'rgba(255, 215, 0, 0.2)',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.4)',
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  disabledBuyButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  buyButtonText: {
    color: '#FFD700',
    fontSize: 13,
    fontFamily: 'Poppins_600SemiBold',
  },
  disabledBuyButtonText: {
    color: 'rgba(255, 255, 255, 0.4)',
  },
  ownedButton: {
    backgroundColor: 'rgba(255, 215, 0, 0.1)',
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.3)',
  },
  ownedButtonText: {
    color: '#FFD700',
    fontSize: 12,
    fontFamily: 'Poppins_600SemiBold',
  },
  selectButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  selectButtonText: {
    color: 'white',
    fontSize: 12,
    fontFamily: 'Poppins_600SemiBold',
  },
  selectedButton: {
    backgroundColor: 'rgba(255, 215, 0, 0.25)',
    borderColor: 'rgba(255, 215, 0, 0.5)',
  },
  selectedButtonText: {
    color: '#FFD700',
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalContent: {
    backgroundColor: '#2a2a3e',
    borderRadius: 25,
    padding: 25,
    alignItems: 'center',
    width: width * 0.85,
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.3)',
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 15,
    elevation: 10,
  },
  modalEmoji: {
    fontSize: 70,
    marginBottom: 15,
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 4,
  },
  modalTitle: {
    fontSize: 22,
    fontFamily: 'Poppins_700Bold',
    color: '#FFD700',
    marginBottom: 15,
    textAlign: 'center',
  },
  modalPriceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalPrice: {
    fontSize: 20,
    fontFamily: 'Poppins_600SemiBold',
    color: '#FFD700',
    marginLeft: 8,
  },
  modalDescription: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    marginBottom: 25,
    fontFamily: 'Poppins_400Regular',
    lineHeight: 22,
  },
  modalButtons: {
    flexDirection: 'row',
    width: '100%',
  },
  modalCancelButton: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingVertical: 15,
    borderRadius: 15,
    marginRight: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  modalConfirmButton: {
    flex: 1,
    backgroundColor: 'rgba(255, 215, 0, 0.2)',
    paddingVertical: 15,
    borderRadius: 15,
    marginLeft: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.4)',
  },
  modalCancelText: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 16,
    fontFamily: 'Poppins_600SemiBold',
  },
  modalConfirmText: {
    color: '#FFD700',
    fontSize: 16,
    fontFamily: 'Poppins_700Bold',
  },
});

export default ShopScreen;