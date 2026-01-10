
import { useAuthSafe } from '@/lib/safeGuards/providerGuards';
import { supabase } from '@/lib/supabase';
import { SwipeableCenterModal } from '@/components/ui/SwipeableCenterModal';
import AddPersonSheet from '@/components/ui/AddPersonSheet';
import { PersonCard } from '@/components/ui/PersonCard';
import { LinearGradient } from 'expo-linear-gradient';
import { useThemeContext } from '@/contexts/ThemeContext';
import { showErrorToast, showSuccessToast } from '@/utils/toast';
import FloatingTabBar from '@/components/FloatingTabBar';
import { SafeSpaceLogo } from '@/components/SafeSpaceLogo';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Platform, TextInput, LogBox, Modal, Pressable, KeyboardAvoidingView } from 'react-native';
import { Swipeable } from 'react-native-gesture-handler';
import { Ionicons } from '@expo/vector-icons';
import { memoryCache } from '@/lib/cache/memoryCache';
import { IconSymbol } from '@/components/IconSymbol';
import { router, Redirect } from 'expo-router';
import { Person } from '@/types/database.types';
import React, { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import { LoadingOverlay } from '@/components/ui/LoadingOverlay';
import { useFocusEffect } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';

interface PersonWithLastMessage extends Person {
  lastMessage?: string;
  lastMessageTime?: string;
  lastActivityAt?: string;
}

const DEFAULT_TOPICS = [
  'Anxiety',
  'Depression',
  'Relationships',
  'Work Stress',
  'Family',
  'Self-Esteem',
  'Grief',
  'Trauma',
  'Other',
];

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 100,
  },
  header: {
    paddingTop: 20,
    paddingBottom: 16,
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 15,
    color: '#6B7280',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#007AFF',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    marginHorizontal: 20,
    marginBottom: 20,
    shadowColor: '#007AFF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  addButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 40,
  },
  emptyText: {
    fontSize: 18,
    color: '#9CA3AF',
    textAlign: 'center',
    marginTop: 16,
    lineHeight: 24,
  },
  deleteAction: {
    backgroundColor: '#EF4444',
    justifyContent: 'center',
    alignItems: 'flex-end',
    paddingRight: 20,
    marginVertical: 8,
    borderRadius: 12,
  },
  deleteText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 16,
  },
});

const DeleteAction = ({ onPress }: { onPress: () => void }) => (
  <TouchableOpacity style={styles.deleteAction} onPress={onPress}>
    <Text style={styles.deleteText}>Delete</Text>
  </TouchableOpacity>
);

function HomeScreen() {
  const insets = useSafeAreaInsets();
  
  // ✅ SAFE: Using useAuthSafe which returns fallback if provider is missing
  const { user, loading: authLoading } = useAuthSafe();
  const userId = user?.id || null;
  
  const { theme } = useThemeContext();
  const [isAddPersonOpen, setIsAddPersonOpen] = useState(false);
  const [people, setPeople] = useState<PersonWithLastMessage[]>([]);
  const [topics, setTopics] = useState<string[]>(DEFAULT_TOPICS);
  const [loading, setLoading] = useState(true);
  const swipeableRefs = useRef<Map<string, Swipeable>>(new Map());

  // Fail-closed guard: Do not fetch data if userId is null or auth is loading
  const fetchData = useCallback(async () => {
    if (!userId) {
      console.log('[Home] fetchData called without userId, aborting');
      return;
    }

    try {
      setLoading(true);

      const { data: personsData, error: personsError } = await supabase
        .from('persons')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (personsError) throw personsError;

      const personsWithMessages = await Promise.all(
        (personsData || []).map(async (person) => {
          const { data: messagesData } = await supabase
            .from('messages')
            .select('content, created_at')
            .eq('user_id', userId)
            .eq('person_id', person.id)
            .order('created_at', { ascending: false })
            .limit(1);

          const { data: activityData } = await supabase
            .from('person_activity')
            .select('last_activity_at')
            .eq('user_id', userId)
            .eq('person_id', person.id)
            .order('last_activity_at', { ascending: false })
            .limit(1);

          return {
            ...person,
            lastMessage: messagesData?.[0]?.content,
            lastMessageTime: messagesData?.[0]?.created_at,
            lastActivityAt: activityData?.[0]?.last_activity_at,
          };
        })
      );

      setPeople(personsWithMessages);
      memoryCache.setPeopleList(personsWithMessages);

      const { data: topicsData, error: topicsError } = await supabase
        .from('topics')
        .select('name')
        .eq('user_id', userId);

      if (topicsError) throw topicsError;

      const topicNames = topicsData?.map((t) => t.name) || DEFAULT_TOPICS;
      setTopics(topicNames);
      memoryCache.setTopicsList(topicNames);
    } catch (error) {
      console.error('[Home] Error fetching data:', error);
      showErrorToast('Failed to load data');
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    if (!userId || authLoading) {
      console.log('[Home] userId is null or auth loading, skipping fetchData');
      setLoading(false);
      return;
    }
    fetchData();
  }, [userId, authLoading, fetchData]);

  useFocusEffect(
    useCallback(() => {
      if (!userId || authLoading) {
        return;
      }
      fetchData();
    }, [userId, authLoading, fetchData])
  );

  const cachedPeople = useMemo(() => memoryCache.getPeopleList(), []);
  const cachedTopics = useMemo(() => memoryCache.getTopicsList(), []);

  useEffect(() => {
    if (cachedPeople.length > 0) {
      setPeople(cachedPeople);
    }
    if (cachedTopics.length > 0) {
      setTopics(cachedTopics);
    }
  }, [cachedPeople, cachedTopics]);

  useEffect(() => {
    if (isAddPersonOpen) {
      swipeableRefs.current.forEach((ref) => ref?.close());
    }
  }, [isAddPersonOpen]);

  const handlePersonCreated = (newPerson: Person) => {
    setPeople((prev) => [newPerson, ...prev]);
    memoryCache.setPeopleList([newPerson, ...people]);
    setIsAddPersonOpen(false);
    showSuccessToast('Person added successfully');
  };

  const handleDeletePerson = async (personId: string) => {
    if (!userId) return;

    try {
      const { error } = await supabase.from('persons').delete().eq('id', personId).eq('user_id', userId);

      if (error) throw error;

      setPeople((prev) => prev.filter((p) => p.id !== personId));
      memoryCache.setPeopleList(people.filter((p) => p.id !== personId));
      showSuccessToast('Person deleted');
    } catch (error) {
      console.error('[Home] Error deleting person:', error);
      showErrorToast('Failed to delete person');
    }
  };

  const handlePersonPress = (person: Person) => {
    router.push({
      pathname: '/(tabs)/(home)/chat',
      params: {
        personId: person.id,
        personName: person.name,
        relationshipType: person.relationship_type || '',
      },
    });
  };

  // Show loading state if auth is not ready
  if (authLoading || !userId) {
    return (
      <View style={[styles.container, { backgroundColor: theme.background }]}>
        <LoadingOverlay visible={true} message="Loading..." />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <StatusBar style="auto" />
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
          <View style={styles.header}>
            <SafeSpaceLogo size={48} />
            <Text style={[styles.title, { color: theme.textPrimary }]}>Your Safe Space</Text>
            <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
              {people.length === 0 ? 'Start by adding someone' : `${people.length} ${people.length === 1 ? 'person' : 'people'}`}
            </Text>
          </View>

          <TouchableOpacity style={styles.addButton} onPress={() => setIsAddPersonOpen(true)}>
            <Ionicons name="add-circle-outline" size={24} color="#FFFFFF" />
            <Text style={styles.addButtonText}>Add Person</Text>
          </TouchableOpacity>

          {loading ? (
            <LoadingOverlay visible={true} message="Loading..." />
          ) : people.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="people-outline" size={64} color="#D1D5DB" />
              <Text style={[styles.emptyText, { color: theme.textSecondary }]}>
                No people yet. Add someone to start a conversation.
              </Text>
            </View>
          ) : (
            people.map((person) => (
              <Swipeable
                key={person.id}
                ref={(ref) => {
                  if (ref) swipeableRefs.current.set(person.id, ref);
                  else swipeableRefs.current.delete(person.id);
                }}
                renderRightActions={() => <DeleteAction onPress={() => handleDeletePerson(person.id)} />}
                overshootRight={false}
              >
                <PersonCard person={person} onPress={() => handlePersonPress(person)} theme={theme} />
              </Swipeable>
            ))
          )}
        </ScrollView>

        <AddPersonSheet
          visible={isAddPersonOpen}
          onClose={() => setIsAddPersonOpen(false)}
          onPersonCreated={handlePersonCreated}
          userId={userId}
          theme={theme}
          insets={insets}
        />
      </SafeAreaView>
      <FloatingTabBar />
    </View>
  );
}

export default HomeScreen;
