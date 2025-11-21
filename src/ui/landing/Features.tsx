import { Target, Zap, TrendingUp } from "lucide-react";
import { Card, CardContent } from "@/ui/components/ui/card";

interface FeatureMetric {
  icon: React.ElementType;
  title: string;
  before: string;
  after: string;
  delta: string;
  color?: string;
}

const features: FeatureMetric[] = [
  {
    icon: Target,
    title: "SMALL Δ — Cognitive Efficiency",
    before: "2h/day lost to context switching",
    after: "20 minutes/day",
    delta: "↑ 5× execution efficiency",
    color: "text-accent",
  },
  {
    icon: Zap,
    title: "MEDIUM Δ — Strategic Output",
    before: "No structured plan, unclear priorities",
    after: "Weekly roadmap + daily high-leverage actions",
    delta: "↑ Infinite clarity pipeline",
    color: "text-accent",
  },
  {
    icon: TrendingUp,
    title: "LARGE Δ — Life/Work ROI",
    before: "Stalled progress, diffuse effort",
    after: "Clear strategy → consistent execution → measurable progression",
    delta: "↑ +Compounding monthly leverage",
    color: "text-accent",
  },
];

export function Features() {
  return (
    <section className="py-12 sm:py-16">
      <div className="container">
        <div className="mx-auto max-w-4xl text-center">
          <h2 className="text-3xl font-bold tracking-tight sm:text-5xl">Measurable Delta (Δ)</h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Real anonymized improvements across clarity, execution, and leverage buckets.
          </p>
        </div>

        <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature) => {
            const Icon = feature.icon;
            return (
              <Card
                key={feature.title}
                className="border-border transition-smooth hover:shadow-lg hover:border-accent/50"
              >
                <CardContent className="flex flex-col items-start gap-4 p-6">
                  <div className="flex w-full items-start justify-between">
                    <div className="flex items-center gap-4">
                      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-accent/10">
                        <Icon className="h-6 w-6 text-accent" aria-hidden="true" />
                      </div>
                    </div>
                  </div>

                  <h3 className="font-semibold text-lg text-foreground">{feature.title}</h3>

                  <div className="space-y-1 text-sm text-muted-foreground mb-2">
                    <p>
                      <span className="font-medium text-foreground">Before:</span> {feature.before}
                    </p>
                    <p>
                      <span className="font-medium text-foreground">After:</span> {feature.after}
                    </p>
                  </div>

                  <div className={`flex items-center gap-2 text-base font-bold ${feature.color}`}>
                    <TrendingUp className="h-4 w-4" />
                    <span>{feature.delta}</span>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
}
