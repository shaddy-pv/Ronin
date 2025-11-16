import { Sidebar } from "@/components/Sidebar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { ErrorState } from "@/components/ErrorState";
import { ArrowUp, ArrowDown, ArrowLeft, ArrowRight, Square, VideoOff, Battery, MapPin } from "lucide-react";
import { useState, useEffect, useCallback } from "react";
import { useFirebase } from "@/contexts/FirebaseContext";
import { useToast } from "@/hooks/use-toast";

const RoverConsole = () => {
  const [speed, setSpeed] = useState([50]);
  const [activeKey, setActiveKey] = useState<string | null>(null);
  const [streamUrl, setStreamUrl] = useState<string>("");
  const [lastFrameTime, setLastFrameTime] = useState<number>(Date.now());
  
  const { toast } = useToast();
  
  // Get Firebase data
  const {
    roverControl,
    roverStatus,
    roverLoading,
    setRoverDirection,
    setRoverMode,
    triggerEmergency
  } = useFirebase();

  const mode = roverControl?.mode ?? 'manual';
  const currentDirection = roverControl?.direction ?? 'stop';
  const currentSpeed = roverControl?.speed ?? 50;
  const battery = roverStatus?.battery ?? 0;
  const location = roverStatus?.location ?? 'Unknown';
  const roverOnline = roverStatus?.online ?? false;

  // Camera stream URL (from rover status or config)
  useEffect(() => {
    // In production, this would come from Firebase
    // For now, use a placeholder or ESP32-CAM stream URL
    const url = "http://192.168.1.100:81/stream"; // ESP32-CAM default
    setStreamUrl(url);
  }, []);

  // Update last frame time when stream is active
  useEffect(() => {
    if (roverOnline) {
      const interval = setInterval(() => {
        setLastFrameTime(Date.now());
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [roverOnline]);

  // Movement control function
  const handleMove = useCallback(async (direction: 'forward' | 'back' | 'left' | 'right' | 'stop') => {
    if (mode === 'auto') {
      toast({
        title: "Auto Mode Active",
        description: "Switch to manual mode to control the rover",
        variant: "destructive"
      });
      return;
    }

    try {
      await setRoverDirection(direction, direction === 'stop' ? 0 : speed[0]);
    } catch (error) {
      toast({
        title: "Control Error",
        description: "Failed to send command to rover",
        variant: "destructive"
      });
    }
  }, [mode, speed, setRoverDirection, toast]);

  // Stop movement
  const handleStop = useCallback(async () => {
    try {
      await setRoverDirection('stop', 0);
    } catch (error) {
      console.error('Failed to stop rover:', error);
    }
  }, [setRoverDirection]);

  // Mode toggle
  const handleModeToggle = useCallback(async (newMode: 'auto' | 'manual') => {
    try {
      await setRoverMode(newMode);
      toast({
        title: `${newMode === 'auto' ? 'Auto' : 'Manual'} Mode Activated`,
        description: newMode === 'auto' 
          ? 'Rover will respond to hazard alerts automatically' 
          : 'You now have manual control of the rover'
      });
    } catch (error) {
      toast({
        title: "Mode Change Failed",
        description: "Failed to change rover mode",
        variant: "destructive"
      });
    }
  }, [setRoverMode, toast]);

  // Emergency stop
  const handleEmergencyStop = useCallback(async () => {
    try {
      await triggerEmergency();
      toast({
        title: "🚨 Emergency Stop",
        description: "Rover has been stopped immediately",
        variant: "destructive"
      });
    } catch (error) {
      toast({
        title: "Emergency Stop Failed",
        description: "Failed to trigger emergency stop",
        variant: "destructive"
      });
    }
  }, [triggerEmergency, toast]);

  // Keyboard controls (WASD + Arrow Keys)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (mode === 'auto') return;

      const key = e.key.toLowerCase();
      
      // Prevent default for arrow keys
      if (['arrowup', 'arrowdown', 'arrowleft', 'arrowright'].includes(key)) {
        e.preventDefault();
      }

      // Ignore if already pressed
      if (activeKey === key) return;

      setActiveKey(key);

      switch (key) {
        case 'w':
        case 'arrowup':
          handleMove('forward');
          break;
        case 's':
        case 'arrowdown':
          handleMove('back');
          break;
        case 'a':
        case 'arrowleft':
          handleMove('left');
          break;
        case 'd':
        case 'arrowright':
          handleMove('right');
          break;
        case ' ':
        case 'escape':
          e.preventDefault();
          handleStop();
          break;
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      
      if (['w', 's', 'a', 'd', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright'].includes(key)) {
        setActiveKey(null);
        handleStop();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [mode, activeKey, handleMove, handleStop]);

  // Update speed in Firebase when slider changes
  useEffect(() => {
    if (currentDirection !== 'stop' && mode === 'manual') {
      setRoverDirection(currentDirection, speed[0]);
    }
  }, [speed]);

  // Show loading state
  if (roverLoading && !roverControl && !roverStatus) {
    return (
      <div className="flex min-h-screen">
        <Sidebar />
        <main className="flex-1">
          <LoadingSpinner fullScreen message="Connecting to rover..." />
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      
      <main className="flex-1 overflow-auto bg-background">
        <header className="sticky top-0 z-10 bg-card border-b border-border px-4 sm:px-8 py-4">
          <h1 className="text-2xl font-bold">Rover Command Console</h1>
          <p className="text-sm text-muted-foreground">Real-time rover control and monitoring</p>
        </header>

        <div className="p-4 sm:p-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-8">
            {/* Left Panel - Live Camera */}
            <div className="lg:col-span-2">
              <Card className="p-4 sm:p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-bold">Live Camera Feed</h2>
                  <div className="flex items-center gap-3">
                    <div className={`px-3 py-1 rounded-full text-xs font-semibold ${
                      roverOnline ? 'bg-safe/10 text-safe' : 'bg-danger/10 text-danger'
                    }`}>
                      {roverOnline ? '● ONLINE' : '● OFFLINE'}
                    </div>
                  </div>
                </div>

                <div className="aspect-video bg-secondary border-2 border-border rounded-lg overflow-hidden flex items-center justify-center">
                  {roverOnline && streamUrl ? (
                    <img 
                      src={streamUrl} 
                      alt="Rover Camera Feed"
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        // Fallback if stream fails
                        e.currentTarget.style.display = 'none';
                      }}
                      onLoad={() => setLastFrameTime(Date.now())}
                    />
                  ) : (
                    <div className="text-center p-8">
                      <VideoOff className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                      <p className="text-muted-foreground mb-2">
                        {roverOnline 
                          ? 'Camera offline – waiting for stream from rover' 
                          : 'Rover is offline'}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {roverOnline 
                          ? `Stream URL: ${streamUrl || 'Not configured'}` 
                          : 'Check rover connection and power'}
                      </p>
                    </div>
                  )}
                </div>

                {/* Stream Status Bar */}
                <div className="mt-4 p-3 bg-secondary rounded-lg border border-border">
                  <div className="flex items-center justify-between text-sm">
                    <div>
                      <span className="font-semibold">Stream Status:</span>{" "}
                      <span className={roverOnline ? "text-safe" : "text-danger"}>
                        {roverOnline ? "Connected" : "Disconnected"}
                      </span>
                    </div>
                    {roverOnline && (
                      <span className="text-xs text-muted-foreground">
                        Last frame: {Math.floor((Date.now() - lastFrameTime) / 1000)}s ago
                      </span>
                    )}
                  </div>
                  <div className="mt-2 text-xs text-muted-foreground">
                    Location: {location} | Battery: {battery}%
                  </div>
                </div>
              </Card>
            </div>

            {/* Right Panel - Movement Controls */}
            <div className="space-y-4 sm:space-y-6">
              <Card className="p-4 sm:p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-bold">Movement Controls</h2>
                  {mode === 'auto' && (
                    <div className="px-2 py-1 bg-primary/10 text-primary text-xs font-semibold rounded">
                      AUTO MODE
                    </div>
                  )}
                </div>
                
                {/* Direction Pad */}
                <div className="grid grid-cols-3 gap-2 mb-6">
                  <div></div>
                  <Button 
                    variant={currentDirection === 'forward' ? "default" : "secondary"}
                    size="lg" 
                    className="h-16"
                    onClick={() => handleMove('forward')}
                    disabled={mode === 'auto' || !roverOnline}
                  >
                    <ArrowUp className="w-6 h-6" />
                  </Button>
                  <div></div>
                  
                  <Button 
                    variant={currentDirection === 'left' ? "default" : "secondary"}
                    size="lg" 
                    className="h-16"
                    onClick={() => handleMove('left')}
                    disabled={mode === 'auto' || !roverOnline}
                  >
                    <ArrowLeft className="w-6 h-6" />
                  </Button>
                  <Button 
                    variant="destructive" 
                    size="lg" 
                    className="h-16"
                    onClick={handleEmergencyStop}
                    disabled={!roverOnline}
                  >
                    <Square className="w-6 h-6" />
                  </Button>
                  <Button 
                    variant={currentDirection === 'right' ? "default" : "secondary"}
                    size="lg" 
                    className="h-16"
                    onClick={() => handleMove('right')}
                    disabled={mode === 'auto' || !roverOnline}
                  >
                    <ArrowRight className="w-6 h-6" />
                  </Button>
                  
                  <div></div>
                  <Button 
                    variant={currentDirection === 'back' ? "default" : "secondary"}
                    size="lg" 
                    className="h-16"
                    onClick={() => handleMove('back')}
                    disabled={mode === 'auto' || !roverOnline}
                  >
                    <ArrowDown className="w-6 h-6" />
                  </Button>
                  <div></div>
                </div>

                {/* Current Direction Display */}
                <div className="mb-4 p-3 bg-secondary rounded-lg text-center">
                  <div className="text-xs text-muted-foreground mb-1">Current Direction</div>
                  <div className="text-lg font-bold capitalize">{currentDirection}</div>
                  <div className="text-xs text-muted-foreground">Speed: {currentSpeed}%</div>
                </div>

                {/* Speed Control */}
                <div className="mb-6">
                  <label className="text-sm font-semibold mb-2 block">Speed Control</label>
                  <Slider
                    value={speed}
                    onValueChange={setSpeed}
                    max={100}
                    step={5}
                    className="mb-2"
                    disabled={mode === 'auto' || !roverOnline}
                  />
                  <p className="text-xs text-muted-foreground text-center">{speed[0]}%</p>
                </div>

                {/* Mode Toggle */}
                <div>
                  <label className="text-sm font-semibold mb-2 block">Control Mode</label>
                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      variant={mode === "auto" ? "default" : "secondary"}
                      onClick={() => handleModeToggle("auto")}
                      disabled={!roverOnline}
                    >
                      Auto
                    </Button>
                    <Button
                      variant={mode === "manual" ? "default" : "secondary"}
                      onClick={() => handleModeToggle("manual")}
                      disabled={!roverOnline}
                    >
                      Manual
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    {mode === 'auto' 
                      ? 'Rover responds to hazard alerts automatically' 
                      : 'You have manual control of the rover'}
                  </p>
                </div>

                <div className="mt-6 p-4 bg-secondary rounded-lg">
                  <p className="text-xs text-muted-foreground">
                    <span className="font-semibold">Keyboard Controls:</span><br />
                    <span className="font-semibold">W/↑</span> Forward • 
                    <span className="font-semibold"> S/↓</span> Back • 
                    <span className="font-semibold"> A/←</span> Left • 
                    <span className="font-semibold"> D/→</span> Right<br />
                    <span className="font-semibold">Space/Esc</span> Stop
                  </p>
                </div>
              </Card>

              <Card className="p-4 sm:p-6">
                <h2 className="text-lg font-bold mb-4">Rover Status</h2>
                <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground flex items-center gap-2">
                        <Battery className="w-4 h-4" />
                        Battery
                      </span>
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${
                          battery > 50 ? 'bg-safe' : battery > 20 ? 'bg-warning' : 'bg-danger'
                        }`} />
                        <span className="font-semibold">{battery}%</span>
                      </div>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground flex items-center gap-2">
                        <MapPin className="w-4 h-4" />
                        Location
                      </span>
                      <span className="font-semibold">{location}</span>
                    </div>

                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Connection</span>
                      <span className={`font-semibold ${roverOnline ? 'text-safe' : 'text-danger'}`}>
                        {roverOnline ? 'Online' : 'Offline'}
                      </span>
                    </div>

                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">State</span>
                      <span className="font-semibold capitalize">
                        {currentDirection === 'stop' ? 'Idle' : currentDirection}
                      </span>
                    </div>

                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Mode</span>
                      <span className="font-semibold capitalize">{mode}</span>
                    </div>

                    {roverControl?.emergency && (
                      <div className="mt-4 p-3 bg-danger/10 border border-danger/20 rounded-lg">
                        <div className="flex items-center gap-2 text-danger font-bold text-sm">
                          <Square className="w-4 h-4" />
                          EMERGENCY STOP ACTIVE
                        </div>
                      </div>
                    )}
                  </div>
              </Card>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default RoverConsole;
