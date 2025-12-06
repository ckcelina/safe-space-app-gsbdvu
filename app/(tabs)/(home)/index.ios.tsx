
import React, { useEffect, useState, useCallback, useMemo } from 'react';
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

interface GroupedPersons {
  [key: string]: PersonWithLastMessage[];
}

// DEV-ONLY: Navigation test flag
const __DEV_NAV_TEST__ = __DEV__ && true;

export default function HomeScreen() {
  const { currentUser, userId, role, isPremium, loading: authLoading } = useAuth();
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
  const [searchQuery, setSearchQuery] = useState('');

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

      console.log('Persons loaded:', personsData?.length || 0);

      // Safely handle empty or null data
      if (!personsData || personsData.length === 0) {
        setPersons([]);
        return;
      }

      const personsWithMessages = await Promise.all(
        personsData.map(async (person) => {
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
    } else {
      setLoading(false);
    }
  }, [userId, fetchPersonsWithLastMessage]);

  // Helper function to categorize relationship types
  const categorizeRelationship = (relationshipType: string | null | undefined): string => {
    if (!relationshipType) return 'Friends';
    
    const type = relationshipType.toLowerCase().trim();
    
    // Partner
    if (['partner', 'boyfriend', 'girlfriend', 'husband', 'wife', 'spouse', 'fiancé', 'fiancée'].includes(type)) {
      return 'Partner';
    }
    
    // Parents
    if (['mom', 'mother', 'dad', 'father', 'parent'].includes(type)) {
      return 'Parents';
    }
    
    // Friends (default for most)
    return 'Friends';
  };

  // Filter and group persons
  const filteredAndGroupedPersons = useMemo(() => {
    // Filter by search query
    const filtered = persons.filter((person) => {
      if (!searchQuery.trim()) return true;
      
      const query = searchQuery.toLowerCase();
      const nameMatch = person.name?.toLowerCase().includes(query) || false;
      const relationshipMatch = person.relationship_type?.toLowerCase().includes(query) || false;
      
      return nameMatch || relationshipMatch;
    });

    // Group by category
    const grouped: GroupedPersons = {};
    
    filtered.forEach((person) => {
      const category = categorizeRelationship(person.relationship_type);
      if (!grouped[category]) {
        grouped[category] = [];
      }
      grouped[category].push(person);
    });

    return grouped;
  }, [persons, searchQuery]);

  // Define the order of groups and filter out empty ones
  const groupOrder = ['Parents', 'Partner', 'Friends'];
  const visibleGroups = useMemo(() => {
    return groupOrder.filter(groupName => {
      const groupPersons = filteredAndGroupedPersons[groupName];
      return groupPersons && groupPersons.length > 0;
    });
  }, [filteredAndGroupedPersons]);

  const handleAddPerson = () => {
    console.log('[handleAddPerson] Button pressed, isPremium:', isPremium, 'persons.length:', persons.length);
    
    if (!isPremium && persons.length >= 2) {
      console.log('[handleAddPerson] Free user limit reached, showing premium modal');
      setShowPremiumModal(true);
      return;
    }

    console.log('[handleAddPerson] Opening Add Person modal');
    setShowAddModal(true);
    setName('');
    setRelationshipType('');
    setNameError('');
  };

  const handleCloseModal = () => {
    console.log('[handleCloseModal] Closing modal, clearing form');
    setShowAddModal(false);
    setName('');
    setRelationshipType('');
    setNameError('');
  };

  const handleClosePremiumModal = () => {
    setShowPremiumModal(false);
  };

  const handleSave = async () => {
    console.log('[handleSave] Called with name:', name, 'relationshipType:', relationshipType);
    
    // Validate name
    if (!name.trim()) {
      console.log('[handleSave] Name validation failed - name is empty');
      setNameError('Name is required');
      return;
    }

    // Validate userId
    if (!userId) {
      console.error('[handleSave] No userId available');
      showErrorToast('You must be logged in to add a person');
      return;
    }

    console.log('[handleSave] Starting save process for userId:', userId);
    setNameError('');
    setSaving(true);

    try {
      const personData = {
        user_id: userId,
        name: name.trim(),
        relationship_type: relationshipType.trim() || null,
      };
      
      console.log('[handleSave] Inserting person data:', personData);
      
      const { data, error } = await supabase
        .from('persons')
        .insert([personData])
        .select()
        .single();

      if (error) {
        console.error('[handleSave] Error creating person:', error);
        showErrorToast('Failed to add person. Please try again.');
        setSaving(false);
        return;
      }

      console.log('[handleSave] Person created successfully:', data);
      showSuccessToast('Person added successfully!');
      
      // Close modal and clear form
      setShowAddModal(false);
      setName('');
      setRelationshipType('');
      setNameError('');
      
      // Refresh the list
      console.log('[handleSave] Refreshing persons list');
      await fetchPersonsWithLastMessage();
      
    } catch (error: any) {
      console.error('[handleSave] Unexpected error creating person:', error);
      showErrorToast('An unexpected error occurred');
    } finally {
      setSaving(false);
      console.log('[handleSave] Save process complete');
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

  // Get plan display info
  const getPlanInfo = () => {
    if (role === 'premium') {
      return {
        text: 'Plan: Premium',
        subtext: 'Full access',
        icon: 'star.fill' as const,
        iconColor: '#FFD700',
        badgeColor: '#FFD700',
        showBadge: true,
      };
    } else if (role === 'admin') {
      return {
        text: 'Plan: Admin',
        subtext: 'Full access',
        icon: 'shield.fill' as const,
        iconColor: '#FF6B6B',
        badgeColor: '#FF6B6B',
        showBadge: true,
      };
    } else {
      return {
        text: 'Plan: Free – Some features are locked',
        subtext: null,
        icon: 'lock.fill' as const,
        iconColor: theme.textSecondary,
        badgeColor: theme.textSecondary,
        showBadge: false,
      };
    }
  };

  const planInfo = getPlanInfo();

  // DEV-ONLY: Navigation test function
  const devTestNavigationFlow = useCallback(async () => {
    if (!__DEV_NAV_TEST__) return;

    console.log('[NAV-TEST] Starting navigation smoke test');

    try {
      // Step 1: Test person navigation if available
      if (persons.length > 0) {
        try {
          console.log('[NAV-TEST] Step 1: Testing person press with first person');
          const firstPerson = persons[0];
          handlePersonPress(firstPerson);
          console.log('[NAV-TEST] Step 1: SUCCESS - Navigated to chat for person:', firstPerson.name);
        } catch (err) {
          console.error('[NAV-TEST] Step 1: FAILED - Error navigating to person:', err);
        }

        // Wait a bit before going back
        await new Promise(resolve => setTimeout(resolve, 500));

        // Step 2: Go back
        try {
          console.log('[NAV-TEST] Step 2: Testing router.back()');
          router.back();
          console.log('[NAV-TEST] Step 2: SUCCESS - Navigated back from chat');
        } catch (err) {
          console.error('[NAV-TEST] Step 2: FAILED - Error going back:', err);
        }

        await new Promise(resolve => setTimeout(resolve, 500));
      } else {
        console.log('[NAV-TEST] Step 1-2: SKIPPED - No persons available to test');
      }

      // Step 3: Navigate to settings
      try {
        console.log('[NAV-TEST] Step 3: Testing navigation to settings');
        router.push('/(tabs)/settings');
        console.log('[NAV-TEST] Step 3: SUCCESS - Navigated to settings');
      } catch (err) {
        console.error('[NAV-TEST] Step 3: FAILED - Error navigating to settings:', err);
      }

      await new Promise(resolve => setTimeout(resolve, 500));

      // Step 4: Go back from settings
      try {
        console.log('[NAV-TEST] Step 4: Testing router.back() from settings');
        router.back();
        console.log('[NAV-TEST] Step 4: SUCCESS - Navigated back from settings');
      } catch (err) {
        console.error('[NAV-TEST] Step 4: FAILED - Error going back from settings:', err);
      }

      console.log('[NAV-TEST] Navigation smoke test complete');
    } catch (error) {
      console.error('[NAV-TEST] Unexpected error during navigation test:', error);
    }
  }, [persons, handlePersonPress]);

  // DEV-ONLY: Log when HomeScreen mounts
  useEffect(() => {
    if (__DEV_NAV_TEST__) {
      console.log('[NAV-TEST] HomeScreen mounted');
    }
  }, []);

  // DEV-ONLY: Manual trigger point (KEEP COMMENTED OUT BY DEFAULT)
  useEffect(() => {
    if (__DEV_NAV_TEST__) {
      // Uncomment the line below to manually trigger the navigation test
      // devTestNavigationFlow();
    }
  }, [devTestNavigationFlow]);

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
        end={{ x: 1, y: 1 }}
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
              keyboardShouldPersistTaps="handled"
            >
              {/* Header */}
              <View style={styles.header}>
                <Text style={[styles.headerTitle, { color: theme.buttonText }]}>Safe Space</Text>
                <Text style={[styles.headerSubtitle, { color: theme.buttonText, opacity: 0.9 }]}>
                  Who would you like to talk about today?
                </Text>
              </View>

              {/* Plan Pill - Fixed to fully contain text */}
              <View style={styles.planPillContainer}>
                <View style={[styles.planPill, { backgroundColor: 'rgba(255, 255, 255, 0.95)' }]}>
                  <View style={styles.planPillContent}>
                    <IconSymbol
                      ios_icon_name={planInfo.icon}
                      android_material_icon_name={role === 'premium' ? 'star' : role === 'admin' ? 'shield' : 'lock'}
                      size={16}
                      color={planInfo.iconColor}
                      style={styles.planIcon}
                    />
                    <View style={styles.planTextWrapper}>
                      <Text 
                        style={[styles.planText, { color: theme.textPrimary }]}
                        numberOfLines={2}
                      >
                        {planInfo.text}
                      </Text>
                    </View>
                  </View>
                  {planInfo.subtext && (
                    <Text style={[styles.planSubtext, { color: theme.textSecondary }]}>
                      {planInfo.subtext}
                    </Text>
                  )}
                </View>
              </View>

              {/* Search Bar */}
              {persons.length > 0 && (
                <View style={[styles.searchContainer, { backgroundColor: 'rgba(255, 255, 255, 0.95)' }]}>
                  <IconSymbol
                    ios_icon_name="magnifyingglass"
                    android_material_icon_name="search"
                    size={20}
                    color={theme.textSecondary}
                  />
                  <TextInput
                    style={[styles.searchInput, { color: theme.textPrimary }]}
                    placeholder="Search by name or relationship"
                    placeholderTextColor={theme.textSecondary}
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                  {searchQuery.length > 0 && (
                    <TouchableOpacity onPress={() => setSearchQuery('')} style={styles.clearButton}>
                      <IconSymbol
                        ios_icon_name="xmark.circle.fill"
                        android_material_icon_name="cancel"
                        size={20}
                        color={theme.textSecondary}
                      />
                    </TouchableOpacity>
                  )}
                </View>
              )}

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

              {/* Persons List - Grouped */}
              {!error && persons.length === 0 && !loading ? (
                <View style={styles.emptyState}>
                  <View style={[styles.emptyIconContainer, { backgroundColor: 'rgba(255, 255, 255, 0.95)' }]}>
                    <IconSymbol
                      ios_icon_name="bubble.left.and.bubble.right.fill"
                      android_material_icon_name="chat"
                      size={48}
                      color={theme.primary}
                    />
                  </View>
                  <Text style={[styles.emptyText, { color: theme.buttonText }]}>No one added yet</Text>
                  <Text style={[styles.emptySubtext, { color: theme.buttonText, opacity: 0.8 }]}>
                    Tap &apos;Add Person&apos; to start
                  </Text>
                </View>
              ) : !error && !loading ? (
                <View style={styles.groupedList}>
                  {visibleGroups.length === 0 ? (
                    <View style={styles.noResultsContainer}>
                      <Text style={[styles.noResultsText, { color: theme.buttonText }]}>
                        No matches found
                      </Text>
                      <Text style={[styles.noResultsSubtext, { color: theme.buttonText, opacity: 0.8 }]}>
                        Try a different search term
                      </Text>
                    </View>
                  ) : (
                    visibleGroups.map((groupName) => {
                      const groupPersons = filteredAndGroupedPersons[groupName];
                      
                      return (
                        <View key={groupName} style={styles.group}>
                          <Text style={[styles.groupHeader, { color: theme.buttonText }]}>
                            {groupName}
                          </Text>
                          <View style={styles.groupCards}>
                            {groupPersons.map((person) => (
                              <PersonCard
                                key={person.id}
                                person={person}
                                onPress={() => handlePersonPress(person)}
                              />
                            ))}
                          </View>
                        </View>
                      );
                    })
                  )}
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
                  {/* Name Field */}
                  <View style={styles.fieldContainer}>
                    <Text style={[styles.inputLabel, { color: theme.textPrimary }]}>
                      Name <Text style={styles.required}>*</Text>
                    </Text>
                    <View style={[styles.textInputWrapper, { backgroundColor: theme.background, borderWidth: 1, borderColor: nameError ? '#FF3B30' : 'rgba(0, 0, 0, 0.1)' }]}>
                      <TextInput
                        style={[styles.textInput, { color: theme.textPrimary }]}
                        placeholder="Enter their name"
                        placeholderTextColor={theme.textSecondary}
                        value={name}
                        onChangeText={(text) => {
                          console.log('[TextInput] Name changed to:', text);
                          setName(text);
                          if (nameError && text.trim()) {
                            setNameError('');
                          }
                        }}
                        onFocus={() => console.log('[TextInput] Name field focused')}
                        onBlur={() => console.log('[TextInput] Name field blurred')}
                        autoCapitalize="words"
                        autoCorrect={false}
                        maxLength={50}
                        editable={!saving}
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
                    <View style={[styles.textInputWrapper, { backgroundColor: theme.background, borderWidth: 1, borderColor: 'rgba(0, 0, 0, 0.1)' }]}>
                      <TextInput
                        style={[styles.textInput, { color: theme.textPrimary }]}
                        placeholder="partner, ex, friend, parent..."
                        placeholderTextColor={theme.textSecondary}
                        value={relationshipType}
                        onChangeText={(text) => {
                          console.log('[TextInput] Relationship type changed to:', text);
                          setRelationshipType(text);
                        }}
                        onFocus={() => console.log('[TextInput] Relationship field focused')}
                        onBlur={() => console.log('[TextInput] Relationship field blurred')}
                        autoCapitalize="words"
                        autoCorrect={false}
                        maxLength={50}
                        editable={!saving}
                      />
                    </View>
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
                        {saving ? 'Saving...' : 'Save'}
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
                    ios_icon_name="lock.fill"
                    android_material_icon_name="lock"
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
  planPillContainer: {
    marginBottom: 16,
    alignItems: 'flex-start',
  },
  planPill: {
    borderRadius: 24,
    paddingHorizontal: 18,
    paddingVertical: 12,
    boxShadow: '0px 2px 6px rgba(0, 0, 0, 0.08)',
    elevation: 2,
    minWidth: 220,
    maxWidth: '100%',
  },
  planPillContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  planIcon: {
    marginRight: 8,
  },
  planTextWrapper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    minWidth: 0,
  },
  planText: {
    fontSize: 13,
    fontWeight: '600',
    flexShrink: 1,
  },
  planSubtext: {
    fontSize: 12,
    marginTop: 4,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderRadius: 20,
    marginBottom: 16,
    gap: 12,
    boxShadow: '0px 2px 6px rgba(0, 0, 0, 0.08)',
    elevation: 2,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    lineHeight: 18,
  },
  clearButton: {
    padding: 4,
  },
  addButtonContainer: {
    marginBottom: 24,
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
  groupedList: {
    paddingBottom: 20,
  },
  group: {
    marginBottom: 32,
  },
  groupHeader: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 12,
    opacity: 0.9,
  },
  groupCards: {
    gap: 12,
  },
  noResultsContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  noResultsText: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
    textAlign: 'center',
  },
  noResultsSubtext: {
    fontSize: 14,
    textAlign: 'center',
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
  fieldContainer: {
    marginBottom: 20,
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
    paddingVertical: 14,
  },
  textInput: {
    fontSize: 16,
    lineHeight: 20,
    minHeight: 20,
  },
  errorTextSmall: {
    color: '#FF3B30',
    fontSize: 12,
    marginTop: 6,
  },
  modalFooter: {
    flexDirection: 'row',
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: Platform.OS === 'ios' ? 32 : 16,
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
