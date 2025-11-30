import React from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { 
  AlertTriangle, 
  User, 
  UserX, 
  Zap, 
  Settings,
  Clock,
  ExternalLink
} from 'lucide-react';
import { RoverAlert, RoverAlertType } from '@/types/alerts';
import { useRoverAlerts } from '@/hooks/useRoverAlerts';

interface RecentAlertsProps {
  className?: string;
}

const getAlertIcon = (type: RoverAlertType) => {
  switch (type) {
    case 'KNOWN_FACE':
      return <User className="w-4 h-4" />;
    case 'UNKNOWN_FACE':
      return <UserX className="w-4 h-4" />;
    case 'ACCIDENT':
      return <AlertTriangle className="w-4 h-4" />;
    case 'SYSTEM':
      return <Settings className="w-4 h-4" />;
    default:
      return <Zap className="w-4 h-4" />;
  }
};

const getAlertColor = (type: RoverAlertType) => {
  switch (type) {
    case 'KNOWN_FACE':
      return 'bg-green-500/10 text-green-500 border-green-500/20';
    case 'UNKNOWN_FACE':
      return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20';
    case 'ACCIDENT':
      return 'bg-red-500/10 text-red-500 border-red-500/20';
    case 'SYSTEM':
      return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
    default:
      return 'bg-gray-500/10 text-gray-500 border-gray-500/20';
  }
};

const formatTime = (timestamp: string) => {
  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  
  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  
  return date.toLocaleDateString();
};

export const RecentAlerts: React.FC<RecentAlertsProps> = ({ className = '' }) => {
  const { recentAlerts, addAlert } = useRoverAlerts();

  const createTestAlert = () => {
    const testTypes: RoverAlertType[] = ['KNOWN_FACE', 'UNKNOWN_FACE', 'ACCIDENT', 'SYSTEM'];
    const randomType = testTypes[Math.floor(Math.random() * testTypes.length)];
    const messages = {
      'KNOWN_FACE': 'Test: John Doe detected in camera feed',
      'UNKNOWN_FACE': 'Test: Unknown person detected',
      'ACCIDENT': 'Test: Potential accident detected',
      'SYSTEM': 'Test: System alert generated'
    };
    
    addAlert(randomType, messages[randomType], {
      confidence: 0.75 + Math.random() * 0.25,
      meta: { test: true }
    });
  };

  return (
    <Card className={`p-4 sm:p-6 ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold">Recent Alerts</h3>
        <Button variant="ghost" size="sm" className="gap-2" asChild>
          <Link to="/alerts">
            <ExternalLink className="w-4 h-4" />
            View All
          </Link>
        </Button>
      </div>

      {recentAlerts.length === 0 ? (
        <div className="text-center py-8">
          <Zap className="w-12 h-12 mx-auto mb-3 text-muted-foreground" />
          <p className="text-muted-foreground">No recent alerts</p>
          <p className="text-xs text-muted-foreground mt-1">
            Alerts will appear here when detected
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {recentAlerts.map((alert) => (
            <div
              key={alert.id}
              className="flex items-start gap-3 p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
            >
              {/* Alert Icon */}
              <div className={`p-2 rounded-full ${getAlertColor(alert.type)}`}>
                {getAlertIcon(alert.type)}
              </div>

              {/* Alert Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <Badge variant="outline" className="text-xs">
                    {alert.type.replace('_', ' ')}
                  </Badge>
                  {alert.confidence && (
                    <span className="text-xs text-muted-foreground">
                      {Math.round(alert.confidence * 100)}%
                    </span>
                  )}
                </div>
                
                <p className="text-sm font-medium mb-1 line-clamp-2">
                  {alert.message}
                </p>
                
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Clock className="w-3 h-3" />
                  {formatTime(alert.createdAt)}
                </div>
              </div>

              {/* Snapshot Thumbnail */}
              {alert.snapshotUrl && (
                <div className="flex-shrink-0">
                  <img
                    src={alert.snapshotUrl}
                    alt="Alert snapshot"
                    className="w-12 h-9 object-cover rounded border"
                  />
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Quick Actions */}
      <div className="mt-4 pt-4 border-t border-border">
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            className="flex-1"
            onClick={createTestAlert}
          >
            Test Alert
          </Button>
          <Button variant="outline" size="sm" className="flex-1" asChild>
            <Link to="/alerts">
              Settings
            </Link>
          </Button>
        </div>
      </div>
    </Card>
  );
};