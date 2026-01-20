
/**
 * Memory Merge & Deduplication Logic (DISPLAY ONLY)
 * 
 * This module provides client-side transformation of raw memory records
 * into grouped, merged, and deduplicated display items.
 * 
 * IMPORTANT:
 * - This is DISPLAY ONLY - raw DB records are NEVER modified
 * - All merging happens in-memory on the client
 * - Original memory IDs are preserved for edit/delete operations
 */

// ============================================================================
// TYPES
// ============================================================================

/**
 * Raw memory record from database (person_memories table)
 */
export interface RawMemory {
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

/**
 * Normalized memory with standardized category and comparison value
 */
interface NormalizedMemory extends RawMemory {
  normalizedCategory: string;
  normalizedValue: string;
  normalizedKey: string;
}

/**
 * Display memory item (may represent multiple underlying raw memories)
 */
export interface DisplayMemory {
  // Display fields
  id: string; // Primary memory ID
  category: string; // Display category
  key: string; // Display key
  value: string; // Display value (may be merged)
  importance: number;
  confidence: number;
  created_at: string;
  updated_at: string;
  last_mentioned_at: string | null;

  // Metadata for tracking underlying records
  sourceMemoryIds: string[]; // All underlying memory IDs
  isMerged: boolean; // True if this represents multiple memories
  mergedAges?: string[]; // If merged with timeline data
}

/**
 * Grouped display section
 */
export interface DisplaySection {
  category: string;
  memories: DisplayMemory[];
}

// ============================================================================
// NORMALIZATION
// ============================================================================

/**
 * Category normalization map
 */
const CATEGORY_NORMALIZATION: Record<string, string> = {
  // Health variations
  'Medical History': 'Health',
  'History': 'Health',
  'Health': 'Health',
  'medical_history': 'Health',
  'health': 'Health',

  // Timeline variations
  'Age Reference': 'Timeline',
  'Year Reference': 'Timeline',
  'Time since passing': 'Timeline',
  'age_reference': 'Timeline',
  'year_reference': 'Timeline',
  'time_since_passing': 'Timeline',

  // Loss & Grief variations
  'Loss & Grief': 'Loss & Grief',
  'Deceased': 'Loss & Grief',
  'loss_grief': 'Loss & Grief',
  'deceased': 'Loss & Grief',
};

/**
 * Normalize a single memory for comparison
 */
function normalizeMemory(memory: RawMemory): NormalizedMemory {
  // Normalize category
  const normalizedCategory = CATEGORY_NORMALIZATION[memory.category] || memory.category;

  // Normalize value for comparison (lowercase, trim, collapse whitespace)
  const normalizedValue = memory.value
    .toLowerCase()
    .trim()
    .replace(/\s+/g, ' ');

  // Normalize key for comparison
  const normalizedKey = memory.key
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '_');

  return {
    ...memory,
    normalizedCategory,
    normalizedValue,
    normalizedKey,
  };
}

// ============================================================================
// DEDUPLICATION
// ============================================================================

/**
 * Determine if a new memory should replace an existing one
 * Priority:
 * 1. Has age/year data (Timeline category)
 * 2. Latest updated_at
 * 3. Highest importance
 * 4. Highest confidence
 */
function shouldReplace(newMemory: NormalizedMemory, existingMemory: NormalizedMemory): boolean {
  // Priority 1: Timeline memories take precedence
  if (newMemory.normalizedCategory === 'Timeline' && existingMemory.normalizedCategory !== 'Timeline') {
    return true;
  }
  if (existingMemory.normalizedCategory === 'Timeline' && newMemory.normalizedCategory !== 'Timeline') {
    return false;
  }

  // Priority 2: Latest updated_at
  const newDate = new Date(newMemory.updated_at).getTime();
  const existingDate = new Date(existingMemory.updated_at).getTime();
  if (newDate > existingDate) {
    return true;
  }
  if (newDate < existingDate) {
    return false;
  }

  // Priority 3: Highest importance
  if (newMemory.importance > existingMemory.importance) {
    return true;
  }
  if (newMemory.importance < existingMemory.importance) {
    return false;
  }

  // Priority 4: Highest confidence
  if (newMemory.confidence > existingMemory.confidence) {
    return true;
  }

  return false;
}

/**
 * Deduplicate memories based on normalized topic + person_id
 * Returns a map of unique memories keyed by dedup key
 */
function deduplicateMemories(memories: NormalizedMemory[]): Map<string, NormalizedMemory> {
  const dedupMap = new Map<string, NormalizedMemory>();

  for (const memory of memories) {
    // Dedup key: person_id + normalized category + normalized value
    const dedupKey = `${memory.person_id}:${memory.normalizedCategory}:${memory.normalizedValue}`;

    const existing = dedupMap.get(dedupKey);
    if (!existing || shouldReplace(memory, existing)) {
      dedupMap.set(dedupKey, memory);
    }
  }

  return dedupMap;
}

// ============================================================================
// MERGING
// ============================================================================

/**
 * Check if two memories are "nearby" (should be merged)
 * Criteria:
 * - Same person_id
 * - Created within ±10 minutes
 */
function areMemoriesNearby(memory1: NormalizedMemory, memory2: NormalizedMemory): boolean {
  if (memory1.person_id !== memory2.person_id) {
    return false;
  }

  const time1 = new Date(memory1.created_at).getTime();
  const time2 = new Date(memory2.created_at).getTime();
  const timeDiff = Math.abs(time1 - time2);

  // 10 minutes in milliseconds
  const TEN_MINUTES = 10 * 60 * 1000;

  return timeDiff <= TEN_MINUTES;
}

/**
 * Extract age/year information from a timeline memory value
 */
function extractAgeInfo(value: string): string | null {
  // Look for patterns like "Age 10", "age 16", "10 years old", etc.
  const ageMatch = value.match(/(?:age|aged)\s*(\d+)|(\d+)\s*years?\s*old/i);
  if (ageMatch) {
    const age = ageMatch[1] || ageMatch[2];
    return `Age ${age}`;
  }

  // Look for year patterns like "2015", "in 2020", etc.
  const yearMatch = value.match(/(?:in\s*)?(\d{4})/);
  if (yearMatch) {
    return yearMatch[1];
  }

  return null;
}

/**
 * Merge timeline memories with event memories
 * Returns array of display memories with merged data
 */
function mergeNearbyMemories(memories: NormalizedMemory[]): DisplayMemory[] {
  const displayMemories: DisplayMemory[] = [];
  const timelineMemories: NormalizedMemory[] = [];
  const eventMemories: NormalizedMemory[] = [];

  // Separate timeline and event memories
  for (const memory of memories) {
    if (memory.normalizedCategory === 'Timeline') {
      timelineMemories.push(memory);
    } else {
      eventMemories.push(memory);
    }
  }

  // Track which timeline memories have been merged
  const mergedTimelineIds = new Set<string>();

  // Try to merge each event with nearby timeline memories
  for (const eventMemory of eventMemories) {
    const nearbyTimelines = timelineMemories.filter(
      (timeline) => !mergedTimelineIds.has(timeline.id) && areMemoriesNearby(eventMemory, timeline)
    );

    if (nearbyTimelines.length > 0) {
      // Extract age info from all nearby timelines
      const ageInfos = nearbyTimelines
        .map((t) => extractAgeInfo(t.value))
        .filter((info): info is string => info !== null);

      // Mark timelines as merged
      nearbyTimelines.forEach((t) => mergedTimelineIds.add(t.id));

      // Create merged display memory
      const mergedValue = ageInfos.length > 0
        ? `${eventMemory.value} — ${ageInfos.join(', ')}`
        : eventMemory.value;

      displayMemories.push({
        id: eventMemory.id,
        category: eventMemory.category,
        key: eventMemory.key,
        value: mergedValue,
        importance: eventMemory.importance,
        confidence: eventMemory.confidence,
        created_at: eventMemory.created_at,
        updated_at: eventMemory.updated_at,
        last_mentioned_at: eventMemory.last_mentioned_at,
        sourceMemoryIds: [eventMemory.id, ...nearbyTimelines.map((t) => t.id)],
        isMerged: true,
        mergedAges: ageInfos.length > 0 ? ageInfos : undefined,
      });
    } else {
      // No nearby timeline - add event as-is
      displayMemories.push({
        id: eventMemory.id,
        category: eventMemory.category,
        key: eventMemory.key,
        value: eventMemory.value,
        importance: eventMemory.importance,
        confidence: eventMemory.confidence,
        created_at: eventMemory.created_at,
        updated_at: eventMemory.updated_at,
        last_mentioned_at: eventMemory.last_mentioned_at,
        sourceMemoryIds: [eventMemory.id],
        isMerged: false,
      });
    }
  }

  // Add unmerged timeline memories
  for (const timeline of timelineMemories) {
    if (!mergedTimelineIds.has(timeline.id)) {
      displayMemories.push({
        id: timeline.id,
        category: timeline.category,
        key: timeline.key,
        value: timeline.value,
        importance: timeline.importance,
        confidence: timeline.confidence,
        created_at: timeline.created_at,
        updated_at: timeline.updated_at,
        last_mentioned_at: timeline.last_mentioned_at,
        sourceMemoryIds: [timeline.id],
        isMerged: false,
      });
    }
  }

  return displayMemories;
}

// ============================================================================
// SPECIAL CASES
// ============================================================================

/**
 * Handle special case: Deceased + Time since passing
 * Merges into single display item: "Deceased • Passed away X years ago"
 */
function handleDeceasedSpecialCase(memories: DisplayMemory[]): DisplayMemory[] {
  const result: DisplayMemory[] = [];
  let deceasedMemory: DisplayMemory | null = null;
  let timeSincePassingMemory: DisplayMemory | null = null;

  for (const memory of memories) {
    if (memory.category === 'Loss & Grief' && memory.key.toLowerCase().includes('deceased')) {
      deceasedMemory = memory;
    } else if (memory.category === 'Timeline' && memory.key.toLowerCase().includes('time_since_passing')) {
      timeSincePassingMemory = memory;
    } else {
      result.push(memory);
    }
  }

  // If both exist, merge them
  if (deceasedMemory && timeSincePassingMemory) {
    result.push({
      ...deceasedMemory,
      value: `Passed away • ${timeSincePassingMemory.value}`,
      sourceMemoryIds: [...deceasedMemory.sourceMemoryIds, ...timeSincePassingMemory.sourceMemoryIds],
      isMerged: true,
    });
  } else {
    // Add them separately if only one exists
    if (deceasedMemory) result.push(deceasedMemory);
    if (timeSincePassingMemory) result.push(timeSincePassingMemory);
  }

  return result;
}

// ============================================================================
// GROUPING
// ============================================================================

/**
 * Group memories by category for display
 */
function groupMemories(memories: DisplayMemory[]): DisplaySection[] {
  const grouped = new Map<string, DisplayMemory[]>();

  for (const memory of memories) {
    const category = memory.category;
    if (!grouped.has(category)) {
      grouped.set(category, []);
    }
    grouped.get(category)!.push(memory);
  }

  // Convert to array and sort by importance within each category
  const sections: DisplaySection[] = [];
  for (const [category, categoryMemories] of grouped.entries()) {
    // Sort by importance (desc), then by last_mentioned_at (desc), then by updated_at (desc)
    categoryMemories.sort((a, b) => {
      // First by importance
      if (b.importance !== a.importance) {
        return b.importance - a.importance;
      }

      // Then by last_mentioned_at (nulls last)
      if (a.last_mentioned_at && b.last_mentioned_at) {
        return new Date(b.last_mentioned_at).getTime() - new Date(a.last_mentioned_at).getTime();
      }
      if (a.last_mentioned_at && !b.last_mentioned_at) return -1;
      if (!a.last_mentioned_at && b.last_mentioned_at) return 1;

      // Finally by updated_at
      return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
    });

    sections.push({
      category,
      memories: categoryMemories,
    });
  }

  // Sort sections by category name
  sections.sort((a, b) => a.category.localeCompare(b.category));

  return sections;
}

// ============================================================================
// MAIN EXPORT
// ============================================================================

/**
 * Main function: Transform raw memory records into grouped, merged, deduplicated display data
 * 
 * This is the primary entry point for memory display transformation.
 * 
 * @param rawMemories - Array of raw memory records from database
 * @returns Array of display sections, grouped by category
 * 
 * @example
 * ```typescript
 * const rawMemories = await getPersonMemories(userId, personId);
 * const displaySections = mergeMemoriesForDisplay(rawMemories);
 * 
 * // Render sections
 * displaySections.forEach(section => {
 *   console.log(`Category: ${section.category}`);
 *   section.memories.forEach(memory => {
 *     console.log(`  - ${memory.value}`);
 *     if (memory.isMerged) {
 *       console.log(`    (merged from ${memory.sourceMemoryIds.length} records)`);
 *     }
 *   });
 * });
 * ```
 */
export function mergeMemoriesForDisplay(rawMemories: RawMemory[]): DisplaySection[] {
  if (!rawMemories || rawMemories.length === 0) {
    return [];
  }

  console.log('[Memory Display] Starting merge/dedup for', rawMemories.length, 'raw memories');

  // STEP 1: Normalize all memories
  const normalized = rawMemories.map(normalizeMemory);
  console.log('[Memory Display] Normalized', normalized.length, 'memories');

  // STEP 2: Deduplicate based on normalized values
  const dedupMap = deduplicateMemories(normalized);
  const deduplicated = Array.from(dedupMap.values());
  console.log('[Memory Display] Deduplicated to', deduplicated.length, 'unique memories');

  // STEP 3: Merge nearby event + timeline memories
  let merged = mergeNearbyMemories(deduplicated);
  console.log('[Memory Display] Merged to', merged.length, 'display items');

  // STEP 4: Handle special cases
  merged = handleDeceasedSpecialCase(merged);
  console.log('[Memory Display] Applied special cases');

  // STEP 5: Group by category
  const sections = groupMemories(merged);
  console.log('[Memory Display] Grouped into', sections.length, 'sections');

  return sections;
}

/**
 * Helper: Get all underlying memory IDs from a display memory
 * Useful for edit/delete operations
 */
export function getUnderlyingMemoryIds(displayMemory: DisplayMemory): string[] {
  return displayMemory.sourceMemoryIds;
}

/**
 * Helper: Get primary memory ID (for default edit/delete target)
 */
export function getPrimaryMemoryId(displayMemory: DisplayMemory): string {
  return displayMemory.id;
}
