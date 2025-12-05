
import { StyleSheet, ViewStyle, TextStyle } from 'react-native';

// Ocean Blue Theme
export const colors = {
  background: '#E6F7FF',
  text: '#001529',
  textSecondary: '#595959',
  primary: '#1890FF',
  secondary: '#40A9FF',
  accent: '#69C0FF',
  card: '#FFFFFF',
  highlight: '#BAE7FF',
};

// Soft Rose Theme
export const softRoseColors = {
  background: '#FFF0F5',
  text: '#4A1F2F',
  textSecondary: '#8B5A6B',
  primary: '#FF69B4',
  secondary: '#FFB6C1',
  accent: '#FFC0CB',
  card: '#FFFFFF',
  highlight: '#FFE4E1',
};

// Forest Green Theme
export const forestGreenColors = {
  background: '#F0F8F0',
  text: '#1B4D1B',
  textSecondary: '#4A7C4A',
  primary: '#228B22',
  secondary: '#32CD32',
  accent: '#90EE90',
  card: '#FFFFFF',
  highlight: '#E8F5E8',
};

// Sunny Yellow Theme
export const sunnyYellowColors = {
  background: '#FFFBEA',
  text: '#5C4A1A',
  textSecondary: '#8B7355',
  primary: '#F59E0B',
  secondary: '#FBBF24',
  accent: '#FCD34D',
  card: '#FFFFFF',
  highlight: '#FEF3C7',
};

export const buttonStyles = StyleSheet.create({
  instructionsButton: {
    backgroundColor: colors.primary,
    alignSelf: 'center',
    width: '100%',
  },
  backButton: {
    backgroundColor: colors.secondary,
    alignSelf: 'center',
    width: '100%',
  },
});

export const commonStyles = StyleSheet.create({
  wrapper: {
    backgroundColor: colors.background,
    width: '100%',
    height: '100%',
  },
  container: {
    flex: 1,
    backgroundColor: colors.background,
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    maxWidth: 800,
    width: '100%',
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    textAlign: 'center',
    color: colors.text,
    marginBottom: 10
  },
  text: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.text,
    marginBottom: 8,
    lineHeight: 24,
    textAlign: 'center',
  },
  section: {
    width: '100%',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  buttonContainer: {
    width: '100%',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  card: {
    backgroundColor: colors.card,
    borderColor: colors.accent,
    borderWidth: 1,
    borderRadius: 10,
    padding: 10,
    marginVertical: 8,
    width: '100%',
    boxShadow: '0px 2px 3px rgba(0, 0, 0, 0.1)',
    elevation: 2,
  },
  icon: {
    width: 60,
    height: 60,
    tintColor: colors.primary,
  },
});
