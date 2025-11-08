import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Sparkles, Send, ArrowLeft, Save, FolderOpen, Trash2, Menu } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "@/hooks/use-toast";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

interface Project {
  id: string;
  name: string;
  messages: Array<{ role: 'user' | 'aetheris'; content: string }>;
  createdAt: number;
  updatedAt: number;
}

const Studio = () => {
  const navigate = useNavigate();
  const [command, setCommand] = useState("");
  const [messages, setMessages] = useState<Array<{ role: 'user' | 'aetheris'; content: string }>>([
    { role: 'aetheris', content: 'Greetings, Developer. I am Aetheris, your AI Dev Builder. How may I assist you in crafting your vision today?' }
  ]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [currentProjectId, setCurrentProjectId] = useState<string | null>(null);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);

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

  const handleSend = () => {
    if (!command.trim()) return;
    
    const newMessages = [...messages, 
      { role: 'user' as const, content: command },
      { role: 'aetheris' as const, content: 'I am processing your request. Full AI integration coming soon...' }
    ];
    
    setMessages(newMessages);
    setCommand("");

    // Auto-save to current project if one is loaded
    if (currentProjectId) {
      handleUpdateProject(currentProjectId, newMessages);
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

  const handleUpdateProject = (projectId: string, newMessages: Array<{ role: 'user' | 'aetheris'; content: string }>) => {
    setProjects(prev => prev.map(p => 
      p.id === projectId 
        ? { ...p, messages: newMessages, updatedAt: Date.now() }
        : p
    ));
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
      { role: 'aetheris', content: 'Greetings, Developer. I am Aetheris, your AI Dev Builder. How may I assist you in crafting your vision today?' }
    ]);
    toast({
      title: "New project started",
      description: "Ready for your next build.",
    });
  };

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
          <div className="flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-primary animate-flicker" />
            <h1 className="text-2xl font-bold text-primary text-glow-primary">Aetheris Studio</h1>
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
                  <p className={`inline-block px-4 py-3 rounded-lg ${
                    msg.role === 'aetheris'
                      ? 'bg-primary/10 border border-primary/20 text-foreground'
                      : 'bg-accent/10 border border-accent/20 text-foreground'
                  }`}>
                    {msg.content}
                  </p>
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
