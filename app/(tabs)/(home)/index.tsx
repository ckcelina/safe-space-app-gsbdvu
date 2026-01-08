
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
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useFocusEffect } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { useThemeContext } from '@/contexts/ThemeContext';
import { supabase } from '@/lib/supabase';
import { IconSymbol } from '@/components/IconSymbol';
import { Person } from '@/types/database.types';
import AddPersonSheet from '@/components/ui/AddPersonSheet';
import { showErrorToast } from '@/utils/toast';

export default function HomeScreen() {
  const { user, publicUser } = useAuth();
  const { theme } = useThemeContext();
  const insets = useSafeAreaInsets();
  const [persons, setPersons] = useState<Person[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showAddPersonSheet, setShowAddPersonSheet] = useState(false);

  // Fetch persons when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      if (user) {
        fetchPersons();
      }
    }, [user])
  );

  const fetchPersons = async (isRefreshing = false) => {
    if (!user) return;

    try {
      if (!isRefreshing) setLoading(true);

      const { data, error } = await supabase
        .from('persons')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('[HomeScreen] Error fetching persons:', error);
        showErrorToast('Failed to load persons');
        throw error;
      }

      console.log('[HomeScreen] Fetched persons:', data?.length || 0);
      setPersons(data || []);
    } catch (error) {
      console.error('[HomeScreen] Exception fetching persons:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchPersons(true);
  };

  const handlePersonPress = (person: Person) => {
    console.log('[HomeScreen] Navigating to chat for person:', person.name);
    router.push({
      pathname: '/(tabs)/(home)/chat',
      params: {
        personId: person.id,
        personName: person.name,
      },
    });
  };

  const handleAddPerson = () => {
    console.log('[HomeScreen] Opening add person sheet');
    setShowAddPersonSheet(true);
  };

  const handlePersonCreated = (newPerson: Person) => {
    console.log('[HomeScreen] Person created:', newPerson.name);
    setPersons((prev) => [newPerson, ...prev]);
    setShowAddPersonSheet(false);
  };

  const renderPerson = ({ item }: { item: Person }) => (
    <TouchableOpacity
      style={[styles.personCard, { backgroundColor: theme.surface }]}
      onPress={() => handlePersonPress(item)}
      activeOpacity={0.7}
    >
      <View style={styles.personInfo}>
        <Text style={[styles.personName, { color: theme.textPrimary }]}>
          {item.name}
        </Text>
        <Text style={[styles.personRelationship, { color: theme.textSecondary }]}>
          {item.relationship_type || 'No relationship specified'}
        </Text>
      </View>
      <IconSymbol
        ios_icon_name="chevron.forward"
        android_material_icon_name="chevron-right"
        size={24}
        color={theme.textSecondary}
      />
    </TouchableOpacity>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <IconSymbol
        ios_icon_name="person.2"
        android_material_icon_name="group"
        size={64}
        color="rgba(255, 255, 255, 0.6)"
      />
      <Text style={styles.emptyTitle}>No Persons Yet</Text>
      <Text style={styles.emptyText}>
        Add someone to start talking about them in a safe space
      </Text>
      <TouchableOpacity
        style={[styles.emptyButton, { backgroundColor: theme.accent }]}
        onPress={handleAddPerson}
        activeOpacity={0.8}
      >
        <Text style={styles.emptyButtonText}>Add Your First Person</Text>
      </TouchableOpacity>
    </View>
  );

  if (loading && !refreshing) {
    return (
      <LinearGradient colors={theme.gradientColors} style={styles.container}>
        <SafeAreaView style={styles.container} edges={['top']}>
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#fff" />
            <Text style={styles.loadingText}>Loading Safe Space...</Text>
          </View>
        </SafeAreaView>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient colors={theme.gradientColors} style={styles.container}>
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>Safe Space</Text>
            <Text style={styles.subtitle}>
              Plan: {publicUser?.role ? publicUser.role.charAt(0).toUpperCase() + publicUser.role.slice(1) : 'Free'}
            </Text>
          </View>
          <TouchableOpacity
            style={styles.settingsButton}
            onPress={() => router.push('/(tabs)/settings')}
            activeOpacity={0.7}
          >
            <IconSymbol
              ios_icon_name="gearshape.fill"
              android_material_icon_name="settings"
              size={28}
              color="#fff"
            />
          </TouchableOpacity>
        </View>

        <FlatList
          data={persons}
          renderItem={renderPerson}
          keyExtractor={(item) => item.id}
          contentContainerStyle={[
            styles.listContainer,
            persons.length === 0 && styles.listContainerEmpty,
          ]}
          ListEmptyComponent={renderEmptyState}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor="#fff"
              colors={['#fff']}
            />
          }
          showsVerticalScrollIndicator={false}
        />

        {persons.length > 0 && (
          <TouchableOpacity
            style={[
              styles.fab,
              {
                backgroundColor: theme.accent,
                bottom: Platform.OS === 'ios' ? insets.bottom + 80 : 80,
              },
            ]}
            onPress={handleAddPerson}
            activeOpacity={0.8}
          >
            <IconSymbol
              ios_icon_name="plus"
              android_material_icon_name="add"
              size={32}
              color="#fff"
            />
          </TouchableOpacity>
        )}

        <AddPersonSheet
          visible={showAddPersonSheet}
          onClose={() => setShowAddPersonSheet(false)}
          onPersonCreated={handlePersonCreated}
          userId={user?.id || ''}
          theme={theme}
          insets={insets}
        />
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#fff',
    fontSize: 16,
    marginTop: 16,
    fontWeight: '500',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 16,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
  },
  subtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 4,
  },
  settingsButton: {
    padding: 8,
  },
  listContainer: {
    padding: 16,
    paddingBottom: 100,
  },
  listContainerEmpty: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  personCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
      },
      android: {
        elevation: 3,
      },
      default: {
        boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.1)',
      },
    }),
  },
  personInfo: {
    flex: 1,
  },
  personName: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  personRelationship: {
    fontSize: 14,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 24,
    marginBottom: 12,
  },
  emptyText: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
  },
  emptyButton: {
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 50,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
      },
      android: {
        elevation: 6,
      },
      default: {
        boxShadow: '0px 4px 12px rgba(0, 0, 0, 0.2)',
      },
    }),
  },
  emptyButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  fab: {
    position: 'absolute',
    right: 20,
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
      },
      android: {
        elevation: 8,
      },
      default: {
        boxShadow: '0px 4px 16px rgba(0, 0, 0, 0.3)',
      },
    }),
  },
});
