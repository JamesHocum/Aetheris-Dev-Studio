export type AgentVisibility = "private" | "unlisted" | "public";

export interface Agent {
  id: string;
  name: string;
  slug: string;
  description?: string;
  system_prompt?: string;
  visibility: AgentVisibility;
  published: boolean;
  base_model: string;
  temperature: number;
  max_tokens: number;
  tags: string[];
  owner_id: string;
  created_at: string;
  updated_at: string;
}
