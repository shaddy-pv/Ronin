import { Sidebar } from "@/components/Sidebar";
import { StatusBadge } from "@/components/StatusBadge";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { ErrorState } from "@/components/ErrorState";
import { Search, X } from "lucide-react";
import { AlertDetailModal } from "@/components/AlertDetailModal";
import { useState, useMemo } from "react";
import { useFirebase } from "@/contexts/FirebaseContext";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
const Alerts = () => {
  const [selectedAlert, setSelectedAlert] = useState<any | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [severityFilter, setSeverityFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  // Get alerts from Firebase
  const { alerts, alertsLoading, resolveAlert } = useFirebase();

  // Get unique types from alerts
  const alertTypes = useMemo(() => {
    const types = new Set(alerts.map(alert => alert.type));
    return Array.from(types);
  }, [alerts]);

  // Filter alerts
  const filteredAlerts = useMemo(() => {
    return alerts.filter(alert => {
      // Search filter
      const matchesSearch = searchQuery === "" || 
        alert.type.toLowerCase().includes(searchQuery.toLowerCase()) ||
        alert.summary.toLowerCase().includes(searchQuery.toLowerCase());

      // Severity filter
      const matchesSeverity = severityFilter === "all" || alert.severity === severityFilter;

      // Type filter
      const matchesType = typeFilter === "all" || alert.type === typeFilter;

      // Status filter
      const matchesStatus = statusFilter === "all" || 
        (statusFilter === "open" && !alert.resolved) ||
        (statusFilter === "resolved" && alert.resolved);

      return matchesSearch && matchesSeverity && matchesType && matchesStatus;
    });
  }, [alerts, searchQuery, severityFilter, typeFilter, statusFilter]);

  const openAlertDetail = (alert: any) => {
    setSelectedAlert(alert);
    setModalOpen(true);
  };

  const handleResolveAlert = async (alertId: string) => {
    await resolveAlert(alertId);
    setModalOpen(false);
  };

  const clearFilters = () => {
    setSearchQuery("");
    setSeverityFilter("all");
    setTypeFilter("all");
    setStatusFilter("all");
  };

  const hasActiveFilters = searchQuery !== "" || severityFilter !== "all" || typeFilter !== "all" || statusFilter !== "all";

  // Map Firebase severity to StatusBadge format
  const mapSeverity = (severity: string): 'SAFE' | 'WARNING' | 'DANGER' => {
    switch (severity.toLowerCase()) {
      case 'low':
        return 'SAFE';
      case 'medium':
        return 'WARNING';
      case 'high':
      case 'critical':
        return 'DANGER';
      default:
        return 'SAFE';
    }
  };

  // Show loading state
  if (alertsLoading && alerts.length === 0) {
    return (
      <div className="flex min-h-screen">
        <Sidebar />
        <main className="flex-1">
          <LoadingSpinner fullScreen message="Loading alerts..." />
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      
      <main className="flex-1 overflow-auto">
        <header className="sticky top-0 z-10 bg-card border-b border-border px-4 sm:px-8 py-4">
          <h1 className="text-2xl font-bold">Alert Management</h1>
          <p className="text-sm text-muted-foreground">Monitor and review system alerts</p>
        </header>

        <div className="p-4 sm:p-8">
          {/* Filters */}
          <Card className="p-4 sm:p-6 mb-4 sm:mb-6">
            <div className="space-y-4">
              <div className="flex gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input 
                    placeholder="Search alerts..." 
                    className="pl-10"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                {hasActiveFilters && (
                  <Button variant="ghost" onClick={clearFilters}>
                    <X className="w-4 h-4 mr-2" />
                    Clear Filters
                  </Button>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Severity Filter */}
                <div>
                  <label className="text-xs text-muted-foreground mb-2 block">Severity</label>
                  <Select value={severityFilter} onValueChange={setSeverityFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="All Severities" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Severities</SelectItem>
                      <SelectItem value="SAFE">Safe</SelectItem>
                      <SelectItem value="WARNING">Warning</SelectItem>
                      <SelectItem value="DANGER">Danger</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Type Filter */}
                <div>
                  <label className="text-xs text-muted-foreground mb-2 block">Type</label>
                  <Select value={typeFilter} onValueChange={setTypeFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="All Types" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Types</SelectItem>
                      {alertTypes.map(type => (
                        <SelectItem key={type} value={type}>{type}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Status Filter */}
                <div>
                  <label className="text-xs text-muted-foreground mb-2 block">Status</label>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="All Statuses" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Statuses</SelectItem>
                      <SelectItem value="open">Open</SelectItem>
                      <SelectItem value="resolved">Resolved</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <span>Showing {filteredAlerts.length} of {alerts.length} alerts</span>
                {hasActiveFilters && (
                  <span className="text-primary">Filters active</span>
                )}
              </div>
            </div>
          </Card>

          {/* Alerts Table */}
          <Card>
            {filteredAlerts.length === 0 ? (
              <div className="p-12 text-center">
                <p className="text-muted-foreground mb-2">No alerts found</p>
                {hasActiveFilters && (
                  <Button variant="ghost" size="sm" onClick={clearFilters}>
                    Clear filters to see all alerts
                  </Button>
                )}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[640px]">
                  <thead className="bg-secondary">
                    <tr>
                      <th className="px-6 py-4 text-left text-sm font-semibold">Timestamp</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold">Type</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold">Severity</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold">Summary</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold">Status</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {filteredAlerts.map((alert) => (
                      <tr key={alert.id} className="hover:bg-accent transition-colors">
                        <td className="px-6 py-4 text-sm">
                          {new Date(alert.timestamp).toLocaleString()}
                        </td>
                        <td className="px-6 py-4 text-sm font-medium">{alert.type}</td>
                        <td className="px-6 py-4">
                          <StatusBadge status={mapSeverity(alert.severity)} size="sm" />
                        </td>
                        <td className="px-6 py-4 text-sm max-w-md truncate">{alert.summary}</td>
                        <td className="px-6 py-4 text-sm">
                          <span className={`px-2 py-1 rounded text-xs font-semibold ${
                            alert.resolved ? "bg-safe/20 text-safe" : "bg-warning/20 text-warning"
                          }`}>
                            {alert.resolved ? "Resolved" : "Open"}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <Button variant="ghost" size="sm" onClick={() => openAlertDetail(alert)}>
                            View Details
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </div>
      </main>

      {/* Alert Detail Modal */}
      <AlertDetailModal 
        open={modalOpen} 
        onOpenChange={setModalOpen}
        alert={selectedAlert}
        onResolve={handleResolveAlert}
      />
    </div>
  );
};

export default Alerts;
