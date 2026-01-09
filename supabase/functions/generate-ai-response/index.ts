
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";
import { getMemoryProfile } from './therapist-memory-profiles.ts';
import { extractMemoryNotes, formatMemoryContext } from './memory-extraction.ts';

const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface RequestBody {
  personId: string;
  personName: string;
  messages: Message[];
  therapistId?: string;
  userId?: string;
}

serve(async (req) => {
  // CORS headers
  if (req.method === "OPTIONS") {
    return new Response(null, {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
      },
    });
  }

  try {
    const { personId, personName, messages, therapistId = 'dr-elias', userId } = await req.json() as RequestBody;

    if (!OPENAI_API_KEY) {
      throw new Error("OPENAI_API_KEY not configured");
    }

    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error("Supabase not configured");
    }

    // Initialize Supabase client
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Get therapist memory profile
    const memoryProfile = getMemoryProfile(therapistId);

    // Fetch existing memory notes for this user + therapist
    let memoryContext = '';
    if (userId) {
      const { data: memoryNotes } = await supabase
        .from('user_memory_notes')
        .select('key_points, patterns')
        .eq('user_id', userId)
        .eq('therapist_id', therapistId)
        .single();

      if (memoryNotes) {
        memoryContext = formatMemoryContext(
          memoryNotes.key_points || [],
          memoryNotes.patterns || [],
          memoryProfile.memoryBehavior.recallStyle
        );
      }
    }

    // Build system prompt with memory context
    const systemPrompt = `You are ${memoryProfile.name}, a compassionate therapist.

You are helping the user talk about ${personName}.${memoryContext}

Respond naturally and empathetically. Use memory context subtly to show continuity.`;

    // Call OpenAI
    const openaiResponse = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o",
        messages: [
          { role: "system", content: systemPrompt },
          ...messages,
        ],
        temperature: 0.7,
        max_tokens: 500,
      }),
    });

    if (!openaiResponse.ok) {
      const errorText = await openaiResponse.text();
      throw new Error(`OpenAI API error: ${openaiResponse.status} - ${errorText}`);
    }

    const openaiData = await openaiResponse.json();
    const aiReply = openaiData.choices?.[0]?.message?.content || "I'm here to listen.";

    // Extract and update memory notes (async, don't block response)
    if (userId && messages.length > 0) {
      const lastUserMessage = messages[messages.length - 1]?.content || '';
      
      extractMemoryNotes(lastUserMessage, aiReply, memoryProfile, OPENAI_API_KEY)
        .then(async ({ keyPoints, patterns }) => {
          if (keyPoints.length > 0 || patterns.length > 0) {
            // Upsert memory notes
            await supabase
              .from('user_memory_notes')
              .upsert({
                user_id: userId,
                therapist_id: therapistId,
                key_points: keyPoints,
                patterns: patterns,
                updated_at: new Date().toISOString(),
              }, {
                onConflict: 'user_id,therapist_id',
              });
          }
        })
        .catch(err => console.error('Memory update failed:', err));
    }

    return new Response(
      JSON.stringify({ reply: aiReply }),
      {
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
      }
    );
  } catch (error) {
    console.error("Edge function error:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Internal server error" }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
      }
    );
  }
});
