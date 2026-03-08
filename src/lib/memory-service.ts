import { supabase } from "@/integrations/supabase/client";

export interface ConversationMessage {
  role: string;
  content: string;
  metadata?: Record<string, unknown>;
}

// Save messages to persistent conversation history
export async function saveConversationMessages(
  agentId: string,
  userId: string,
  messages: ConversationMessage[],
  sessionId: string
) {
  const rows = messages.map(msg => ({
    agent_id: agentId,
    user_id: userId,
    role: msg.role,
    content: msg.content,
    metadata: (msg.metadata || {}) as Record<string, string>,
    session_id: sessionId,
  }));

  const { error } = await supabase
    .from('conversation_history')
    .insert(rows);

  if (error) console.error('Error saving conversation:', error);
  return !error;
}

// Load recent conversation history for an agent
export async function loadConversationHistory(
  agentId: string,
  userId: string,
  limit = 50
) {
  const { data, error } = await supabase
    .from('conversation_history')
    .select('*')
    .eq('agent_id', agentId)
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('Error loading conversation history:', error);
    return [];
  }

  return (data || []).reverse();
}

// Save a long-term memory entry
export async function saveLongTermMemory(
  agentId: string,
  userId: string,
  key: string,
  value: string,
  importance = 0.5
) {
  // Upsert: update if key exists, insert if not
  const { data: existing } = await supabase
    .from('agent_long_term_memory')
    .select('id, access_count')
    .eq('agent_id', agentId)
    .eq('user_id', userId)
    .eq('memory_key', key)
    .maybeSingle();

  if (existing) {
    const { error } = await supabase
      .from('agent_long_term_memory')
      .update({
        memory_value: value,
        importance,
        access_count: (existing.access_count || 0) + 1,
        last_accessed_at: new Date().toISOString(),
      })
      .eq('id', existing.id);
    if (error) console.error('Error updating LTM:', error);
    return !error;
  }

  const { error } = await supabase
    .from('agent_long_term_memory')
    .insert({
      agent_id: agentId,
      user_id: userId,
      memory_key: key,
      memory_value: value,
      importance,
    });
  if (error) console.error('Error saving LTM:', error);
  return !error;
}

// Search long-term memory by key pattern
export async function searchLongTermMemory(
  agentId: string,
  userId: string,
  searchQuery: string
) {
  const { data, error } = await supabase
    .from('agent_long_term_memory')
    .select('*')
    .eq('agent_id', agentId)
    .eq('user_id', userId)
    .or(`memory_key.ilike.%${searchQuery}%,memory_value.ilike.%${searchQuery}%`)
    .order('importance', { ascending: false })
    .limit(20);

  if (error) {
    console.error('Error searching LTM:', error);
    return [];
  }

  return data || [];
}

// Load all long-term memories for context injection
export async function loadLongTermMemories(
  agentId: string,
  userId: string,
  limit = 30
) {
  const { data, error } = await supabase
    .from('agent_long_term_memory')
    .select('*')
    .eq('agent_id', agentId)
    .eq('user_id', userId)
    .order('importance', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('Error loading LTM:', error);
    return [];
  }

  return data || [];
}

// Save an episodic summary
export async function saveEpisodicSummary(
  agentId: string,
  userId: string,
  sessionId: string,
  summary: string,
  keyTopics: string[],
  emotionalTone: string,
  decisionsMade: string[],
  messageCount: number,
  timeRangeStart: string,
  timeRangeEnd: string
) {
  const { error } = await supabase
    .from('agent_episodic_summaries')
    .insert({
      agent_id: agentId,
      user_id: userId,
      session_id: sessionId,
      summary,
      key_topics: keyTopics,
      emotional_tone: emotionalTone,
      decisions_made: decisionsMade,
      message_count: messageCount,
      time_range_start: timeRangeStart,
      time_range_end: timeRangeEnd,
    });

  if (error) console.error('Error saving episodic summary:', error);
  return !error;
}

// Load episodic summaries for context
export async function loadEpisodicSummaries(
  agentId: string,
  userId: string,
  limit = 10
) {
  const { data, error } = await supabase
    .from('agent_episodic_summaries')
    .select('*')
    .eq('agent_id', agentId)
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('Error loading episodic summaries:', error);
    return [];
  }

  return data || [];
}

// Build memory context string for injection into system prompt
export async function buildMemoryContext(
  agentId: string,
  userId: string
): Promise<string> {
  const [memories, episodes, recentHistory] = await Promise.all([
    loadLongTermMemories(agentId, userId, 15),
    loadEpisodicSummaries(agentId, userId, 5),
    loadConversationHistory(agentId, userId, 10),
  ]);

  const parts: string[] = [];

  if (memories.length > 0) {
    parts.push('## Long-Term Memories');
    memories.forEach(m => {
      parts.push(`- **${m.memory_key}**: ${m.memory_value} (importance: ${m.importance})`);
    });
  }

  if (episodes.length > 0) {
    parts.push('\n## Recent Session Summaries');
    episodes.forEach(ep => {
      parts.push(`- [${new Date(ep.created_at).toLocaleDateString()}] ${ep.summary}`);
      if (ep.key_topics?.length) parts.push(`  Topics: ${ep.key_topics.join(', ')}`);
    });
  }

  if (recentHistory.length > 0) {
    parts.push('\n## Recent Conversation Context');
    recentHistory.slice(-5).forEach(msg => {
      parts.push(`${msg.role}: ${msg.content.slice(0, 200)}${msg.content.length > 200 ? '...' : ''}`);
    });
  }

  return parts.join('\n');
}

// Generate a unique session ID
export function generateSessionId(): string {
  return `session_${Date.now()}_${crypto.randomUUID().slice(0, 8)}`;
}
