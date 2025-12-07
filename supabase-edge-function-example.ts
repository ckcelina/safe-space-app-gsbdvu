
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
  sender: 'user' | 'ai';
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

    console.log('Generating AI response for person:', personName);
    console.log('Relationship type:', personRelationshipType);
    console.log('Current subject:', currentSubject);
    console.log('Message history length:', messages.length);

    // Build the system prompt
    let systemPrompt = `You are a compassionate and empathetic AI therapist helping someone talk through their feelings about people in their life. The person they're discussing is named ${personName} (${personRelationshipType}). Listen actively, ask thoughtful questions, and provide supportive guidance. Keep responses concise and conversational.`;

    // IMPORTANT: Add subject context to the AI prompt if provided
    if (currentSubject && currentSubject.trim()) {
      systemPrompt += `\n\nCurrent focus of this conversation: ${currentSubject}. Please tailor your response to this subject.`;
    }

    // Convert messages to OpenAI format
    const openAIMessages = messages.map((msg) => ({
      role: msg.sender === 'user' ? 'user' : 'assistant',
      content: msg.content,
    }));

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
          ...openAIMessages,
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
