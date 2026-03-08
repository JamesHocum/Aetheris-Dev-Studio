import { useState, useEffect, useCallback } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import {
  Eye,
  Cpu,
  FileText,
  MessageSquare,
  Brain,
  BookOpen,
  ChevronDown,
} from "lucide-react";
import { AI_MODELS } from "@/lib/models";

export interface ContextToggles {
  includeHistory: boolean;
  includeLTM: boolean;
  includeEpisodes: boolean;
}

interface ContextComposerProps {
  selectedModel: string;
  systemPrompt: string;
  memoryContext: string;
  toggles: ContextToggles;
  onTogglesChange: (t: ContextToggles) => void;
  messageCount: number;
}

export function ContextComposer({
  selectedModel,
  systemPrompt,
  memoryContext,
  toggles,
  onTogglesChange,
  messageCount,
}: ContextComposerProps) {
  const model = AI_MODELS.find((m) => m.id === selectedModel);
  const [sectionsOpen, setSectionsOpen] = useState({ system: false, memory: false });

  const contextLength = (systemPrompt?.length || 0) + (memoryContext?.length || 0);

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-2 mb-3">
        <Eye className="w-5 h-5 text-secondary" />
        <h3 className="text-lg font-semibold text-foreground">Context Composer</h3>
      </div>

      {/* Model info */}
      <Card className="p-3 bg-card/50 mb-3">
        <div className="flex items-center gap-2">
          <Cpu className="w-4 h-4 text-primary" />
          <div>
            <p className="text-sm font-medium text-foreground">{model?.name || selectedModel}</p>
            <p className="text-[10px] text-muted-foreground">{model?.tier} — {model?.description}</p>
          </div>
        </div>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-2 mb-3">
        <Card className="p-2 bg-card/50 text-center">
          <p className="text-lg font-bold text-primary">{messageCount}</p>
          <p className="text-[10px] text-muted-foreground">Messages</p>
        </Card>
        <Card className="p-2 bg-card/50 text-center">
          <p className="text-lg font-bold text-secondary">{(contextLength / 1000).toFixed(1)}k</p>
          <p className="text-[10px] text-muted-foreground">Context chars</p>
        </Card>
        <Card className="p-2 bg-card/50 text-center">
          <p className="text-lg font-bold text-accent">
            {[toggles.includeHistory, toggles.includeLTM, toggles.includeEpisodes].filter(Boolean).length}/3
          </p>
          <p className="text-[10px] text-muted-foreground">Layers</p>
        </Card>
      </div>

      {/* Toggles */}
      <Card className="p-3 bg-card/50 mb-3 space-y-3">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Memory Layers</p>
        <div className="flex items-center justify-between">
          <Label className="flex items-center gap-2 text-xs text-foreground cursor-pointer">
            <MessageSquare className="w-3.5 h-3.5 text-muted-foreground" />
            Recent History
          </Label>
          <Switch
            checked={toggles.includeHistory}
            onCheckedChange={(v) => onTogglesChange({ ...toggles, includeHistory: v })}
          />
        </div>
        <div className="flex items-center justify-between">
          <Label className="flex items-center gap-2 text-xs text-foreground cursor-pointer">
            <Brain className="w-3.5 h-3.5 text-muted-foreground" />
            Long-Term Memory
          </Label>
          <Switch
            checked={toggles.includeLTM}
            onCheckedChange={(v) => onTogglesChange({ ...toggles, includeLTM: v })}
          />
        </div>
        <div className="flex items-center justify-between">
          <Label className="flex items-center gap-2 text-xs text-foreground cursor-pointer">
            <BookOpen className="w-3.5 h-3.5 text-muted-foreground" />
            Episodic Summaries
          </Label>
          <Switch
            checked={toggles.includeEpisodes}
            onCheckedChange={(v) => onTogglesChange({ ...toggles, includeEpisodes: v })}
          />
        </div>
      </Card>

      {/* Expandable context preview */}
      <ScrollArea className="flex-1">
        <Collapsible
          open={sectionsOpen.system}
          onOpenChange={(v) => setSectionsOpen((s) => ({ ...s, system: v }))}
        >
          <CollapsibleTrigger className="flex items-center gap-2 w-full text-left p-2 rounded-md hover:bg-muted/50 transition-colors">
            <FileText className="w-3.5 h-3.5 text-muted-foreground" />
            <span className="text-xs font-medium text-foreground flex-1">System Prompt</span>
            <Badge variant="outline" className="text-[9px]">{systemPrompt?.length || 0} chars</Badge>
            <ChevronDown className={`w-3 h-3 text-muted-foreground transition-transform ${sectionsOpen.system ? "rotate-180" : ""}`} />
          </CollapsibleTrigger>
          <CollapsibleContent>
            <Card className="p-2 bg-muted/20 mt-1 mb-2">
              <pre className="text-[10px] text-muted-foreground whitespace-pre-wrap font-mono max-h-40 overflow-auto">
                {systemPrompt || "(empty)"}
              </pre>
            </Card>
          </CollapsibleContent>
        </Collapsible>

        <Collapsible
          open={sectionsOpen.memory}
          onOpenChange={(v) => setSectionsOpen((s) => ({ ...s, memory: v }))}
        >
          <CollapsibleTrigger className="flex items-center gap-2 w-full text-left p-2 rounded-md hover:bg-muted/50 transition-colors">
            <Brain className="w-3.5 h-3.5 text-muted-foreground" />
            <span className="text-xs font-medium text-foreground flex-1">Injected Memory Context</span>
            <Badge variant="outline" className="text-[9px]">{memoryContext?.length || 0} chars</Badge>
            <ChevronDown className={`w-3 h-3 text-muted-foreground transition-transform ${sectionsOpen.memory ? "rotate-180" : ""}`} />
          </CollapsibleTrigger>
          <CollapsibleContent>
            <Card className="p-2 bg-muted/20 mt-1 mb-2">
              <pre className="text-[10px] text-muted-foreground whitespace-pre-wrap font-mono max-h-40 overflow-auto">
                {memoryContext || "(no memory injected)"}
              </pre>
            </Card>
          </CollapsibleContent>
        </Collapsible>
      </ScrollArea>
    </div>
  );
}
