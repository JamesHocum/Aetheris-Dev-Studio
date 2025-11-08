import { Button } from "@/components/ui/button";
import { Zap, Sparkles, Code2, Cpu, Download } from "lucide-react";
import { useNavigate } from "react-router-dom";

export const Hero = () => {
  const navigate = useNavigate();
  
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Animated Background Glow */}
      <div className="absolute inset-0 bg-gradient-glow opacity-50 animate-pulse-glow" />
      <div className="absolute inset-0 bg-gradient-terminal" />
      
      {/* Grid Pattern Overlay */}
      <div className="absolute inset-0 opacity-20" style={{
        backgroundImage: `linear-gradient(hsl(328 100% 54% / 0.1) 1px, transparent 1px),
                         linear-gradient(90deg, hsl(328 100% 54% / 0.1) 1px, transparent 1px)`,
        backgroundSize: '50px 50px'
      }} />

      <div className="container relative z-10 mx-auto px-4 py-20">
        <div className="flex flex-col items-center text-center space-y-8">
          {/* Logo/Icon */}
          <div className="relative">
            <div className="absolute inset-0 bg-primary/30 blur-3xl rounded-full animate-pulse-glow" />
            <Sparkles className="w-20 h-20 text-primary relative z-10 animate-flicker" />
          </div>

          {/* Main Title */}
          <div className="space-y-4">
            <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold text-glow-primary text-primary">
              Aetheris
            </h1>
            <p className="text-xl md:text-2xl text-secondary text-glow-accent">
              AI Dev Builder Studio
            </p>
          </div>

          {/* Description */}
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl leading-relaxed">
            Harness the power of infinite AI models to architect, build, and deploy 
            intelligent applications with divine precision.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 pt-4">
            <Button 
              variant="cyber" 
              size="lg" 
              className="text-lg"
              onClick={() => navigate('/studio')}
            >
              <Zap className="w-5 h-5" />
              Agent Builder
            </Button>
            <Button 
              variant="neon" 
              size="lg" 
              className="text-lg"
              onClick={() => {
                document.getElementById('features')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
              }}
            >
              <Code2 className="w-5 h-5" />
              Explore Features
            </Button>
            <Button 
              variant="outline" 
              size="lg" 
              className="text-lg border-primary/30 hover:bg-primary/10"
              onClick={() => navigate('/install')}
            >
              <Download className="w-5 h-5" />
              Install App
            </Button>
          </div>

          {/* Feature Pills */}
          <div className="flex flex-wrap justify-center gap-3 pt-8">
            <div className="px-4 py-2 rounded-full border border-primary/30 bg-primary/5 text-primary text-sm font-medium">
              <Cpu className="w-4 h-4 inline-block mr-2" />
              Multi-Model AI
            </div>
            <div className="px-4 py-2 rounded-full border border-secondary/30 bg-secondary/5 text-secondary text-sm font-medium">
              <Sparkles className="w-4 h-4 inline-block mr-2" />
              Cloud Integrated
            </div>
            <div className="px-4 py-2 rounded-full border border-accent/30 bg-accent/5 text-accent text-sm font-medium">
              <Zap className="w-4 h-4 inline-block mr-2" />
              Instant Deploy
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Fade */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-background to-transparent" />
    </section>
  );
};
