
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

export default function HomeScreen() {
  const { currentUser, userId, role, isPremium, loading: authLoading } = useAuth();
  const { theme } = useThemeContext();
  
  // CRITICAL: Separate state for People and Topics
  const [people, setPeople] = useState<PersonWithLastMessage[]>([]);
  const [topics, setTopics] = useState<PersonWithLastMessage[]>([]);
  
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

  /**
   * CRITICAL FIX: Fetch People and Topics separately
   * - People: relationship_type != 'Topic'
   * - Topics: relationship_type = 'Topic'
   */
  const fetchData = useCallback(async () => {
    if (!userId) {
      console.log('[Home] No userId available');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      console.log('[Home] Fetching people and topics for user:', userId);
      
      // Fetch ONLY people (NOT topics)
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

      // Fetch ONLY topics
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

      // Process people with last messages
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

      // Process topics with last messages
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
      // CRITICAL: Delete messages with BOTH user_id AND person_id filter
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

      // CRITICAL: Delete person/topic with BOTH id AND user_id filter
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

      // Update local state
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

  /**
   * Filter people (exclude topics)
   */
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

  /**
   * Filter topics
   */
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

  const handleAddPerson = useCallback(() => {
    console.log('[Home] handleAddPerson called');
    
    setShowAddModal(true);
    setName('');
    setRelationshipType('');
    setNameError('');
  }, []);

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
   * FIXED: Handle person creation WITHOUT duplicate checking
   * - Creates ONLY a Person record (NOT a topic)
   * - Appears ONLY in People list
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
      const trimmedRelationship = relationshipType.trim();
      
      // CRITICAL: Create a Person record (NOT a topic)
      // relationship_type should NOT be 'Topic'
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
          setSaving(false);
        }
        return;
      }

      console.log('[Home] Person created successfully:', data);
      
      if (isMountedRef.current) {
        showSuccessToast('Person added successfully!');
        
        setShowAddModal(false);
        setName('');
        setRelationshipType('');
        setNameError('');
        
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
        setSaving(false);
        console.log('[Home] Save process complete');
      }
    }
  }, [name, relationshipType, userId, fetchData]);

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

  // Subject/Topic modal handlers
  const handleAddSubject = useCallback(() => {
    console.log('[Home] Opening Add Subject modal');

    setShowSubjectModal(true);
    setSelectedTopic(null);
    setCustomTopic('');
  }, []);

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
   * FIXED: Handle topic creation WITHOUT duplicate checking
   * - Creates ONLY a Topic record (relationship_type = 'Topic')
   * - Appears ONLY in Topics list
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
      // CRITICAL: Create a Topic record with relationship_type = 'Topic'
      console.log('[Home] Creating new topic');
      const { data: newTopic, error: insertError } = await supabase
        .from('persons')
        .insert([{
          user_id: userId,
          name: subjectString,
          relationship_type: 'Topic',
        }])
        .select()
        .single();

      if (insertError) {
        console.error('[Home] Error creating topic:', insertError);
        showErrorToast('Failed to create topic');
        setSavingSubject(false);
        return;
      }

      console.log('[Home] Topic created:', newTopic);

      if (!newTopic.id) {
        console.error('[Home] Topic ID is missing');
        showErrorToast('Invalid topic data');
        setSavingSubject(false);
        return;
      }

      console.log('[Home] Navigating to chat for topic:', newTopic.name, 'id:', newTopic.id);

      // Close modal
      setShowSubjectModal(false);
      setSelectedTopic(null);
      setCustomTopic('');

      // Navigate to chat
      router.push({
        pathname: '/(tabs)/(home)/chat',
        params: {
          personId: newTopic.id,
          personName: newTopic.name || 'Topic',
          relationshipType: 'Topic',
          initialSubject: subjectString,
        },
      });

      // Refresh data to show the new topic
      await fetchData();

    } catch (error: any) {
      console.error('[Home] Unexpected error saving topic:', error);
      showErrorToast('An unexpected error occurred');
    } finally {
      if (isMountedRef.current) {
        setSavingSubject(false);
      }
    }
  }, [customTopic, selectedTopic, userId, fetchData]);

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
                      {/* PEOPLE SECTION */}
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

                      {/* TOPICS SECTION */}
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

            <SwipeableModal
              visible={showAddModal}
              onClose={handleCloseModal}
              animationType="slide"
              showHandle={true}
            >
              <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.modalKeyboardView}
                keyboardVerticalOffset={0}
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
                        borderWidth: 1.5, 
                        borderColor: nameError ? '#FF3B30' : theme.textSecondary + '40'
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
                        autoFocus={true}
                        cursorColor={theme.primary}
                        selectionColor={Platform.OS === 'ios' ? theme.primary : theme.primary + '40'}
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
                        borderWidth: 1.5, 
                        borderColor: theme.textSecondary + '40'
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
                        cursorColor={theme.primary}
                        selectionColor={Platform.OS === 'ios' ? theme.primary : theme.primary + '40'}
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
                keyboardVerticalOffset={0}
              >
                <View style={styles.modalHeader}>
                  <Text style={[styles.modalTitle, { color: theme.textPrimary }]}>Add Topic</Text>
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
                            borderWidth: 1.5,
                            borderColor: selectedTopic === topic 
                              ? theme.primary 
                              : theme.textSecondary + '40',
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
                        borderWidth: 1.5, 
                        borderColor: theme.textSecondary + '40'
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
                        cursorColor={theme.primary}
                        selectionColor={Platform.OS === 'ios' ? theme.primary : theme.primary + '40'}
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
    fontSize: 15,
    fontWeight: 'bold',
  },
});
