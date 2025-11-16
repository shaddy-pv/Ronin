import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertTriangle, RefreshCw, Database, Wifi } from "lucide-react";

interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
  type?: 'general' | 'network' | 'database';
  fullScreen?: boolean;
}

export const ErrorState = ({ 
  title = "Something went wrong",
  message = "An error occurred while loading data",
  onRetry,
  type = 'general',
  fullScreen = false
}: ErrorStateProps) => {
  const getIcon = () => {
    switch (type) {
      case 'network':
        return <Wifi className="w-16 h-16 text-danger" />;
      case 'database':
        return <Database className="w-16 h-16 text-danger" />;
      default:
        return <AlertTriangle className="w-16 h-16 text-danger" />;
    }
  };

  const content = (
    <Card className="p-8 text-center max-w-md mx-auto">
      <div className="mb-4 flex justify-center">
        {getIcon()}
      </div>
      <h3 className="text-xl font-bold mb-2">{title}</h3>
      <p className="text-muted-foreground mb-6">{message}</p>
      {onRetry && (
        <Button onClick={onRetry} variant="default">
          <RefreshCw className="w-4 h-4 mr-2" />
          Try Again
        </Button>
      )}
    </Card>
  );

  if (fullScreen) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-background">
        {content}
      </div>
    );
  }

  return content;
};
