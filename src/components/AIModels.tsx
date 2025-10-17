import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Brain, Sparkles, Zap, Bot, MessageSquare, Image } from "lucide-react";

const models = [
  {
    icon: Brain,
    name: "Gemini 2.5 Pro",
    provider: "Google",
    description: "Advanced reasoning with multimodal capabilities",
    features: ["Vision", "128K Context", "Complex Reasoning"],
    color: "primary"
  },
  {
    icon: Sparkles,
    name: "GPT-5",
    provider: "OpenAI",
    description: "Powerful all-rounder with exceptional accuracy",
    features: ["Long Context", "Multimodal", "Top Reasoning"],
    color: "secondary"
  },
  {
    icon: Zap,
    name: "Gemini Flash",
    provider: "Google",
    description: "Balanced performance with speed and intelligence",
    features: ["Fast", "Cost-Effective", "Multimodal"],
    color: "accent"
  },
  {
    icon: Bot,
    name: "Claude Sonnet 4.5",
    provider: "Anthropic",
    description: "Superior reasoning and extended thinking",
    features: ["200K Context", "Vision", "Code Expert"],
    color: "primary"
  },
  {
    icon: MessageSquare,
    name: "GPT-5 Mini",
    provider: "OpenAI",
    description: "Fast and efficient for most tasks",
    features: ["Low Latency", "Affordable", "Reliable"],
    color: "secondary"
  },
  {
    icon: Image,
    name: "Stable Diffusion",
    provider: "Stability AI",
    description: "State-of-the-art image generation",
    features: ["High Quality", "Creative", "Customizable"],
    color: "accent"
  }
];

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
            Access the world's most powerful AI models through a unified interface
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {models.map((model, index) => {
            const Icon = model.icon;
            return (
              <Card
                key={index}
                className="group relative overflow-hidden border-border bg-card/50 backdrop-blur-sm hover:border-primary/50 transition-all duration-300 hover:scale-105"
              >
                {/* Gradient Glow on Hover */}
                <div className="absolute inset-0 bg-gradient-cyber opacity-0 group-hover:opacity-10 transition-opacity duration-300" />
                
                <div className="relative p-6 space-y-4">
                  {/* Icon */}
                  <div className={`inline-flex p-3 rounded-lg bg-${model.color}/10 border border-${model.color}/20`}>
                    <Icon className={`w-6 h-6 text-${model.color}`} />
                  </div>

                  {/* Title & Provider */}
                  <div>
                    <h3 className="text-xl font-bold text-foreground mb-1">
                      {model.name}
                    </h3>
                    <p className="text-sm text-muted-foreground">{model.provider}</p>
                  </div>

                  {/* Description */}
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {model.description}
                  </p>

                  {/* Features */}
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
