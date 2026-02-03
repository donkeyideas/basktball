"use client";

import { useState } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

interface Team {
  name: string;
  abbreviation: string;
  logoUrl?: string;
  record?: string;
}

interface GamePredictionProps {
  homeTeam: Team;
  awayTeam: Team;
  homeStats?: string;
  awayStats?: string;
  className?: string;
}

interface Prediction {
  winner: string;
  score: string;
  confidence: string;
  keyFactor: string;
}

export function GamePrediction({
  homeTeam,
  awayTeam,
  homeStats,
  awayStats,
  className,
}: GamePredictionProps) {
  const [prediction, setPrediction] = useState<Prediction | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getPrediction = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/ai/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "prediction",
          data: {
            homeTeam: homeTeam.name,
            awayTeam: awayTeam.name,
            homeRecord: homeTeam.record || "N/A",
            awayRecord: awayTeam.record || "N/A",
            homeStats: homeStats || "N/A",
            awayStats: awayStats || "N/A",
          },
        }),
      });

      const data = await response.json();

      if (data.success && data.prediction) {
        setPrediction(data.prediction);
      } else {
        setError(data.error || "Failed to get prediction");
      }
    } catch (err) {
      setError("Failed to generate prediction");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const getConfidenceColor = (confidence: string) => {
    switch (confidence.toLowerCase()) {
      case "high":
        return "text-green-400";
      case "medium":
        return "text-yellow-400";
      case "low":
        return "text-red-400";
      default:
        return "text-white/60";
    }
  };

  const isHomeWinner = prediction?.winner === homeTeam.name;

  return (
    <Card variant="bordered" className={cn("p-5 md:p-6", className)}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h3 className="font-[family-name:var(--font-anton)] text-xl tracking-wider">
          AI PREDICTION
        </h3>
        <span className="text-xs text-white/50">Powered by DeepSeek</span>
      </div>

      {/* Teams */}
      <div className="flex items-center justify-between mb-6">
        {/* Away Team */}
        <div
          className={cn(
            "text-center flex-1 p-4 transition-all",
            prediction && !isHomeWinner && "bg-[var(--orange)]/20"
          )}
        >
          {awayTeam.logoUrl && (
            <img
              src={awayTeam.logoUrl}
              alt={awayTeam.name}
              className="w-16 h-16 mx-auto mb-2"
            />
          )}
          <p className="font-bold text-lg">{awayTeam.abbreviation}</p>
          {awayTeam.record && (
            <p className="text-xs text-white/50">{awayTeam.record}</p>
          )}
        </div>

        {/* VS */}
        <div className="px-4">
          <span className="text-2xl font-bold text-white/30">@</span>
        </div>

        {/* Home Team */}
        <div
          className={cn(
            "text-center flex-1 p-4 transition-all",
            prediction && isHomeWinner && "bg-[var(--orange)]/20"
          )}
        >
          {homeTeam.logoUrl && (
            <img
              src={homeTeam.logoUrl}
              alt={homeTeam.name}
              className="w-16 h-16 mx-auto mb-2"
            />
          )}
          <p className="font-bold text-lg">{homeTeam.abbreviation}</p>
          {homeTeam.record && (
            <p className="text-xs text-white/50">{homeTeam.record}</p>
          )}
        </div>
      </div>

      {/* Prediction Result */}
      {prediction && (
        <div className="bg-[var(--black)] p-4 mb-4 space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-white/60">Predicted Winner:</span>
            <span className="font-bold text-[var(--orange)]">
              {prediction.winner}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-white/60">Predicted Score:</span>
            <span className="font-[family-name:var(--font-roboto-mono)]">
              {prediction.score}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-white/60">Confidence:</span>
            <span
              className={cn(
                "font-semibold uppercase",
                getConfidenceColor(prediction.confidence)
              )}
            >
              {prediction.confidence}
            </span>
          </div>
          <div className="pt-3 border-t border-white/10">
            <span className="text-white/60 text-sm">Key Factor:</span>
            <p className="text-sm mt-1">{prediction.keyFactor}</p>
          </div>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/30 p-3 mb-4 text-red-400 text-sm text-center">
          {error}
        </div>
      )}

      {/* Generate Button */}
      <Button
        variant="primary"
        size="md"
        className="w-full"
        onClick={getPrediction}
        isLoading={isLoading}
        disabled={isLoading}
      >
        {prediction ? "REGENERATE PREDICTION" : "GET AI PREDICTION"}
      </Button>

      {/* Disclaimer */}
      <p className="text-xs text-white/40 text-center mt-3">
        AI predictions are for entertainment only. Past performance does not
        guarantee future results.
      </p>
    </Card>
  );
}
