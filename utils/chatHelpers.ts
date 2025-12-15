
/**
 * Chat Helper Functions
 * 
 * Utilities for managing chat state, loop detection, and message processing
 */

/**
 * Check if two strings are too similar (for loop detection)
 * 
 * @param str1 - First string to compare
 * @param str2 - Second string to compare
 * @returns true if strings are too similar (potential loop)
 */
export function areSimilarMessages(str1: string, str2: string): boolean {
  // Normalize strings: lowercase, trim, remove punctuation
  const normalize = (s: string) => s.toLowerCase().trim().replace(/[.,!?;:]/g, '');
  const norm1 = normalize(str1);
  const norm2 = normalize(str2);

  // Check if they start with the same phrase (first 20 chars)
  const prefix1 = norm1.substring(0, 20);
  const prefix2 = norm2.substring(0, 20);
  
  if (prefix1 === prefix2 && prefix1.length > 10) {
    console.log('[Loop Detection] Same prefix detected:', prefix1);
    return true;
  }

  // Check if one contains the other (for short messages)
  if (norm1.length < 50 && norm2.length < 50) {
    if (norm1.includes(norm2) || norm2.includes(norm1)) {
      console.log('[Loop Detection] One message contains the other');
      return true;
    }
  }

  // Check for exact match
  if (norm1 === norm2) {
    console.log('[Loop Detection] Exact match detected');
    return true;
  }

  return false;
}

/**
 * Get a stable chat ID from person ID or topic ID
 * 
 * @param personId - The person or topic ID
 * @returns A stable chat identifier
 */
export function getChatId(personId: string): string {
  return personId;
}

/**
 * Validate that a message should trigger AI generation
 * 
 * @param params - Validation parameters
 * @returns true if AI should generate a response
 */
export function shouldGenerateAIResponse(params: {
  isSending: boolean;
  isGenerating: boolean;
  lastMessageRole: 'user' | 'assistant' | null;
  lastProcessedUserMessageId: string | null;
  currentUserMessageId: string;
}): boolean {
  const { isSending, isGenerating, lastMessageRole, lastProcessedUserMessageId, currentUserMessageId } = params;

  // Guard 1: Already sending or generating
  if (isSending || isGenerating) {
    console.log('[Chat Guard] Already sending/generating, skipping');
    return false;
  }

  // Guard 2: Last message is already from assistant
  if (lastMessageRole === 'assistant') {
    console.log('[Chat Guard] Last message is from assistant, skipping');
    return false;
  }

  // Guard 3: This user message has already been processed
  if (lastProcessedUserMessageId === currentUserMessageId) {
    console.log('[Chat Guard] Message already processed, skipping');
    return false;
  }

  return true;
}

/**
 * Format messages for AI API call
 * 
 * @param messages - Array of messages from database
 * @param currentSubject - Current conversation subject
 * @param maxMessages - Maximum number of messages to include (default 20)
 * @returns Formatted messages for AI
 */
export function formatMessagesForAI(
  messages: { role: 'user' | 'assistant'; content: string; subject?: string; created_at: string }[],
  currentSubject: string,
  maxMessages: number = 20
): { role: 'user' | 'assistant'; content: string; createdAt: string }[] {
  // Filter by current subject
  const subjectMessages = messages.filter((msg) => {
    const msgSubject = msg.subject || 'General';
    return msgSubject === currentSubject;
  });

  // Take last N messages
  const recentMessages = subjectMessages.slice(-maxMessages);

  // Format for AI
  return recentMessages.map((msg) => ({
    role: msg.role,
    content: msg.content,
    createdAt: msg.created_at,
  }));
}

/**
 * Log chat debug information
 * 
 * @param params - Debug parameters
 */
export function logChatDebug(params: {
  chatId: string;
  messageCount: number;
  lastUserMessageId: string | null;
  lastProcessedUserMessageId: string | null;
  isSending: boolean;
  isGenerating: boolean;
  subject: string;
}): void {
  console.log('=== Chat Debug Info ===');
  console.log('Chat ID:', params.chatId);
  console.log('Message count:', params.messageCount);
  console.log('Last user message ID:', params.lastUserMessageId);
  console.log('Last processed ID:', params.lastProcessedUserMessageId);
  console.log('Is sending:', params.isSending);
  console.log('Is generating:', params.isGenerating);
  console.log('Current subject:', params.subject);
  console.log('======================');
}
