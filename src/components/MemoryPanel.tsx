import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Slider } from "@/components/ui/slider";
import {
  Brain,
  Clock,
  Search,
  Trash2,
  Star,
  MessageSquare,
  BookOpen,
  Sparkles,
  RefreshCw,
  Plus,
} from "lucide-react";
import { saveLongTermMemory } from "@/lib/memory-service";
import { toast } from "@/hooks/use-toast";

interface MemoryPanelProps {
  agentId: string;
  userId: string;
  injectedMemoryKeys?: Set<string>;
}

export function MemoryPanel({ agentId, userId, injectedMemoryKeys }: MemoryPanelProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [conversationHistory, setConversationHistory] = useState<any[]>([]);
  const [longTermMemories, setLongTermMemories] = useState<any[]>([]);
  const [episodicSummaries, setEpisodicSummaries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("conversation");

  const loadAll = useCallback(async () => {
    setLoading(true);
    const [convRes, ltmRes, epRes] = await Promise.all([
      supabase
        .from("conversation_history")
        .select("*")
        .eq("agent_id", agentId)
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(100),
      supabase
        .from("agent_long_term_memory")
        .select("*")
        .eq("agent_id", agentId)
        .eq("user_id", userId)
        .order("importance", { ascending: false })
        .limit(50),
      supabase
        .from("agent_episodic_summaries")
        .select("*")
        .eq("agent_id", agentId)
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(20),
    ]);
    setConversationHistory(convRes.data || []);
    setLongTermMemories(ltmRes.data || []);
    setEpisodicSummaries(epRes.data || []);
    setLoading(false);
  }, [agentId, userId]);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  const handleDeleteConversation = async (id: string) => {
    const { error } = await supabase.from("conversation_history").delete().eq("id", id);
    if (error) {
      toast({ variant: "destructive", title: "Error", description: "Failed to delete" });
    } else {
      setConversationHistory((prev) => prev.filter((m) => m.id !== id));
      toast({ title: "Deleted", description: "Message removed" });
    }
  };

  const handleDeleteMemory = async (id: string) => {
    const { error } = await supabase.from("agent_long_term_memory").delete().eq("id", id);
    if (error) {
      toast({ variant: "destructive", title: "Error", description: "Failed to delete" });
    } else {
      setLongTermMemories((prev) => prev.filter((m) => m.id !== id));
      toast({ title: "Deleted", description: "Memory removed" });
    }
  };

  const handleDeleteEpisode = async (id: string) => {
    const { error } = await supabase.from("agent_episodic_summaries").delete().eq("id", id);
    if (error) {
      toast({ variant: "destructive", title: "Error", description: "Failed to delete" });
    } else {
      setEpisodicSummaries((prev) => prev.filter((m) => m.id !== id));
      toast({ title: "Deleted", description: "Episode removed" });
    }
  };

  const filterByQuery = (text: string) =>
    !searchQuery || text.toLowerCase().includes(searchQuery.toLowerCase());

  const filteredConversation = conversationHistory.filter((m) => filterByQuery(m.content));
  const filteredLTM = longTermMemories.filter(
    (m) => filterByQuery(m.memory_key) || filterByQuery(m.memory_value)
  );
  const filteredEpisodes = episodicSummaries.filter((e) => filterByQuery(e.summary));

  const importanceColor = (imp: number) => {
    if (imp >= 0.8) return "text-primary";
    if (imp >= 0.5) return "text-secondary";
    return "text-muted-foreground";
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-2 mb-3">
        <Brain className="w-5 h-5 text-primary" />
        <h3 className="text-lg font-semibold text-foreground">Memory Inspector</h3>
        <Button variant="ghost" size="sm" onClick={loadAll} className="ml-auto">
          <RefreshCw className="w-4 h-4" />
        </Button>
      </div>

      <div className="relative mb-3">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search memories..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9 bg-background border-border"
        />
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col min-h-0">
        <TabsList className="w-full bg-muted/50">
          <TabsTrigger value="conversation" className="flex-1 gap-1 text-xs">
            <MessageSquare className="w-3 h-3" />
            History ({filteredConversation.length})
          </TabsTrigger>
          <TabsTrigger value="ltm" className="flex-1 gap-1 text-xs">
            <Star className="w-3 h-3" />
            Memory ({filteredLTM.length})
          </TabsTrigger>
          <TabsTrigger value="episodes" className="flex-1 gap-1 text-xs">
            <BookOpen className="w-3 h-3" />
            Episodes ({filteredEpisodes.length})
          </TabsTrigger>
        </TabsList>

        <ScrollArea className="flex-1 mt-2">
          <TabsContent value="conversation" className="m-0 space-y-2">
            {loading ? (
              <p className="text-sm text-muted-foreground text-center py-4">Loading...</p>
            ) : filteredConversation.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">No conversation history</p>
            ) : (
              filteredConversation.map((msg) => (
                <Card key={msg.id} className="p-3 bg-card/50 group">
                  <div className="flex items-start gap-2">
                    <Badge variant={msg.role === "user" ? "outline" : "default"} className="text-[10px] shrink-0 mt-0.5">
                      {msg.role}
                    </Badge>
                    <p className="text-xs text-foreground flex-1 line-clamp-3">{msg.content}</p>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="opacity-0 group-hover:opacity-100 shrink-0 h-6 w-6 p-0 text-destructive"
                      onClick={() => handleDeleteConversation(msg.id)}
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <Clock className="w-3 h-3 text-muted-foreground" />
                    <span className="text-[10px] text-muted-foreground">
                      {new Date(msg.created_at).toLocaleString()}
                    </span>
                    {msg.session_id && (
                      <span className="text-[10px] text-muted-foreground/50 truncate max-w-[120px]">
                        {msg.session_id}
                      </span>
                    )}
                  </div>
                </Card>
              ))
            )}
          </TabsContent>

          <TabsContent value="ltm" className="m-0 space-y-2">
            {loading ? (
              <p className="text-sm text-muted-foreground text-center py-4">Loading...</p>
            ) : filteredLTM.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">No long-term memories</p>
            ) : (
              filteredLTM.map((mem) => (
                <Card key={mem.id} className="p-3 bg-card/50 group">
                  <div className="flex items-start gap-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-foreground">{mem.memory_key}</span>
                        <span className={`text-[10px] font-mono ${importanceColor(mem.importance)}`}>
                          ★ {(mem.importance ?? 0).toFixed(2)}
                        </span>
                        {injectedMemoryKeys?.has(mem.memory_key) && (
                          <Badge className="text-[9px] h-4 bg-accent/20 text-accent border-accent/30">
                            <Sparkles className="w-2 h-2 mr-0.5" />
                            in context
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{mem.memory_value}</p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="opacity-0 group-hover:opacity-100 shrink-0 h-6 w-6 p-0 text-destructive"
                      onClick={() => handleDeleteMemory(mem.id)}
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <Clock className="w-3 h-3 text-muted-foreground" />
                    <span className="text-[10px] text-muted-foreground">
                      {new Date(mem.created_at).toLocaleString()}
                    </span>
                    <span className="text-[10px] text-muted-foreground">
                      accessed {mem.access_count ?? 0}×
                    </span>
                  </div>
                </Card>
              ))
            )}
          </TabsContent>

          <TabsContent value="episodes" className="m-0 space-y-2">
            {loading ? (
              <p className="text-sm text-muted-foreground text-center py-4">Loading...</p>
            ) : filteredEpisodes.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">No episodic summaries</p>
            ) : (
              filteredEpisodes.map((ep) => (
                <Card key={ep.id} className="p-3 bg-card/50 group">
                  <div className="flex items-start gap-2">
                    <div className="flex-1">
                      <p className="text-xs text-foreground">{ep.summary}</p>
                      {ep.key_topics?.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-1.5">
                          {ep.key_topics.map((topic: string, i: number) => (
                            <Badge key={i} variant="outline" className="text-[9px] h-4">
                              {topic}
                            </Badge>
                          ))}
                        </div>
                      )}
                      {ep.emotional_tone && (
                        <span className="text-[10px] text-secondary mt-1 block">
                          Tone: {ep.emotional_tone}
                        </span>
                      )}
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="opacity-0 group-hover:opacity-100 shrink-0 h-6 w-6 p-0 text-destructive"
                      onClick={() => handleDeleteEpisode(ep.id)}
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <Clock className="w-3 h-3 text-muted-foreground" />
                    <span className="text-[10px] text-muted-foreground">
                      {new Date(ep.created_at).toLocaleString()}
                    </span>
                    <span className="text-[10px] text-muted-foreground">
                      {ep.message_count} msgs
                    </span>
                  </div>
                </Card>
              ))
            )}
          </TabsContent>
        </ScrollArea>
      </Tabs>
    </div>
  );
}
