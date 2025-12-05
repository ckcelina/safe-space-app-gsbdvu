
import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Alert,
  ActivityIndicator,
} from "react-native";
import { router, Redirect } from "expo-router";
import { useAuth } from "@/contexts/AuthContext";
import { useThemeContext } from "@/contexts/ThemeContext";
import { supabase } from "@/lib/supabase";
import { Person } from "@/types/database.types";
import { IconSymbol } from "@/components/IconSymbol";

export default function HomeScreen() {
  const { currentUser, userId, role, loading: authLoading } = useAuth();
  const { colors } = useThemeContext();
  const [persons, setPersons] = useState<Person[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (userId) {
      fetchPersons();
    }
  }, [userId]);

  const fetchPersons = async () => {
    try {
      console.log('Fetching people for user:', userId);
      const { data, error } = await supabase
        .from('people')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching people:', error);
        Alert.alert('Error', 'Failed to load people');
      } else {
        console.log('People loaded:', data?.length);
        setPersons(data || []);
      }
    } catch (error) {
      console.error('Unexpected error fetching people:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddPerson = () => {
    Alert.prompt(
      'Add Person',
      'Enter the name of the person',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Next',
          onPress: (name) => {
            if (name) {
              Alert.prompt(
                'Relationship Type',
                'What is your relationship? (e.g., friend, family, colleague)',
                [
                  { text: 'Cancel', style: 'cancel' },
                  {
                    text: 'Add',
                    onPress: async (relationshipType) => {
                      if (relationshipType) {
                        await createPerson(name, relationshipType);
                      }
                    },
                  },
                ]
              );
            }
          },
        },
      ]
    );
  };

  const createPerson = async (name: string, relationshipType: string) => {
    try {
      console.log('Creating person:', name, relationshipType);
      const { data, error } = await supabase
        .from('people')
        .insert([
          {
            user_id: userId,
            name,
            relationship_type: relationshipType,
          },
        ])
        .select()
        .single();

      if (error) {
        console.error('Error creating person:', error);
        Alert.alert('Error', 'Failed to add person');
      } else {
        console.log('Person created:', data);
        setPersons([data, ...persons]);
      }
    } catch (error) {
      console.error('Unexpected error creating person:', error);
    }
  };

  const handlePersonPress = (person: Person) => {
    router.push({
      pathname: '/(tabs)/(home)/chat',
      params: { personId: person.id, personName: person.name },
    });
  };

  if (authLoading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!currentUser) {
    return <Redirect href="/onboarding" />;
  }

  const renderPerson = ({ item }: { item: Person }) => (
    <TouchableOpacity
      style={[styles.personCard, { backgroundColor: colors.card }]}
      onPress={() => handlePersonPress(item)}
    >
      <View style={styles.personInfo}>
        <Text style={[styles.personName, { color: colors.text }]}>
          {item.name}
        </Text>
        <Text style={[styles.personRelationship, { color: colors.textSecondary }]}>
          {item.relationship_type}
        </Text>
      </View>
      <IconSymbol
        ios_icon_name="chevron.right"
        android_material_icon_name="chevron_right"
        size={24}
        color={colors.textSecondary}
      />
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>Safe Space</Text>
        <Text style={[styles.planBadge, { color: colors.textSecondary }]}>
          Plan: {role.charAt(0).toUpperCase() + role.slice(1)}
        </Text>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color={colors.primary} />
      ) : persons.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
            No persons added yet
          </Text>
          <Text style={[styles.emptySubtext, { color: colors.textSecondary }]}>
            Add someone to start talking about them
          </Text>
        </View>
      ) : (
        <FlatList
          data={persons}
          renderItem={renderPerson}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
        />
      )}

      <TouchableOpacity
        style={[styles.addButton, { backgroundColor: colors.primary }]}
        onPress={handleAddPerson}
      >
        <IconSymbol
          ios_icon_name="plus"
          android_material_icon_name="add"
          size={32}
          color="#FFFFFF"
        />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 60,
  },
  header: {
    paddingHorizontal: 24,
    paddingBottom: 16,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  planBadge: {
    fontSize: 14,
  },
  listContainer: {
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  personCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.1)',
    elevation: 2,
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
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: 14,
    textAlign: 'center',
  },
  addButton: {
    position: 'absolute',
    bottom: 20,
    right: 24,
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    boxShadow: '0px 4px 8px rgba(0, 0, 0, 0.2)',
    elevation: 4,
  },
});
