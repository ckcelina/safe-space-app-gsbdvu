
/**
 * Local memory extraction from user text
 * 
 * This module provides lightweight, rule-based memory extraction that works
 * even when the AI Edge Function fails. It extracts stable facts only.
 */

export interface ExtractedMemory {
  category: string;
  key: string;
  value: string;
  importance: number;
  confidence: number;
}

/**
 * Extract memories from user text using simple heuristics
 * 
 * Rules:
 * - If text contains "died", "passed away", "deceased", "late", "RIP":
 *   memory: { category:"loss_grief", key:"is_deceased", value:"true", importance:5, confidence:5 }
 * - If text contains "kidney failure":
 *   memory: { category:"history", key:"medical_history", value:"kidney failure (mentioned)", importance:3, confidence:4 }
 * - If text says "when he/she was <number>" capture as:
 *   { category:"history", key:"age_reference", value:"<number>", importance:2, confidence:3 }
 * 
 * Only stores stable facts; does not store feelings.
 * 
 * @param text - The user's message text
 * @param personName - The name of the person being discussed
 * @returns Array of extracted memories
 */
export function extractMemoriesFromUserText(
  text: string,
  personName: string
): ExtractedMemory[] {
  const memories: ExtractedMemory[] = [];
  
  if (!text || !text.trim()) {
    return memories;
  }

  const lowerText = text.toLowerCase();

  // Rule 1: Death/Loss detection
  const deathPatterns = [
    /\b(died|passed away|deceased|late|rip|rest in peace)\b/i,
    /\bno longer (with us|here|alive)\b/i,
    /\blost (him|her|them)\b/i,
  ];

  for (const pattern of deathPatterns) {
    if (pattern.test(text)) {
      memories.push({
        category: 'loss_grief',
        key: 'is_deceased',
        value: 'true',
        importance: 5,
        confidence: 5,
      });
      console.log('[LocalExtract] Detected: is_deceased');
      break; // Only add once
    }
  }

  // Rule 2: Medical history - kidney failure
  if (/kidney failure/i.test(text)) {
    memories.push({
      category: 'history',
      key: 'medical_history',
      value: 'kidney failure (mentioned)',
      importance: 3,
      confidence: 4,
    });
    console.log('[LocalExtract] Detected: kidney failure');
  }

  // Rule 3: Age reference - "when he/she was <number>"
  const agePatterns = [
    /when (he|she|they) was (\d+)/i,
    /when (he|she|they) were (\d+)/i,
    /at age (\d+)/i,
    /at (\d+) years old/i,
  ];

  for (const pattern of agePatterns) {
    const match = pattern.exec(text);
    if (match) {
      // Extract the age number (last captured group)
      const age = match[match.length - 1];
      memories.push({
        category: 'history',
        key: 'age_reference',
        value: age,
        importance: 2,
        confidence: 3,
      });
      console.log('[LocalExtract] Detected: age reference', age);
      break; // Only add first match
    }
  }

  // Rule 4: Additional medical conditions
  const medicalConditions = [
    { pattern: /\b(cancer|tumor|malignant)\b/i, value: 'cancer (mentioned)' },
    { pattern: /\b(diabetes|diabetic)\b/i, value: 'diabetes (mentioned)' },
    { pattern: /\b(heart attack|cardiac arrest)\b/i, value: 'heart condition (mentioned)' },
    { pattern: /\b(stroke|cerebrovascular)\b/i, value: 'stroke (mentioned)' },
    { pattern: /\b(alzheimer|dementia)\b/i, value: 'cognitive condition (mentioned)' },
    { pattern: /\b(depression|depressed)\b/i, value: 'depression (mentioned)' },
    { pattern: /\b(anxiety|anxious)\b/i, value: 'anxiety (mentioned)' },
  ];

  for (const condition of medicalConditions) {
    if (condition.pattern.test(text)) {
      // Check if we already have a medical_history entry
      const existingMedical = memories.find(
        (m) => m.category === 'history' && m.key === 'medical_history'
      );
      
      if (!existingMedical) {
        memories.push({
          category: 'history',
          key: 'medical_history',
          value: condition.value,
          importance: 3,
          confidence: 4,
        });
        console.log('[LocalExtract] Detected: medical condition', condition.value);
        break; // Only add first match
      }
    }
  }

  // Rule 5: Relationship status changes
  const relationshipPatterns = [
    { pattern: /\b(divorced|separated|split up)\b/i, key: 'relationship_status', value: 'divorced/separated' },
    { pattern: /\b(married|got married|wedding)\b/i, key: 'relationship_status', value: 'married' },
    { pattern: /\b(engaged|engagement)\b/i, key: 'relationship_status', value: 'engaged' },
    { pattern: /\b(broke up|ended relationship)\b/i, key: 'relationship_status', value: 'broke up' },
  ];

  for (const rel of relationshipPatterns) {
    if (rel.pattern.test(text)) {
      memories.push({
        category: 'relationship',
        key: rel.key,
        value: rel.value,
        importance: 4,
        confidence: 4,
      });
      console.log('[LocalExtract] Detected: relationship status', rel.value);
      break; // Only add first match
    }
  }

  // Rule 6: Location/residence
  const locationPatterns = [
    /\b(moved to|living in|lives in|relocated to) ([A-Z][a-zA-Z\s]+)/,
    /\bin ([A-Z][a-zA-Z\s]+) (now|currently)/,
  ];

  for (const pattern of locationPatterns) {
    const match = pattern.exec(text);
    if (match) {
      const location = match[match.length - 1].trim();
      if (location.length > 2 && location.length < 50) {
        memories.push({
          category: 'location',
          key: 'current_location',
          value: location,
          importance: 2,
          confidence: 3,
        });
        console.log('[LocalExtract] Detected: location', location);
        break;
      }
    }
  }

  console.log('[LocalExtract] Extracted', memories.length, 'memories from user text');
  return memories;
}
