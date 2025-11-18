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

const models = [
  { id: 'google/gemini-2.5-flash', name: 'Gemini 2.5 Flash' },
  { id: 'google/gemini-2.5-pro', name: 'Gemini 2.5 Pro' },
  { id: 'google/gemini-2.5-flash-lite', name: 'Gemini 2.5 Flash Lite' },
  { id: 'openai/gpt-5', name: 'GPT-5' },
  { id: 'openai/gpt-5-mini', name: 'GPT-5 Mini' },
  { id: 'openai/gpt-5-nano', name: 'GPT-5 Nano' },
];

interface Agent {
  id: string;
  name: string;
  description: string;
  base_model: string;
  voice_id: string | null;
  system_prompt: string | null;
  created_by: string;
  is_public: boolean;
  created_at: string;
}

interface AgentManagerProps {
  username: string;
  onAgentSelect: (agentId: string, agentName: string) => void;
}

export const AgentManager = ({ username, onAgentSelect }: AgentManagerProps) => {
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

  useEffect(() => {
    loadAgents();
  }, [username]);

  const loadAgents = async () => {
    const { data, error } = await supabase
      .from('agents')
      .select('*')
      .eq('created_by', username)
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
    if (!newAgent.name.trim()) {
      toast({
        title: "Name required",
        description: "Please enter a name for your agent",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    const { data, error } = await supabase
      .from('agents')
      .insert({
        name: newAgent.name,
        description: newAgent.description,
        base_model: newAgent.base_model,
        system_prompt: newAgent.system_prompt || null,
        created_by: username,
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
      const fileContent = await selectedFile.text();
      const { error: fileError } = await supabase
        .from('agent_files')
        .insert({
          agent_id: data.id,
          file_name: selectedFile.name,
          file_type: selectedFile.type,
          file_content: fileContent,
          file_size: selectedFile.size,
          uploaded_by: username,
        });

      if (fileError) {
        toast({
          title: "File upload failed",
          description: fileError.message,
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

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  return (
    <div className="space-y-4 p-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-glow-primary">Your Agents</h2>
        <Button
          onClick={() => setShowCreateDialog(true)}
          className="gap-2"
        >
          <Plus className="w-4 h-4" />
          Create Agent
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {agents.map((agent) => (
          <Card key={agent.id} className="p-4 hover:shadow-lg transition-shadow">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-2">
                <Bot className="w-5 h-5 text-primary" />
                <h3 className="font-semibold">{agent.name}</h3>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => deleteAgent(agent.id, agent.name)}
                className="h-8 w-8 p-0 text-destructive"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>

            <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
              {agent.description || 'No description'}
            </p>

            <div className="flex items-center justify-between text-xs text-muted-foreground mb-3">
              <span>{models.find(m => m.id === agent.base_model)?.name}</span>
              {agent.is_public && (
                <span className="px-2 py-1 bg-accent/20 text-accent rounded">Public</span>
              )}
            </div>

            <Button
              onClick={() => onAgentSelect(agent.id, agent.name)}
              variant="outline"
              size="sm"
              className="w-full"
            >
              Open Workspace
            </Button>
          </Card>
        ))}

        {agents.length === 0 && (
          <Card className="col-span-full p-8 text-center">
            <Bot className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground mb-4">No agents yet</p>
            <Button onClick={() => setShowCreateDialog(true)} variant="outline">
              Create your first agent
            </Button>
          </Card>
        )}
      </div>

      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Create New Agent</DialogTitle>
            <DialogDescription>
              Configure your AI agent with custom settings and capabilities
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="name">Agent Name</Label>
              <Input
                id="name"
                value={newAgent.name}
                onChange={(e) => setNewAgent({ ...newAgent, name: e.target.value })}
                placeholder="e.g., Code Assistant, Content Writer"
              />
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={newAgent.description}
                onChange={(e) => setNewAgent({ ...newAgent, description: e.target.value })}
                placeholder="What does this agent do?"
                rows={3}
              />
            </div>

            <div>
              <Label htmlFor="model">Base AI Model</Label>
              <Select
                value={newAgent.base_model}
                onValueChange={(value) => setNewAgent({ ...newAgent, base_model: value })}
              >
                <SelectTrigger id="model">
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

            <div>
              <Label htmlFor="prompt">System Prompt (Optional)</Label>
              <Textarea
                id="prompt"
                value={newAgent.system_prompt}
                onChange={(e) => setNewAgent({ ...newAgent, system_prompt: e.target.value })}
                placeholder="Define the agent's personality and behavior..."
                rows={4}
              />
            </div>

            <div>
              <Label htmlFor="file">Upload Knowledge File (Optional)</Label>
              <div className="flex items-center gap-2">
                <Input
                  id="file"
                  type="file"
                  onChange={handleFileSelect}
                  accept=".txt,.md,.json,.csv"
                  className="cursor-pointer"
                />
                {selectedFile && (
                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <FileText className="w-4 h-4" />
                    {selectedFile.name}
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="public"
                checked={newAgent.is_public}
                onChange={(e) => setNewAgent({ ...newAgent, is_public: e.target.checked })}
                className="cursor-pointer"
              />
              <Label htmlFor="public" className="cursor-pointer">
                Make this agent public (others can view and use it)
              </Label>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
              Cancel
            </Button>
            <Button onClick={createAgent} disabled={isLoading}>
              {isLoading ? 'Creating...' : 'Create Agent'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};