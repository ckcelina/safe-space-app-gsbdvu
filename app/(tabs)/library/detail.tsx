
import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Platform, TouchableOpacity, Animated, Image, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useThemeContext } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { StatusBarGradient } from '@/components/ui/StatusBarGradient';
import { libraryTopics, Topic } from './libraryTopics';
import { Ionicons } from '@expo/vector-icons';
import FloatingTabBar from '@/components/FloatingTabBar';
import { supabase } from '@/lib/supabase';
import { showErrorToast } from '@/utils/toast';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';

const SAVED_TOPICS_KEY = '@library_saved_topics';

// Content section component with animations
function ContentSection({ 
  title, 
  content, 
  index, 
  theme 
}: { 
  title: string; 
  content: string | string[]; 
  index: number; 
  theme: any;
}) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    // Staggered animation for each section
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        delay: 300 + (index * 150),
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 500,
        delay: 300 + (index * 150),
        useNativeDriver: true,
      }),
    ]).start();
  }, [fadeAnim, slideAnim, index]);

  return (
    <Animated.View
      style={[
        styles.sectionContainer,
        {
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }],
        },
      ]}
    >
      <View style={[styles.section, { backgroundColor: theme.card }]}>
        <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>
          {title}
        </Text>
        {Array.isArray(content) ? (
          <View style={styles.listContainer}>
            {content.map((item, idx) => (
              <View key={idx} style={styles.listItem}>
                <View style={[styles.bullet, { backgroundColor: theme.primary }]} />
                <Text style={[styles.listItemText, { color: theme.textSecondary }]}>
                  {item}
                </Text>
              </View>
            ))}
          </View>
        ) : (
          <Text style={[styles.sectionText, { color: theme.textSecondary }]}>
            {content}
          </Text>
        )}
      </View>
    </Animated.View>
  );
}

export default function LibraryDetailScreen() {
  const { theme } = useThemeContext();
  const { userId } = useAuth();
  const router = useRouter();
  const params = useLocalSearchParams();
  const topicId = params.topicId as string;

  // Animation refs
  const imageOpacity = useRef(new Animated.Value(0)).current;
  const imageScale = useRef(new Animated.Value(0.9)).current;
  const titleOpacity = useRef(new Animated.Value(0)).current;

  // State for button loading and saved status
  const [isNavigating, setIsNavigating] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

  // Find the topic from the static dataset
  const topic: Topic | undefined = libraryTopics.find(t => t.id === topicId);

  // Load saved status on mount
  useEffect(() => {
    loadSavedStatus();
  }, [topicId]);

  const loadSavedStatus = async () => {
    try {
      const saved = await AsyncStorage.getItem(SAVED_TOPICS_KEY);
      if (saved) {
        const parsedSaved = JSON.parse(saved);
        setIsSaved(parsedSaved.includes(topicId));
      }
    } catch (error) {
      console.error('[LibraryDetail] Error loading saved status:', error);
    }
  };

  const toggleSaveTopic = async () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      
      const saved = await AsyncStorage.getItem(SAVED_TOPICS_KEY);
      const savedTopicIds = saved ? JSON.parse(saved) : [];
      
      const newSavedTopicIds = isSaved
        ? savedTopicIds.filter((id: string) => id !== topicId)
        : [...savedTopicIds, topicId];
      
      setIsSaved(!isSaved);
      await AsyncStorage.setItem(SAVED_TOPICS_KEY, JSON.stringify(newSavedTopicIds));
      console.log('[LibraryDetail] Toggled save for topic:', topicId);
    } catch (error) {
      console.error('[LibraryDetail] Error toggling save:', error);
    }
  };

  useEffect(() => {
    // Animate the image and title on load
    Animated.parallel([
      Animated.timing(imageOpacity, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.spring(imageScale, {
        toValue: 1,
        friction: 8,
        tension: 40,
        useNativeDriver: true,
      }),
      Animated.timing(titleOpacity, {
        toValue: 1,
        duration: 500,
        delay: 200,
        useNativeDriver: true,
      }),
    ]).start();
  }, [imageOpacity, imageScale, titleOpacity]);

  // Handle "Ask AI questions" button press
  const handleAskAI = async () => {
    if (!topic) {
      console.error('[LibraryDetail] No topic found');
      showErrorToast('Topic not found');
      return;
    }

    if (!userId) {
      console.log('[LibraryDetail] User not logged in');
      showErrorToast('Please log in to ask AI questions');
      return;
    }

    console.log('[LibraryDetail] Starting AI chat for topic:', topic.title);
    setIsNavigating(true);

    try {
      // Step 1: Check if a person with this topic name already exists
      const { data: existingPerson, error: selectError } = await supabase
        .from('persons')
        .select('*')
        .eq('user_id', userId)
        .eq('name', topic.title)
        .maybeSingle();

      if (selectError && selectError.code !== 'PGRST116') {
        console.error('[LibraryDetail] Error checking for existing person:', selectError);
        throw selectError;
      }

      let person = existingPerson;

      // Step 2: If person doesn't exist, create one
      if (!person) {
        console.log('[LibraryDetail] Creating new person for topic:', topic.title);
        
        const { data: newPerson, error: insertError } = await supabase
          .from('persons')
          .insert([{
            user_id: userId,
            name: topic.title,
            relationship_type: 'Topic',
          }])
          .select()
          .single();

        if (insertError) {
          console.error('[LibraryDetail] Error creating person:', insertError);
          throw insertError;
        }

        person = newPerson;
        console.log('[LibraryDetail] Person created successfully:', person.id);
      } else {
        console.log('[LibraryDetail] Using existing person:', person.id);
      }

      // Step 3: Navigate to chat with the person
      if (person && person.id) {
        console.log('[LibraryDetail] Navigating to chat with params:', {
          personId: person.id,
          personName: person.name,
          relationshipType: person.relationship_type,
          initialSubject: topic.title,
        });

        router.push({
          pathname: '/(tabs)/(home)/chat',
          params: {
            personId: person.id,
            personName: person.name || topic.title,
            relationshipType: person.relationship_type || 'Topic',
            initialSubject: topic.title,
          },
        });
      } else {
        throw new Error('Failed to get person ID');
      }
    } catch (error: any) {
      console.error('[LibraryDetail] Error in handleAskAI:', error);
      showErrorToast('Failed to start AI chat. Please try again.');
    } finally {
      setIsNavigating(false);
    }
  };

  // If topic not found, show error message
  if (!topic) {
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
              <View style={styles.header}>
                <TouchableOpacity
                  onPress={() => router.back()}
                  style={[styles.backButton, { backgroundColor: theme.card }]}
                  activeOpacity={0.7}
                >
                  <Ionicons name="arrow-back" size={24} color={theme.textPrimary} />
                </TouchableOpacity>
              </View>
              <View style={styles.errorContainer}>
                <Ionicons name="alert-circle-outline" size={64} color={theme.buttonText} />
                <Text style={[styles.errorTitle, { color: theme.buttonText }]}>
                  Topic Not Found
                </Text>
                <Text style={[styles.errorText, { color: theme.buttonText, opacity: 0.8 }]}>
                  We couldn&apos;t find the topic you&apos;re looking for. Please try again or go back to the library.
                </Text>
                <TouchableOpacity
                  onPress={() => router.back()}
                  style={[styles.errorButton, { backgroundColor: theme.card }]}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.errorButtonText, { color: theme.textPrimary }]}>
                    Back to Library
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </SafeAreaView>
        </LinearGradient>

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
            <ScrollView
              style={styles.scrollView}
              contentContainerStyle={styles.scrollContent}
              showsVerticalScrollIndicator={false}
            >
              {/* Header with back button and heart */}
              <View style={styles.header}>
                <TouchableOpacity
                  onPress={() => router.back()}
                  style={[styles.backButton, { backgroundColor: theme.card }]}
                  activeOpacity={0.7}
                >
                  <Ionicons name="arrow-back" size={24} color={theme.textPrimary} />
                </TouchableOpacity>
                
                <TouchableOpacity
                  onPress={toggleSaveTopic}
                  style={[styles.heartButton, { backgroundColor: theme.card }]}
                  activeOpacity={0.7}
                >
                  <Ionicons
                    name={isSaved ? 'heart' : 'heart-outline'}
                    size={24}
                    color={isSaved ? '#FF6B6B' : theme.textPrimary}
                  />
                </TouchableOpacity>
              </View>

              {/* Topic image with fade-in animation */}
              <Animated.View
                style={[
                  styles.imageWrapper,
                  {
                    opacity: imageOpacity,
                    transform: [{ scale: imageScale }],
                  },
                ]}
              >
                <View style={[styles.imageContainer, { backgroundColor: theme.card }]}>
                  <Image
                    source={{ uri: topic.imageUrl }}
                    style={styles.topicImage}
                    resizeMode="cover"
                  />
                  <LinearGradient
                    colors={['transparent', 'rgba(0, 0, 0, 0.3)']}
                    style={styles.imageOverlay}
                  />
                </View>
              </Animated.View>

              {/* Topic title */}
              <Animated.View style={{ opacity: titleOpacity }}>
                <Text style={[styles.topicTitle, { color: theme.buttonText }]}>
                  {topic.title}
                </Text>
              </Animated.View>

              {/* Content sections */}
              <ContentSection
                title="Overview"
                content={topic.content.overview}
                index={0}
                theme={theme}
              />

              <ContentSection
                title="Common Signs"
                content={topic.content.symptoms}
                index={1}
                theme={theme}
              />

              <ContentSection
                title="How it Affects Daily Life"
                content={topic.content.effects}
                index={2}
                theme={theme}
              />

              <ContentSection
                title="Coping & Support"
                content={topic.content.coping}
                index={3}
                theme={theme}
              />

              {/* Disclaimer */}
              <View style={[styles.disclaimer, { backgroundColor: theme.card, opacity: 0.9 }]}>
                <Ionicons name="information-circle-outline" size={20} color={theme.textSecondary} style={styles.disclaimerIcon} />
                <Text style={[styles.disclaimerText, { color: theme.textSecondary }]}>
                  This information is for education only and is not a diagnosis or a substitute for professional help.
                </Text>
              </View>

              {/* Ask AI Questions Button */}
              <TouchableOpacity
                onPress={handleAskAI}
                disabled={isNavigating}
                activeOpacity={0.8}
                style={styles.askAIButtonContainer}
              >
                <LinearGradient
                  colors={theme.primaryGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.askAIButton}
                >
                  {isNavigating ? (
                    <ActivityIndicator color={theme.buttonText} size="small" />
                  ) : (
                    <>
                      <Ionicons name="chatbubbles" size={24} color={theme.buttonText} style={styles.askAIIcon} />
                      <Text style={[styles.askAIButtonText, { color: theme.buttonText }]}>
                        Ask AI questions about this topic
                      </Text>
                    </>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </SafeAreaView>
      </LinearGradient>

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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'android' ? 16 : 8,
    paddingBottom: 120,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
    paddingHorizontal: 4,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.1)',
    elevation: 3,
  },
  heartButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.1)',
    elevation: 3,
  },
  imageWrapper: {
    marginBottom: 20,
  },
  imageContainer: {
    width: '100%',
    height: 220,
    borderRadius: 20,
    overflow: 'hidden',
    boxShadow: '0px 4px 16px rgba(0, 0, 0, 0.15)',
    elevation: 6,
  },
  topicImage: {
    width: '100%',
    height: '100%',
  },
  imageOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 80,
  },
  topicTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 24,
    paddingHorizontal: 8,
    lineHeight: 34,
  },
  sectionContainer: {
    marginBottom: 16,
  },
  section: {
    borderRadius: 16,
    padding: 20,
    boxShadow: '0px 2px 10px rgba(0, 0, 0, 0.08)',
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 12,
  },
  sectionText: {
    fontSize: 15,
    lineHeight: 22,
  },
  listContainer: {
    gap: 10,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  bullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginTop: 8,
  },
  listItemText: {
    flex: 1,
    fontSize: 15,
    lineHeight: 22,
  },
  disclaimer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderRadius: 12,
    padding: 16,
    marginTop: 8,
    marginBottom: 24,
  },
  disclaimerIcon: {
    marginRight: 10,
    marginTop: 2,
  },
  disclaimerText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 19,
    fontStyle: 'italic',
  },
  askAIButtonContainer: {
    borderRadius: 50,
    overflow: 'hidden',
    marginBottom: 16,
    boxShadow: '0px 4px 16px rgba(0, 0, 0, 0.2)',
    elevation: 8,
  },
  askAIButton: {
    paddingVertical: 20,
    paddingHorizontal: 32,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  askAIIcon: {
    marginRight: 12,
  },
  askAIButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    paddingTop: 60,
  },
  errorTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 20,
    marginBottom: 12,
  },
  errorText: {
    fontSize: 16,
    lineHeight: 24,
    textAlign: 'center',
    marginBottom: 32,
  },
  errorButton: {
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 12,
    boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.1)',
    elevation: 3,
  },
  errorButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});
