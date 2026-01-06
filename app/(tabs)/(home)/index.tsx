
import React, { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Platform, TextInput, LogBox, Modal, Pressable, KeyboardAvoidingView } from 'react-native';
import { router, Redirect } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Swipeable } from 'react-native-gesture-handler';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import { useAuth } from '@/contexts/AuthContext';
import { useThemeContext } from '@/contexts/ThemeContext';
import { supabase } from '@/lib/supabase';
import { Person } from '@/types/database.types';
import { IconSymbol } from '@/components/IconSymbol';
import { PersonCard } from '@/components/ui/PersonCard';
import { LoadingOverlay } from '@/components/ui/LoadingOverlay';
import { SafeSpaceLogo } from '@/components/SafeSpaceLogo';
import { showErrorToast, showSuccessToast } from '@/utils/toast';
import FloatingTabBar from '@/components/FloatingTabBar';
import AddPersonSheet from '@/components/ui/AddPersonSheet';
import { SwipeableCenterModal } from '@/components/ui/SwipeableCenterModal';
import { memoryCache } from '@/lib/cache/memoryCache';

LogBox.ignoreLogs([
  'Each child in a list should have a unique "key" prop',
]);

interface PersonWithLastMessage extends Person {
  lastMessage?: string;
  lastMessageTime?: string;
  lastActivityAt?: string;
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
    activeOpacity={0.7}
  >
    <IconSymbol
      ios_icon_name="trash.fill"
      android_material_icon_name="delete"
      size={28}
      color="#fff"
    />
  </TouchableOpacity>
);

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

  const [isAddPersonOpen, setIsAddPersonOpen] = useState(false);

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
      const cachedPeople = memoryCache.getPeopleList();
      const cachedTopics = memoryCache.getTopicsList();
      
      if (cachedPeople.length > 0 || cachedTopics.length > 0) {
        console.log('[Home] Loading from cache:', {
          people: cachedPeople.length,
          topics: cachedTopics.length,
        });
        
        if (isMountedRef.current) {
          setPeople(cachedPeople);
          setTopics(cachedTopics);
          setLoading(false);
        }
      } else {
        console.log('[Home] Cache empty, showing loading state');
        setLoading(true);
      }
      
      setError(null);
      
      console.log('[Home] Revalidating data in background for user:', userId);
      
      const { data: lastMessageData, error: lastMessageError } = await supabase
        .from('messages')
        .select('person_id, created_at')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (lastMessageError) {
        console.error('[Home] Error fetching last messages:', lastMessageError);
      }

      const lastMessageMap = new Map<string, string>();
      if (lastMessageData && lastMessageData.length > 0) {
        lastMessageData.forEach((msg) => {
          if (msg.person_id && msg.created_at) {
            const existing = lastMessageMap.get(msg.person_id);
            if (!existing || msg.created_at > existing) {
              lastMessageMap.set(msg.person_id, msg.created_at);
            }
          }
        });
      }

      console.log('[Home] Last message map size:', lastMessageMap.size);
      
      const { data: peopleData, error: peopleError } = await supabase
        .from('persons')
        .select('*')
        .eq('user_id', userId)
        .or('relationship_type.is.null,relationship_type.neq.Topic');

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
        .eq('relationship_type', 'Topic');

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

      const peopleWithMessages: PersonWithLastMessage[] = peopleData && peopleData.length > 0
        ? peopleData.map((person) => {
            const lastMessageAt = lastMessageMap.get(person.id);
            const lastActivityAt = lastMessageAt || person.created_at;
            
            return {
              ...person,
              lastMessage: lastMessageAt ? 'Recent activity' : 'No messages yet',
              lastMessageTime: lastMessageAt,
              lastActivityAt,
            };
          })
        : [];

      const topicsWithMessages: PersonWithLastMessage[] = topicsData && topicsData.length > 0
        ? topicsData.map((topic) => {
            const lastMessageAt = lastMessageMap.get(topic.id);
            const lastActivityAt = lastMessageAt || topic.created_at;
            
            return {
              ...topic,
              lastMessage: lastMessageAt ? 'Recent activity' : 'No messages yet',
              lastMessageTime: lastMessageAt,
              lastActivityAt,
            };
          })
        : [];

      peopleWithMessages.sort((a, b) => {
        const aTime = a.lastActivityAt;
        const bTime = b.lastActivityAt;
        
        if (!aTime && !bTime) return 0;
        if (!aTime) return 1;
        if (!bTime) return -1;
        
        return new Date(bTime).getTime() - new Date(aTime).getTime();
      });

      topicsWithMessages.sort((a, b) => {
        const aTime = a.lastActivityAt;
        const bTime = b.lastActivityAt;
        
        if (!aTime && !bTime) return 0;
        if (!aTime) return 1;
        if (!bTime) return -1;
        
        return new Date(bTime).getTime() - new Date(aTime).getTime();
      });

      console.log('[Home] People sorted by activity:', peopleWithMessages.map(p => ({ name: p.name, lastActivityAt: p.lastActivityAt })));
      console.log('[Home] Topics sorted by activity:', topicsWithMessages.map(t => ({ name: t.name, lastActivityAt: t.lastActivityAt })));

      memoryCache.setPeopleList(peopleWithMessages);
      memoryCache.setTopicsList(topicsWithMessages);
      
      const activities = [...peopleWithMessages, ...topicsWithMessages]
        .filter(item => item.lastActivityAt)
        .map(item => ({
          personId: item.id,
          timestamp: item.lastActivityAt!,
        }));
      
      if (activities.length > 0) {
        memoryCache.setLastActivityBulk(activities);
      }

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

  useFocusEffect(
    useCallback(() => {
      console.log('[Home] Screen focused - refreshing data');
      if (userId) {
        fetchData();
      }
    }, [userId, fetchData])
  );

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

      if (isTopic) {
        const updatedTopics = topics.filter(t => t.id !== personId);
        memoryCache.setTopicsList(updatedTopics);
      } else {
        const updatedPeople = people.filter(p => p.id !== personId);
        memoryCache.setPeopleList(updatedPeople);
      }

      console.log('[Home] Deleted successfully');
    } catch (error: any) {
      console.error('[Home] Unexpected error deleting:', error);
      showErrorToast('An unexpected error occurred');
    }
  }, [userId, people, topics]);

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

  const handleAddPersonPress = useCallback(() => {
    console.log('[Home] Add Person button pressed');
    
    if (isAddTopicOpen) {
      setIsAddTopicOpen(false);
      setSelectedQuickTopic(null);
      setCustomTopicName('');
      setTopicError('');
      setCustomTopicFocused(false);
    }
    
    setIsAddPersonOpen(true);
    console.log('[Home] Add Person modal opened');
  }, [isAddTopicOpen]);

  const handlePersonCreated = useCallback((newPerson: Person) => {
    console.log('[Home] handlePersonCreated called with:', newPerson);
    
    if (newPerson.relationship_type === 'Topic') {
      console.warn('[Home] New person has relationship_type "Topic", skipping optimistic update');
      return;
    }
    
    const newPersonWithMessage: PersonWithLastMessage = {
      ...newPerson,
      lastMessage: 'No messages yet',
      lastMessageTime: undefined,
      lastActivityAt: newPerson.created_at,
    };
    
    console.log('[Home] Performing optimistic update - adding person to top of list');
    setPeople(prev => {
      const updated = [newPersonWithMessage, ...prev];
      memoryCache.setPeopleList(updated);
      return updated;
    });
    
    console.log('[Home] Triggering data re-sync with Supabase');
    if (userId) {
      fetchData();
    }
  }, [userId, fetchData]);

  const handleAddTopicPress = useCallback(() => {
    console.log('[Home] Add Topic button pressed');
    
    if (isAddPersonOpen) {
      setIsAddPersonOpen(false);
    }
    
    setSelectedQuickTopic(null);
    setCustomTopicName('');
    setTopicError('');
    setCustomTopicFocused(false);
    
    setIsAddTopicOpen(true);
    console.log('[Home] Add Topic modal opened');
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
    setCustomTopicName('');
    setTopicError('');
  }, []);

  const handleCustomTopicChange = useCallback((text: string) => {
    console.log('[Home] Custom topic name changed to:', text);
    setCustomTopicName(text);
    if (topicError && text.trim()) {
      setTopicError('');
    }
    if (text.trim() && selectedQuickTopic) {
      setSelectedQuickTopic(null);
    }
  }, [topicError, selectedQuickTopic]);

  const handleSaveAddTopic = useCallback(async () => {
    console.log('[Home] Save Add Topic called');
    
    const topicName = selectedQuickTopic || customTopicName.trim();
    
    if (!topicName) {
      console.log('[Home] Topic validation failed - topic is empty');
      setTopicError('Please select a topic or type a custom one');
      return;
    }

    if (!userId) {
      console.error('[Home] No userId available');
      showErrorToast('You must be logged in to add a topic');
      return;
    }

    console.log('[Home] Starting save process for topic:', topicName);
    setTopicError('');
    setSavingTopic(true);

    try {
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
          const errorMessage = error.message || 'Failed to add topic. Please try again.';
          showErrorToast(errorMessage);
          setSavingTopic(false);
        }
        return;
      }

      console.log('[Home] Topic created successfully:', data);
      
      if (isMountedRef.current) {
        showSuccessToast('Topic added successfully!');
        
        setIsAddTopicOpen(false);
        setSelectedQuickTopic(null);
        setCustomTopicName('');
        setTopicError('');
        setCustomTopicFocused(false);
        
        if (data && data.id) {
          console.log('[Home] Navigating to chat for new topic:', data.name);
          router.push({
            pathname: '/(tabs)/(home)/chat',
            params: { 
              personId: data.id, 
              personName: data.name || 'Topic',
              relationshipType: 'Topic',
              initialSubject: data.name
            },
          });
        }
        
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
    console.log('[Home] Closing premium modal');
    setShowPremiumModal(false);
  }, []);

  const handlePersonPress = useCallback((person: Person) => {
    if (!person.id) {
      console.error('[Home] Cannot navigate to chat - person.id is missing');
      showErrorToast('Invalid person data');
      return;
    }

    console.log('[Home] Person card pressed, navigating to chat:', person.name);
    
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

    console.log('[Home] Topic card pressed, navigating to chat:', topic.name);
    
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
    console.log('[Home] Settings button pressed');
    try {
      router.push('/(tabs)/settings');
    } catch (error) {
      console.error('[Home] Settings navigation error:', error);
      showErrorToast('Failed to open settings');
    }
  }, []);

  useEffect(() => {
    console.log('[Home] isAddPersonOpen state changed to:', isAddPersonOpen);
  }, [isAddPersonOpen]);

  if (authLoading) {
    return <LoadingOverlay visible={true} />;
  }

  if (!currentUser) {
    return <Redirect href="/onboarding" />;
  }

  const hasAnyData = people.length > 0 || topics.length > 0;
  const hasFilteredResults = filteredPeople.length > 0 || filteredTopics.length > 0;
  const isStartChatEnabled = !!(selectedQuickTopic || customTopicName.trim());

  return (
    <>
      <StatusBar style="light" translucent />
      <LinearGradient
        colors={theme.primaryGradient}
        style={styles.gradientBackground}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
          <View style={styles.container}>
            <View style={styles.topHeader}>
              <View style={styles.headerTitleContainer}>
                <Text style={[styles.headerTitle, { color: theme.buttonText }]}>Safe Space</Text>
                <Text style={[styles.headerSubtitle, { color: theme.buttonText, opacity: 0.9 }]}>
                  What do you want to talk about?
                </Text>
              </View>
              <TouchableOpacity 
                onPress={handleSettingsPress} 
                style={styles.settingsButton}
                activeOpacity={0.7}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
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
              contentContainerStyle={[
                styles.scrollContent,
                { paddingBottom: 60 + insets.bottom + 16 }
              ]}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
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
                    <TouchableOpacity 
                      onPress={() => setSearchQuery('')} 
                      style={styles.clearButton}
                      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    >
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
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
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
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
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
                      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
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

            <AddPersonSheet
              visible={isAddPersonOpen}
              onClose={() => {
                console.log('[Home] Closing Add Person sheet');
                setIsAddPersonOpen(false);
              }}
              userId={userId}
              theme={theme}
              insets={insets}
              onPersonCreated={handlePersonCreated}
            />

            <Modal
              visible={isAddTopicOpen}
              transparent={true}
              animationType="slide"
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
                    style={styles.addTopicKeyboardAvoid}
                    behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                    keyboardVerticalOffset={0}
                  >
                    <View style={styles.addTopicSheetCard}>
                      <View style={styles.addTopicModalHeader}>
                        <Text style={styles.addTopicModalTitle}>
                          Add Topic
                        </Text>
                        <TouchableOpacity 
                          onPress={handleCloseAddTopicModal} 
                          style={styles.addTopicCloseButton}
                          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                          activeOpacity={0.7}
                        >
                          <Ionicons name="close" size={28} color="#333" />
                        </TouchableOpacity>
                      </View>

                      <ScrollView
                        style={styles.addTopicScrollView}
                        contentContainerStyle={styles.addTopicScrollContent}
                        keyboardShouldPersistTaps="handled"
                        keyboardDismissMode="interactive"
                        showsVerticalScrollIndicator={false}
                      >
                        <View style={styles.addTopicChipsContainer}>
                          <Text style={styles.addTopicHelperText}>
                            Quick select:
                          </Text>
                          <View style={styles.addTopicChipsWrapper}>
                            {DEFAULT_TOPICS.map((topic, index) => (
                              <TouchableOpacity
                                key={`topic-chip-${index}`}
                                onPress={() => handleQuickTopicSelect(topic)}
                                activeOpacity={0.7}
                                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                                style={[
                                  styles.addTopicChip,
                                  selectedQuickTopic === topic && styles.addTopicChipSelected
                                ]}
                              >
                                <Text style={[
                                  styles.addTopicChipText,
                                  selectedQuickTopic === topic && styles.addTopicChipTextSelected
                                ]}>
                                  {topic}
                                </Text>
                              </TouchableOpacity>
                            ))}
                          </View>
                        </View>

                        <View style={styles.addTopicFieldContainer}>
                          <Text style={styles.addTopicInputLabel}>
                            Or type a custom topic:
                          </Text>
                          <View style={[
                            styles.addTopicInputRowContainer,
                            topicError ? styles.addTopicInputRowError : null
                          ]}>
                            <TextInput
                              style={styles.addTopicTextInput}
                              placeholder="Enter your own topic..."
                              placeholderTextColor="#999"
                              value={customTopicName}
                              onChangeText={handleCustomTopicChange}
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

                        {selectedQuickTopic && (
                          <View style={styles.addTopicSelectedIndicator}>
                            <Text style={styles.addTopicSelectedText}>
                              Selected: <Text style={styles.addTopicSelectedValue}>{selectedQuickTopic}</Text>
                            </Text>
                          </View>
                        )}
                      </ScrollView>

                      <View style={styles.addTopicModalFooter}>
                        <TouchableOpacity
                          onPress={handleCloseAddTopicModal}
                          style={styles.addTopicCancelButton}
                          disabled={savingTopic}
                          activeOpacity={0.7}
                          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                        >
                          <Text style={styles.addTopicCancelButtonText}>
                            Cancel
                          </Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                          onPress={handleSaveAddTopic}
                          style={[
                            styles.addTopicSaveButton,
                            !isStartChatEnabled && styles.addTopicSaveButtonDisabled
                          ]}
                          disabled={savingTopic || !isStartChatEnabled}
                          activeOpacity={0.8}
                          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                        >
                          <LinearGradient
                            colors={isStartChatEnabled ? theme.primaryGradient : ['#ccc', '#ccc']}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                            style={styles.addTopicSaveButtonGradient}
                          >
                            <Text style={styles.addTopicSaveButtonText}>
                              {savingTopic ? 'Saving...' : 'Start Chat'}
                            </Text>
                          </LinearGradient>
                        </TouchableOpacity>
                      </View>
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
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  >
                    <Text style={[styles.premiumSecondaryButtonText, { color: theme.textSecondary }]}>
                      Not now
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={handleClosePremiumModal}
                    style={styles.premiumPrimaryButton}
                    activeOpacity={0.8}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
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
            label: 'Home',
          },
          {
            name: 'library',
            route: '/(tabs)/library',
            icon: 'menu-book',
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
    alignItems: 'flex-start',
    paddingHorizontal: 24,
    paddingTop: Platform.OS === 'android' ? 8 : 0,
    paddingBottom: 16,
  },
  headerTitleContainer: {
    flex: 1,
    marginRight: 12,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 6,
  },
  headerSubtitle: {
    fontSize: 16,
    lineHeight: 22,
  },
  settingsButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    marginTop: 4,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
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
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    paddingTop: 20,
    minHeight: 500,
    maxHeight: '90%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
  },
  addTopicModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.08)',
  },
  addTopicModalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
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
    color: '#555',
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
    backgroundColor: '#F5F5F5',
    borderWidth: 1.5,
    borderColor: 'rgba(0, 0, 0, 0.1)',
  },
  addTopicChipSelected: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  addTopicChipText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  addTopicChipTextSelected: {
    color: '#FFF',
  },
  addTopicFieldContainer: {
    marginBottom: 20,
  },
  addTopicInputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  addTopicInputRowContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  addTopicInputRowError: {
    borderColor: '#FF3B30',
  },
  addTopicTextInput: {
    flex: 1,
    fontSize: 16,
    color: '#333',
    paddingVertical: 12,
    minHeight: 44,
  },
  addTopicErrorText: {
    color: '#FF3B30',
    fontSize: 12,
    marginTop: 6,
    marginLeft: 4,
  },
  addTopicSelectedIndicator: {
    backgroundColor: '#E8F5E9',
    borderRadius: 12,
    padding: 12,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#4CAF50',
  },
  addTopicSelectedText: {
    fontSize: 14,
    color: '#2E7D32',
    fontWeight: '500',
  },
  addTopicSelectedValue: {
    fontWeight: 'bold',
    color: '#1B5E20',
  },
  addTopicModalFooter: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 16,
    gap: 12,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E5E5',
  },
  addTopicCancelButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 50,
    borderWidth: 2,
    borderColor: '#999',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addTopicCancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
  },
  addTopicSaveButton: {
    flex: 1,
    borderRadius: 50,
    overflow: 'hidden',
  },
  addTopicSaveButtonDisabled: {
    opacity: 0.5,
  },
  addTopicSaveButtonGradient: {
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addTopicSaveButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFF',
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
