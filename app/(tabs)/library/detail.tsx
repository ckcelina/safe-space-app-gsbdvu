
import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, Platform, TouchableOpacity, Animated, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useThemeContext } from '@/contexts/ThemeContext';
import { StatusBarGradient } from '@/components/ui/StatusBarGradient';
import { libraryTopics, Topic } from './libraryTopics';
import { Ionicons } from '@expo/vector-icons';
import FloatingTabBar from '@/components/FloatingTabBar';

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
  const router = useRouter();
  const params = useLocalSearchParams();
  const topicId = params.topicId as string;

  // Animation refs
  const imageOpacity = useRef(new Animated.Value(0)).current;
  const imageScale = useRef(new Animated.Value(0.9)).current;
  const titleOpacity = useRef(new Animated.Value(0)).current;

  // Find the topic from the static dataset
  const topic: Topic | undefined = libraryTopics.find(t => t.id === topicId);

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

  // Generate image URL based on the topic ID
  const getImageUrl = (id: string) => {
    const imageMap: { [key: string]: string } = {
      'gad': 'https://images.unsplash.com/photo-1499209974431-9dddcece7f88?w=800&h=400&fit=crop',
      'depression': 'https://images.unsplash.com/photo-1518531933037-91b2f5f229cc?w=800&h=400&fit=crop',
      'bipolar': 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&h=400&fit=crop',
      'bpd': 'https://images.unsplash.com/photo-1516589178581-6cd7833ae3b2?w=800&h=400&fit=crop',
      'adhd': 'https://images.unsplash.com/photo-1559757175-5700dde675bc?w=800&h=400&fit=crop',
      'ocd': 'https://images.unsplash.com/photo-1484480974693-6ca0a78fb36b?w=800&h=400&fit=crop',
      'ptsd': 'https://images.unsplash.com/photo-1519681393784-d120267933ba?w=800&h=400&fit=crop',
    };
    return imageMap[id] || 'https://images.unsplash.com/photo-1499209974431-9dddcece7f88?w=800&h=400&fit=crop';
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
              {/* Header with back button */}
              <View style={styles.header}>
                <TouchableOpacity
                  onPress={() => router.back()}
                  style={[styles.backButton, { backgroundColor: theme.card }]}
                  activeOpacity={0.7}
                >
                  <Ionicons name="arrow-back" size={24} color={theme.textPrimary} />
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
                    source={{ uri: getImageUrl(topic.id) }}
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
    flexDirection: 'row',
    alignItems: 'center',
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
    marginBottom: 16,
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
