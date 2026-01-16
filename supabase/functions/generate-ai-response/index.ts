
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

interface Message {
  role: 'user' | 'assistant';
  content: string;
  createdAt: string;
  type?: 'text' | 'image';
  image_url?: string;
}

interface RequestBody {
  personId: string;
  personName: string;
  personRelationshipType?: string;
  messages: Message[];
  currentSubject?: string;
  aiToneId?: string;
  aiScienceMode?: boolean;
  userId: string;
  therapistId?: string;
}

const AI_TONE_INSTRUCTIONS: Record<string, string> = {
  warm: 'Use a warm, empathetic tone with gentle encouragement.',
  direct: 'Be direct and straightforward while remaining supportive.',
  analytical: 'Provide thoughtful, analytical insights with clear reasoning.',
  playful: 'Use a light, playful tone while maintaining professionalism.',
};

function getToneSystemInstruction(toneId?: string): string {
  if (!toneId || !AI_TONE_INSTRUCTIONS[toneId]) {
    return AI_TONE_INSTRUCTIONS.warm;
  }
  return AI_TONE_INSTRUCTIONS[toneId];
}

function generateAISystemPrompt(params: {
  personName: string;
  relationshipType?: string;
  currentSubject?: string;
  hasDeathMention?: boolean;
  aiToneId?: string;
  aiScienceMode?: boolean;
  memoryContext?: string;
}): string {
  const {
    personName,
    relationshipType,
    currentSubject,
    hasDeathMention,
    aiToneId,
    aiScienceMode,
    memoryContext,
  } = params;

  const toneInstruction = getToneSystemInstruction(aiToneId);
  const scienceNote = aiScienceMode
    ? ' Include evidence-based insights and psychological frameworks when relevant.'
    : '';

  let basePrompt = `You are a compassionate AI therapist helping someone process their feelings about ${personName}`;
  
  if (relationshipType) {
    basePrompt += ` (their ${relationshipType})`;
  }
  
  basePrompt += `.${scienceNote} ${toneInstruction}`;

  if (currentSubject) {
    basePrompt += `\n\nCurrent conversation topic: ${currentSubject}`;
  }

  if (hasDeathMention) {
    basePrompt += `\n\nIMPORTANT: This person has passed away. Be especially gentle, validate their grief, and help them process their loss with compassion.`;
  }

  if (memoryContext) {
    basePrompt += `\n\n${memoryContext}`;
  }

  basePrompt += `\n\nProvide supportive, therapeutic responses that help the user process their emotions and gain insights.`;

  return basePrompt;
}

function detectDeathMention(messages: Message[]): boolean {
  if (!messages || messages.length === 0) {
    return false;
  }
  
  const deathKeywords = ['passed away', 'died', 'death', 'deceased', 'lost them', 'no longer with us', 'gone'];
  const recentMessages = messages.slice(-10);
  
  return recentMessages.some(msg => {
    if (!msg || !msg.content || typeof msg.content !== 'string') {
      return false;
    }
    const content = msg.content.toLowerCase();
    return deathKeywords.some(keyword => content.includes(keyword));
  });
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
        'Access-Control-Max-Age': '86400',
      },
    });
  }
  
  // Only allow POST requests
  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({ error: 'Method not allowed. Use POST.' }),
      { 
        status: 405, 
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type'
        } 
      }
    );
  }
  
  try {
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/86105c35-01e6-4810-8ad5-4dfce4695369',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'generate-ai-response/index.ts:106',message:'Parsing request body',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
    // #endregion
    
    let requestBody: RequestBody;
    try {
      requestBody = await req.json();
    } catch (jsonError: any) {
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/86105c35-01e6-4810-8ad5-4dfce4695369',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'generate-ai-response/index.ts:114',message:'JSON parsing error',data:{errorMessage:jsonError?.message,errorType:jsonError?.constructor?.name},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
      // #endregion
      return new Response(
        JSON.stringify({ error: 'Invalid JSON in request body' }),
        { 
          status: 400, 
          headers: { 
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'POST, OPTIONS',
            'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type'
          } 
        }
      );
    }
    
    const {
      personId,
      personName,
      personRelationshipType,
      messages,
      currentSubject,
      aiToneId,
      aiScienceMode,
      userId,
      therapistId,
    } = requestBody;

    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/86105c35-01e6-4810-8ad5-4dfce4695369',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'generate-ai-response/index.ts:121',message:'Request body parsed successfully',data:{personId:!!personId,personName:!!personName,userId:!!userId,messageCount:messages?.length||0,hasMessages:!!messages},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
    // #endregion

    // Validate required fields
    if (!personId || !personName || !userId || !messages || !Array.isArray(messages) || messages.length === 0) {
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/86105c35-01e6-4810-8ad5-4dfce4695369',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'generate-ai-response/index.ts:125',message:'Missing required fields',data:{personId:!!personId,personName:!!personName,userId:!!userId,hasMessages:!!messages,isArray:Array.isArray(messages),messageCount:messages?.length||0},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
      // #endregion
      return new Response(
        JSON.stringify({ error: 'Missing required fields: personId, personName, userId, and messages are required' }),
        { 
          status: 400, 
          headers: { 
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'POST, OPTIONS',
            'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type'
          } 
        }
      );
    }

    console.log('[generate-ai-response] Request received', {
      personId,
      personName,
      userId,
      therapistId,
      messageCount: messages.length,
      hasImages: messages.some(m => m.type === 'image'),
    });

    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/86105c35-01e6-4810-8ad5-4dfce4695369',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'generate-ai-response/index.ts:125',message:'Checking environment variables',data:{hasOpenAIKey:!!OPENAI_API_KEY,hasSupabaseUrl:!!SUPABASE_URL,hasSupabaseKey:!!SUPABASE_SERVICE_KEY},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
    // #endregion

    if (!OPENAI_API_KEY) {
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/86105c35-01e6-4810-8ad5-4dfce4695369',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'generate-ai-response/index.ts:126',message:'OPENAI_API_KEY missing',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
      // #endregion
      console.error('[generate-ai-response] OPENAI_API_KEY not configured');
      return new Response(
        JSON.stringify({ error: 'OpenAI API key not configured' }),
        { 
          status: 500, 
          headers: { 
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'POST, OPTIONS',
            'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type'
          } 
        }
      );
    }

    // Validate Supabase environment variables
    if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
      console.error('[generate-ai-response] Missing Supabase environment variables', {
        hasUrl: !!SUPABASE_URL,
        hasKey: !!SUPABASE_SERVICE_KEY,
      });
      return new Response(
        JSON.stringify({ error: 'Server configuration error' }),
        { 
          status: 500, 
          headers: { 
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'POST, OPTIONS',
            'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type'
          } 
        }
      );
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

    // Fetch therapist memory notes if therapistId is provided
    let memoryContext = '';
    let existingMemoryNotes = null;
    
    if (therapistId && userId) {
      console.log('[generate-ai-response] Fetching therapist memory notes', { userId, therapistId });
      
      const { data: memoryNotes, error: memoryError } = await supabase
        .from('therapist_memory_notes')
        .select('*')
        .eq('user_id', userId)
        .eq('therapist_id', therapistId)
        .single();

      if (memoryError && memoryError.code !== 'PGRST116') {
        console.error('[generate-ai-response] Error fetching memory notes:', memoryError);
      } else if (memoryNotes) {
        existingMemoryNotes = memoryNotes;
        console.log('[generate-ai-response] Memory notes found', {
          incidents: memoryNotes.recent_incidents?.length || 0,
          patterns: memoryNotes.recurring_patterns?.length || 0,
          triggers: memoryNotes.triggers?.length || 0,
          strategies: memoryNotes.helpful_strategies?.length || 0,
        });

        // Build memory context for system prompt
        const incidents = memoryNotes.recent_incidents?.filter(Boolean).join('; ') || 'None yet';
        const patterns = memoryNotes.recurring_patterns?.filter(Boolean).join('; ') || 'None identified';
        const triggers = memoryNotes.triggers?.filter(Boolean).join('; ') || 'None identified';
        const strategies = memoryNotes.helpful_strategies?.filter(Boolean).join('; ') || 'None identified';

        memoryContext = `**Therapist Memory Context:**
- Recent incidents: ${incidents}
- Recurring patterns: ${patterns}
- Triggers: ${triggers}
- Helpful strategies: ${strategies}

Use this context to provide more personalized and consistent support. Reference past patterns when relevant.`;
      } else {
        console.log('[generate-ai-response] No existing memory notes found');
      }
    }

    // Detect if conversation mentions death/loss
    const hasDeathMention = detectDeathMention(messages);

    // Generate system prompt
    const systemPrompt = generateAISystemPrompt({
      personName,
      relationshipType: personRelationshipType,
      currentSubject,
      hasDeathMention,
      aiToneId,
      aiScienceMode,
      memoryContext,
    });

    // Check if latest message is an image
    const latestMessage = messages[messages.length - 1];
    
    if (!latestMessage) {
      console.error('[generate-ai-response] No messages found after validation');
      return new Response(
        JSON.stringify({ error: 'Invalid message data' }),
        { 
          status: 400, 
          headers: { 
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'POST, OPTIONS',
            'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type'
          } 
        }
      );
    }
    
    let openaiMessages: any[] = [];

    if (latestMessage.type === 'image' && latestMessage.image_url) {
      console.log('[generate-ai-response] Processing image message', { image_url: latestMessage.image_url });
      
      // Get signed URL for image
      const { data: signedUrlData, error: signedUrlError } = await supabase.storage
        .from('chat-images')
        .createSignedUrl(latestMessage.image_url, 3600);

      if (signedUrlError || !signedUrlData) {
        console.error('[generate-ai-response] Error creating signed URL:', signedUrlError);
        return new Response(
          JSON.stringify({ error: 'Failed to access uploaded image' }),
          { 
            status: 500, 
            headers: { 
              'Content-Type': 'application/json',
              'Access-Control-Allow-Origin': '*',
              'Access-Control-Allow-Methods': 'POST, OPTIONS',
              'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type'
            } 
          }
        );
      }

      console.log('[generate-ai-response] Signed URL created for image');

      // Include previous text messages for context (last 5)
      const previousTextMessages = messages
        .slice(-6, -1)
        .filter(m => m && m.type !== 'image' && m.content && typeof m.content === 'string')
        .map(m => ({
          role: m.role === 'user' ? 'user' : 'assistant',
          content: m.content as string,
        }));

      // Use vision model with image
      openaiMessages = [
        {
          role: 'system',
          content: systemPrompt,
        },
        ...previousTextMessages,
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: 'I\'ve shared an image with you. Please analyze it and provide supportive insights based on what you see. This might be a screenshot of a conversation, a photo that\'s meaningful to me, or something else I want to discuss.',
            },
            {
              type: 'image_url',
              image_url: {
                url: signedUrlData.signedUrl,
                detail: 'high',
              },
            },
          ],
        },
      ];
    } else {
      // Text-only conversation
      // Filter and validate messages before mapping
      const validMessages = messages.filter(m => 
        m && 
        (m.role === 'user' || m.role === 'assistant') &&
        (m.content && typeof m.content === 'string' || m.type === 'image')
      );
      
      openaiMessages = [
        {
          role: 'system',
          content: systemPrompt,
        },
        ...validMessages.map((m) => ({
          role: m.role === 'user' ? 'user' : 'assistant',
          content: m.type === 'image' ? '[Image]' : (m.content as string),
        })),
      ];
    }

    // Call OpenAI with appropriate model
    const model = latestMessage.type === 'image' ? 'gpt-4o' : 'gpt-4o';
    
    console.log('[generate-ai-response] Calling OpenAI', { model, messageCount: openaiMessages.length });

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        messages: openaiMessages,
        temperature: 0.7,
        max_tokens: 800,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[generate-ai-response] OpenAI API error:', {
        status: response.status,
        statusText: response.statusText,
        error: errorText,
      });
      return new Response(
        JSON.stringify({ error: `OpenAI API error: ${response.statusText}` }),
        { 
          status: response.status, 
          headers: { 
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'POST, OPTIONS',
            'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type'
          } 
        }
      );
    }

    let aiData: any;
    try {
      aiData = await response.json();
    } catch (jsonError: any) {
      console.error('[generate-ai-response] Failed to parse OpenAI response JSON:', jsonError);
      const responseText = await response.text().catch(() => 'Unable to read response');
      console.error('[generate-ai-response] Response text:', responseText.substring(0, 500));
      return new Response(
        JSON.stringify({ error: 'Failed to parse OpenAI response' }),
        { 
          status: 500, 
          headers: { 
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'POST, OPTIONS',
            'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type'
          } 
        }
      );
    }
    
    const aiReply = aiData?.choices?.[0]?.message?.content;

    if (!aiReply || typeof aiReply !== 'string') {
      console.error('[generate-ai-response] No valid reply from OpenAI', {
        hasData: !!aiData,
        hasChoices: !!aiData?.choices,
        choicesLength: aiData?.choices?.length || 0,
        hasMessage: !!aiData?.choices?.[0]?.message,
        hasContent: !!aiData?.choices?.[0]?.message?.content,
        contentType: typeof aiData?.choices?.[0]?.message?.content,
      });
      return new Response(
        JSON.stringify({ error: 'No valid response from AI' }),
        { 
          status: 500, 
          headers: { 
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'POST, OPTIONS',
            'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type'
          } 
        }
      );
    }

    console.log('[generate-ai-response] AI reply generated', { length: aiReply.length });

    // Extract and update memory notes if therapistId is provided
    if (therapistId && userId) {
      console.log('[generate-ai-response] Extracting memory insights');
      
      try {
        // Get recent conversation context (last 5 messages + current AI response)
        const recentContext = messages
          .slice(-5)
          .filter(m => m && m.content && typeof m.content === 'string')
          .map(m => `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.content}`)
          .join('\n');

        const extractPrompt = `Based on this therapy conversation, extract key information to help provide better ongoing support. Be concise and focus on actionable insights.

Recent conversation:
${recentContext}

Current AI response:
${aiReply}

Extract and return ONLY a JSON object with these fields (each should be an array of brief strings, max 3-5 items each):
{
  "recent_incidents": ["brief description of recent events or situations mentioned"],
  "recurring_patterns": ["patterns in thoughts, behaviors, or emotions"],
  "triggers": ["identified triggers or stressors"],
  "helpful_strategies": ["strategies or approaches that seem helpful"]
}

Keep each item brief (under 100 characters). Focus on NEW information not already captured. If nothing new, return empty arrays.`;

        const extractResponse = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${OPENAI_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'gpt-4o-mini',
            messages: [{ role: 'user', content: extractPrompt }],
            response_format: { type: 'json_object' },
            temperature: 0.3,
          }),
        });

        if (extractResponse.ok) {
          let extractData: any;
          try {
            extractData = await extractResponse.json();
          } catch (jsonError: any) {
            console.error('[generate-ai-response] Failed to parse memory extraction response:', jsonError);
            // Continue without memory extraction - non-fatal
            return;
          }
          
          if (!extractData?.choices?.[0]?.message?.content) {
            console.error('[generate-ai-response] Memory extraction response missing content');
            return;
          }
          
          let extracted: any;
          try {
            extracted = JSON.parse(extractData.choices[0].message.content);
          } catch (parseError: any) {
            console.error('[generate-ai-response] Failed to parse extracted memory JSON:', parseError);
            // Continue without memory extraction - non-fatal
            return;
          }

          console.log('[generate-ai-response] Memory insights extracted', {
            incidents: extracted.recent_incidents?.length || 0,
            patterns: extracted.recurring_patterns?.length || 0,
            triggers: extracted.triggers?.length || 0,
            strategies: extracted.helpful_strategies?.length || 0,
          });

          // Merge with existing memory notes (keep most recent 10 of each)
          const mergedIncidents = [
            ...(extracted.recent_incidents || []),
            ...(existingMemoryNotes?.recent_incidents || []),
          ].filter(Boolean).slice(0, 10);

          const mergedPatterns = [
            ...(extracted.recurring_patterns || []),
            ...(existingMemoryNotes?.recurring_patterns || []),
          ].filter(Boolean).slice(0, 10);

          const mergedTriggers = [
            ...(extracted.triggers || []),
            ...(existingMemoryNotes?.triggers || []),
          ].filter(Boolean).slice(0, 10);

          const mergedStrategies = [
            ...(extracted.helpful_strategies || []),
            ...(existingMemoryNotes?.helpful_strategies || []),
          ].filter(Boolean).slice(0, 10);

          // Upsert memory notes
          const { error: upsertError } = await supabase
            .from('therapist_memory_notes')
            .upsert({
              user_id: userId,
              therapist_id: therapistId,
              recent_incidents: mergedIncidents,
              recurring_patterns: mergedPatterns,
              triggers: mergedTriggers,
              helpful_strategies: mergedStrategies,
              updated_at: new Date().toISOString(),
            }, {
              onConflict: 'user_id,therapist_id',
            });

          if (upsertError) {
            console.error('[generate-ai-response] Error upserting memory notes:', upsertError);
          } else {
            console.log('[generate-ai-response] Memory notes updated successfully');
          }
        } else {
          console.error('[generate-ai-response] Error extracting memory insights:', await extractResponse.text());
        }
      } catch (memoryError) {
        console.error('[generate-ai-response] Exception during memory extraction:', memoryError);
        // Don't fail the whole request if memory extraction fails
      }
    }

    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/86105c35-01e6-4810-8ad5-4dfce4695369',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'generate-ai-response/index.ts:410',message:'Returning success response',data:{replyLength:aiReply?.length||0},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'F'})}).catch(()=>{});
    // #endregion
    
    return new Response(
      JSON.stringify({ reply: aiReply }),
      { 
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type'
        } 
      }
    );
  } catch (error: any) {
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/86105c35-01e6-4810-8ad5-4dfce4695369',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'generate-ai-response/index.ts:414',message:'Edge function error caught',data:{errorType:error?.constructor?.name,errorMessage:error?.message,errorStack:error?.stack?.substring(0,500)},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
    // #endregion
    console.error('[generate-ai-response] Unexpected error:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      { 
        status: 500, 
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type'
        } 
      }
    );
  }
});
