
/**
 * Example usage of mergeMemoriesForDisplay
 * 
 * This file demonstrates how to use the memory merge/dedup logic
 * in your UI components.
 */

import { mergeMemoriesForDisplay, DisplaySection, DisplayMemory, RawMemory } from './mergeMemoriesForDisplay';
import { getPersonMemories } from './personMemory';

/**
 * Example 1: Basic usage in a React component
 */
export async function loadMemoriesForDisplay(userId: string, personId: string): Promise<DisplaySection[]> {
  // Fetch raw memories from database
  const rawMemories = await getPersonMemories(userId, personId);

  // Transform for display
  const displaySections = mergeMemoriesForDisplay(rawMemories);

  return displaySections;
}

/**
 * Example 2: Rendering display sections
 */
export function renderMemorySections(sections: DisplaySection[]): void {
  sections.forEach((section) => {
    console.log(`\n=== ${section.category} ===`);
    section.memories.forEach((memory) => {
      console.log(`  • ${memory.value}`);
      if (memory.isMerged) {
        console.log(`    (merged from ${memory.sourceMemoryIds.length} records)`);
      }
    });
  });
}

/**
 * Example 3: Handling edit/delete operations
 */
export function handleMemoryEdit(displayMemory: DisplayMemory): void {
  // For editing, use the primary memory ID
  const primaryId = displayMemory.id;
  console.log('Editing memory:', primaryId);

  // If you need to edit all underlying memories:
  if (displayMemory.isMerged) {
    console.log('This is a merged memory with', displayMemory.sourceMemoryIds.length, 'underlying records');
    console.log('Underlying IDs:', displayMemory.sourceMemoryIds);
    // You can choose to:
    // 1. Edit only the primary (recommended)
    // 2. Edit all underlying records
    // 3. Show a warning to the user
  }
}

/**
 * Example 4: Sample data transformation
 */
export function demonstrateMerging(): void {
  // Sample raw memories (as they would come from database)
  const rawMemories: RawMemory[] = [
    {
      id: '1',
      user_id: 'user-123',
      person_id: 'person-456',
      category: 'Medical History',
      key: 'kidney_failure',
      value: 'Had kidney failure',
      importance: 8,
      confidence: 0.9,
      last_mentioned_at: '2024-01-15T10:00:00Z',
      created_at: '2024-01-15T10:00:00Z',
      updated_at: '2024-01-15T10:00:00Z',
    },
    {
      id: '2',
      user_id: 'user-123',
      person_id: 'person-456',
      category: 'Age Reference',
      key: 'age_at_kidney_failure',
      value: 'Age 10',
      importance: 7,
      confidence: 0.85,
      last_mentioned_at: '2024-01-15T10:02:00Z',
      created_at: '2024-01-15T10:02:00Z',
      updated_at: '2024-01-15T10:02:00Z',
    },
    {
      id: '3',
      user_id: 'user-123',
      person_id: 'person-456',
      category: 'Medical History',
      key: 'kidney_failure',
      value: 'Had kidney failure', // Duplicate
      importance: 8,
      confidence: 0.9,
      last_mentioned_at: '2024-01-16T14:00:00Z',
      created_at: '2024-01-16T14:00:00Z',
      updated_at: '2024-01-16T14:00:00Z',
    },
    {
      id: '4',
      user_id: 'user-123',
      person_id: 'person-456',
      category: 'Deceased',
      key: 'deceased',
      value: 'Deceased',
      importance: 10,
      confidence: 1.0,
      last_mentioned_at: '2024-01-20T09:00:00Z',
      created_at: '2024-01-20T09:00:00Z',
      updated_at: '2024-01-20T09:00:00Z',
    },
    {
      id: '5',
      user_id: 'user-123',
      person_id: 'person-456',
      category: 'Time since passing',
      key: 'time_since_passing',
      value: '3 years ago',
      importance: 9,
      confidence: 0.95,
      last_mentioned_at: '2024-01-20T09:01:00Z',
      created_at: '2024-01-20T09:01:00Z',
      updated_at: '2024-01-20T09:01:00Z',
    },
  ];

  // Transform
  const displaySections = mergeMemoriesForDisplay(rawMemories);

  console.log('\n=== TRANSFORMATION RESULT ===\n');
  renderMemorySections(displaySections);

  // Expected output:
  // === Health ===
  //   • Had kidney failure — Age 10
  //     (merged from 3 records)
  //
  // === Loss & Grief ===
  //   • Passed away • 3 years ago
  //     (merged from 2 records)
}

/**
 * Example 5: React component usage
 */
export const MemoriesDisplayExample = `
import React, { useEffect, useState } from 'react';
import { View, Text, FlatList } from 'react-native';
import { mergeMemoriesForDisplay, DisplaySection } from './lib/memory/mergeMemoriesForDisplay';
import { getPersonMemories } from './lib/memory/personMemory';

export function MemoriesScreen({ userId, personId }) {
  const [sections, setSections] = useState<DisplaySection[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadMemories();
  }, [userId, personId]);

  async function loadMemories() {
    setLoading(true);
    try {
      // Fetch raw memories
      const rawMemories = await getPersonMemories(userId, personId);
      
      // Transform for display
      const displaySections = mergeMemoriesForDisplay(rawMemories);
      
      setSections(displaySections);
    } catch (error) {
      console.error('Error loading memories:', error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return <Text>Loading memories...</Text>;
  }

  return (
    <FlatList
      data={sections}
      keyExtractor={(section) => section.category}
      renderItem={({ item: section }) => (
        <View>
          <Text style={{ fontSize: 18, fontWeight: 'bold' }}>
            {section.category}
          </Text>
          {section.memories.map((memory, index) => (
            <View key={index} style={{ marginLeft: 16, marginVertical: 4 }}>
              <Text>{memory.value}</Text>
              {memory.isMerged && (
                <Text style={{ fontSize: 12, color: 'gray' }}>
                  Merged from {memory.sourceMemoryIds.length} records
                </Text>
              )}
            </View>
          ))}
        </View>
      )}
    />
  );
}
`;
