/**
 * Chart Utilities for Time-Series Data
 * Provides consistent time handling and formatting across all charts
 */

export interface TimeSeriesDataPoint {
  timestamp: number;
  [key: string]: any;
}

/**
 * Format timestamp for chart X-axis
 * Returns time in HH:MM format (e.g., "07:05 PM")
 */
export function formatChartTime(timestamp: number): string {
  const date = new Date(timestamp);
  return date.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  });
}

/**
 * Build time-series data for charts with consistent windowing
 * @param data - Array of data points with timestamps
 * @param windowMinutes - Time window in minutes (default: 60)
 * @param maxPoints - Maximum number of points to show (default: 20)
 * @returns Filtered and formatted data ready for charts
 */
export function buildTimeSeries<T extends TimeSeriesDataPoint>(
  data: T[],
  windowMinutes: number = 60,
  maxPoints: number = 20
): T[] {
  if (!data || data.length === 0) return [];

  const now = Date.now();
  const windowMs = windowMinutes * 60 * 1000;
  const cutoffTime = now - windowMs;

  // Filter by time window
  const filtered = data.filter(point => point.timestamp >= cutoffTime);

  // Sort by timestamp (oldest first)
  const sorted = filtered.sort((a, b) => a.timestamp - b.timestamp);

  // Limit to maxPoints (keep most recent)
  const limited = sorted.slice(-maxPoints);

  return limited;
}

/**
 * Get time window label for chart title
 * @param windowMinutes - Time window in minutes
 * @returns Human-readable label (e.g., "Last Hour", "Last 30 Minutes")
 */
export function getTimeWindowLabel(windowMinutes: number): string {
  if (windowMinutes === 60) return 'Last Hour';
  if (windowMinutes === 30) return 'Last 30 Minutes';
  if (windowMinutes === 15) return 'Last 15 Minutes';
  if (windowMinutes < 60) return `Last ${windowMinutes} Minutes`;
  
  const hours = Math.floor(windowMinutes / 60);
  return `Last ${hours} Hour${hours > 1 ? 's' : ''}`;
}

/**
 * Calculate optimal tick interval for X-axis based on data points
 * @param dataLength - Number of data points
 * @returns Tick interval (show every Nth point)
 */
export function getOptimalTickInterval(dataLength: number): number {
  if (dataLength <= 5) return 1;  // Show all ticks
  if (dataLength <= 10) return 2; // Show every 2nd tick
  if (dataLength <= 20) return 4; // Show every 4th tick
  return Math.ceil(dataLength / 5); // Show ~5 ticks
}

/**
 * Format tooltip timestamp
 * Returns full date and time for tooltip display
 */
export function formatTooltipTime(timestamp: number): string {
  const date = new Date(timestamp);
  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true
  });
}
