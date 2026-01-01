
import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  Pressable,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Dimensions,
} from 'react-native';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { useThemeContext } from '@/contexts/ThemeContext';
import { useUserPreferences } from '@/contexts/UserPreferencesContext';
import { IconSymbol } from '@/components/IconSymbol';
import { THERAPIST_PERSONAS, getPersonaById } from '@/constants/TherapistPersonas';
import { showErrorToast, showSuccessToast } from '@/utils/toast';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

interface TherapistPersonaModalProps {
  visible: boolean;
  onClose: () => void;
}

export function TherapistPersonaModal({ visible, onClose }: TherapistPersonaModalProps) {
  const { theme } = useThemeContext();
  const { preferences, updatePreferences } = useUserPreferences();
  const [selectedPersonaId, setSelectedPersonaId] = useState(preferences.therapist_persona_id || '');
  const [isUpdating, setIsUpdating] = useState(false);

  const handleClose = () => {
    setSelectedPersonaId(preferences.therapist_persona_id || '');
    onClose();
  };

  const handleSave = async () => {
    setIsUpdating(true);

    const result = await updatePreferences({
      therapist_persona_id: selectedPersonaId || null,
    });

    setIsUpdating(false);

    if (result.success) {
      showSuccessToast('Therapist updated');
      onClose();
    } else {
      showErrorToast(result.error || 'Failed to update therapist');
    }
  };

  const handleOpenPreview = (personaId: string) => {
    const persona = getPersonaById(personaId);
    if (!persona) {
      console.error('[TherapistPersonaModal] Persona not found:', personaId);
      return;
    }

    onClose();

    setTimeout(() => {
      router.push({
        pathname: '/(tabs)/(home)/communication-style-preview',
        params: {
          therapistPersonaId: persona.id,
          therapistName: persona.name,
          styleLabel: persona.label,
          description: persona.short_description,
        },
      });
    }, 200);
  };

  const renderPersonaCard = (personaId: string) => {
    const persona = getPersonaById(personaId);
    if (!persona) return null;

    const isSelected = selectedPersonaId === persona.id;

    return (
      <Pressable
        key={persona.id}
        style={[
          styles.personaCard,
          {
            backgroundColor: isSelected ? theme.primary + '15' : theme.background,
            borderColor: isSelected ? theme.primary : theme.textSecondary + '30',
          },
        ]}
        onPress={() => setSelectedPersonaId(persona.id)}
        hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
      >
        <View style={styles.personaCardTouchable}>
          <Image
            source={persona.image}
            style={styles.personaImage}
            contentFit="cover"
            cachePolicy="memory-disk"
            priority="high"
            transition={0}
          />
          <View style={styles.personaCardContent}>
            <View style={styles.personaCardHeader}>
              <View style={{ flex: 1 }}>
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
              {persona.short_description}
            </Text>
          </View>
        </View>
        
        <Pressable
          style={[styles.previewButton, { borderColor: theme.primary }]}
          onPress={(e) => {
            e.stopPropagation();
            handleOpenPreview(persona.id);
          }}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <IconSymbol
            ios_icon_name="eye.fill"
            android_material_icon_name="visibility"
            size={16}
            color={theme.primary}
          />
          <Text style={[styles.previewButtonText, { color: theme.primary }]}>
            Preview style
          </Text>
        </Pressable>
      </Pressable>
    );
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={handleClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.modalOverlay}
      >
        <Pressable style={{ flex: 1 }} onPress={handleClose}>
          <Pressable 
            style={[styles.modalContent, { backgroundColor: '#FFFFFF', maxHeight: SCREEN_HEIGHT * 0.85 }]}
            onPress={(e) => e.stopPropagation()}
          >
            <View style={styles.modalIconContainer}>
              <IconSymbol
                ios_icon_name="person.circle.fill"
                android_material_icon_name="account_circle"
                size={48}
                color={theme.primary}
              />
            </View>

            <Text style={[styles.modalTitle, { color: theme.textPrimary }]}>
              Choose a Communication Style
            </Text>

            <Text style={[styles.modalText, { color: theme.textSecondary }]}>
              Pick a style that feels comfortable. This is optional and you can change it anytime.
            </Text>

            <ScrollView 
              style={styles.personaScrollView}
              contentContainerStyle={{ paddingBottom: 16 }}
              showsVerticalScrollIndicator={true}
              keyboardShouldPersistTaps="handled"
              keyboardDismissMode="on-drag"
            >
              {THERAPIST_PERSONAS.map((persona) => renderPersonaCard(persona.id))}
            </ScrollView>

            <View style={styles.modalButtons}>
              <Pressable
                style={[styles.modalButtonHalf, styles.cancelButton, { borderColor: theme.textSecondary }]}
                onPress={handleClose}
                disabled={isUpdating}
                hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
              >
                <Text style={[styles.cancelButtonText, { color: theme.textSecondary }]}>
                  Cancel
                </Text>
              </Pressable>

              <Pressable
                style={[styles.modalButtonHalf, { backgroundColor: theme.primary }]}
                onPress={handleSave}
                disabled={isUpdating}
                hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
              >
                {isUpdating ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={styles.modalButtonText}>Save</Text>
                )}
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: '5%',
  },
  modalContent: {
    borderRadius: 20,
    padding: '8%',
    width: '100%',
    maxWidth: 400,
    boxShadow: '0px 4px 16px rgba(0, 0, 0, 0.2)',
    elevation: 5,
  },
  modalIconContainer: {
    alignItems: 'center',
    marginBottom: '5%',
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 12,
  },
  modalText: {
    fontSize: 16,
    lineHeight: 24,
    textAlign: 'center',
    marginBottom: '7%',
  },
  personaScrollView: {
    maxHeight: SCREEN_HEIGHT * 0.5,
    marginBottom: 16,
  },
  personaCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 2,
  },
  personaCardTouchable: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  personaImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginRight: 16,
  },
  personaCardContent: {
    flex: 1,
  },
  personaCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  personaName: {
    fontSize: 18,
    marginBottom: 4,
  },
  personaLabel: {
    fontSize: 14,
    fontWeight: '500',
  },
  personaDescription: {
    fontSize: 14,
    lineHeight: 20,
  },
  previewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1.5,
    marginTop: 12,
    gap: 6,
  },
  previewButtonText: {
    fontSize: 13,
    fontWeight: '600',
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  modalButtonHalf: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButton: {
    backgroundColor: 'transparent',
    borderWidth: 2,
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  modalButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
