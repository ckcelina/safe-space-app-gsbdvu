
import React, { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, KeyboardAvoidingView, Platform, TextInput, LogBox } from 'react-native';
import { router, Redirect } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Swipeable } from 'react-native-gesture-handler';
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
import { SafeSpaceLogo } from '@/components/SafeSpaceLogo';
import { showErrorToast, showSuccessToast } from '@/utils/toast';
import FloatingTabBar from '@/components/FloatingTabBar';

LogBox.ignoreLogs([
  'Each child in a list should have a unique "key" prop',
]);

interface PersonWithLastMessage extends Person {
  lastMessage?: string;
  lastMessageTime?: string;
}

interface GroupedPersons {
  [key: string]: PersonWithLastMessage[];
}

const DeleteAction = ({ onPress }: { onPress: () => void }) => (
  <TouchableOpacity 
    onPress={onPress}
    style={{
      backgroundColor: '#FF3B30',
      justifyContent: 'center',
      alignItems: 'center',
      width: 80,
      height: '100%',
    }}
  >
    <IconSymbol
      ios_icon_name="trash.fill"
      android_material_icon_name="delete"
      size={28}
      color="#fff"
    />
  </TouchableOpacity>
);

const QUICK_TOPICS = [
  'Work / Career',
  'Self-esteem & Confidence',
  'Mental Health & Disorders',
  'Family in General',
  'Romantic Relationships',
  'Friendships',
  'Studies / School',
  'Money & Finances',
];

/**
 * Categorize a relationship into Family, Friends, Topics, or Other
 * FIXED: Complete list of family keywords with case-insensitive matching
 */
const categorizeRelationship = (relationshipType: string | null | undefined): string => {
  if (!relationshipType) return 'Friends';
  
  const type = relationshipType.toLowerCase().trim();

  // Topics - check first before other categories
  if (type === 'topic') {
    return 'Topics';
  }

  // FAMILY keywords - exact match (case-insensitive, trimmed)
  const familyKeywords = [
    'family',
    'father',
    'dad',
    'mother',
    'mom',
    'parent',
    'sister',
    'brother',
    'husband',
    'wife',
    'partner',
    'fiancé',
    'fiance',
    'son',
    'daughter',
    'child',
    'aunt',
    'uncle',
    'cousin',
    'grandfather',
    'grandma',
    'grandmother',
    'grandpa',
    'niece',
    'nephew',
    'in-law',
  ];

  // Check if the relationship type matches any family keyword
  if (familyKeywords.includes(type)) {
    return 'Family';
  }

  // Default to Friends for all other relationships
  return 'Friends';
};

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

  // Subject/Topic modal state
  const [showSubjectModal, setShowSubjectModal] = useState(false);
  const [selectedTopic, setSelectedTopic] = useState<string | null>(null);
  const [customTopic, setCustomTopic] = useState('');
  const [savingSubject, setSavingSubject] = useState(false);

  // Use ref to track if component is mounted
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const fetchPersonsWithLastMessage = useCallback(async () => {
    if (!userId) {
      console.log('[Home] No userId available');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      console.log('[Home] Fetching persons for user:', userId);
      
      // FIXED: Always filter by user_id to prevent data leakage
      const { data: personsData, error: personsError } = await supabase
        .from('persons')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (personsError) {
        console.error('[Home] Error fetching persons:', personsError);
        if (isMountedRef.current) {
          setError('Failed to load your people. Please try again.');
          showErrorToast('Failed to load your people');
        }
        return;
      }

      console.log('[Home] Persons loaded:', personsData?.length || 0);

      if (!personsData || personsData.length === 0) {
        if (isMountedRef.current) {
          setPersons([]);
        }
        return;
      }

      const personsWithMessages = await Promise.all(
        personsData.map(async (person) => {
          try {
            // FIXED: Always filter by BOTH user_id AND person_id
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
            console.error('[Home] Error fetching messages for person:', person.id, err);
            return {
              ...person,
              lastMessage: 'No messages yet',
              lastMessageTime: undefined,
            };
          }
        })
      );

      if (isMountedRef.current) {
        setPersons(personsWithMessages);
      }
    } catch (error: any) {
      console.error('[Home] Unexpected error fetching persons:', error);
      if (isMountedRef.current) {
        setError('An unexpected error occurred. Please try again.');
        showErrorToast('Failed to load data');
      }
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
      }
    }
  }, [userId]);

  useEffect(() => {
    if (userId) {
      fetchPersonsWithLastMessage();
    } else {
      setLoading(false);
    }
  }, [userId, fetchPersonsWithLastMessage]);

  const handleDeletePerson = useCallback(async (personId: string) => {
    if (!personId) {
      console.error('[Home] Cannot delete person - personId is missing');
      showErrorToast('Invalid person data');
      return;
    }

    if (!userId) {
      console.error('[Home] Cannot delete person - userId is missing');
      showErrorToast('You must be logged in');
      return;
    }

    console.log('[Home] Deleting person:', personId);

    try {
      // FIXED: Delete messages with BOTH user_id AND person_id filter
      const { error: messagesError } = await supabase
        .from('messages')
        .delete()
        .eq('user_id', userId)
        .eq('person_id', personId);

      if (messagesError) {
        console.error('[Home] Error deleting messages:', messagesError);
        showErrorToast('Failed to delete messages');
        return;
      }

      // FIXED: Delete person with BOTH id AND user_id filter
      const { error: personError } = await supabase
        .from('persons')
        .delete()
        .eq('id', personId)
        .eq('user_id', userId);

      if (personError) {
        console.error('[Home] Error deleting person:', personError);
        showErrorToast('Failed to delete person');
        return;
      }

      // Update local state
      if (isMountedRef.current) {
        setPersons(prev => prev.filter(p => p.id !== personId));
        showSuccessToast('Person deleted');
      }

      console.log('[Home] Person deleted successfully');
    } catch (error: any) {
      console.error('[Home] Unexpected error deleting person:', error);
      showErrorToast('An unexpected error occurred');
    }
  }, [userId]);

  /**
   * FIXED: Deduplicate and group persons
   * - Dedupe by person.id (or fallback key)
   * - Group by relationship category
   */
  const filteredAndGroupedPersons = useMemo(() => {
    const filtered = persons.filter((person) => {
      if (!searchQuery.trim()) return true;
      
      const query = searchQuery.toLowerCase();
      const nameMatch = person.name?.toLowerCase().includes(query) || false;
      const relationshipMatch = person.relationship_type?.toLowerCase().includes(query) || false;
      
      return nameMatch || relationshipMatch;
    });

    // FIXED: Deduplicate by person.id
    const seenPersonIds = new Set<string>();
    const dedupedPersons: PersonWithLastMessage[] = [];
    
    filtered.forEach((person) => {
      // Generate a stable unique key
      const personKey = person.id || `${userId}:${person.name?.toLowerCase() || 'unknown'}`;
      
      // Skip if we've already processed this person
      if (seenPersonIds.has(personKey)) {
        console.warn('[Home] Skipping duplicate person:', personKey, person.name);
        return;
      }

      // Mark this person as seen
      seenPersonIds.add(personKey);
      dedupedPersons.push(person);
    });

    // FIXED: Group by relationship category
    const grouped: GroupedPersons = {};
    
    dedupedPersons.forEach((person) => {
      const category = categorizeRelationship(person.relationship_type);
      
      // Initialize the category array if it doesn't exist
      if (!grouped[category]) {
        grouped[category] = [];
      }
      
      // Add the person to their category
      grouped[category].push(person);
      
      console.log('[Home] Categorized person:', person.name, 'as', category, 'based on relationship:', person.relationship_type);
    });

    return grouped;
  }, [persons, searchQuery, userId]);

  const groupOrder = ['Family', 'Friends', 'Topics', 'Other'];
  const visibleGroups = useMemo(() => {
    return groupOrder.filter(groupName => {
      const groupPersons = filteredAndGroupedPersons[groupName];
      return groupPersons && groupPersons.length > 0;
    });
  }, [filteredAndGroupedPersons]);

  const handleAddPerson = useCallback(() => {
    console.log('[Home] handleAddPerson called, isPremium:', isPremium, 'persons.length:', persons.length);
    
    // TEMPORARILY DISABLED: Premium lock for testing
    // if (!isPremium && persons.length >= 2) {
    //   console.log('[Home] Free user limit reached, showing premium modal');
    //   setShowPremiumModal(true);
    //   return;
    // }

    console.log('[Home] Opening Add Person modal');
    setShowAddModal(true);
    setName('');
    setRelationshipType('');
    setNameError('');
  }, [isPremium, persons.length]);

  const handleCloseModal = useCallback(() => {
    console.log('[Home] Closing Add Person modal');
    setShowAddModal(false);
    setName('');
    setRelationshipType('');
    setNameError('');
  }, []);

  const handleClosePremiumModal = useCallback(() => {
    setShowPremiumModal(false);
  }, []);

  /**
   * FIXED: Handle person creation with duplicate checking
   * - Check for existing person before insert (case-insensitive)
   * - Handle Supabase error 23505 gracefully
   * - Only update local state after successful insert
   * - Reload persons list if insert fails
   */
  const handleSave = useCallback(async () => {
    console.log('[Home] handleSave called with name:', name, 'relationshipType:', relationshipType);
    
    if (!name.trim()) {
      console.log('[Home] Name validation failed - name is empty');
      setNameError('Name is required');
      return;
    }

    if (!userId) {
      console.error('[Home] No userId available');
      showErrorToast('You must be logged in to add a person');
      return;
    }

    console.log('[Home] Starting save process for userId:', userId);
    setNameError('');
    setSaving(true);

    try {
      const trimmedName = name.trim();
      
      // FIXED: Check if person already exists (case-insensitive)
      console.log('[Home] Checking for existing person with name:', trimmedName);
      const { data: existingPerson, error: queryError } = await supabase
        .from('persons')
        .select('*')
        .eq('user_id', userId)
        .ilike('name', trimmedName)
        .maybeSingle();

      if (queryError && queryError.code !== 'PGRST116') {
        console.error('[Home] Error checking for existing person:', queryError);
        if (isMountedRef.current) {
          showErrorToast('Failed to check existing people');
          setSaving(false);
        }
        return;
      }

      if (existingPerson) {
        console.log('[Home] Person already exists:', existingPerson);
        if (isMountedRef.current) {
          setNameError('You already have a person with this name');
          showErrorToast('This person already exists');
          setSaving(false);
          
          // Navigate to existing person's chat
          if (existingPerson.id) {
            console.log('[Home] Navigating to existing person chat');
            setShowAddModal(false);
            setName('');
            setRelationshipType('');
            setNameError('');
            
            router.push({
              pathname: '/(tabs)/(home)/chat',
              params: { 
                personId: existingPerson.id, 
                personName: existingPerson.name || 'Chat',
                relationshipType: existingPerson.relationship_type || ''
              },
            });
          }
        }
        return;
      }

      // Insert new person
      const personData = {
        user_id: userId,
        name: trimmedName,
        relationship_type: relationshipType.trim() || null,
      };
      
      console.log('[Home] Inserting person data:', personData);
      
      const { data, error } = await supabase
        .from('persons')
        .insert([personData])
        .select()
        .single();

      if (error) {
        console.error('[Home] Error creating person:', error);
        
        // FIXED: Handle duplicate person error gracefully (error code 23505)
        if (error.code === '23505') {
          console.log('[Home] Duplicate key error caught, reloading persons list');
          if (isMountedRef.current) {
            setNameError('You already have a person with this name');
            showErrorToast('This person already exists');
            
            // Reload persons list to ensure UI is in sync
            await fetchPersonsWithLastMessage();
            setSaving(false);
          }
          return;
        }
        
        if (isMountedRef.current) {
          showErrorToast('Failed to add person. Please try again.');
          setSaving(false);
        }
        return;
      }

      console.log('[Home] Person created successfully:', data);
      
      // FIXED: Only update local state after successful insert
      if (isMountedRef.current) {
        showSuccessToast('Person added successfully!');
        
        setShowAddModal(false);
        setName('');
        setRelationshipType('');
        setNameError('');
        
        console.log('[Home] Refreshing persons list');
        await fetchPersonsWithLastMessage();
      }
      
    } catch (error: any) {
      console.error('[Home] Unexpected error creating person:', error);
      if (isMountedRef.current) {
        showErrorToast('An unexpected error occurred');
      }
    } finally {
      if (isMountedRef.current) {
        setSaving(false);
        console.log('[Home] Save process complete');
      }
    }
  }, [name, relationshipType, userId, fetchPersonsWithLastMessage]);

  const handlePersonPress = useCallback((person: Person) => {
    if (!person.id) {
      console.error('[Home] Cannot navigate to chat - person.id is missing');
      showErrorToast('Invalid person data');
      return;
    }

    console.log('[Home] Navigating to chat for person:', person.name, 'id:', person.id);
    
    try {
      router.push({
        pathname: '/(tabs)/(home)/chat',
        params: { 
          personId: person.id, 
          personName: person.name || 'Chat',
          relationshipType: person.relationship_type || ''
        },
      });
    } catch (error) {
      console.error('[Home] Navigation error:', error);
      showErrorToast('Failed to open chat');
    }
  }, []);

  const handleSettingsPress = useCallback(() => {
    try {
      router.push('/(tabs)/settings');
    } catch (error) {
      console.error('[Home] Settings navigation error:', error);
    }
  }, []);

  const getPlanInfo = useCallback(() => {
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
  }, [role, theme.textSecondary]);

  // Subject/Topic modal handlers
  const handleAddSubject = useCallback(() => {
    console.log('[Home] Opening Add Subject modal');
    
    // TEMPORARILY DISABLED: Premium lock for testing
    // if (!isPremium && persons.length >= 2) {
    //   console.log('[Home] Free user limit reached, showing premium modal');
    //   setShowPremiumModal(true);
    //   return;
    // }

    setShowSubjectModal(true);
    setSelectedTopic(null);
    setCustomTopic('');
  }, [isPremium, persons.length]);

  const handleCloseSubjectModal = useCallback(() => {
    console.log('[Home] Closing Add Subject modal');
    setShowSubjectModal(false);
    setSelectedTopic(null);
    setCustomTopic('');
  }, []);

  const handleTopicSelect = useCallback((topic: string) => {
    console.log('[Home] Topic selected:', topic);
    setSelectedTopic(topic);
  }, []);

  /**
   * FIXED: Handle subject/topic creation with duplicate checking
   */
  const handleSaveSubject = useCallback(async () => {
    const subjectString = customTopic.trim() || selectedTopic;
    
    if (!subjectString) {
      console.log('[Home] No subject selected or entered');
      showErrorToast('Please select or enter a subject');
      return;
    }

    if (!userId) {
      console.error('[Home] No userId available for subject save');
      showErrorToast('You must be logged in to add a subject');
      return;
    }

    console.log('[Home] Saving subject:', subjectString, 'for userId:', userId);
    setSavingSubject(true);

    try {
      // FIXED: Check for existing topic with case-insensitive name match
      console.log('[Home] Checking for existing topic with name:', subjectString);
      const { data: existingPerson, error: queryError } = await supabase
        .from('persons')
        .select('*')
        .eq('user_id', userId)
        .ilike('name', subjectString)
        .maybeSingle();

      if (queryError && queryError.code !== 'PGRST116') {
        console.error('[Home] Error querying persons:', queryError);
        showErrorToast('Failed to check existing subjects');
        setSavingSubject(false);
        return;
      }

      let person: Person;

      if (existingPerson) {
        // Row already exists, use it
        console.log('[Home] Subject already exists, using existing person:', existingPerson);
        person = existingPerson;
        showErrorToast('This topic already exists');
      } else {
        // Insert new row with user_id
        console.log('[Home] Creating new subject person');
        const { data: newPerson, error: insertError } = await supabase
          .from('persons')
          .insert([{
            user_id: userId,
            name: subjectString,
            relationship_type: 'Topic',
          }])
          .select()
          .single();

        if (insertError) {
          console.error('[Home] Error creating subject person:', insertError);
          
          // FIXED: Handle duplicate error gracefully (error code 23505)
          if (insertError.code === '23505') {
            console.log('[Home] Duplicate key error for topic, reloading persons list');
            showErrorToast('This topic already exists');
            
            // Reload persons list to ensure UI is in sync
            await fetchPersonsWithLastMessage();
            setSavingSubject(false);
            return;
          }
          
          showErrorToast('Failed to create subject');
          setSavingSubject(false);
          return;
        }

        console.log('[Home] Subject person created:', newPerson);
        person = newPerson;
      }

      if (!person.id) {
        console.error('[Home] Person ID is missing');
        showErrorToast('Invalid subject data');
        setSavingSubject(false);
        return;
      }

      console.log('[Home] Navigating to chat for subject:', person.name, 'id:', person.id);

      // Close modal
      setShowSubjectModal(false);
      setSelectedTopic(null);
      setCustomTopic('');

      // Navigate to chat
      router.push({
        pathname: '/(tabs)/(home)/chat',
        params: {
          personId: person.id,
          personName: person.name || 'Topic',
          relationshipType: person.relationship_type || '',
          initialSubject: subjectString,
        },
      });

      // Refresh persons list to show the new topic
      await fetchPersonsWithLastMessage();

    } catch (error: any) {
      console.error('[Home] Unexpected error saving subject:', error);
      showErrorToast('An unexpected error occurred');
    } finally {
      if (isMountedRef.current) {
        setSavingSubject(false);
      }
    }
  }, [customTopic, selectedTopic, userId, fetchPersonsWithLastMessage]);

  const planInfo = getPlanInfo();

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
              <View style={styles.header}>
                <Text style={[styles.headerTitle, { color: theme.buttonText }]}>Safe Space</Text>
                <Text style={[styles.headerSubtitle, { color: theme.buttonText, opacity: 0.9 }]}>
                  Who would you like to talk about today?
                </Text>
              </View>

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

                <TouchableOpacity
                  onPress={handleAddSubject}
                  activeOpacity={0.8}
                  style={styles.addButton}
                >
                  <View style={[styles.addButtonInner, { backgroundColor: 'rgba(255, 255, 255, 0.95)' }]}>
                    <Text style={[styles.addButtonText, { color: theme.primary }]}>
                      Add Topic
                    </Text>
                  </View>
                </TouchableOpacity>
              </View>

              {error && (
                <View style={styles.errorContainer}>
                  <View style={[styles.errorCard, { backgroundColor: 'rgba(255, 255, 255, 0.95)' }]}>
                    <SafeSpaceLogo size={48} color={theme.primary} />
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

              {!error && persons.length === 0 && !loading ? (
                <View style={styles.emptyState}>
                  <View style={[styles.emptyIconContainer, { backgroundColor: 'rgba(255, 255, 255, 0.95)' }]}>
                    <SafeSpaceLogo size={48} color={theme.primary} />
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
                    visibleGroups.map((groupName, groupIndex) => {
                      const groupPersons = filteredAndGroupedPersons[groupName] || [];

                      if (!groupPersons || groupPersons.length === 0) {
                        return null;
                      }

                      return (
                        <View
                          key={`group-${groupName}-${groupIndex}`}
                          style={styles.group}
                        >
                          <Text style={[styles.groupHeader, { color: theme.buttonText }]}>
                            {groupName}
                          </Text>

                          <View style={styles.groupCards}>
                            {groupPersons.map((person, personIndex) => {
                              if (!person) return null;

                              // FIXED: Use person.id as key (or fallback)
                              const personKey = person.id || `${userId}:${person.name?.toLowerCase() || personIndex}`;

                              return (
                                <Swipeable
                                  key={personKey}
                                  renderRightActions={() => (
                                    <DeleteAction onPress={() => handleDeletePerson(person.id!)} />
                                  )}
                                  overshootRight={false}
                                >
                                  <PersonCard
                                    person={person}
                                    onPress={() => handlePersonPress(person)}
                                  />
                                </Swipeable>
                              );
                            })}
                          </View>
                        </View>
                      );
                    })
                  )}
                </View>
              ) : null}
            </ScrollView>

            <SwipeableModal
              visible={showAddModal}
              onClose={handleCloseModal}
              animationType="slide"
              showHandle={true}
            >
              <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.modalKeyboardView}
                keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
              >
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

                <ScrollView
                  style={styles.modalBody}
                  contentContainerStyle={styles.modalBodyContent}
                  keyboardShouldPersistTaps="handled"
                  showsVerticalScrollIndicator={false}
                  bounces={false}
                >
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
                          console.log('[Home] Name changed to:', text);
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
                          console.log('[Home] Relationship type changed to:', text);
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
                </ScrollView>

                <View style={styles.modalFooter}>
                  <TouchableOpacity
                    onPress={handleCloseModal}
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
            </SwipeableModal>

            <SwipeableModal
              visible={showSubjectModal}
              onClose={handleCloseSubjectModal}
              animationType="slide"
              showHandle={true}
            >
              <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.modalKeyboardView}
                keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
              >
                <View style={styles.modalHeader}>
                  <Text style={[styles.modalTitle, { color: theme.textPrimary }]}>Add a subject or topic</Text>
                  <TouchableOpacity onPress={handleCloseSubjectModal} style={styles.closeButton}>
                    <IconSymbol
                      ios_icon_name="xmark"
                      android_material_icon_name="close"
                      size={24}
                      color={theme.textSecondary}
                    />
                  </TouchableOpacity>
                </View>

                <ScrollView
                  style={styles.modalBody}
                  contentContainerStyle={styles.modalBodyContent}
                  keyboardShouldPersistTaps="handled"
                  showsVerticalScrollIndicator={false}
                  bounces={false}
                >
                  <Text style={[styles.helperText, { color: theme.textSecondary }]}>
                    What would you like to focus on?
                  </Text>

                  <View style={styles.topicsContainer}>
                    {QUICK_TOPICS.map((topic, index) => (
                      <TouchableOpacity
                        key={`topic-${index}`}
                        onPress={() => handleTopicSelect(topic)}
                        activeOpacity={0.7}
                        style={[
                          styles.topicChip,
                          {
                            backgroundColor: selectedTopic === topic 
                              ? theme.primary 
                              : theme.background,
                            borderWidth: 1,
                            borderColor: selectedTopic === topic 
                              ? theme.primary 
                              : 'rgba(0, 0, 0, 0.1)',
                          }
                        ]}
                      >
                        <Text style={[
                          styles.topicChipText,
                          {
                            color: selectedTopic === topic 
                              ? theme.buttonText 
                              : theme.textPrimary,
                          }
                        ]}>
                          {topic}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>

                  <View style={styles.fieldContainer}>
                    <Text style={[styles.inputLabel, { color: theme.textPrimary }]}>
                      Custom subject or topic
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
                        placeholder="Enter your own subject..."
                        placeholderTextColor={theme.textSecondary}
                        value={customTopic}
                        onChangeText={setCustomTopic}
                        autoCapitalize="sentences"
                        autoCorrect={false}
                        maxLength={100}
                        returnKeyType="done"
                        onSubmitEditing={handleSaveSubject}
                        editable={!savingSubject}
                      />
                    </View>
                  </View>
                </ScrollView>

                <View style={styles.modalFooter}>
                  <TouchableOpacity
                    onPress={handleCloseSubjectModal}
                    style={[styles.secondaryButton, { borderColor: theme.textSecondary }]}
                    disabled={savingSubject}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.secondaryButtonText, { color: theme.textSecondary }]}>
                      Cancel
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={handleSaveSubject}
                    style={styles.primaryButton}
                    disabled={savingSubject}
                    activeOpacity={0.8}
                  >
                    <LinearGradient
                      colors={theme.primaryGradient}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={styles.primaryButtonGradient}
                    >
                      <Text style={[styles.primaryButtonText, { color: theme.buttonText }]}>
                        {savingSubject ? 'Saving...' : 'Save'}
                      </Text>
                    </LinearGradient>
                  </TouchableOpacity>
                </View>
              </KeyboardAvoidingView>
            </SwipeableModal>

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
      
      <FloatingTabBar
        tabs={[
          {
            name: 'home',
            route: '/(tabs)/(home)',
            icon: 'home',
            iosIcon: 'house.fill',
            label: 'Home',
          },
          {
            name: 'library',
            route: '/(tabs)/library',
            icon: 'menu-book',
            iosIcon: 'book.fill',
            label: 'Library',
          },
        ]}
      />
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
    paddingBottom: 120,
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
    gap: 12,
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
    minHeight: 400,
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
  helperText: {
    fontSize: 15,
    marginBottom: 20,
    lineHeight: 20,
  },
  topicsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 28,
  },
  topicChip: {
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderRadius: 24,
  },
  topicChipText: {
    fontSize: 14,
    fontWeight: '600',
  },
  fieldContainer: {
    marginBottom: 24,
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
    paddingVertical: Platform.OS === 'ios' ? 14 : 12,
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
