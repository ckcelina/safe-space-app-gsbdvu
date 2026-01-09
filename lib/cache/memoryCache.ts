
import AsyncStorage from '@react-native-async-storage/async-storage';

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  expiresAt?: number;
}

interface CacheOptions {
  ttl?: number; // Time to live in milliseconds
  persist?: boolean; // Whether to persist to AsyncStorage
}

class MemoryCache {
  private cache: Map<string, CacheEntry<any>>;
  private persistencePrefix = '@memory_cache:';

  constructor() {
    this.cache = new Map();
  }

  /**
   * Set a value in the cache
   */
  async set<T>(key: string, value: T, options: CacheOptions = {}): Promise<void> {
    const { ttl, persist = false } = options;
    
    const entry: CacheEntry<T> = {
      data: value,
      timestamp: Date.now(),
      expiresAt: ttl ? Date.now() + ttl : undefined,
    };

    this.cache.set(key, entry);

    if (persist) {
      try {
        await AsyncStorage.setItem(
          `${this.persistencePrefix}${key}`,
          JSON.stringify(entry)
        );
      } catch (error) {
        console.error('Failed to persist cache entry:', error);
      }
    }
  }

  /**
   * Get a value from the cache
   */
  async get<T>(key: string): Promise<T | null> {
    // Check memory cache first
    let entry = this.cache.get(key) as CacheEntry<T> | undefined;

    // If not in memory, try to load from AsyncStorage
    if (!entry) {
      try {
        const stored = await AsyncStorage.getItem(`${this.persistencePrefix}${key}`);
        if (stored) {
          entry = JSON.parse(stored) as CacheEntry<T>;
          this.cache.set(key, entry);
        }
      } catch (error) {
        console.error('Failed to load cache entry from storage:', error);
      }
    }

    if (!entry) {
      return null;
    }

    // Check if entry has expired
    if (entry.expiresAt && Date.now() > entry.expiresAt) {
      await this.delete(key);
      return null;
    }

    return entry.data;
  }

  /**
   * Check if a key exists in the cache and is not expired
   */
  async has(key: string): Promise<boolean> {
    const value = await this.get(key);
    return value !== null;
  }

  /**
   * Delete a value from the cache
   */
  async delete(key: string): Promise<void> {
    this.cache.delete(key);
    
    try {
      await AsyncStorage.removeItem(`${this.persistencePrefix}${key}`);
    } catch (error) {
      console.error('Failed to remove cache entry from storage:', error);
    }
  }

  /**
   * Clear all cache entries
   */
  async clear(): Promise<void> {
    this.cache.clear();
    
    try {
      const keys = await AsyncStorage.getAllKeys();
      const cacheKeys = keys.filter(key => key.startsWith(this.persistencePrefix));
      await AsyncStorage.multiRemove(cacheKeys);
    } catch (error) {
      console.error('Failed to clear cache from storage:', error);
    }
  }

  /**
   * Get all keys in the cache
   */
  keys(): string[] {
    return Array.from(this.cache.keys());
  }

  /**
   * Get the size of the cache
   */
  size(): number {
    return this.cache.size;
  }

  /**
   * Clean up expired entries
   */
  async cleanup(): Promise<void> {
    const now = Date.now();
    const keysToDelete: string[] = [];

    for (const [key, entry] of this.cache.entries()) {
      if (entry.expiresAt && now > entry.expiresAt) {
        keysToDelete.push(key);
      }
    }

    for (const key of keysToDelete) {
      await this.delete(key);
    }
  }

  /**
   * Get or set a value with a factory function
   */
  async getOrSet<T>(
    key: string,
    factory: () => Promise<T>,
    options: CacheOptions = {}
  ): Promise<T> {
    const cached = await this.get<T>(key);
    
    if (cached !== null) {
      return cached;
    }

    const value = await factory();
    await this.set(key, value, options);
    return value;
  }

  /**
   * Set multiple values at once
   */
  async setMany<T>(entries: { key: string; value: T; options?: CacheOptions }[]): Promise<void> {
    await Promise.all(
      entries.map(({ key, value, options }) => this.set(key, value, options))
    );
  }

  /**
   * Get multiple values at once
   */
  async getMany<T>(keys: string[]): Promise<(T | null)[]> {
    return Promise.all(keys.map(key => this.get<T>(key)));
  }

  /**
   * Delete multiple values at once
   */
  async deleteMany(keys: string[]): Promise<void> {
    await Promise.all(keys.map(key => this.delete(key)));
  }

  /**
   * Get cache statistics
   */
  getStats() {
    const now = Date.now();
    let expired = 0;
    let active = 0;

    for (const entry of this.cache.values()) {
      if (entry.expiresAt && now > entry.expiresAt) {
        expired++;
      } else {
        active++;
      }
    }

    return {
      total: this.cache.size,
      active,
      expired,
    };
  }
}

// Export a singleton instance
export const memoryCache = new MemoryCache();

// Export the class for testing or custom instances
export { MemoryCache };
