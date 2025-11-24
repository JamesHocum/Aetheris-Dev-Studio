-- Add new fields to agents table for enhanced management
ALTER TABLE agents
  ADD COLUMN IF NOT EXISTS slug text UNIQUE,
  ADD COLUMN IF NOT EXISTS temperature numeric DEFAULT 0.7 CHECK (temperature >= 0 AND temperature <= 2),
  ADD COLUMN IF NOT EXISTS max_tokens integer DEFAULT 2048 CHECK (max_tokens > 0),
  ADD COLUMN IF NOT EXISTS tags text[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS published boolean DEFAULT false;

-- Update visibility column to use enum (rename existing is_public to visibility)
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'agent_visibility') THEN
    CREATE TYPE agent_visibility AS ENUM ('private', 'unlisted', 'public');
  END IF;
END $$;

ALTER TABLE agents
  ADD COLUMN IF NOT EXISTS visibility agent_visibility DEFAULT 'private';

-- Migrate existing is_public data to visibility
UPDATE agents 
SET visibility = CASE 
  WHEN is_public = true THEN 'public'::agent_visibility 
  ELSE 'private'::agent_visibility 
END
WHERE visibility IS NULL;

-- Generate slugs for existing agents without one
UPDATE agents
SET slug = lower(regexp_replace(regexp_replace(name, '[^a-zA-Z0-9]+', '-', 'g'), '^-+|-+$', '', 'g')) || '-' || substring(id::text from 1 for 8)
WHERE slug IS NULL;

ALTER TABLE agents
  ALTER COLUMN slug SET NOT NULL;

-- Update RLS policies to include published/visibility logic
DROP POLICY IF EXISTS "agents_select_own_or_public" ON agents;

CREATE POLICY "agents_select_own_or_public"
ON agents FOR SELECT
USING (
  owner_id = auth.uid() 
  OR (published = true AND visibility IN ('public', 'unlisted'))
);