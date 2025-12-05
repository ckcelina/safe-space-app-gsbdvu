
import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  Platform,
} from "react-native";
import { router, Redirect } from "expo-router";
import { useAuth } from "@/contexts/AuthContext";
import { useThemeContext } from "@/contexts/ThemeContext";
import { supabase } from "@/lib/supabase";
import { Person, Message } from "@/types/database.types";
import { IconSymbol } from "@/components/IconSymbol";
import { LinearGradient } from "expo-linear-gradient";

interface PersonWithLastMessage extends Person {
  lastMessage?: string;
  lastMessageTime?: string;
}

export default function HomeScreen() {
  const { currentUser, userId, role, loading: authLoading } = useAuth();
  const { colors } = useThemeContext();
  const [persons, setPersons] = useState<PersonWithLastMessage[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPersonsWithLastMessage = useCallback(async () => {
    try {
      console.log('Fetching people for user:', userId);
      const { data: peopleData, error: peopleError } = await supabase
        .from('people')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (peopleError) {
        console.error('Error fetching people:', peopleError);
        Alert.alert('Error', 'Failed to load people');
        setLoading(false);
        return;
      }

      console.log('People loaded:', peopleData?.length);

      // Fetch last message for each person
      const personsWithMessages = await Promise.all(
        (peopleData || []).map(async (person) => {
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
        })
      );

      setPersons(personsWithMessages);
    } catch (error) {
      console.error('Unexpected error fetching people:', error);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    if (userId) {
      fetchPersonsWithLastMessage();
    }
  }, [userId, fetchPersonsWithLastMessage]);

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
        const newPerson: PersonWithLastMessage = {
          ...data,
          lastMessage: 'No messages yet',
        };
        setPersons([newPerson, ...persons]);
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

  const formatLastMessagePreview = (message: string) => {
    if (message.length > 50) {
      return message.substring(0, 50) + '...';
    }
    return message;
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

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <Text style={[styles.headerTitle, { color: colors.text }]}>
            Your Safe Space
          </Text>
          <TouchableOpacity 
            style={[styles.profileIcon, { backgroundColor: colors.primary }]}
            onPress={() => router.push('/(tabs)/profile')}
          >
            <IconSymbol
              ios_icon_name="person.fill"
              android_material_icon_name="person"
              size={20}
              color="#FFFFFF"
            />
          </TouchableOpacity>
        </View>
      </View>

      {/* Content */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          People You&apos;re Talking About
        </Text>

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        ) : persons.length === 0 ? (
          <View style={styles.emptyState}>
            <View style={[styles.emptyIconContainer, { backgroundColor: colors.highlight }]}>
              <IconSymbol
                ios_icon_name="person.2.fill"
                android_material_icon_name="people"
                size={48}
                color={colors.primary}
              />
            </View>
            <Text style={[styles.emptyText, { color: colors.text }]}>
              No one added yet
            </Text>
            <Text style={[styles.emptySubtext, { color: colors.textSecondary }]}>
              Tap the + button below to add someone you&apos;d like to talk about
            </Text>
          </View>
        ) : (
          <View style={styles.cardList}>
            {persons.map((person, index) => (
              <TouchableOpacity
                key={index}
                style={[styles.personCard, { backgroundColor: colors.card }]}
                onPress={() => handlePersonPress(person)}
                activeOpacity={0.7}
              >
                <View style={styles.cardContent}>
                  <View style={[styles.avatarCircle, { backgroundColor: colors.highlight }]}>
                    <Text style={[styles.avatarText, { color: colors.primary }]}>
                      {person.name.charAt(0).toUpperCase()}
                    </Text>
                  </View>
                  
                  <View style={styles.personInfo}>
                    <Text style={[styles.personName, { color: colors.text }]}>
                      {person.name}
                    </Text>
                    <Text style={[styles.relationshipType, { color: colors.textSecondary }]}>
                      {person.relationship_type}
                    </Text>
                    <Text style={[styles.lastMessage, { color: colors.textSecondary }]} numberOfLines={1}>
                      {formatLastMessagePreview(person.lastMessage || 'No messages yet')}
                    </Text>
                  </View>

                  <IconSymbol
                    ios_icon_name="chevron.right"
                    android_material_icon_name="chevron_right"
                    size={20}
                    color={colors.textSecondary}
                  />
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>

      {/* Floating Add Button */}
      <TouchableOpacity
        style={[styles.floatingButton, { backgroundColor: colors.primary }]}
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingTop: Platform.OS === 'android' ? 48 : 60,
    paddingHorizontal: 24,
    paddingBottom: 16,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  profileIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingBottom: 120,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  loadingContainer: {
    paddingVertical: 40,
    alignItems: 'center',
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
  cardList: {
    gap: 12,
  },
  personCard: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.08)',
    elevation: 3,
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarCircle: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  personInfo: {
    flex: 1,
  },
  personName: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 2,
  },
  relationshipType: {
    fontSize: 13,
    marginBottom: 4,
    textTransform: 'capitalize',
  },
  lastMessage: {
    fontSize: 14,
    fontStyle: 'italic',
  },
  floatingButton: {
    position: 'absolute',
    bottom: 100,
    right: 24,
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    boxShadow: '0px 4px 12px rgba(0, 0, 0, 0.15)',
    elevation: 6,
  },
});
