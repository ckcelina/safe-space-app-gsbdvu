
import { useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';

const LIBRARY_IMAGES_CACHE_KEY = '@library_images_cache';

export interface ImageGenResult {
  url: string;
  path: string;
  width: number;
  height: number;
  duration_ms: number;
  provider_id?: string;
}

interface ImageCache {
  [topicId: string]: string; // topicId -> imageUrl
}

export function useLibraryImageGen() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [imageCache, setImageCache] = useState<ImageCache>({});

  // Load cached images from AsyncStorage
  const loadImageCache = useCallback(async () => {
    try {
      const cached = await AsyncStorage.getItem(LIBRARY_IMAGES_CACHE_KEY);
      if (cached) {
        const parsedCache = JSON.parse(cached);
        setImageCache(parsedCache);
        console.log('[useLibraryImageGen] Loaded image cache:', Object.keys(parsedCache).length, 'images');
        return parsedCache;
      }
      return {};
    } catch (err) {
      console.error('[useLibraryImageGen] Error loading image cache:', err);
      return {};
    }
  }, []);

  // Save image cache to AsyncStorage
  const saveImageCache = useCallback(async (cache: ImageCache) => {
    try {
      await AsyncStorage.setItem(LIBRARY_IMAGES_CACHE_KEY, JSON.stringify(cache));
      console.log('[useLibraryImageGen] Saved image cache');
    } catch (err) {
      console.error('[useLibraryImageGen] Error saving image cache:', err);
    }
  }, []);

  // Generate image for a specific topic
  const generateImage = useCallback(async (topicId: string, prompt: string): Promise<string | null> => {
    // Check if image is already cached
    const cache = await loadImageCache();
    if (cache[topicId]) {
      console.log('[useLibraryImageGen] Using cached image for topic:', topicId);
      return cache[topicId];
    }

    setLoading(true);
    setError(null);

    try {
      console.log('[useLibraryImageGen] Generating image for topic:', topicId);
      console.log('[useLibraryImageGen] Prompt:', prompt);

      const { data, error: invokeError } = await supabase.functions.invoke('generate-image', {
        body: {
          prompt,
          size: '1024x1024',
        },
      });

      if (invokeError) {
        console.error('[useLibraryImageGen] Error invoking function:', invokeError);
        throw new Error(invokeError.message || 'Failed to generate image');
      }

      const result = data as ImageGenResult;
      console.log('[useLibraryImageGen] Image generated successfully:', result.url);

      // Cache the image URL
      const newCache = { ...cache, [topicId]: result.url };
      setImageCache(newCache);
      await saveImageCache(newCache);

      return result.url;
    } catch (err: any) {
      const errorMessage = err?.message ?? 'Unknown error generating image';
      console.error('[useLibraryImageGen] Error:', errorMessage);
      setError(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  }, [loadImageCache, saveImageCache]);

  // Get cached image URL for a topic
  const getCachedImage = useCallback((topicId: string): string | null => {
    return imageCache[topicId] || null;
  }, [imageCache]);

  return {
    generateImage,
    getCachedImage,
    loadImageCache,
    loading,
    error,
    imageCache,
  };
}
