import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import type { User } from "@supabase/supabase-js";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowLeft, Plus, Settings, Trash2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import type { Agent } from "@/types/agent";
import { AgentManager } from "@/components/AgentManager";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export default function Agents() {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        navigate("/auth");
      } else {
        setUser(session.user);
        loadAgents(session.user.id);
      }
      setLoading(false);
    });
  }, [navigate]);

  async function loadAgents(userId: string) {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("agents")
        .select("*")
        .eq("owner_id", userId)
        .order("created_at", { ascending: false });

      if (error) throw error;

      setAgents(data || []);
    } catch (error) {
      console.error("Error loading agents:", error);
      toast({
        title: "Error",
        description: "Failed to load agents",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }

  async function togglePublish(agent: Agent) {
    if (!user) return;

    setTogglingId(agent.id);
    try {
      const newPublished = !agent.published;
      const newVisibility = newPublished ? "public" : "private";

      const { error } = await supabase
        .from("agents")
        .update({
          published: newPublished,
          visibility: newVisibility,
          updated_at: new Date().toISOString(),
        })
        .eq("id", agent.id)
        .eq("owner_id", user.id);

      if (error) throw error;

      setAgents((prev) =>
        prev.map((a) =>
          a.id === agent.id
            ? { ...a, published: newPublished, visibility: newVisibility }
            : a
        )
      );

      toast({
        title: newPublished ? "Agent published" : "Agent unpublished",
        description: newPublished
          ? `${agent.name} is now ${newVisibility}`
          : `${agent.name} is now private`,
      });
    } catch (error) {
      console.error("Error toggling publish:", error);
      toast({
        title: "Error",
        description: "Failed to update agent",
        variant: "destructive",
      });
    } finally {
      setTogglingId(null);
    }
  }

  async function deleteAgent(agentId: string, agentName: string) {
    if (!user) return;
    if (!confirm(`Are you sure you want to delete "${agentName}"?`)) return;

    try {
      const { error } = await supabase
        .from("agents")
        .delete()
        .eq("id", agentId)
        .eq("owner_id", user.id);

      if (error) throw error;

      setAgents((prev) => prev.filter((a) => a.id !== agentId));
      toast({
        title: "Agent deleted",
        description: `${agentName} has been removed`,
      });
    } catch (error) {
      console.error("Error deleting agent:", error);
      toast({
        title: "Error",
        description: "Failed to delete agent",
        variant: "destructive",
      });
    }
  }

  function handleAgentCreated() {
    setIsCreateDialogOpen(false);
    if (user) {
      loadAgents(user.id);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                onClick={() => navigate("/")}
                className="gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                Back
              </Button>
              <div>
                <h1 className="text-3xl font-semibold text-foreground">
                  Agent Management
                </h1>
                <p className="text-sm text-muted-foreground mt-1">
                  Create, publish, and manage your AI agents
                </p>
              </div>
            </div>
            <Button
              onClick={() => setIsCreateDialogOpen(true)}
              className="gap-2"
            >
              <Plus className="w-4 h-4" />
              Create Agent
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {agents.length === 0 ? (
          <Card className="p-12 text-center">
            <p className="text-muted-foreground mb-4">
              You haven't created any agents yet.
            </p>
            <Button onClick={() => setIsCreateDialogOpen(true)} className="gap-2">
              <Plus className="w-4 h-4" />
              Create Your First Agent
            </Button>
          </Card>
        ) : (
          <div className="space-y-4">
            {agents.map((agent) => (
              <Card
                key={agent.id}
                className="p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 hover:border-primary/50 transition-colors"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h2 className="text-lg font-semibold text-foreground">
                      {agent.name}
                    </h2>
                    <span className="rounded-full border border-border bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                      {agent.base_model}
                    </span>
                    {agent.published && (
                      <span className="rounded-full bg-primary/15 px-2 py-0.5 text-xs text-primary font-medium">
                        Published · {agent.visibility}
                      </span>
                    )}
                  </div>
                  {agent.description && (
                    <p className="mt-2 text-sm text-muted-foreground line-clamp-2">
                      {agent.description}
                    </p>
                  )}
                  <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
                    <span>Temp: {agent.temperature}</span>
                    <span>•</span>
                    <span>Max Tokens: {agent.max_tokens}</span>
                    {agent.tags && agent.tags.length > 0 && (
                      <>
                        <span>•</span>
                        <span>Tags: {agent.tags.join(", ")}</span>
                      </>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigate(`/agents/${agent.id}`)}
                    className="gap-2"
                  >
                    <Settings className="w-4 h-4" />
                    Settings
                  </Button>

                  <Button
                    variant={agent.published ? "secondary" : "default"}
                    size="sm"
                    onClick={() => togglePublish(agent)}
                    disabled={togglingId === agent.id}
                  >
                    {togglingId === agent.id
                      ? "Updating..."
                      : agent.published
                      ? "Unpublish"
                      : "Publish"}
                  </Button>

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => deleteAgent(agent.id, agent.name)}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </main>

      {/* Create Agent Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create New Agent</DialogTitle>
            <DialogDescription>
              Configure your AI agent with custom settings and capabilities
            </DialogDescription>
          </DialogHeader>
          {user && (
            <AgentManager
              userId={user.id}
              onAgentSelect={handleAgentCreated}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
