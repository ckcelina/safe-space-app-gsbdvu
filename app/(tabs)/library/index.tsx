
import React, { useEffect, useRef, useState, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, Platform, TouchableOpacity, Animated, Image, PanResponder, TextInput, FlatList, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useThemeContext } from '@/contexts/ThemeContext';
import { StatusBarGradient } from '@/components/ui/StatusBarGradient';
import { libraryTopics, Topic } from './libraryTopics';
import FloatingTabBar from '@/components/FloatingTabBar';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';
import { Screen } from '@/components/Screen';

const SAVED_TOPICS_KEY = '@library_saved_topics';
const TAB_BAR_HEIGHT = 76;

// Calculate responsive card width
const { width: SCREEN_WIDTH } = Dimensions.get('window');
const NUM_COLUMNS = 2;
const HORIZONTAL_PADDING = 32; // 16px on each side
const GUTTER = 16; // space between cards
const AVAILABLE_WIDTH = SCREEN_WIDTH - HORIZONTAL_PADDING - GUTTER;
const CARD_WIDTH = AVAILABLE_WIDTH / NUM_COLUMNS;

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

  return (
    <Animated.View
      style={[
        styles.bubbleWrapper,
        {
          width: CARD_WIDTH,
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
              source={{ uri: topic.imageUrl }}
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
  const insets = useSafeAreaInsets();
  
  // TextInput ref for focus management
  const searchInputRef = useRef<TextInput>(null);

  // State for search and saved topics
  const [searchQuery, setSearchQuery] = useState('');
  const [savedTopicIds, setSavedTopicIds] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load saved topics on mount
  useEffect(() => {
    const initialize = async () => {
      await loadSavedTopics();
      setIsLoading(false);
    };
    initialize();
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

  // Memoize filtered topics to prevent unnecessary re-renders
  const filteredTopics = useMemo(() => {
    if (!searchQuery.trim()) return libraryTopics;
    
    const query = searchQuery.toLowerCase();
    return libraryTopics.filter(topic => 
      topic.title.toLowerCase().includes(query) ||
      topic.shortDescription.toLowerCase().includes(query)
    );
  }, [searchQuery]);

  // Memoize saved topics
  const savedTopics = useMemo(() => {
    return libraryTopics.filter(topic => savedTopicIds.includes(topic.id));
  }, [savedTopicIds]);

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

  const renderTopicItem = ({ item, index }: { item: Topic; index: number }) => (
    <TopicBubble
      topic={item}
      index={index}
      theme={theme}
      onPress={() => handleTopicPress(item.id)}
      isSaved={savedTopicIds.includes(item.id)}
      onToggleSave={() => toggleSaveTopic(item.id)}
    />
  );

  const renderListHeader = () => (
    <>
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
            keyboardShouldPersistTaps="always"
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
    </>
  );

  const renderEmptyComponent = () => (
    <View style={styles.noResultsContainer}>
      <Ionicons name="search-outline" size={64} color={theme.buttonText} style={styles.noResultsIcon} />
      <Text style={[styles.noResultsTitle, { color: theme.buttonText }]}>
        No topics found
      </Text>
      <Text style={[styles.noResultsText, { color: theme.buttonText, opacity: 0.8 }]}>
        Try adjusting your search to find what you&apos;re looking for.
      </Text>
    </View>
  );

  return (
    <>
      <Screen topColor="#0B66C3">
        <LinearGradient
          colors={theme.primaryGradient}
          style={styles.gradientBackground}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <StatusBarGradient />
          <View style={styles.container} {...panResponder.panHandlers}>
            {/* Header and Search - OUTSIDE FlatList */}
            <View style={styles.headerContainer}>
              <View style={styles.header}>
                <Text style={[styles.headerTitle, { color: theme.buttonText }]}>
                  Library
                </Text>
                <Text style={[styles.headerSubtitle, { color: theme.buttonText, opacity: 0.9 }]}>
                  Learn about different mental health topics in a safe, friendly way.
                </Text>
              </View>

              {/* Search bar - STABLE, NOT re-rendered by FlatList */}
              <View style={[styles.searchContainer, { backgroundColor: theme.card }]}>
                <Ionicons name="search" size={20} color={theme.textSecondary} style={styles.searchIcon} />
                <TextInput
                  ref={searchInputRef}
                  style={[styles.searchInput, { color: theme.textPrimary }]}
                  placeholder="Search topics..."
                  placeholderTextColor={theme.textSecondary}
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  autoCapitalize="none"
                  autoCorrect={false}
                  blurOnSubmit={false}
                  returnKeyType="search"
                />
                {searchQuery.length > 0 && (
                  <TouchableOpacity onPress={() => setSearchQuery('')} style={styles.clearButton}>
                    <Ionicons name="close-circle" size={20} color={theme.textSecondary} />
                  </TouchableOpacity>
                )}
              </View>
            </View>

            {/* FlatList with topics */}
            <FlatList
              data={filteredTopics}
              renderItem={renderTopicItem}
              keyExtractor={(item) => item.id}
              numColumns={NUM_COLUMNS}
              ListHeaderComponent={renderListHeader}
              ListEmptyComponent={renderEmptyComponent}
              contentContainerStyle={[styles.flatListContent, { paddingBottom: TAB_BAR_HEIGHT + insets.bottom + 12 }]}
              columnWrapperStyle={styles.columnWrapper}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              keyboardDismissMode="none"
            />
          </View>
        </LinearGradient>
      </Screen>

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
  container: {
    flex: 1,
  },
  headerContainer: {
    paddingHorizontal: '5%',
    paddingTop: Platform.OS === 'android' ? 16 : 8,
  },
  flatListContent: {
    paddingHorizontal: '5%',
  },
  columnWrapper: {
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  header: {
    marginBottom: 20,
    paddingHorizontal: 8,
  },
  headerTitle: {
    fontSize: Math.min(SCREEN_WIDTH * 0.08, 32),
    fontWeight: 'bold',
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: Math.min(SCREEN_WIDTH * 0.04, 16),
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
  bubbleWrapper: {
    marginBottom: 0,
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
    aspectRatio: 1.2,
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
    fontSize: Math.min(SCREEN_WIDTH * 0.04, 16),
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
    paddingHorizontal: '8%',
  },
  noResultsIcon: {
    marginBottom: 16,
    opacity: 0.6,
  },
  noResultsTitle: {
    fontSize: Math.min(SCREEN_WIDTH * 0.055, 22),
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  noResultsText: {
    fontSize: Math.min(SCREEN_WIDTH * 0.04, 16),
    lineHeight: 24,
    textAlign: 'center',
  },
});
