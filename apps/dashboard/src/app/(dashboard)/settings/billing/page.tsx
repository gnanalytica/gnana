"use client";

import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

interface PlanFeature {
  text: string;
  included: boolean;
}

interface Plan {
  name: string;
  price: string;
  period: string;
  description: string;
  features: PlanFeature[];
  current?: boolean;
  cta: string;
}

const plans: Plan[] = [
  {
    name: "Free",
    price: "$0",
    period: "forever",
    description: "For individuals and small experiments.",
    current: true,
    cta: "Current Plan",
    features: [
      { text: "3 agents", included: true },
      { text: "100 runs / month", included: true },
      { text: "1 team member", included: true },
      { text: "Community support", included: true },
      { text: "Custom connectors", included: false },
      { text: "Priority support", included: false },
    ],
  },
  {
    name: "Pro",
    price: "$29",
    period: "per month",
    description: "For teams building production agents.",
    current: false,
    cta: "Upgrade to Pro",
    features: [
      { text: "Unlimited agents", included: true },
      { text: "10,000 runs / month", included: true },
      { text: "10 team members", included: true },
      { text: "Priority support", included: true },
      { text: "Custom connectors", included: true },
      { text: "Dedicated infrastructure", included: false },
    ],
  },
  {
    name: "Enterprise",
    price: "Custom",
    period: "contact us",
    description: "For organizations with advanced needs.",
    current: false,
    cta: "Contact Sales",
    features: [
      { text: "Unlimited agents", included: true },
      { text: "Unlimited runs", included: true },
      { text: "Unlimited team members", included: true },
      { text: "Dedicated support", included: true },
      { text: "Custom connectors", included: true },
      { text: "Dedicated infrastructure", included: true },
    ],
  },
];

// TODO: Replace with actual usage data from API
const usage = {
  agents: { used: 1, limit: 3 },
  runs: { used: 42, limit: 100 },
  members: { used: 1, limit: 1 },
};

function UsageBar({ used, limit }: { used: number; limit: number }) {
  const pct = Math.min((used / limit) * 100, 100);
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs text-muted-foreground">
        <span>{used} used</span>
        <span>{limit} limit</span>
      </div>
      <div className="h-2 rounded-full bg-muted overflow-hidden">
        <div
          className="h-full rounded-full bg-primary transition-all"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

export default function BillingPage() {
  return (
    <div className="p-8 max-w-4xl space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Billing & Plans</h1>
        <p className="text-muted-foreground mt-1">Manage your subscription and view usage.</p>
      </div>

      <Separator />

      {/* Current Usage */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold">Current Usage</h2>
        <div className="grid gap-4 sm:grid-cols-3">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Agents</CardTitle>
            </CardHeader>
            <CardContent>
              <UsageBar used={usage.agents.used} limit={usage.agents.limit} />
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Runs this month
              </CardTitle>
            </CardHeader>
            <CardContent>
              <UsageBar used={usage.runs.used} limit={usage.runs.limit} />
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Team Members
              </CardTitle>
            </CardHeader>
            <CardContent>
              <UsageBar used={usage.members.used} limit={usage.members.limit} />
            </CardContent>
          </Card>
        </div>
      </div>

      <Separator />

      {/* Plans */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold">Plans</h2>
        <div className="grid gap-6 sm:grid-cols-3">
          {plans.map((plan) => (
            <Card key={plan.name} className={plan.current ? "border-primary shadow-sm" : ""}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">{plan.name}</CardTitle>
                  {plan.current && (
                    <Badge variant="secondary" className="border-0">
                      Current
                    </Badge>
                  )}
                </div>
                <div className="mt-2">
                  <span className="text-3xl font-bold">{plan.price}</span>
                  <span className="text-sm text-muted-foreground ml-1">/ {plan.period}</span>
                </div>
                <p className="text-sm text-muted-foreground mt-1">{plan.description}</p>
              </CardHeader>
              <CardContent className="space-y-4">
                <ul className="space-y-2">
                  {plan.features.map((feature) => (
                    <li key={feature.text} className="flex items-center gap-2 text-sm">
                      <Check
                        className={`h-4 w-4 shrink-0 ${
                          feature.included ? "text-primary" : "text-muted-foreground/30"
                        }`}
                      />
                      <span className={feature.included ? "" : "text-muted-foreground/50"}>
                        {feature.text}
                      </span>
                    </li>
                  ))}
                </ul>
                <Button
                  variant={plan.current ? "outline" : "default"}
                  className="w-full"
                  disabled={plan.current}
                >
                  {plan.cta}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
