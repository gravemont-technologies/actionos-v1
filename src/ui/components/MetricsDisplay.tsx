import React from "react";
import { Card } from "./ui/card";
import { TrendingUp, TrendingDown, Minus, Target, Zap, Brain } from "lucide-react";

interface MetricsDisplayProps {
  metrics: {
    daily_ipp: number;
    seven_day_ipp: number;
    thirty_day_ipp: number;
    daily_but: number;
    seven_day_but: number;
    s1sr: number;
    rsi: number;
    taa: number;
    hlad: number;
  } | null;
}

export function MetricsDisplay({ metrics }: MetricsDisplayProps) {
  if (!metrics) {
    return (
      <Card className="p-6">
        <p className="text-sm text-muted-foreground">
          Complete your first Step-1 to see your progress metrics
        </p>
      </Card>
    );
  }

  const getRSIStatus = (rsi: number) => {
    if (rsi > 0.2) return { label: "Strong momentum", color: "text-green-600", icon: TrendingUp };
    if (rsi > 0) return { label: "Steady progress", color: "text-blue-600", icon: TrendingUp };
    if (rsi > -0.2) return { label: "Needs adjustment", color: "text-yellow-600", icon: Minus };
    return { label: "Course correction", color: "text-red-600", icon: TrendingDown };
  };

  const rsiStatus = getRSIStatus(metrics.rsi);
  const RSIIcon = rsiStatus.icon;

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {/* IPP - Impact */}
      <Card className="p-4">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Target className="h-5 w-5 text-blue-600" />
            <h3 className="font-semibold">Impact (IPP)</h3>
          </div>
        </div>
        <div className="space-y-2">
          <div>
            <p className="text-2xl font-bold">{metrics.seven_day_ipp.toFixed(0)}</p>
            <p className="text-xs text-muted-foreground">7-day total</p>
          </div>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div>
              <p className="text-muted-foreground">Today</p>
              <p className="font-semibold">{metrics.daily_ipp.toFixed(0)}</p>
            </div>
            <div>
              <p className="text-muted-foreground">30-day</p>
              <p className="font-semibold">{metrics.thirty_day_ipp.toFixed(0)}</p>
            </div>
          </div>
        </div>
      </Card>

      {/* BUT - Alignment */}
      <Card className="p-4">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-purple-600" />
            <h3 className="font-semibold">Alignment (BUT)</h3>
          </div>
        </div>
        <div className="space-y-2">
          <div>
            <p className="text-2xl font-bold">{metrics.seven_day_but.toFixed(1)}</p>
            <p className="text-xs text-muted-foreground">7-day average</p>
          </div>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div>
              <p className="text-muted-foreground">Today</p>
              <p className="font-semibold">{metrics.daily_but.toFixed(1)}</p>
            </div>
            <div>
              <p className="text-muted-foreground">S1SR</p>
              <p className="font-semibold">{metrics.s1sr.toFixed(0)}%</p>
            </div>
          </div>
        </div>
      </Card>

      {/* RSI - Direction */}
      <Card className="p-4">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-green-600" />
            <h3 className="font-semibold">Direction (RSI)</h3>
          </div>
        </div>
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <RSIIcon className={`h-6 w-6 ${rsiStatus.color}`} />
            <div>
              <p className={`text-2xl font-bold ${rsiStatus.color}`}>
                {metrics.rsi > 0 ? "+" : ""}{metrics.rsi.toFixed(1)}%
              </p>
            </div>
          </div>
          <p className={`text-sm font-medium ${rsiStatus.color}`}>
            {rsiStatus.label}
          </p>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div>
              <p className="text-muted-foreground">TAA</p>
              <p className="font-semibold">{metrics.taa.toFixed(0)}%</p>
            </div>
            <div>
              <p className="text-muted-foreground">HLAD</p>
              <p className="font-semibold">{metrics.hlad.toFixed(0)}%</p>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
