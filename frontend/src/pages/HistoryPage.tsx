import { Sidebar } from "@/components/Sidebar";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { ErrorState } from "@/components/ErrorState";
import { Search, FileText, FileSpreadsheet } from "lucide-react";
import { useState, useMemo } from "react";
import { useFirebase } from "@/contexts/FirebaseContext";
import { useToast } from "@/hooks/use-toast";

const HistoryPage = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [riskFilter, setRiskFilter] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(50);
  const [exporting, setExporting] = useState(false);

  const { toast } = useToast();
  const { history, historyLoading } = useFirebase();

  // Filter history
  const filteredHistory = useMemo(() => {
    return history.filter(log => {
      const matchesSearch = searchQuery === "" || 
        log.riskLevel.toLowerCase().includes(searchQuery.toLowerCase()) ||
        log.mq2.toString().includes(searchQuery) ||
        log.mq135.toString().includes(searchQuery);

      const matchesRisk = riskFilter === "all" || log.riskLevel === riskFilter;

      return matchesSearch && matchesRisk;
    });
  }, [history, searchQuery, riskFilter]);

  // Pagination
  const totalPages = Math.ceil(filteredHistory.length / itemsPerPage);
  const paginatedHistory = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredHistory.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredHistory, currentPage, itemsPerPage]);

  // CSV Export
  const exportToCSV = () => {
    setExporting(true);
    try {
      const headers = ['Timestamp', 'MQ-2', 'MQ-135', 'Temperature', 'Hazard Score', 'Fire', 'Motion', 'Risk Level'];
      const csvContent = [
        headers.join(','),
        ...filteredHistory.map(log => [
          new Date(log.timestamp).toLocaleString(),
          log.mq2,
          log.mq135,
          log.temperature,
          log.hazardScore,
          log.flame ? 'Yes' : 'No',
          log.motion ? 'Yes' : 'No',
          log.riskLevel
        ].join(','))
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `arohan-history-${Date.now()}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast({
        title: "CSV Exported",
        description: `${filteredHistory.length} records exported successfully.`
      });
    } catch (error) {
      toast({
        title: "Export Failed",
        description: "Failed to export CSV file",
        variant: "destructive"
      });
    } finally {
      setExporting(false);
    }
  };

  // PDF Export (simple text-based)
  const exportToPDF = () => {
    setExporting(true);
    try {
      // Create a simple text-based PDF content
      let pdfContent = 'AROHAN Historical Data Report\n';
      pdfContent += `Generated: ${new Date().toLocaleString()}\n`;
      pdfContent += `Total Records: ${filteredHistory.length}\n\n`;
      pdfContent += '='.repeat(80) + '\n\n';

      filteredHistory.forEach((log, index) => {
        pdfContent += `Record #${index + 1}\n`;
        pdfContent += `Timestamp: ${new Date(log.timestamp).toLocaleString()}\n`;
        pdfContent += `MQ-2: ${log.mq2} | MQ-135: ${log.mq135} | Temp: ${log.temperature}°C\n`;
        pdfContent += `Hazard Score: ${log.hazardScore} | Risk: ${log.riskLevel}\n`;
        pdfContent += `Fire: ${log.flame ? 'Yes' : 'No'} | Motion: ${log.motion ? 'Yes' : 'No'}\n`;
        pdfContent += '-'.repeat(80) + '\n\n';
      });

      const blob = new Blob([pdfContent], { type: 'text/plain;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `arohan-history-${Date.now()}.txt`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast({
        title: "Report Exported",
        description: `${filteredHistory.length} records exported as text report.`
      });
    } catch (error) {
      toast({
        title: "Export Failed",
        description: "Failed to export report",
        variant: "destructive"
      });
    } finally {
      setExporting(false);
    }
  };

  // Show loading state
  if (historyLoading && history.length === 0) {
    return (
      <div className="flex min-h-screen">
        <Sidebar />
        <main className="flex-1">
          <LoadingSpinner fullScreen message="Loading historical data..." />
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      
      <main className="flex-1 overflow-auto">
        <header className="sticky top-0 z-10 bg-card border-b border-border px-4 sm:px-8 py-4">
          <h1 className="text-xl sm:text-2xl font-bold">Historical Data</h1>
          <p className="text-xs sm:text-sm text-muted-foreground">View and export sensor logs</p>
        </header>

        <div className="p-4 sm:p-8">
          {/* Filters and Export */}
          <Card className="p-4 sm:p-6 mb-4 sm:mb-6">
            <div className="space-y-4">
              <div className="flex gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input 
                    placeholder="Search logs..." 
                    className="pl-10"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                <select
                  className="px-4 py-2 border border-border rounded-md bg-background"
                  value={riskFilter}
                  onChange={(e) => setRiskFilter(e.target.value)}
                >
                  <option value="all">All Risk Levels</option>
                  <option value="SAFE">Safe</option>
                  <option value="WARNING">Warning</option>
                  <option value="DANGER">Danger</option>
                </select>
                <Button 
                  onClick={exportToCSV}
                  disabled={exporting || filteredHistory.length === 0}
                >
                  <FileSpreadsheet className="w-4 h-4 mr-2" />
                  Export CSV
                </Button>
                <Button 
                  variant="secondary"
                  onClick={exportToPDF}
                  disabled={exporting || filteredHistory.length === 0}
                >
                  <FileText className="w-4 h-4 mr-2" />
                  Export Report
                </Button>
              </div>

              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <span>
                  Showing {paginatedHistory.length} of {filteredHistory.length} records
                  {filteredHistory.length !== history.length && ` (filtered from ${history.length} total)`}
                </span>
                {filteredHistory.length > 0 && (
                  <span>
                    Page {currentPage} of {totalPages}
                  </span>
                )}
              </div>
            </div>
          </Card>

          {/* Data Table */}
          <Card>
            {historyLoading ? (
              <div className="p-12 text-center text-muted-foreground">
                Loading historical data...
              </div>
            ) : filteredHistory.length === 0 ? (
              <div className="p-12 text-center">
                <p className="text-muted-foreground mb-2">No history records found</p>
                {searchQuery && (
                  <Button variant="ghost" size="sm" onClick={() => setSearchQuery("")}>
                    Clear search
                  </Button>
                )}
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-secondary">
                      <tr>
                        <th className="px-6 py-4 text-left text-sm font-semibold">Timestamp</th>
                        <th className="px-6 py-4 text-left text-sm font-semibold">MQ-2</th>
                        <th className="px-6 py-4 text-left text-sm font-semibold">MQ-135</th>
                        <th className="px-6 py-4 text-left text-sm font-semibold">Temp (°C)</th>
                        <th className="px-6 py-4 text-left text-sm font-semibold">Hazard Score</th>
                        <th className="px-6 py-4 text-left text-sm font-semibold">Fire</th>
                        <th className="px-6 py-4 text-left text-sm font-semibold">Motion</th>
                        <th className="px-6 py-4 text-left text-sm font-semibold">Risk Level</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {paginatedHistory.map((log) => (
                        <tr key={log.id} className="hover:bg-accent transition-colors">
                          <td className="px-6 py-4 text-sm">
                            {new Date(log.timestamp).toLocaleString()}
                          </td>
                          <td className="px-6 py-4 text-sm font-mono">{log.mq2}</td>
                          <td className="px-6 py-4 text-sm font-mono">{log.mq135}</td>
                          <td className="px-6 py-4 text-sm font-mono">{log.temperature.toFixed(1)}</td>
                          <td className="px-6 py-4 text-sm font-mono">{log.hazardScore.toFixed(1)}</td>
                          <td className="px-6 py-4 text-sm">
                            {log.flame ? (
                              <span className="text-danger font-semibold">🔥 Yes</span>
                            ) : (
                              <span className="text-muted-foreground">No</span>
                            )}
                          </td>
                          <td className="px-6 py-4 text-sm">
                            {log.motion ? (
                              <span className="text-warning font-semibold">👤 Yes</span>
                            ) : (
                              <span className="text-muted-foreground">No</span>
                            )}
                          </td>
                          <td className="px-6 py-4 text-sm">
                            <span className={`font-semibold ${
                              log.riskLevel === 'SAFE' ? 'text-safe' :
                              log.riskLevel === 'WARNING' ? 'text-warning' : 'text-danger'
                            }`}>
                              {log.riskLevel}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-between px-6 py-4 border-t border-border">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                    >
                      Previous
                    </Button>
                    <span className="text-sm text-muted-foreground">
                      Page {currentPage} of {totalPages}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
                    >
                      Next
                    </Button>
                  </div>
                )}
              </>
            )}
          </Card>
        </div>
      </main>
    </div>
  );
};

export default HistoryPage;
