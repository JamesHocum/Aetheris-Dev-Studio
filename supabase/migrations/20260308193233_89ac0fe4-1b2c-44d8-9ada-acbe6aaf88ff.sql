
-- Conversation history table for persistent chat across sessions
CREATE TABLE public.conversation_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id uuid REFERENCES public.agents(id) ON DELETE CASCADE NOT NULL,
  user_id uuid NOT NULL,
  role text NOT NULL,
  content text NOT NULL,
  metadata jsonb DEFAULT '{}',
  session_id text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Long-term memory table for distilled knowledge
CREATE TABLE public.agent_long_term_memory (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id uuid REFERENCES public.agents(id) ON DELETE CASCADE NOT NULL,
  user_id uuid NOT NULL,
  memory_key text NOT NULL,
  memory_value text NOT NULL,
  importance numeric DEFAULT 0.5,
  access_count integer DEFAULT 0,
  last_accessed_at timestamptz DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Episodic summaries table for conversation digests
CREATE TABLE public.agent_episodic_summaries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id uuid REFERENCES public.agents(id) ON DELETE CASCADE NOT NULL,
  user_id uuid NOT NULL,
  session_id text,
  summary text NOT NULL,
  key_topics text[] DEFAULT '{}',
  emotional_tone text,
  decisions_made text[] DEFAULT '{}',
  message_count integer DEFAULT 0,
  time_range_start timestamptz,
  time_range_end timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.conversation_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agent_long_term_memory ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agent_episodic_summaries ENABLE ROW LEVEL SECURITY;

-- RLS policies: users can only access their own data
CREATE POLICY "conversation_own_only" ON public.conversation_history
  FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "ltm_own_only" ON public.agent_long_term_memory
  FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "episodic_own_only" ON public.agent_episodic_summaries
  FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Indexes for performance
CREATE INDEX idx_conversation_history_agent_user ON public.conversation_history(agent_id, user_id, created_at DESC);
CREATE INDEX idx_conversation_history_session ON public.conversation_history(session_id);
CREATE INDEX idx_ltm_agent_user ON public.agent_long_term_memory(agent_id, user_id);
CREATE INDEX idx_ltm_memory_key ON public.agent_long_term_memory(memory_key);
CREATE INDEX idx_episodic_agent_user ON public.agent_episodic_summaries(agent_id, user_id, created_at DESC);

-- Enable realtime for conversation history
ALTER PUBLICATION supabase_realtime ADD TABLE public.conversation_history;

-- Trigger for updated_at on long_term_memory
CREATE TRIGGER update_ltm_updated_at
  BEFORE UPDATE ON public.agent_long_term_memory
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
