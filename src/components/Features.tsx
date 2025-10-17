import { Card } from "@/components/ui/card";
import { Terminal, Database, Lock, Zap, Cloud, Code } from "lucide-react";

const features = [
  {
    icon: Terminal,
    title: "AI Agent Builder",
    description: "Create intelligent agents with natural language - no coding required"
  },
  {
    icon: Database,
    title: "Cloud Database",
    description: "Integrated PostgreSQL with automatic schema generation"
  },
  {
    icon: Lock,
    title: "Secure Auth",
    description: "Built-in authentication with email, social, and passwordless options"
  },
  {
    icon: Zap,
    title: "Edge Functions",
    description: "Deploy serverless functions that scale automatically"
  },
  {
    icon: Cloud,
    title: "File Storage",
    description: "Secure cloud storage for all your media and documents"
  },
  {
    icon: Code,
    title: "API Integration",
    description: "Connect to any service with our flexible API framework"
  }
];

export const Features = () => {
  return (
    <section className="py-20 px-4 relative">
      <div className="container mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            <span className="text-foreground">Powered by </span>
            <span className="text-glow-accent text-accent">Lovable Cloud</span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Full-stack development platform with everything you need to build production-ready applications
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <Card
                key={index}
                className="group relative overflow-hidden border-border bg-card/50 backdrop-blur-sm p-6 hover:border-accent/50 transition-all duration-300"
              >
                <div className="space-y-4">
                  <div className="inline-flex p-3 rounded-lg bg-accent/10 border border-accent/20 glow-accent">
                    <Icon className="w-6 h-6 text-accent" />
                  </div>
                  
                  <h3 className="text-xl font-bold text-foreground">
                    {feature.title}
                  </h3>
                  
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {feature.description}
                  </p>
                </div>

                {/* Animated Border */}
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
                  <div className="absolute inset-0 border-2 border-accent/20 rounded-lg" />
                </div>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
};
