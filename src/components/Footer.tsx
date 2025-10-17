import { Sparkles } from "lucide-react";

export const Footer = () => {
  return (
    <footer className="relative py-12 px-4 border-t border-border/50">
      <div className="container mx-auto">
        <div className="flex flex-col items-center space-y-6">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <Sparkles className="w-6 h-6 text-primary" />
            <span className="text-lg font-bold text-primary">Aetheris: Goddess</span>
          </div>

          {/* Links */}
          <div className="flex flex-wrap justify-center gap-6 text-sm text-muted-foreground">
            <a href="#" className="hover:text-primary transition-colors">
              Documentation
            </a>
            <a href="#" className="hover:text-primary transition-colors">
              API Reference
            </a>
            <a href="#" className="hover:text-primary transition-colors">
              Community
            </a>
            <a href="#" className="hover:text-primary transition-colors">
              Support
            </a>
          </div>

          {/* Developer Info */}
          <div className="text-center space-y-2">
            <p className="text-xs text-muted-foreground">
              A Spell Weaver Studios Application
            </p>
            <div className="text-xs text-muted-foreground space-y-1">
              <p>
                © 2025 Harold Hocum | Architect & Systems Engineer
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-4">
                <a 
                  href="mailto:Harold.Hocum@Gmail.com" 
                  className="hover:text-secondary transition-colors"
                >
                  Harold.Hocum@Gmail.com
                </a>
                <span className="hidden sm:inline">•</span>
                <a 
                  href="https://harold-hocum-develop-7loc.bolt.host/" 
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-secondary transition-colors"
                >
                  Portfolio
                </a>
              </div>
            </div>
          </div>

          {/* Bottom Glow */}
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1/2 h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent" />
        </div>
      </div>
    </footer>
  );
};
