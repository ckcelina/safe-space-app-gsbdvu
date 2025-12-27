
import React, { useState, useRef, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Pressable,
  KeyboardAvoidingView,
  ScrollView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '@/lib/supabase';
import { showErrorToast, showSuccessToast } from '@/utils/toast';
import { Person } from '@/types/database.types';

interface AddPersonSheetProps {
  visible: boolean;
  onClose: () => void;
  onPersonCreated: (newPerson: Person) => void;
  userId: string;
  theme: any;
  insets: any;
}

const AddPersonSheet: React.FC<AddPersonSheetProps> = ({
  visible,
  onClose,
  onPersonCreated,
  userId,
  theme,
  insets,
}) => {
  const [name, setName] = useState('');
  const [relationshipType, setRelationshipType] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [nameFocused, setNameFocused] = useState(false);
  const [relationshipFocused, setRelationshipFocused] = useState(false);

  const scrollRef = useRef<ScrollView>(null);

  // Reset state whenever modal becomes visible
  useEffect(() => {
    if (visible) {
      if (__DEV__) {
        console.log('[AddPersonSheet] Modal opened - resetting state');
      }
      setName('');
      setRelationshipType('');
      setError('');
      setSaving(false);
      setNameFocused(false);
      setRelationshipFocused(false);
    }
  }, [visible]);

  /**
   * FIXED: Handle person creation with duplicate key error handling
   * - If error code 23505 (duplicate constraint), fetch existing person and use it
   * - Uses theme primary color for styling
   * - No console.error for expected duplicate case
   */
  const handleSave = async () => {
    if (__DEV__) {
      console.log('[AddPersonSheet] Save called with name:', name, 'relationship:', relationshipType);
    }

    // Validate name
    if (!name.trim()) {
      if (__DEV__) {
        console.log('[AddPersonSheet] Validation failed - name is empty');
      }
      setError('Name is required');
      return;
    }

    setError('');
    setSaving(true);

    try {
      // Step 1: Resolve userId
      let resolvedUserId = userId;
      if (__DEV__) {
        console.log('[AddPersonSheet] Initial userId from props:', resolvedUserId);
      }

      if (!resolvedUserId) {
        if (__DEV__) {
          console.log('[AddPersonSheet] No userId from props, fetching from supabase.auth.getUser()');
        }
        const { data: authData, error: authErr } = await supabase.auth.getUser();
        
        if (authErr && __DEV__) {
          console.log('[AddPersonSheet] Auth error when fetching user:', authErr);
        }
        
        resolvedUserId = authData?.user?.id;
        if (__DEV__) {
          console.log('[AddPersonSheet] Resolved userId from auth:', resolvedUserId);
        }
      }

      // Step 2: Check if we have a valid userId
      if (!resolvedUserId) {
        if (__DEV__) {
          console.log('[AddPersonSheet] No resolvedUserId available after fallback');
        }
        showErrorToast('Not signed in. Please log in again.');
        setSaving(false);
        return;
      }

      // Step 3: Prepare payload
      const trimmedName = name.trim();
      const trimmedRelationship = relationshipType.trim();
      
      const payload = {
        user_id: resolvedUserId,
        name: trimmedName,
        relationship_type: trimmedRelationship || null,
      };

      if (__DEV__) {
        console.log('[AddPersonSheet] Inserting person with payload:', payload);
      }

      // Step 4: Execute insert with .select().single() to return the inserted row
      const { data, error: insertError } = await supabase
        .from('persons')
        .insert([payload])
        .select()
        .single();

      // Step 5: Handle errors
      if (insertError) {
        // Check for duplicate key error (23505)
        if (insertError.code === '23505') {
          // This is an expected case - person with this name already exists
          if (__DEV__) {
            console.log('[AddPersonSheet] Duplicate person detected (23505), fetching existing person');
          }

          // Fetch the existing person with case-insensitive match
          const { data: existingPersonData, error: existingPersonError } = await supabase
            .from('persons')
            .select('*')
            .eq('user_id', resolvedUserId)
            .ilike('name', trimmedName)
            .limit(1)
            .single();

          if (existingPersonData) {
            // Found the existing person - use it
            if (__DEV__) {
              console.log('[AddPersonSheet] Found existing person:', existingPersonData);
            }

            const existingPerson: Person = {
              ...existingPersonData,
              relationship_type: existingPersonData.relationship_type || null,
            };

            // Call the callback with the existing person
            onPersonCreated(existingPerson);
            
            // Show friendly message
            showSuccessToast('That person already exists — using the existing one.');
            
            // Clear inputs and close
            setName('');
            setRelationshipType('');
            setError('');
            setSaving(false);
            onClose();
            return;
          } else {
            // Couldn't find the existing person (shouldn't happen, but handle it)
            if (__DEV__) {
              console.log('[AddPersonSheet] Duplicate error but could not fetch existing person:', existingPersonError);
            }
            showErrorToast('Couldn\'t save. Please try again.');
            setSaving(false);
            return;
          }
        }

        // For other errors, log and show generic message
        if (__DEV__) {
          console.log('[AddPersonSheet] Supabase insert error:', {
            code: insertError.code,
            message: insertError.message,
            details: insertError.details,
            hint: insertError.hint,
          });
        }

        setSaving(false);
        showErrorToast('Couldn\'t save. Please try again.');
        return;
      }

      // Step 6: Success
      if (__DEV__) {
        console.log('[AddPersonSheet] Person created successfully:', data);
      }
      
      // Ensure the new person has the correct structure
      const newPerson: Person = {
        ...data,
        relationship_type: data.relationship_type || null,
      };
      
      if (__DEV__) {
        console.log('[AddPersonSheet] Calling onPersonCreated with new person:', newPerson);
      }
      showSuccessToast('Person added successfully!');
      
      // Clear inputs
      setName('');
      setRelationshipType('');
      setError('');
      setSaving(false);
      
      // Call the callback to trigger optimistic update in HomeScreen
      onPersonCreated(newPerson);
      
      // Close the sheet
      onClose();
    } catch (error: any) {
      // Log unexpected errors for debugging
      if (__DEV__) {
        console.log('[AddPersonSheet] Unexpected error:', error?.message);
      }

      // Re-enable Save button and keep modal open
      setSaving(false);

      // Show generic user-friendly message
      showErrorToast('Couldn\'t save. Please try again.');
    }
  };

  const handleNameFocus = () => {
    setNameFocused(true);
    requestAnimationFrame(() => {
      scrollRef.current?.scrollTo({ y: 0, animated: true });
    });
  };

  const handleRelationshipFocus = () => {
    setRelationshipFocused(true);
    requestAnimationFrame(() => {
      scrollRef.current?.scrollTo({ y: 120, animated: true });
    });
  };

  // Get primary color from theme with fallback
  const primaryColor = theme?.colors?.primary ?? theme?.primary ?? '#007AFF';

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      presentationStyle="overFullScreen"
      onRequestClose={onClose}
    >
      {/* Backdrop */}
      <Pressable style={styles.backdrop} onPress={onClose}>
        {/* Bottom sheet container */}
        <Pressable
          style={[
            styles.sheetContainer,
            { paddingBottom: insets.bottom || 12 },
          ]}
          onPress={(e) => e.stopPropagation()}
        >
          <KeyboardAvoidingView
            style={styles.keyboardAvoid}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          >
            {/* Header */}
            <View style={styles.header}>
              <Text style={styles.title}>Add Person</Text>
              <TouchableOpacity
                onPress={onClose}
                style={styles.closeButton}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Ionicons name="close" size={28} color="#333" />
              </TouchableOpacity>
            </View>

            {/* Scrollable content */}
            <ScrollView
              ref={scrollRef}
              style={styles.scrollView}
              contentContainerStyle={styles.scrollContent}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              {/* Name field */}
              <View style={styles.fieldContainer}>
                <Text style={styles.label}>Name *</Text>
                <View
                  style={[
                    styles.inputContainer,
                    error ? styles.inputContainerError : null,
                    nameFocused ? { borderColor: primaryColor, backgroundColor: '#FFFFFF' } : null,
                  ]}
                >
                  <TextInput
                    style={styles.input}
                    placeholder="Enter their name"
                    placeholderTextColor="#999"
                    value={name}
                    onChangeText={(text) => {
                      setName(text);
                      if (error && text.trim()) {
                        setError('');
                      }
                    }}
                    autoCapitalize="words"
                    autoCorrect={false}
                    maxLength={100}
                    editable={!saving}
                    returnKeyType="next"
                    onFocus={handleNameFocus}
                    onBlur={() => setNameFocused(false)}
                  />
                </View>
                {error ? <Text style={styles.errorText}>{error}</Text> : null}
              </View>

              {/* Relationship Type field */}
              <View style={styles.fieldContainer}>
                <Text style={styles.label}>Relationship Type (optional)</Text>
                <View
                  style={[
                    styles.inputContainer,
                    relationshipFocused ? { borderColor: primaryColor, backgroundColor: '#FFFFFF' } : null,
                  ]}
                >
                  <TextInput
                    style={styles.input}
                    placeholder="partner, ex, friend, parent..."
                    placeholderTextColor="#999"
                    value={relationshipType}
                    onChangeText={setRelationshipType}
                    autoCapitalize="sentences"
                    autoCorrect={false}
                    maxLength={100}
                    editable={!saving}
                    returnKeyType="done"
                    onSubmitEditing={handleSave}
                    onFocus={handleRelationshipFocus}
                    onBlur={() => setRelationshipFocused(false)}
                  />
                </View>
              </View>
            </ScrollView>

            {/* Footer buttons */}
            <View style={styles.footer}>
              <TouchableOpacity
                onPress={onClose}
                style={styles.cancelButton}
                disabled={saving}
                activeOpacity={0.7}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleSave}
                style={[
                  styles.saveButton,
                  { backgroundColor: primaryColor },
                  (!name.trim() || saving) && styles.saveButtonDisabled,
                ]}
                disabled={saving || !name.trim()}
                activeOpacity={0.8}
              >
                <Text style={styles.saveButtonText}>
                  {saving ? 'Saving...' : 'Save'}
                </Text>
              </TouchableOpacity>
            </View>
          </KeyboardAvoidingView>
        </Pressable>
      </Pressable>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'flex-end',
  },
  sheetContainer: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
  },
  keyboardAvoid: {
    width: '100%',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.08)',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  closeButton: {
    padding: 4,
  },
  scrollView: {
    maxHeight: 400,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 160,
  },
  fieldContainer: {
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  inputContainer: {
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 4,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  inputContainerError: {
    borderColor: '#FF3B30',
  },
  input: {
    fontSize: 16,
    color: '#333',
    paddingVertical: 12,
    minHeight: 44,
  },
  errorText: {
    color: '#FF3B30',
    fontSize: 12,
    marginTop: 6,
    marginLeft: 4,
  },
  footer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 16,
    gap: 12,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E5E5',
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 50,
    borderWidth: 2,
    borderColor: '#999',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
  },
  saveButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveButtonDisabled: {
    backgroundColor: '#CCCCCC',
    opacity: 0.5,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
});

export default AddPersonSheet;
