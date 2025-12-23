
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  ActivityIndicator,
  Switch,
} from 'react-native';
import { router } from 'expo-router';
import { SafeSpaceScreen } from '@/components/ui/SafeSpaceScreen';
import { SafeSpaceButton } from '@/components/ui/SafeSpaceButton';
import { useThemeContext } from '@/contexts/ThemeContext';
import { useUserPreferences } from '@/contexts/UserPreferencesContext';
import { AI_TONES, getTonesByCategory } from '@/constants/AITones';
import { IconSymbol } from '@/components/IconSymbol';
import { showSuccessToast, showErrorToast } from '@/utils/toast';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function AIPreferencesOnboardingScreen() {
  const { theme } = useThemeContext();
  const { preferences, updatePreferences } = useUserPreferences();
  
  const [selectedToneId, setSelectedToneId] = useState(preferences.ai_tone_id);
  const [scienceMode, setScienceMode] = useState(preferences.ai_science_mode);
  const [isSaving, setIsSaving] = useState(false);

  const handleContinue = async () => {
    setIsSaving(true);
    
    const result = await updatePreferences({
      ai_tone_id: selectedToneId,
      ai_science_mode: scienceMode,
    });

    setIsSaving(false);

    if (result.success) {
      showSuccessToast('AI preferences saved!');
      router.replace('/(tabs)/(home)');
    } else {
      showErrorToast(result.error || 'Failed to save preferences');
    }
  };

  const handleSkip = () => {
    router.replace('/(tabs)/(home)');
  };

  const gentleTones = getTonesByCategory('gentle');
  const balancedTones = getTonesByCategory('balanced');
  const directTones = getTonesByCategory('direct');

  return (
    <SafeSpaceScreen scrollable={true} keyboardAware={false} useGradient={true}>
      <View style={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.title, { color: theme.buttonText }]}>
            Choose Your AI Style
          </Text>
          <Text style={[styles.subtitle, { color: theme.buttonText }]}>
            Customize how Safe Space communicates with you. You can change this anytime in Settings.
          </Text>
        </View>

        {/* Tone Selection */}
        <View style={[styles.card, { backgroundColor: 'rgba(255, 255, 255, 0.95)' }]}>
          <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>
            AI Tone
          </Text>
          <Text style={[styles.sectionDescription, { color: theme.textSecondary }]}>
            Select the communication style that feels right for you
          </Text>

          <ScrollView 
            style={styles.tonesScrollView}
            showsVerticalScrollIndicator={false}
            nestedScrollEnabled={true}
          >
            {/* Gentle Tones */}
            <Text style={[styles.categoryLabel, { color: theme.textPrimary }]}>
              Gentle & Supportive
            </Text>
            {gentleTones.map((tone) => (
              <TouchableOpacity
                key={tone.id}
                style={[
                  styles.toneCard,
                  {
                    backgroundColor: selectedToneId === tone.id ? theme.primary + '15' : theme.background,
                    borderColor: selectedToneId === tone.id ? theme.primary : theme.textSecondary + '30',
                  },
                ]}
                onPress={() => setSelectedToneId(tone.id)}
                activeOpacity={0.7}
              >
                <View style={styles.toneCardHeader}>
                  <Text
                    style={[
                      styles.toneName,
                      {
                        color: selectedToneId === tone.id ? theme.primary : theme.textPrimary,
                        fontWeight: selectedToneId === tone.id ? '700' : '600',
                      },
                    ]}
                  >
                    {tone.name}
                  </Text>
                  {selectedToneId === tone.id && (
                    <IconSymbol
                      ios_icon_name="checkmark.circle.fill"
                      android_material_icon_name="check_circle"
                      size={20}
                      color={theme.primary}
                    />
                  )}
                </View>
                <Text style={[styles.toneDescription, { color: theme.textSecondary }]}>
                  {tone.description}
                </Text>
              </TouchableOpacity>
            ))}

            {/* Balanced Tones */}
            <Text style={[styles.categoryLabel, { color: theme.textPrimary, marginTop: 16 }]}>
              Balanced & Clear
            </Text>
            {balancedTones.map((tone) => (
              <TouchableOpacity
                key={tone.id}
                style={[
                  styles.toneCard,
                  {
                    backgroundColor: selectedToneId === tone.id ? theme.primary + '15' : theme.background,
                    borderColor: selectedToneId === tone.id ? theme.primary : theme.textSecondary + '30',
                  },
                ]}
                onPress={() => setSelectedToneId(tone.id)}
                activeOpacity={0.7}
              >
                <View style={styles.toneCardHeader}>
                  <Text
                    style={[
                      styles.toneName,
                      {
                        color: selectedToneId === tone.id ? theme.primary : theme.textPrimary,
                        fontWeight: selectedToneId === tone.id ? '700' : '600',
                      },
                    ]}
                  >
                    {tone.name}
                  </Text>
                  {selectedToneId === tone.id && (
                    <IconSymbol
                      ios_icon_name="checkmark.circle.fill"
                      android_material_icon_name="check_circle"
                      size={20}
                      color={theme.primary}
                    />
                  )}
                </View>
                <Text style={[styles.toneDescription, { color: theme.textSecondary }]}>
                  {tone.description}
                </Text>
              </TouchableOpacity>
            ))}

            {/* Direct Tones */}
            <Text style={[styles.categoryLabel, { color: theme.textPrimary, marginTop: 16 }]}>
              Direct & Firm
            </Text>
            {directTones.map((tone) => (
              <TouchableOpacity
                key={tone.id}
                style={[
                  styles.toneCard,
                  {
                    backgroundColor: selectedToneId === tone.id ? theme.primary + '15' : theme.background,
                    borderColor: selectedToneId === tone.id ? theme.primary : theme.textSecondary + '30',
                  },
                ]}
                onPress={() => setSelectedToneId(tone.id)}
                activeOpacity={0.7}
              >
                <View style={styles.toneCardHeader}>
                  <Text
                    style={[
                      styles.toneName,
                      {
                        color: selectedToneId === tone.id ? theme.primary : theme.textPrimary,
                        fontWeight: selectedToneId === tone.id ? '700' : '600',
                      },
                    ]}
                  >
                    {tone.name}
                  </Text>
                  {selectedToneId === tone.id && (
                    <IconSymbol
                      ios_icon_name="checkmark.circle.fill"
                      android_material_icon_name="check_circle"
                      size={20}
                      color={theme.primary}
                    />
                  )}
                </View>
                <Text style={[styles.toneDescription, { color: theme.textSecondary }]}>
                  {tone.description}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Science Mode Toggle */}
        <View style={[styles.card, { backgroundColor: 'rgba(255, 255, 255, 0.95)' }]}>
          <View style={styles.toggleRow}>
            <View style={styles.toggleTextContainer}>
              <Text style={[styles.toggleTitle, { color: theme.textPrimary }]}>
                Science & Resources Mode
              </Text>
              <Text style={[styles.toggleDescription, { color: theme.textSecondary }]}>
                Include psychology research insights and suggested reading when relevant
              </Text>
            </View>
            <Switch
              value={scienceMode}
              onValueChange={setScienceMode}
              trackColor={{ false: theme.textSecondary + '40', true: theme.primary + '60' }}
              thumbColor={scienceMode ? theme.primary : '#f4f3f4'}
              ios_backgroundColor={theme.textSecondary + '40'}
            />
          </View>
        </View>

        {/* Buttons */}
        <View style={styles.buttonContainer}>
          <SafeSpaceButton onPress={handleContinue} loading={isSaving} disabled={isSaving}>
            Continue
          </SafeSpaceButton>

          <TouchableOpacity onPress={handleSkip} disabled={isSaving} activeOpacity={0.7}>
            <Text style={[styles.skipText, { color: theme.buttonText }]}>
              Skip for now
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeSpaceScreen>
  );
}

const styles = StyleSheet.create({
  content: {
    flex: 1,
    paddingVertical: 24,
  },
  header: {
    marginBottom: 24,
    paddingHorizontal: 16,
  },
  title: {
    fontSize: Math.min(SCREEN_WIDTH * 0.08, 32),
    fontWeight: 'bold',
    marginBottom: 12,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: Math.min(SCREEN_WIDTH * 0.04, 16),
    lineHeight: 24,
    textAlign: 'center',
    opacity: 0.9,
  },
  card: {
    borderRadius: 16,
    padding: 20,
    marginHorizontal: 16,
    marginBottom: 16,
    boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.1)',
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 8,
  },
  sectionDescription: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 16,
  },
  tonesScrollView: {
    maxHeight: 400,
  },
  categoryLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
    marginTop: 8,
  },
  toneCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 2,
  },
  toneCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  toneName: {
    fontSize: 16,
    flex: 1,
  },
  toneDescription: {
    fontSize: 14,
    lineHeight: 20,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  toggleTextContainer: {
    flex: 1,
    marginRight: 16,
  },
  toggleTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 6,
  },
  toggleDescription: {
    fontSize: 14,
    lineHeight: 20,
  },
  buttonContainer: {
    paddingHorizontal: 16,
    marginTop: 8,
  },
  skipText: {
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
    marginTop: 16,
    opacity: 0.8,
  },
});
