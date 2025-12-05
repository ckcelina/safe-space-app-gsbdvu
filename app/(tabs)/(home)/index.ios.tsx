
import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Platform, ScrollView, Modal, TouchableOpacity, KeyboardAvoidingView, Alert, TextInput } from 'react-native';
import { router, Redirect } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { useThemeContext } from '@/contexts/ThemeContext';
import { supabase } from '@/lib/supabase';
import { Person } from '@/types/database.types';
import { IconSymbol } from '@/components/IconSymbol';
import { PersonCard } from '@/components/ui/PersonCard';
import { LinearGradient } from 'expo-linear-gradient';

interface PersonWithLastMessage extends Person {
  lastMessage?: string;
  lastMessageTime?: string;
}

export default function HomeScreen() {
  const { currentUser, userId, loading: authLoading } = useAuth();
  const { theme } = useThemeContext();
  const [persons, setPersons] = useState<PersonWithLastMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [name, setName] = useState('');
  const [relationshipType, setRelationshipType] = useState('');
  const [nameError, setNameError] = useState('');
  const [saving, setSaving] = useState(false);

  const fetchPersonsWithLastMessage = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('Fetching persons for user:', userId);
      
      const { data: personsData, error: personsError } = await supabase
        .from('persons')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (personsError) {
        console.error('Error fetching persons:', personsError);
        setError('Failed to load your people. Please try again.');
        setLoading(false);
        return;
      }

      console.log('Persons loaded:', personsData?.length);

      const personsWithMessages = await Promise.all(
        (personsData || []).map(async (person) => {
          const { data: messages } = await supabase
            .from('messages')
            .select('content, created_at, role')
            .eq('user_id', userId)
            .eq('person_id', person.id)
            .order('created_at', { ascending: false })
            .limit(1);

          const lastMessage = messages?.[0];
          return {
            ...person,
            lastMessage: lastMessage?.content || 'No messages yet',
            lastMessageTime: lastMessage?.created_at,
          };
        })
      );

      setPersons(personsWithMessages);
    } catch (error) {
      console.error('Unexpected error fetching persons:', error);
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    if (userId) {
      fetchPersonsWithLastMessage();
    }
  }, [userId, fetchPersonsWithLastMessage]);

  const handleAddPerson = () => {
    setShowAddModal(true);
    setName('');
    setRelationshipType('');
    setNameError('');
  };

  const handleCloseModal = () => {
    setShowAddModal(false);
    setName('');
    setRelationshipType('');
    setNameError('');
  };

  const handleSave = async () => {
    // Validate name
    if (!name.trim()) {
      setNameError('Name is required');
      return;
    }

    setNameError('');
    setSaving(true);

    try {
      console.log('Creating person:', name, relationshipType);
      const { data, error } = await supabase
        .from('persons')
        .insert([
          {
            user_id: userId,
            name: name.trim(),
            relationship_type: relationshipType.trim() || null,
          },
        ])
        .select()
        .single();

      if (error) {
        console.error('Error creating person:', error);
        Alert.alert('Error', 'Failed to add person. Please try again.');
      } else {
        console.log('Person created:', data);
        handleCloseModal();
        // Refresh the list
        await fetchPersonsWithLastMessage();
      }
    } catch (error) {
      console.error('Unexpected error creating person:', error);
      Alert.alert('Error', 'An unexpected error occurred. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handlePersonPress = (person: Person) => {
    router.push({
      pathname: '/(tabs)/(home)/chat',
      params: { 
        personId: person.id, 
        personName: person.name,
        relationshipType: person.relationship_type || ''
      },
    });
  };

  if (authLoading) {
    return (
      <View style={[styles.container, { backgroundColor: theme.background }]}>
        <ActivityIndicator size="large" color={theme.primary} />
      </View>
    );
  }

  if (!currentUser) {
    return <Redirect href="/onboarding" />;
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.headerTitle, { color: theme.textPrimary }]}>Safe Space</Text>
          <Text style={[styles.headerSubtitle, { color: theme.textSecondary }]}>
            Who would you like to talk about today?
          </Text>
        </View>

        {/* Add Person Button */}
        <View style={styles.addButtonContainer}>
          <TouchableOpacity
            onPress={handleAddPerson}
            activeOpacity={0.8}
            style={styles.addButton}
          >
            <LinearGradient
              colors={theme.primaryGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.addButtonGradient}
            >
              <Text style={[styles.addButtonText, { color: theme.buttonText }]}>
                Add Person
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* Error State */}
        {error && (
          <View style={styles.errorContainer}>
            <View style={[styles.errorCard, { backgroundColor: theme.card }]}>
              <IconSymbol
                ios_icon_name="exclamationmark.triangle.fill"
                android_material_icon_name="error"
                size={32}
                color="#FF3B30"
              />
              <Text style={[styles.errorText, { color: theme.textPrimary }]}>{error}</Text>
              <TouchableOpacity
                onPress={fetchPersonsWithLastMessage}
                style={[styles.retryButton, { backgroundColor: theme.primary }]}
                activeOpacity={0.8}
              >
                <Text style={[styles.retryButtonText, { color: theme.buttonText }]}>
                  Try Again
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Persons List */}
        {loading && !error ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={theme.primary} />
          </View>
        ) : !error && persons.length === 0 ? (
          <View style={styles.emptyState}>
            <View style={[styles.emptyIconContainer, { backgroundColor: theme.card }]}>
              <Text style={styles.emptyEmoji}>🤗</Text>
            </View>
            <Text style={[styles.emptyText, { color: theme.textPrimary }]}>No one added yet</Text>
            <Text style={[styles.emptySubtext, { color: theme.textSecondary }]}>
              Tap &apos;Add Person&apos; to start
            </Text>
          </View>
        ) : !error ? (
          <View style={styles.cardList}>
            {persons.map((person, index) => (
              <PersonCard
                key={index}
                person={person}
                onPress={() => handlePersonPress(person)}
              />
            ))}
          </View>
        ) : null}
      </ScrollView>

      {/* Add Person Modal */}
      <Modal
        visible={showAddModal}
        animationType="slide"
        transparent={true}
        onRequestClose={handleCloseModal}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
        >
          <TouchableOpacity
            style={styles.modalBackdrop}
            activeOpacity={1}
            onPress={handleCloseModal}
          />
          <View style={[styles.modalContent, { backgroundColor: theme.card }]}>
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: theme.textPrimary }]}>Add Person</Text>
              <TouchableOpacity onPress={handleCloseModal} style={styles.closeButton}>
                <IconSymbol
                  ios_icon_name="xmark"
                  android_material_icon_name="close"
                  size={24}
                  color={theme.textSecondary}
                />
              </TouchableOpacity>
            </View>

            {/* Modal Body */}
            <ScrollView
              style={styles.modalBody}
              contentContainerStyle={styles.modalBodyContent}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              <Text style={[styles.inputLabel, { color: theme.textPrimary }]}>
                Name <Text style={styles.required}>*</Text>
              </Text>
              <View style={[styles.textInputWrapper, { backgroundColor: theme.background }]}>
                <TextInput
                  style={[styles.textInput, { color: theme.textPrimary }]}
                  placeholder="Enter their name"
                  placeholderTextColor={theme.textSecondary}
                  value={name}
                  onChangeText={(text) => {
                    setName(text);
                    if (nameError && text.trim()) {
                      setNameError('');
                    }
                  }}
                  autoCapitalize="words"
                  autoCorrect={false}
                  maxLength={50}
                />
              </View>
              {nameError ? (
                <Text style={styles.errorTextSmall}>{nameError}</Text>
              ) : null}

              <Text style={[styles.inputLabel, { color: theme.textPrimary }]}>
                Relationship Type
              </Text>
              <View style={[styles.textInputWrapper, { backgroundColor: theme.background }]}>
                <TextInput
                  style={[styles.textInput, { color: theme.textPrimary }]}
                  placeholder="partner, ex, friend, parent..."
                  placeholderTextColor={theme.textSecondary}
                  value={relationshipType}
                  onChangeText={setRelationshipType}
                  autoCapitalize="words"
                  autoCorrect={false}
                  maxLength={50}
                />
              </View>
            </ScrollView>

            {/* Modal Footer */}
            <View style={styles.modalFooter}>
              <TouchableOpacity
                onPress={handleCloseModal}
                style={[styles.secondaryButton, { borderColor: theme.textSecondary }]}
                disabled={saving}
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
                  {saving ? (
                    <ActivityIndicator color={theme.buttonText} />
                  ) : (
                    <Text style={[styles.primaryButtonText, { color: theme.buttonText }]}>
                      Save
                    </Text>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: 20,
    paddingHorizontal: 24,
    paddingBottom: 120,
  },
  header: {
    marginBottom: 24,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 16,
    lineHeight: 22,
  },
  addButtonContainer: {
    marginBottom: 32,
  },
  addButton: {
    borderRadius: 50,
    overflow: 'hidden',
    boxShadow: '0px 4px 12px rgba(0, 0, 0, 0.15)',
    elevation: 6,
  },
  addButtonGradient: {
    paddingVertical: 18,
    paddingHorizontal: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  errorContainer: {
    marginBottom: 24,
  },
  errorCard: {
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.08)',
    elevation: 3,
  },
  errorText: {
    fontSize: 16,
    textAlign: 'center',
    marginTop: 12,
    marginBottom: 16,
    lineHeight: 22,
  },
  retryButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 24,
  },
  retryButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  loadingContainer: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 40,
  },
  emptyIconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.08)',
    elevation: 3,
  },
  emptyEmoji: {
    fontSize: 48,
  },
  emptyText: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  cardList: {
    paddingBottom: 20,
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 20,
    paddingBottom: Platform.OS === 'ios' ? 40 : 20,
    maxHeight: '80%',
    boxShadow: '0px -4px 20px rgba(0, 0, 0, 0.15)',
    elevation: 10,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.1)',
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  closeButton: {
    padding: 4,
  },
  modalBody: {
    flex: 1,
  },
  modalBodyContent: {
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 16,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  required: {
    color: '#FF3B30',
  },
  textInputWrapper: {
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 8,
  },
  textInput: {
    fontSize: 16,
    lineHeight: 20,
  },
  errorTextSmall: {
    color: '#FF3B30',
    fontSize: 12,
    marginBottom: 16,
    marginTop: -4,
  },
  modalFooter: {
    flexDirection: 'row',
    paddingHorizontal: 24,
    paddingTop: 16,
    gap: 12,
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
    fontSize: 16,
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
    fontSize: 16,
    fontWeight: 'bold',
  },
});
