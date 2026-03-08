import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Brain, Settings } from "lucide-react";
import type { AgentVisibility } from "@/types/agent";
import { MemoryPanel } from "@/components/MemoryPanel";

import { AI_MODELS } from "@/lib/models";

const models = AI_MODELS.map(m => ({ id: m.id, name: m.name, description: m.description }));

export default function AgentDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [systemPrompt, setSystemPrompt] = useState("");
  const [baseModel, setBaseModel] = useState("google/gemini-2.5-flash");
  const [visibility, setVisibility] = useState<AgentVisibility>("private");
  const [temperature, setTemperature] = useState(0.7);
  const [maxTokens, setMaxTokens] = useState(2048);
  const [published, setPublished] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("settings");

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUserId(data.user?.id ?? null));
  }, []);

  useEffect(() => {
    loadAgent();
  }, [id]);

  const loadAgent = async () => {
    if (!id) return;

    const { data: agent, error } = await supabase
      .from("agents")
      .select("*")
      .eq("id", id)
      .single();

    if (error || !agent) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Agent not found",
      });
      navigate("/studio");
      return;
    }

    setName(agent.name);
    setDescription(agent.description || "");
    setSystemPrompt(agent.system_prompt || "");
    setBaseModel(agent.base_model);
    setVisibility(agent.visibility);
    setTemperature(agent.temperature || 0.7);
    setMaxTokens(agent.max_tokens || 2048);
    setPublished(agent.published || false);
    setIsLoading(false);
  };

  const handleSave = async () => {
    if (!id || !name.trim()) {
      toast({
        variant: "destructive",
        title: "Validation Error",
        description: "Name is required",
      });
      return;
    }

    setIsSaving(true);

    const { error } = await supabase
      .from("agents")
      .update({
        name,
        description,
        system_prompt: systemPrompt,
        base_model: baseModel,
        visibility,
        temperature,
        max_tokens: maxTokens,
      })
      .eq("id", id);

    setIsSaving(false);

    if (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update agent",
      });
      return;
    }

    toast({
      title: "Success",
      description: "Agent updated successfully",
    });
  };

  const handlePublishToggle = async () => {
    if (!id) return;

    setIsSaving(true);

    const { error } = await supabase
      .from("agents")
      .update({ published: !published })
      .eq("id", id);

    setIsSaving(false);

    if (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update publish status",
      });
      return;
    }

    setPublished(!published);
    toast({
      title: "Success",
      description: published ? "Agent unpublished" : "Agent published",
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-accent/5 p-8">
        <div className="max-w-3xl mx-auto">
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-accent/5 p-8">
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/studio")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-2xl font-bold">Edit Agent</h1>
        </div>

        <Card className="p-6 space-y-6 bg-card/50 backdrop-blur-sm">
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="My Dev Builder Agent"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Short description of what this agent is for."
              rows={2}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="systemPrompt">System Prompt</Label>
            <Textarea
              id="systemPrompt"
              value={systemPrompt}
              onChange={(e) => setSystemPrompt(e.target.value)}
              placeholder="Define this agent's role, behavior, and boundaries..."
              rows={6}
            />
            <p className="text-xs text-muted-foreground">
              Keep this focused. You can attach longer context later via projects or memory engines.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="model">Model</Label>
              <Select value={baseModel} onValueChange={setBaseModel}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {models.map((model) => (
                    <SelectItem key={model.id} value={model.id}>
                      <div className="flex flex-col">
                        <span>{model.name}</span>
                        <span className="text-xs text-muted-foreground">{model.description}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="visibility">Visibility</Label>
              <Select value={visibility} onValueChange={(v) => setVisibility(v as AgentVisibility)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="private">Private</SelectItem>
                  <SelectItem value="unlisted">Unlisted</SelectItem>
                  <SelectItem value="public">Public</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Private: only you. Unlisted: share via link. Public: listed.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="maxTokens">Max Tokens</Label>
              <Input
                id="maxTokens"
                type="number"
                value={maxTokens}
                onChange={(e) => setMaxTokens(parseInt(e.target.value) || 2048)}
                min={1}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="temperature">Temperature: {temperature.toFixed(2)}</Label>
              <input
                id="temperature"
                type="range"
                min={0}
                max={2}
                step={0.05}
                value={temperature}
                onChange={(e) => setTemperature(parseFloat(e.target.value))}
                className="w-full"
              />
            </div>
          </div>

          <div className="flex items-center justify-between gap-3 pt-4 border-t">
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving ? "Saving..." : "Save Changes"}
            </Button>

            <Button
              variant="outline"
              onClick={handlePublishToggle}
              disabled={isSaving}
            >
              {published ? "Unpublish" : "Publish Agent"}
            </Button>
          </div>
        </Card>

        <p className="text-xs text-muted-foreground">
          Tip: once this agent is published, you can expose it in your UI, share a public chat route, or list it in an explore page.
        </p>
      </div>
    </div>
  );
}
