
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

// Friendly labels for memory keys
const FRIENDLY_KEY_LABELS: Record<string, string> = {
  // Personal details
  age: 'Age',
  birthday: 'Birthday',
  occupation: 'Occupation',
  location: 'Location',
  hometown: 'Hometown',
  
  // Relationships
  relationship_status: 'Relationship Status',
  family_members: 'Family Members',
  children: 'Children',
  pets: 'Pets',
  
  // Interests & Hobbies
  hobbies: 'Hobbies',
  interests: 'Interests',
  favorite_music: 'Favorite Music',
  favorite_movies: 'Favorite Movies',
  favorite_books: 'Favorite Books',
  favorite_food: 'Favorite Food',
  
  // Health & Wellness
  health_conditions: 'Health Conditions',
  medications: 'Medications',
  allergies: 'Allergies',
  mental_health: 'Mental Health',
  
  // Work & Education
  education: 'Education',
  career_goals: 'Career Goals',
  work_challenges: 'Work Challenges',
  
  // Personality & Traits
  personality_traits: 'Personality Traits',
  values: 'Values',
  fears: 'Fears',
  goals: 'Goals',
  dreams: 'Dreams',
  
  // Communication
  communication_style: 'Communication Style',
  love_language: 'Love Language',
  conflict_style: 'Conflict Style',
};

// Get friendly label for a key, or return the key itself
function getFriendlyLabel(key: string): string {
  return FRIENDLY_KEY_LABELS[key] || key.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
}

// Group memories by category
function groupMemoriesByCategory(memories: PersonMemory[]): Record<string, PersonMemory[]> {
  const grouped: Record<string, PersonMemory[]> = {};
  
  memories.forEach((memory) => {
    const category = memory.category || 'General';
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
            { paddingBottom: insets.bottom + 16 }
          ]}
          showsVerticalScrollIndicator={false}
        >
          {memories.length === 0 && !loading ? (
            <View style={styles.emptyState}>
              <View style={[styles.emptyIconContainer, { backgroundColor: theme.card }]}>
                <IconSymbol
                  ios_icon_name="brain"
                  android_material_icon_name="psychology"
                  size={40}
                  color={theme.primary}
                />
              </View>
              <Text style={[styles.emptyText, { color: theme.textPrimary }]}>
                No memories saved yet
              </Text>
              <Text style={[styles.emptySubtext, { color: theme.textSecondary }]}>
                As you chat, the AI will learn and remember important details about {personName}
              </Text>
            </View>
          ) : (
            <>
              {categories.map((category) => (
                <View key={category} style={styles.categorySection}>
                  <Text style={[styles.categoryHeader, { color: theme.textPrimary }]}>
                    {category}
                  </Text>
                  {groupedMemories[category].map((memory) => (
                    <View
                      key={memory.id}
                      style={[styles.memoryCard, { backgroundColor: theme.card }]}
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
                      {memory.last_mentioned_at && (
                        <Text style={[styles.memoryMeta, { color: theme.textSecondary }]}>
                          Last mentioned: {new Date(memory.last_mentioned_at).toLocaleDateString()}
                        </Text>
                      )}
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
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: '5%',
    paddingVertical: 12,
    paddingBottom: 16,
  },
  backButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  headerSubtitle: {
    fontSize: 14,
    fontWeight: '500',
    color: 'rgba(255, 255, 255, 0.9)',
    marginTop: 2,
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
    paddingVertical: 16,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: '10%',
  },
  emptyIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
    lineHeight: 20,
  },
  categorySection: {
    marginBottom: 24,
  },
  categoryHeader: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 12,
  },
  memoryCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    boxShadow: '0px 2px 6px rgba(0, 0, 0, 0.08)',
    elevation: 2,
  },
  memoryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  memoryTitleRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 8,
  },
  memoryKey: {
    fontSize: 16,
    fontWeight: '600',
    marginRight: 8,
  },
  importanceBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  memoryActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    padding: 4,
  },
  memoryValue: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 4,
  },
  memoryMeta: {
    fontSize: 12,
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
