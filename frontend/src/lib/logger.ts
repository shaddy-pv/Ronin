/**
 * Centralized Logging Service
 * 
 * Provides consistent logging across the application with environment-aware behavior:
 * - Development: Full console logging
 * - Production: Errors only (can be extended to send to monitoring service)
 */

const isDev = import.meta.env.DEV;
const isProd = import.meta.env.PROD;

export interface LoggerConfig {
  enableInfo: boolean;
  enableWarn: boolean;
  enableDebug: boolean;
  enableError: boolean;
}

class Logger {
  private config: LoggerConfig = {
    enableInfo: isDev,
    enableWarn: isDev,
    enableDebug: isDev,
    enableError: true // Always log errors
  };

  /**
   * Info level logging - general information
   * Only shown in development
   */
  info(message: string, ...args: any[]): void {
    if (this.config.enableInfo) {
      console.log(`ℹ️ [INFO] ${message}`, ...args);
    }
  }

  /**
   * Warning level logging - potential issues
   * Only shown in development
   */
  warn(message: string, ...args: any[]): void {
    if (this.config.enableWarn) {
      console.warn(`⚠️ [WARN] ${message}`, ...args);
    }
  }

  /**
   * Error level logging - actual errors
   * Always shown, can be sent to monitoring service in production
   */
  error(message: string, ...args: any[]): void {
    if (this.config.enableError) {
      console.error(`❌ [ERROR] ${message}`, ...args);
      
      // TODO: In production, send to error tracking service (Sentry, LogRocket, etc.)
      if (isProd) {
        // this.sendToMonitoring(message, args);
      }
    }
  }

  /**
   * Debug level logging - detailed debugging info
   * Only shown in development
   */
  debug(message: string, ...args: any[]): void {
    if (this.config.enableDebug) {
      console.debug(`🔍 [DEBUG] ${message}`, ...args);
    }
  }

  /**
   * Success level logging - successful operations
   * Only shown in development
   */
  success(message: string, ...args: any[]): void {
    if (this.config.enableInfo) {
      console.log(`✅ [SUCCESS] ${message}`, ...args);
    }
  }

  /**
   * Firebase operation logging
   */
  firebase(operation: string, path: string, ...args: any[]): void {
    if (this.config.enableDebug) {
      console.log(`🔥 [FIREBASE] ${operation} at ${path}`, ...args);
    }
  }

  /**
   * Update logger configuration
   */
  configure(config: Partial<LoggerConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * Send error to monitoring service (placeholder)
   */
  private sendToMonitoring(message: string, args: any[]): void {
    // TODO: Implement error tracking integration
    // Example: Sentry.captureException(new Error(message));
  }
}

// Export singleton instance
export const logger = new Logger();

// Export for convenience
export default logger;
