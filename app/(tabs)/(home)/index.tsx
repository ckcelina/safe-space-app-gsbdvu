
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Platform,
} from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '@/contexts/AuthContext';
import { useThemeContext } from '@/contexts/ThemeContext';
import { supabase } from '@/lib/supabase';
import { IconSymbol } from '@/components/IconSymbol';
import { PersonCard } from '@/components/ui/PersonCard';
import { AddPersonSheet } from '@/components/ui/AddPersonSheet';
import { StatusBarGradient } from '@/components/ui/StatusBarGradient';
import FloatingTabBar from '@/components/FloatingTabBar';

interface Person {
  id: string;
  user_id: string;
  name: string;
  relationship_type: string;
  context_label?: string;
  created_at: string;
  updated_at: string;
}

export default function HomeScreen() {
  const { userId } = useAuth();
  const { theme } = useThemeContext();
  const [persons, setPersons] = useState<Person[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showAddSheet, setShowAddSheet] = useState(false);

  // Fetch persons when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      console.log('[HomeScreen] Screen focused, fetching persons');
      fetchPersons();
    }, [userId])
  );

  const fetchPersons = async () => {
    if (!userId) {
      console.log('[HomeScreen] No userId, skipping fetch');
      setLoading(false);
      return;
    }

    try {
      console.log('[HomeScreen] Fetching persons for user:', userId);
      
      const { data, error } = await supabase
        .from('persons')
        .select('*')
        .eq('user_id', userId)
        .order('updated_at', { ascending: false });

      if (error) {
        console.error('[HomeScreen] Error fetching persons:', error);
      } else {
        console.log('[HomeScreen] Fetched', data?.length || 0, 'persons');
        setPersons(data || []);
      }
    } catch (error) {
      console.error('[HomeScreen] Exception fetching persons:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    console.log('[HomeScreen] Refreshing persons list');
    setRefreshing(true);
    fetchPersons();
  };

  const handleAddPerson = () => {
    console.log('[HomeScreen] Add person button pressed');
    setShowAddSheet(true);
  };

  const handlePersonCreated = (newPerson: Person) => {
    console.log('[HomeScreen] New person created:', newPerson.name);
    setPersons(prev => [newPerson, ...prev]);
    setShowAddSheet(false);
  };

  const handlePersonPress = (person: Person) => {
    console.log('[HomeScreen] Person card pressed:', person.name);
    router.push({
      pathname: '/(tabs)/(home)/chat',
      params: {
        personId: person.id,
        personName: person.name,
        relationshipType: person.relationship_type,
      },
    });
  };

  const renderPerson = ({ item }: { item: Person }) => (
    <PersonCard
      person={item}
      onPress={() => handlePersonPress(item)}
      theme={theme}
    />
  );

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <IconSymbol
        ios_icon_name="person.2.fill"
        android_material_icon_name="group"
        size={64}
        color={theme.textSecondary}
      />
      <Text style={[styles.emptyTitle, { color: theme.textPrimary }]}>
        No conversations yet
      </Text>
      <Text style={[styles.emptySubtitle, { color: theme.textSecondary }]}>
        Add someone you'd like to talk about
      </Text>
      <TouchableOpacity
        style={[styles.emptyButton, { backgroundColor: theme.primary }]}
        onPress={handleAddPerson}
        activeOpacity={0.7}
      >
        <IconSymbol
          ios_icon_name="plus"
          android_material_icon_name="add"
          size={20}
          color="#FFFFFF"
        />
        <Text style={styles.emptyButtonText}>Add Person</Text>
      </TouchableOpacity>
    </View>
  );

  if (loading) {
    return (
      <LinearGradient
        colors={theme.primaryGradient}
        style={styles.container}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
      >
        <StatusBarGradient />
        <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#FFFFFF" />
          </View>
        </SafeAreaView>
        <FloatingTabBar />
      </LinearGradient>
    );
  }

  return (
    <LinearGradient
      colors={theme.primaryGradient}
      style={styles.container}
      start={{ x: 0, y: 0 }}
      end={{ x: 0, y: 1 }}
    >
      <StatusBarGradient />
      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
        <View style={styles.header}>
          <Text style={styles.title}>Safe Space</Text>
          <Text style={styles.subtitle}>Your private conversations</Text>
        </View>

        <FlatList
          data={persons}
          renderItem={renderPerson}
          keyExtractor={(item) => item.id}
          contentContainerStyle={[
            styles.listContent,
            persons.length === 0 && styles.listContentEmpty,
          ]}
          ListEmptyComponent={renderEmptyState}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor="#FFFFFF"
              colors={['#FFFFFF']}
            />
          }
          showsVerticalScrollIndicator={false}
        />

        {persons.length > 0 && (
          <TouchableOpacity
            style={[styles.fab, { backgroundColor: theme.primary }]}
            onPress={handleAddPerson}
            activeOpacity={0.8}
          >
            <IconSymbol
              ios_icon_name="plus"
              android_material_icon_name="add"
              size={28}
              color="#FFFFFF"
            />
          </TouchableOpacity>
        )}
      </SafeAreaView>

      <AddPersonSheet
        visible={showAddSheet}
        onClose={() => setShowAddSheet(false)}
        onPersonCreated={handlePersonCreated}
        userId={userId || ''}
        theme={theme}
        insets={{ top: 0, bottom: 0, left: 0, right: 0 }}
      />

      <FloatingTabBar />
    </LinearGradient>
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
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'android' ? 16 : 8,
    paddingBottom: 16,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 120, // Space for FloatingTabBar
  },
  listContentEmpty: {
    flexGrow: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
    paddingBottom: 80,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 24,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 24,
  },
  emptyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  emptyButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 100, // Above FloatingTabBar
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
});
