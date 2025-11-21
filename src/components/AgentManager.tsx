import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Bot, Plus, Edit, Trash2, Upload, FileText } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { z } from "zod";

const models = [
  { id: 'google/gemini-2.5-flash', name: 'Gemini 2.5 Flash' },
  { id: 'google/gemini-2.5-pro', name: 'Gemini 2.5 Pro' },
  { id: 'google/gemini-2.5-flash-lite', name: 'Gemini 2.5 Flash Lite' },
  { id: 'openai/gpt-5', name: 'GPT-5' },
  { id: 'openai/gpt-5-mini', name: 'GPT-5 Mini' },
  { id: 'openai/gpt-5-nano', name: 'GPT-5 Nano' },
];

// Validation schema
const agentSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(80, "Name must be less than 80 characters"),
  description: z.string().max(500, "Description must be less than 500 characters").optional(),
  system_prompt: z.string().max(8000, "System prompt must be less than 8000 characters").optional(),
  base_model: z.string().min(1, "Base model is required"),
  is_public: z.boolean(),
});

interface Agent {
  id: string;
  name: string;
  description: string;
  base_model: string;
  voice_id: string | null;
  system_prompt: string | null;
  owner_id: string;
  is_public: boolean;
  created_at: string;
}

interface AgentManagerProps {
  userId: string;
  onAgentSelect: (agentId: string, agentName: string) => void;
}

export const AgentManager = ({ userId, onAgentSelect }: AgentManagerProps) => {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [newAgent, setNewAgent] = useState({
    name: '',
    description: '',
    base_model: 'google/gemini-2.5-flash',
    system_prompt: '',
    is_public: false,
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  const MAX_FILE_SIZE = 1 * 1024 * 1024; // 1MB

  useEffect(() => {
    loadAgents();
  }, [userId]);

  const loadAgents = async () => {
    const { data, error } = await supabase
      .from('agents')
      .select('*')
      .eq('owner_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      toast({
        title: "Error loading agents",
        description: error.message,
        variant: "destructive",
      });
      return;
    }

    setAgents(data || []);
  };

  const createAgent = async () => {
    setValidationErrors({});

    // Validate with zod
    const validation = agentSchema.safeParse(newAgent);
    if (!validation.success) {
      const errors: Record<string, string> = {};
      validation.error.issues.forEach((err) => {
        if (err.path[0]) {
          errors[err.path[0].toString()] = err.message;
        }
      });
      setValidationErrors(errors);
      toast({
        title: "Validation error",
        description: "Please check your input and try again",
        variant: "destructive",
      });
      return;
    }

    // Validate file size
    if (selectedFile && selectedFile.size > MAX_FILE_SIZE) {
      toast({
        title: "File too large",
        description: `File must be less than ${MAX_FILE_SIZE / 1024 / 1024}MB`,
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    const { data, error } = await supabase
      .from('agents')
      .insert({
        name: newAgent.name.trim(),
        description: newAgent.description.trim() || null,
        base_model: newAgent.base_model,
        system_prompt: newAgent.system_prompt.trim() || null,
        owner_id: userId,
        created_by: userId,
        is_public: newAgent.is_public,
      })
      .select()
      .single();

    if (error) {
      toast({
        title: "Error creating agent",
        description: error.message,
        variant: "destructive",
      });
      setIsLoading(false);
      return;
    }

    // Upload file if selected
    if (selectedFile && data) {
      try {
        const fileContent = await selectedFile.text();
        const { error: fileError } = await supabase
          .from('agent_files')
          .insert({
            agent_id: data.id,
            file_name: selectedFile.name,
            file_type: selectedFile.type,
            file_content: fileContent,
            file_size: selectedFile.size,
            owner_id: userId,
            uploaded_by: userId,
          });

        if (fileError) {
          toast({
            title: "File upload failed",
            description: fileError.message,
            variant: "destructive",
          });
        }
      } catch (fileReadError) {
        toast({
          title: "File read error",
          description: "Failed to read file content",
          variant: "destructive",
        });
      }
    }

    toast({
      title: "Agent created",
      description: `${newAgent.name} is ready to assist`,
    });

    setNewAgent({
      name: '',
      description: '',
      base_model: 'google/gemini-2.5-flash',
      system_prompt: '',
      is_public: false,
    });
    setSelectedFile(null);
    setShowCreateDialog(false);
    setIsLoading(false);
    loadAgents();
  };

  const deleteAgent = async (id: string, name: string) => {
    const { error } = await supabase
      .from('agents')
      .delete()
      .eq('id', id);

    if (error) {
      toast({
        title: "Error deleting agent",
        description: error.message,
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Agent deleted",
      description: `${name} has been removed`,
    });

    loadAgents();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-primary">Agent Management</h2>
          <p className="text-muted-foreground mt-1">
            Create and manage your AI agents
          </p>
        </div>
        <Button onClick={() => setShowCreateDialog(true)} className="gap-2">
          <Plus className="w-4 h-4" />
          Create Agent
        </Button>
      </div>

      {agents.length === 0 ? (
        <Card className="p-12 text-center">
          <Bot className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-xl font-semibold mb-2">No agents yet</h3>
          <p className="text-muted-foreground mb-4">
            Create your first AI agent to get started
          </p>
          <Button onClick={() => setShowCreateDialog(true)} className="gap-2">
            <Plus className="w-4 h-4" />
            Create Your First Agent
          </Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {agents.map((agent) => (
            <Card key={agent.id} className="p-6 hover:border-primary transition-colors">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                    <Bot className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg">{agent.name}</h3>
                    <p className="text-xs text-muted-foreground">
                      {models.find(m => m.id === agent.base_model)?.name}
                    </p>
                  </div>
                </div>
              </div>

              {agent.description && (
                <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                  {agent.description}
                </p>
              )}

              <div className="flex items-center gap-2 pt-4 border-t border-border">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  onClick={() => onAgentSelect(agent.id, agent.name)}
                >
                  Open Workspace
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => deleteAgent(agent.id, agent.name)}
                  className="text-destructive hover:text-destructive hover:bg-destructive/10"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Create Agent Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create New Agent</DialogTitle>
            <DialogDescription>
              Configure your AI agent with custom settings and knowledge
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Agent Name *</Label>
              <Input
                id="name"
                value={newAgent.name}
                onChange={(e) => {
                  setNewAgent({ ...newAgent, name: e.target.value });
                  setValidationErrors({ ...validationErrors, name: '' });
                }}
                placeholder="e.g., Code Assistant"
                maxLength={80}
              />
              {validationErrors.name && (
                <p className="text-sm text-destructive">{validationErrors.name}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={newAgent.description}
                onChange={(e) => {
                  setNewAgent({ ...newAgent, description: e.target.value });
                  setValidationErrors({ ...validationErrors, description: '' });
                }}
                placeholder="What does this agent do?"
                maxLength={500}
                rows={3}
              />
              {validationErrors.description && (
                <p className="text-sm text-destructive">{validationErrors.description}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="model">Base Model</Label>
              <Select
                value={newAgent.base_model}
                onValueChange={(value) => setNewAgent({ ...newAgent, base_model: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {models.map((model) => (
                    <SelectItem key={model.id} value={model.id}>
                      {model.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="system_prompt">System Prompt</Label>
              <Textarea
                id="system_prompt"
                value={newAgent.system_prompt}
                onChange={(e) => {
                  setNewAgent({ ...newAgent, system_prompt: e.target.value });
                  setValidationErrors({ ...validationErrors, system_prompt: '' });
                }}
                placeholder="Define the agent's behavior and personality..."
                maxLength={8000}
                rows={6}
              />
              {validationErrors.system_prompt && (
                <p className="text-sm text-destructive">{validationErrors.system_prompt}</p>
              )}
              <p className="text-xs text-muted-foreground">
                {newAgent.system_prompt.length} / 8000 characters
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="file">Knowledge File (Optional)</Label>
              <div className="flex gap-2">
                <Input
                  id="file"
                  type="file"
                  accept=".txt,.md,.json,.csv"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      if (file.size > MAX_FILE_SIZE) {
                        toast({
                          title: "File too large",
                          description: `File must be less than ${MAX_FILE_SIZE / 1024 / 1024}MB`,
                          variant: "destructive",
                        });
                        e.target.value = '';
                        return;
                      }
                      setSelectedFile(file);
                    }
                  }}
                  className="flex-1"
                />
                {selectedFile && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setSelectedFile(null);
                      const fileInput = document.getElementById('file') as HTMLInputElement;
                      if (fileInput) fileInput.value = '';
                    }}
                  >
                    Clear
                  </Button>
                )}
              </div>
              {selectedFile && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <FileText className="w-4 h-4" />
                  <span>{selectedFile.name}</span>
                  <span>({(selectedFile.size / 1024).toFixed(1)} KB)</span>
                </div>
              )}
              <p className="text-xs text-muted-foreground">
                Upload .txt, .md, .json, or .csv files (max 1MB)
              </p>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="is_public"
                checked={newAgent.is_public}
                onChange={(e) => setNewAgent({ ...newAgent, is_public: e.target.checked })}
                className="rounded"
              />
              <Label htmlFor="is_public" className="cursor-pointer">
                Make this agent public (visible to everyone)
              </Label>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowCreateDialog(false);
                setValidationErrors({});
              }}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button onClick={createAgent} disabled={isLoading}>
              {isLoading ? "Creating..." : "Create Agent"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
