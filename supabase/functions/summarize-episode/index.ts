import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.80.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    );

    const { data: { user } } = await supabaseClient.auth.getUser();
    if (!user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { agentId, sessionId, messages } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) throw new Error('LOVABLE_API_KEY is not configured');

    // Ask AI to create an episodic summary
    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash-lite',
        messages: [
          {
            role: 'system',
            content: 'You are a memory archivist. Analyze the conversation and return a JSON object with: summary (string, 2-3 sentences), key_topics (string array), emotional_tone (string), decisions_made (string array of key decisions or conclusions reached). Return ONLY valid JSON, no markdown.'
          },
          {
            role: 'user',
            content: `Summarize this conversation:\n\n${messages.map((m: { role: string; content: string }) => `${m.role}: ${m.content}`).join('\n\n')}`
          }
        ],
        tools: [{
          type: 'function',
          function: {
            name: 'create_episode_summary',
            description: 'Create a structured episodic summary of a conversation',
            parameters: {
              type: 'object',
              properties: {
                summary: { type: 'string', description: '2-3 sentence summary' },
                key_topics: { type: 'array', items: { type: 'string' } },
                emotional_tone: { type: 'string' },
                decisions_made: { type: 'array', items: { type: 'string' } },
              },
              required: ['summary', 'key_topics', 'emotional_tone', 'decisions_made'],
              additionalProperties: false,
            },
          },
        }],
        tool_choice: { type: 'function', function: { name: 'create_episode_summary' } },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI gateway error:', response.status, errorText);
      return new Response(JSON.stringify({ error: 'Failed to generate summary' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const aiResult = await response.json();
    const toolCall = aiResult.choices?.[0]?.message?.tool_calls?.[0];
    let episodeData;

    if (toolCall?.function?.arguments) {
      episodeData = JSON.parse(toolCall.function.arguments);
    } else {
      // Fallback: try parsing content directly
      const content = aiResult.choices?.[0]?.message?.content || '';
      try { episodeData = JSON.parse(content); } catch {
        episodeData = {
          summary: content || 'Session completed.',
          key_topics: [],
          emotional_tone: 'neutral',
          decisions_made: [],
        };
      }
    }

    // Save to database
    const { error: insertError } = await supabaseClient
      .from('agent_episodic_summaries')
      .insert({
        agent_id: agentId,
        user_id: user.id,
        session_id: sessionId,
        summary: episodeData.summary,
        key_topics: episodeData.key_topics || [],
        emotional_tone: episodeData.emotional_tone || 'neutral',
        decisions_made: episodeData.decisions_made || [],
        message_count: messages.length,
        time_range_start: new Date(Date.now() - messages.length * 60000).toISOString(),
        time_range_end: new Date().toISOString(),
      });

    if (insertError) {
      console.error('Error saving episodic summary:', insertError);
      return new Response(JSON.stringify({ error: 'Failed to save summary' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ success: true, episode: episodeData }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in summarize-episode:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
