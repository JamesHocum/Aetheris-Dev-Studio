-- Create agents table for AI agent management
CREATE TABLE IF NOT EXISTS public.agents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  base_model TEXT NOT NULL DEFAULT 'google/gemini-2.5-flash',
  voice_id TEXT,
  system_prompt TEXT,
  created_by TEXT NOT NULL,
  is_public BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create agent_memory table for persistent context
CREATE TABLE IF NOT EXISTS public.agent_memory (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  agent_id UUID NOT NULL REFERENCES public.agents(id) ON DELETE CASCADE,
  memory_type TEXT NOT NULL, -- 'conversation', 'knowledge', 'preference'
  content JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create agent_files table for uploaded files
CREATE TABLE IF NOT EXISTS public.agent_files (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  agent_id UUID NOT NULL REFERENCES public.agents(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_type TEXT NOT NULL,
  file_content TEXT NOT NULL,
  file_size INTEGER NOT NULL,
  uploaded_by TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create user_personas table for user profiles
CREATE TABLE IF NOT EXISTS public.user_personas (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  username TEXT NOT NULL UNIQUE,
  display_name TEXT,
  preferences JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_agents_created_by ON public.agents(created_by);
CREATE INDEX IF NOT EXISTS idx_agent_memory_agent_id ON public.agent_memory(agent_id);
CREATE INDEX IF NOT EXISTS idx_agent_files_agent_id ON public.agent_files(agent_id);

-- Enable RLS
ALTER TABLE public.agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agent_memory ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agent_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_personas ENABLE ROW LEVEL SECURITY;

-- Agents policies (public read, creator write)
CREATE POLICY "Anyone can view public agents"
  ON public.agents FOR SELECT
  USING (is_public = true);

CREATE POLICY "Users can view their own agents"
  ON public.agents FOR SELECT
  USING (true);

CREATE POLICY "Users can create agents"
  ON public.agents FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Creators can update their agents"
  ON public.agents FOR UPDATE
  USING (true);

CREATE POLICY "Creators can delete their agents"
  ON public.agents FOR DELETE
  USING (true);

-- Agent memory policies
CREATE POLICY "Anyone can view agent memory for public agents"
  ON public.agent_memory FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.agents
      WHERE agents.id = agent_memory.agent_id
      AND agents.is_public = true
    )
  );

CREATE POLICY "Users can view memory for their agents"
  ON public.agent_memory FOR SELECT
  USING (true);

CREATE POLICY "Users can insert memory for agents"
  ON public.agent_memory FOR INSERT
  WITH CHECK (true);

-- Agent files policies
CREATE POLICY "Anyone can view files for public agents"
  ON public.agent_files FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.agents
      WHERE agents.id = agent_files.agent_id
      AND agents.is_public = true
    )
  );

CREATE POLICY "Users can view files for their agents"
  ON public.agent_files FOR SELECT
  USING (true);

CREATE POLICY "Users can upload files to agents"
  ON public.agent_files FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Users can delete files from agents"
  ON public.agent_files FOR DELETE
  USING (true);

-- User personas policies
CREATE POLICY "Users can view all personas"
  ON public.user_personas FOR SELECT
  USING (true);

CREATE POLICY "Users can create their persona"
  ON public.user_personas FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Users can update their persona"
  ON public.user_personas FOR UPDATE
  USING (true);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add updated_at triggers
CREATE TRIGGER update_agents_updated_at
  BEFORE UPDATE ON public.agents
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_user_personas_updated_at
  BEFORE UPDATE ON public.user_personas
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();