import { Sidebar } from "@/components/Sidebar";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { ErrorState } from "@/components/ErrorState";
import { useState, useEffect, useCallback, useRef } from "react";
import { useFirebase } from "@/contexts/FirebaseContext";
import { useSettings } from "@/hooks/useSettings";
import { useToast } from "@/hooks/use-toast";
import { ref, set, update } from "firebase/database";
import { database } from "@/lib/firebase";

const SettingsPage = () => {
  const { toast } = useToast();
  const { settings, loading } = useSettings();
  const { updateThresholds, updateRoverBehavior, addAlert } = useFirebase();

  // Local state for sliders
  const [gasWarning, setGasWarning] = useState([300]);
  const [gasDanger, setGasDanger] = useState([500]);
  const [tempWarning, setTempWarning] = useState([30]);
  const [tempDanger, setTempDanger] = useState([35]);
  const [hazardThreshold, setHazardThreshold] = useState([60]);
  
  // Rover behavior state
  const [autoDispatch, setAutoDispatch] = useState(true);
  const [dispatchDelay, setDispatchDelay] = useState([10]);
  const [maxInvestigationTime, setMaxInvestigationTime] = useState([15]);
  const [returnToBase, setReturnToBase] = useState(true);

  // System info state
  const [systemInfo, setSystemInfo] = useState({
    deviceId: 'AROHAN-UNIT-001',
    roverId: 'ROVER-ALPHA-01',
    firmwareVersion: 'v2.4.1',
    lastSystemCheck: new Date().toISOString()
  });

  // Debounce timers
  const thresholdDebounceRef = useRef<NodeJS.Timeout>();
  const roverDebounceRef = useRef<NodeJS.Timeout>();

  // Load settings from Firebase
  useEffect(() => {
    if (settings) {
      setGasWarning([settings.sensorRanges?.mq2?.max || 500]);
      setGasDanger([settings.sensorRanges?.mq135?.max || 700]);
      setTempWarning([settings.thresholds?.warningMax || 30]);
      setTempDanger([settings.thresholds?.dangerMin || 35]);
      setHazardThreshold([settings.roverBehavior?.autoDispatchThreshold || 60]);
      
      setAutoDispatch(settings.roverBehavior?.autoDispatchEnabled ?? true);
      setDispatchDelay([Math.floor((settings.roverBehavior?.checkDuration || 10) / 1)]);
      setMaxInvestigationTime([Math.floor((settings.roverBehavior?.checkDuration || 300) / 60)]);
      setReturnToBase(settings.roverBehavior?.returnToBaseAfterCheck ?? true);
    }
  }, [settings]);

  // Load system info from Firebase
  useEffect(() => {
    const systemInfoRef = ref(database, 'ronin/systemInfo');
    const unsubscribe = () => {}; // Placeholder for actual listener
    
    // In production, this would be a real-time listener
    // For now, we'll use static data
    
    return unsubscribe;
  }, []);

  // Debounced threshold update
  const updateThresholdsDebounced = useCallback((thresholds: any) => {
    if (thresholdDebounceRef.current) {
      clearTimeout(thresholdDebounceRef.current);
    }

    thresholdDebounceRef.current = setTimeout(async () => {
      try {
        await updateThresholds(thresholds);
        toast({
          title: "Thresholds Updated",
          description: "Alert thresholds have been saved."
        });
      } catch (error) {
        toast({
          title: "Update Failed",
          description: "Failed to update thresholds",
          variant: "destructive"
        });
      }
    }, 1000); // 1 second debounce
  }, [updateThresholds, toast]);

  // Debounced rover behavior update
  const updateRoverBehaviorDebounced = useCallback((behavior: any) => {
    if (roverDebounceRef.current) {
      clearTimeout(roverDebounceRef.current);
    }

    roverDebounceRef.current = setTimeout(async () => {
      try {
        await updateRoverBehavior(behavior);
        toast({
          title: "Rover Behavior Updated",
          description: "Rover settings have been saved."
        });
      } catch (error) {
        toast({
          title: "Update Failed",
          description: "Failed to update rover behavior",
          variant: "destructive"
        });
      }
    }, 1000);
  }, [updateRoverBehavior, toast]);

  // Handle threshold changes
  const handleGasWarningChange = (value: number[]) => {
    setGasWarning(value);
    updateThresholdsDebounced({ warningMax: value[0] });
  };

  const handleGasDangerChange = (value: number[]) => {
    setGasDanger(value);
    updateThresholdsDebounced({ dangerMin: value[0] });
  };

  const handleTempWarningChange = (value: number[]) => {
    setTempWarning(value);
    updateThresholdsDebounced({ warningMax: value[0] });
  };

  const handleTempDangerChange = (value: number[]) => {
    setTempDanger(value);
    updateThresholdsDebounced({ dangerMin: value[0] });
  };

  const handleHazardThresholdChange = (value: number[]) => {
    setHazardThreshold(value);
    updateRoverBehaviorDebounced({ autoDispatchThreshold: value[0] });
  };

  // Handle rover behavior changes
  const handleAutoDispatchChange = async (checked: boolean) => {
    setAutoDispatch(checked);
    try {
      await updateRoverBehavior({ autoDispatchEnabled: checked });
      toast({
        title: checked ? "Auto Dispatch Enabled" : "Auto Dispatch Disabled",
        description: checked 
          ? "Rover will automatically investigate alerts" 
          : "Rover requires manual dispatch"
      });
    } catch (error) {
      toast({
        title: "Update Failed",
        description: "Failed to update auto dispatch setting",
        variant: "destructive"
      });
    }
  };

  const handleDispatchDelayChange = (value: number[]) => {
    setDispatchDelay(value);
    updateRoverBehaviorDebounced({ dispatchDelay: value[0] });
  };

  const handleMaxInvestigationTimeChange = (value: number[]) => {
    setMaxInvestigationTime(value);
    updateRoverBehaviorDebounced({ checkDuration: value[0] * 60 }); // Convert to seconds
  };

  const handleReturnToBaseChange = async (checked: boolean) => {
    setReturnToBase(checked);
    try {
      await updateRoverBehavior({ returnToBaseAfterCheck: checked });
    } catch (error) {
      console.error('Failed to update return to base setting:', error);
    }
  };

  // Simulation functions
  const simulateGasAlert = async () => {
    try {
      await addAlert({
        type: 'Gas Detection',
        severity: 'high',
        summary: '🧪 SIMULATION: Elevated gas levels detected in monitoring zone',
        resolved: false
      });

      // Update hazard score for demo
      const iotRef = ref(database, 'ronin/iot_nodes/iotA');
      await update(iotRef, {
        mq2: 650,
        mq135: 850,
        hazardScore: 75
      });

      toast({
        title: "🧪 Gas Alert Simulated",
        description: "Test alert created with elevated gas readings",
        variant: "destructive"
      });
    } catch (error) {
      toast({
        title: "Simulation Failed",
        description: "Failed to create test alert",
        variant: "destructive"
      });
    }
  };

  const simulateFireAlert = async () => {
    try {
      await addAlert({
        type: 'Fire Alert',
        severity: 'critical',
        summary: '🧪 SIMULATION: Flame sensor triggered - immediate response required',
        resolved: false
      });

      // Update hazard score for demo
      const iotRef = ref(database, 'ronin/iot_nodes/iotA');
      await update(iotRef, {
        flame: true,
        temperature: 38,
        hazardScore: 95
      });

      toast({
        title: "🧪 Fire Alert Simulated",
        description: "Test alert created with fire detection",
        variant: "destructive"
      });
    } catch (error) {
      toast({
        title: "Simulation Failed",
        description: "Failed to create test alert",
        variant: "destructive"
      });
    }
  };

  const resetToFactory = async () => {
    try {
      const defaultSettings = {
        thresholds: {
          safeMax: 30,
          warningMax: 60,
          dangerMin: 60
        },
        sensorRanges: {
          mq135: { min: 300, max: 1000 },
          mq2: { min: 200, max: 800 },
          temp: { min: 20, max: 50 }
        },
        roverBehavior: {
          autoDispatchEnabled: true,
          autoDispatchThreshold: 60,
          returnToBaseAfterCheck: true,
          checkDuration: 300
        }
      };

      const settingsRef = ref(database, 'ronin/settings');
      await set(settingsRef, defaultSettings);

      toast({
        title: "Settings Reset",
        description: "All settings have been reset to factory defaults"
      });
    } catch (error) {
      toast({
        title: "Reset Failed",
        description: "Failed to reset settings",
        variant: "destructive"
      });
    }
  };

  // Show loading state
  if (loading && !settings) {
    return (
      <div className="flex min-h-screen">
        <Sidebar />
        <main className="flex-1">
          <LoadingSpinner fullScreen message="Loading settings..." />
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      
      <main className="flex-1 overflow-auto">
        <header className="sticky top-0 z-10 bg-card border-b border-border px-4 sm:px-8 py-4">
          <h1 className="text-xl sm:text-2xl font-bold">System Settings</h1>
          <p className="text-xs sm:text-sm text-muted-foreground">Configure thresholds and system behavior</p>
        </header>

        <div className="p-4 sm:p-8 space-y-4 sm:space-y-6">
          {/* Threshold Settings */}
          <Card className="p-4 sm:p-6">
            <h2 className="text-lg font-bold mb-4 sm:mb-6">Alert Thresholds</h2>
            
            <div className="space-y-4 sm:space-y-6">
                <div>
                  <Label className="mb-2 block">Gas Warning Level (MQ-2)</Label>
                  <Slider
                    value={gasWarning}
                    onValueChange={handleGasWarningChange}
                    max={1000}
                    step={10}
                    className="mb-2"
                  />
                  <p className="text-sm text-muted-foreground">{gasWarning[0]} PPM</p>
                </div>

                <div>
                  <Label className="mb-2 block">Gas Danger Level (MQ-135)</Label>
                  <Slider
                    value={gasDanger}
                    onValueChange={handleGasDangerChange}
                    max={1000}
                    step={10}
                    className="mb-2"
                  />
                  <p className="text-sm text-muted-foreground">{gasDanger[0]} PPM</p>
                </div>

                <div>
                  <Label className="mb-2 block">Temperature Warning Level</Label>
                  <Slider
                    value={tempWarning}
                    onValueChange={handleTempWarningChange}
                    max={50}
                    step={1}
                    className="mb-2"
                  />
                  <p className="text-sm text-muted-foreground">{tempWarning[0]}°C</p>
                </div>

                <div>
                  <Label className="mb-2 block">Temperature Danger Level</Label>
                  <Slider
                    value={tempDanger}
                    onValueChange={handleTempDangerChange}
                    max={50}
                    step={1}
                    className="mb-2"
                  />
                  <p className="text-sm text-muted-foreground">{tempDanger[0]}°C</p>
                </div>

                <div>
                  <Label className="mb-2 block">Hazard Score Auto-Dispatch Threshold</Label>
                  <Slider
                    value={hazardThreshold}
                    onValueChange={handleHazardThresholdChange}
                    max={100}
                    step={5}
                    className="mb-2"
                  />
                  <p className="text-sm text-muted-foreground">
                    {hazardThreshold[0]}/100 - Rover dispatches when hazard score exceeds this value
                  </p>
                </div>
              </div>
          </Card>

          {/* Rover Behavior */}
          <Card className="p-6">
            <h2 className="text-lg font-bold mb-6">Rover Behavior</h2>
            
            <div className="space-y-6">
              <div className="flex items-center justify-between p-4 bg-secondary rounded-lg">
                <div>
                  <Label>Auto Dispatch on Alert</Label>
                  <p className="text-sm text-muted-foreground">Automatically send rover to investigate alerts</p>
                </div>
                <Switch checked={autoDispatch} onCheckedChange={handleAutoDispatchChange} />
              </div>

              <div>
                <Label className="mb-2 block">Dispatch Delay (seconds)</Label>
                <Slider 
                  value={dispatchDelay}
                  onValueChange={handleDispatchDelayChange}
                  max={60} 
                  step={5}
                  className="mb-2"
                />
                <p className="text-sm text-muted-foreground">
                  {dispatchDelay[0]}s - Wait time before dispatching rover
                </p>
              </div>

              <div>
                <Label className="mb-2 block">Max Investigation Time (minutes)</Label>
                <Slider 
                  value={maxInvestigationTime}
                  onValueChange={handleMaxInvestigationTimeChange}
                  max={60} 
                  step={5}
                  className="mb-2"
                />
                <p className="text-sm text-muted-foreground">
                  {maxInvestigationTime[0]} min - Maximum time for rover investigation
                </p>
              </div>

              <div className="flex items-center justify-between p-4 bg-secondary rounded-lg">
                <div>
                  <Label>Return to Base After Check</Label>
                  <p className="text-sm text-muted-foreground">Rover returns to base after investigation</p>
                </div>
                <Switch checked={returnToBase} onCheckedChange={handleReturnToBaseChange} />
              </div>
            </div>
          </Card>

          {/* System Info */}
          <Card className="p-6">
            <h2 className="text-lg font-bold mb-6">System Information</h2>
            
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Device ID</span>
                <span className="text-sm font-mono">{systemInfo.deviceId}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Rover ID</span>
                <span className="text-sm font-mono">{systemInfo.roverId}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Firmware Version</span>
                <span className="text-sm font-mono">{systemInfo.firmwareVersion}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Last System Check</span>
                <span className="text-sm">
                  {new Date(systemInfo.lastSystemCheck).toLocaleString()}
                </span>
              </div>
            </div>

            <div className="mt-6 pt-6 border-t border-border">
              <h3 className="text-sm font-semibold mb-3">Testing & Simulation</h3>
              <div className="space-y-2">
                <Button 
                  variant="secondary" 
                  className="w-full"
                  onClick={simulateGasAlert}
                >
                  🧪 Simulate Gas Alert
                </Button>
                <Button 
                  variant="secondary" 
                  className="w-full"
                  onClick={simulateFireAlert}
                >
                  🧪 Simulate Fire Alert
                </Button>
                <p className="text-xs text-muted-foreground mt-2">
                  Simulation creates test alerts and updates sensor readings for demo purposes
                </p>
              </div>
            </div>

            <div className="mt-6 pt-6 border-t border-border">
              <h3 className="text-sm font-semibold mb-3 text-danger">Danger Zone</h3>
              <Button 
                variant="destructive" 
                className="w-full"
                onClick={resetToFactory}
              >
                Reset to Factory Settings
              </Button>
              <p className="text-xs text-muted-foreground mt-2">
                This will reset all thresholds and rover behavior to default values
              </p>
            </div>
          </Card>

          <div className="flex justify-end gap-4">
            <p className="text-sm text-muted-foreground flex items-center">
              Settings auto-save as you adjust them
            </p>
          </div>
        </div>
      </main>
    </div>
  );
};

export default SettingsPage;
