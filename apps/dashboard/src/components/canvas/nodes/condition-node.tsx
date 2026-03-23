"use client";
import { memo } from "react";
import { Handle, Position, type NodeProps } from "@xyflow/react";
import { GitBranch } from "lucide-react";

function ConditionNodeComponent({ data }: NodeProps) {
  const d = data as any;
  return (
    <div className="bg-card border-2 border-primary rounded-lg p-4 min-w-[140px] shadow-md rotate-0">
      <Handle type="target" position={Position.Left} className="!bg-primary" />
      <Handle
        type="source"
        position={Position.Right}
        id="true"
        className="!bg-status-completed"
        style={{ top: "35%" }}
      />
      <Handle
        type="source"
        position={Position.Right}
        id="false"
        className="!bg-destructive"
        style={{ top: "65%" }}
      />
      <div className="flex items-center gap-2">
        <GitBranch className="h-4 w-4 text-primary" />
        <span className="text-xs uppercase font-semibold text-primary">Condition</span>
      </div>
      <div className="text-sm text-foreground mt-1">{d.expression ?? "if ..."}</div>
      <div className="flex justify-between text-[10px] text-muted-foreground mt-1">
        <span className="text-status-completed">True</span>
        <span className="text-destructive">False</span>
      </div>
    </div>
  );
}

export const ConditionNode = memo(ConditionNodeComponent);
