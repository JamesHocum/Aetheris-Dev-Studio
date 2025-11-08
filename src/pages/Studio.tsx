import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Sparkles, Send, ArrowLeft, Save, FolderOpen, Trash2, Menu, Image as ImageIcon, ChevronDown, User } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "@/hooks/use-toast";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { z } from "zod";
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

const usernameSchema = z.string()
  .trim()
  .min(1, { message: "Name cannot be empty" })
  .max(50, { message: "Name must be less than 50 characters" })
  .regex(/^[a-zA-Z0-9\s_-]+$/, { message: "Name can only contain letters, numbers, spaces, hyphens and underscores" });

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
  const [command, setCommand] = useState("");
  const [selectedModel, setSelectedModel] = useState(models[0].id);
  const [username, setUsername] = useState<string>("");
  const [usernameInput, setUsernameInput] = useState("");
  const [showUsernameDialog, setShowUsernameDialog] = useState(false);
  const [usernameError, setUsernameError] = useState<string>("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [currentProjectId, setCurrentProjectId] = useState<string | null>(null);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);

  // Load username from localStorage on mount
  useEffect(() => {
    const savedUsername = localStorage.getItem('aetheris-username');
    if (savedUsername) {
      setUsername(savedUsername);
      setMessages([
        { role: 'aetheris', content: `Welcome back, ${savedUsername}! I am Aetheris, your AI Dev Builder. Ready to continue architecting excellence?` }
      ]);
    } else {
      setShowUsernameDialog(true);
    }
  }, []);

  // Load projects from localStorage on mount
  useEffect(() => {
    const savedProjects = localStorage.getItem('aetheris-projects');
    if (savedProjects) {
      setProjects(JSON.parse(savedProjects));
    }
  }, []);

  // Save projects to localStorage whenever they change
  useEffect(() => {
    if (projects.length > 0) {
      localStorage.setItem('aetheris-projects', JSON.stringify(projects));
    }
  }, [projects]);

  const handleSaveUsername = () => {
    try {
      const validatedUsername = usernameSchema.parse(usernameInput);
      setUsername(validatedUsername);
      localStorage.setItem('aetheris-username', validatedUsername);
      setShowUsernameDialog(false);
      setUsernameError("");
      setMessages([
        { role: 'aetheris', content: `Greetings, ${validatedUsername}! I am Aetheris, your AI Dev Builder. Together, we shall architect the future. What vision shall we bring to life today?` }
      ]);
      toast({
        title: "Welcome!",
        description: `Nice to meet you, ${validatedUsername}!`,
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        setUsernameError(error.issues[0].message);
      }
    }
  };

  const handleChangeUsername = () => {
    setUsernameInput(username);
    setShowUsernameDialog(true);
  };

  const handleSend = async () => {
    if (!command.trim()) return;
    
    const userMessage = { role: 'user' as const, content: command };
    const newMessages = [...messages, userMessage];
    
    setMessages(newMessages);
    setCommand("");

    // Add placeholder for assistant response
    const assistantPlaceholder = { role: 'aetheris' as const, content: '' };
    setMessages([...newMessages, assistantPlaceholder]);

    try {
      const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-chat`;
      
      const resp = await fetch(CHAT_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({ messages: newMessages, model: selectedModel, username }),
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
    if (!command.trim()) return;

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
      const IMAGE_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-image`;
      
      const resp = await fetch(IMAGE_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
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
      { role: 'aetheris', content: username 
        ? `Ready for a new challenge, ${username}? Let's build something extraordinary together.` 
        : 'Greetings, Developer. I am Aetheris, your AI Dev Builder. How may I assist you in crafting your vision today?' 
      }
    ]);
    toast({
      title: "New project started",
      description: "Ready for your next build.",
    });
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Username Dialog */}
      <Dialog open={showUsernameDialog} onOpenChange={setShowUsernameDialog}>
        <DialogContent className="sm:max-w-md bg-card border-border">
          <DialogHeader>
            <DialogTitle className="text-primary text-glow-primary">Welcome to Aetheris Studio</DialogTitle>
            <DialogDescription>
              Please enter your name so I can address you properly during our collaboration.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="username" className="text-foreground">Your Name</Label>
              <Input
                id="username"
                placeholder="Enter your name"
                value={usernameInput}
                onChange={(e) => {
                  setUsernameInput(e.target.value);
                  setUsernameError("");
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleSaveUsername();
                  }
                }}
                className="bg-background border-border text-foreground"
                maxLength={50}
              />
              {usernameError && (
                <p className="text-sm text-destructive">{usernameError}</p>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button onClick={handleSaveUsername} variant="cyber" className="w-full">
              Begin Building
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
              className="gap-2"
            >
              <Save className="w-4 h-4" />
              Save
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              onClick={handleChangeUsername}
              className="gap-2"
            >
              <User className="w-4 h-4" />
              {username || "Set Name"}
            </Button>
            <Sheet open={isHistoryOpen} onOpenChange={setIsHistoryOpen}>
              <SheetTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2">
                  <Menu className="w-4 h-4" />
                  History
                </Button>
              </SheetTrigger>
              <SheetContent>
                <SheetHeader>
                  <SheetTitle>Project History</SheetTitle>
                  <SheetDescription>
                    Load or delete your previous builds
                  </SheetDescription>
                </SheetHeader>
                <div className="mt-6 space-y-3">
                  {projects.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-8">
                      No saved projects yet
                    </p>
                  ) : (
                    projects.map((project) => (
                      <Card 
                        key={project.id}
                        className={`p-4 cursor-pointer hover:bg-accent/50 transition-colors ${
                          currentProjectId === project.id ? 'border-primary' : ''
                        }`}
                        onClick={() => handleLoadProject(project)}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <h3 className="font-medium text-foreground truncate">
                              {project.name}
                            </h3>
                            <p className="text-xs text-muted-foreground mt-1">
                              {new Date(project.updatedAt).toLocaleDateString()} at {new Date(project.updatedAt).toLocaleTimeString()}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {project.messages.length} messages
                            </p>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => handleDeleteProject(project.id, e)}
                            className="shrink-0"
                          >
                            <Trash2 className="w-4 h-4 text-destructive" />
                          </Button>
                        </div>
                      </Card>
                    ))
                  )}
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Chat Area */}
        <Card className="bg-card/50 backdrop-blur-sm border-border p-6 mb-6 min-h-[60vh] max-h-[60vh] overflow-y-auto">
          <div className="space-y-6">
            {messages.map((msg, idx) => (
              <div 
                key={idx} 
                className={`flex gap-4 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
              >
                <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                  msg.role === 'aetheris' 
                    ? 'bg-primary/20 border border-primary/30' 
                    : 'bg-accent/20 border border-accent/30'
                }`}>
                  {msg.role === 'aetheris' ? (
                    <Sparkles className="w-5 h-5 text-primary" />
                  ) : (
                    <span className="text-accent font-bold">U</span>
                  )}
                </div>
                <div className={`flex-1 ${msg.role === 'user' ? 'text-right' : 'text-left'}`}>
                  <div className={`inline-block px-4 py-3 rounded-lg ${
                    msg.role === 'aetheris'
                      ? 'bg-primary/10 border border-primary/20 text-foreground'
                      : 'bg-accent/10 border border-accent/20 text-foreground'
                  }`}>
                    <p>{msg.content}</p>
                    {msg.imageUrl && (
                      <img 
                        src={msg.imageUrl} 
                        alt="Generated" 
                        className="mt-3 rounded-lg max-w-full max-h-96 object-contain"
                      />
                    )}
                    {msg.isGeneratingImage && (
                      <div className="mt-3 flex items-center gap-2 text-sm text-muted-foreground">
                        <Sparkles className="w-4 h-4 animate-pulse" />
                        <span>Creating your image...</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Input Area */}
        <Card className="bg-card/50 backdrop-blur-sm border-border p-6">
          <div className="space-y-4">
            <Textarea
              value={command}
              onChange={(e) => setCommand(e.target.value)}
              placeholder="Describe what you want to build... (e.g., 'Create a login page with email authentication')"
              className="min-h-[120px] bg-background/50 border-border text-foreground resize-none"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
            />
            <div className="flex justify-between items-center">
              <p className="text-sm text-muted-foreground">
                Press Enter to send, Shift+Enter for new line
              </p>
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  onClick={handleGenerateImage}
                  disabled={!command.trim() || isGeneratingImage}
                  className="gap-2"
                >
                  <ImageIcon className="w-4 h-4" />
                  Generate Image
                </Button>
                <Button 
                  variant="cyber" 
                  onClick={handleSend}
                  disabled={!command.trim()}
                  className="gap-2"
                >
                  <Send className="w-4 h-4" />
                  Send Command
                </Button>
              </div>
            </div>
          </div>
        </Card>

        {/* Quick Actions */}
        <div className="mt-6 flex flex-wrap gap-3 justify-center">
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => setCommand("Create a landing page with hero section")}
            className="border-primary/30 hover:bg-primary/10"
          >
            Landing Page
          </Button>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => setCommand("Add user authentication with login and signup")}
            className="border-secondary/30 hover:bg-secondary/10"
          >
            Add Auth
          </Button>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => setCommand("Create a dashboard with data tables")}
            className="border-accent/30 hover:bg-accent/10"
          >
            Dashboard
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Studio;
