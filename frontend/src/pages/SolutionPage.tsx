import { Sidebar } from "@/components/Sidebar";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { useFirebase } from "@/contexts/FirebaseContext";
import { useState } from "react";
import { Lightbulb, AlertTriangle, Cpu, Radio, User, ListChecks, Wind, Flame } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface GeminiSolution {
  hazardType: string;
  recommendedResponse: string;
  roverAction: string;
  iotNodeAction: string;
  humanInstructions: string;
  solutionPlan: string;
}

const SolutionPage = () => {
  const { iotReadings, iotLoading } = useFirebase();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [solution, setSolution] = useState<GeminiSolution | null>(null);
  const [error, setError] = useState<string | null>(null);

  const generateSolution = async () => {
    if (!iotReadings) {
      toast({
        title: "No Data Available",
        description: "Waiting for sensor readings from Firebase",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    setError(null);
    setSolution(null);

    try {
      const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
      
      if (!apiKey) {
        throw new Error("Gemini API key not configured. Please add VITE_GEMINI_API_KEY to your .env file");
      }

      // Normalize sensor values (0-100 scale)
      const mq2_norm = Math.min((iotReadings.mq2 / 1000) * 100, 100);
      const mq135_norm = Math.min((iotReadings.mq135 / 1000) * 100, 100);

      const prompt = `You are an AI safety expert. Based on the following sensor readings:
- MQ-2 (flammable gas): ${mq2_norm.toFixed(1)}/100 normalized (raw: ${iotReadings.mq2})
- MQ-135 (toxic/air quality): ${mq135_norm.toFixed(1)}/100 normalized (raw: ${iotReadings.mq135})
- Temperature: ${iotReadings.temperature.toFixed(1)}°C
- Flame detected: ${iotReadings.flame ? 'YES' : 'NO'}
- Motion detected: ${iotReadings.motion ? 'YES' : 'NO'}

Tell me:
1. What hazard this indicates (flammable gas leak / toxic gas / mixed / safe).
2. What is the immediate recommended solution.
3. What actions should the rover take.
4. What actions should fixed IoT nodes take.
5. What actions the human operator must perform.
6. Provide a short, clear, step-by-step solution plan.

Keep the response simple, actionable, and campus-safe.

Format your response as JSON with these exact keys:
{
  "hazardType": "string",
  "recommendedResponse": "string",
  "roverAction": "string",
  "iotNodeAction": "string",
  "humanInstructions": "string",
  "solutionPlan": "string"
}`;

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            contents: [{
              parts: [{
                text: prompt
              }]
            }],
            generationConfig: {
              temperature: 0.7,
              maxOutputTokens: 1024,
              responseMimeType: "application/json"
            }
          })
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || `API request failed with status ${response.status}`);
      }

      const data = await response.json();
      const generatedText = data.candidates?.[0]?.content?.parts?.[0]?.text;

      if (!generatedText) {
        throw new Error("No response generated from Gemini API");
      }

      // Parse JSON from response (handle markdown code blocks)
      let jsonText = generatedText.trim();
      if (jsonText.startsWith('```json')) {
        jsonText = jsonText.replace(/```json\n?/g, '').replace(/```\n?/g, '');
      } else if (jsonText.startsWith('```')) {
        jsonText = jsonText.replace(/```\n?/g, '');
      }

      const parsedSolution: GeminiSolution = JSON.parse(jsonText);
      setSolution(parsedSolution);

      toast({
        title: "✅ Solution Generated",
        description: "AI analysis complete"
      });

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error occurred";
      setError(errorMessage);
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen">
      <Sidebar />

      <main className="flex-1 overflow-auto">
        {/* Header */}
        <header className="sticky top-0 z-10 bg-card border-b border-border px-8 py-4">
          <div>
            <h1 className="text-2xl font-bold">AI Hazard Solutions</h1>
            <p className="text-sm text-muted-foreground">
              Get AI-powered safety recommendations based on live sensor data
            </p>
          </div>
        </header>

        <div className="p-8 space-y-6">
          {/* Current Sensor Readings */}
          <Card className="p-6">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <Wind className="w-5 h-5" />
              Current Sensor Readings
            </h2>

            {iotLoading ? (
              <LoadingSpinner message="Loading sensor data..." />
            ) : iotReadings ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="p-4 bg-secondary rounded-lg">
                  <div className="text-sm text-muted-foreground mb-1">MQ-2 (Flammable Gas)</div>
                  <div className="text-2xl font-bold">{iotReadings.mq2}</div>
                  <div className="text-xs text-muted-foreground mt-1">
                    Normalized: {Math.min((iotReadings.mq2 / 1000) * 100, 100).toFixed(1)}/100
                  </div>
                </div>

                <div className="p-4 bg-secondary rounded-lg">
                  <div className="text-sm text-muted-foreground mb-1">MQ-135 (Air Quality)</div>
                  <div className="text-2xl font-bold">{iotReadings.mq135}</div>
                  <div className="text-xs text-muted-foreground mt-1">
                    Normalized: {Math.min((iotReadings.mq135 / 1000) * 100, 100).toFixed(1)}/100
                  </div>
                </div>

                <div className="p-4 bg-secondary rounded-lg">
                  <div className="text-sm text-muted-foreground mb-1">Temperature</div>
                  <div className="text-2xl font-bold">{iotReadings.temperature.toFixed(1)}°C</div>
                  <div className="text-xs text-muted-foreground mt-1">
                    Humidity: {iotReadings.humidity}%
                  </div>
                </div>

                <div className="p-4 bg-secondary rounded-lg">
                  <div className="text-sm text-muted-foreground mb-1 flex items-center gap-2">
                    <Flame className="w-4 h-4" />
                    Flame Sensor
                  </div>
                  <div className={`text-2xl font-bold ${iotReadings.flame ? 'text-danger' : 'text-safe'}`}>
                    {iotReadings.flame ? '🔥 DETECTED' : '✓ Clear'}
                  </div>
                </div>

                <div className="p-4 bg-secondary rounded-lg">
                  <div className="text-sm text-muted-foreground mb-1">Motion Sensor</div>
                  <div className={`text-2xl font-bold ${iotReadings.motion ? 'text-warning' : 'text-muted-foreground'}`}>
                    {iotReadings.motion ? '👤 Detected' : 'No Motion'}
                  </div>
                </div>

                <div className="p-4 bg-secondary rounded-lg">
                  <div className="text-sm text-muted-foreground mb-1">Hazard Score</div>
                  <div className="text-2xl font-bold">{iotReadings.hazardScore || 0}/100</div>
                  <div className={`text-xs font-semibold mt-1 ${
                    (iotReadings.hazardScore || 0) < 30 ? 'text-safe' :
                    (iotReadings.hazardScore || 0) < 60 ? 'text-warning' : 'text-danger'
                  }`}>
                    {(iotReadings.hazardScore || 0) < 30 ? 'SAFE' :
                     (iotReadings.hazardScore || 0) < 60 ? 'WARNING' : 'DANGER'}
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                No sensor data available. Waiting for IoT node...
              </div>
            )}
          </Card>

          {/* Generate Solution Button */}
          <div className="flex justify-center">
            <Button
              size="lg"
              onClick={generateSolution}
              disabled={loading || !iotReadings}
              className="gap-2"
            >
              <Lightbulb className="w-5 h-5" />
              {loading ? "Generating Solution..." : "Generate Solution using AI"}
            </Button>
          </div>

          {/* Error Display */}
          {error && (
            <Card className="p-6 border-danger bg-danger/5">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-6 h-6 text-danger flex-shrink-0 mt-1" />
                <div>
                  <h3 className="font-bold text-danger mb-2">Error</h3>
                  <p className="text-sm text-muted-foreground">{error}</p>
                </div>
              </div>
            </Card>
          )}

          {/* AI Solution Display */}
          {solution && (
            <div className="space-y-4">
              <h2 className="text-xl font-bold">AI-Generated Solution</h2>

              {/* Hazard Type */}
              <Card className="p-6 border-warning bg-warning/5">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-6 h-6 text-warning flex-shrink-0 mt-1" />
                  <div className="flex-1">
                    <h3 className="font-bold text-lg mb-2">Hazard Type</h3>
                    <p className="text-muted-foreground">{solution.hazardType}</p>
                  </div>
                </div>
              </Card>

              {/* Recommended Response */}
              <Card className="p-6">
                <div className="flex items-start gap-3">
                  <Lightbulb className="w-6 h-6 text-primary flex-shrink-0 mt-1" />
                  <div className="flex-1">
                    <h3 className="font-bold text-lg mb-2">Recommended Response</h3>
                    <p className="text-muted-foreground whitespace-pre-line">{solution.recommendedResponse}</p>
                  </div>
                </div>
              </Card>

              {/* Rover Action */}
              <Card className="p-6">
                <div className="flex items-start gap-3">
                  <Cpu className="w-6 h-6 text-primary flex-shrink-0 mt-1" />
                  <div className="flex-1">
                    <h3 className="font-bold text-lg mb-2">Rover Action</h3>
                    <p className="text-muted-foreground whitespace-pre-line">{solution.roverAction}</p>
                  </div>
                </div>
              </Card>

              {/* IoT Node Action */}
              <Card className="p-6">
                <div className="flex items-start gap-3">
                  <Radio className="w-6 h-6 text-primary flex-shrink-0 mt-1" />
                  <div className="flex-1">
                    <h3 className="font-bold text-lg mb-2">IoT Node Action</h3>
                    <p className="text-muted-foreground whitespace-pre-line">{solution.iotNodeAction}</p>
                  </div>
                </div>
              </Card>

              {/* Human Instructions */}
              <Card className="p-6 border-safe bg-safe/5">
                <div className="flex items-start gap-3">
                  <User className="w-6 h-6 text-safe flex-shrink-0 mt-1" />
                  <div className="flex-1">
                    <h3 className="font-bold text-lg mb-2">Human Operator Instructions</h3>
                    <p className="text-muted-foreground whitespace-pre-line">{solution.humanInstructions}</p>
                  </div>
                </div>
              </Card>

              {/* Solution Plan */}
              <Card className="p-6 bg-gradient-to-br from-card to-secondary">
                <div className="flex items-start gap-3">
                  <ListChecks className="w-6 h-6 text-primary flex-shrink-0 mt-1" />
                  <div className="flex-1">
                    <h3 className="font-bold text-lg mb-2">Step-by-Step Solution Plan</h3>
                    <p className="text-muted-foreground whitespace-pre-line">{solution.solutionPlan}</p>
                  </div>
                </div>
              </Card>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default SolutionPage;
