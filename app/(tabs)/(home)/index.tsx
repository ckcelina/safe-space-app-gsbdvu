
import React, { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Platform, TextInput, LogBox, Modal, Pressable, KeyboardAvoidingView } from 'react-native';
import { router, Redirect } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Swipeable } from 'react-native-gesture-handler';
import { useAuth } from '@/contexts/AuthContext';
import { useThemeContext } from '@/contexts/ThemeContext';
import { supabase } from '@/lib/supabase';
import { Person } from '@/types/database.types';
import { IconSymbol } from '@/components/IconSymbol';
import { PersonCard } from '@/components/ui/PersonCard';
import { LoadingOverlay } from '@/components/ui/LoadingOverlay';
import { StatusBarGradient } from '@/components/ui/StatusBarGradient';
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

// Default topics array - used as fallback if DB returns empty
const DEFAULT_TOPICS = [
  'Anxiety',
  'Social Anxiety',
  'Self-esteem',
  'Stress',
  'Work/Career',
  'Relationships',
  'Grief',
  'Anger',
  'Motivation',
];

/*
 * TESTED SCENARIOS (Add Person Modal):
 * ✓ Open modal: shows solid sheet background (not see-through)
 * ✓ Tap into Name: focus outline visible + scroll works with keyboard
 * ✓ Tap into Relationship: focus outline visible
 * ✓ Keyboard never opens just by tapping "Add Person" button
 */

export default function HomeScreen() {
  const { currentUser, userId, role, isPremium, loading: authLoading } = useAuth();
  const { theme } = useThemeContext();
  const insets = useSafeAreaInsets();
  
  const [people, setPeople] = useState<PersonWithLastMessage[]>([]);
  const [topics, setTopics] = useState<PersonWithLastMessage[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showPremiumModal, setShowPremiumModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Add Person modal state - single source of truth
  const [isAddPersonOpen, setIsAddPersonOpen] = useState(false);
  const [personName, setPersonName] = useState('');
  const [personRelationship, setPersonRelationship] = useState('');
  const [personNameError, setPersonNameError] = useState('');
  const [savingPerson, setSavingPerson] = useState(false);
  const [personNameFocused, setPersonNameFocused] = useState(false);
  const [personRelationshipFocused, setPersonRelationshipFocused] = useState(false);

  // Add Topic modal state - single source of truth
  const [isAddTopicOpen, setIsAddTopicOpen] = useState(false);
  const [selectedQuickTopic, setSelectedQuickTopic] = useState<string | null>(null);
  const [customTopicName, setCustomTopicName] = useState('');
  const [topicError, setTopicError] = useState('');
  const [savingTopic, setSavingTopic] = useState(false);
  const [customTopicFocused, setCustomTopicFocused] = useState(false);

  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const fetchData = useCallback(async () => {
    if (!userId) {
      console.log('[Home] No userId available');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      console.log('[Home] Fetching people and topics for user:', userId);
      
      const { data: peopleData, error: peopleError } = await supabase
        .from('persons')
        .select('*')
        .eq('user_id', userId)
        .neq('relationship_type', 'Topic')
        .order('created_at', { ascending: false });

      if (peopleError) {
        console.error('[Home] Error fetching people:', peopleError);
        if (isMountedRef.current) {
          setError('Failed to load your people. Please try again.');
          showErrorToast('Failed to load your people');
        }
        return;
      }

      const { data: topicsData, error: topicsError } = await supabase
        .from('persons')
        .select('*')
        .eq('user_id', userId)
        .eq('relationship_type', 'Topic')
        .order('created_at', { ascending: false });

      if (topicsError) {
        console.error('[Home] Error fetching topics:', topicsError);
        if (isMountedRef.current) {
          setError('Failed to load your topics. Please try again.');
          showErrorToast('Failed to load your topics');
        }
        return;
      }

      console.log('[Home] People loaded:', peopleData?.length || 0);
      console.log('[Home] Topics loaded:', topicsData?.length || 0);

      const peopleWithMessages = peopleData && peopleData.length > 0
        ? await Promise.all(
            peopleData.map(async (person) => {
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
                console.error('[Home] Error fetching messages for person:', person.id, err);
                return {
                  ...person,
                  lastMessage: 'No messages yet',
                  lastMessageTime: undefined,
                };
              }
            })
          )
        : [];

      const topicsWithMessages = topicsData && topicsData.length > 0
        ? await Promise.all(
            topicsData.map(async (topic) => {
              try {
                const { data: messages } = await supabase
                  .from('messages')
                  .select('content, created_at, role')
                  .eq('user_id', userId)
                  .eq('person_id', topic.id)
                  .order('created_at', { ascending: false })
                  .limit(1);

                const lastMessage = messages?.[0];
                return {
                  ...topic,
                  lastMessage: lastMessage?.content || 'No messages yet',
                  lastMessageTime: lastMessage?.created_at,
                };
              } catch (err) {
                console.error('[Home] Error fetching messages for topic:', topic.id, err);
                return {
                  ...topic,
                  lastMessage: 'No messages yet',
                  lastMessageTime: undefined,
                };
              }
            })
          )
        : [];

      if (isMountedRef.current) {
        setPeople(peopleWithMessages);
        setTopics(topicsWithMessages);
      }
    } catch (error: any) {
      console.error('[Home] Unexpected error fetching data:', error);
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
      fetchData();
    } else {
      setLoading(false);
    }
  }, [userId, fetchData]);

  const handleDeletePerson = useCallback(async (personId: string, isTopic: boolean = false) => {
    if (!personId) {
      console.error('[Home] Cannot delete - personId is missing');
      showErrorToast('Invalid data');
      return;
    }

    if (!userId) {
      console.error('[Home] Cannot delete - userId is missing');
      showErrorToast('You must be logged in');
      return;
    }

    console.log('[Home] Deleting:', isTopic ? 'topic' : 'person', personId);

    try {
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

      const { error: deleteError } = await supabase
        .from('persons')
        .delete()
        .eq('id', personId)
        .eq('user_id', userId);

      if (deleteError) {
        console.error('[Home] Error deleting:', deleteError);
        showErrorToast(isTopic ? 'Failed to delete topic' : 'Failed to delete person');
        return;
      }

      if (isMountedRef.current) {
        if (isTopic) {
          setTopics(prev => prev.filter(t => t.id !== personId));
          showSuccessToast('Topic deleted');
        } else {
          setPeople(prev => prev.filter(p => p.id !== personId));
          showSuccessToast('Person deleted');
        }
      }

      console.log('[Home] Deleted successfully');
    } catch (error: any) {
      console.error('[Home] Unexpected error deleting:', error);
      showErrorToast('An unexpected error occurred');
    }
  }, [userId]);

  const filteredPeople = useMemo(() => {
    const filtered = people.filter((person) => {
      if (!searchQuery.trim()) return true;
      
      const query = searchQuery.toLowerCase();
      const nameMatch = person.name?.toLowerCase().includes(query) || false;
      const relationshipMatch = person.relationship_type?.toLowerCase().includes(query) || false;
      
      return nameMatch || relationshipMatch;
    });

    console.log('[Home] Filtered people count:', filtered.length);
    return filtered;
  }, [people, searchQuery]);

  const filteredTopics = useMemo(() => {
    const filtered = topics.filter((topic) => {
      if (!searchQuery.trim()) return true;
      
      const query = searchQuery.toLowerCase();
      const nameMatch = topic.name?.toLowerCase().includes(query) || false;
      
      return nameMatch;
    });

    console.log('[Home] Filtered topics count:', filtered.length);
    return filtered;
  }, [topics, searchQuery]);

  // Add Person button handler - closes Add Topic modal if open, resets form, opens modal
  const handleAddPersonPress = useCallback(() => {
    console.log('[Home] Add Person button pressed');
    
    // Close Add Topic modal if open
    if (isAddTopicOpen) {
      setIsAddTopicOpen(false);
      setSelectedQuickTopic(null);
      setCustomTopicName('');
      setTopicError('');
      setCustomTopicFocused(false);
    }
    
    // Reset Add Person form state
    setPersonName('');
    setPersonRelationship('');
    setPersonNameError('');
    setPersonNameFocused(false);
    setPersonRelationshipFocused(false);
    
    // Open Add Person modal
    setIsAddPersonOpen(true);
  }, [isAddTopicOpen]);

  const handleCloseAddPersonModal = useCallback(() => {
    console.log('[Home] Closing Add Person modal');
    setIsAddPersonOpen(false);
    setPersonName('');
    setPersonRelationship('');
    setPersonNameError('');
    setPersonNameFocused(false);
    setPersonRelationshipFocused(false);
  }, []);

  const handleSaveAddPerson = useCallback(async () => {
    console.log('[Home] Save Add Person called with name:', personName, 'relationship:', personRelationship);
    
    // Validate name is not empty
    if (!personName.trim()) {
      console.log('[Home] Name validation failed - name is empty');
      setPersonNameError('Name is required');
      return;
    }

    if (!userId) {
      console.error('[Home] No userId available');
      showErrorToast('You must be logged in to add a person');
      return;
    }

    console.log('[Home] Starting save process for userId:', userId);
    setPersonNameError('');
    setSavingPerson(true);

    try {
      const trimmedName = personName.trim();
      const trimmedRelationship = personRelationship.trim();
      
      const personData = {
        user_id: userId,
        name: trimmedName,
        relationship_type: trimmedRelationship || null,
      };
      
      console.log('[Home] Inserting person data:', personData);
      
      const { data, error } = await supabase
        .from('persons')
        .insert([personData])
        .select()
        .single();

      if (error) {
        console.error('[Home] Error creating person:', error);
        
        if (isMountedRef.current) {
          showErrorToast('Failed to add person. Please try again.');
          setSavingPerson(false);
        }
        return;
      }

      console.log('[Home] Person created successfully:', data);
      
      if (isMountedRef.current) {
        showSuccessToast('Person added successfully!');
        
        // Close modal
        setIsAddPersonOpen(false);
        setPersonName('');
        setPersonRelationship('');
        setPersonNameError('');
        
        // Refresh People list immediately
        console.log('[Home] Refreshing data');
        await fetchData();
      }
      
    } catch (error: any) {
      console.error('[Home] Unexpected error creating person:', error);
      if (isMountedRef.current) {
        showErrorToast('An unexpected error occurred');
      }
    } finally {
      if (isMountedRef.current) {
        setSavingPerson(false);
        console.log('[Home] Save process complete');
      }
    }
  }, [personName, personRelationship, userId, fetchData]);

  // Add Topic button handler - closes Add Person modal if open, resets form, opens modal
  const handleAddTopicPress = useCallback(() => {
    console.log('[Home] Add Topic button pressed');
    
    // Close Add Person modal if open
    if (isAddPersonOpen) {
      setIsAddPersonOpen(false);
      setPersonName('');
      setPersonRelationship('');
      setPersonNameError('');
      setPersonNameFocused(false);
      setPersonRelationshipFocused(false);
    }
    
    // Reset Add Topic form state
    setCustomTopicName('');
    setSelectedQuickTopic(null);
    setTopicError('');
    setCustomTopicFocused(false);
    
    // Open Add Topic modal
    setIsAddTopicOpen(true);
  }, [isAddPersonOpen]);

  const handleCloseAddTopicModal = useCallback(() => {
    console.log('[Home] Closing Add Topic modal');
    setIsAddTopicOpen(false);
    setCustomTopicName('');
    setSelectedQuickTopic(null);
    setTopicError('');
    setCustomTopicFocused(false);
  }, []);

  const handleQuickTopicSelect = useCallback((topic: string) => {
    console.log('[Home] Quick topic selected:', topic);
    setSelectedQuickTopic(topic);
    setCustomTopicName(topic); // Fill the TextInput with the selected topic
    setTopicError(''); // Clear any error
  }, []);

  const handleSaveAddTopic = useCallback(async () => {
    console.log('[Home] Save Add Topic called with customTopicName:', customTopicName, 'selectedQuickTopic:', selectedQuickTopic);
    
    // Final topic name is customTopicName if non-empty, else selectedQuickTopic
    const topicName = customTopicName.trim() || selectedQuickTopic;
    
    // Validate topic name is not empty
    if (!topicName) {
      console.log('[Home] Topic validation failed - topic is empty');
      setTopicError('Please select or enter a topic');
      return;
    }

    if (!userId) {
      console.error('[Home] No userId available');
      showErrorToast('You must be logged in to add a topic');
      return;
    }

    console.log('[Home] Starting save process for topic:', topicName, 'userId:', userId);
    setTopicError('');
    setSavingTopic(true);

    try {
      // Check for duplicates before inserting
      const { data: existingTopics, error: checkError } = await supabase
        .from('persons')
        .select('*', { count: 'exact' })
        .eq('name', topicName)
        .eq('user_id', userId)
        .eq('relationship_type', 'Topic');

      if (checkError) {
        console.error('[Home] Error checking for duplicate topics:', checkError);
        showErrorToast('Failed to save topic. Please try again.');
        setSavingTopic(false);
        return;
      }

      if (existingTopics && existingTopics.length > 0) {
        console.log('[Home] Topic already exists:', topicName);
        setTopicError('This topic already exists');
        setSavingTopic(false);
        return;
      }

      // Insert topic for current authenticated user
      const topicData = {
        user_id: userId,
        name: topicName,
        relationship_type: 'Topic',
      };
      
      console.log('[Home] Inserting topic data:', topicData);
      
      const { data, error } = await supabase
        .from('persons')
        .insert([topicData])
        .select()
        .single();

      if (error) {
        console.error('[Home] Error creating topic:', error);
        
        if (isMountedRef.current) {
          showErrorToast('Failed to add topic. Please try again.');
          setSavingTopic(false);
        }
        return;
      }

      console.log('[Home] Topic created successfully:', data);
      
      if (isMountedRef.current) {
        showSuccessToast('Topic added successfully!');
        
        // Close modal
        setIsAddTopicOpen(false);
        setCustomTopicName('');
        setSelectedQuickTopic(null);
        setTopicError('');
        
        // Refresh Topics list immediately
        console.log('[Home] Refreshing data');
        await fetchData();
      }
      
    } catch (error: any) {
      console.error('[Home] Unexpected error creating topic:', error);
      if (isMountedRef.current) {
        showErrorToast('An unexpected error occurred');
      }
    } finally {
      if (isMountedRef.current) {
        setSavingTopic(false);
        console.log('[Home] Save process complete');
      }
    }
  }, [customTopicName, selectedQuickTopic, userId, fetchData]);

  const handleClosePremiumModal = useCallback(() => {
    setShowPremiumModal(false);
  }, []);

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

  const handleTopicPress = useCallback((topic: Person) => {
    if (!topic.id) {
      console.error('[Home] Cannot navigate to chat - topic.id is missing');
      showErrorToast('Invalid topic data');
      return;
    }

    console.log('[Home] Navigating to chat for topic:', topic.name, 'id:', topic.id);
    
    try {
      router.push({
        pathname: '/(tabs)/(home)/chat',
        params: { 
          personId: topic.id, 
          personName: topic.name || 'Topic',
          relationshipType: 'Topic',
          initialSubject: topic.name
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

  const planInfo = getPlanInfo();

  if (authLoading) {
    return <LoadingOverlay visible={true} />;
  }

  if (!currentUser) {
    return <Redirect href="/onboarding" />;
  }

  const hasAnyData = people.length > 0 || topics.length > 0;
  const hasFilteredResults = filteredPeople.length > 0 || filteredTopics.length > 0;

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

              {hasAnyData && (
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
                  onPress={handleAddPersonPress}
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
                  onPress={handleAddTopicPress}
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
                      onPress={fetchData}
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

              {!error && !hasAnyData && !loading ? (
                <View style={styles.emptyState}>
                  <View style={[styles.emptyIconContainer, { backgroundColor: 'rgba(255, 255, 255, 0.95)' }]}>
                    <SafeSpaceLogo size={48} color={theme.primary} />
                  </View>
                  <Text style={[styles.emptyText, { color: theme.buttonText }]}>Nothing added yet</Text>
                  <Text style={[styles.emptySubtext, { color: theme.buttonText, opacity: 0.8 }]}>
                    Tap &apos;Add Person&apos; or &apos;Add Topic&apos; to start
                  </Text>
                </View>
              ) : !error && !loading ? (
                <>
                  {!hasFilteredResults && searchQuery.trim() ? (
                    <View style={styles.noResultsContainer}>
                      <Text style={[styles.noResultsText, { color: theme.buttonText }]}>
                        No matches found
                      </Text>
                      <Text style={[styles.noResultsSubtext, { color: theme.buttonText, opacity: 0.8 }]}>
                        Try a different search term
                      </Text>
                    </View>
                  ) : (
                    <>
                      {filteredPeople.length > 0 && (
                        <View style={styles.section}>
                          <Text style={[styles.sectionHeader, { color: theme.buttonText }]}>
                            People
                          </Text>

                          <View style={styles.cards}>
                            {filteredPeople.map((person) => {
                              if (!person || !person.id) return null;

                              return (
                                <Swipeable
                                  key={person.id}
                                  renderRightActions={() => (
                                    <DeleteAction onPress={() => handleDeletePerson(person.id!, false)} />
                                  )}
                                  overshootRight={false}
                                >
                                  <PersonCard
                                    person={person}
                                    onPress={() => handlePersonPress(person)}
                                    isTopic={false}
                                  />
                                </Swipeable>
                              );
                            })}
                          </View>
                        </View>
                      )}

                      {filteredTopics.length > 0 && (
                        <View style={styles.section}>
                          <Text style={[styles.sectionHeader, { color: theme.buttonText }]}>
                            Topics
                          </Text>

                          <View style={styles.cards}>
                            {filteredTopics.map((topic) => {
                              if (!topic || !topic.id) return null;

                              return (
                                <Swipeable
                                  key={topic.id}
                                  renderRightActions={() => (
                                    <DeleteAction onPress={() => handleDeletePerson(topic.id!, true)} />
                                  )}
                                  overshootRight={false}
                                >
                                  <PersonCard
                                    person={topic}
                                    onPress={() => handleTopicPress(topic)}
                                    isTopic={true}
                                  />
                                </Swipeable>
                              );
                            })}
                          </View>
                        </View>
                      )}
                    </>
                  )}
                </>
              ) : null}
            </ScrollView>

            {/* Add Person Modal - REBUILT from scratch for iOS + web consistency */}
            <Modal
              visible={isAddPersonOpen}
              transparent={true}
              animationType="slide"
              presentationStyle="pageSheet"
              onRequestClose={handleCloseAddPersonModal}
            >
              <Pressable 
                style={styles.addPersonModalOverlay}
                onPress={handleCloseAddPersonModal}
              >
                <Pressable 
                  style={styles.addPersonModalInner}
                  onPress={(e) => e.stopPropagation()}
                >
                  <KeyboardAvoidingView
                    behavior="padding"
                    keyboardVerticalOffset={0}
                    style={styles.addPersonKeyboardAvoid}
                  >
                    <View style={[
                      styles.addPersonSheetCard, 
                      { 
                        backgroundColor: theme.cardBackground,
                      }
                    ]}>
                      {/* Header */}
                      <View style={styles.addPersonModalHeader}>
                        <Text style={[styles.addPersonModalTitle, { color: theme.textPrimary }]}>
                          Add Person
                        </Text>
                        <TouchableOpacity 
                          onPress={handleCloseAddPersonModal} 
                          style={styles.addPersonCloseButton}
                          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                        >
                          <IconSymbol
                            ios_icon_name="xmark"
                            android_material_icon_name="close"
                            size={24}
                            color={theme.textSecondary}
                          />
                        </TouchableOpacity>
                      </View>

                      {/* ScrollView with inputs */}
                      <ScrollView
                        style={styles.addPersonScrollView}
                        contentContainerStyle={styles.addPersonScrollContent}
                        keyboardShouldPersistTaps="handled"
                        showsVerticalScrollIndicator={false}
                      >
                        {/* Name Input */}
                        <View style={styles.addPersonFieldContainer}>
                          <Text style={[styles.addPersonInputLabel, { color: theme.textPrimary }]}>
                            Name <Text style={styles.addPersonRequired}>*</Text>
                          </Text>
                          <View style={[
                            styles.addPersonTextInputWrapper, 
                            { 
                              backgroundColor: theme.background, 
                              borderWidth: personNameFocused ? 2 : 1.5, 
                              borderColor: personNameError 
                                ? '#FF3B30' 
                                : personNameFocused 
                                  ? theme.primary 
                                  : theme.textSecondary + '40',
                            }
                          ]}>
                            <TextInput
                              style={[styles.addPersonTextInput, { color: theme.textPrimary }]}
                              placeholder="Enter their name"
                              placeholderTextColor={theme.textSecondary}
                              value={personName}
                              onChangeText={(text) => {
                                console.log('[Home] Person name changed to:', text);
                                setPersonName(text);
                                if (personNameError && text.trim()) {
                                  setPersonNameError('');
                                }
                              }}
                              onFocus={() => {
                                console.log('[Home] Name input focused');
                                setPersonNameFocused(true);
                              }}
                              onBlur={() => {
                                console.log('[Home] Name input blurred');
                                setPersonNameFocused(false);
                              }}
                              autoCapitalize="words"
                              autoCorrect={false}
                              maxLength={50}
                              editable={!savingPerson}
                              returnKeyType="next"
                              autoFocus={false}
                            />
                          </View>
                          {personNameError ? (
                            <Text style={styles.addPersonErrorText}>{personNameError}</Text>
                          ) : null}
                        </View>

                        {/* Relationship Type Input */}
                        <View style={styles.addPersonFieldContainer}>
                          <Text style={[styles.addPersonInputLabel, { color: theme.textPrimary }]}>
                            Relationship Type
                          </Text>
                          <View style={[
                            styles.addPersonTextInputWrapper, 
                            { 
                              backgroundColor: theme.background, 
                              borderWidth: personRelationshipFocused ? 2 : 1.5, 
                              borderColor: personRelationshipFocused 
                                ? theme.primary 
                                : theme.textSecondary + '40',
                            }
                          ]}>
                            <TextInput
                              style={[styles.addPersonTextInput, { color: theme.textPrimary }]}
                              placeholder="partner, ex, friend, parent..."
                              placeholderTextColor={theme.textSecondary}
                              value={personRelationship}
                              onChangeText={(text) => {
                                console.log('[Home] Person relationship changed to:', text);
                                setPersonRelationship(text);
                              }}
                              onFocus={() => {
                                console.log('[Home] Relationship input focused');
                                setPersonRelationshipFocused(true);
                              }}
                              onBlur={() => {
                                console.log('[Home] Relationship input blurred');
                                setPersonRelationshipFocused(false);
                              }}
                              autoCapitalize="words"
                              autoCorrect={false}
                              maxLength={50}
                              editable={!savingPerson}
                              returnKeyType="done"
                              onSubmitEditing={handleSaveAddPerson}
                              autoFocus={false}
                            />
                          </View>
                        </View>

                        {/* Bottom row buttons */}
                        <View style={styles.addPersonModalFooter}>
                          <TouchableOpacity
                            onPress={handleCloseAddPersonModal}
                            style={[styles.addPersonSecondaryButton, { borderColor: theme.textSecondary }]}
                            disabled={savingPerson}
                            activeOpacity={0.7}
                          >
                            <Text style={[styles.addPersonSecondaryButtonText, { color: theme.textSecondary }]}>
                              Cancel
                            </Text>
                          </TouchableOpacity>

                          <TouchableOpacity
                            onPress={handleSaveAddPerson}
                            style={styles.addPersonPrimaryButton}
                            disabled={savingPerson}
                            activeOpacity={0.8}
                          >
                            <LinearGradient
                              colors={theme.primaryGradient}
                              start={{ x: 0, y: 0 }}
                              end={{ x: 1, y: 1 }}
                              style={styles.addPersonPrimaryButtonGradient}
                            >
                              <Text style={[styles.addPersonPrimaryButtonText, { color: theme.buttonText }]}>
                                {savingPerson ? 'Saving...' : 'Save'}
                              </Text>
                            </LinearGradient>
                          </TouchableOpacity>
                        </View>
                      </ScrollView>
                    </View>
                  </KeyboardAvoidingView>
                </Pressable>
              </Pressable>
            </Modal>

            {/* Add Topic Modal - REBUILT with proper bottom-sheet structure */}
            <Modal
              visible={isAddTopicOpen}
              transparent={true}
              animationType="slide"
              presentationStyle="pageSheet"
              onRequestClose={handleCloseAddTopicModal}
            >
              <Pressable 
                style={styles.addTopicModalOverlay}
                onPress={handleCloseAddTopicModal}
              >
                <Pressable 
                  style={styles.addTopicModalInner}
                  onPress={(e) => e.stopPropagation()}
                >
                  <KeyboardAvoidingView
                    behavior="padding"
                    keyboardVerticalOffset={0}
                    style={styles.addTopicKeyboardAvoid}
                  >
                    <View style={[
                      styles.addTopicSheetCard, 
                      { 
                        backgroundColor: theme.cardBackground,
                      }
                    ]}>
                      {/* Header */}
                      <View style={styles.addTopicModalHeader}>
                        <Text style={[styles.addTopicModalTitle, { color: theme.textPrimary }]}>
                          Add Topic
                        </Text>
                        <TouchableOpacity 
                          onPress={handleCloseAddTopicModal} 
                          style={styles.addTopicCloseButton}
                          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                        >
                          <IconSymbol
                            ios_icon_name="xmark"
                            android_material_icon_name="close"
                            size={24}
                            color={theme.textSecondary}
                          />
                        </TouchableOpacity>
                      </View>

                      {/* ScrollView with chips and input */}
                      <ScrollView
                        style={styles.addTopicScrollView}
                        contentContainerStyle={styles.addTopicScrollContent}
                        keyboardShouldPersistTaps="handled"
                        showsVerticalScrollIndicator={false}
                      >
                        {/* Quick-select topic chips */}
                        <View style={styles.addTopicChipsContainer}>
                          <Text style={[styles.addTopicHelperText, { color: theme.textSecondary }]}>
                            Quick select:
                          </Text>
                          <View style={styles.addTopicChipsWrapper}>
                            {DEFAULT_TOPICS.map((topic, index) => (
                              <TouchableOpacity
                                key={`topic-chip-${index}`}
                                onPress={() => handleQuickTopicSelect(topic)}
                                activeOpacity={0.7}
                                style={[
                                  styles.addTopicChip,
                                  {
                                    backgroundColor:
                                      selectedQuickTopic === topic 
                                        ? theme.primary 
                                        : theme.background,
                                    borderWidth: 1.5,
                                    borderColor:
                                      selectedQuickTopic === topic 
                                        ? theme.primary 
                                        : theme.textSecondary + '40',
                                  }
                                ]}
                              >
                                <Text style={[
                                  styles.addTopicChipText,
                                  {
                                    color: selectedQuickTopic === topic 
                                      ? theme.buttonText 
                                      : theme.textPrimary,
                                  }
                                ]}>
                                  {topic}
                                </Text>
                              </TouchableOpacity>
                            ))}
                          </View>
                        </View>

                        {/* Custom Topic Input */}
                        <View style={styles.addTopicFieldContainer}>
                          <Text style={[styles.addTopicInputLabel, { color: theme.textPrimary }]}>
                            Or type a custom topic:
                          </Text>
                          <View style={[
                            styles.addTopicTextInputWrapper, 
                            { 
                              backgroundColor: theme.background, 
                              borderWidth: customTopicFocused ? 2 : 1.5, 
                              borderColor: topicError 
                                ? '#FF3B30' 
                                : customTopicFocused 
                                  ? theme.primary 
                                  : theme.textSecondary + '40',
                            }
                          ]}>
                            <TextInput
                              style={[styles.addTopicTextInput, { color: theme.textPrimary }]}
                              placeholder="Enter your own topic..."
                              placeholderTextColor={theme.textSecondary}
                              value={customTopicName}
                              onChangeText={(text) => {
                                console.log('[Home] Custom topic name changed to:', text);
                                setCustomTopicName(text);
                                if (topicError && text.trim()) {
                                  setTopicError('');
                                }
                                // Clear selected quick topic when user types
                                if (text.trim() && selectedQuickTopic) {
                                  setSelectedQuickTopic(null);
                                }
                              }}
                              onFocus={() => {
                                console.log('[Home] Custom topic input focused');
                                setCustomTopicFocused(true);
                              }}
                              onBlur={() => {
                                console.log('[Home] Custom topic input blurred');
                                setCustomTopicFocused(false);
                              }}
                              autoCapitalize="sentences"
                              autoCorrect={false}
                              maxLength={100}
                              editable={!savingTopic}
                              returnKeyType="done"
                              onSubmitEditing={handleSaveAddTopic}
                              autoFocus={false}
                            />
                          </View>
                          {topicError ? (
                            <Text style={styles.addTopicErrorText}>{topicError}</Text>
                          ) : null}
                        </View>

                        {/* Bottom row buttons */}
                        <View style={styles.addTopicModalFooter}>
                          <TouchableOpacity
                            onPress={handleCloseAddTopicModal}
                            style={[styles.addTopicSecondaryButton, { borderColor: theme.textSecondary }]}
                            disabled={savingTopic}
                            activeOpacity={0.7}
                          >
                            <Text style={[styles.addTopicSecondaryButtonText, { color: theme.textSecondary }]}>
                              Cancel
                            </Text>
                          </TouchableOpacity>

                          <TouchableOpacity
                            onPress={handleSaveAddTopic}
                            style={styles.addTopicPrimaryButton}
                            disabled={savingTopic}
                            activeOpacity={0.8}
                          >
                            <LinearGradient
                              colors={theme.primaryGradient}
                              start={{ x: 0, y: 0 }}
                              end={{ x: 1, y: 1 }}
                              style={styles.addTopicPrimaryButtonGradient}
                            >
                              <Text style={[styles.addTopicPrimaryButtonText, { color: theme.buttonText }]}>
                                {savingTopic ? 'Saving...' : 'Save'}
                              </Text>
                            </LinearGradient>
                          </TouchableOpacity>
                        </View>
                      </ScrollView>
                    </View>
                  </KeyboardAvoidingView>
                </Pressable>
              </Pressable>
            </Modal>

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
                    color={theme.primary}
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
                      colors={theme.primaryGradient}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={styles.premiumPrimaryButtonGradient}
                    >
                      <Text style={[styles.premiumPrimaryButtonText, { color: theme.buttonText }]}>
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
  section: {
    marginBottom: 32,
  },
  sectionHeader: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 12,
    opacity: 0.9,
  },
  cards: {
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
  // Add Person Modal Styles - REBUILT from scratch for iOS + web consistency
  addPersonModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.35)',
    justifyContent: 'flex-end',
  },
  addPersonModalInner: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  addPersonKeyboardAvoid: {
    width: '100%',
  },
  addPersonSheetCard: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 20,
    paddingBottom: 16,
    minHeight: 400,
  },
  addPersonModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.1)',
  },
  addPersonModalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  addPersonCloseButton: {
    padding: 4,
  },
  addPersonScrollView: {
    flex: 1,
  },
  addPersonScrollContent: {
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 16,
  },
  addPersonFieldContainer: {
    marginBottom: 24,
  },
  addPersonInputLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  addPersonRequired: {
    color: '#FF3B30',
  },
  addPersonTextInputWrapper: {
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: Platform.OS === 'ios' ? 14 : 12,
  },
  addPersonTextInput: {
    fontSize: 16,
    lineHeight: 20,
    minHeight: 20,
  },
  addPersonErrorText: {
    color: '#FF3B30',
    fontSize: 12,
    marginTop: 6,
  },
  addPersonModalFooter: {
    flexDirection: 'row',
    paddingTop: 16,
    gap: 12,
  },
  addPersonSecondaryButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 50,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addPersonSecondaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  addPersonPrimaryButton: {
    flex: 1,
    borderRadius: 50,
    overflow: 'hidden',
  },
  addPersonPrimaryButtonGradient: {
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addPersonPrimaryButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  // Add Topic Modal Styles - REBUILT with proper bottom-sheet structure
  addTopicModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.35)',
    justifyContent: 'flex-end',
  },
  addTopicModalInner: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  addTopicKeyboardAvoid: {
    width: '100%',
  },
  addTopicSheetCard: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 20,
    paddingBottom: 16,
    minHeight: 500,
  },
  addTopicModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.1)',
  },
  addTopicModalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  addTopicCloseButton: {
    padding: 4,
  },
  addTopicScrollView: {
    flex: 1,
  },
  addTopicScrollContent: {
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 16,
  },
  addTopicChipsContainer: {
    marginBottom: 28,
  },
  addTopicHelperText: {
    fontSize: 15,
    marginBottom: 12,
    fontWeight: '500',
  },
  addTopicChipsWrapper: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  addTopicChip: {
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderRadius: 24,
  },
  addTopicChipText: {
    fontSize: 14,
    fontWeight: '600',
  },
  addTopicFieldContainer: {
    marginBottom: 24,
  },
  addTopicInputLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  addTopicTextInputWrapper: {
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: Platform.OS === 'ios' ? 14 : 12,
  },
  addTopicTextInput: {
    fontSize: 16,
    lineHeight: 20,
    minHeight: 20,
  },
  addTopicErrorText: {
    color: '#FF3B30',
    fontSize: 12,
    marginTop: 6,
  },
  addTopicModalFooter: {
    flexDirection: 'row',
    paddingTop: 16,
    gap: 12,
  },
  addTopicSecondaryButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 50,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addTopicSecondaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  addTopicPrimaryButton: {
    flex: 1,
    borderRadius: 50,
    overflow: 'hidden',
  },
  addTopicPrimaryButtonGradient: {
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addTopicPrimaryButtonText: {
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
    fontSize: 15,
    fontWeight: 'bold',
  },
});
