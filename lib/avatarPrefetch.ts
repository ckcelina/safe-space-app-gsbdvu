
/**
 * Avatar Prefetch Utility
 * 
 * Ensures therapist avatars load instantly by prefetching them
 * into memory and disk cache.
 * 
 * USAGE:
 * - Call prefetchAllAvatars() on app start
 * - Call prefetchSelectedAvatar(personaId) when persona changes
 * 
 * OFFLINE SUPPORT:
 * - All avatars are local bundled assets (require())
 * - Prefetching ensures they're in memory cache
 * - Works even with no internet connection
 */

import { Image } from 'expo-image';
import { THERAPIST_PERSONAS, getPersonaById } from '@/constants/TherapistPersonas';

/**
 * Prefetch all therapist avatars into memory and disk cache
 * Call this on app start to ensure instant loading
 */
export async function prefetchAllAvatars(): Promise<void> {
  try {
    console.log('[AvatarPrefetch] Starting prefetch of all therapist avatars...');
    
    // Extract all avatar sources
    const avatarSources = THERAPIST_PERSONAS.map((persona) => persona.image);
    
    // Prefetch with memory-disk cache policy for maximum performance
    const result = await Image.prefetch(avatarSources, 'memory-disk');
    
    if (result) {
      console.log('[AvatarPrefetch] ✅ All avatars prefetched successfully');
    } else {
      console.warn('[AvatarPrefetch] ⚠️ Some avatars failed to prefetch');
    }
  } catch (error) {
    // Silent failure - don't crash the app
    console.warn('[AvatarPrefetch] Failed to prefetch avatars:', error);
  }
}

/**
 * Prefetch a specific therapist avatar
 * Call this when the user changes their therapist persona
 */
export async function prefetchSelectedAvatar(personaId: string): Promise<void> {
  try {
    console.log('[AvatarPrefetch] Prefetching avatar for persona:', personaId);
    
    const persona = getPersonaById(personaId);
    if (!persona) {
      console.warn('[AvatarPrefetch] Persona not found:', personaId);
      return;
    }
    
    // Prefetch with high priority and memory-disk cache
    const result = await Image.prefetch([persona.image], 'memory-disk');
    
    if (result) {
      console.log('[AvatarPrefetch] ✅ Avatar prefetched for', persona.name);
    } else {
      console.warn('[AvatarPrefetch] ⚠️ Failed to prefetch avatar for', persona.name);
    }
  } catch (error) {
    // Silent failure - don't crash the app
    console.warn('[AvatarPrefetch] Failed to prefetch avatar:', error);
  }
}

/**
 * Clear avatar cache (useful for debugging or memory management)
 * This will force avatars to reload from disk on next render
 */
export async function clearAvatarCache(): Promise<void> {
  try {
    console.log('[AvatarPrefetch] Clearing avatar cache...');
    await Image.clearMemoryCache();
    console.log('[AvatarPrefetch] ✅ Avatar cache cleared');
  } catch (error) {
    console.warn('[AvatarPrefetch] Failed to clear cache:', error);
  }
}
