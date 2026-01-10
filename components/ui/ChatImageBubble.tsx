
import React, { useState, useCallback } from 'react';
import { View, StyleSheet, TouchableOpacity, Modal, Dimensions, ActivityIndicator } from 'react-native';
import { Image } from 'expo-image';
import { supabase } from '@/lib/supabase';
import { useThemeContext } from '@/contexts/ThemeContext';
import { Ionicons } from '@expo/vector-icons';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface ChatImageBubbleProps {
  imageUrl: string;
  isUser: boolean;
}

export function ChatImageBubble({ imageUrl, isUser }: ChatImageBubbleProps) {
  const { theme } = useThemeContext();
  const [fullScreenVisible, setFullScreenVisible] = useState(false);
  const [signedUrl, setSignedUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  // Load signed URL when component mounts
  const loadSignedUrl = useCallback(async () => {
    try {
      setLoading(true);
      setError(false);

      const { data, error: urlError } = await supabase.storage
        .from('chat-images')
        .createSignedUrl(imageUrl, 3600); // 1 hour expiry

      if (urlError || !data) {
        console.error('[ChatImageBubble] Error creating signed URL:', urlError);
        setError(true);
        return;
      }

      setSignedUrl(data.signedUrl);
    } catch (err) {
      console.error('[ChatImageBubble] Unexpected error:', err);
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [imageUrl]);

  React.useEffect(() => {
    loadSignedUrl();
  }, [loadSignedUrl]);

  if (loading) {
    return (
      <View
        style={[
          styles.container,
          isUser ? styles.userContainer : styles.assistantContainer,
          { backgroundColor: isUser ? theme.primary : theme.card },
        ]}
      >
        <ActivityIndicator size="small" color={isUser ? theme.buttonText : theme.textPrimary} />
      </View>
    );
  }

  if (error || !signedUrl) {
    return (
      <View
        style={[
          styles.container,
          isUser ? styles.userContainer : styles.assistantContainer,
          { backgroundColor: isUser ? theme.primary : theme.card },
        ]}
      >
        <Ionicons
          name="image-outline"
          size={24}
          color={isUser ? theme.buttonText : theme.textSecondary}
        />
      </View>
    );
  }

  return (
    <>
      <TouchableOpacity
        onPress={() => setFullScreenVisible(true)}
        activeOpacity={0.9}
        style={[
          styles.container,
          isUser ? styles.userContainer : styles.assistantContainer,
        ]}
      >
        <Image
          source={{ uri: signedUrl }}
          style={styles.image}
          contentFit="cover"
          transition={200}
        />
      </TouchableOpacity>

      {/* Full screen image modal */}
      <Modal
        visible={fullScreenVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setFullScreenVisible(false)}
      >
        <View style={styles.modalContainer}>
          <TouchableOpacity
            style={styles.modalBackground}
            activeOpacity={1}
            onPress={() => setFullScreenVisible(false)}
          >
            <View style={styles.modalContent}>
              <Image
                source={{ uri: signedUrl }}
                style={styles.fullScreenImage}
                contentFit="contain"
              />
            </View>

            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setFullScreenVisible(false)}
            >
              <Ionicons name="close" size={32} color="#FFFFFF" />
            </TouchableOpacity>
          </TouchableOpacity>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 16,
    overflow: 'hidden',
    maxWidth: SCREEN_WIDTH * 0.7,
    minWidth: 200,
    minHeight: 150,
    justifyContent: 'center',
    alignItems: 'center',
  },
  userContainer: {
    alignSelf: 'flex-end',
  },
  assistantContainer: {
    alignSelf: 'flex-start',
  },
  image: {
    width: '100%',
    height: 200,
    borderRadius: 16,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.95)',
  },
  modalBackground: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullScreenImage: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT * 0.8,
  },
  closeButton: {
    position: 'absolute',
    top: 60,
    right: 20,
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
