"use client";

import { useState } from "react";
import { Brain, Loader2, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";

type SymptomAnalysisResult = {
  structuredSymptoms?: string[];
  analysis?: string;
  categories?: string[];
  severity?: string;
};

export default function SymptomCheckerPage() {
  const [symptoms, setSymptoms] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<SymptomAnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleAnalyze = async () => {
    if (!symptoms.trim()) return;

    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      const res = await fetch("/api/agents/analytica", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ symptoms }),
      });

      if (!res.ok) {
        throw new Error(`API error: ${res.status}`);
      }

      const data = (await res.json()) as SymptomAnalysisResult;
      setResult(data);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to analyze symptoms. Please try again."
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FFFFF4] p-6">
      <div className="max-w-3xl mx-auto space-y-8">
        {/* Input card */}
        <Card className="border-2 border-[#151616] shadow-[4px_4px_0px_0px_#151616]">
          <CardHeader>
            <CardTitle className="font-poppins font-bold text-[#151616] flex items-center gap-2">
              <Brain className="w-5 h-5" />
              Symptom Analyzer
            </CardTitle>
            <CardDescription className="font-poppins">
              Enter your symptoms. The AI Symptom Analysis agent (Analytica) will structure them.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Textarea
              placeholder="Example: I have fever and headache for 3 days..."
              value={symptoms}
              onChange={(e) => setSymptoms(e.target.value)}
              rows={4}
              className="border-2 border-[#151616] font-poppins focus:border-[#f9c80e] resize-none"
            />

            <Button
              onClick={handleAnalyze}
              disabled={isLoading || !symptoms.trim()}
              className="w-full bg-[#f9c80e] text-[#151616] border-2 border-[#151616] shadow-[4px_4px_0px_0px_#151616] hover:translate-y-1 hover:shadow-[2px_2px_0px_0px_#151616] transition-all duration-200 font-poppins font-bold"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4 mr-2" />
                  Analyze Symptoms
                </>
              )}
            </Button>

            {error && (
              <p className="text-sm text-red-600 font-poppins">{error}</p>
            )}
          </CardContent>
        </Card>

        {/* Results card */}
        {result && (
          <Card className="border-2 border-[#151616] shadow-[4px_4px_0px_0px_#151616]">
            <CardHeader>
              <CardTitle className="font-poppins font-bold text-[#151616]">
                Results
              </CardTitle>
              <CardDescription className="font-poppins">
                Preliminary AI structuring of symptoms (not a medical diagnosis).
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {result.structuredSymptoms && result.structuredSymptoms.length > 0 && (
                <div>
                  <div className="font-poppins font-semibold text-sm text-[#151616] mb-2">
                    Structured Symptoms
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {result.structuredSymptoms.map((s, idx) => (
                      <Badge
                        key={`${s}-${idx}`}
                        className="bg-[#f9c80e] text-[#151616] border-[#151616] font-poppins text-xs"
                      >
                        {s}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {result.categories && result.categories.length > 0 && (
                <div>
                  <div className="font-poppins font-semibold text-sm text-[#151616] mb-2">
                    Possible Categories / Systems
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {result.categories.map((c, idx) => (
                      <Badge
                        key={`${c}-${idx}`}
                        className="bg-white text-[#151616] border-[#151616] font-poppins text-xs"
                      >
                        {c}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {result.severity && (
                <div>
                  <div className="font-poppins font-semibold text-sm text-[#151616] mb-1">
                    Severity (AI view)
                  </div>
                  <p className="text-sm font-poppins text-[#151616]/80">
                    {result.severity}
                  </p>
                </div>
              )}

              {result.analysis && (
                <div>
                  <div className="font-poppins font-semibold text-sm text-[#151616] mb-1">
                    AI Summary
                  </div>
                  <p className="text-sm font-poppins text-[#151616]/80">
                    {result.analysis}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}