
import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, KeyboardAvoidingView, Platform, TextInput } from 'react-native';
import { router, Redirect } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '@/contexts/AuthContext';
import { useThemeContext } from '@/contexts/ThemeContext';
import { supabase } from '@/lib/supabase';
import { Person } from '@/types/database.types';
import { IconSymbol } from '@/components/IconSymbol';
import { PersonCard } from '@/components/ui/PersonCard';
import { LoadingOverlay } from '@/components/ui/LoadingOverlay';
import { StatusBarGradient } from '@/components/ui/StatusBarGradient';
import { SwipeableModal } from '@/components/ui/SwipeableModal';
import { SwipeableCenterModal } from '@/components/ui/SwipeableCenterModal';
import { showErrorToast, showSuccessToast } from '@/utils/toast';

interface PersonWithLastMessage extends Person {
  lastMessage?: string;
  lastMessageTime?: string;
}

export default function HomeScreen() {
  const { currentUser, userId, isPremium, loading: authLoading } = useAuth();
  const { theme } = useThemeContext();
  const [persons, setPersons] = useState<PersonWithLastMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showPremiumModal, setShowPremiumModal] = useState(false);
  const [name, setName] = useState('');
  const [relationshipType, setRelationshipType] = useState('');
  const [nameError, setNameError] = useState('');
  const [saving, setSaving] = useState(false);

  const fetchPersonsWithLastMessage = useCallback(async () => {
    if (!userId) {
      console.log('No userId available');
      return;
    }

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
        showErrorToast('Failed to load your people');
        return;
      }

      console.log('Persons loaded:', personsData?.length);

      const personsWithMessages = await Promise.all(
        (personsData || []).map(async (person) => {
          try {
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
          } catch (err) {
            console.error('Error fetching messages for person:', person.id, err);
            return {
              ...person,
              lastMessage: 'No messages yet',
              lastMessageTime: undefined,
            };
          }
        })
      );

      setPersons(personsWithMessages);
    } catch (error: any) {
      console.error('Unexpected error fetching persons:', error);
      setError('An unexpected error occurred. Please try again.');
      showErrorToast('Failed to load data');
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
    if (!isPremium && persons.length >= 2) {
      setShowPremiumModal(true);
      return;
    }

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

  const handleClosePremiumModal = () => {
    setShowPremiumModal(false);
  };

  const handleSave = async () => {
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
        showErrorToast('Failed to add person. Please try again.');
      } else {
        console.log('Person created:', data);
        showSuccessToast('Person added successfully!');
        handleCloseModal();
        await fetchPersonsWithLastMessage();
      }
    } catch (error: any) {
      console.error('Unexpected error creating person:', error);
      showErrorToast('An unexpected error occurred');
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

  const handleSettingsPress = () => {
    router.push('/(tabs)/settings');
  };

  if (authLoading) {
    return <LoadingOverlay visible={true} />;
  }

  if (!currentUser) {
    return <Redirect href="/onboarding" />;
  }

  return (
    <>
      <LinearGradient
        colors={theme.primaryGradient}
        style={styles.gradientBackground}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
      >
        <StatusBarGradient />
        <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
          <View style={styles.container}>
            {/* Header with Settings Icon */}
            <View style={styles.topHeader}>
              <View style={styles.headerSpacer} />
              <TouchableOpacity 
                onPress={handleSettingsPress} 
                style={styles.settingsButton}
                activeOpacity={0.7}
              >
                <IconSymbol
                  ios_icon_name="gearshape.fill"
                  android_material_icon_name="settings"
                  size={24}
                  color={theme.buttonText}
                />
              </TouchableOpacity>
            </View>

            <ScrollView
              style={styles.scrollView}
              contentContainerStyle={styles.scrollContent}
              showsVerticalScrollIndicator={false}
            >
              {/* Header */}
              <View style={styles.header}>
                <Text style={[styles.headerTitle, { color: theme.buttonText }]}>Safe Space</Text>
                <Text style={[styles.headerSubtitle, { color: theme.buttonText, opacity: 0.9 }]}>
                  Who would you like to talk about today?
                </Text>
              </View>

              {/* Plan Chip */}
              <View style={[styles.planChip, { backgroundColor: 'rgba(255, 255, 255, 0.95)' }]}>
                <IconSymbol
                  ios_icon_name={isPremium ? 'star.fill' : 'lock.fill'}
                  android_material_icon_name={isPremium ? 'star' : 'lock'}
                  size={16}
                  color={isPremium ? '#FFD700' : theme.textSecondary}
                />
                <Text style={[styles.planChipText, { color: theme.textPrimary }]}>
                  {isPremium ? 'Plan: Premium – Full access' : 'Plan: Free – Some features are locked'}
                </Text>
              </View>

              {/* Add Person Button */}
              <View style={styles.addButtonContainer}>
                <TouchableOpacity
                  onPress={handleAddPerson}
                  activeOpacity={0.8}
                  style={styles.addButton}
                >
                  <View style={[styles.addButtonInner, { backgroundColor: 'rgba(255, 255, 255, 0.95)' }]}>
                    <Text style={[styles.addButtonText, { color: theme.primary }]}>
                      Add Person
                    </Text>
                  </View>
                </TouchableOpacity>
              </View>

              {/* Error State */}
              {error && (
                <View style={styles.errorContainer}>
                  <View style={[styles.errorCard, { backgroundColor: 'rgba(255, 255, 255, 0.95)' }]}>
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
              {!error && persons.length === 0 && !loading ? (
                <View style={styles.emptyState}>
                  <View style={[styles.emptyIconContainer, { backgroundColor: 'rgba(255, 255, 255, 0.95)' }]}>
                    <Text style={styles.emptyEmoji}>🤗</Text>
                  </View>
                  <Text style={[styles.emptyText, { color: theme.buttonText }]}>No one added yet</Text>
                  <Text style={[styles.emptySubtext, { color: theme.buttonText, opacity: 0.8 }]}>
                    Tap &apos;Add Person&apos; to start
                  </Text>
                </View>
              ) : !error && !loading ? (
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

            {/* Add Person Modal - Swipeable */}
            <SwipeableModal
              visible={showAddModal}
              onClose={handleCloseModal}
              animationType="slide"
              showHandle={true}
            >
              <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.modalKeyboardView}
              >
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
                      <Text style={[styles.primaryButtonText, { color: theme.buttonText }]}>
                        Save
                      </Text>
                    </LinearGradient>
                  </TouchableOpacity>
                </View>
              </KeyboardAvoidingView>
            </SwipeableModal>

            {/* Premium Feature Modal - Swipeable Center Modal */}
            <SwipeableCenterModal
              visible={showPremiumModal}
              onClose={handleClosePremiumModal}
              showHandle={true}
            >
              <View style={styles.premiumModalInner}>
                <View style={[styles.premiumIconContainer, { backgroundColor: theme.background }]}>
                  <IconSymbol
                    ios_icon_name="star.fill"
                    android_material_icon_name="star"
                    size={48}
                    color="#FFD700"
                  />
                </View>
                
                <Text style={[styles.premiumModalTitle, { color: theme.textPrimary }]}>
                  Premium feature
                </Text>
                
                <Text style={[styles.premiumModalText, { color: theme.textSecondary }]}>
                  Upgrade your plan to add more people.
                </Text>

                <View style={styles.premiumModalButtons}>
                  <TouchableOpacity
                    onPress={handleClosePremiumModal}
                    style={[styles.premiumSecondaryButton, { borderColor: theme.textSecondary }]}
                    activeOpacity={0.8}
                  >
                    <Text style={[styles.premiumSecondaryButtonText, { color: theme.textSecondary }]}>
                      Not now
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={handleClosePremiumModal}
                    style={styles.premiumPrimaryButton}
                    activeOpacity={0.8}
                  >
                    <LinearGradient
                      colors={['#FFD700', '#FFA500']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={styles.premiumPrimaryButtonGradient}
                    >
                      <Text style={styles.premiumPrimaryButtonText}>
                        Learn about Premium
                      </Text>
                    </LinearGradient>
                  </TouchableOpacity>
                </View>
              </View>
            </SwipeableCenterModal>
          </View>
        </SafeAreaView>
      </LinearGradient>
      
      <LoadingOverlay visible={loading && !error} />
    </>
  );
}

const styles = StyleSheet.create({
  gradientBackground: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  safeArea: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  container: {
    flex: 1,
  },
  topHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: Platform.OS === 'android' ? 16 : 8,
    paddingBottom: 8,
  },
  headerSpacer: {
    width: 40,
  },
  settingsButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  header: {
    marginBottom: 16,
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
  planChip: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    marginBottom: 24,
    gap: 8,
    boxShadow: '0px 2px 6px rgba(0, 0, 0, 0.08)',
    elevation: 2,
  },
  planChipText: {
    fontSize: 14,
    fontWeight: '600',
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
  addButtonInner: {
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
  modalKeyboardView: {
    maxHeight: '85%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingBottom: 16,
    paddingTop: 8,
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
    paddingBottom: Platform.OS === 'ios' ? 32 : 16,
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
  premiumModalInner: {
    padding: 32,
    alignItems: 'center',
  },
  premiumIconContainer: {
    width: 96,
    height: 96,
    borderRadius: 48,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    boxShadow: '0px 4px 12px rgba(0, 0, 0, 0.1)',
    elevation: 3,
  },
  premiumModalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 12,
    textAlign: 'center',
  },
  premiumModalText: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 28,
  },
  premiumModalButtons: {
    flexDirection: 'row',
    width: '100%',
    gap: 12,
  },
  premiumSecondaryButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 50,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  premiumSecondaryButtonText: {
    fontSize: 15,
    fontWeight: '600',
  },
  premiumPrimaryButton: {
    flex: 1,
    borderRadius: 50,
    overflow: 'hidden',
  },
  premiumPrimaryButtonGradient: {
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  premiumPrimaryButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: 'bold',
  },
});
