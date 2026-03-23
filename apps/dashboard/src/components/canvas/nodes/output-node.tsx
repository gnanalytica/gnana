"use client";
import { memo } from "react";
import { Handle, Position, type NodeProps } from "@xyflow/react";
import { CheckCircle } from "lucide-react";

function OutputNodeComponent({ data }: NodeProps) {
  return (
    <div className="bg-card border-2 border-status-completed rounded-lg p-4 min-w-[140px] shadow-md">
      <Handle type="target" position={Position.Left} className="!bg-status-completed" />
      <div className="flex items-center gap-2">
        <CheckCircle className="h-4 w-4 text-status-completed" />
        <span className="text-xs uppercase font-semibold text-status-completed">Output</span>
      </div>
      <div className="text-sm text-foreground mt-1">{(data as any).label ?? "Result"}</div>
    </div>
  );
}

export const OutputNode = memo(OutputNodeComponent);
