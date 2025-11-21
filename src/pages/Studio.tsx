import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import type { User } from "@supabase/supabase-js";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Sparkles, Send, ArrowLeft, Save, FolderOpen, Trash2, Menu, Image as ImageIcon, ChevronDown, User as UserIcon, Layout, Bot, LogOut } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { Canvas } from "@/components/Canvas";
import { AgentManager } from "@/components/AgentManager";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

interface Message {
  role: 'user' | 'aetheris';
  content: string;
  imageUrl?: string;
  isGeneratingImage?: boolean;
}

interface Project {
  id: string;
  name: string;
  messages: Message[];
  createdAt: number;
  updatedAt: number;
}

const models = [
  { id: 'google/gemini-2.5-flash', name: 'Gemini 2.5 Flash', description: 'Balanced - Fast & efficient' },
  { id: 'google/gemini-2.5-pro', name: 'Gemini 2.5 Pro', description: 'Most powerful - Best reasoning' },
  { id: 'google/gemini-2.5-flash-lite', name: 'Gemini 2.5 Flash Lite', description: 'Fastest - Simple tasks' },
  { id: 'openai/gpt-5', name: 'GPT-5', description: 'Premium - Excellent reasoning' },
  { id: 'openai/gpt-5-mini', name: 'GPT-5 Mini', description: 'Fast - Good performance' },
  { id: 'openai/gpt-5-nano', name: 'GPT-5 Nano', description: 'Efficient - Cost saving' },
];

const Studio = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [displayName, setDisplayName] = useState("");
  const [loading, setLoading] = useState(true);
  const [command, setCommand] = useState("");
  const [selectedModel, setSelectedModel] = useState(models[0].id);
  const [messages, setMessages] = useState<Message[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [currentProjectId, setCurrentProjectId] = useState<string | null>(null);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [viewMode, setViewMode] = useState<'chat' | 'canvas' | 'agents'>('chat');
  const [selectedAgentId, setSelectedAgentId] = useState<string | null>(null);
  const [selectedAgentName, setSelectedAgentName] = useState<string>("");

  // Set up auth listener and load user
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setUser(session?.user ?? null);
        
        if (session?.user) {
          // Load profile
          const { data: profile } = await supabase
            .from("profiles")
            .select("display_name")
            .eq("id", session.user.id)
            .maybeSingle();
          
          if (profile) {
            setDisplayName(profile.display_name || "");
            setMessages([
              { role: 'aetheris', content: `Welcome back, ${profile.display_name}! I am Aetheris, your AI Dev Builder. Ready to continue architecting excellence?` }
            ]);
          }
        } else {
          // User logged out, redirect to auth
          navigate("/auth");
        }
        
        setLoading(false);
      }
    );

    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        navigate("/auth");
        setLoading(false);
      } else {
        setUser(session.user);
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  // Load projects from localStorage on mount
  useEffect(() => {
    if (user) {
      const savedProjects = localStorage.getItem(`aetheris-projects-${user.id}`);
      if (savedProjects) {
        setProjects(JSON.parse(savedProjects));
      }
    }
  }, [user]);

  // Save projects to localStorage whenever they change
  useEffect(() => {
    if (user && projects.length > 0) {
      localStorage.setItem(`aetheris-projects-${user.id}`, JSON.stringify(projects));
    }
  }, [projects, user]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate("/auth");
  };

  const handleSend = async () => {
    if (!command.trim() || !user) return;
    
    const userMessage = { role: 'user' as const, content: command };
    const newMessages = [...messages, userMessage];
    
    setMessages(newMessages);
    setCommand("");

    // Add placeholder for assistant response
    const assistantPlaceholder = { role: 'aetheris' as const, content: '' };
    setMessages([...newMessages, assistantPlaceholder]);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-chat`;
      
      const resp = await fetch(CHAT_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`,
        },
        body: JSON.stringify({ messages: newMessages, model: selectedModel }),
      });

      if (!resp.ok || !resp.body) {
        throw new Error('Failed to start stream');
      }

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let textBuffer = '';
      let streamDone = false;
      let assistantContent = '';

      while (!streamDone) {
        const { done, value } = await reader.read();
        if (done) break;
        textBuffer += decoder.decode(value, { stream: true });

        let newlineIndex: number;
        while ((newlineIndex = textBuffer.indexOf('\n')) !== -1) {
          let line = textBuffer.slice(0, newlineIndex);
          textBuffer = textBuffer.slice(newlineIndex + 1);

          if (line.endsWith('\r')) line = line.slice(0, -1);
          if (line.startsWith(':') || line.trim() === '') continue;
          if (!line.startsWith('data: ')) continue;

          const jsonStr = line.slice(6).trim();
          if (jsonStr === '[DONE]') {
            streamDone = true;
            break;
          }

          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content as string | undefined;
            if (content) {
              assistantContent += content;
              setMessages(prev => {
                const updated = [...prev];
                updated[updated.length - 1] = { 
                  role: 'aetheris', 
                  content: assistantContent 
                };
                return updated;
              });
            }
          } catch {
            textBuffer = line + '\n' + textBuffer;
            break;
          }
        }
      }

      // Final update with complete message
      const finalMessages = [...newMessages, { role: 'aetheris' as const, content: assistantContent }];
      setMessages(finalMessages);

      // Auto-save to current project if one is loaded
      if (currentProjectId) {
        handleUpdateProject(currentProjectId, finalMessages);
      }

    } catch (error) {
      console.error('Error calling AI:', error);
      setMessages(prev => {
        const updated = [...prev];
        updated[updated.length - 1] = { 
          role: 'aetheris', 
          content: 'I apologize, but I encountered an error processing your request. Please try again.' 
        };
        return updated;
      });
      toast({
        title: "Error",
        description: "Failed to connect to AI. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleSaveProject = () => {
    const projectName = prompt('Enter project name:');
    if (!projectName) return;

    const newProject: Project = {
      id: Date.now().toString(),
      name: projectName,
      messages: messages,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    setProjects(prev => [newProject, ...prev]);
    setCurrentProjectId(newProject.id);
    toast({
      title: "Project saved",
      description: `"${projectName}" has been saved successfully.`,
    });
  };

  const handleLoadProject = (project: Project) => {
    setMessages(project.messages);
    setCurrentProjectId(project.id);
    setIsHistoryOpen(false);
    toast({
      title: "Project loaded",
      description: `"${project.name}" has been loaded.`,
    });
  };

  const handleUpdateProject = (projectId: string, newMessages: Message[]) => {
    setProjects(prev => prev.map(p => 
      p.id === projectId 
        ? { ...p, messages: newMessages, updatedAt: Date.now() }
        : p
    ));
  };

  const handleGenerateImage = async () => {
    if (!command.trim() || !user) return;

    const prompt = command;
    const userMessage: Message = { role: 'user', content: `Generate image: ${prompt}` };
    const newMessages = [...messages, userMessage];
    
    setMessages(newMessages);
    setCommand("");
    setIsGeneratingImage(true);

    // Add placeholder for image generation
    const imagePlaceholder: Message = { 
      role: 'aetheris', 
      content: 'Generating your image...',
      isGeneratingImage: true
    };
    setMessages([...newMessages, imagePlaceholder]);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const IMAGE_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-image`;
      
      const resp = await fetch(IMAGE_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`,
        },
        body: JSON.stringify({ prompt }),
      });

      if (!resp.ok) {
        const error = await resp.json();
        throw new Error(error.error || 'Failed to generate image');
      }

      const { imageUrl, message } = await resp.json();

      const finalMessages = [
        ...newMessages, 
        { 
          role: 'aetheris' as const, 
          content: message,
          imageUrl,
          isGeneratingImage: false
        }
      ];
      setMessages(finalMessages);

      if (currentProjectId) {
        handleUpdateProject(currentProjectId, finalMessages);
      }

      toast({
        title: "Image generated",
        description: "Your image has been created successfully.",
      });

    } catch (error) {
      console.error('Error generating image:', error);
      setMessages(prev => {
        const updated = [...prev];
        updated[updated.length - 1] = { 
          role: 'aetheris', 
          content: 'I apologize, but I encountered an error generating the image. Please try again.',
          isGeneratingImage: false
        };
        return updated;
      });
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to generate image",
        variant: "destructive",
      });
    } finally {
      setIsGeneratingImage(false);
    }
  };

  const handleDeleteProject = (projectId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('Are you sure you want to delete this project?')) {
      setProjects(prev => prev.filter(p => p.id !== projectId));
      if (currentProjectId === projectId) {
        setCurrentProjectId(null);
        setMessages([
          { role: 'aetheris', content: 'Greetings, Developer. I am Aetheris, your AI Dev Builder. How may I assist you in crafting your vision today?' }
        ]);
      }
      toast({
        title: "Project deleted",
        description: "The project has been removed from history.",
      });
    }
  };

  const handleNewProject = () => {
    setCurrentProjectId(null);
    setMessages([
      { role: 'aetheris', content: displayName
        ? `Ready for a new challenge, ${displayName}? Let's build something extraordinary together.` 
        : 'Greetings, Developer. I am Aetheris, your AI Dev Builder. How may I assist you in crafting your vision today?' 
      }
    ]);
    toast({
      title: "New project started",
      description: "Ready for your next build.",
    });
  };

  const handleAgentSelect = (agentId: string, agentName: string) => {
    setSelectedAgentId(agentId);
    setSelectedAgentName(agentName);
    setViewMode('canvas');
    toast({
      title: "Agent workspace opened",
      description: `Now working with ${agentName}`,
    });
  };

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
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Button 
            variant="ghost" 
            onClick={() => navigate('/')}
            className="gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </Button>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Sparkles className="w-6 h-6 text-primary animate-flicker" />
              <h1 className="text-2xl font-bold text-primary text-glow-primary">Aetheris Studio</h1>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2">
                  {models.find(m => m.id === selectedModel)?.name}
                  <ChevronDown className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-64 bg-card border-border z-50">
                {models.map((model) => (
                  <DropdownMenuItem
                    key={model.id}
                    onClick={() => {
                      setSelectedModel(model.id);
                      toast({
                        title: "Model changed",
                        description: `Now using ${model.name}`,
                      });
                    }}
                    className={`cursor-pointer ${selectedModel === model.id ? 'bg-accent' : ''}`}
                  >
                    <div className="flex flex-col">
                      <span className="font-medium text-foreground">{model.name}</span>
                      <span className="text-xs text-muted-foreground">{model.description}</span>
                    </div>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">{displayName}</span>
            <Button 
              variant="ghost" 
              size="sm"
              onClick={handleSignOut}
              className="gap-2"
            >
              <LogOut className="w-4 h-4" />
              Sign Out
            </Button>
          </div>
        </div>

        {/* View Mode Tabs */}
        <div className="border-t border-border">
          <div className="container mx-auto px-4">
            <div className="flex gap-2 py-2">
              <Button
                variant={viewMode === 'chat' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('chat')}
                className="gap-2"
              >
                <Sparkles className="w-4 h-4" />
                Chat
              </Button>
              <Button
                variant={viewMode === 'canvas' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('canvas')}
                className="gap-2"
              >
                <Layout className="w-4 h-4" />
                Canvas
                {selectedAgentName && <span className="text-xs opacity-70">({selectedAgentName})</span>}
              </Button>
              <Button
                variant={viewMode === 'agents' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('agents')}
                className="gap-2"
              >
                <Bot className="w-4 h-4" />
                Agents
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      {viewMode === 'agents' ? (
        <div className="max-w-7xl mx-auto px-4 py-8">
          <AgentManager userId={user.id} onAgentSelect={handleAgentSelect} />
        </div>
      ) : viewMode === 'canvas' ? (
        <Canvas agentId={selectedAgentId} agentName={selectedAgentName} />
      ) : (
        <div className="flex h-[calc(100vh-180px)]">
          <div className="flex-1 flex flex-col">
            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-4 py-6 space-y-6">
              {messages.map((msg, idx) => (
                <div 
                  key={idx} 
                  className={`flex gap-4 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  {msg.role === 'aetheris' && (
                    <div className="w-10 h-10 rounded-full bg-primary/20 border border-primary flex items-center justify-center flex-shrink-0">
                      <Sparkles className="w-5 h-5 text-primary" />
                    </div>
                  )}
                  <Card className={`max-w-[80%] p-4 ${
                    msg.role === 'user' 
                      ? 'bg-primary/10 border-primary/20' 
                      : 'bg-card'
                  }`}>
                    <p className="whitespace-pre-wrap text-foreground">{msg.content}</p>
                    {msg.imageUrl && (
                      <img 
                        src={msg.imageUrl} 
                        alt="Generated" 
                        className="mt-3 rounded-lg max-w-full"
                      />
                    )}
                  </Card>
                  {msg.role === 'user' && (
                    <div className="w-10 h-10 rounded-full bg-accent/20 border border-accent flex items-center justify-center flex-shrink-0">
                      <UserIcon className="w-5 h-5 text-accent" />
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Input Area */}
            <div className="border-t border-border p-4 bg-card/50 backdrop-blur-sm">
              <div className="container mx-auto max-w-4xl">
                <div className="flex gap-2 mb-3">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={handleNewProject}
                    className="gap-2"
                  >
                    New Project
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={handleSaveProject}
                    disabled={messages.length === 0}
                    className="gap-2"
                  >
                    <Save className="w-4 h-4" />
                    Save
                  </Button>
                  <Sheet open={isHistoryOpen} onOpenChange={setIsHistoryOpen}>
                    <SheetTrigger asChild>
                      <Button variant="outline" size="sm" className="gap-2">
                        <FolderOpen className="w-4 h-4" />
                        History ({projects.length})
                      </Button>
                    </SheetTrigger>
                    <SheetContent className="w-full sm:max-w-md bg-card border-border">
                      <SheetHeader>
                        <SheetTitle className="text-primary">Project History</SheetTitle>
                        <SheetDescription>
                          Load or delete your saved projects
                        </SheetDescription>
                      </SheetHeader>
                      <div className="mt-6 space-y-2">
                        {projects.length === 0 ? (
                          <p className="text-sm text-muted-foreground text-center py-8">
                            No saved projects yet
                          </p>
                        ) : (
                          projects.map((project) => (
                            <Card
                              key={project.id}
                              className={`p-3 cursor-pointer hover:bg-accent/50 transition-colors ${
                                currentProjectId === project.id ? 'border-primary' : ''
                              }`}
                              onClick={() => handleLoadProject(project)}
                            >
                              <div className="flex items-start justify-between gap-2">
                                <div className="flex-1">
                                  <h4 className="font-medium text-foreground">{project.name}</h4>
                                  <p className="text-xs text-muted-foreground">
                                    {new Date(project.updatedAt).toLocaleDateString()}
                                  </p>
                                </div>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={(e) => handleDeleteProject(project.id, e)}
                                  className="text-destructive hover:text-destructive hover:bg-destructive/10"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>
                            </Card>
                          ))
                        )}
                      </div>
                    </SheetContent>
                  </Sheet>
                </div>
                <div className="flex gap-2">
                  <Textarea
                    value={command}
                    onChange={(e) => setCommand(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSend();
                      }
                    }}
                    placeholder="Describe what you want to build..."
                    className="flex-1 min-h-[60px] resize-none bg-background border-border text-foreground"
                  />
                  <div className="flex flex-col gap-2">
                    <Button
                      onClick={handleSend}
                      disabled={!command.trim()}
                      className="px-4 h-full"
                    >
                      <Send className="w-4 h-4 mr-2" />
                      Send
                    </Button>
                    <Button
                      onClick={handleGenerateImage}
                      disabled={!command.trim() || isGeneratingImage}
                      variant="outline"
                      className="px-4 h-full"
                    >
                      <ImageIcon className="w-4 h-4 mr-2" />
                      Image
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Studio;
