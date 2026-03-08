import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

const SUMMARY_THRESHOLD = 10; // messages per exchange pair = user+assistant

interface SummarizeOptions {
  agentId: string;
  sessionId: string;
  messages: { role: string; content: string }[];
  force?: boolean;
}

// Track which sessions have already been summarized so we don't duplicate
const summarizedSessions = new Set<string>();

export function shouldAutoSummarize(messageCount: number): boolean {
  // Trigger every SUMMARY_THRESHOLD messages (counting user messages only)
  const userMsgCount = Math.floor(messageCount / 2);
  return userMsgCount > 0 && userMsgCount % SUMMARY_THRESHOLD === 0;
}

export async function triggerEpisodicSummary({
  agentId,
  sessionId,
  messages,
  force = false,
}: SummarizeOptions): Promise<boolean> {
  const key = `${sessionId}_${Math.floor(messages.length / (SUMMARY_THRESHOLD * 2))}`;

  if (!force && summarizedSessions.has(key)) {
    return false; // already summarized this window
  }

  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return false;

    const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/summarize-episode`;

    const resp = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({ agentId, sessionId, messages }),
    });

    if (!resp.ok) {
      const err = await resp.json().catch(() => ({}));
      console.error("Summarize error:", err);
      toast({
        variant: "destructive",
        title: "Summary failed",
        description: err.error || "Could not generate episodic summary",
      });
      return false;
    }

    summarizedSessions.add(key);

    toast({
      title: "Memory archived",
      description: "Episodic summary saved successfully",
    });

    return true;
  } catch (err) {
    console.error("Auto-summarize error:", err);
    return false;
  }
}

export function resetSummarizedSessions() {
  summarizedSessions.clear();
}
