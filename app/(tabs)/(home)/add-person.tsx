
import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, Platform, TouchableOpacity, TextInput, ScrollView, Dimensions, KeyboardAvoidingView } from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '@/contexts/AuthContext';
import { useThemeContext } from '@/contexts/ThemeContext';
import { supabase } from '@/lib/supabase';
import { SafeSpaceScreen } from '@/components/ui/SafeSpaceScreen';
import { IconSymbol } from '@/components/IconSymbol';
import { showErrorToast, showSuccessToast } from '@/utils/toast';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function AddPersonScreen() {
  const { userId } = useAuth();
  const { theme } = useThemeContext();
  const insets = useSafeAreaInsets();
  const scrollRef = useRef<ScrollView>(null);
  const [name, setName] = useState('');
  const [relationshipType, setRelationshipType] = useState('');
  const [nameError, setNameError] = useState('');
  const [saving, setSaving] = useState(false);
  
  // Focus states for clear visual feedback
  const [nameFocused, setNameFocused] = useState(false);
  const [relationshipFocused, setRelationshipFocused] = useState(false);

  /**
   * FIXED: Handle person creation with duplicate name error detection
   * - Detects Supabase error code 23505 (unique constraint violation)
   * - Shows user-friendly inline error message
   * - Keeps the screen open for editing
   * - Minimizes error logging in production
   */
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
        // Check for duplicate name error (error code 23505)
        if (error.code === '23505') {
          console.log('[AddPerson] Duplicate name detected');
          
          // Show user-friendly inline error message
          setNameError('You already have someone with this name. Try adding a nickname or different label.');
          
          // Re-enable Save button and keep screen open
          setSaving(false);
          return;
        }

        // Log technical error details for debugging (minimal in production)
        if (process.env.NODE_ENV === 'development') {
          console.error('[AddPerson] Error creating person:', error);
        } else {
          console.error('[AddPerson] Insert error:', error.code);
        }

        showErrorToast('Failed to add person. Please try again.');
        setSaving(false);
        return;
      }

      console.log('[AddPerson] Person created successfully:', data);
      showSuccessToast('Person added successfully!');
      
      router.back();
    } catch (error: any) {
      // Log unexpected errors (minimal in production)
      if (process.env.NODE_ENV === 'development') {
        console.error('[AddPerson] Unexpected error creating person:', error);
      } else {
        console.error('[AddPerson] Unexpected error');
      }

      showErrorToast('An unexpected error occurred');
      setSaving(false);
    }
  };

  return (
    <SafeSpaceScreen scrollable={false} keyboardAware={false}>
      <KeyboardAvoidingView 
        style={{ flex: 1 }} 
        behavior={Platform.OS === 'ios' ? 'padding' : undefined} 
        keyboardVerticalOffset={insets.top + 80}
      >
        <View style={styles.container}>
          {/* Header */}
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

          {/* Scrollable Content */}
          <ScrollView
            ref={scrollRef}
            style={styles.scrollView}
            contentContainerStyle={[
              styles.scrollContent,
              { paddingBottom: (insets.bottom || 12) + 220 }
            ]}
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
              {/* Name Field */}
              <View style={styles.fieldContainer}>
                <Text style={[styles.inputLabel, { color: theme.textPrimary }]}>
                  Name <Text style={styles.required}>*</Text>
                </Text>
                <View style={[
                  styles.textInputWrapper, 
                  { 
                    backgroundColor: theme.background, 
                    borderWidth: nameFocused ? 2 : 1.5, 
                    borderColor: nameError 
                      ? '#FF3B30' 
                      : nameFocused 
                        ? theme.primary 
                        : theme.textSecondary + '40'
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
                    onFocus={() => {
                      setNameFocused(true);
                      requestAnimationFrame(() => scrollRef.current?.scrollTo({ y: 0, animated: true }));
                    }}
                    onBlur={() => setNameFocused(false)}
                    autoCapitalize="words"
                    autoCorrect={false}
                    maxLength={50}
                    editable={!saving}
                    returnKeyType="next"
                    autoFocus={false}
                    cursorColor={theme.primary}
                    selectionColor={Platform.OS === 'ios' ? theme.primary : theme.primary + '40'}
                  />
                </View>
                {nameError ? (
                  <Text style={styles.errorTextSmall}>{nameError}</Text>
                ) : null}
              </View>

              {/* Relationship Type Field */}
              <View style={styles.fieldContainer}>
                <Text style={[styles.inputLabel, { color: theme.textPrimary }]}>
                  Relationship Type
                </Text>
                <View style={[
                  styles.textInputWrapper, 
                  { 
                    backgroundColor: theme.background, 
                    borderWidth: relationshipFocused ? 2 : 1.5, 
                    borderColor: relationshipFocused 
                      ? theme.primary 
                      : theme.textSecondary + '40'
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
                    onFocus={() => {
                      setRelationshipFocused(true);
                      requestAnimationFrame(() => scrollRef.current?.scrollTo({ y: 140, animated: true }));
                    }}
                    onBlur={() => setRelationshipFocused(false)}
                    autoCapitalize="words"
                    autoCorrect={false}
                    maxLength={50}
                    editable={!saving}
                    returnKeyType="done"
                    onSubmitEditing={handleSave}
                    autoFocus={false}
                    cursorColor={theme.primary}
                    selectionColor={Platform.OS === 'ios' ? theme.primary : theme.primary + '40'}
                  />
                </View>
              </View>
            </View>
          </ScrollView>

          {/* Footer Buttons - sits directly above keyboard, NO extra padding */}
          <View style={[
            styles.footer, 
            { 
              paddingBottom: insets.bottom || 12,
              backgroundColor: theme.card,
            }
          ]}>
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
    paddingVertical: Platform.OS === 'ios' ? 16 : 14,
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
    fontWeight: '500',
  },
  footer: {
    flexDirection: 'row',
    paddingHorizontal: '5%',
    paddingTop: 12,
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
