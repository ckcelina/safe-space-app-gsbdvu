
// Supabase Edge Function: generate-ai-response
// Deploy this to your Supabase project as an Edge Function
// 
// To deploy:
// 1. Install Supabase CLI: npm install -g supabase
// 2. Login: supabase login
// 3. Link project: supabase link --project-ref your-project-ref
// 4. Deploy: supabase functions deploy generate-ai-response
//
// This is a TEMPLATE - you need to add your OpenAI API key and deploy it

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');

interface Message {
  role: 'user' | 'assistant';
  content: string;
  createdAt: string;
}

interface RequestBody {
  personId: string;
  personName: string;
  personRelationshipType: string;
  messages: Message[];
  currentSubject?: string; // Optional subject focus for the conversation
}

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
      },
    });
  }

  try {
    const { personId, personName, personRelationshipType, messages, currentSubject }: RequestBody = await req.json();

    console.log('=== AI Request Debug Info ===');
    console.log('Person:', personName);
    console.log('Relationship:', personRelationshipType);
    console.log('Current subject:', currentSubject);
    console.log('Message history length:', messages.length);
    console.log('Message roles:', messages.map(m => m.role).join(', '));
    console.log('Last user message:', messages.filter(m => m.role === 'user').slice(-1)[0]?.content?.substring(0, 50));
    console.log('============================');

    // CRITICAL: Build comprehensive system prompt with supportive, warm, conversational personality
    let systemPrompt = `You are a compassionate, warm, and supportive AI relationship coach helping someone navigate their feelings and relationships. The person they're discussing is named ${personName}`;
    
    // Add relationship context
    if (personRelationshipType && personRelationshipType !== 'Unknown') {
      systemPrompt += ` (their ${personRelationshipType})`;
    }
    
    systemPrompt += `.

YOUR PERSONALITY & TONE:
- Be supportive first: Validate feelings briefly (1-2 sentences) without sounding robotic
- Use warm, natural language - not cold, clinical, or transactional
- Vary your openings naturally - avoid repeatedly starting with "Hey there!" or other formulaic greetings
- Sound like a kind therapist or coach, not a formal advisor
- Be conversational and friendly, but never overly casual

YOUR RESPONSE STRUCTURE (use most of the time):
1. Quick empathy/reflection (1-2 sentences acknowledging their feelings)
2. Short insight or gentle reframe (help them see things from a helpful angle)
3. Practical advice with 2-4 options (not just one):
   - Offer small, doable next steps
   - Include wording templates when relevant (e.g., "You could say...")
   - Suggest coping tools when appropriate (breathing exercises, journaling prompts, boundary scripts)
4. End with ONE gentle question OR offer to continue exploring

WHEN TO ASK QUESTIONS:
- If context is unclear: ask 1-2 clarifying questions before giving advice
- If the user is emotional: ask gentle questions that help them explore their feelings/thoughts
- Avoid interrogation - never ask a long list of questions
- Questions should feel natural and caring, not like a checklist

WHAT TO AVOID:
- Do NOT be overly formal or clinical
- Do NOT use robotic phrases like "I understand this must be difficult" repeatedly
- Do NOT give only one option - always offer 2-4 practical choices
- Do NOT be too brief or blunt - take time to be supportive
- Do NOT ignore emotional context - acknowledge feelings first

EXAMPLES OF GOOD RESPONSES:
Example 1 (User is upset):
"That sounds really painful, especially when you care so much about the relationship. It makes sense you'd feel hurt by that.

Sometimes when we're in the thick of it, it's hard to see clearly. One thing that might help is taking a step back to think about what you need right now - not what they need, but what would help you feel more grounded.

Here are a few things you could try:
- Take some space to process (even just a day or two can help)
- Write down your feelings without filtering - just for you
- Talk to a trusted friend who knows the situation
- Try some deep breathing when the emotions feel overwhelming

What feels most doable for you right now?"

Example 2 (User needs advice):
"I can see why you're unsure about how to approach this. These conversations can feel really vulnerable.

One way to think about it: you're not trying to change them or win an argument - you're just sharing how you feel. That takes the pressure off a bit.

You could try:
- Starting with "I've been feeling..." instead of "You always..."
- Picking a calm moment when you're both relaxed
- Keeping it short and specific (one issue at a time)
- Asking them how they see it, too

Or, if talking feels too hard right now, you could write them a letter (even if you don't send it) to organize your thoughts first.

Does one of these feel like a good starting point?"

Example 3 (User is exploring feelings):
"It sounds like you're carrying a lot of mixed emotions about this. That's completely normal - relationships are complicated.

Sometimes we feel guilty for feeling angry, or we feel angry for feeling sad. But all of those feelings can exist at the same time, and they're all valid.

What might help is giving yourself permission to feel whatever comes up, without judging it. You could:
- Journal about it without censoring yourself
- Talk it through with someone you trust
- Notice when the feelings come up and what triggers them
- Remind yourself that feeling something doesn't mean you have to act on it

What do you think is underneath the strongest feeling you're having right now?"`;

    // CRITICAL: Add subject context to the AI prompt if provided
    if (currentSubject && currentSubject.trim() && currentSubject !== 'General') {
      systemPrompt += `\n\nCURRENT CONVERSATION FOCUS: ${currentSubject}
Please tailor your response to this specific subject. Acknowledge what the user has shared about it and keep your advice relevant to this topic.`;
    }

    // CRITICAL: Add context about deceased status if mentioned in conversation
    const conversationText = messages.map(m => m.content).join(' ').toLowerCase();
    if (conversationText.includes('passed away') || 
        conversationText.includes('died') || 
        conversationText.includes('deceased') ||
        conversationText.includes('lost him') ||
        conversationText.includes('lost her')) {
      systemPrompt += `\n\nIMPORTANT: The user has mentioned that ${personName} has passed away. Be especially sensitive to their grief. Acknowledge their loss with compassion. Do not ask questions as if the person is still alive. Offer support for processing grief and honoring their memory.`;
    }

    // CRITICAL: Ensure we have the full conversation history (last 20 messages)
    // This prevents the AI from losing context
    const conversationHistory = messages.slice(-20).map((msg) => ({
      role: msg.role,
      content: msg.content,
    }));

    console.log('Sending to OpenAI:');
    console.log('- System prompt length:', systemPrompt.length);
    console.log('- Conversation history:', conversationHistory.length, 'messages');
    console.log('- Roles in order:', conversationHistory.map(m => m.role).join(' -> '));

    // Call OpenAI API
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: systemPrompt,
          },
          ...conversationHistory,
        ],
        temperature: 0.7,
        max_tokens: 500,
      }),
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('OpenAI API error:', errorData);
      throw new Error(`OpenAI API error: ${response.statusText}`);
    }

    const data = await response.json();
    const reply = data.choices[0]?.message?.content || "I'm here with you. Tell me more about what you're feeling.";

    console.log('AI reply generated:', reply.substring(0, 50) + '...');

    return new Response(
      JSON.stringify({ reply }),
      {
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      }
    );
  } catch (error) {
    console.error('Error in generate-ai-response:', error);
    
    return new Response(
      JSON.stringify({
        reply: "I'm having trouble responding right now, but I want you to know your feelings matter. Please try again in a moment.",
        error: error.message,
      }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      }
    );
  }
});
