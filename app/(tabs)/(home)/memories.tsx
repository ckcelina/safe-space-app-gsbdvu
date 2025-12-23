
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

interface PersonMemory {
  id: string;
  user_id: string;
  person_id: string;
  category: string;
  key: string;
  value: string;
  importance: number;
  confidence: number;
  last_mentioned_at: string | null;
  created_at: string;
  updated_at: string;
}

// Category labels mapping
const CATEGORY_LABELS: Record<string, string> = {
  loss_grief: 'Loss & Grief',
  identity: 'Identity',
  relationship: 'Relationship',
  preferences: 'Preferences',
  boundaries: 'Boundaries',
  conflict_patterns: 'Patterns',
  goals: 'Goals',
  context: 'Context',
  personal: 'Personal Details',
  health: 'Health & Wellness',
  work: 'Work & Career',
  interests: 'Interests & Hobbies',
  communication: 'Communication',
  general: 'General',
};

// Friendly labels for memory keys
const FRIENDLY_KEY_LABELS: Record<string, string> = {
  // Loss & Grief
  is_deceased: 'Deceased',
  time_of_death: 'Time since passing',
  cause_of_death: 'Cause of passing',
  grief_stage: 'Grief stage',
  memorial_preferences: 'Memorial preferences',
  
  // Personal details
  age: 'Age',
  birthday: 'Birthday',
  occupation: 'Occupation',
  location: 'Location',
  hometown: 'Hometown',
  full_name: 'Full name',
  nickname: 'Nickname',
  
  // Relationships
  relationship_type: 'Relationship',
  relationship_status: 'Relationship status',
  family_members: 'Family members',
  children: 'Children',
  pets: 'Pets',
  significant_other: 'Significant other',
  
  // Interests & Hobbies
  hobbies: 'Hobbies',
  interests: 'Interests',
  favorite_music: 'Favorite music',
  favorite_movies: 'Favorite movies',
  favorite_books: 'Favorite books',
  favorite_food: 'Favorite food',
  favorite_color: 'Favorite color',
  sports: 'Sports',
  
  // Health & Wellness
  health_conditions: 'Health conditions',
  medications: 'Medications',
  allergies: 'Allergies',
  mental_health: 'Mental health',
  dietary_restrictions: 'Dietary restrictions',
  
  // Work & Education
  education: 'Education',
  career_goals: 'Career goals',
  work_challenges: 'Work challenges',
  current_job: 'Current job',
  dream_job: 'Dream job',
  
  // Personality & Traits
  personality_traits: 'Personality traits',
  values: 'Values',
  fears: 'Fears',
  goals: 'Goals',
  dreams: 'Dreams',
  strengths: 'Strengths',
  weaknesses: 'Weaknesses',
  
  // Communication
  communication_style: 'Communication style',
  love_language: 'Love language',
  conflict_style: 'Conflict style',
  preferred_contact: 'Preferred contact method',
  
  // Boundaries
  personal_boundaries: 'Personal boundaries',
  emotional_boundaries: 'Emotional boundaries',
  time_boundaries: 'Time boundaries',
  
  // Preferences
  preferences: 'Preferences',
  likes: 'Likes',
  dislikes: 'Dislikes',
  pet_peeves: 'Pet peeves',
};

// Get friendly label for a category
function getCategoryLabel(category: string): string {
  return CATEGORY_LABELS[category.toLowerCase()] || category.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
}

// Get friendly label for a key
function getFriendlyLabel(key: string): string {
  return FRIENDLY_KEY_LABELS[key.toLowerCase()] || key.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
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

// Group memories by category
function groupMemoriesByCategory(memories: PersonMemory[]): Record<string, PersonMemory[]> {
  const grouped: Record<string, PersonMemory[]> = {};
  
  memories.forEach((memory) => {
    const category = memory.category || 'general';
    if (!grouped[category]) {
      grouped[category] = [];
    }
    grouped[category].push(memory);
  });
  
  // Sort memories within each category by importance (desc), then updated_at (desc)
  Object.keys(grouped).forEach((category) => {
    grouped[category].sort((a, b) => {
      if (b.importance !== a.importance) {
        return b.importance - a.importance;
      }
      return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
    });
  });
  
  return grouped;
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

  const [memories, setMemories] = useState<PersonMemory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Edit modal state
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editingMemory, setEditingMemory] = useState<PersonMemory | null>(null);
  const [editValue, setEditValue] = useState('');
  const [saving, setSaving] = useState(false);

  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // Fetch memories
  const fetchMemories = useCallback(async () => {
    if (!personId || !currentUser?.id) {
      console.warn('[Memories] Missing personId or userId');
      if (isMountedRef.current) {
        setLoading(false);
        setError('Invalid parameters');
      }
      return;
    }

    try {
      setLoading(true);
      setError(null);
      console.log('[Memories] Fetching memories for person:', personId);

      const { data, error: fetchError } = await supabase
        .from('person_memories')
        .select('*')
        .eq('user_id', currentUser.id)
        .eq('person_id', personId)
        .order('category', { ascending: true })
        .order('importance', { ascending: false })
        .order('updated_at', { ascending: false });

      if (fetchError) {
        console.error('[Memories] Error fetching memories:', fetchError);
        if (isMountedRef.current) {
          setError('Failed to load memories');
        }
        return;
      }

      console.log('[Memories] Loaded memories:', data?.length || 0);
      if (isMountedRef.current) {
        setMemories(data || []);
      }
    } catch (err: any) {
      console.error('[Memories] Unexpected error:', err);
      if (isMountedRef.current) {
        setError('An unexpected error occurred');
      }
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
      }
    }
  }, [personId, currentUser?.id]);

  useEffect(() => {
    fetchMemories();
  }, [fetchMemories]);

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

  // Open edit modal
  const handleEditPress = useCallback((memory: PersonMemory) => {
    console.log('[Memories] Opening edit modal for:', memory.key);
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
      // No change
      handleCloseEditModal();
      return;
    }

    console.log('[Memories] Saving edit for:', editingMemory.key);
    setSaving(true);

    try {
      // Update memory
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

      // Insert audit record
      try {
        await supabase.from('person_memory_audit').insert({
          user_id: currentUser.id,
          person_id: editingMemory.person_id,
          memory_key: editingMemory.key,
          action: 'update',
          old_value: editingMemory.value,
          new_value: newValue,
        });
      } catch (auditError) {
        console.error('[Memories] Audit insert failed (non-critical):', auditError);
      }

      showSuccessToast('Memory updated');
      handleCloseEditModal();
      fetchMemories();
    } catch (err: any) {
      console.error('[Memories] Unexpected error saving edit:', err);
      showErrorToast('An unexpected error occurred');
    } finally {
      setSaving(false);
    }
  }, [editingMemory, editValue, currentUser?.id, handleCloseEditModal, fetchMemories]);

  // Delete memory
  const handleDeletePress = useCallback((memory: PersonMemory) => {
    if (!currentUser?.id) {
      return;
    }

    Alert.alert(
      'Delete Memory',
      `Are you sure you want to delete "${getFriendlyLabel(memory.key)}"?`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            console.log('[Memories] Deleting memory:', memory.key);

            try {
              // Delete memory
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

              // Insert audit record
              try {
                await supabase.from('person_memory_audit').insert({
                  user_id: currentUser.id,
                  person_id: memory.person_id,
                  memory_key: memory.key,
                  action: 'delete',
                  old_value: memory.value,
                  new_value: null,
                });
              } catch (auditError) {
                console.error('[Memories] Audit insert failed (non-critical):', auditError);
              }

              showSuccessToast('Memory deleted');
              fetchMemories();
            } catch (err: any) {
              console.error('[Memories] Unexpected error deleting:', err);
              showErrorToast('An unexpected error occurred');
            }
          },
        },
      ]
    );
  }, [currentUser?.id, fetchMemories]);

  const groupedMemories = groupMemoriesByCategory(memories);
  const categories = Object.keys(groupedMemories).sort();

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
          {memories.length === 0 && !loading ? (
            <View style={styles.emptyState}>
              <View style={[styles.emptyIconContainer, { backgroundColor: theme.card }]}>
                <IconSymbol
                  ios_icon_name="brain"
                  android_material_icon_name="psychology"
                  size={48}
                  color={theme.primary}
                />
              </View>
              <Text style={[styles.emptyTitle, { color: theme.textPrimary }]}>
                No memories saved yet
              </Text>
              <Text style={[styles.emptySubtext, { color: theme.textSecondary }]}>
                As you chat, the AI will learn and remember important details about {personName}.
              </Text>
              <Text style={[styles.emptyHint, { color: theme.textSecondary }]}>
                You can edit or delete memories anytime.
              </Text>
            </View>
          ) : (
            <>
              {categories.map((category) => (
                <View key={category} style={styles.categorySection}>
                  <Text style={[styles.categoryHeader, { color: theme.textPrimary }]}>
                    {getCategoryLabel(category)}
                  </Text>
                  {groupedMemories[category].map((memory) => (
                    <View
                      key={memory.id}
                      style={[
                        styles.memoryCard,
                        { 
                          backgroundColor: theme.card,
                          ...Platform.select({
                            ios: {
                              shadowColor: '#000',
                              shadowOffset: { width: 0, height: 2 },
                              shadowOpacity: 0.08,
                              shadowRadius: 8,
                            },
                            android: {
                              elevation: 3,
                            },
                            web: {
                              boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.08)',
                            },
                          }),
                        }
                      ]}
                    >
                      <View style={styles.memoryHeader}>
                        <View style={styles.memoryTitleRow}>
                          <Text style={[styles.memoryKey, { color: theme.textPrimary }]}>
                            {getFriendlyLabel(memory.key)}
                          </Text>
                          {memory.importance >= 8 && (
                            <View style={[styles.importanceBadge, { backgroundColor: theme.primary + '20' }]}>
                              <IconSymbol
                                ios_icon_name="star.fill"
                                android_material_icon_name="star"
                                size={12}
                                color={theme.primary}
                              />
                            </View>
                          )}
                        </View>
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
                      
                      <Text style={[styles.memoryValue, { color: theme.textSecondary }]}>
                        {memory.value}
                      </Text>
                      
                      <View style={styles.memoryFooter}>
                        <View style={styles.metadataRow}>
                          {memory.confidence >= 7 && (
                            <View style={[styles.metadataBadge, { backgroundColor: theme.primary + '15' }]}>
                              <IconSymbol
                                ios_icon_name="checkmark.circle.fill"
                                android_material_icon_name="check_circle"
                                size={12}
                                color={theme.primary}
                              />
                              <Text style={[styles.metadataText, { color: theme.primary }]}>
                                High confidence
                              </Text>
                            </View>
                          )}
                          {memory.last_mentioned_at && (
                            <Text style={[styles.memoryMeta, { color: theme.textSecondary }]}>
                              Updated {formatDate(memory.updated_at)}
                            </Text>
                          )}
                        </View>
                      </View>
                    </View>
                  ))}
                </View>
              ))}
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
              {editingMemory && (
                <Text style={[styles.modalSubtitle, { color: theme.textSecondary }]}>
                  {getFriendlyLabel(editingMemory.key)}
                </Text>
              )}

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
                  placeholder="Enter value..."
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

      <LoadingOverlay visible={loading && !error} />
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
    paddingTop: 24,
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
    marginBottom: 16,
  },
  emptyHint: {
    fontSize: 13,
    fontWeight: '500',
    textAlign: 'center',
    lineHeight: 18,
    fontStyle: 'italic',
  },
  categorySection: {
    marginBottom: 32,
  },
  categoryHeader: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 16,
    letterSpacing: 0.3,
    paddingLeft: 4,
  },
  memoryCard: {
    borderRadius: 16,
    padding: 18,
    marginBottom: 14,
  },
  memoryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  memoryTitleRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 12,
  },
  memoryKey: {
    fontSize: 17,
    fontWeight: '600',
    marginRight: 8,
    letterSpacing: 0.2,
  },
  importanceBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
  },
  memoryActions: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    padding: 6,
  },
  memoryValue: {
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 12,
    fontWeight: '400',
  },
  memoryFooter: {
    marginTop: 4,
  },
  metadataRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 8,
  },
  metadataBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 4,
  },
  metadataText: {
    fontSize: 12,
    fontWeight: '600',
  },
  memoryMeta: {
    fontSize: 12,
    fontWeight: '500',
    fontStyle: 'italic',
  },
  modalContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 24,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  modalSubtitle: {
    fontSize: 16,
    fontWeight: '500',
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
