
/**
 * Memory Capture Pipeline
 * 
 * Extracts factual statements from user messages and saves them to the person_memories table.
 * This is a fire-and-forget pipeline that never blocks chat flow.
 * 
 * RULES:
 * - Only saves stable, factual statements about the person
 * - Respects "Continue conversations" setting (continuity_enabled)
 * - Uses key-based duplicate prevention (user_id + person_id + key unique constraint)
 * - Never throws errors (all errors are caught and logged in dev mode only)
 * - Runs asynchronously without blocking chat send or AI response
 * 
 * CRITICAL: This writes to person_memories table (NOT memories table)
 * The person_memories table has RLS policies that require user_id = auth.uid()
 */

import { supabase } from './supabase';
import { PersonMemoryInput } from './memory/personMemory';

/**
 * Normalize text for duplicate detection
 * - Trim whitespace
 * - Convert to lowercase
 * - Normalize multiple spaces to single space
 * - Remove punctuation
 */
function normalizeContent(text: string): string {
  return text
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .replace(/[.,!?;:'"]/g, '');
}

/**
 * Generate a stable key for a memory based on its content
 * This is used for the unique constraint (user_id, person_id, key)
 */
function generateMemoryKey(category: string, content: string): string {
  const normalized = normalizeContent(content);
  // Take first 50 chars of normalized content as key
  const contentKey = normalized.substring(0, 50).replace(/\s+/g, '_');
  return `${category.toLowerCase()}_${contentKey}`;
}

/**
 * Extract factual statements from user message
 * 
 * ENHANCED RULES (v2):
 * - Capture more conversational patterns
 * - Less strict matching
 * - More categories of facts
 * 
 * Returns array of extracted facts with category
 */
function extractFactualStatements(
  messageText: string,
  personName: string
): Array<{ category: string; content: string }> {
  const facts: Array<{ category: string; content: string }> = [];
  const lowerText = messageText.toLowerCase();
  const trimmedText = messageText.trim();
  
  // Skip if message is too short (likely greeting/acknowledgement)
  if (trimmedText.length < 10) {
    return facts;
  }
  
  // Skip common greetings and acknowledgements
  const skipPatterns = [
    /^(hi|hello|hey|thanks|thank you|ok|okay|yes|no|sure|alright)\b/i,
    /^(i see|got it|understood|makes sense)\b/i,
  ];
  
  for (const pattern of skipPatterns) {
    if (pattern.test(trimmedText)) {
      return facts;
    }
  }
  
  // RULE 1: Travel/dates (RELAXED)
  if (
    /\b(travelled|traveled|went to|visited|trip to|vacation|holiday)\b/i.test(messageText)
  ) {
    facts.push({ category: 'timeline', content: trimmedText });
  }
  
  // RULE 2: Birthday/anniversary (RELAXED)
  if (
    /\b(birthday|born|anniversary|age|years old)\b/i.test(messageText)
  ) {
    facts.push({ category: 'personal_details', content: trimmedText });
  }
  
  // RULE 3: Strong preferences/dislikes (RELAXED)
  if (
    /\b(hates|loves|allergic to|can't stand|favorite|prefers|dislikes|really likes|really hates|enjoys|doesn't like)\b/i.test(messageText)
  ) {
    facts.push({ category: 'preferences', content: trimmedText });
  }
  
  // RULE 4: Medical/health information
  if (
    /\b(diagnosed|condition|illness|surgery|medication|treatment|doctor|hospital|health|sick|disease|injury)\b/i.test(messageText)
  ) {
    facts.push({ category: 'health', content: trimmedText });
  }
  
  // RULE 5: Relationship status/changes
  if (
    /\b(married|divorced|engaged|dating|single|partner|spouse|ex-|boyfriend|girlfriend|husband|wife)\b/i.test(messageText)
  ) {
    facts.push({ category: 'relationships', content: trimmedText });
  }
  
  // RULE 6: Job/career information
  if (
    /\b(works at|job|career|employed|retired|quit|fired|promoted|company|boss|coworker)\b/i.test(messageText)
  ) {
    facts.push({ category: 'work_career', content: trimmedText });
  }
  
  // RULE 7: Location/residence
  if (
    /\b(lives in|moved to|relocated|address|hometown|city|country|neighborhood)\b/i.test(messageText)
  ) {
    facts.push({ category: 'location', content: trimmedText });
  }
  
  // RULE 8: Education
  if (
    /\b(graduated|degree|university|college|school|studying|major|student|class)\b/i.test(messageText)
  ) {
    facts.push({ category: 'work_career', content: trimmedText });
  }
  
  // RULE 9: Family members (NEW)
  if (
    /\b(has a|have a|his|her|their)\s+(son|daughter|child|kid|baby|brother|sister|mother|father|parent|grandparent|aunt|uncle|cousin)\b/i.test(messageText)
  ) {
    facts.push({ category: 'family', content: trimmedText });
  }
  
  // RULE 10: Hobbies/interests (NEW)
  if (
    /\b(hobby|hobbies|plays|enjoys|interested in|passion|into|fan of)\b/i.test(messageText)
  ) {
    facts.push({ category: 'interests_hobbies', content: trimmedText });
  }
  
  // RULE 11: Important events (NEW)
  if (
    /\b(happened|occurred|event|incident|accident|celebration|funeral|wedding|graduation)\b/i.test(messageText)
  ) {
    facts.push({ category: 'timeline', content: trimmedText });
  }
  
  // RULE 12: Personality traits (NEW)
  if (
    /\b(is very|is really|is always|tends to be|known for being|personality|character|trait)\b/i.test(messageText)
  ) {
    facts.push({ category: 'identity', content: trimmedText });
  }
  
  // RULE 13: Habits/routines (NEW)
  if (
    /\b(always|never|usually|often|habit|routine|every day|every week|regularly)\b/i.test(messageText) &&
    trimmedText.length > 20
  ) {
    facts.push({ category: 'patterns', content: trimmedText });
  }
  
  // RULE 14: Problems/challenges (NEW)
  if (
    /\b(struggling with|problem|issue|challenge|difficulty|trouble|hard time)\b/i.test(messageText)
  ) {
    facts.push({ category: 'mental_health', content: trimmedText });
  }
  
  // RULE 15: Achievements/milestones (NEW)
  if (
    /\b(achieved|accomplished|milestone|success|won|award|recognition|proud)\b/i.test(messageText)
  ) {
    facts.push({ category: 'goals', content: trimmedText });
  }
  
  return facts;
}

/**
 * Save memories to the person_memories table using upsert
 * This uses the unique constraint (user_id, person_id, key) to prevent duplicates
 */
async function saveMemories(
  userId: string,
  personId: string,
  memories: PersonMemoryInput[]
): Promise<{ saved: number; skipped: number; errors: number }> {
  let saved = 0;
  let skipped = 0;
  let errors = 0;

  if (memories.length === 0) {
    return { saved, skipped, errors };
  }

  try {
    console.log('[MemoryCapture] Upserting', memories.length, 'memories to person_memories table');
    
    const now = new Date().toISOString();
    
    // Prepare records for upsert
    const records = memories.map((memory) => ({
      user_id: userId,
      person_id: personId,
      category: memory.category,
      key: memory.key,
      value: memory.value,
      importance: memory.importance,
      confidence: memory.confidence,
      last_mentioned_at: now,
      updated_at: now,
    }));

    // Use upsert with conflict resolution on (user_id, person_id, key)
    const { data, error } = await supabase
      .from('person_memories')
      .upsert(records, {
        onConflict: 'user_id,person_id,key',
        ignoreDuplicates: false, // Update on conflict
      })
      .select('*');

    if (error) {
      console.error('[MemoryCapture] Upsert error:', {
        message: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint,
      });
      errors = memories.length;
      return { saved, skipped, errors };
    }

    // Count results
    const returnedCount = data?.length || 0;
    saved = returnedCount;
    
    console.log('[MemoryCapture] ✅ Upsert successful:', saved, 'memories affected');
    
    return { saved, skipped, errors };
  } catch (err: any) {
    console.error('[MemoryCapture] Unexpected error saving memories:', {
      message: err?.message || 'unknown',
      name: err?.name || 'unknown',
      stack: err?.stack?.substring(0, 200),
    });
    errors = memories.length;
    return { saved, skipped, errors };
  }
}

/**
 * Check if continuity is enabled for this person
 */
async function isContinuityEnabled(
  userId: string,
  personId: string
): Promise<boolean> {
  try {
    console.log('[MemoryCapture] Checking continuity setting...');
    console.log('[MemoryCapture] - User ID:', userId);
    console.log('[MemoryCapture] - Person ID:', personId);
    
    const { data, error } = await supabase
      .from('person_chat_summaries')
      .select('continuity_enabled')
      .eq('user_id', userId)
      .eq('person_id', personId)
      .maybeSingle();
    
    if (error) {
      console.log('[MemoryCapture] Error checking continuity:', error.message);
      // Default to enabled if no record exists or error
      return true;
    }
    
    if (!data) {
      console.log('[MemoryCapture] No continuity record found, defaulting to enabled');
      return true;
    }
    
    const enabled = data.continuity_enabled ?? true;
    console.log('[MemoryCapture] Continuity enabled:', enabled);
    return enabled;
  } catch (err) {
    console.log('[MemoryCapture] Unexpected error checking continuity:', err);
    // Default to enabled on error
    return true;
  }
}

/**
 * Main entry point: Capture memories from a user message
 * 
 * This is FIRE-AND-FORGET - never await this function in the chat flow
 * 
 * CRITICAL: This function writes to person_memories table with proper user_id
 * The RLS policies on person_memories require user_id = auth.uid()
 * 
 * @param userId - The authenticated user's ID (from auth.uid())
 * @param personId - The person being discussed
 * @param messageText - The user's message text
 * @param personName - The person's name (for context)
 * @param category - The current subject/category (default: "General")
 */
export async function captureMemoriesFromMessage(
  userId: string,
  personId: string,
  messageText: string,
  personName: string,
  category: string = 'General'
): Promise<void> {
  // Wrap everything in try-catch to ensure no errors escape
  try {
    console.log('');
    console.log('═══════════════════════════════════════════════════════');
    console.log('[MemoryCapture] 🧠 STARTING MEMORY CAPTURE');
    console.log('═══════════════════════════════════════════════════════');
    console.log('[MemoryCapture] User ID:', userId);
    console.log('[MemoryCapture] Person ID:', personId);
    console.log('[MemoryCapture] Person Name:', personName);
    console.log('[MemoryCapture] Category:', category);
    console.log('[MemoryCapture] Message:', messageText.substring(0, 100) + (messageText.length > 100 ? '...' : ''));
    console.log('[MemoryCapture] Target table: person_memories');
    console.log('───────────────────────────────────────────────────────');
    
    // Validate inputs
    if (!userId || !personId || !messageText || !personName) {
      console.error('[MemoryCapture] ❌ Missing required parameters:', {
        hasUserId: !!userId,
        hasPersonId: !!personId,
        hasMessageText: !!messageText,
        hasPersonName: !!personName,
      });
      return;
    }
    
    // Check if continuity is enabled
    const continuityEnabled = await isContinuityEnabled(userId, personId);
    if (!continuityEnabled) {
      console.log('[MemoryCapture] ⏸️  Continuity disabled, skipping memory capture');
      console.log('═══════════════════════════════════════════════════════');
      return;
    }
    
    // Extract factual statements
    console.log('[MemoryCapture] Extracting factual statements...');
    const facts = extractFactualStatements(messageText, personName);
    
    if (facts.length === 0) {
      console.log('[MemoryCapture] ℹ️  No factual statements extracted from message');
      console.log('═══════════════════════════════════════════════════════');
      return;
    }
    
    console.log('[MemoryCapture] ✅ Extracted', facts.length, 'factual statement(s)');
    facts.forEach((fact, index) => {
      console.log(`[MemoryCapture]   ${index + 1}. [${fact.category}] ${fact.content.substring(0, 60)}${fact.content.length > 60 ? '...' : ''}`);
    });
    console.log('───────────────────────────────────────────────────────');
    
    // Convert facts to PersonMemoryInput format
    const memoryInputs: PersonMemoryInput[] = facts.map((fact) => {
      const key = generateMemoryKey(fact.category, fact.content);
      return {
        category: fact.category,
        key: key,
        value: fact.content,
        importance: 5, // Default importance
        confidence: 0.8, // Default confidence for deterministic extraction
      };
    });
    
    // Save memories using upsert
    console.log('[MemoryCapture] Saving memories to person_memories table...');
    const result = await saveMemories(userId, personId, memoryInputs);
    
    console.log('───────────────────────────────────────────────────────');
    console.log('[MemoryCapture] 📊 SUMMARY:');
    console.log('[MemoryCapture]   ✅ Saved/Updated:', result.saved);
    console.log('[MemoryCapture]   ⏭️  Skipped (duplicates):', result.skipped);
    console.log('[MemoryCapture]   ❌ Errors:', result.errors);
    console.log('═══════════════════════════════════════════════════════');
    console.log('');
  } catch (err: any) {
    // Silent failure - never crash the chat
    console.error('[MemoryCapture] ❌ FATAL ERROR:', {
      message: err?.message || 'unknown',
      name: err?.name || 'unknown',
      stack: err?.stack?.substring(0, 300),
    });
    console.log('═══════════════════════════════════════════════════════');
  }
}
