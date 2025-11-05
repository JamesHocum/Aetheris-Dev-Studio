import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Download, Smartphone, Monitor, Check } from "lucide-react";
import { useNavigate } from "react-router-dom";

const Install = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Check if already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
    }

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setIsInstallable(true);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setIsInstallable(false);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      console.log('User accepted the install prompt');
    }
    
    setDeferredPrompt(null);
    setIsInstallable(false);
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="container max-w-4xl">
        <Button 
          variant="ghost" 
          onClick={() => navigate('/')}
          className="mb-8"
        >
          ← Back to Home
        </Button>

        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-primary via-purple-400 to-pink-400 bg-clip-text text-transparent">
            Install Aetheris
          </h1>
          <p className="text-lg text-muted-foreground">
            Get the full app experience on your device
          </p>
        </div>

        {isInstalled ? (
          <Card className="border-primary/20 bg-card/50 backdrop-blur">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Check className="w-6 h-6 text-green-500" />
                <CardTitle>App Already Installed</CardTitle>
              </div>
              <CardDescription>
                Aetheris is already installed on your device. You can access it from your home screen or app menu.
              </CardDescription>
            </CardHeader>
          </Card>
        ) : (
          <div className="grid md:grid-cols-2 gap-6 mb-12">
            <Card className="border-primary/20 bg-card/50 backdrop-blur">
              <CardHeader>
                <Smartphone className="w-8 h-8 mb-2 text-primary" />
                <CardTitle>Mobile Installation</CardTitle>
                <CardDescription>Install on your phone or tablet</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {isInstallable ? (
                    <Button 
                      onClick={handleInstallClick}
                      className="w-full"
                      size="lg"
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Install Now
                    </Button>
                  ) : (
                    <>
                      <div className="space-y-2 text-sm">
                        <p className="font-semibold">iOS (Safari):</p>
                        <ol className="list-decimal list-inside space-y-1 text-muted-foreground">
                          <li>Tap the Share button</li>
                          <li>Scroll and tap "Add to Home Screen"</li>
                          <li>Tap "Add"</li>
                        </ol>
                      </div>
                      <div className="space-y-2 text-sm">
                        <p className="font-semibold">Android (Chrome):</p>
                        <ol className="list-decimal list-inside space-y-1 text-muted-foreground">
                          <li>Tap the menu (3 dots)</li>
                          <li>Tap "Add to Home screen"</li>
                          <li>Tap "Add"</li>
                        </ol>
                      </div>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card className="border-primary/20 bg-card/50 backdrop-blur">
              <CardHeader>
                <Monitor className="w-8 h-8 mb-2 text-primary" />
                <CardTitle>Desktop Installation</CardTitle>
                <CardDescription>Install on your computer</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {isInstallable ? (
                    <Button 
                      onClick={handleInstallClick}
                      className="w-full"
                      size="lg"
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Install Now
                    </Button>
                  ) : (
                    <div className="space-y-2 text-sm">
                      <p className="font-semibold">Chrome, Edge, or Brave:</p>
                      <ol className="list-decimal list-inside space-y-1 text-muted-foreground">
                        <li>Look for the install icon in the address bar</li>
                        <li>Click "Install" when prompted</li>
                        <li>Or use the menu → "Install Aetheris"</li>
                      </ol>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        <Card className="border-primary/20 bg-card/50 backdrop-blur">
          <CardHeader>
            <CardTitle>Why Install?</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-muted-foreground">
              <li className="flex items-start gap-2">
                <Check className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                <span>Works offline - access your tools anytime</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                <span>Faster load times and better performance</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                <span>Native app experience on your device</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                <span>Quick access from your home screen</span>
              </li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Install;