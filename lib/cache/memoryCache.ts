
/**
 * In-Memory Cache Store (Singleton)
 * 
 * GOAL: Make the app feel fast and stable across sessions.
 * 
 * FEATURES:
 * - Caches therapist persona metadata
 * - Caches People list ordering
 * - Caches last activity timestamps
 * - Clears on logout
 * 
 * USAGE:
 * - Home screen: Use cached People list immediately, revalidate in background
 * - Chat screen: Update cache on message send/receive
 * - Auth: Clear cache on logout
 */

import { Person } from '@/types/database.types';
import { TherapistPersona } from '@/constants/TherapistPersonas';

interface PersonWithLastMessage extends Person {
  lastMessage?: string;
  lastMessageTime?: string;
  lastActivityAt?: string;
}

interface CacheData {
  // People list cache
  people: PersonWithLastMessage[];
  peopleLastFetch: number | null;
  
  // Topics list cache
  topics: PersonWithLastMessage[];
  topicsLastFetch: number | null;
  
  // Therapist persona cache
  therapistPersona: TherapistPersona | null;
  therapistPersonaLastFetch: number | null;
  
  // Last activity timestamps (person_id -> timestamp)
  lastActivityMap: Map<string, string>;
}

class MemoryCache {
  private static instance: MemoryCache;
  private cache: CacheData;
  
  private constructor() {
    this.cache = {
      people: [],
      peopleLastFetch: null,
      topics: [],
      topicsLastFetch: null,
      therapistPersona: null,
      therapistPersonaLastFetch: null,
      lastActivityMap: new Map(),
    };
    
    if (__DEV__) {
      console.log('[MemoryCache] Singleton instance created');
    }
  }
  
  /**
   * Get singleton instance
   */
  public static getInstance(): MemoryCache {
    if (!MemoryCache.instance) {
      MemoryCache.instance = new MemoryCache();
    }
    return MemoryCache.instance;
  }
  
  // ═══════════════════════════════════════════════════════════════════
  // PEOPLE LIST CACHE
  // ═══════════════════════════════════════════════════════════════════
  
  /**
   * Get cached people list
   * Returns empty array if cache is empty or stale (> 5 minutes)
   */
  public getPeopleList(): PersonWithLastMessage[] {
    const now = Date.now();
    const cacheAge = this.cache.peopleLastFetch ? now - this.cache.peopleLastFetch : Infinity;
    const isStale = cacheAge > 5 * 60 * 1000; // 5 minutes
    
    if (isStale) {
      if (__DEV__) {
        console.log('[MemoryCache] People cache is stale, returning empty array');
      }
      return [];
    }
    
    if (__DEV__) {
      console.log('[MemoryCache] Returning cached people list:', this.cache.people.length, 'items');
    }
    
    return [...this.cache.people]; // Return copy to prevent mutations
  }
  
  /**
   * Update cached people list
   */
  public setPeopleList(people: PersonWithLastMessage[]): void {
    this.cache.people = [...people]; // Store copy to prevent mutations
    this.cache.peopleLastFetch = Date.now();
    
    if (__DEV__) {
      console.log('[MemoryCache] People list cached:', people.length, 'items');
    }
  }
  
  /**
   * Check if people cache is fresh (< 5 minutes old)
   */
  public isPeopleCacheFresh(): boolean {
    if (!this.cache.peopleLastFetch) return false;
    
    const now = Date.now();
    const cacheAge = now - this.cache.peopleLastFetch;
    return cacheAge < 5 * 60 * 1000; // 5 minutes
  }
  
  // ═══════════════════════════════════════════════════════════════════
  // TOPICS LIST CACHE
  // ═══════════════════════════════════════════════════════════════════
  
  /**
   * Get cached topics list
   * Returns empty array if cache is empty or stale (> 5 minutes)
   */
  public getTopicsList(): PersonWithLastMessage[] {
    const now = Date.now();
    const cacheAge = this.cache.topicsLastFetch ? now - this.cache.topicsLastFetch : Infinity;
    const isStale = cacheAge > 5 * 60 * 1000; // 5 minutes
    
    if (isStale) {
      if (__DEV__) {
        console.log('[MemoryCache] Topics cache is stale, returning empty array');
      }
      return [];
    }
    
    if (__DEV__) {
      console.log('[MemoryCache] Returning cached topics list:', this.cache.topics.length, 'items');
    }
    
    return [...this.cache.topics]; // Return copy to prevent mutations
  }
  
  /**
   * Update cached topics list
   */
  public setTopicsList(topics: PersonWithLastMessage[]): void {
    this.cache.topics = [...topics]; // Store copy to prevent mutations
    this.cache.topicsLastFetch = Date.now();
    
    if (__DEV__) {
      console.log('[MemoryCache] Topics list cached:', topics.length, 'items');
    }
  }
  
  /**
   * Check if topics cache is fresh (< 5 minutes old)
   */
  public isTopicsCacheFresh(): boolean {
    if (!this.cache.topicsLastFetch) return false;
    
    const now = Date.now();
    const cacheAge = now - this.cache.topicsLastFetch;
    return cacheAge < 5 * 60 * 1000; // 5 minutes
  }
  
  // ═══════════════════════════════════════════════════════════════════
  // THERAPIST PERSONA CACHE
  // ═══════════════════════════════════════════════════════════════════
  
  /**
   * Get cached therapist persona
   * Returns null if cache is empty or stale (> 10 minutes)
   */
  public getTherapistPersona(): TherapistPersona | null {
    const now = Date.now();
    const cacheAge = this.cache.therapistPersonaLastFetch ? now - this.cache.therapistPersonaLastFetch : Infinity;
    const isStale = cacheAge > 10 * 60 * 1000; // 10 minutes
    
    if (isStale) {
      if (__DEV__) {
        console.log('[MemoryCache] Therapist persona cache is stale, returning null');
      }
      return null;
    }
    
    if (__DEV__) {
      console.log('[MemoryCache] Returning cached therapist persona:', this.cache.therapistPersona?.name || 'none');
    }
    
    return this.cache.therapistPersona;
  }
  
  /**
   * Update cached therapist persona
   */
  public setTherapistPersona(persona: TherapistPersona): void {
    this.cache.therapistPersona = persona;
    this.cache.therapistPersonaLastFetch = Date.now();
    
    if (__DEV__) {
      console.log('[MemoryCache] Therapist persona cached:', persona.name);
    }
  }
  
  // ═══════════════════════════════════════════════════════════════════
  // LAST ACTIVITY TIMESTAMPS
  // ═══════════════════════════════════════════════════════════════════
  
  /**
   * Get last activity timestamp for a person
   */
  public getLastActivity(personId: string): string | null {
    return this.cache.lastActivityMap.get(personId) || null;
  }
  
  /**
   * Update last activity timestamp for a person
   */
  public setLastActivity(personId: string, timestamp: string): void {
    this.cache.lastActivityMap.set(personId, timestamp);
    
    if (__DEV__) {
      console.log('[MemoryCache] Last activity updated for person:', personId, 'at', timestamp);
    }
  }
  
  /**
   * Update last activity for multiple persons
   */
  public setLastActivityBulk(activities: Array<{ personId: string; timestamp: string }>): void {
    activities.forEach(({ personId, timestamp }) => {
      this.cache.lastActivityMap.set(personId, timestamp);
    });
    
    if (__DEV__) {
      console.log('[MemoryCache] Bulk last activity update:', activities.length, 'items');
    }
  }
  
  // ═══════════════════════════════════════════════════════════════════
  // CACHE MANAGEMENT
  // ═══════════════════════════════════════════════════════════════════
  
  /**
   * Clear all cache data (called on logout)
   */
  public clearAll(): void {
    this.cache = {
      people: [],
      peopleLastFetch: null,
      topics: [],
      topicsLastFetch: null,
      therapistPersona: null,
      therapistPersonaLastFetch: null,
      lastActivityMap: new Map(),
    };
    
    if (__DEV__) {
      console.log('[MemoryCache] All cache cleared');
    }
  }
  
  /**
   * Clear only people and topics cache (useful for refresh)
   */
  public clearListsCache(): void {
    this.cache.people = [];
    this.cache.peopleLastFetch = null;
    this.cache.topics = [];
    this.cache.topicsLastFetch = null;
    
    if (__DEV__) {
      console.log('[MemoryCache] Lists cache cleared');
    }
  }
  
  /**
   * Get cache statistics (dev only)
   */
  public getStats(): {
    peopleCount: number;
    topicsCount: number;
    peopleCacheAge: number | null;
    topicsCacheAge: number | null;
    therapistPersonaCacheAge: number | null;
    lastActivityCount: number;
  } {
    const now = Date.now();
    
    return {
      peopleCount: this.cache.people.length,
      topicsCount: this.cache.topics.length,
      peopleCacheAge: this.cache.peopleLastFetch ? now - this.cache.peopleLastFetch : null,
      topicsCacheAge: this.cache.topicsLastFetch ? now - this.cache.topicsLastFetch : null,
      therapistPersonaCacheAge: this.cache.therapistPersonaLastFetch ? now - this.cache.therapistPersonaLastFetch : null,
      lastActivityCount: this.cache.lastActivityMap.size,
    };
  }
}

// Export singleton instance
export const memoryCache = MemoryCache.getInstance();
