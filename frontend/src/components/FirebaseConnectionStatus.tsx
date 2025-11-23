import { useFirebase } from "@/contexts/FirebaseContext";
import { useAuth } from "@/contexts/AuthContext";
import { WifiOff } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";

export const FirebaseConnectionStatus = () => {
  const { dbConnected, iotError, iotLoading } = useFirebase();
  const { currentUser } = useAuth();
  const [showError, setShowError] = useState(false);

  useEffect(() => {
    // Only show error if:
    // 1. User is logged in (not on login/signup page)
    // 2. Not loading
    // 3. Actually has an error
    // 4. Wait 5 seconds before showing (give time to connect)
    
    if (!currentUser) {
      setShowError(false);
      return;
    }

    if (iotLoading) {
      setShowError(false);
      return;
    }

    const timer = setTimeout(() => {
      if (!dbConnected && iotError) {
        setShowError(true);
      }
    }, 5000); // Wait 5 seconds before showing error

    return () => clearTimeout(timer);
  }, [dbConnected, iotError, iotLoading, currentUser]);

  // Don't show anything if connected or not logged in
  if (!showError || !currentUser) {
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
