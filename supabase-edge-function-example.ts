
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

    // CRITICAL: Build comprehensive system prompt with context
    let systemPrompt = `You are a compassionate and empathetic AI therapist helping someone talk through their feelings about people in their life. The person they're discussing is named ${personName}`;
    
    // Add relationship context
    if (personRelationshipType && personRelationshipType !== 'Unknown') {
      systemPrompt += ` (their ${personRelationshipType})`;
    }
    
    systemPrompt += `. Listen actively, ask thoughtful questions, and provide supportive guidance. Keep responses concise and conversational.`;

    // CRITICAL: Add subject context to the AI prompt if provided
    if (currentSubject && currentSubject.trim() && currentSubject !== 'General') {
      systemPrompt += `\n\nCurrent focus of this conversation: ${currentSubject}. Please tailor your response to this specific subject and acknowledge what the user has shared about it.`;
    }

    // CRITICAL: Add context about deceased status if mentioned in conversation
    const conversationText = messages.map(m => m.content).join(' ').toLowerCase();
    if (conversationText.includes('passed away') || 
        conversationText.includes('died') || 
        conversationText.includes('deceased') ||
        conversationText.includes('lost him') ||
        conversationText.includes('lost her')) {
      systemPrompt += `\n\nIMPORTANT: The user has mentioned that ${personName} has passed away. Be sensitive to this and acknowledge their grief. Do not ask questions as if the person is still alive.`;
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
    const reply = data.choices[0]?.message?.content || 'I understand. Tell me more.';

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
        reply: 'I apologize, but I am having trouble responding right now. Please try again.',
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
