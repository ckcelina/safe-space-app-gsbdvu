
import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, Platform, TouchableOpacity, Animated, Image, PanResponder } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useThemeContext } from '@/contexts/ThemeContext';
import { StatusBarGradient } from '@/components/ui/StatusBarGradient';
import { libraryTopics, Topic } from './libraryTopics';
import FloatingTabBar from '@/components/FloatingTabBar';

// Topic bubble component with animations
function TopicBubble({ topic, index, theme, onPress }: { 
  topic: Topic; 
  index: number; 
  theme: any; 
  onPress: () => void;
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

  // Generate image URL based on the prompt
  // Using Unsplash as a placeholder for generated images
  const getImageUrl = (prompt: string) => {
    // Map prompts to appropriate Unsplash search terms
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

  // Create PanResponder for swipe gesture
  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (evt, gestureState) => {
        // Only trigger if horizontal movement is significant
        // and vertical movement is minimal (to not interfere with scrolling)
        const isHorizontalSwipe = Math.abs(gestureState.dx) > Math.abs(gestureState.dy) * 2;
        const isSignificantSwipe = Math.abs(gestureState.dx) > 10;
        return isHorizontalSwipe && isSignificantSwipe;
      },
      onPanResponderRelease: (evt, gestureState) => {
        // Swipe right to go back to Home tab
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
            >
              <View style={styles.header}>
                <Text style={[styles.headerTitle, { color: theme.buttonText }]}>
                  Library
                </Text>
                <Text style={[styles.headerSubtitle, { color: theme.buttonText, opacity: 0.9 }]}>
                  Learn about different mental health topics in a safe, friendly way.
                </Text>
              </View>

              <View style={styles.topicsGrid}>
                {libraryTopics.map((topic, index) => (
                  <TopicBubble
                    key={topic.id}
                    topic={topic}
                    index={index}
                    theme={theme}
                    onPress={() => handleTopicPress(topic.id)}
                  />
                ))}
              </View>
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
            label: 'Home',
          },
          {
            name: 'library',
            route: '/(tabs)/library',
            icon: 'menu-book',
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
    marginBottom: 24,
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
});
