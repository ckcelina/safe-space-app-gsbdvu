
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
  Image,
} from 'react-native';
import { router } from 'expo-router';
import { SafeSpaceScreen } from '@/components/ui/SafeSpaceScreen';
import { SafeSpaceButton } from '@/components/ui/SafeSpaceButton';
import { useThemeContext } from '@/contexts/ThemeContext';
import { useUserPreferences } from '@/contexts/UserPreferencesContext';
import { getToneById } from '@/constants/AITones';
import { THERAPIST_PERSONAS } from '@/constants/TherapistPersonas';
import { IconSymbol } from '@/components/IconSymbol';
import { showSuccessToast, showErrorToast } from '@/utils/toast';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Primary tones (visible by default)
const PRIMARY_TONE_IDS = [
  'warm_hug',           // Warm & Supportive
  'balanced_blend',     // Balanced & Clear
  'mirror_mode',        // Reflective
  'calm_direct',        // Calm & Direct
  'reality_check',      // Reality Check
  'accountability_partner', // Goal Support
];

// Advanced tones (collapsed by default)
const ADVANCED_TONE_IDS = [
  'systems_thinker',
  'attachment_aware',
  'cognitive_clarity',
  'conflict_mediator',
  'tough_love',
  'straight_shooter',
  'executive_summary',
  'no_nonsense',
  'pattern_breaker',
  'boundary_enforcer',
  'detective',
  'therapy_room',
  'nurturing_parent',
  'best_friend',
  'soft_truth',
];

export default function AIPreferencesOnboardingScreen() {
  const { theme } = useThemeContext();
  const { preferences, updatePreferences } = useUserPreferences();
  
  const [selectedToneId, setSelectedToneId] = useState(preferences.ai_tone_id);
  const [selectedPersonaId, setSelectedPersonaId] = useState(preferences.therapist_persona_id || null);
  const [scienceMode, setScienceMode] = useState(preferences.ai_science_mode);
  const [isSaving, setIsSaving] = useState(false);
  const [showAdvancedStyles, setShowAdvancedStyles] = useState(false);

  const handleContinue = async () => {
    setIsSaving(true);
    
    const result = await updatePreferences({
      ai_tone_id: selectedToneId,
      therapist_persona_id: selectedPersonaId || undefined,
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

  const renderPersonaCard = (persona: typeof THERAPIST_PERSONAS[0]) => {
    const isSelected = selectedPersonaId === persona.id;

    return (
      <TouchableOpacity
        key={persona.id}
        style={[
          styles.personaCard,
          {
            backgroundColor: isSelected ? theme.primary + '15' : theme.background,
            borderColor: isSelected ? theme.primary : theme.textSecondary + '30',
          },
        ]}
        onPress={() => setSelectedPersonaId(persona.id)}
        activeOpacity={0.7}
      >
        <View style={styles.personaImageContainer}>
          <Image
            source={persona.image}
            style={styles.personaImage}
            resizeMode="cover"
          />
        </View>
        <View style={styles.personaContent}>
          <View style={styles.personaHeader}>
            <View style={styles.personaTextContainer}>
              <Text
                style={[
                  styles.personaName,
                  {
                    color: isSelected ? theme.primary : theme.textPrimary,
                    fontWeight: isSelected ? '700' : '600',
                  },
                ]}
              >
                {persona.name}
              </Text>
              <Text
                style={[
                  styles.personaLabel,
                  {
                    color: isSelected ? theme.primary : theme.textSecondary,
                  },
                ]}
              >
                {persona.label}
              </Text>
            </View>
            {isSelected && (
              <IconSymbol
                ios_icon_name="checkmark.circle.fill"
                android_material_icon_name="check_circle"
                size={24}
                color={theme.primary}
              />
            )}
          </View>
          <Text style={[styles.personaDescription, { color: theme.textSecondary }]}>
            {persona.long_description}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  const renderToneCard = (toneId: string) => {
    const tone = getToneById(toneId);
    if (!tone) return null;

    return (
      <TouchableOpacity
        key={tone.toneId}
        style={[
          styles.toneCard,
          {
            backgroundColor: selectedToneId === tone.toneId ? theme.primary + '15' : theme.background,
            borderColor: selectedToneId === tone.toneId ? theme.primary : theme.textSecondary + '30',
          },
        ]}
        onPress={() => setSelectedToneId(tone.toneId)}
        activeOpacity={0.7}
      >
        <View style={styles.toneCardHeader}>
          <Text
            style={[
              styles.toneName,
              {
                color: selectedToneId === tone.toneId ? theme.primary : theme.textPrimary,
                fontWeight: selectedToneId === tone.toneId ? '700' : '600',
              },
            ]}
          >
            {tone.displayName}
          </Text>
          {selectedToneId === tone.toneId && (
            <IconSymbol
              ios_icon_name="checkmark.circle.fill"
              android_material_icon_name="check_circle"
              size={20}
              color={theme.primary}
            />
          )}
        </View>
        <Text style={[styles.toneDescription, { color: theme.textSecondary }]}>
          {tone.shortDescription}
        </Text>
      </TouchableOpacity>
    );
  };

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

        {/* Therapist Persona Selection */}
        <View style={[styles.card, { backgroundColor: 'rgba(255, 255, 255, 0.95)' }]}>
          <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>
            Choose Your Guide
          </Text>
          <Text style={[styles.sectionDescription, { color: theme.textSecondary }]}>
            Select a therapist persona to guide your conversations
          </Text>

          <View style={styles.personasContainer}>
            {THERAPIST_PERSONAS.map((persona) => renderPersonaCard(persona))}
          </View>

          {selectedPersonaId && (
            <TouchableOpacity
              style={styles.clearPersonaButton}
              onPress={() => setSelectedPersonaId(null)}
              activeOpacity={0.7}
            >
              <Text style={[styles.clearPersonaText, { color: theme.textSecondary }]}>
                Clear selection (use default AI)
              </Text>
            </TouchableOpacity>
          )}
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
            {/* Primary Tones */}
            {PRIMARY_TONE_IDS.map((toneId) => renderToneCard(toneId))}

            {/* Advanced Styles Section */}
            <TouchableOpacity
              style={[
                styles.advancedStylesToggle,
                {
                  backgroundColor: theme.background,
                  borderColor: theme.textSecondary + '30',
                },
              ]}
              onPress={() => setShowAdvancedStyles(!showAdvancedStyles)}
              activeOpacity={0.7}
            >
              <Text style={[styles.advancedStylesText, { color: theme.textPrimary }]}>
                Advanced Styles
              </Text>
              <IconSymbol
                ios_icon_name={showAdvancedStyles ? 'chevron.up' : 'chevron.down'}
                android_material_icon_name={showAdvancedStyles ? 'expand_less' : 'expand_more'}
                size={20}
                color={theme.textSecondary}
              />
            </TouchableOpacity>

            {/* Advanced Tones (conditionally rendered) */}
            {showAdvancedStyles && (
              <View style={styles.advancedStylesContainer}>
                {ADVANCED_TONE_IDS.map((toneId) => renderToneCard(toneId))}
              </View>
            )}
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
  personasContainer: {
    gap: 12,
  },
  personaCard: {
    borderRadius: 12,
    padding: 16,
    borderWidth: 2,
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  personaImageContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    overflow: 'hidden',
    marginRight: 16,
  },
  personaImage: {
    width: '100%',
    height: '100%',
  },
  personaContent: {
    flex: 1,
  },
  personaHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  personaTextContainer: {
    flex: 1,
  },
  personaName: {
    fontSize: 18,
    marginBottom: 4,
  },
  personaLabel: {
    fontSize: 14,
    fontWeight: '600',
  },
  personaDescription: {
    fontSize: 14,
    lineHeight: 20,
  },
  clearPersonaButton: {
    marginTop: 12,
    paddingVertical: 8,
    alignItems: 'center',
  },
  clearPersonaText: {
    fontSize: 14,
    fontWeight: '600',
  },
  tonesScrollView: {
    maxHeight: 400,
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
  advancedStylesToggle: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 14,
    borderRadius: 10,
    borderWidth: 1.5,
    marginTop: 8,
    marginBottom: 10,
  },
  advancedStylesText: {
    fontSize: 15,
    fontWeight: '600',
  },
  advancedStylesContainer: {
    marginTop: 4,
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
