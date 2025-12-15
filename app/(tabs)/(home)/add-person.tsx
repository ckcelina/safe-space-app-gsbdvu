
import React, { useState } from 'react';
import { View, Text, StyleSheet, Platform, TouchableOpacity, TextInput, KeyboardAvoidingView, ScrollView, Dimensions } from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '@/contexts/AuthContext';
import { useThemeContext } from '@/contexts/ThemeContext';
import { supabase } from '@/lib/supabase';
import { SafeSpaceScreen } from '@/components/ui/SafeSpaceScreen';
import { IconSymbol } from '@/components/IconSymbol';
import { showErrorToast, showSuccessToast } from '@/utils/toast';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

export default function AddPersonScreen() {
  const { userId } = useAuth();
  const { theme } = useThemeContext();
  const insets = useSafeAreaInsets();
  const [name, setName] = useState('');
  const [relationshipType, setRelationshipType] = useState('');
  const [nameError, setNameError] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    console.log('[AddPerson] handleSave called with name:', name, 'relationshipType:', relationshipType);
    
    if (!name.trim()) {
      console.log('[AddPerson] Name validation failed - name is empty');
      setNameError('Name is required');
      return;
    }

    if (!userId) {
      console.error('[AddPerson] No userId available');
      showErrorToast('You must be logged in to add a person');
      return;
    }

    console.log('[AddPerson] Starting save process for userId:', userId);
    setNameError('');
    setSaving(true);

    try {
      const personData = {
        user_id: userId,
        name: name.trim(),
        relationship_type: relationshipType.trim() || null,
      };
      
      console.log('[AddPerson] Inserting person data:', personData);
      
      const { data, error } = await supabase
        .from('persons')
        .insert([personData])
        .select()
        .single();

      if (error) {
        console.error('[AddPerson] Error creating person:', error);
        showErrorToast('Failed to add person. Please try again.');
        setSaving(false);
        return;
      }

      console.log('[AddPerson] Person created successfully:', data);
      showSuccessToast('Person added successfully!');
      
      router.back();
    } catch (error: any) {
      console.error('[AddPerson] Unexpected error creating person:', error);
      showErrorToast('An unexpected error occurred');
      setSaving(false);
    }
  };

  // Calculate responsive dimensions
  const headerHeight = Platform.OS === 'android' ? 60 : 44;
  const keyboardVerticalOffset = Platform.OS === 'ios' ? insets.top + headerHeight : 0;

  return (
    <SafeSpaceScreen scrollable={false} keyboardAware={false}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
        keyboardVerticalOffset={keyboardVerticalOffset}
      >
        <View style={[styles.header, { paddingTop: Platform.OS === 'android' ? insets.top + 16 : insets.top }]}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <IconSymbol
              ios_icon_name="chevron.left"
              android_material_icon_name="arrow_back"
              size={24}
              color={theme.textPrimary}
            />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: theme.textPrimary }]}>Add Person</Text>
          <View style={styles.headerSpacer} />
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Text style={[styles.title, { color: theme.textPrimary }]}>
            Who would you like to add?
          </Text>

          <Text style={[styles.description, { color: theme.textSecondary }]}>
            Add someone you&apos;d like to talk about in your Safe Space. This could be a friend,
            family member, colleague, or anyone else.
          </Text>

          <View style={styles.form}>
            <View style={styles.fieldContainer}>
              <Text style={[styles.inputLabel, { color: theme.textPrimary }]}>
                Name <Text style={styles.required}>*</Text>
              </Text>
              <View style={[
                styles.textInputWrapper, 
                { 
                  backgroundColor: theme.background, 
                  borderWidth: 1, 
                  borderColor: nameError ? '#FF3B30' : 'rgba(0, 0, 0, 0.1)' 
                }
              ]}>
                <TextInput
                  style={[styles.textInput, { color: theme.textPrimary }]}
                  placeholder="Enter their name"
                  placeholderTextColor={theme.textSecondary}
                  value={name}
                  onChangeText={(text) => {
                    console.log('[AddPerson] Name changed to:', text);
                    setName(text);
                    if (nameError && text.trim()) {
                      setNameError('');
                    }
                  }}
                  autoCapitalize="words"
                  autoCorrect={false}
                  maxLength={50}
                  editable={!saving}
                  returnKeyType="next"
                />
              </View>
              {nameError ? (
                <Text style={styles.errorTextSmall}>{nameError}</Text>
              ) : null}
            </View>

            <View style={styles.fieldContainer}>
              <Text style={[styles.inputLabel, { color: theme.textPrimary }]}>
                Relationship Type
              </Text>
              <View style={[
                styles.textInputWrapper, 
                { 
                  backgroundColor: theme.background, 
                  borderWidth: 1, 
                  borderColor: 'rgba(0, 0, 0, 0.1)' 
                }
              ]}>
                <TextInput
                  style={[styles.textInput, { color: theme.textPrimary }]}
                  placeholder="partner, ex, friend, parent..."
                  placeholderTextColor={theme.textSecondary}
                  value={relationshipType}
                  onChangeText={(text) => {
                    console.log('[AddPerson] Relationship type changed to:', text);
                    setRelationshipType(text);
                  }}
                  autoCapitalize="words"
                  autoCorrect={false}
                  maxLength={50}
                  editable={!saving}
                  returnKeyType="done"
                  onSubmitEditing={handleSave}
                />
              </View>
            </View>
          </View>

          <View style={styles.bottomSpacer} />
        </ScrollView>

        <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 16) }]}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={[styles.secondaryButton, { borderColor: theme.textSecondary }]}
            disabled={saving}
            activeOpacity={0.7}
          >
            <Text style={[styles.secondaryButtonText, { color: theme.textSecondary }]}>
              Cancel
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleSave}
            style={styles.primaryButton}
            disabled={saving}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={theme.primaryGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.primaryButtonGradient}
            >
              <Text style={[styles.primaryButtonText, { color: theme.buttonText }]}>
                {saving ? 'Saving...' : 'Save'}
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeSpaceScreen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: '5%',
    paddingBottom: 16,
  },
  backButton: {
    padding: 8,
    marginLeft: -8,
  },
  headerTitle: {
    fontSize: Math.min(SCREEN_WIDTH * 0.045, 18),
    fontWeight: '600',
  },
  headerSpacer: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: '5%',
    paddingBottom: 24,
  },
  title: {
    fontSize: Math.min(SCREEN_WIDTH * 0.07, 28),
    fontWeight: 'bold',
    marginBottom: 12,
  },
  description: {
    fontSize: Math.min(SCREEN_WIDTH * 0.04, 16),
    lineHeight: 22,
    marginBottom: 32,
  },
  form: {
    flex: 1,
  },
  fieldContainer: {
    marginBottom: 24,
  },
  inputLabel: {
    fontSize: Math.min(SCREEN_WIDTH * 0.04, 16),
    fontWeight: '600',
    marginBottom: 8,
  },
  required: {
    color: '#FF3B30',
  },
  textInputWrapper: {
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: Platform.OS === 'ios' ? 14 : 12,
  },
  textInput: {
    fontSize: Math.min(SCREEN_WIDTH * 0.04, 16),
    lineHeight: 20,
    minHeight: 20,
  },
  errorTextSmall: {
    color: '#FF3B30',
    fontSize: 12,
    marginTop: 6,
  },
  bottomSpacer: {
    height: 40,
  },
  footer: {
    flexDirection: 'row',
    paddingHorizontal: '5%',
    paddingTop: 16,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.1)',
  },
  secondaryButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 50,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryButtonText: {
    fontSize: Math.min(SCREEN_WIDTH * 0.04, 16),
    fontWeight: '600',
  },
  primaryButton: {
    flex: 1,
    borderRadius: 50,
    overflow: 'hidden',
  },
  primaryButtonGradient: {
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButtonText: {
    fontSize: Math.min(SCREEN_WIDTH * 0.04, 16),
    fontWeight: 'bold',
  },
});
