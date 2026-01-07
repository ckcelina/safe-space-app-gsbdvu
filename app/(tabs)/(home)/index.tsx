
import { Ionicons } from '@expo/vector-icons';
import { PersonCard } from '@/components/ui/PersonCard';
import { showErrorToast, showSuccessToast } from '@/utils/toast';
import { Person } from '@/types/database.types';
import { IconSymbol } from '@/components/IconSymbol';
import { useThemeContext } from '@/contexts/ThemeContext';
import { SwipeableCenterModal } from '@/components/ui/SwipeableCenterModal';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Platform, TextInput, LogBox, Modal, Pressable, KeyboardAvoidingView } from 'react-native';
import { router, Redirect } from 'expo-router';
import { useAuthOptional } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { memoryCache } from '@/lib/cache/memoryCache';
import { SafeSpaceLogo } from '@/components/SafeSpaceLogo';
import { Swipeable } from 'react-native-gesture-handler';
import { StatusBar } from 'expo-status-bar';
import FloatingTabBar from '@/components/FloatingTabBar';
import AddPersonSheet from '@/components/ui/AddPersonSheet';
import React, { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { LoadingOverlay } from '@/components/ui/LoadingOverlay';
import { LinearGradient } from 'expo-linear-gradient';

interface PersonWithLastMessage extends Person {
  lastMessage?: string;
  lastMessageTime?: string;
  lastActivityAt?: string;
}

const DEFAULT_TOPICS = [
  { name: 'Work', relationship_type: 'topic' },
  { name: 'Family', relationship_type: 'topic' },
  { name: 'Health', relationship_type: 'topic' },
];

const DeleteAction = ({ onPress }: { onPress: () => void }) => {
  const { theme } = useThemeContext();
  return (
    <TouchableOpacity
      style={[styles.deleteAction, { backgroundColor: theme.error || '#FF3B30' }]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <IconSymbol
        ios_icon_name="trash"
        android_material_icon_name="delete"
        size={24}
        color="#FFFFFF"
      />
    </TouchableOpacity>
  );
};

export default function HomeScreen() {
  const { theme } = useThemeContext();
  const { userId, loading: authLoading } = useAuthOptional();
  const insets = useSafeAreaInsets();
  const [people, setPeople] = useState<PersonWithLastMessage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddPersonOpen, setIsAddPersonOpen] = useState(false);
  const swipeableRefs = useRef<{ [key: string]: Swipeable | null }>({});

  const fetchData = useCallback(async () => {
    if (!userId) {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);

      // Fetch persons
      const { data: personsData, error: personsError } = await supabase
        .from('persons')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (personsError) {
        console.error('Error fetching persons:', personsError);
        showErrorToast('Failed to load people');
        setIsLoading(false);
        return;
      }

      // Fetch last messages for each person
      const personsWithMessages: PersonWithLastMessage[] = await Promise.all(
        (personsData || []).map(async (person) => {
          const { data: messagesData } = await supabase
            .from('messages')
            .select('content, created_at')
            .eq('user_id', userId)
            .eq('person_id', person.id)
            .order('created_at', { ascending: false })
            .limit(1);

          const lastMessage = messagesData?.[0];
          return {
            ...person,
            lastMessage: lastMessage?.content,
            lastMessageTime: lastMessage?.created_at,
            lastActivityAt: lastMessage?.created_at || person.created_at,
          };
        })
      );

      // Sort by last activity
      personsWithMessages.sort((a, b) => {
        const dateA = new Date(a.lastActivityAt || a.created_at).getTime();
        const dateB = new Date(b.lastActivityAt || b.created_at).getTime();
        return dateB - dateA;
      });

      setPeople(personsWithMessages);
      setIsLoading(false);
    } catch (error) {
      console.error('Error in fetchData:', error);
      showErrorToast('Failed to load data');
      setIsLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchData();
  }, [userId, fetchData]);

  useFocusEffect(
    useCallback(() => {
      fetchData();
    }, [fetchData])
  );

  useEffect(() => {
    if (!isAddPersonOpen) {
      fetchData();
    }
  }, [isAddPersonOpen, fetchData]);

  const filteredPeople = useMemo(() => {
    if (!searchQuery.trim()) {
      return people;
    }
    const query = searchQuery.toLowerCase();
    return people.filter(
      (person) =>
        person.name?.toLowerCase().includes(query) ||
        person.relationship_type?.toLowerCase().includes(query)
    );
  }, [people, searchQuery]);

  const handlePersonPress = useCallback((person: Person) => {
    router.push({
      pathname: '/(tabs)/(home)/chat',
      params: {
        personId: person.id,
        personName: person.name,
        relationshipType: person.relationship_type,
      },
    });
  }, []);

  const handleDeletePerson = useCallback(async (personId: string) => {
    try {
      const { error } = await supabase
        .from('persons')
        .delete()
        .eq('id', personId)
        .eq('user_id', userId);

      if (error) {
        console.error('Error deleting person:', error);
        showErrorToast('Failed to delete person');
        return;
      }

      showSuccessToast('Person deleted');
      fetchData();
    } catch (error) {
      console.error('Error deleting person:', error);
      showErrorToast('Failed to delete person');
    }
  }, [userId, fetchData]);

  const handleSwipeOpen = useCallback((personId: string) => {
    // Close all other swipeables
    Object.keys(swipeableRefs.current).forEach((key) => {
      if (key !== personId && swipeableRefs.current[key]) {
        swipeableRefs.current[key]?.close();
      }
    });
  }, []);

  const handlePersonCreated = useCallback((newPerson: Person) => {
    setIsAddPersonOpen(false);
    fetchData();
  }, [fetchData]);

  // Early return with loading state if auth is still loading
  if (authLoading) {
    return (
      <View style={[styles.container, { backgroundColor: theme.background }]}>
        <StatusBar style={theme.statusBarStyle} />
        <LinearGradient
          colors={theme.gradientColors}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
          pointerEvents="none"
        />
        <LoadingOverlay visible={true} />
      </View>
    );
  }

  // Redirect to login if no userId after loading completes
  if (!userId) {
    return <Redirect href="/login" />;
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <StatusBar style={theme.statusBarStyle} />
      <LinearGradient
        colors={theme.gradientColors}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
        pointerEvents="none"
      />

      <SafeAreaView style={styles.safeArea} edges={['top']}>
        {/* Header */}
        <View style={styles.header}>
          <SafeSpaceLogo size={32} />
          <Text style={[styles.headerTitle, { color: theme.textPrimary }]}>
            Safe Space
          </Text>
        </View>

        {/* Search Bar */}
        <View style={[styles.searchContainer, { backgroundColor: theme.card }]}>
          <IconSymbol
            ios_icon_name="magnifyingglass"
            android_material_icon_name="search"
            size={20}
            color={theme.textSecondary}
          />
          <TextInput
            style={[styles.searchInput, { color: theme.textPrimary }]}
            placeholder="Search people..."
            placeholderTextColor={theme.textSecondary}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <IconSymbol
                ios_icon_name="xmark.circle.fill"
                android_material_icon_name="cancel"
                size={20}
                color={theme.textSecondary}
              />
            </TouchableOpacity>
          )}
        </View>

        {/* People List */}
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={[
            styles.scrollContent,
            { paddingBottom: insets.bottom + 100 },
          ]}
          showsVerticalScrollIndicator={false}
        >
          {isLoading ? (
            <LoadingOverlay visible={true} />
          ) : filteredPeople.length === 0 ? (
            <View style={styles.emptyState}>
              <IconSymbol
                ios_icon_name="person.2"
                android_material_icon_name="group"
                size={64}
                color={theme.textSecondary}
              />
              <Text style={[styles.emptyText, { color: theme.textSecondary }]}>
                {searchQuery
                  ? 'No people found'
                  : 'No people yet. Add someone to start chatting!'}
              </Text>
            </View>
          ) : (
            <>
              {filteredPeople.map((person, index) => (
                <Swipeable
                  key={person.id}
                  ref={(ref) => (swipeableRefs.current[person.id] = ref)}
                  renderRightActions={() => (
                    <DeleteAction onPress={() => handleDeletePerson(person.id)} />
                  )}
                  onSwipeableOpen={() => handleSwipeOpen(person.id)}
                >
                  <PersonCard
                    person={person}
                    onPress={() => handlePersonPress(person)}
                  />
                </Swipeable>
              ))}
            </>
          )}
        </ScrollView>

        {/* Add Person Button */}
        <TouchableOpacity
          style={[styles.addButton, { backgroundColor: theme.primary }]}
          onPress={() => setIsAddPersonOpen(true)}
          activeOpacity={0.8}
        >
          <IconSymbol
            ios_icon_name="plus"
            android_material_icon_name="add"
            size={28}
            color={theme.buttonText}
          />
        </TouchableOpacity>
      </SafeAreaView>

      <FloatingTabBar />

      {/* Add Person Sheet */}
      <AddPersonSheet
        visible={isAddPersonOpen}
        onClose={() => setIsAddPersonOpen(false)}
        onPersonCreated={handlePersonCreated}
        userId={userId}
        theme={theme}
        insets={insets}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    gap: 12,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 20,
    marginBottom: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    gap: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    gap: 16,
  },
  emptyText: {
    fontSize: 16,
    textAlign: 'center',
    paddingHorizontal: 40,
  },
  addButton: {
    position: 'absolute',
    bottom: 100,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    boxShadow: '0px 4px 12px rgba(0, 0, 0, 0.15)',
    elevation: 5,
  },
  deleteAction: {
    justifyContent: 'center',
    alignItems: 'center',
    width: 80,
    marginBottom: 12,
    borderRadius: 16,
  },
});
