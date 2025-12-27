
/**
 * Memory Capture Pipeline
 * 
 * Extracts factual statements from user messages and saves them to the memories table.
 * This is a fire-and-forget pipeline that never blocks chat flow.
 * 
 * RULES:
 * - Only saves stable, factual statements about the person
 * - Respects "Continue conversations" setting (continuity_enabled)
 * - Uses SHA256-based duplicate prevention
 * - Never throws errors (all errors are caught and logged in dev mode only)
 * - Runs asynchronously without blocking chat send or AI response
 */

import { supabase } from './supabase';

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
 * Generate SHA256 hash for memory_key
 * Uses Web Crypto API (available in React Native)
 */
async function generateMemoryKey(
  userId: string,
  personId: string,
  normalizedContent: string
): Promise<string> {
  const data = `${userId}|${personId}|${normalizedContent}`;
  
  // Use Web Crypto API for SHA256
  const encoder = new TextEncoder();
  const dataBuffer = encoder.encode(data);
  const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);
  
  // Convert to hex string
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  
  return hashHex;
}

/**
 * Check if a memory already exists (duplicate prevention)
 */
async function memoryExists(memoryKey: string): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from('memories')
      .select('id')
      .eq('memory_key', memoryKey)
      .maybeSingle();
    
    if (error) {
      if (__DEV__) {
        console.log('[MemoryCapture] Error checking duplicate:', error.message);
      }
      return false; // Assume doesn't exist on error
    }
    
    return !!data;
  } catch (err) {
    if (__DEV__) {
      console.log('[MemoryCapture] Unexpected error checking duplicate:', err);
    }
    return false;
  }
}

/**
 * Extract factual statements from user message
 * 
 * ENHANCED RULES (v2):
 * - Capture more conversational patterns
 * - Less strict matching
 * - More categories of facts
 * 
 * Returns array of extracted facts
 */
function extractFactualStatements(
  messageText: string,
  personName: string
): string[] {
  const facts: string[] = [];
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
    facts.push(trimmedText);
  }
  
  // RULE 2: Birthday/anniversary (RELAXED)
  if (
    /\b(birthday|born|anniversary|age|years old)\b/i.test(messageText)
  ) {
    facts.push(trimmedText);
  }
  
  // RULE 3: Strong preferences/dislikes (RELAXED)
  if (
    /\b(hates|loves|allergic to|can't stand|favorite|prefers|dislikes|really likes|really hates|enjoys|doesn't like)\b/i.test(messageText)
  ) {
    facts.push(trimmedText);
  }
  
  // RULE 4: Medical/health information
  if (
    /\b(diagnosed|condition|illness|surgery|medication|treatment|doctor|hospital|health|sick|disease|injury)\b/i.test(messageText)
  ) {
    facts.push(trimmedText);
  }
  
  // RULE 5: Relationship status/changes
  if (
    /\b(married|divorced|engaged|dating|single|partner|spouse|ex-|boyfriend|girlfriend|husband|wife)\b/i.test(messageText)
  ) {
    facts.push(trimmedText);
  }
  
  // RULE 6: Job/career information
  if (
    /\b(works at|job|career|employed|retired|quit|fired|promoted|company|boss|coworker)\b/i.test(messageText)
  ) {
    facts.push(trimmedText);
  }
  
  // RULE 7: Location/residence
  if (
    /\b(lives in|moved to|relocated|address|hometown|city|country|neighborhood)\b/i.test(messageText)
  ) {
    facts.push(trimmedText);
  }
  
  // RULE 8: Education
  if (
    /\b(graduated|degree|university|college|school|studying|major|student|class)\b/i.test(messageText)
  ) {
    facts.push(trimmedText);
  }
  
  // RULE 9: Family members (NEW)
  if (
    /\b(has a|have a|his|her|their)\s+(son|daughter|child|kid|baby|brother|sister|mother|father|parent|grandparent|aunt|uncle|cousin)\b/i.test(messageText)
  ) {
    facts.push(trimmedText);
  }
  
  // RULE 10: Hobbies/interests (NEW)
  if (
    /\b(hobby|hobbies|plays|enjoys|interested in|passion|into|fan of)\b/i.test(messageText)
  ) {
    facts.push(trimmedText);
  }
  
  // RULE 11: Important events (NEW)
  if (
    /\b(happened|occurred|event|incident|accident|celebration|funeral|wedding|graduation)\b/i.test(messageText)
  ) {
    facts.push(trimmedText);
  }
  
  // RULE 12: Personality traits (NEW)
  if (
    /\b(is very|is really|is always|tends to be|known for being|personality|character|trait)\b/i.test(messageText)
  ) {
    facts.push(trimmedText);
  }
  
  // RULE 13: Habits/routines (NEW)
  if (
    /\b(always|never|usually|often|habit|routine|every day|every week|regularly)\b/i.test(messageText) &&
    trimmedText.length > 20
  ) {
    facts.push(trimmedText);
  }
  
  // RULE 14: Problems/challenges (NEW)
  if (
    /\b(struggling with|problem|issue|challenge|difficulty|trouble|hard time)\b/i.test(messageText)
  ) {
    facts.push(trimmedText);
  }
  
  // RULE 15: Achievements/milestones (NEW)
  if (
    /\b(achieved|accomplished|milestone|success|won|award|recognition|proud)\b/i.test(messageText)
  ) {
    facts.push(trimmedText);
  }
  
  return facts;
}

/**
 * Save a single memory to the database
 */
async function saveMemory(
  userId: string,
  personId: string,
  category: string,
  content: string,
  sourceMessage: string,
  confidence: number
): Promise<boolean> {
  try {
    // Generate memory key for duplicate prevention
    const normalizedContent = normalizeContent(content);
    const memoryKey = await generateMemoryKey(userId, personId, normalizedContent);
    
    // Check if memory already exists
    const exists = await memoryExists(memoryKey);
    if (exists) {
      if (__DEV__) {
        console.log('[MemoryCapture] Duplicate skipped:', content.substring(0, 50));
      }
      return false;
    }
    
    // Insert memory
    const { error } = await supabase
      .from('memories')
      .insert({
        user_id: userId,
        person_id: personId,
        category,
        content,
        source_message: sourceMessage,
        confidence,
        memory_key: memoryKey,
      });
    
    if (error) {
      if (__DEV__) {
        console.log('[MemoryCapture] Insert error:', error.message);
      }
      return false;
    }
    
    if (__DEV__) {
      console.log('[MemoryCapture] Memory inserted:', content.substring(0, 50));
    }
    
    return true;
  } catch (err) {
    if (__DEV__) {
      console.log('[MemoryCapture] Unexpected error saving memory:', err);
    }
    return false;
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
    const { data, error } = await supabase
      .from('person_chat_summaries')
      .select('continuity_enabled')
      .eq('user_id', userId)
      .eq('person_id', personId)
      .maybeSingle();
    
    if (error || !data) {
      // Default to enabled if no record exists
      return true;
    }
    
    return data.continuity_enabled ?? true;
  } catch (err) {
    if (__DEV__) {
      console.log('[MemoryCapture] Error checking continuity setting:', err);
    }
    // Default to enabled on error
    return true;
  }
}

/**
 * Main entry point: Capture memories from a user message
 * 
 * This is FIRE-AND-FORGET - never await this function in the chat flow
 * 
 * @param userId - The authenticated user's ID
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
    if (__DEV__) {
      console.log('[MemoryCapture] Starting extraction for message:', messageText.substring(0, 50));
    }
    
    // Check if continuity is enabled
    const continuityEnabled = await isContinuityEnabled(userId, personId);
    if (!continuityEnabled) {
      if (__DEV__) {
        console.log('[MemoryCapture] Continuity disabled, skipping memory capture');
      }
      return;
    }
    
    // Extract factual statements
    const facts = extractFactualStatements(messageText, personName);
    
    if (facts.length === 0) {
      if (__DEV__) {
        console.log('[MemoryCapture] No factual statements extracted from message');
      }
      return;
    }
    
    if (__DEV__) {
      console.log('[MemoryCapture] Extracted', facts.length, 'factual statements');
    }
    
    // Save each fact
    let savedCount = 0;
    for (const fact of facts) {
      const saved = await saveMemory(
        userId,
        personId,
        category,
        fact,
        messageText,
        0.8 // Default confidence for deterministic extraction
      );
      
      if (saved) {
        savedCount++;
      }
    }
    
    if (__DEV__) {
      console.log('[MemoryCapture] Saved', savedCount, 'new memories out of', facts.length, 'extracted');
    }
  } catch (err) {
    // Silent failure - never crash the chat
    if (__DEV__) {
      console.log('[MemoryCapture] Error caught:', err);
    }
  }
}
