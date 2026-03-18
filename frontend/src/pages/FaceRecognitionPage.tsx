import { Sidebar } from "@/components/Sidebar";
import { RealTimeFaceRecognition } from "@/components/RealTimeFaceRecognition";
import { RecentAlerts } from "@/components/RecentAlerts";
import { CVBackendStatus } from "@/components/CVBackendStatus";

const FaceRecognitionPage = () => {
  return (
    <div className="flex min-h-screen">
      <Sidebar />
      
      <main className="flex-1 overflow-auto bg-background">
        <header className="sticky top-0 z-10 bg-card border-b border-border px-4 sm:px-8 py-4">
          <h1 className="text-2xl font-bold">Face Recognition</h1>
          <p className="text-sm text-muted-foreground">Real-time face detection and recognition with live video stream</p>
        </header>

        <div className="p-4 sm:p-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-8">
            {/* Left Column - Main Stream (~70% width) */}
            <div className="lg:col-span-2">
              <RealTimeFaceRecognition />
              
              {/* Instructions */}
              <div className="mt-4 p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                <h3 className="font-semibold text-blue-600 dark:text-blue-400 mb-2">How It Works</h3>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Click "Start Recognition" to begin real-time face detection</li>
                  <li>• The stream processes frames continuously without interruption</li>
                  <li>• Known faces are highlighted with GREEN boxes and names</li>
                  <li>• Unknown faces are highlighted with RED boxes</li>
                  <li>• Alerts are generated automatically and appear in the sidebar</li>
                  <li>• The system recognizes: Shadan, Shivam (13 trained photos)</li>
                </ul>
              </div>
            </div>

            {/* Right Column - Status & Alerts (~30% width) */}
            <div className="space-y-4 sm:space-y-6">
              <CVBackendStatus />
              <RecentAlerts />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default FaceRecognitionPage;
