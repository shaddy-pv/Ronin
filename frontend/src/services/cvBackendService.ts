import { RoverAlert, RoverAlertType } from '@/types/alerts';

// CV Backend Configuration
const CV_BACKEND_URL = import.meta.env.VITE_CV_BACKEND_URL || 'http://localhost:5000';

export interface AnalyzeFrameRequest {
  source: 'esp32' | 'upload';
  imageUrl?: string;
}

export interface AnalyzeFrameResponse {
  status: 'success' | 'error';
  alert?: RoverAlert;
  message?: string;
  error?: string;
}

export interface BackendHealth {
  status: string;
  opencv_ready: boolean;
  known_faces: number;
  alerts_count: number;
  esp32_url: string;
}

export class CVBackendService {
  private baseUrl: string;

  constructor(baseUrl: string = CV_BACKEND_URL) {
    this.baseUrl = baseUrl;
  }

  // Analyze frame from ESP32-CAM
  async analyzeFrame(request: AnalyzeFrameRequest = { source: 'esp32' }): Promise<AnalyzeFrameResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/analyze-frame`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
        signal: AbortSignal.timeout(15000), // 15 second timeout
      });

      if (!response.ok) {
        throw new Error(`Backend returned ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      return data;

    } catch (error) {
      console.error('CV Backend analyze frame error:', error);
      
      if (error instanceof Error) {
        return {
          status: 'error',
          error: error.message
        };
      }
      
      return {
        status: 'error',
        error: 'Unknown error occurred'
      };
    }
  }

  // Get alerts from backend
  async getAlerts(): Promise<RoverAlert[]> {
    try {
      const response = await fetch(`${this.baseUrl}/alerts`, {
        method: 'GET',
        signal: AbortSignal.timeout(5000),
      });

      if (!response.ok) {
        throw new Error(`Backend returned ${response.status}`);
      }

      const alerts = await response.json();
      return Array.isArray(alerts) ? alerts : [];

    } catch (error) {
      console.debug('CV Backend get alerts error:', error);
      return []; // Graceful fallback
    }
  }

  // Add alert to backend
  async addAlert(alert: RoverAlert): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/alerts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(alert),
        signal: AbortSignal.timeout(5000),
      });

      return response.ok;

    } catch (error) {
      console.debug('CV Backend add alert error:', error);
      return false; // Graceful fallback
    }
  }

  // Check backend health
  async checkHealth(): Promise<BackendHealth | null> {
    try {
      const response = await fetch(`${this.baseUrl}/health`, {
        method: 'GET',
        signal: AbortSignal.timeout(5000),
      });

      if (!response.ok) {
        throw new Error(`Health check failed: ${response.status}`);
      }

      const health = await response.json();
      return health;

    } catch (error) {
      console.debug('CV Backend health check error:', error);
      return null; // Backend not available
    }
  }

  // Test connection to backend
  async testConnection(): Promise<boolean> {
    const health = await this.checkHealth();
    return health !== null && health.status === 'healthy';
  }

  // Get backend status for UI
  async getStatus(): Promise<{
    connected: boolean;
    health?: BackendHealth;
    error?: string;
  }> {
    try {
      const health = await this.checkHealth();
      
      if (health) {
        return {
          connected: true,
          health
        };
      } else {
        return {
          connected: false,
          error: 'Backend not responding'
        };
      }

    } catch (error) {
      return {
        connected: false,
        error: error instanceof Error ? error.message : 'Connection failed'
      };
    }
  }
}

// Global CV backend service instance
export const cvBackendService = new CVBackendService();