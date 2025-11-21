import React, { useState } from "react";
import { Card } from "./ui/card";
import { Button } from "./ui/button";
import { Label } from "./ui/label";
import { Slider } from "./ui/slider";
import { Textarea } from "./ui/textarea";
import { Input } from "./ui/input";
import { Checkbox } from "./ui/checkbox";

interface MetricsModalProps {
  stepId: string;
  profileId: string;
  signature: string;
  stepDescription: string;
  estimatedMinutes?: number;
  onSubmit: (metrics: MetricsData) => Promise<void>;
  onSkip: () => void;
}

export interface MetricsData {
  magnitude: number;
  reach: number;
  depth: number;
  ease_score: number;
  alignment_score: number;
  friction_score: number;
  had_unexpected_wins: boolean;
  unexpected_wins_description?: string;
  estimated_minutes: number;
  actual_minutes: number;
  outcome_description?: string;
}

export function MetricsCompletionModal({
  stepId,
  profileId,
  signature,
  stepDescription,
  estimatedMinutes = 60,
  onSubmit,
  onSkip,
}: MetricsModalProps) {
  const [magnitude, setMagnitude] = useState(5);
  const [reach, setReach] = useState(1);
  const [depth, setDepth] = useState(1.0);
  const [easeScore, setEaseScore] = useState(5);
  const [alignmentScore, setAlignmentScore] = useState(5);
  const [frictionScore, setFrictionScore] = useState(5);
  const [hadUnexpectedWins, setHadUnexpectedWins] = useState(false);
  const [unexpectedWins, setUnexpectedWins] = useState("");
  const [actualMinutes, setActualMinutes] = useState(estimatedMinutes);
  const [outcome, setOutcome] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      await onSubmit({
        magnitude,
        reach,
        depth,
        ease_score: easeScore,
        alignment_score: alignmentScore,
        friction_score: frictionScore,
        had_unexpected_wins: hadUnexpectedWins,
        unexpected_wins_description: hadUnexpectedWins ? unexpectedWins : undefined,
        estimated_minutes: estimatedMinutes,
        actual_minutes: actualMinutes,
        outcome_description: outcome || undefined,
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6">
        <h2 className="text-2xl font-bold mb-2">Step-1 Completed! 🎯</h2>
        <p className="text-sm text-muted-foreground mb-6">
          "{stepDescription.substring(0, 100)}..."
        </p>

        <div className="space-y-6">
          {/* Impact Assessment */}
          <div className="space-y-4">
            <h3 className="font-semibold text-lg">Impact Assessment (IPP)</h3>

            <div>
              <Label htmlFor="reach">How many people did this affect?</Label>
              <Input
                id="reach"
                type="number"
                min="0"
                value={reach}
                onChange={(e) => setReach(Math.max(0, parseInt(e.target.value) || 0))}
                className="mt-1"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Include yourself if applicable
              </p>
            </div>

            <div>
              <Label htmlFor="magnitude">
                How much did it change their situation? ({magnitude}/10)
              </Label>
              <Slider
                id="magnitude"
                min={1}
                max={10}
                step={1}
                value={[magnitude]}
                onValueChange={([v]) => setMagnitude(v)}
                className="mt-2"
              />
              <div className="flex justify-between text-xs text-muted-foreground mt-1">
                <span>Minor convenience</span>
                <span>Moderate improvement</span>
                <span>Significant change</span>
              </div>
            </div>

            <div>
              <Label htmlFor="depth">How deep was the impact?</Label>
              <select
                id="depth"
                value={depth}
                onChange={(e) => setDepth(parseFloat(e.target.value))}
                className="w-full mt-1 p-2 border rounded-md"
              >
                <option value="0.1">Surface-level (0.1x)</option>
                <option value="1.0">Meaningful (1x)</option>
                <option value="3.0">Transformative (3x)</option>
              </select>
            </div>
          </div>

          {/* Flow & Alignment */}
          <div className="space-y-4">
            <h3 className="font-semibold text-lg">Flow & Alignment (BUT)</h3>

            <div>
              <Label htmlFor="ease">
                How smoothly did this go? ({easeScore}/10)
              </Label>
              <Slider
                id="ease"
                min={1}
                max={10}
                step={1}
                value={[easeScore]}
                onValueChange={([v]) => setEaseScore(v)}
                className="mt-2"
              />
              <div className="flex justify-between text-xs text-muted-foreground mt-1">
                <span>Very difficult</span>
                <span>Moderate</span>
                <span>Effortless flow</span>
              </div>
            </div>

            <div>
              <Label htmlFor="alignment">
                How aligned with your values? ({alignmentScore}/10)
              </Label>
              <Slider
                id="alignment"
                min={1}
                max={10}
                step={1}
                value={[alignmentScore]}
                onValueChange={([v]) => setAlignmentScore(v)}
                className="mt-2"
              />
              <div className="flex justify-between text-xs text-muted-foreground mt-1">
                <span>Misaligned</span>
                <span>Neutral</span>
                <span>Perfectly aligned</span>
              </div>
            </div>

            <div>
              <Label htmlFor="friction">
                Obstacles faced ({frictionScore}/10)
              </Label>
              <Slider
                id="friction"
                min={0}
                max={10}
                step={1}
                value={[frictionScore]}
                onValueChange={([v]) => setFrictionScore(v)}
                className="mt-2"
              />
              <div className="flex justify-between text-xs text-muted-foreground mt-1">
                <span>None</span>
                <span>Some</span>
                <span>Major blockers</span>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="unexpected-wins"
                checked={hadUnexpectedWins}
                onCheckedChange={(checked) => setHadUnexpectedWins(checked as boolean)}
              />
              <Label htmlFor="unexpected-wins" className="cursor-pointer">
                Any unexpected wins or pleasant surprises?
              </Label>
            </div>

            {hadUnexpectedWins && (
              <Textarea
                placeholder="What unexpected good things happened?"
                value={unexpectedWins}
                onChange={(e) => setUnexpectedWins(e.target.value)}
                maxLength={500}
                className="mt-2"
              />
            )}
          </div>

          {/* Time Tracking */}
          <div className="space-y-4">
            <h3 className="font-semibold text-lg">Time</h3>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="estimated">Estimated (minutes)</Label>
                <Input
                  id="estimated"
                  type="number"
                  value={estimatedMinutes}
                  disabled
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="actual">Actual (minutes)</Label>
                <Input
                  id="actual"
                  type="number"
                  min="1"
                  value={actualMinutes}
                  onChange={(e) => setActualMinutes(Math.max(1, parseInt(e.target.value) || 1))}
                  className="mt-1"
                />
              </div>
            </div>
          </div>

          {/* Outcome */}
          <div>
            <Label htmlFor="outcome">Outcome (optional)</Label>
            <Textarea
              id="outcome"
              placeholder="What specifically was accomplished?"
              value={outcome}
              onChange={(e) => setOutcome(e.target.value)}
              maxLength={1000}
              className="mt-1"
            />
            <p className="text-xs text-muted-foreground mt-1">
              {outcome.length}/1000
            </p>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <Button
              onClick={handleSubmit}
              disabled={submitting}
              className="flex-1"
            >
              {submitting ? "Submitting..." : "Submit Metrics"}
            </Button>
            <Button
              onClick={onSkip}
              variant="outline"
              disabled={submitting}
            >
              Skip for now
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
