
import React, { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, Platform, TouchableOpacity, Animated, Image, PanResponder, TextInput, FlatList, useWindowDimensions, Keyboard } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useThemeContext } from '@/contexts/ThemeContext';
import { StatusBarGradient } from '@/components/ui/StatusBarGradient';
import { libraryTopics, Topic } from './libraryTopics';
import FloatingTabBar from '@/components/FloatingTabBar';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';


const SAVED_TOPICS_KEY = '@library_saved_topics';

// Responsive layout constants
const TAB_BAR_HEIGHT = 60;
const HORIZONTAL_PADDING_PERCENT = 0.05; // 5% on each side
const CARD_GAP = 16;
const IMAGE_ASPECT_RATIO = 16 / 10; // Consistent aspect ratio for images

// Calculate number of columns based on screen width
function getNumColumns(width: number): number {
  if (width < 420) return 2;
  if (width < 768) return 2;
  if (width < 1024) return 3;
  return 4;
}

// Topic bubble component with animations and heart icon
function TopicBubble({ 
  topic, 
  index, 
  theme, 
  onPress,
  isSaved,
  onToggleSave,
  cardWidth,
}: { 
  topic: Topic; 
  index: number; 
  theme: any; 
  onPress: () => void;
  isSaved: boolean;
  onToggleSave: () => void;
  cardWidth: number;
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
          width: cardWidth,
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
          <View style={[styles.imageContainer, { aspectRatio: IMAGE_ASPECT_RATIO }]}>
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
            <Text 
              style={[styles.bubbleTitle, { color: theme.textPrimary }]} 
              numberOfLines={2}
              ellipsizeMode="tail"
              allowFontScaling={true}
            >
              {topic.title}
            </Text>
            <Text 
              style={[styles.bubbleDescription, { color: theme.textSecondary }]} 
              numberOfLines={3}
              ellipsizeMode="tail"
              allowFontScaling={true}
            >
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
  const searchInputRef = useRef<TextInput>(null);
  const insets = useSafeAreaInsets();
  const { width: windowWidth } = useWindowDimensions();

  // FIXED: Two-state approach for search
  // draftQuery updates on every keystroke (TextInput value)
  // appliedQuery updates only on submit (used for filtering)
  const [draftQuery, setDraftQuery] = useState('');
  const [appliedQuery, setAppliedQuery] = useState('');
  const [savedTopicIds, setSavedTopicIds] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSearchFocused, setIsSearchFocused] = useState(false);

  // Calculate responsive layout values
  const numColumns = useMemo(() => getNumColumns(windowWidth), [windowWidth]);
  const horizontalPadding = useMemo(() => windowWidth * HORIZONTAL_PADDING_PERCENT, [windowWidth]);
  const cardWidth = useMemo(() => {
    const availableWidth = windowWidth - (horizontalPadding * 2) - (CARD_GAP * (numColumns - 1));
    return availableWidth / numColumns;
  }, [windowWidth, horizontalPadding, numColumns]);

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

  const toggleSaveTopic = useCallback(async (topicId: string) => {
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
  }, [savedTopicIds]);

  // FIXED: Handle search submit (when user presses Search/Enter key)
  const handleSearchSubmit = useCallback(() => {
    const trimmedQuery = draftQuery.trim();
    console.log('[Library] Search submitted:', trimmedQuery);
    setAppliedQuery(trimmedQuery);
    Keyboard.dismiss();
    searchInputRef.current?.blur();
  }, [draftQuery]);

  // FIXED: Handle clear button (also applies the empty search and dismisses keyboard)
  const handleClearSearch = useCallback(() => {
    setDraftQuery('');
    setAppliedQuery('');
    Keyboard.dismiss();
    searchInputRef.current?.blur();
    console.log('[Library] Search cleared');
  }, []);

  // Handle search focus
  const handleSearchFocus = useCallback(() => {
    console.log('[Library] Search input focused');
    setIsSearchFocused(true);
  }, []);

  // Handle search blur
  const handleSearchBlur = useCallback(() => {
    console.log('[Library] Search input blurred');
    setIsSearchFocused(false);
    // Apply the search when user leaves the input without submitting
    if (draftQuery.trim() !== appliedQuery) {
      setAppliedQuery(draftQuery.trim());
    }
  }, [draftQuery, appliedQuery]);

  // FIXED: Filter topics based on appliedQuery (not draftQuery)
  const filteredTopics = libraryTopics.filter(topic => {
    if (!appliedQuery.trim()) return true;
    
    const query = appliedQuery.toLowerCase();
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

  const handleTopicPress = useCallback((topicId: string) => {
    console.log('Navigating to topic:', topicId);
    // Dismiss keyboard before navigation
    Keyboard.dismiss();
    searchInputRef.current?.blur();
    router.push({
      pathname: '/(tabs)/library/detail',
      params: { topicId },
    });
  }, [router]);

  const renderTopicItem = ({ item, index }: { item: Topic; index: number }) => (
    <TopicBubble
      topic={item}
      index={index}
      theme={theme}
      onPress={() => handleTopicPress(item.id)}
      isSaved={savedTopicIds.includes(item.id)}
      onToggleSave={() => toggleSaveTopic(item.id)}
      cardWidth={cardWidth}
    />
  );

  const renderListHeader = useMemo(() => (
    <>
      <View style={styles.header}>
        <Text style={[styles.headerTitle, { color: theme.buttonText }]}>
          Library
        </Text>
        <Text style={[styles.headerSubtitle, { color: theme.buttonText, opacity: 0.9 }]}>
          Learn about different mental health topics in a safe, friendly way.
        </Text>
      </View>

      {/* FIXED: Search bar with stable TextInput and improved keyboard behavior */}
      <View style={[styles.searchContainer, { backgroundColor: theme.card }]}>
        <Ionicons name="search" size={20} color={theme.textSecondary} style={styles.searchIcon} />
        <TextInput
          ref={searchInputRef}
          style={[styles.searchInput, { color: theme.textPrimary }]}
          placeholder="Search topics..."
          placeholderTextColor={theme.textSecondary}
          value={draftQuery}
          onChangeText={setDraftQuery}
          onFocus={handleSearchFocus}
          onBlur={handleSearchBlur}
          autoCapitalize="none"
          autoCorrect={false}
          returnKeyType="search"
          blurOnSubmit={false}
          onSubmitEditing={handleSearchSubmit}
        />
        {draftQuery.length > 0 && (
          <TouchableOpacity onPress={handleClearSearch} style={styles.clearButton}>
            <Ionicons name="close-circle" size={20} color={theme.textSecondary} />
          </TouchableOpacity>
        )}
      </View>

      {/* Saved topics section */}
      {!isLoading && savedTopics.length > 0 && !appliedQuery && (
        <View style={styles.savedSection}>
          <Text style={[styles.savedSectionTitle, { color: theme.buttonText }]}>
            Saved topics
          </Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.savedScrollContent}
            keyboardShouldPersistTaps="handled"
          >
            {savedTopics.map((topic, index) => (
              <View key={topic.id} style={[styles.savedTopicWrapper, { width: Math.min(cardWidth, 180) }]}>
                <TopicBubble
                  topic={topic}
                  index={index}
                  theme={theme}
                  onPress={() => handleTopicPress(topic.id)}
                  isSaved={true}
                  onToggleSave={() => toggleSaveTopic(topic.id)}
                  cardWidth={Math.min(cardWidth, 180)}
                />
              </View>
            ))}
          </ScrollView>
        </View>
      )}

      {/* All topics section */}
      {!appliedQuery && savedTopics.length > 0 && (
        <Text style={[styles.allTopicsTitle, { color: theme.buttonText }]}>
          All topics
        </Text>
      )}
    </>
  ), [theme, draftQuery, isLoading, savedTopics, appliedQuery, handleSearchFocus, handleSearchBlur, handleSearchSubmit, handleClearSearch, handleTopicPress, toggleSaveTopic, cardWidth]);

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

  // Key extractor for FlatList
  const keyExtractor = useCallback((item: Topic) => item.id, []);

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
            <FlatList
              key={`flatlist-${numColumns}`}
              data={filteredTopics}
              renderItem={renderTopicItem}
              keyExtractor={keyExtractor}
              numColumns={numColumns}
              ListHeaderComponent={renderListHeader}
              ListEmptyComponent={renderEmptyComponent}
              contentContainerStyle={[
                styles.flatListContent,
                { 
                  paddingHorizontal: horizontalPadding,
                  paddingBottom: TAB_BAR_HEIGHT + insets.bottom + 16
                }
              ]}
              columnWrapperStyle={numColumns > 1 ? { gap: CARD_GAP } : undefined}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              keyboardDismissMode="on-drag"
            />
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
  flatListContent: {
    paddingTop: Platform.OS === 'android' ? 16 : 8,
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
    // Width is set dynamically
  },
  allTopicsTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
    paddingHorizontal: 8,
  },
  bubbleWrapper: {
    marginBottom: CARD_GAP,
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
    minHeight: 90,
  },
  bubbleTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 8,
    lineHeight: 20,
    minHeight: 40,
  },
  bubbleDescription: {
    fontSize: 13,
    lineHeight: 18,
    minHeight: 54,
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
