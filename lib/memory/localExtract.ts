
/**
 * Local memory extraction from user text
 * 
 * This module provides lightweight, rule-based memory extraction that works
 * even when the AI Edge Function fails. It extracts stable facts only.
 * 
 * IMPROVED: Tighter rules to avoid low-signal extractions
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
 * IMPROVED RULES:
 * - Only store stable facts with clear context
 * - Avoid generic age references unless tied to medical/major events
 * - Require labeled keys for numbers
 * - Focus on: death, medical history, relationship changes, major dates
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

  // Rule 1: Death/Loss detection (HIGH PRIORITY)
  const deathPatterns = [
    /\b(died|passed away|deceased|late|rip|rest in peace)\b/i,
    /\bno longer (with us|here|alive)\b/i,
    /\blost (him|her|them)\b/i,
    /\b(death|funeral|burial|cremation)\b/i,
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

  // Rule 2: Medical history - ONLY store if clearly stated
  const medicalConditions = [
    { 
      pattern: /\b(kidney failure|renal failure|kidney disease)\b/i, 
      key: 'medical_history:kidney_condition',
      value: 'kidney failure (mentioned)',
      importance: 4,
    },
    { 
      pattern: /\b(cancer|tumor|malignant|chemotherapy|radiation therapy)\b/i, 
      key: 'medical_history:cancer',
      value: 'cancer (mentioned)',
      importance: 4,
    },
    { 
      pattern: /\b(heart attack|cardiac arrest|heart disease|coronary)\b/i, 
      key: 'medical_history:heart_condition',
      value: 'heart condition (mentioned)',
      importance: 4,
    },
    { 
      pattern: /\b(stroke|cerebrovascular|brain hemorrhage)\b/i, 
      key: 'medical_history:stroke',
      value: 'stroke (mentioned)',
      importance: 4,
    },
    { 
      pattern: /\b(alzheimer|dementia|cognitive decline)\b/i, 
      key: 'medical_history:cognitive_condition',
      value: 'cognitive condition (mentioned)',
      importance: 4,
    },
    { 
      pattern: /\b(diabetes|diabetic|insulin)\b/i, 
      key: 'medical_history:diabetes',
      value: 'diabetes (mentioned)',
      importance: 3,
    },
  ];

  for (const condition of medicalConditions) {
    if (condition.pattern.test(text)) {
      // Check if we already have a medical_history entry
      const existingMedical = memories.find(
        (m) => m.key.startsWith('medical_history:')
      );
      
      if (!existingMedical) {
        memories.push({
          category: 'history',
          key: condition.key,
          value: condition.value,
          importance: condition.importance,
          confidence: 4,
        });
        console.log('[LocalExtract] Detected: medical condition', condition.value);
        break; // Only add first match
      }
    }
  }

  // Rule 3: Age reference - ONLY if tied to medical/major event
  // Example: "He got kidney failure when he was 10" => store with context
  const contextualAgePatterns = [
    {
      pattern: /when (he|she|they) (was|were) (\d+)[,\s]+(kidney|cancer|heart|stroke|died|passed)/i,
      contextExtractor: (match: RegExpMatchArray) => {
        const age = match[3];
        const condition = match[4];
        return {
          key: `medical_history:${condition.toLowerCase()}_age`,
          value: `${condition} at age ${age}`,
        };
      },
    },
    {
      pattern: /(kidney|cancer|heart|stroke|died|passed)[^.]*when (he|she|they) (was|were) (\d+)/i,
      contextExtractor: (match: RegExpMatchArray) => {
        const condition = match[1];
        const age = match[4];
        return {
          key: `medical_history:${condition.toLowerCase()}_age`,
          value: `${condition} at age ${age}`,
        };
      },
    },
  ];

  for (const agePattern of contextualAgePatterns) {
    const match = agePattern.pattern.exec(text);
    if (match) {
      const extracted = agePattern.contextExtractor(match);
      memories.push({
        category: 'history',
        key: extracted.key,
        value: extracted.value,
        importance: 4,
        confidence: 4,
      });
      console.log('[LocalExtract] Detected: contextual age reference', extracted.value);
      break; // Only add first match
    }
  }

  // Rule 4: Relationship status changes (STABLE FACTS ONLY)
  const relationshipPatterns = [
    { 
      pattern: /\b(divorced|separated|split up|ended marriage)\b/i, 
      key: 'relationship_status', 
      value: 'divorced/separated',
      importance: 4,
    },
    { 
      pattern: /\b(married|got married|wedding|spouse)\b/i, 
      key: 'relationship_status', 
      value: 'married',
      importance: 4,
    },
    { 
      pattern: /\b(engaged|engagement|fianc[eé])\b/i, 
      key: 'relationship_status', 
      value: 'engaged',
      importance: 3,
    },
  ];

  for (const rel of relationshipPatterns) {
    if (rel.pattern.test(text)) {
      memories.push({
        category: 'relationship',
        key: rel.key,
        value: rel.value,
        importance: rel.importance,
        confidence: 4,
      });
      console.log('[LocalExtract] Detected: relationship status', rel.value);
      break; // Only add first match
    }
  }

  // Rule 5: Major life events (births, deaths, moves)
  const majorEventPatterns = [
    {
      pattern: /\b(had a baby|gave birth|became a (mother|father|parent))\b/i,
      key: 'major_life_event',
      value: 'became a parent',
      importance: 4,
    },
    {
      pattern: /\b(moved to|relocated to|living in) ([A-Z][a-zA-Z\s]{2,30})/i,
      keyExtractor: () => 'current_location',
      valueExtractor: (match: RegExpMatchArray) => match[2].trim(),
      importance: 3,
    },
    {
      pattern: /\b(retired|retirement)\b/i,
      key: 'major_life_event',
      value: 'retired',
      importance: 3,
    },
  ];

  for (const event of majorEventPatterns) {
    const match = event.pattern.exec(text);
    if (match) {
      const key = event.keyExtractor ? event.keyExtractor() : event.key;
      const value = event.valueExtractor ? event.valueExtractor(match) : event.value;
      
      if (value && value.length > 2 && value.length < 100) {
        memories.push({
          category: event.key === 'current_location' ? 'location' : 'history',
          key: key!,
          value: value!,
          importance: event.importance,
          confidence: 3,
        });
        console.log('[LocalExtract] Detected: major life event', value);
        break;
      }
    }
  }

  console.log('[LocalExtract] Extracted', memories.length, 'memories from user text');
  return memories;
}
