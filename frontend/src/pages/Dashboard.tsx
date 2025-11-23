import { Sidebar } from "@/components/Sidebar";
import { StatusBadge } from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { AlertTriangle, Flame, Wind, Thermometer, UserCheck, Activity, Battery, MapPin, Info, Circle, FlaskConical } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from "recharts";
import { HazardScoreModal } from "@/components/HazardScoreModal";
import { SensorDetailDrawer } from "@/components/SensorDetailDrawer";
import { IncidentTimeline } from "@/components/IncidentTimeline";
import { SystemHealthPanel } from "@/components/SystemHealthPanel";
import { ZoneSelector } from "@/components/ZoneSelector";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { ErrorState } from "@/components/ErrorState";
import { HazardAlertBanner } from "@/components/HazardAlertBanner";
import { MonitoringControlPanel } from "@/components/MonitoringControlPanel";
import { useState, useEffect, useMemo } from "react";
import { useFirebase } from "@/contexts/FirebaseContext";
import { useAuth } from "@/contexts/AuthContext";
import { getRiskLevel, getSensorContribution } from "@/lib/hazardScore";
import { ref, update, set } from "firebase/database";
import { database } from "@/lib/firebase";
import { useToast } from "@/hooks/use-toast";

const Dashboard = () => {
  const [hazardScoreModalOpen, setHazardScoreModalOpen] = useState(false);
  const [sensorDrawerOpen, setSensorDrawerOpen] = useState(false);
  const [selectedSensor, setSelectedSensor] = useState<"gas" | "temperature" | "fire" | "motion" | null>(null);
  const [emergencyActive, setEmergencyActive] = useState(false);
  const [gasHistory, setGasHistory] = useState<Array<{ time: string; mq2: number; mq135: number }>>([]);
  const [tempHistory, setTempHistory] = useState<Array<{ time: string; temp: number; humidity: number }>>([]);
  const [resendLoading, setResendLoading] = useState(false);
  
  const { toast } = useToast();
  
  // Get Firebase data
  const {
    iotReadings,
    iotLoading,
    iotError,
    hazardScore,
    riskLevel,
    roverControl,
    roverStatus,
    roverLoading,
    history
  } = useFirebase();

  // Get current user for email verification check
  const { currentUser } = useAuth();

  // Build chart data from history
  useEffect(() => {
    if (history && history.length > 0) {
      const last10 = history.slice(0, 10).reverse();
      
      const gasData = last10.map(log => ({
        time: new Date(log.timestamp).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
        mq2: log.mq2,
        mq135: log.mq135
      }));
      
      const tempData = last10.map(log => ({
        time: new Date(log.timestamp).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
        temp: log.temperature,
        humidity: 0 // History doesn't have humidity, use current reading
      }));
      
      setGasHistory(gasData);
      setTempHistory(tempData);
    }
  }, [history]);

  // Add current readings to history for real-time updates
  useEffect(() => {
    if (iotReadings) {
      const currentTime = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
      
      setGasHistory(prev => {
        const updated = [...prev, { time: currentTime, mq2: iotReadings.mq2, mq135: iotReadings.mq135 }];
        return updated.slice(-10); // Keep last 10
      });
      
      setTempHistory(prev => {
        const updated = [...prev, { time: currentTime, temp: iotReadings.temperature, humidity: iotReadings.humidity }];
        return updated.slice(-10);
      });
    }
  }, [iotReadings?.mq2, iotReadings?.mq135, iotReadings?.temperature, iotReadings?.humidity]);

  // Calculate sensor risks from real data
  const sensorRisks = useMemo(() => {
    if (!iotReadings) return [];

    const mq2Contribution = getSensorContribution(iotReadings.mq2, 'mq2');
    const mq135Contribution = getSensorContribution(iotReadings.mq135, 'mq135');
    const tempContribution = getSensorContribution(iotReadings.temperature, 'temp');

    const getMQ2Status = (): 'SAFE' | 'WARNING' | 'DANGER' => {
      if (mq2Contribution.normalized < 30) return 'SAFE';
      if (mq2Contribution.normalized < 60) return 'WARNING';
      return 'DANGER';
    };

    const getMQ135Status = (): 'SAFE' | 'WARNING' | 'DANGER' => {
      if (mq135Contribution.normalized < 30) return 'SAFE';
      if (mq135Contribution.normalized < 60) return 'WARNING';
      return 'DANGER';
    };

    const getTempStatus = (): 'SAFE' | 'WARNING' | 'DANGER' => {
      if (iotReadings.temperature < 30) return 'SAFE';
      if (iotReadings.temperature < 35) return 'WARNING';
      return 'DANGER';
    };

    const getFireStatus = (): 'SAFE' | 'DANGER' => {
      return iotReadings.flame ? 'DANGER' : 'SAFE';
    };

    const getMotionStatus = (): 'SAFE' | 'WARNING' => {
      return iotReadings.motion ? 'WARNING' : 'SAFE';
    };

    return [
      {
        icon: Wind,
        title: "Gas Leak Risk (MQ-2)",
        status: getMQ2Status() as 'SAFE' | 'WARNING' | 'DANGER',
        message: `MQ-2 reading: ${iotReadings.mq2} (${mq2Contribution.normalized.toFixed(1)}% normalized)`,
        sensorType: "gas" as const,
      },
      {
        icon: Wind,
        title: "Air Quality Risk (MQ-135)",
        status: getMQ135Status() as 'SAFE' | 'WARNING' | 'DANGER',
        message: `MQ-135 reading: ${iotReadings.mq135} (${mq135Contribution.normalized.toFixed(1)}% normalized)`,
        sensorType: "gas" as const,
      },
      {
        icon: Flame,
        title: "Fire Risk",
        status: getFireStatus() as 'SAFE' | 'WARNING' | 'DANGER',
        message: iotReadings.flame ? "🔥 FIRE DETECTED!" : "No fire detected",
        sensorType: "fire" as const,
      },
      {
        icon: Thermometer,
        title: "Temperature Stress",
        status: getTempStatus() as 'SAFE' | 'WARNING' | 'DANGER',
        message: `Temperature: ${iotReadings.temperature.toFixed(1)}°C, Humidity: ${iotReadings.humidity}%`,
        sensorType: "temperature" as const,
      },
      {
        icon: UserCheck,
        title: "Human Presence",
        status: getMotionStatus() as 'SAFE' | 'WARNING' | 'DANGER',
        message: iotReadings.motion ? "👤 Motion detected" : "No motion detected",
        sensorType: "motion" as const,
      },
    ];
  }, [iotReadings]);

  const openSensorDrawer = (sensorType: "gas" | "temperature" | "fire" | "motion") => {
    setSelectedSensor(sensorType);
    setSensorDrawerOpen(true);
  };

  const handleEmergencyActivation = async () => {
    try {
      const emergencyRef = ref(database, 'ronin/iot/emergency');
      await update(emergencyRef, { active: true, timestamp: Date.now() });
      setEmergencyActive(true);
      
      toast({
        title: "🚨 Emergency Mode Activated",
        description: "All safety protocols have been triggered.",
        variant: "destructive"
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to activate emergency mode",
        variant: "destructive"
      });
    }
  };

  // Dev-only: Simulate test payload
  const handleSimulateTestPayload = async () => {
    if (process.env.NODE_ENV !== 'development') return;

    try {
      const testPayload = {
        mq2: 450,
        mq135: 800,
        mq135_raw: 1,
        mq135_digital: 1,
        temperature: 45.2,
        humidity: 34.1,
        flame: true,
        motion: false,
        hazardScore: 70,
        riskLevel: "DANGER",
        status: {
          online: true,
          lastHeartbeat: Date.now()
        },
        emergency: {
          active: false,
          timestamp: 0
        }
      };

      const iotRef = ref(database, 'ronin/iot');
      await set(iotRef, testPayload);

      toast({
        title: "🧪 Test Payload Sent",
        description: "Simulated DANGER condition with hazardScore: 70",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to send test payload",
        variant: "destructive"
      });
    }
  };

  const handleResendVerification = async () => {
    setResendLoading(true);
    try {
      // Note: In a real implementation, you'd need to access sendVerificationEmail from AuthContext
      // For now, we'll just show a message
      toast({
        title: "Verification Email",
        description: "Please check your inbox for the verification link. If you didn't receive it, try logging out and back in.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to send verification email",
        variant: "destructive"
      });
    } finally {
      setResendLoading(false);
    }
  };

  // IoT Node status
  const iotNodeOnline = iotReadings?.status?.online ?? false;
  const lastHeartbeat = iotReadings?.status?.lastHeartbeat 
    ? new Date(iotReadings.status.lastHeartbeat).toLocaleTimeString() 
    : 'Never';

  // Rover mode and status
  const roverMode = roverControl?.mode ?? 'manual';
  const roverOnline = roverStatus?.online ?? false;

  // Show full-screen loading on initial load
  if (iotLoading && !iotReadings) {
    return (
      <div className="flex min-h-screen">
        <Sidebar />
        <main className="flex-1">
          <LoadingSpinner fullScreen message="Connecting to RONIN node..." />
        </main>
      </div>
    );
  }

  // Show no-data state if not loading but no data
  if (!iotLoading && !iotReadings && !iotError) {
    return (
      <div className="flex min-h-screen">
        <Sidebar />
        <main className="flex-1">
          <div className="min-h-screen flex items-center justify-center bg-background">
            <div className="text-center space-y-4 max-w-md px-4">
              <Activity className="w-16 h-16 mx-auto text-muted-foreground opacity-50" />
              <h2 className="text-2xl font-bold">No Live Data Found</h2>
              <p className="text-muted-foreground">
                Waiting for RONIN IoT node to send data. Make sure the device is powered on and connected to Firebase.
              </p>
              <Button onClick={() => window.location.reload()} variant="outline">
                Refresh
              </Button>
            </div>
          </div>
        </main>
      </div>
    );
  }

  // Show error state if Firebase connection fails
  if (iotError && !iotReadings) {
    return (
      <div className="flex min-h-screen">
        <Sidebar />
        <main className="flex-1">
          <ErrorState 
            fullScreen
            type="database"
            title="Unable to Connect to Firebase"
            message="Check your internet connection and Firebase configuration. The app will continue to retry in the background."
            onRetry={() => window.location.reload()}
          />
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      
      {/* Email Verification Banner */}
      {!iotLoading && currentUser && !currentUser.emailVerified && (
        <div className="fixed top-0 left-0 right-0 z-50 bg-warning text-black shadow-lg">
          <div className="container mx-auto px-4 py-2 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 flex-1">
              <Info className="w-5 h-5 flex-shrink-0" />
              <div className="text-sm">
                <span className="font-semibold">Email Not Verified</span> - Please check your inbox and verify your email address.
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleResendVerification}
              disabled={resendLoading}
              className="hover:bg-warning-foreground/20 text-sm"
            >
              {resendLoading ? "Sending..." : "Resend Email"}
            </Button>
          </div>
        </div>
      )}
      
      {/* Hazard Alert Banner */}
      <HazardAlertBanner hazardScore={hazardScore} riskLevel={riskLevel} />
      
      <main className="flex-1 overflow-auto">
        {/* Header */}
        <header className="sticky top-0 z-10 bg-card border-b border-border px-4 sm:px-8 py-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold">RONIN Command Center</h1>
            <p className="text-xs sm:text-sm text-muted-foreground">Last updated: {new Date().toLocaleTimeString()}</p>
          </div>
          <div className="flex flex-wrap items-center gap-2 sm:gap-4">
            {/* Dev-only Test Button */}
            {process.env.NODE_ENV === 'development' && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleSimulateTestPayload}
                className="gap-2"
              >
                <FlaskConical className="w-4 h-4" />
                Test Payload
              </Button>
            )}
            
            {/* IoT Node Status */}
            <div className={`flex items-center gap-2 px-2 sm:px-3 py-1.5 rounded-full text-xs sm:text-sm ${
              iotNodeOnline 
                ? 'bg-safe/10 border border-safe/20' 
                : 'bg-danger/10 border border-danger/20'
            }`}>
              <Circle className={`w-2 h-2 rounded-full ${iotNodeOnline ? 'bg-safe' : 'bg-danger'}`} />
              <span className={`font-semibold ${iotNodeOnline ? 'text-safe' : 'text-danger'}`}>
                IoT: {iotNodeOnline ? 'ONLINE' : 'OFFLINE'}
              </span>
            </div>
            <div className="hidden sm:block text-xs text-muted-foreground">
              Last: {lastHeartbeat}
            </div>
            <StatusBadge status={riskLevel} size="lg" />
          </div>
        </header>

        <div className="p-4 sm:p-8 space-y-4 sm:space-y-8">
          {/* Overall Safety Overview */}
          <Card className="p-4 sm:p-8 bg-gradient-to-br from-card to-secondary border-border">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex-1">
                <StatusBadge status={riskLevel} size="lg" />
                <div className="flex items-center gap-2 mt-4">
                  <h2 className="text-2xl sm:text-3xl font-bold">
                    Hazard Score: {hazardScore.toFixed(1)}/100
                  </h2>
                  <button
                    onClick={() => setHazardScoreModalOpen(true)}
                    className="p-1.5 hover:bg-secondary rounded-full transition-colors"
                    title="How is this calculated?"
                  >
                    <Info className="w-5 h-5 text-muted-foreground" />
                  </button>
                </div>
                <p className="text-sm text-muted-foreground mt-2">
                  {riskLevel === 'SAFE' && 'All systems operating within normal parameters. Environment is secure.'}
                  {riskLevel === 'WARNING' && '⚠️ Elevated hazard levels detected. Monitoring closely.'}
                  {riskLevel === 'DANGER' && '🚨 CRITICAL: Hazardous conditions detected! Take immediate action.'}
                </p>
              </div>
              <Activity className={`hidden sm:block w-16 sm:w-24 h-16 sm:h-24 opacity-20 ${
                riskLevel === 'SAFE' ? 'text-safe' : 
                riskLevel === 'WARNING' ? 'text-warning' : 'text-danger'
              }`} />
            </div>
          </Card>

          {/* Sensor Risk Grid */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold">Environmental Monitoring</h2>
              <ZoneSelector />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {sensorRisks.map((risk, idx) => (
                <Card key={idx} className="p-6 hover:bg-accent transition-colors cursor-pointer">
                  <div className="flex items-start gap-4">
                    <div className="p-3 bg-secondary rounded-lg">
                      <risk.icon className="w-6 h-6" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold mb-2">{risk.title}</h3>
                      <StatusBadge status={risk.status} size="sm" />
                      <p className="text-sm text-muted-foreground mt-2">{risk.message}</p>
                      <button
                        onClick={() => openSensorDrawer(risk.sensorType)}
                        className="text-xs text-primary mt-2 hover:underline"
                      >
                        View Details →
                      </button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>

          {/* Live Graphs */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <Card className="p-6">
              <h3 className="text-lg font-bold mb-4">Gas Level Trends</h3>
              {gasHistory.length > 0 ? (
                <ResponsiveContainer width="100%" height={250}>
                  <LineChart data={gasHistory}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="time" stroke="hsl(var(--muted-foreground))" />
                    <YAxis stroke="hsl(var(--muted-foreground))" />
                    <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }} />
                    <ReferenceLine y={500} stroke="hsl(var(--warning))" strokeDasharray="3 3" label="Warning" />
                    <ReferenceLine y={700} stroke="hsl(var(--danger))" strokeDasharray="3 3" label="Danger" />
                    <Line type="monotone" dataKey="mq2" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} />
                    <Line type="monotone" dataKey="mq135" stroke="hsl(var(--safe))" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[250px] flex items-center justify-center text-muted-foreground">
                  Waiting for data...
                </div>
              )}
              <div className="flex gap-4 mt-4 text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-primary rounded-full" />
                  <span>MQ-2 (Gas): {iotReadings?.mq2 || 0}</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-safe rounded-full" />
                  <span>MQ-135 (Air): {iotReadings?.mq135 || 0}</span>
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <h3 className="text-lg font-bold mb-4">Temperature & Humidity Trends</h3>
              {tempHistory.length > 0 ? (
                <ResponsiveContainer width="100%" height={250}>
                  <LineChart data={tempHistory}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="time" stroke="hsl(var(--muted-foreground))" />
                    <YAxis stroke="hsl(var(--muted-foreground))" />
                    <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }} />
                    <ReferenceLine y={30} stroke="hsl(var(--warning))" strokeDasharray="3 3" label="Warning" />
                    <ReferenceLine y={35} stroke="hsl(var(--danger))" strokeDasharray="3 3" label="Danger" />
                    <Line type="monotone" dataKey="temp" stroke="hsl(var(--danger))" strokeWidth={2} dot={false} />
                    <Line type="monotone" dataKey="humidity" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[250px] flex items-center justify-center text-muted-foreground">
                  Waiting for data...
                </div>
              )}
              <div className="flex gap-4 mt-4 text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-danger rounded-full" />
                  <span>Temperature: {iotReadings?.temperature.toFixed(1) || 0}°C</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-primary rounded-full" />
                  <span>Humidity: {iotReadings?.humidity || 0}%</span>
                </div>
              </div>
            </Card>
          </div>

          {/* Client-Side Monitoring Control */}
          <MonitoringControlPanel />

          {/* Incident Timeline */}
          <IncidentTimeline />

          {/* Emergency Control + Rover Overview + System Health */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <Card className={`p-6 border-danger/20 ${emergencyActive ? 'bg-danger/20' : 'bg-danger/5'}`}>
              <div className="flex items-center gap-3 mb-4">
                <AlertTriangle className="w-6 h-6 text-danger" />
                <h3 className="text-lg font-bold">Emergency Control</h3>
              </div>
              {emergencyActive ? (
                <div className="mb-4">
                  <div className="px-3 py-2 bg-danger text-white rounded-lg mb-2 font-bold text-center">
                    🚨 EMERGENCY ACTIVE
                  </div>
                  <p className="text-sm text-muted-foreground">
                    All safety protocols are active. Ventilation maximized.
                  </p>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground mb-4">
                  Activate emergency protocols to maximize ventilation and trigger all safety systems.
                </p>
              )}
              <Button 
                variant="destructive" 
                className="w-full"
                onClick={handleEmergencyActivation}
                disabled={emergencyActive}
              >
                {emergencyActive ? 'EMERGENCY ACTIVE' : 'ACTIVATE EMERGENCY MODE'}
              </Button>
            </Card>

            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold">Rover Status</h3>
                {roverLoading ? (
                  <div className="text-xs text-muted-foreground">Loading...</div>
                ) : (
                  <>
                    {roverMode === "auto" ? (
                      <div className="px-2 py-1 bg-primary/10 text-primary text-xs font-semibold rounded">
                        AUTO MODE ACTIVE
                      </div>
                    ) : (
                      <div className="px-2 py-1 bg-muted text-muted-foreground text-xs font-semibold rounded">
                        MANUAL CONTROL
                      </div>
                    )}
                  </>
                )}
              </div>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Status</span>
                  <div className={`px-2 py-1 rounded text-xs font-semibold ${
                    roverOnline ? 'bg-safe/10 text-safe' : 'bg-danger/10 text-danger'
                  }`}>
                    {roverOnline ? 'ONLINE' : 'OFFLINE'}
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground flex items-center gap-2">
                    <Battery className="w-4 h-4" />
                    Battery
                  </span>
                  <span className="font-semibold">{roverStatus?.battery || 0}%</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground flex items-center gap-2">
                    <MapPin className="w-4 h-4" />
                    Location
                  </span>
                  <span className="font-semibold">{roverStatus?.location || 'Unknown'}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Mode</span>
                  <span className="font-semibold capitalize">{roverMode}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Direction</span>
                  <span className="font-semibold capitalize">{roverControl?.direction || 'stop'}</span>
                </div>
              </div>
              
              {/* Auto Dispatch Warning */}
              {roverMode === "auto" && riskLevel === 'DANGER' && (
                <div className="mt-4 p-3 bg-danger/10 border border-danger/20 rounded-lg">
                  <div className="text-xs text-muted-foreground mb-2">⚠️ Auto-dispatch triggered</div>
                  <div className="text-sm font-bold text-danger mb-2">
                    Rover investigating hazard
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Hazard level: {hazardScore.toFixed(1)}/100
                  </div>
                </div>
              )}
              <Button className="w-full mt-4" onClick={() => window.location.href = '/rover'}>
                Open Rover Console
              </Button>
            </Card>

            {/* System Health Panel */}
            <SystemHealthPanel />
          </div>
        </div>
      </main>

      {/* Modals and Drawers */}
      <HazardScoreModal open={hazardScoreModalOpen} onOpenChange={setHazardScoreModalOpen} />
      <SensorDetailDrawer 
        open={sensorDrawerOpen} 
        onOpenChange={setSensorDrawerOpen}
        sensorType={selectedSensor}
      />
    </div>
  );
};

export default Dashboard;
