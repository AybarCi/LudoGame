import React from 'react';
import Svg, { Circle, Path, Text as SvgText, Line, Rect } from 'react-native-svg';

export const BrandLogo = ({ type, size = 40 }) => {
  const logoProps = { width: size, height: size, viewBox: '0 0 40 40' };
  switch (type) {
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
          <Circle cx="20" cy="20" r="18" fill="#8B0000" stroke="#FFFFFF" strokeWidth="2" />
          <Circle cx="20" cy="20" r="14" fill="none" stroke="#FFFFFF" strokeWidth="2" />
          <Path d="M10 20 L20 10 L30 20 L20 30 Z" fill="#FFFFFF" />
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

export default BrandLogo;