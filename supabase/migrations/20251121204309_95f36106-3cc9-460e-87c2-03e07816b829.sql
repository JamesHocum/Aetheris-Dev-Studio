-- Create profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "profiles_own_only"
ON public.profiles FOR ALL
USING (id = auth.uid())
WITH CHECK (id = auth.uid());

-- Add owner_id/user_id columns
ALTER TABLE public.agents
  ADD COLUMN owner_id UUID REFERENCES auth.users(id);

ALTER TABLE public.user_personas
  ADD COLUMN user_id UUID REFERENCES auth.users(id);

ALTER TABLE public.agent_files
  ADD COLUMN owner_id UUID REFERENCES auth.users(id);

ALTER TABLE public.agent_memory
  ADD COLUMN owner_id UUID REFERENCES auth.users(id);

-- Add column length constraints
ALTER TABLE public.agents
  ALTER COLUMN name TYPE VARCHAR(80),
  ALTER COLUMN description TYPE VARCHAR(500),
  ALTER COLUMN system_prompt TYPE VARCHAR(8000);

-- Drop old permissive policies
DROP POLICY IF EXISTS "Users can view their own agents" ON public.agents;
DROP POLICY IF EXISTS "Users can create agents" ON public.agents;
DROP POLICY IF EXISTS "Creators can update their agents" ON public.agents;
DROP POLICY IF EXISTS "Creators can delete their agents" ON public.agents;
DROP POLICY IF EXISTS "Anyone can view public agents" ON public.agents;

DROP POLICY IF EXISTS "Users can view files for their agents" ON public.agent_files;
DROP POLICY IF EXISTS "Users can upload files to agents" ON public.agent_files;
DROP POLICY IF EXISTS "Users can delete files from agents" ON public.agent_files;
DROP POLICY IF EXISTS "Anyone can view files for public agents" ON public.agent_files;

DROP POLICY IF EXISTS "Users can view memory for their agents" ON public.agent_memory;
DROP POLICY IF EXISTS "Users can insert memory for agents" ON public.agent_memory;
DROP POLICY IF EXISTS "Anyone can view agent memory for public agents" ON public.agent_memory;

DROP POLICY IF EXISTS "Users can view all personas" ON public.user_personas;
DROP POLICY IF EXISTS "Users can create their persona" ON public.user_personas;
DROP POLICY IF EXISTS "Users can update their persona" ON public.user_personas;

-- Create security definer function for agent ownership
CREATE OR REPLACE FUNCTION public.is_agent_owner(a_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM agents
    WHERE id = a_id
      AND owner_id = auth.uid()
  );
$$;

-- New RLS policies for agents
CREATE POLICY "agents_select_own_or_public"
ON public.agents FOR SELECT
USING (owner_id = auth.uid() OR is_public = true);

CREATE POLICY "agents_insert_own"
ON public.agents FOR INSERT
WITH CHECK (owner_id = auth.uid());

CREATE POLICY "agents_update_own"
ON public.agents FOR UPDATE
USING (owner_id = auth.uid())
WITH CHECK (owner_id = auth.uid());

CREATE POLICY "agents_delete_own"
ON public.agents FOR DELETE
USING (owner_id = auth.uid());

-- New RLS policies for agent_files
CREATE POLICY "files_own_agent"
ON public.agent_files FOR ALL
USING (public.is_agent_owner(agent_id))
WITH CHECK (public.is_agent_owner(agent_id));

-- New RLS policies for agent_memory
CREATE POLICY "memory_own_agent"
ON public.agent_memory FOR ALL
USING (public.is_agent_owner(agent_id))
WITH CHECK (public.is_agent_owner(agent_id));

-- New RLS policies for user_personas
CREATE POLICY "personas_own_only"
ON public.user_personas FOR ALL
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());