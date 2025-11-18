import { useState, useRef } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Copy, Trash2, FileText, Code } from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface CanvasNote {
  id: string;
  content: string;
  type: 'text' | 'code';
  x: number;
  y: number;
}

interface CanvasProps {
  agentId?: string;
}

export const Canvas = ({ agentId }: CanvasProps) => {
  const [notes, setNotes] = useState<CanvasNote[]>([]);
  const [selectedNote, setSelectedNote] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const canvasRef = useRef<HTMLDivElement>(null);

  const addNote = (type: 'text' | 'code') => {
    const newNote: CanvasNote = {
      id: `note-${Date.now()}`,
      content: type === 'code' ? '// Your code here' : 'Your note here...',
      type,
      x: 100,
      y: 100,
    };
    setNotes([...notes, newNote]);
    setSelectedNote(newNote.id);
    toast({
      title: "Note added",
      description: `New ${type} note created`,
    });
  };

  const updateNote = (id: string, content: string) => {
    setNotes(notes.map(note => 
      note.id === id ? { ...note, content } : note
    ));
  };

  const deleteNote = (id: string) => {
    setNotes(notes.filter(note => note.id !== id));
    if (selectedNote === id) setSelectedNote(null);
    toast({
      title: "Note deleted",
      description: "Note removed from canvas",
    });
  };

  const copyNote = (content: string) => {
    navigator.clipboard.writeText(content);
    toast({
      title: "Copied to clipboard",
      description: "Note content copied",
    });
  };

  const handleMouseDown = (e: React.MouseEvent, noteId: string) => {
    if ((e.target as HTMLElement).tagName === 'TEXTAREA') return;
    
    setIsDragging(noteId);
    const note = notes.find(n => n.id === noteId);
    if (note) {
      setDragOffset({
        x: e.clientX - note.x,
        y: e.clientY - note.y,
      });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging && canvasRef.current) {
      const rect = canvasRef.current.getBoundingClientRect();
      const newX = e.clientX - rect.left - dragOffset.x;
      const newY = e.clientY - rect.top - dragOffset.y;
      
      setNotes(notes.map(note => 
        note.id === isDragging 
          ? { ...note, x: Math.max(0, newX), y: Math.max(0, newY) }
          : note
      ));
    }
  };

  const handleMouseUp = () => {
    setIsDragging(null);
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    const pastedText = e.clipboardData.getData('text');
    if (pastedText && !selectedNote) {
      const isCode = pastedText.includes('{') || pastedText.includes('function') || 
                     pastedText.includes('const') || pastedText.includes('//');
      addNote(isCode ? 'code' : 'text');
      setTimeout(() => {
        const latestNote = notes[notes.length - 1];
        if (latestNote) {
          updateNote(latestNote.id, pastedText);
        }
      }, 0);
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-2 p-4 border-b border-border bg-card">
        <Button
          onClick={() => addNote('text')}
          variant="outline"
          size="sm"
          className="gap-2"
        >
          <FileText className="w-4 h-4" />
          Add Text Note
        </Button>
        <Button
          onClick={() => addNote('code')}
          variant="outline"
          size="sm"
          className="gap-2"
        >
          <Code className="w-4 h-4" />
          Add Code Snippet
        </Button>
        <div className="ml-auto text-sm text-muted-foreground">
          Paste content anywhere on canvas • Drag notes to reposition
        </div>
      </div>

      <div
        ref={canvasRef}
        className="flex-1 relative bg-gradient-to-br from-background via-card to-background overflow-auto"
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onPaste={handlePaste}
        tabIndex={0}
      >
        {notes.map(note => (
          <Card
            key={note.id}
            className={`absolute w-80 p-4 cursor-move transition-shadow ${
              selectedNote === note.id ? 'ring-2 ring-primary shadow-lg' : 'shadow-md'
            } ${isDragging === note.id ? 'opacity-75' : ''}`}
            style={{ left: note.x, top: note.y }}
            onMouseDown={(e) => handleMouseDown(e, note.id)}
            onClick={() => setSelectedNote(note.id)}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                {note.type === 'code' ? (
                  <Code className="w-4 h-4 text-accent" />
                ) : (
                  <FileText className="w-4 h-4 text-primary" />
                )}
                <span className="text-xs text-muted-foreground uppercase">
                  {note.type}
                </span>
              </div>
              <div className="flex gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    copyNote(note.content);
                  }}
                  className="h-6 w-6 p-0"
                >
                  <Copy className="w-3 h-3" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteNote(note.id);
                  }}
                  className="h-6 w-6 p-0 text-destructive"
                >
                  <Trash2 className="w-3 h-3" />
                </Button>
              </div>
            </div>
            <Textarea
              value={note.content}
              onChange={(e) => updateNote(note.id, e.target.value)}
              className={`min-h-32 resize-y ${
                note.type === 'code' 
                  ? 'font-mono text-sm bg-muted' 
                  : 'bg-background'
              }`}
              onClick={(e) => e.stopPropagation()}
            />
          </Card>
        ))}

        {notes.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center text-muted-foreground text-sm">
            <div className="text-center space-y-2">
              <p>Canvas is empty</p>
              <p className="text-xs">Add notes or paste content to get started</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};