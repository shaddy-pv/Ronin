import React, { useState } from 'react';
import { Sidebar } from '@/components/Sidebar';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  AlertTriangle, 
  User, 
  UserX, 
  Zap, 
  Settings,
  Clock,
  Search,
  Filter,
  Trash2,
  Download
} from 'lucide-react';
import { RoverAlert, RoverAlertType } from '@/types/alerts';
import { useRoverAlerts } from '@/hooks/useRoverAlerts';

const getAlertIcon = (type: RoverAlertType) => {
  switch (type) {
    case 'KNOWN_FACE':
      return <User className="w-5 h-5" />;
    case 'UNKNOWN_FACE':
      return <UserX className="w-5 h-5" />;
    case 'ACCIDENT':
      return <AlertTriangle className="w-5 h-5" />;
    case 'SYSTEM':
      return <Settings className="w-5 h-5" />;
    default:
      return <Zap className="w-5 h-5" />;
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

const formatDateTime = (timestamp: string) => {
  const date = new Date(timestamp);
  return {
    date: date.toLocaleDateString(),
    time: date.toLocaleTimeString(),
    relative: getRelativeTime(date)
  };
};

const getRelativeTime = (date: Date) => {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  
  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays}d ago`;
};

const AlertsPage: React.FC = () => {
  const { alerts, clearAlerts, removeAlert } = useRoverAlerts();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<RoverAlertType | 'ALL'>('ALL');

  // Filter alerts based on search and type
  const filteredAlerts = alerts.filter(alert => {
    const matchesSearch = alert.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         alert.type.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === 'ALL' || alert.type === filterType;
    return matchesSearch && matchesType;
  });

  // Group alerts by date
  const groupedAlerts = filteredAlerts.reduce((groups, alert) => {
    const date = new Date(alert.createdAt).toDateString();
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(alert);
    return groups;
  }, {} as Record<string, RoverAlert[]>);

  const exportAlerts = () => {
    const dataStr = JSON.stringify(alerts, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `rover-alerts-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      
      <main className="flex-1 overflow-auto bg-background">
        <header className="sticky top-0 z-10 bg-card border-b border-border px-4 sm:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">Alerts & Notifications</h1>
              <p className="text-sm text-muted-foreground">
                Computer vision alerts and system notifications
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="gap-1">
                <Zap className="w-3 h-3" />
                {alerts.length} Total
              </Badge>
            </div>
          </div>
        </header>

        <div className="p-4 sm:p-8">
          {/* Controls */}
          <Card className="p-4 mb-6">
            <div className="flex flex-col sm:flex-row gap-4">
              {/* Search */}
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Search alerts..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              {/* Filter */}
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-muted-foreground" />
                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value as RoverAlertType | 'ALL')}
                  className="px-3 py-2 border border-border rounded-md bg-background text-sm"
                >
                  <option value="ALL">All Types</option>
                  <option value="KNOWN_FACE">Known Face</option>
                  <option value="UNKNOWN_FACE">Unknown Face</option>
                  <option value="ACCIDENT">Accident</option>
                  <option value="SYSTEM">System</option>
                </select>
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={exportAlerts}>
                  <Download className="w-4 h-4 mr-2" />
                  Export
                </Button>
                <Button variant="destructive" size="sm" onClick={clearAlerts}>
                  <Trash2 className="w-4 h-4 mr-2" />
                  Clear All
                </Button>
              </div>
            </div>
          </Card>

          {/* Alerts List */}
          {filteredAlerts.length === 0 ? (
            <Card className="p-12">
              <div className="text-center">
                <Zap className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-semibold mb-2">No Alerts Found</h3>
                <p className="text-muted-foreground">
                  {alerts.length === 0 
                    ? 'No alerts have been generated yet.'
                    : 'No alerts match your current filters.'}
                </p>
              </div>
            </Card>
          ) : (
            <div className="space-y-6">
              {Object.entries(groupedAlerts).map(([date, dayAlerts]) => (
                <div key={date}>
                  <h3 className="text-sm font-semibold text-muted-foreground mb-3 sticky top-20 bg-background py-2">
                    {date}
                  </h3>
                  <div className="space-y-3">
                    {dayAlerts.map((alert) => {
                      const { time, relative } = formatDateTime(alert.createdAt);
                      
                      return (
                        <Card key={alert.id} className="p-4 hover:bg-accent/50 transition-colors">
                          <div className="flex items-start gap-4">
                            {/* Alert Icon */}
                            <div className={`p-3 rounded-full ${getAlertColor(alert.type)}`}>
                              {getAlertIcon(alert.type)}
                            </div>

                            {/* Alert Content */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-2">
                                <Badge variant="outline" className="text-xs">
                                  {alert.type.replace('_', ' ')}
                                </Badge>
                                {alert.confidence && (
                                  <span className="text-xs text-muted-foreground">
                                    {Math.round(alert.confidence * 100)}% confidence
                                  </span>
                                )}
                                <div className="flex items-center gap-1 text-xs text-muted-foreground ml-auto">
                                  <Clock className="w-3 h-3" />
                                  {time} • {relative}
                                </div>
                              </div>
                              
                              <p className="font-medium mb-2">{alert.message}</p>
                              
                              {alert.meta && (
                                <div className="text-xs text-muted-foreground">
                                  {Object.entries(alert.meta).map(([key, value]) => (
                                    <span key={key} className="mr-3">
                                      {key}: {JSON.stringify(value)}
                                    </span>
                                  ))}
                                </div>
                              )}
                            </div>

                            {/* Snapshot */}
                            {alert.snapshotUrl && (
                              <div className="flex-shrink-0">
                                <img
                                  src={alert.snapshotUrl}
                                  alt="Alert snapshot"
                                  className="w-20 h-15 object-cover rounded border cursor-pointer hover:opacity-80"
                                  onClick={() => window.open(alert.snapshotUrl, '_blank')}
                                />
                              </div>
                            )}

                            {/* Actions */}
                            <div className="flex-shrink-0">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => removeAlert(alert.id)}
                                className="text-muted-foreground hover:text-destructive"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        </Card>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default AlertsPage;