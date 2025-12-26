
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

// Memory type from the memories table
interface Memory {
  id: string;
  user_id: string;
  person_id: string;
  category: string;
  content: string;
  source_message: string | null;
  confidence: number | null;
  memory_key: string | null;
  created_at: string;
}

// Grouped memories by category
interface MemoryCategory {
  category: string;
  memories: Memory[];
}

// Category icon mapping
const CATEGORY_ICONS: Record<string, { ios: string; android: string; emoji: string }> = {
  'Health': { ios: 'heart.text.square.fill', android: 'medical_services', emoji: '🩺' },
  'Family': { ios: 'person.3.fill', android: 'family_restroom', emoji: '👨‍👩‍👧' },
  'Mental Health': { ios: 'brain.head.profile', android: 'psychology', emoji: '🧠' },
  'Timeline': { ios: 'clock.fill', android: 'schedule', emoji: '⏳' },
  'Relationships': { ios: 'heart.fill', android: 'favorite', emoji: '❤️' },
  'Loss & Grief': { ios: 'heart.slash.fill', android: 'heart_broken', emoji: '💔' },
  'Identity': { ios: 'person.fill', android: 'person', emoji: '👤' },
  'Preferences': { ios: 'star.fill', android: 'star', emoji: '⭐' },
  'Boundaries': { ios: 'hand.raised.fill', android: 'back_hand', emoji: '✋' },
  'Patterns': { ios: 'arrow.triangle.2.circlepath', android: 'sync', emoji: '🔄' },
  'Goals': { ios: 'flag.fill', android: 'flag', emoji: '🎯' },
  'Context': { ios: 'info.circle.fill', android: 'info', emoji: 'ℹ️' },
  'Personal Details': { ios: 'person.text.rectangle.fill', android: 'badge', emoji: '📋' },
  'Work & Career': { ios: 'briefcase.fill', android: 'work', emoji: '💼' },
  'Interests & Hobbies': { ios: 'gamecontroller.fill', android: 'sports_esports', emoji: '🎮' },
  'Communication': { ios: 'bubble.left.and.bubble.right.fill', android: 'chat', emoji: '💬' },
  'General': { ios: 'square.grid.2x2.fill', android: 'apps', emoji: '📦' },
  'History': { ios: 'book.fill', android: 'history', emoji: '📖' },
  'Location': { ios: 'location.fill', android: 'location_on', emoji: '📍' },
  'Friends': { ios: 'person.2.fill', android: 'group', emoji: '👥' },
};

// Get icon for category
function getCategoryIcon(category: string): { ios: string; android: string; emoji: string } {
  return CATEGORY_ICONS[category] || { ios: 'square.fill', android: 'square', emoji: '📦' };
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
  const [groupedMemories, setGroupedMemories] = useState<MemoryCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

  // Fetch continuity setting
  const fetchContinuitySetting = useCallback(async () => {
    if (!personId || !currentUser?.id) {
      return;
    }

    try {
      console.log('[Memories] Fetching continuity setting for person:', personId);
      const continuityData = await getPersonContinuity(currentUser.id, personId);
      
      if (isMountedRef.current) {
        setContinuityEnabledState(continuityData.continuity_enabled);
        console.log('[Memories] Continuity enabled:', continuityData.continuity_enabled);
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

    console.log('[Memories] Toggling continuity to:', value);
    setContinuityLoading(true);

    try {
      setContinuityEnabledState(value);
      await setContinuityEnabled(currentUser.id, personId, value);
      
      console.log('[Memories] Continuity setting updated successfully');
      showSuccessToast(
        value 
          ? 'Conversation continuity enabled' 
          : 'Conversation continuity disabled'
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

  // Group memories by category
  const groupMemoriesByCategory = useCallback((memoriesData: Memory[]): MemoryCategory[] => {
    const categoryMap = new Map<string, Memory[]>();
    
    memoriesData.forEach((memory) => {
      const category = memory.category || 'General';
      if (!categoryMap.has(category)) {
        categoryMap.set(category, []);
      }
      categoryMap.get(category)!.push(memory);
    });
    
    // Convert to array and sort by category name
    const grouped = Array.from(categoryMap.entries()).map(([category, memories]) => ({
      category,
      memories: memories.sort((a, b) => 
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      ),
    }));
    
    // Sort categories alphabetically, but keep General first
    grouped.sort((a, b) => {
      if (a.category === 'General') return -1;
      if (b.category === 'General') return 1;
      return a.category.localeCompare(b.category);
    });
    
    return grouped;
  }, []);

  // Fetch memories
  const fetchMemories = useCallback(async (isRefresh = false) => {
    if (!personId || !currentUser?.id) {
      console.warn('[Memories] Missing personId or userId');
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
      console.log('[Memories] Fetching memories for person:', personId, 'user:', currentUser.id);

      const { data, error: fetchError } = await supabase
        .from('memories')
        .select('*')
        .eq('user_id', currentUser.id)
        .eq('person_id', personId)
        .order('created_at', { ascending: false });

      if (fetchError) {
        console.log('[Memories] Error fetching memories:', {
          message: fetchError.message,
          code: fetchError.code,
        });
        if (isMountedRef.current) {
          setError('Failed to load memories');
        }
        return;
      }

      console.log('[Memories] Loaded memories:', data?.length || 0);
      
      if (isMountedRef.current && data !== null) {
        setMemories(data);
        const grouped = groupMemoriesByCategory(data);
        setGroupedMemories(grouped);
        console.log('[Memories] Grouped into', grouped.length, 'categories');
      }
    } catch (err: any) {
      console.log('[Memories] Unexpected error:', err);
      if (isMountedRef.current) {
        setError('An unexpected error occurred');
      }
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
        setRefreshing(false);
      }
    }
  }, [personId, currentUser?.id, groupMemoriesByCategory]);

  // Fetch on mount
  useEffect(() => {
    fetchMemories(false);
    fetchContinuitySetting();
  }, [fetchMemories, fetchContinuitySetting]);

  // Refetch when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      console.log('[Memories] Screen focused, refreshing memories');
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
  const toggleSection = useCallback((category: string) => {
    setCollapsedSections((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(category)) {
        newSet.delete(category);
      } else {
        newSet.add(category);
      }
      return newSet;
    });
  }, []);

  // Open edit modal
  const handleEditPress = useCallback((memory: Memory) => {
    console.log('[Memories] Opening edit modal for:', memory.id);
    setEditingMemory(memory);
    setEditValue(memory.content);
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

    if (newValue === editingMemory.content) {
      handleCloseEditModal();
      return;
    }

    console.log('[Memories] Saving edit for:', editingMemory.id);
    setSaving(true);

    try {
      const { error: updateError } = await supabase
        .from('memories')
        .update({
          content: newValue,
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
            console.log('[Memories] Deleting memory:', memory.id);

            try {
              const { error: deleteError } = await supabase
                .from('memories')
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
                  Continue conversations
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
          </View>

          {memories.length === 0 && !loading && !refreshing ? (
            <View style={styles.emptyState}>
              <View style={[styles.emptyIconContainer, { backgroundColor: theme.card }]}>
                <Text style={styles.emptyEmoji}>🧠</Text>
              </View>
              <Text style={[styles.emptyTitle, { color: theme.textPrimary }]}>
                No memories saved yet
              </Text>
              <Text style={[styles.emptySubtext, { color: theme.textSecondary }]}>
                As you chat, the AI will save important details here.
              </Text>
            </View>
          ) : (
            <>
              {groupedMemories.map((categoryGroup) => {
                const icon = getCategoryIcon(categoryGroup.category);
                const isCollapsed = collapsedSections.has(categoryGroup.category);
                
                return (
                  <View key={categoryGroup.category} style={styles.categorySection}>
                    {/* Category Header - Collapsible */}
                    <TouchableOpacity
                      style={styles.categoryHeaderButton}
                      onPress={() => toggleSection(categoryGroup.category)}
                      activeOpacity={0.7}
                    >
                      <View style={styles.categoryHeaderLeft}>
                        <Text style={styles.categoryEmoji}>{icon.emoji}</Text>
                        <Text style={[styles.categoryTitle, { color: theme.textPrimary }]}>
                          {categoryGroup.category}
                        </Text>
                        <View style={[styles.countBadge, { backgroundColor: theme.primary + '20' }]}>
                          <Text style={[styles.countText, { color: theme.primary }]}>
                            {categoryGroup.memories.length}
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
                        {categoryGroup.memories.map((memory) => (
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
                                  {memory.content}
                                </Text>
                                <Text style={[styles.memoryDate, { color: theme.textSecondary }]}>
                                  {formatDate(memory.created_at)}
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
