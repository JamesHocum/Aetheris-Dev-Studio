import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Slider } from "@/components/ui/slider";
import { Checkbox } from "@/components/ui/checkbox";
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
  Download,
  CheckSquare,
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
  const [showAddForm, setShowAddForm] = useState(false);
  const [newKey, setNewKey] = useState("");
  const [newValue, setNewValue] = useState("");
  const [newImportance, setNewImportance] = useState(0.5);
  const [saving, setSaving] = useState(false);

  // Bulk selection state
  const [selectMode, setSelectMode] = useState(false);
  const [selectedConv, setSelectedConv] = useState<Set<string>>(new Set());
  const [selectedLtm, setSelectedLtm] = useState<Set<string>>(new Set());
  const [selectedEp, setSelectedEp] = useState<Set<string>>(new Set());
  const [bulkDeleting, setBulkDeleting] = useState(false);

  const loadAll = useCallback(async () => {
    setLoading(true);
    const [convRes, ltmRes, epRes] = await Promise.all([
      supabase.from("conversation_history").select("*").eq("agent_id", agentId).eq("user_id", userId).order("created_at", { ascending: false }).limit(100),
      supabase.from("agent_long_term_memory").select("*").eq("agent_id", agentId).eq("user_id", userId).order("importance", { ascending: false }).limit(50),
      supabase.from("agent_episodic_summaries").select("*").eq("agent_id", agentId).eq("user_id", userId).order("created_at", { ascending: false }).limit(20),
    ]);
    setConversationHistory(convRes.data || []);
    setLongTermMemories(ltmRes.data || []);
    setEpisodicSummaries(epRes.data || []);
    setLoading(false);
  }, [agentId, userId]);

  useEffect(() => { loadAll(); }, [loadAll]);

  const exitSelectMode = () => {
    setSelectMode(false);
    setSelectedConv(new Set());
    setSelectedLtm(new Set());
    setSelectedEp(new Set());
  };

  const toggleSelection = (id: string, set: Set<string>, setter: React.Dispatch<React.SetStateAction<Set<string>>>) => {
    const next = new Set(set);
    next.has(id) ? next.delete(id) : next.add(id);
    setter(next);
  };

  const currentSelected = activeTab === "conversation" ? selectedConv : activeTab === "ltm" ? selectedLtm : selectedEp;

  const handleBulkDelete = async () => {
    const table = activeTab === "conversation" ? "conversation_history" : activeTab === "ltm" ? "agent_long_term_memory" : "agent_episodic_summaries";
    const ids = Array.from(currentSelected);
    if (ids.length === 0) return;
    setBulkDeleting(true);
    const { error } = await supabase.from(table).delete().in("id", ids);
    setBulkDeleting(false);
    if (error) {
      toast({ variant: "destructive", title: "Error", description: "Bulk delete failed" });
    } else {
      toast({ title: "Deleted", description: `${ids.length} items removed` });
      if (activeTab === "conversation") setConversationHistory(prev => prev.filter(m => !ids.includes(m.id)));
      else if (activeTab === "ltm") setLongTermMemories(prev => prev.filter(m => !ids.includes(m.id)));
      else setEpisodicSummaries(prev => prev.filter(m => !ids.includes(m.id)));
      exitSelectMode();
    }
  };

  const handleExport = () => {
    let data: any[];
    let filename: string;
    if (activeTab === "conversation") {
      data = conversationHistory.map(({ id, role, content, created_at, session_id }) => ({ id, role, content, created_at, session_id }));
      filename = "conversation_history.json";
    } else if (activeTab === "ltm") {
      data = longTermMemories.map(({ id, memory_key, memory_value, importance, access_count, created_at }) => ({ id, memory_key, memory_value, importance, access_count, created_at }));
      filename = "long_term_memories.json";
    } else {
      data = episodicSummaries.map(({ id, summary, key_topics, emotional_tone, message_count, created_at }) => ({ id, summary, key_topics, emotional_tone, message_count, created_at }));
      filename = "episodic_summaries.json";
    }
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
    toast({ title: "Exported", description: `${data.length} items exported as ${filename}` });
  };

  const handleDeleteConversation = async (id: string) => {
    const { error } = await supabase.from("conversation_history").delete().eq("id", id);
    if (!error) { setConversationHistory(prev => prev.filter(m => m.id !== id)); toast({ title: "Deleted" }); }
    else toast({ variant: "destructive", title: "Error", description: "Failed to delete" });
  };

  const handleDeleteMemory = async (id: string) => {
    const { error } = await supabase.from("agent_long_term_memory").delete().eq("id", id);
    if (!error) { setLongTermMemories(prev => prev.filter(m => m.id !== id)); toast({ title: "Deleted" }); }
    else toast({ variant: "destructive", title: "Error", description: "Failed to delete" });
  };

  const handleDeleteEpisode = async (id: string) => {
    const { error } = await supabase.from("agent_episodic_summaries").delete().eq("id", id);
    if (!error) { setEpisodicSummaries(prev => prev.filter(m => m.id !== id)); toast({ title: "Deleted" }); }
    else toast({ variant: "destructive", title: "Error", description: "Failed to delete" });
  };

  const filterByQuery = (text: string) => !searchQuery || text.toLowerCase().includes(searchQuery.toLowerCase());
  const filteredConversation = conversationHistory.filter(m => filterByQuery(m.content));
  const filteredLTM = longTermMemories.filter(m => filterByQuery(m.memory_key) || filterByQuery(m.memory_value));
  const filteredEpisodes = episodicSummaries.filter(e => filterByQuery(e.summary));

  const handleSaveMemory = async () => {
    if (!newKey.trim() || !newValue.trim()) { toast({ variant: "destructive", title: "Error", description: "Key and value are required" }); return; }
    setSaving(true);
    const success = await saveLongTermMemory(agentId, userId, newKey.trim(), newValue.trim(), newImportance);
    setSaving(false);
    if (success) { toast({ title: "Saved", description: "Long-term memory saved" }); setNewKey(""); setNewValue(""); setNewImportance(0.5); setShowAddForm(false); loadAll(); }
    else toast({ variant: "destructive", title: "Error", description: "Failed to save memory" });
  };

  const importanceColor = (imp: number) => imp >= 0.8 ? "text-primary" : imp >= 0.5 ? "text-secondary" : "text-muted-foreground";

  const selectAllVisible = () => {
    if (activeTab === "conversation") setSelectedConv(new Set(filteredConversation.map(m => m.id)));
    else if (activeTab === "ltm") setSelectedLtm(new Set(filteredLTM.map(m => m.id)));
    else setSelectedEp(new Set(filteredEpisodes.map(m => m.id)));
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-2 mb-3">
        <Brain className="w-5 h-5 text-primary" />
        <h3 className="text-lg font-semibold text-foreground">Memory Inspector</h3>
        <div className="ml-auto flex items-center gap-1">
          <Button variant="ghost" size="sm" onClick={handleExport} title="Export">
            <Download className="w-4 h-4" />
          </Button>
          <Button variant={selectMode ? "secondary" : "ghost"} size="sm" onClick={() => selectMode ? exitSelectMode() : setSelectMode(true)} title="Bulk select">
            <CheckSquare className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={loadAll}>
            <RefreshCw className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {selectMode && (
        <div className="flex items-center gap-2 mb-2 p-2 rounded-md bg-muted/50 border border-border">
          <span className="text-xs text-muted-foreground">{currentSelected.size} selected</span>
          <Button variant="outline" size="sm" className="text-xs h-7" onClick={selectAllVisible}>Select All</Button>
          <Button variant="destructive" size="sm" className="text-xs h-7 ml-auto gap-1" onClick={handleBulkDelete} disabled={currentSelected.size === 0 || bulkDeleting}>
            <Trash2 className="w-3 h-3" />
            {bulkDeleting ? "Deleting..." : `Delete (${currentSelected.size})`}
          </Button>
        </div>
      )}

      <div className="relative mb-3">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input placeholder="Search memories..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="pl-9 bg-background border-border" />
      </div>

      <Tabs value={activeTab} onValueChange={v => { setActiveTab(v); exitSelectMode(); }} className="flex-1 flex flex-col min-h-0">
        <TabsList className="w-full bg-muted/50">
          <TabsTrigger value="conversation" className="flex-1 gap-1 text-xs"><MessageSquare className="w-3 h-3" />History ({filteredConversation.length})</TabsTrigger>
          <TabsTrigger value="ltm" className="flex-1 gap-1 text-xs"><Star className="w-3 h-3" />Memory ({filteredLTM.length})</TabsTrigger>
          <TabsTrigger value="episodes" className="flex-1 gap-1 text-xs"><BookOpen className="w-3 h-3" />Episodes ({filteredEpisodes.length})</TabsTrigger>
        </TabsList>

        <ScrollArea className="flex-1 mt-2">
          <TabsContent value="conversation" className="m-0 space-y-2">
            {loading ? <p className="text-sm text-muted-foreground text-center py-4">Loading...</p>
            : filteredConversation.length === 0 ? <p className="text-sm text-muted-foreground text-center py-4">No conversation history</p>
            : filteredConversation.map(msg => (
              <Card key={msg.id} className="p-3 bg-card/50 group">
                <div className="flex items-start gap-2">
                  {selectMode && <Checkbox checked={selectedConv.has(msg.id)} onCheckedChange={() => toggleSelection(msg.id, selectedConv, setSelectedConv)} className="mt-0.5 shrink-0" />}
                  <Badge variant={msg.role === "user" ? "outline" : "default"} className="text-[10px] shrink-0 mt-0.5">{msg.role}</Badge>
                  <p className="text-xs text-foreground flex-1 line-clamp-3">{msg.content}</p>
                  {!selectMode && <Button variant="ghost" size="sm" className="opacity-0 group-hover:opacity-100 shrink-0 h-6 w-6 p-0 text-destructive" onClick={() => handleDeleteConversation(msg.id)}><Trash2 className="w-3 h-3" /></Button>}
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <Clock className="w-3 h-3 text-muted-foreground" />
                  <span className="text-[10px] text-muted-foreground">{new Date(msg.created_at).toLocaleString()}</span>
                  {msg.session_id && <span className="text-[10px] text-muted-foreground/50 truncate max-w-[120px]">{msg.session_id}</span>}
                </div>
              </Card>
            ))}
          </TabsContent>

          <TabsContent value="ltm" className="m-0 space-y-2">
            <div className="flex justify-end">
              <Button variant="outline" size="sm" className="gap-1 text-xs" onClick={() => setShowAddForm(!showAddForm)}>
                <Plus className="w-3 h-3" />{showAddForm ? "Cancel" : "Save Memory"}
              </Button>
            </div>
            {showAddForm && (
              <Card className="p-3 bg-card/80 border-primary/20 space-y-3">
                <div className="space-y-1"><Label className="text-xs">Key</Label><Input placeholder="e.g. user_preference_theme" value={newKey} onChange={e => setNewKey(e.target.value)} className="h-8 text-xs bg-background" /></div>
                <div className="space-y-1"><Label className="text-xs">Value</Label><Input placeholder="e.g. prefers dark mode" value={newValue} onChange={e => setNewValue(e.target.value)} className="h-8 text-xs bg-background" /></div>
                <div className="space-y-1"><Label className="text-xs">Importance: {newImportance.toFixed(2)}</Label><Slider value={[newImportance]} onValueChange={([v]) => setNewImportance(v)} min={0} max={1} step={0.05} className="w-full" /></div>
                <Button size="sm" className="w-full text-xs" onClick={handleSaveMemory} disabled={saving}>{saving ? "Saving..." : "Save Long-Term Memory"}</Button>
              </Card>
            )}
            {loading ? <p className="text-sm text-muted-foreground text-center py-4">Loading...</p>
            : filteredLTM.length === 0 ? <p className="text-sm text-muted-foreground text-center py-4">No long-term memories</p>
            : filteredLTM.map(mem => (
              <Card key={mem.id} className="p-3 bg-card/50 group">
                <div className="flex items-start gap-2">
                  {selectMode && <Checkbox checked={selectedLtm.has(mem.id)} onCheckedChange={() => toggleSelection(mem.id, selectedLtm, setSelectedLtm)} className="mt-0.5 shrink-0" />}
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-foreground">{mem.memory_key}</span>
                      <span className={`text-[10px] font-mono ${importanceColor(mem.importance)}`}>★ {(mem.importance ?? 0).toFixed(2)}</span>
                      {injectedMemoryKeys?.has(mem.memory_key) && <Badge className="text-[9px] h-4 bg-accent/20 text-accent border-accent/30"><Sparkles className="w-2 h-2 mr-0.5" />in context</Badge>}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{mem.memory_value}</p>
                  </div>
                  {!selectMode && <Button variant="ghost" size="sm" className="opacity-0 group-hover:opacity-100 shrink-0 h-6 w-6 p-0 text-destructive" onClick={() => handleDeleteMemory(mem.id)}><Trash2 className="w-3 h-3" /></Button>}
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <Clock className="w-3 h-3 text-muted-foreground" />
                  <span className="text-[10px] text-muted-foreground">{new Date(mem.created_at).toLocaleString()}</span>
                  <span className="text-[10px] text-muted-foreground">accessed {mem.access_count ?? 0}×</span>
                </div>
              </Card>
            ))}
          </TabsContent>

          <TabsContent value="episodes" className="m-0 space-y-2">
            {loading ? <p className="text-sm text-muted-foreground text-center py-4">Loading...</p>
            : filteredEpisodes.length === 0 ? <p className="text-sm text-muted-foreground text-center py-4">No episodic summaries</p>
            : filteredEpisodes.map(ep => (
              <Card key={ep.id} className="p-3 bg-card/50 group">
                <div className="flex items-start gap-2">
                  {selectMode && <Checkbox checked={selectedEp.has(ep.id)} onCheckedChange={() => toggleSelection(ep.id, selectedEp, setSelectedEp)} className="mt-0.5 shrink-0" />}
                  <div className="flex-1">
                    <p className="text-xs text-foreground">{ep.summary}</p>
                    {ep.key_topics?.length > 0 && <div className="flex flex-wrap gap-1 mt-1.5">{ep.key_topics.map((topic: string, i: number) => <Badge key={i} variant="outline" className="text-[9px] h-4">{topic}</Badge>)}</div>}
                    {ep.emotional_tone && <span className="text-[10px] text-secondary mt-1 block">Tone: {ep.emotional_tone}</span>}
                  </div>
                  {!selectMode && <Button variant="ghost" size="sm" className="opacity-0 group-hover:opacity-100 shrink-0 h-6 w-6 p-0 text-destructive" onClick={() => handleDeleteEpisode(ep.id)}><Trash2 className="w-3 h-3" /></Button>}
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <Clock className="w-3 h-3 text-muted-foreground" />
                  <span className="text-[10px] text-muted-foreground">{new Date(ep.created_at).toLocaleString()}</span>
                  <span className="text-[10px] text-muted-foreground">{ep.message_count} msgs</span>
                </div>
              </Card>
            ))}
          </TabsContent>
        </ScrollArea>
      </Tabs>
    </div>
  );
}