import { Hero } from "@/components/Hero";
import { AIModels } from "@/components/AIModels";
import { Features } from "@/components/Features";
import { Footer } from "@/components/Footer";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Hero />
      <AIModels />
      <Features />
      <Footer />
    </div>
  );
};

export default Index;
