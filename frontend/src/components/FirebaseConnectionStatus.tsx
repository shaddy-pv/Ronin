import { useFirebase } from "@/contexts/FirebaseContext";
import { AlertTriangle, WifiOff } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export const FirebaseConnectionStatus = () => {
  const { dbConnected, iotError } = useFirebase();

  // Don't show anything if connected
  if (dbConnected && !iotError) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 max-w-sm">
      <Card className="p-4 bg-danger/10 border-danger/20">
        <div className="flex items-start gap-3">
          <WifiOff className="w-5 h-5 text-danger mt-0.5" />
          <div className="flex-1">
            <h4 className="font-semibold text-danger mb-1">
              Firebase Connection Lost
            </h4>
            <p className="text-sm text-muted-foreground mb-3">
              Unable to connect to Firebase. Check your internet connection and Firebase configuration.
            </p>
            <Button 
              size="sm" 
              variant="outline" 
              onClick={() => window.location.reload()}
            >
              Retry Connection
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
};
