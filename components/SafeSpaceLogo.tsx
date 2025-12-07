
import React from 'react';
import Svg, { Path, Circle } from 'react-native-svg';

interface SafeSpaceLogoProps {
  size?: number;
  color?: string;
}

export function SafeSpaceLogo({ size = 64, color = '#1890FF' }: SafeSpaceLogoProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 100 100" fill="none">
      {/* Chat bubble body */}
      <Path
        d="M50 10 C 25 10, 10 25, 10 45 C 10 65, 25 80, 50 80 C 55 80, 60 79, 64 77 L 75 85 C 76 86, 77 86, 78 85 C 79 84, 79 83, 78 82 L 70 72 C 80 65, 90 56, 90 45 C 90 25, 75 10, 50 10 Z"
        fill={color}
        opacity={0.95}
      />
      
      {/* Left eye (dot) */}
      <Circle
        cx="35"
        cy="40"
        r="4"
        fill="#FFFFFF"
      />
      
      {/* Right eye (dot) */}
      <Circle
        cx="65"
        cy="40"
        r="4"
        fill="#FFFFFF"
      />
      
      {/* Heart-shaped nose */}
      <Path
        d="M 50 52 C 48 50, 45 50, 43 52 C 41 54, 41 56, 43 58 L 50 65 L 57 58 C 59 56, 59 54, 57 52 C 55 50, 52 50, 50 52 Z"
        fill="#FFFFFF"
      />
    </Svg>
  );
}
