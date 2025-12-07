
import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Platform, TouchableOpacity, Animated, Image, PanResponder, TextInput } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useThemeContext } from '@/contexts/ThemeContext';
import { StatusBarGradient } from '@/components/ui/StatusBarGradient';
import { libraryTopics, Topic } from './libraryTopics';
import FloatingTabBar from '@/components/FloatingTabBar';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';

const SAVED_TOPICS_KEY = '@library_saved_topics';

// Topic bubble component with animations and heart icon
function TopicBubble({ 
  topic, 
  index, 
  theme, 
  onPress,
  isSaved,
  onToggleSave,
}: { 
  topic: Topic; 
  index: number; 
  theme: any; 
  onPress: () => void;
  isSaved: boolean;
  onToggleSave: () => void;
}) {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    // Staggered fade-in and slide-in animation
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        delay: index * 100,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        delay: index * 100,
        useNativeDriver: true,
      }),
    ]).start();
  }, [fadeAnim, slideAnim, index]);

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.95,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      friction: 3,
      tension: 40,
      useNativeDriver: true,
    }).start();
  };

  const handleHeartPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onToggleSave();
  };

  // Generate image URL based on the prompt
  const getImageUrl = (prompt: string) => {
    const imageMap: { [key: string]: string } = {
      'gad': 'https://images.unsplash.com/photo-1499209974431-9dddcece7f88?w=400&h=300&fit=crop',
      'depression': 'https://images.unsplash.com/photo-1518531933037-91b2f5f229cc?w=400&h=300&fit=crop',
      'bipolar': 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=300&fit=crop',
      'bpd': 'https://images.unsplash.com/photo-1516589178581-6cd7833ae3b2?w=400&h=300&fit=crop',
      'adhd': 'https://images.unsplash.com/photo-1559757175-5700dde675bc?w=400&h=300&fit=crop',
      'ocd': 'https://images.unsplash.com/photo-1484480974693-6ca0a78fb36b?w=400&h=300&fit=crop',
      'ptsd': 'https://images.unsplash.com/photo-1519681393784-d120267933ba?w=400&h=300&fit=crop',
    };
    return imageMap[topic.id] || 'https://images.unsplash.com/photo-1499209974431-9dddcece7f88?w=400&h=300&fit=crop';
  };

  return (
    <Animated.View
      style={[
        styles.bubbleWrapper,
        {
          opacity: fadeAnim,
          transform: [
            { scale: scaleAnim },
            { translateY: slideAnim },
          ],
        },
      ]}
    >
      <TouchableOpacity
        activeOpacity={0.9}
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={styles.bubbleTouchable}
      >
        <View style={[styles.bubble, { backgroundColor: theme.card }]}>
          <View style={styles.imageContainer}>
            <Image
              source={{ uri: getImageUrl(topic.imagePrompt) }}
              style={styles.bubbleImage}
              resizeMode="cover"
            />
            <LinearGradient
              colors={['transparent', 'rgba(255, 255, 255, 0.9)']}
              style={styles.imageGradient}
            />
            {/* Heart icon */}
            <TouchableOpacity
              onPress={handleHeartPress}
              style={styles.heartButton}
              activeOpacity={0.7}
            >
              <Ionicons
                name={isSaved ? 'heart' : 'heart-outline'}
                size={24}
                color={isSaved ? '#FF6B6B' : '#FFFFFF'}
              />
            </TouchableOpacity>
          </View>
          <View style={styles.bubbleContent}>
            <Text style={[styles.bubbleTitle, { color: theme.textPrimary }]} numberOfLines={2}>
              {topic.title}
            </Text>
            <Text style={[styles.bubbleDescription, { color: theme.textSecondary }]} numberOfLines={3}>
              {topic.shortDescription}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

export default function LibraryScreen() {
  const { theme } = useThemeContext();
  const router = useRouter();
  const scrollViewRef = useRef<ScrollView>(null);

  // State for search and saved topics
  const [searchQuery, setSearchQuery] = useState('');
  const [savedTopicIds, setSavedTopicIds] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load saved topics from AsyncStorage on mount
  useEffect(() => {
    loadSavedTopics();
  }, []);

  const loadSavedTopics = async () => {
    try {
      const saved = await AsyncStorage.getItem(SAVED_TOPICS_KEY);
      if (saved) {
        const parsedSaved = JSON.parse(saved);
        setSavedTopicIds(parsedSaved);
        console.log('[Library] Loaded saved topics:', parsedSaved);
      }
    } catch (error) {
      console.error('[Library] Error loading saved topics:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleSaveTopic = async (topicId: string) => {
    try {
      const isSaved = savedTopicIds.includes(topicId);
      const newSavedTopicIds = isSaved
        ? savedTopicIds.filter(id => id !== topicId)
        : [...savedTopicIds, topicId];
      
      setSavedTopicIds(newSavedTopicIds);
      await AsyncStorage.setItem(SAVED_TOPICS_KEY, JSON.stringify(newSavedTopicIds));
      console.log('[Library] Toggled save for topic:', topicId, 'New saved:', newSavedTopicIds);
    } catch (error) {
      console.error('[Library] Error saving topic:', error);
    }
  };

  // Filter topics based on search query
  const filteredTopics = libraryTopics.filter(topic => {
    if (!searchQuery.trim()) return true;
    
    const query = searchQuery.toLowerCase();
    return (
      topic.title.toLowerCase().includes(query) ||
      topic.shortDescription.toLowerCase().includes(query)
    );
  });

  // Get saved topics
  const savedTopics = libraryTopics.filter(topic => savedTopicIds.includes(topic.id));

  // Create PanResponder for swipe gesture
  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (evt, gestureState) => {
        const isHorizontalSwipe = Math.abs(gestureState.dx) > Math.abs(gestureState.dy) * 2;
        const isSignificantSwipe = Math.abs(gestureState.dx) > 10;
        return isHorizontalSwipe && isSignificantSwipe;
      },
      onPanResponderRelease: (evt, gestureState) => {
        if (gestureState.dx > 50) {
          console.log('[Library] Swipe right detected, navigating to Home');
          router.push('/(tabs)/(home)');
        }
      },
    })
  ).current;

  const handleTopicPress = (topicId: string) => {
    console.log('Navigating to topic:', topicId);
    router.push({
      pathname: '/(tabs)/library/detail',
      params: { topicId },
    });
  };

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
          <View style={styles.container} {...panResponder.panHandlers}>
            <ScrollView
              ref={scrollViewRef}
              style={styles.scrollView}
              contentContainerStyle={styles.scrollContent}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              <View style={styles.header}>
                <Text style={[styles.headerTitle, { color: theme.buttonText }]}>
                  Library
                </Text>
                <Text style={[styles.headerSubtitle, { color: theme.buttonText, opacity: 0.9 }]}>
                  Learn about different mental health topics in a safe, friendly way.
                </Text>
              </View>

              {/* Search bar */}
              <View style={[styles.searchContainer, { backgroundColor: theme.card }]}>
                <Ionicons name="search" size={20} color={theme.textSecondary} style={styles.searchIcon} />
                <TextInput
                  style={[styles.searchInput, { color: theme.textPrimary }]}
                  placeholder="Search topics..."
                  placeholderTextColor={theme.textSecondary}
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
                {searchQuery.length > 0 && (
                  <TouchableOpacity onPress={() => setSearchQuery('')} style={styles.clearButton}>
                    <Ionicons name="close-circle" size={20} color={theme.textSecondary} />
                  </TouchableOpacity>
                )}
              </View>

              {/* Saved topics section */}
              {!isLoading && savedTopics.length > 0 && !searchQuery && (
                <View style={styles.savedSection}>
                  <Text style={[styles.savedSectionTitle, { color: theme.buttonText }]}>
                    Saved topics
                  </Text>
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.savedScrollContent}
                  >
                    {savedTopics.map((topic, index) => (
                      <View key={topic.id} style={styles.savedTopicWrapper}>
                        <TopicBubble
                          topic={topic}
                          index={index}
                          theme={theme}
                          onPress={() => handleTopicPress(topic.id)}
                          isSaved={true}
                          onToggleSave={() => toggleSaveTopic(topic.id)}
                        />
                      </View>
                    ))}
                  </ScrollView>
                </View>
              )}

              {/* All topics section */}
              {!searchQuery && savedTopics.length > 0 && (
                <Text style={[styles.allTopicsTitle, { color: theme.buttonText }]}>
                  All topics
                </Text>
              )}

              {/* Topics grid */}
              {filteredTopics.length > 0 ? (
                <View style={styles.topicsGrid}>
                  {filteredTopics.map((topic, index) => (
                    <TopicBubble
                      key={topic.id}
                      topic={topic}
                      index={index}
                      theme={theme}
                      onPress={() => handleTopicPress(topic.id)}
                      isSaved={savedTopicIds.includes(topic.id)}
                      onToggleSave={() => toggleSaveTopic(topic.id)}
                    />
                  ))}
                </View>
              ) : (
                <View style={styles.noResultsContainer}>
                  <Ionicons name="search-outline" size={64} color={theme.buttonText} style={styles.noResultsIcon} />
                  <Text style={[styles.noResultsTitle, { color: theme.buttonText }]}>
                    No topics found
                  </Text>
                  <Text style={[styles.noResultsText, { color: theme.buttonText, opacity: 0.8 }]}>
                    Try adjusting your search to find what you&apos;re looking for.
                  </Text>
                </View>
              )}
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
    marginBottom: 20,
    paddingHorizontal: 8,
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
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 24,
    boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.08)',
    elevation: 2,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    paddingVertical: 0,
  },
  clearButton: {
    padding: 4,
  },
  savedSection: {
    marginBottom: 24,
  },
  savedSectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
    paddingHorizontal: 8,
  },
  savedScrollContent: {
    paddingHorizontal: 8,
    gap: 16,
  },
  savedTopicWrapper: {
    width: 180,
  },
  allTopicsTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
    paddingHorizontal: 8,
  },
  topicsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 16,
  },
  bubbleWrapper: {
    width: '48%',
    marginBottom: 16,
  },
  bubbleTouchable: {
    width: '100%',
  },
  bubble: {
    borderRadius: 20,
    overflow: 'hidden',
    boxShadow: '0px 4px 12px rgba(0, 0, 0, 0.1)',
    elevation: 4,
  },
  imageContainer: {
    width: '100%',
    height: 140,
    position: 'relative',
  },
  bubbleImage: {
    width: '100%',
    height: '100%',
  },
  imageGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 60,
  },
  heartButton: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderRadius: 20,
    padding: 6,
  },
  bubbleContent: {
    padding: 16,
    paddingTop: 12,
  },
  bubbleTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 8,
    lineHeight: 20,
  },
  bubbleDescription: {
    fontSize: 13,
    lineHeight: 18,
  },
  noResultsContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 32,
  },
  noResultsIcon: {
    marginBottom: 16,
    opacity: 0.6,
  },
  noResultsTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  noResultsText: {
    fontSize: 16,
    lineHeight: 24,
    textAlign: 'center',
  },
});
