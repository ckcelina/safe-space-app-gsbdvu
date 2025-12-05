
import React, { ReactNode, useState } from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useThemeContext } from '@/contexts/ThemeContext';

interface SafeSpaceButtonProps {
  children: ReactNode;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline';
  disabled?: boolean;
  loading?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  fullWidth?: boolean;
}

export function SafeSpaceButton({
  children,
  onPress,
  variant = 'primary',
  disabled = false,
  loading = false,
  style,
  textStyle,
  fullWidth = true,
}: SafeSpaceButtonProps) {
  const { colors, theme } = useThemeContext();
  const [isPressed, setIsPressed] = useState(false);

  const getGradientColors = () => {
    // Define gradients based on theme
    switch (theme) {
      case 'ocean-blue':
        return isPressed 
          ? ['#0050B3', '#1890FF'] // Darker when pressed
          : ['#0050B3', '#40A9FF']; // Deep blue → light blue
      case 'soft-rose':
        return isPressed
          ? ['#C41D7F', '#FF69B4'] // Darker when pressed
          : ['#FF69B4', '#FFB6C1']; // Rose pink → soft peach
      case 'forest-green':
        return isPressed
          ? ['#135200', '#228B22'] // Darker when pressed
          : ['#228B22', '#90EE90']; // Rich green → soft mint
      case 'sunny-yellow':
        return isPressed
          ? ['#D97706', '#F59E0B'] // Darker when pressed
          : ['#F59E0B', '#FDE68A']; // Golden yellow → light lemon
      default:
        return isPressed
          ? ['#0050B3', '#1890FF']
          : ['#0050B3', '#40A9FF'];
    }
  };

  const getShadowStyle = () => {
    if (disabled || loading) {
      return {};
    }
    
    return isPressed ? styles.shadowPressed : styles.shadow;
  };

  if (variant === 'primary') {
    return (
      <TouchableOpacity
        onPress={onPress}
        onPressIn={() => setIsPressed(true)}
        onPressOut={() => setIsPressed(false)}
        disabled={disabled || loading}
        activeOpacity={1}
        style={[
          styles.buttonContainer,
          fullWidth && styles.fullWidth,
          getShadowStyle(),
          (disabled || loading) && styles.disabled,
          style,
        ]}
      >
        <LinearGradient
          colors={getGradientColors()}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.gradient}
        >
          {loading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={[styles.primaryText, textStyle]}>{children}</Text>
          )}
        </LinearGradient>
      </TouchableOpacity>
    );
  }

  if (variant === 'outline') {
    return (
      <TouchableOpacity
        onPress={onPress}
        onPressIn={() => setIsPressed(true)}
        onPressOut={() => setIsPressed(false)}
        disabled={disabled || loading}
        activeOpacity={1}
        style={[
          styles.buttonContainer,
          styles.outlineButton,
          { 
            borderColor: colors.primary, 
            backgroundColor: isPressed ? colors.highlight : colors.card 
          },
          fullWidth && styles.fullWidth,
          getShadowStyle(),
          (disabled || loading) && styles.disabled,
          style,
        ]}
      >
        {loading ? (
          <ActivityIndicator color={colors.primary} />
        ) : (
          <Text style={[styles.outlineText, { color: colors.primary }, textStyle]}>
            {children}
          </Text>
        )}
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity
      onPress={onPress}
      onPressIn={() => setIsPressed(true)}
      onPressOut={() => setIsPressed(false)}
      disabled={disabled || loading}
      activeOpacity={1}
      style={[
        styles.buttonContainer,
        styles.secondaryButton,
        { backgroundColor: isPressed ? colors.primary : colors.secondary },
        fullWidth && styles.fullWidth,
        getShadowStyle(),
        (disabled || loading) && styles.disabled,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color="#FFFFFF" />
      ) : (
        <Text style={[styles.primaryText, textStyle]}>{children}</Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  buttonContainer: {
    borderRadius: 50, // Pill shape
    overflow: 'hidden',
    marginBottom: 16,
  },
  fullWidth: {
    width: '100%',
  },
  gradient: {
    paddingVertical: 18,
    paddingHorizontal: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryButton: {
    paddingVertical: 18,
    paddingHorizontal: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  outlineButton: {
    paddingVertical: 18,
    paddingHorizontal: 32,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
  },
  primaryText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  outlineText: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  shadow: {
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
      },
      android: {
        elevation: 6,
      },
      default: {
        boxShadow: '0px 4px 12px rgba(0, 0, 0, 0.15)',
      },
    }),
  },
  shadowPressed: {
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 3,
      },
      default: {
        boxShadow: '0px 2px 6px rgba(0, 0, 0, 0.1)',
      },
    }),
  },
  disabled: {
    opacity: 0.5,
  },
});
