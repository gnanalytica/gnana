"use client";
import { memo } from "react";
import { Handle, Position, type NodeProps } from "@xyflow/react";
import { Zap } from "lucide-react";

function TriggerNodeComponent({ data }: NodeProps) {
  return (
    <div className="bg-card border-2 border-phase-trigger rounded-lg p-4 min-w-[140px] shadow-md">
      <Handle type="source" position={Position.Right} className="!bg-phase-trigger" />
      <div className="flex items-center gap-2">
        <Zap className="h-4 w-4 text-phase-trigger" />
        <span className="text-xs uppercase font-semibold text-phase-trigger">Trigger</span>
      </div>
      <div className="text-sm text-foreground mt-1">{(data as any).triggerType ?? "Manual"}</div>
    </div>
  );
}

export const TriggerNode = memo(TriggerNodeComponent);
