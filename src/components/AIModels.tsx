import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Brain, Sparkles, Zap, Bot, MessageSquare, Image, Cpu, Flame, Rocket, Star } from "lucide-react";
import { AI_MODELS } from "@/lib/models";

const iconMap: Record<string, typeof Brain> = {
  'google/gemini-2.5-pro': Brain,
  'google/gemini-3.1-pro-preview': Flame,
  'google/gemini-3-flash-preview': Rocket,
  'google/gemini-2.5-flash': Zap,
  'google/gemini-2.5-flash-lite': Cpu,
  'google/gemini-3-pro-image-preview': Image,
  'openai/gpt-5': Sparkles,
  'openai/gpt-5.2': Star,
  'openai/gpt-5-mini': MessageSquare,
  'openai/gpt-5-nano': Bot,
};

const tierColors: Record<string, string> = {
  flagship: 'primary',
  balanced: 'secondary',
  fast: 'accent',
  economy: 'secondary',
  creative: 'accent',
};

export const AIModels = () => {
  return (
    <section id="models" className="py-20 px-4 relative">
      <div className="container mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            <span className="text-glow-primary text-primary">Infinite</span>
            <span className="text-foreground"> AI Models</span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Access the world's most powerful AI models through a unified interface — {AI_MODELS.length} models and growing
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {AI_MODELS.map((model, index) => {
            const Icon = iconMap[model.id] || Bot;
            const color = tierColors[model.tier] || 'primary';
            return (
              <Card
                key={index}
                className="group relative overflow-hidden border-border bg-card/50 backdrop-blur-sm hover:border-primary/50 transition-all duration-300 hover:scale-105"
              >
                <div className="absolute inset-0 bg-gradient-cyber opacity-0 group-hover:opacity-10 transition-opacity duration-300" />
                
                <div className="relative p-6 space-y-4">
                  <div className={`inline-flex p-3 rounded-lg bg-${color}/10 border border-${color}/20`}>
                    <Icon className={`w-6 h-6 text-${color}`} />
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-xl font-bold text-foreground">
                        {model.name}
                      </h3>
                      <Badge variant="outline" className="text-[10px] uppercase tracking-wider border-primary/30 text-primary">
                        {model.tier}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">{model.provider}</p>
                  </div>

                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {model.description}
                  </p>

                  <div className="flex flex-wrap gap-2 pt-2">
                    {model.features.map((feature, i) => (
                      <Badge
                        key={i}
                        variant="outline"
                        className="text-xs border-border bg-background/50"
                      >
                        {feature}
                      </Badge>
                    ))}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
};
