"use client";

import { Card, CardContent } from "@/components/ui/card";
import { ClipboardList, Code2, FileBarChart, Headphones, Database, Sparkles, Plus } from "lucide-react";

/** Node types for mini pipeline preview */
type MiniNodeType = "trigger" | "llm" | "tool" | "condition" | "gate" | "output";

interface MiniNode {
  type: MiniNodeType;
  label?: string;
}

const NODE_COLORS: Record<MiniNodeType, string> = {
  trigger: "#3b82f6",   // blue
  llm: "#a855f7",       // purple
  tool: "#22c55e",      // green
  condition: "#f97316", // orange
  gate: "#f97316",      // orange
  output: "#9ca3af",    // gray
};

/** Mini pipeline diagram rendered as colored dots connected by lines */
function MiniPipelinePreview({ nodes }: { nodes: readonly MiniNode[] }) {
  const dotSize = 10;
  const gap = 28;
  const totalWidth = nodes.length * dotSize + (nodes.length - 1) * gap;
  const svgWidth = Math.max(totalWidth + 20, 150);
  const svgHeight = 32;
  const startX = (svgWidth - totalWidth) / 2;

  return (
    <svg width={svgWidth} height={svgHeight} className="mx-auto" aria-hidden="true">
      {nodes.map((node, i) => {
        const cx = startX + i * (dotSize + gap) + dotSize / 2;
        const cy = svgHeight / 2;
        const nextCx = startX + (i + 1) * (dotSize + gap) + dotSize / 2;
        const color = NODE_COLORS[node.type];

        return (
          <g key={i}>
            {/* Connecting line to next node */}
            {i < nodes.length - 1 && (
              <line
                x1={cx + dotSize / 2 + 1}
                y1={cy}
                x2={nextCx - dotSize / 2 - 1}
                y2={cy}
                stroke={color}
                strokeWidth={1.5}
                strokeOpacity={0.5}
              />
            )}
            {/* Dot */}
            <circle
              cx={cx}
              cy={cy}
              r={dotSize / 2}
              fill={color}
              opacity={0.9}
            />
            {/* Glow effect */}
            <circle
              cx={cx}
              cy={cy}
              r={dotSize / 2 + 2}
              fill={color}
              opacity={0.15}
            />
          </g>
        );
      })}
    </svg>
  );
}

const TEMPLATES = [
  {
    id: "pm-analyst",
    name: "PM Analyst",
    description: "Analyzes tickets, finds duplicates, and creates action plans",
    icon: ClipboardList,
    prompt:
      "Build an agent that analyzes project management tickets, identifies duplicates, and creates structured action plans with priorities.",
    nodes: [
      { type: "trigger" as MiniNodeType },
      { type: "llm" as MiniNodeType },
      { type: "tool" as MiniNodeType },
      { type: "llm" as MiniNodeType },
      { type: "output" as MiniNodeType },
    ],
  },
  {
    id: "code-reviewer",
    name: "Code Reviewer",
    description: "Reviews pull requests and provides actionable feedback",
    icon: Code2,
    prompt:
      "Build an agent that reviews GitHub pull requests for correctness, performance, and security, then posts actionable feedback.",
    nodes: [
      { type: "trigger" as MiniNodeType },
      { type: "llm" as MiniNodeType },
      { type: "tool" as MiniNodeType, label: "github" },
      { type: "llm" as MiniNodeType },
      { type: "output" as MiniNodeType },
    ],
  },
  {
    id: "report-generator",
    name: "Report Generator",
    description: "Generates reports from data sources with analysis",
    icon: FileBarChart,
    prompt:
      "Build an agent that collects data from multiple sources, analyzes trends, and generates structured reports with insights.",
    nodes: [
      { type: "trigger" as MiniNodeType },
      { type: "tool" as MiniNodeType },
      { type: "llm" as MiniNodeType },
      { type: "tool" as MiniNodeType },
      { type: "output" as MiniNodeType },
    ],
  },
  {
    id: "support-agent",
    name: "Support Agent",
    description: "Handles customer support inquiries with knowledge base lookup",
    icon: Headphones,
    prompt:
      "Build a customer support agent that answers inquiries using a knowledge base, escalates complex issues, and maintains a helpful tone.",
    nodes: [
      { type: "trigger" as MiniNodeType },
      { type: "llm" as MiniNodeType },
      { type: "condition" as MiniNodeType },
      { type: "tool" as MiniNodeType },
      { type: "output" as MiniNodeType },
    ],
  },
  {
    id: "data-analyst",
    name: "Data Analyst",
    description: "Queries databases and generates insights from data",
    icon: Database,
    prompt:
      "Build an agent that queries databases, analyzes results, identifies patterns, and presents findings with supporting data.",
    nodes: [
      { type: "trigger" as MiniNodeType },
      { type: "tool" as MiniNodeType },
      { type: "llm" as MiniNodeType },
      { type: "llm" as MiniNodeType },
      { type: "output" as MiniNodeType },
    ],
  },
  {
    id: "custom",
    name: "Custom",
    description: "Start from scratch and describe what you need",
    icon: Sparkles,
    prompt: "",
    nodes: [] as MiniNode[],
  },
] as const;

interface TemplateGridProps {
  onSelect: (prompt: string) => void;
}

export function TemplateGrid({ onSelect }: TemplateGridProps) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 w-full max-w-lg">
      {TEMPLATES.map((t) => {
        const Icon = t.icon;
        const isCustom = t.id === "custom";
        return (
          <Card
            key={t.id}
            className="cursor-pointer transition-all hover:border-primary hover:shadow-md"
            onClick={() => onSelect(t.prompt)}
          >
            <CardContent className="flex flex-col items-center text-center gap-2 p-4">
              {/* Mini pipeline preview or custom "+" icon */}
              {isCustom ? (
                <div className="flex items-center justify-center h-[32px] w-[150px]">
                  <div className="flex items-center justify-center h-8 w-8 rounded-full border-2 border-dashed border-muted-foreground/40">
                    <Plus className="h-4 w-4 text-muted-foreground/60" />
                  </div>
                </div>
              ) : (
                <MiniPipelinePreview nodes={t.nodes as readonly MiniNode[]} />
              )}
              <div className="flex items-center gap-1.5">
                <Icon className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium">{t.name}</span>
              </div>
              <span className="text-xs text-muted-foreground line-clamp-2">{t.description}</span>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
