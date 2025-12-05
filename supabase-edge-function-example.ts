
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
  role: string;
  content: string;
}

interface RequestBody {
  person_id: string;
  messages: Message[];
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
    const { person_id, messages }: RequestBody = await req.json();

    console.log('Generating AI response for person:', person_id);
    console.log('Message history length:', messages.length);

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
            content: 'You are a compassionate and empathetic AI therapist helping someone talk through their feelings about people in their life. Listen actively, ask thoughtful questions, and provide supportive guidance. Keep responses concise and conversational.',
          },
          ...messages,
        ],
        temperature: 0.7,
        max_tokens: 500,
      }),
    });

    if (!response.ok) {
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
