
import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Platform,
  Alert,
  ActivityIndicator,
  Switch,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '@/contexts/AuthContext';
import { useThemeContext } from '@/contexts/ThemeContext';
import { supabase } from '@/lib/supabase';
import { IconSymbol } from '@/components/IconSymbol';
import { LoadingOverlay } from '@/components/ui/LoadingOverlay';
import { SwipeableModal } from '@/components/ui/SwipeableModal';
import { KeyboardAvoider } from '@/components/ui/KeyboardAvoider';
import { showErrorToast, showSuccessToast } from '@/utils/toast';
import { getPersonContinuity, setContinuityEnabled } from '@/lib/memory/personContinuity';
import { useFocusEffect } from '@react-navigation/native';

/**
 * CENTRALIZED DEBUG UI VISIBILITY GUARD
 * 
 * This constant controls whether the "Developer Debug Info" section is visible.
 * 
 * BEHAVIOR:
 * - Production builds (TestFlight/App Store): ALWAYS hidden (__DEV__ === false)
 * - Expo Go / Dev builds: HIDDEN by default, visible ONLY when explicitly enabled
 * 
 * TO ENABLE IN DEVELOPMENT:
 * Add to your .env file (dev only):
 *   EXPO_PUBLIC_SHOW_DEBUG_UI=true
 * 
 * SAFETY GUARANTEES:
 * 1. IS_PROD check ensures production builds NEVER show debug UI
 * 2. DEV_DEBUG_ENABLED requires explicit opt-in via environment variable
 * 3. SHOW_DEBUG_UI combines both checks for final decision
 * 4. Additional safety check inside the debug component itself (double safety)
 * 
 * DEFAULT BEHAVIOR:
 * - If EXPO_PUBLIC_SHOW_DEBUG_UI is not set → SHOW_DEBUG_UI = false (hidden)
 * - Only shows when developer explicitly sets EXPO_PUBLIC_SHOW_DEBUG_UI=true
 */
const IS_PROD = !__DEV__;
const DEV_DEBUG_ENABLED = __DEV__ && (process.env.EXPO_PUBLIC_SHOW_DEBUG_UI === 'true');
const SHOW_DEBUG_UI = !IS_PROD && DEV_DEBUG_ENABLED;

// Memory type from the person_memories table
interface Memory {
  id: string;
  user_id: string;
  person_id: string;
  category: string;
  key: string;
  value: string;
  importance: number | null;
  confidence: number | null;
  last_mentioned_at: string | null;
  created_at: string;
  updated_at: string;
}

// Grouped memories by group key
interface MemoryGroup {
  groupKey: string;
  memories: Memory[];
}

// Category icon mapping
const CATEGORY_ICONS: Record<string, { ios: string; android: string; emoji: string }> = {
  'health': { ios: 'heart.text.square.fill', android: 'medical_services', emoji: '🩺' },
  'family': { ios: 'person.3.fill', android: 'family_restroom', emoji: '👨‍👩‍👧' },
  'mental_health': { ios: 'brain.head.profile', android: 'psychology', emoji: '🧠' },
  'timeline': { ios: 'clock.fill', android: 'schedule', emoji: '⏳' },
  'relationships': { ios: 'heart.fill', android: 'favorite', emoji: '❤️' },
  'loss_grief': { ios: 'heart.slash.fill', android: 'heart_broken', emoji: '💔' },
  'identity': { ios: 'person.fill', android: 'person', emoji: '👤' },
  'preferences': { ios: 'star.fill', android: 'star', emoji: '⭐' },
  'boundaries': { ios: 'hand.raised.fill', android: 'back_hand', emoji: '✋' },
  'patterns': { ios: 'arrow.triangle.2.circlepath', android: 'sync', emoji: '🔄' },
  'goals': { ios: 'flag.fill', android: 'flag', emoji: '🎯' },
  'context': { ios: 'info.circle.fill', android: 'info', emoji: 'ℹ️' },
  'personal_details': { ios: 'person.text.rectangle.fill', android: 'badge', emoji: '📋' },
  'work_career': { ios: 'briefcase.fill', android: 'work', emoji: '💼' },
  'interests_hobbies': { ios: 'gamecontroller.fill', android: 'sports_esports', emoji: '🎮' },
  'communication': { ios: 'bubble.left.and.bubble.right.fill', android: 'chat', emoji: '💬' },
  'general': { ios: 'square.grid.2x2.fill', android: 'apps', emoji: '📦' },
  'history': { ios: 'book.fill', android: 'history', emoji: '📖' },
  'location': { ios: 'location.fill', android: 'location_on', emoji: '📍' },
  'friends': { ios: 'person.2.fill', android: 'group', emoji: '👥' },
};

// Get icon for category
function getCategoryIcon(category: string): { ios: string; android: string; emoji: string } {
  const normalizedCategory = category.toLowerCase().replace(/\s+/g, '_');
  return CATEGORY_ICONS[normalizedCategory] || { ios: 'square.fill', android: 'square', emoji: '📦' };
}

// Format category name for display
function formatCategoryName(category: string): string {
  return category
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

// Format date for display
function formatDate(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  
  if (diffDays === 0) {
    return 'Today';
  } else if (diffDays === 1) {
    return 'Yesterday';
  } else if (diffDays < 7) {
    return `${diffDays} days ago`;
  } else if (diffDays < 30) {
    const weeks = Math.floor(diffDays / 7);
    return `${weeks} ${weeks === 1 ? 'week' : 'weeks'} ago`;
  } else {
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  }
}

/**
 * Determine the group key for a memory using the pattern:
 * group_key || category || 'general'
 * 
 * In person_memories table, we don't have a group_key column,
 * so we use: key (if it looks like a group) || category || 'general'
 */
function getMemoryGroupKey(memory: Memory): string {
  // If key exists and contains a colon (e.g., "medical_history:cancer"),
  // extract the prefix as the group key
  if (memory.key && memory.key.includes(':')) {
    const prefix = memory.key.split(':')[0];
    if (prefix) {
      return prefix;
    }
  }
  
  // Otherwise, use category if available
  if (memory.category && memory.category.trim()) {
    return memory.category.trim();
  }
  
  // Default to 'general'
  return 'general';
}

/**
 * DEBUG CARD COMPONENT
 * 
 * This component renders the "Developer Debug Info" section.
 * 
 * DOUBLE SAFETY:
 * 1. This component is only rendered when SHOW_DEBUG_UI === true (first check)
 * 2. This component has an additional IS_PROD check (second check)
 * 
 * This ensures that even if the parent conditional is bypassed somehow,
 * the component itself will return null in production builds.
 */
function DebugCard({ 
  currentUser, 
  personId, 
  memories, 
  supabaseError, 
  theme 
}: { 
  currentUser: any; 
  personId: string; 
  memories: Memory[]; 
  supabaseError: any; 
  theme: any;
}) {
  // PRODUCTION SAFETY: Always return null in production builds
  if (IS_PROD) {
    return null;
  }

  // DEVELOPMENT ONLY: Render debug info
  return (
    <View style={[styles.debugContainer, { backgroundColor: theme.card, borderColor: theme.textSecondary + '40' }]}>
      <Text style={[styles.debugTitle, { color: theme.primary }]}>
        🔧 Developer Debug Info (DEV ONLY)
      </Text>
      <Text style={[styles.debugText, { color: theme.textSecondary }]}>
        User ID: {currentUser?.id || 'N/A'}
      </Text>
      <Text style={[styles.debugText, { color: theme.textSecondary }]}>
        Person ID: {personId || 'N/A'}
      </Text>
      <Text style={[styles.debugText, { color: theme.textSecondary }]}>
        Memory Count: {memories.length}
      </Text>
      {supabaseError && (
        <>
          <Text style={[styles.debugText, { color: '#FF3B30', fontWeight: '600', marginTop: 8 }]}>
            Supabase Error:
          </Text>
          <Text style={[styles.debugText, { color: '#FF3B30', fontSize: 11 }]}>
            {supabaseError.message || JSON.stringify(supabaseError)}
          </Text>
          {supabaseError.code && (
            <Text style={[styles.debugText, { color: '#FF3B30', fontSize: 11 }]}>
              Code: {supabaseError.code}
            </Text>
          )}
          {supabaseError.hint && (
            <Text style={[styles.debugText, { color: '#FF3B30', fontSize: 11 }]}>
              Hint: {supabaseError.hint}
            </Text>
          )}
        </>
      )}
    </View>
  );
}

export default function MemoriesScreen() {
  const params = useLocalSearchParams<{
    personId?: string | string[];
    personName?: string | string[];
  }>();

  const personId = Array.isArray(params.personId) ? params.personId[0] : params.personId || '';
  const personName = Array.isArray(params.personName) ? params.personName[0] : params.personName || 'Person';

  const insets = useSafeAreaInsets();
  const { currentUser } = useAuth();
  const { theme } = useThemeContext();

  const [memories, setMemories] = useState<Memory[]>([]);
  const [groupedMemories, setGroupedMemories] = useState<MemoryGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [supabaseError, setSupabaseError] = useState<any>(null);

  // Collapsible sections state
  const [collapsedSections, setCollapsedSections] = useState<Set<string>>(new Set());

  // Conversation Continuity toggle state
  const [continuityEnabled, setContinuityEnabledState] = useState(true);
  const [continuityLoading, setContinuityLoading] = useState(false);

  // Edit modal state
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editingMemory, setEditingMemory] = useState<Memory | null>(null);
  const [editValue, setEditValue] = useState('');
  const [saving, setSaving] = useState(false);

  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // ENHANCED: Validate personId is a valid UUID format
  useEffect(() => {
    if (SHOW_DEBUG_UI) {
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (personId && !uuidRegex.test(personId)) {
        console.error('[Memories] ⚠️  CRITICAL: personId is not a valid UUID!');
        console.error('[Memories]   - Received personId:', personId);
        console.error('[Memories]   - Expected format: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx');
      } else if (personId) {
        console.log('[Memories] ✅ personId is a valid UUID:', personId);
      }
    }
  }, [personId]);

  // Fetch continuity setting
  const fetchContinuitySetting = useCallback(async () => {
    if (!personId || !currentUser?.id) {
      return;
    }

    try {
      if (SHOW_DEBUG_UI) {
        console.log('[Memories] Fetching continuity setting for person:', personId);
      }
      const continuityData = await getPersonContinuity(currentUser.id, personId);
      
      if (isMountedRef.current) {
        setContinuityEnabledState(continuityData.continuity_enabled);
        if (SHOW_DEBUG_UI) {
          console.log('[Memories] Continuity enabled:', continuityData.continuity_enabled);
        }
      }
    } catch (err) {
      console.error('[Memories] Error fetching continuity setting:', err);
    }
  }, [personId, currentUser?.id]);

  // Handle continuity toggle change
  const handleContinuityToggle = useCallback(async (value: boolean) => {
    if (!personId || !currentUser?.id) {
      return;
    }

    if (SHOW_DEBUG_UI) {
      console.log('[Memories] Toggling continuity to:', value);
      console.log('[Memories] ⚠️  NOTE: This toggle ONLY affects saving NEW memories.');
      console.log('[Memories]    Existing memories will ALWAYS be displayed regardless of toggle state.');
    }
    setContinuityLoading(true);

    try {
      setContinuityEnabledState(value);
      await setContinuityEnabled(currentUser.id, personId, value);
      
      if (SHOW_DEBUG_UI) {
        console.log('[Memories] Continuity setting updated successfully');
      }
      showSuccessToast(
        value 
          ? 'Memory saving enabled' 
          : 'Memory saving paused'
      );
    } catch (err) {
      console.error('[Memories] Error updating continuity setting:', err);
      setContinuityEnabledState(!value);
      showErrorToast('Failed to update setting');
    } finally {
      if (isMountedRef.current) {
        setContinuityLoading(false);
      }
    }
  }, [personId, currentUser?.id]);

  /**
   * Group memories by their group key (key prefix || category || 'general')
   * and sort within each group by date
   */
  const groupMemoriesByKey = useCallback((memoriesData: Memory[]): MemoryGroup[] => {
    const groupMap = new Map<string, Memory[]>();
    
    memoriesData.forEach((memory) => {
      const groupKey = getMemoryGroupKey(memory);
      if (!groupMap.has(groupKey)) {
        groupMap.set(groupKey, []);
      }
      groupMap.get(groupKey)!.push(memory);
    });
    
    // Convert to array and sort memories within each group by date (newest first)
    const grouped = Array.from(groupMap.entries()).map(([groupKey, memories]) => ({
      groupKey,
      memories: memories.sort((a, b) => {
        // Sort by updated_at first (if available), then created_at
        const aDate = a.updated_at ? new Date(a.updated_at).getTime() : new Date(a.created_at).getTime();
        const bDate = b.updated_at ? new Date(b.updated_at).getTime() : new Date(b.created_at).getTime();
        return bDate - aDate; // Descending order (newest first)
      }),
    }));
    
    // Sort groups alphabetically, but keep 'general' last
    grouped.sort((a, b) => {
      if (a.groupKey === 'general') return 1;
      if (b.groupKey === 'general') return -1;
      return a.groupKey.localeCompare(b.groupKey);
    });
    
    return grouped;
  }, []);

  /**
   * CRITICAL: Fetch memories from Supabase
   * 
   * This query INTENTIONALLY does NOT filter by continuity_enabled.
   * The continuity toggle ONLY affects saving NEW memories, not displaying existing ones.
   * ALL existing memories are ALWAYS displayed regardless of toggle state.
   * 
   * Query pattern:
   * - Filter by user_id and person_id (BOTH ARE UUIDs)
   * - Order by updated_at DESC NULLS LAST, then created_at DESC NULLS LAST
   * - NO FILTER on continuity_enabled (this is stored in person_chat_summaries, not person_memories)
   */
  const fetchMemories = useCallback(async (isRefresh = false) => {
    if (!personId || !currentUser?.id) {
      if (SHOW_DEBUG_UI) {
        console.warn('[Memories] ⚠️  Missing personId or userId');
        console.warn('[Memories]   - personId:', personId || 'MISSING');
        console.warn('[Memories]   - userId:', currentUser?.id || 'MISSING');
      }
      if (isMountedRef.current) {
        setLoading(false);
        setError('Invalid parameters');
      }
      return;
    }

    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      
      setError(null);
      setSupabaseError(null);
      
      if (SHOW_DEBUG_UI) {
        console.log('');
        console.log('═══════════════════════════════════════════════════════');
        console.log('[Memories] 📖 LOADING MEMORIES');
        console.log('═══════════════════════════════════════════════════════');
        console.log('[Memories] User ID:', currentUser.id);
        console.log('[Memories] Person ID:', personId);
        console.log('[Memories] Person Name:', personName);
        console.log('[Memories] Continuity Enabled:', continuityEnabled);
        console.log('[Memories] ⚠️  IMPORTANT: Query does NOT filter by continuity_enabled');
        console.log('[Memories]    ALL memories are fetched regardless of toggle state');
        console.log('[Memories] Query filters:');
        console.log('[Memories]   - user_id =', currentUser.id);
        console.log('[Memories]   - person_id =', personId);
        console.log('[Memories]   - table = person_memories');
        console.log('[Memories]   - order = updated_at DESC NULLS LAST, created_at DESC NULLS LAST');
        console.log('───────────────────────────────────────────────────────');
      }

      // CRITICAL: This query does NOT filter by continuity_enabled
      // The continuity toggle ONLY affects saving NEW memories
      // ALL existing memories are ALWAYS displayed
      const { data, error: fetchError } = await supabase
        .from('person_memories')
        .select('*')
        .eq('user_id', currentUser.id)
        .eq('person_id', personId)
        .order('updated_at', { ascending: false, nullsFirst: false })
        .order('created_at', { ascending: false, nullsFirst: false });

      if (SHOW_DEBUG_UI) {
        console.log('[Memories] Query executed');
        console.log('[Memories] Response:');
        console.log('[Memories]   - Error:', fetchError ? fetchError.message : 'None');
        console.log('[Memories]   - Row count:', data?.length ?? 0);
      }

      if (fetchError) {
        console.error('[Memories] ❌ Error fetching memories:', {
          message: fetchError.message,
          code: fetchError.code,
          details: fetchError.details,
          hint: fetchError.hint,
        });
        if (isMountedRef.current) {
          setError('Failed to load memories');
          setSupabaseError(fetchError);
        }
        if (SHOW_DEBUG_UI) {
          console.log('═══════════════════════════════════════════════════════');
        }
        return;
      }

      if (SHOW_DEBUG_UI) {
        console.log('[Memories] ✅ Loaded', data?.length || 0, 'memories');
        
        if (data && data.length > 0) {
          console.log('[Memories] Sample memories:');
          data.slice(0, 3).forEach((mem, idx) => {
            const groupKey = getMemoryGroupKey(mem);
            console.log(`[Memories]   ${idx + 1}. [${groupKey}] ${mem.value}`);
            console.log(`[Memories]      person_id: ${mem.person_id}`);
          });
        } else {
          console.log('[Memories] ⚠️  No memories found for this person');
          console.log('[Memories]   - This could mean:');
          console.log('[Memories]     1. No memories have been saved yet');
          console.log('[Memories]     2. The person_id does not match any records');
          console.log('[Memories]     3. RLS policies are blocking access');
          console.log('[Memories]   - NOTE: The continuity toggle does NOT affect this query');
        }
      }
      
      if (isMountedRef.current && data !== null) {
        setMemories(data);
        const grouped = groupMemoriesByKey(data);
        setGroupedMemories(grouped);
        if (SHOW_DEBUG_UI) {
          console.log('[Memories] Grouped into', grouped.length, 'groups');
          grouped.forEach((group) => {
            console.log(`[Memories]   - ${group.groupKey}: ${group.memories.length} memories`);
          });
        }
      }
      
      if (SHOW_DEBUG_UI) {
        console.log('═══════════════════════════════════════════════════════');
        console.log('');
      }
    } catch (err: any) {
      console.error('[Memories] ❌ Unexpected error:', {
        message: err?.message || 'unknown',
        name: err?.name || 'unknown',
        stack: err?.stack?.substring(0, 200),
      });
      if (isMountedRef.current) {
        setError('An unexpected error occurred');
        setSupabaseError(err);
      }
      if (SHOW_DEBUG_UI) {
        console.log('═══════════════════════════════════════════════════════');
      }
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
        setRefreshing(false);
      }
    }
  }, [personId, personName, currentUser?.id, continuityEnabled, groupMemoriesByKey]);

  // Fetch on mount
  useEffect(() => {
    fetchMemories(false);
    fetchContinuitySetting();
  }, [fetchMemories, fetchContinuitySetting]);

  // Refetch when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      if (SHOW_DEBUG_UI) {
        console.log('[Memories] Screen focused, refreshing memories');
      }
      fetchMemories(true);
    }, [fetchMemories])
  );

  // Handle back press
  const handleBackPress = useCallback(() => {
    try {
      if (router.canGoBack()) {
        router.back();
      } else {
        router.replace('/(tabs)/(home)');
      }
    } catch (error) {
      console.error('[Memories] Back navigation error:', error);
      router.replace('/(tabs)/(home)');
    }
  }, []);

  // Toggle section collapse
  const toggleSection = useCallback((groupKey: string) => {
    setCollapsedSections((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(groupKey)) {
        newSet.delete(groupKey);
      } else {
        newSet.add(groupKey);
      }
      return newSet;
    });
  }, []);

  // Open edit modal
  const handleEditPress = useCallback((memory: Memory) => {
    if (SHOW_DEBUG_UI) {
      console.log('[Memories] Opening edit modal for:', memory.id);
    }
    setEditingMemory(memory);
    setEditValue(memory.value);
    setEditModalVisible(true);
  }, []);

  // Close edit modal
  const handleCloseEditModal = useCallback(() => {
    setEditModalVisible(false);
    setEditingMemory(null);
    setEditValue('');
  }, []);

  // Save edited memory
  const handleSaveEdit = useCallback(async () => {
    if (!editingMemory || !currentUser?.id) {
      return;
    }

    const newValue = editValue.trim();
    if (!newValue) {
      showErrorToast('Value cannot be empty');
      return;
    }

    if (newValue === editingMemory.value) {
      handleCloseEditModal();
      return;
    }

    if (SHOW_DEBUG_UI) {
      console.log('[Memories] Saving edit for:', editingMemory.id);
    }
    setSaving(true);

    try {
      const { error: updateError } = await supabase
        .from('person_memories')
        .update({
          value: newValue,
          updated_at: new Date().toISOString(),
        })
        .eq('id', editingMemory.id)
        .eq('user_id', currentUser.id);

      if (updateError) {
        console.error('[Memories] Error updating memory:', updateError);
        showErrorToast('Failed to update memory');
        return;
      }

      showSuccessToast('Memory updated');
      handleCloseEditModal();
      fetchMemories(true);
    } catch (err: any) {
      console.error('[Memories] Unexpected error saving edit:', err);
      showErrorToast('An unexpected error occurred');
    } finally {
      setSaving(false);
    }
  }, [editingMemory, editValue, currentUser?.id, handleCloseEditModal, fetchMemories]);

  // Delete memory
  const handleDeletePress = useCallback((memory: Memory) => {
    if (!currentUser?.id) {
      return;
    }

    Alert.alert(
      'Delete Memory',
      `Are you sure you want to delete this memory?`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            if (SHOW_DEBUG_UI) {
              console.log('[Memories] Deleting memory:', memory.id);
            }

            try {
              const { error: deleteError } = await supabase
                .from('person_memories')
                .delete()
                .eq('id', memory.id)
                .eq('user_id', currentUser.id);

              if (deleteError) {
                console.error('[Memories] Error deleting memory:', deleteError);
                showErrorToast('Failed to delete memory');
                return;
              }

              showSuccessToast('Memory deleted');
              fetchMemories(true);
            } catch (err: any) {
              console.error('[Memories] Unexpected error deleting:', err);
              showErrorToast('An unexpected error occurred');
            }
          },
        },
      ]
    );
  }, [currentUser?.id, fetchMemories]);

  // Retry loading on error
  const handleRetry = useCallback(() => {
    setError(null);
    setSupabaseError(null);
    fetchMemories(false);
  }, [fetchMemories]);

  return (
    <KeyboardAvoider>
      <View style={[styles.container, { backgroundColor: theme.background }]}>
        {/* Status Bar Gradient */}
        <LinearGradient
          colors={theme.primaryGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
          style={[styles.statusBarGradient, { height: insets.top }]}
          pointerEvents="none"
        />

        {/* Header with Gradient Background */}
        <LinearGradient
          colors={theme.primaryGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
          style={[styles.headerGradient, { paddingTop: insets.top }]}
        >
          <View style={styles.header}>
            <TouchableOpacity 
              onPress={handleBackPress} 
              style={styles.backButton}
              activeOpacity={0.7}
            >
              <IconSymbol
                ios_icon_name="chevron.left"
                android_material_icon_name="arrow_back"
                size={24}
                color="#FFFFFF"
              />
            </TouchableOpacity>
            <View style={styles.headerCenter}>
              <Text style={styles.headerTitle} numberOfLines={1}>
                Memories
              </Text>
              <Text style={styles.headerSubtitle} numberOfLines={1}>
                {personName}
              </Text>
            </View>
            <View style={{ width: 40 }} />
          </View>
        </LinearGradient>

        {error && (
          <View style={[styles.errorBanner, { backgroundColor: '#FF3B30' }]}>
            <IconSymbol
              ios_icon_name="exclamationmark.triangle.fill"
              android_material_icon_name="error"
              size={16}
              color="#FFFFFF"
              style={styles.bannerIcon}
            />
            <Text style={styles.errorBannerText}>{error}</Text>
            <TouchableOpacity onPress={handleRetry} style={styles.retryButton} activeOpacity={0.7}>
              <Text style={styles.retryButtonText}>Retry</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setError(null)} style={styles.dismissButton} activeOpacity={0.7}>
              <IconSymbol
                ios_icon_name="xmark"
                android_material_icon_name="close"
                size={16}
                color="#FFFFFF"
              />
            </TouchableOpacity>
          </View>
        )}

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={[
            styles.scrollContent,
            { paddingBottom: insets.bottom + 100 }
          ]}
          showsVerticalScrollIndicator={false}
        >
          {/* Conversation Continuity Toggle Section */}
          <View style={[
            styles.continuitySection,
            {
              backgroundColor: theme.card,
              ...Platform.select({
                ios: {
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 1 },
                  shadowOpacity: 0.05,
                  shadowRadius: 4,
                },
                android: {
                  elevation: 2,
                },
                web: {
                  boxShadow: '0px 1px 4px rgba(0, 0, 0, 0.05)',
                },
              }),
            }
          ]}>
            <View style={styles.continuityHeader}>
              <View style={styles.continuityTitleRow}>
                <IconSymbol
                  ios_icon_name="arrow.triangle.2.circlepath"
                  android_material_icon_name="sync"
                  size={20}
                  color={theme.primary}
                  style={styles.continuityIcon}
                />
                <Text style={[styles.continuityTitle, { color: theme.textPrimary }]}>
                  Save new memories
                </Text>
              </View>
              <Switch
                value={continuityEnabled}
                onValueChange={handleContinuityToggle}
                disabled={continuityLoading}
                trackColor={{ 
                  false: theme.textSecondary + '40', 
                  true: theme.primary + '80' 
                }}
                thumbColor={continuityEnabled ? theme.primary : '#f4f3f4'}
                ios_backgroundColor={theme.textSecondary + '40'}
              />
            </View>
            <Text style={[styles.continuityDescription, { color: theme.textSecondary }]}>
              {continuityEnabled 
                ? 'The AI will save important details from your conversations as memories.'
                : 'Memory saving is paused. Your existing memories below remain visible and can be edited.'}
            </Text>
          </View>

          {/* Loading State */}
          {loading && memories.length === 0 && !error && (
            <View style={styles.loadingState}>
              <ActivityIndicator size="large" color={theme.primary} />
              <Text style={[styles.loadingText, { color: theme.textSecondary }]}>
                Loading memories...
              </Text>
            </View>
          )}

          {/* Empty State */}
          {!loading && !refreshing && memories.length === 0 && !error && (
            <View style={styles.emptyState}>
              <View style={[styles.emptyIconContainer, { backgroundColor: theme.card }]}>
                <Text style={styles.emptyEmoji}>🧠</Text>
              </View>
              <Text style={[styles.emptyTitle, { color: theme.textPrimary }]}>
                No memories saved yet
              </Text>
              <Text style={[styles.emptySubtext, { color: theme.textSecondary }]}>
                {continuityEnabled 
                  ? 'As you chat, the AI will save important details here.'
                  : 'Memory saving is currently paused. Turn it on to start saving new memories.'}
              </Text>
              
              {/* 
                DEVELOPER DEBUG INFO SECTION
                
                This section is ONLY rendered when SHOW_DEBUG_UI === true.
                
                VISIBILITY LOGIC:
                - Production builds (TestFlight/App Store): ALWAYS hidden (IS_PROD === true)
                - Expo Go / Dev builds: HIDDEN by default
                - Only visible when EXPO_PUBLIC_SHOW_DEBUG_UI=true is explicitly set
                
                SAFETY GUARANTEES:
                1. Entire block wrapped in SHOW_DEBUG_UI conditional (first check)
                2. DebugCard component has IS_PROD check (second check)
                3. No debug components imported unconditionally
                4. No debug container exists outside the conditional
                5. No leftover spacing or margins when hidden
                
                TO ENABLE IN DEVELOPMENT:
                Add to .env file:
                  EXPO_PUBLIC_SHOW_DEBUG_UI=true
                
                This ensures user_id and person_id are NEVER exposed in production.
              */}
              {SHOW_DEBUG_UI && (
                <DebugCard
                  currentUser={currentUser}
                  personId={personId}
                  memories={memories}
                  supabaseError={supabaseError}
                  theme={theme}
                />
              )}
            </View>
          )}

          {/* Memory Groups */}
          {memories.length > 0 && (
            <>
              {groupedMemories.map((memoryGroup) => {
                const icon = getCategoryIcon(memoryGroup.groupKey);
                const isCollapsed = collapsedSections.has(memoryGroup.groupKey);
                const displayName = formatCategoryName(memoryGroup.groupKey);
                
                return (
                  <View key={memoryGroup.groupKey} style={styles.categorySection}>
                    {/* Group Header - Collapsible */}
                    <TouchableOpacity
                      style={styles.categoryHeaderButton}
                      onPress={() => toggleSection(memoryGroup.groupKey)}
                      activeOpacity={0.7}
                    >
                      <View style={styles.categoryHeaderLeft}>
                        <Text style={styles.categoryEmoji}>{icon.emoji}</Text>
                        <Text style={[styles.categoryTitle, { color: theme.textPrimary }]}>
                          {displayName}
                        </Text>
                        <View style={[styles.countBadge, { backgroundColor: theme.primary + '20' }]}>
                          <Text style={[styles.countText, { color: theme.primary }]}>
                            {memoryGroup.memories.length}
                          </Text>
                        </View>
                      </View>
                      <IconSymbol
                        ios_icon_name={isCollapsed ? 'chevron.down' : 'chevron.up'}
                        android_material_icon_name={isCollapsed ? 'expand_more' : 'expand_less'}
                        size={20}
                        color={theme.textSecondary}
                      />
                    </TouchableOpacity>

                    {/* Memory Items */}
                    {!isCollapsed && (
                      <View style={styles.memoriesContainer}>
                        {memoryGroup.memories.map((memory) => (
                          <View
                            key={memory.id}
                            style={[
                              styles.memoryChip,
                              { 
                                backgroundColor: theme.card,
                                borderColor: theme.primary + '20',
                                ...Platform.select({
                                  ios: {
                                    shadowColor: '#000',
                                    shadowOffset: { width: 0, height: 1 },
                                    shadowOpacity: 0.06,
                                    shadowRadius: 3,
                                  },
                                  android: {
                                    elevation: 2,
                                  },
                                  web: {
                                    boxShadow: '0px 1px 3px rgba(0, 0, 0, 0.06)',
                                  },
                                }),
                              }
                            ]}
                          >
                            <View style={styles.memoryChipContent}>
                              {/* Left: Icon Badge */}
                              <View style={[styles.memoryIconBadge, { backgroundColor: theme.primary + '15' }]}>
                                <IconSymbol
                                  ios_icon_name={icon.ios}
                                  android_material_icon_name={icon.android}
                                  size={16}
                                  color={theme.primary}
                                />
                              </View>

                              {/* Center: Content & Date */}
                              <View style={styles.memoryTextContainer}>
                                <Text style={[styles.memoryContent, { color: theme.textPrimary }]} numberOfLines={3}>
                                  {memory.value}
                                </Text>
                                <Text style={[styles.memoryDate, { color: theme.textSecondary }]}>
                                  {formatDate(memory.updated_at || memory.created_at)}
                                </Text>
                              </View>

                              {/* Right: Actions */}
                              <View style={styles.memoryActions}>
                                <TouchableOpacity
                                  onPress={() => handleEditPress(memory)}
                                  style={styles.actionButton}
                                  activeOpacity={0.7}
                                >
                                  <IconSymbol
                                    ios_icon_name="pencil"
                                    android_material_icon_name="edit"
                                    size={18}
                                    color={theme.primary}
                                  />
                                </TouchableOpacity>
                                <TouchableOpacity
                                  onPress={() => handleDeletePress(memory)}
                                  style={styles.actionButton}
                                  activeOpacity={0.7}
                                >
                                  <IconSymbol
                                    ios_icon_name="trash"
                                    android_material_icon_name="delete"
                                    size={18}
                                    color="#FF3B30"
                                  />
                                </TouchableOpacity>
                              </View>
                            </View>
                          </View>
                        ))}
                      </View>
                    )}
                  </View>
                );
              })}
            </>
          )}
        </ScrollView>

        {/* Edit Modal */}
        <SwipeableModal
          visible={editModalVisible}
          onClose={handleCloseEditModal}
          animationType="slide"
          showHandle={true}
        >
          <KeyboardAvoider>
            <View style={styles.modalContent}>
              <Text style={[styles.modalTitle, { color: theme.textPrimary }]}>
                Edit Memory
              </Text>

              <View style={styles.modalInputContainer}>
                <TextInput
                  style={[
                    styles.modalInput,
                    {
                      backgroundColor: theme.background,
                      color: theme.textPrimary,
                      borderColor: theme.textSecondary + '40',
                    },
                  ]}
                  placeholder="Enter memory content..."
                  placeholderTextColor={theme.textSecondary}
                  value={editValue}
                  onChangeText={setEditValue}
                  multiline
                  numberOfLines={4}
                  textAlignVertical="top"
                  editable={!saving}
                  autoFocus={true}
                />
              </View>

              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={[styles.modalButton, { backgroundColor: theme.background }]}
                  onPress={handleCloseEditModal}
                  disabled={saving}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.modalButtonText, { color: theme.textPrimary }]}>
                    Cancel
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.modalButton, { backgroundColor: theme.primary }]}
                  onPress={handleSaveEdit}
                  disabled={saving || !editValue.trim()}
                  activeOpacity={0.7}
                >
                  {saving ? (
                    <ActivityIndicator color="#FFFFFF" />
                  ) : (
                    <Text style={[styles.modalButtonText, { color: '#FFFFFF' }]}>
                      Save
                    </Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </KeyboardAvoider>
        </SwipeableModal>
      </View>

      <LoadingOverlay visible={loading && !error && memories.length === 0} />
    </KeyboardAvoider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  statusBarGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
  },
  headerGradient: {
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: '5%',
    paddingVertical: 12,
    paddingBottom: 20,
  },
  backButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },
  headerSubtitle: {
    fontSize: 15,
    fontWeight: '500',
    color: 'rgba(255, 255, 255, 0.95)',
    marginTop: 4,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  bannerIcon: {
    marginRight: 8,
  },
  errorBannerText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 18,
    color: '#FFFFFF',
  },
  retryButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 12,
    marginRight: 8,
  },
  retryButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  dismissButton: {
    padding: 4,
    marginLeft: 8,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: '5%',
    paddingTop: 20,
  },
  continuitySection: {
    borderRadius: 12,
    padding: 14,
    marginBottom: 20,
  },
  continuityHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  continuityTitleRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 12,
  },
  continuityIcon: {
    marginRight: 8,
  },
  continuityTitle: {
    fontSize: 15,
    fontWeight: '600',
    letterSpacing: 0.1,
    flex: 1,
  },
  continuityDescription: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '400',
    marginTop: 4,
  },
  loadingState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
  },
  loadingText: {
    fontSize: 15,
    fontWeight: '500',
    marginTop: 16,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
    paddingHorizontal: '10%',
  },
  emptyIconContainer: {
    width: 96,
    height: 96,
    borderRadius: 48,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
      },
      android: {
        elevation: 4,
      },
      web: {
        boxShadow: '0px 4px 12px rgba(0, 0, 0, 0.1)',
      },
    }),
  },
  emptyEmoji: {
    fontSize: 48,
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 12,
    textAlign: 'center',
    letterSpacing: 0.2,
  },
  emptySubtext: {
    fontSize: 15,
    fontWeight: '500',
    textAlign: 'center',
    lineHeight: 22,
  },
  debugContainer: {
    marginTop: 24,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    width: '100%',
    maxWidth: 400,
  },
  debugTitle: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 12,
    textAlign: 'center',
  },
  debugText: {
    fontSize: 12,
    fontFamily: Platform.select({ ios: 'Courier', android: 'monospace', default: 'monospace' }),
    marginBottom: 4,
    lineHeight: 18,
  },
  categorySection: {
    marginBottom: 24,
  },
  categoryHeaderButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 4,
  },
  categoryHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  categoryEmoji: {
    fontSize: 24,
    marginRight: 10,
  },
  categoryTitle: {
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: 0.2,
    marginRight: 8,
  },
  countBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    minWidth: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  countText: {
    fontSize: 12,
    fontWeight: '700',
  },
  memoriesContainer: {
    gap: 10,
  },
  memoryChip: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
  },
  memoryChipContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  memoryIconBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  memoryTextContainer: {
    flex: 1,
    marginRight: 8,
  },
  memoryContent: {
    fontSize: 15,
    lineHeight: 20,
    fontWeight: '500',
    marginBottom: 6,
  },
  memoryDate: {
    fontSize: 12,
    fontWeight: '400',
  },
  memoryActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    padding: 4,
  },
  modalContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 24,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  modalInputContainer: {
    marginBottom: 20,
  },
  modalInput: {
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    minHeight: 100,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});
