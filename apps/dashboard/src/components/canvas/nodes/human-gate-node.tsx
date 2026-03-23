"use client";
import { memo } from "react";
import { Handle, Position, type NodeProps } from "@xyflow/react";
import { ShieldCheck } from "lucide-react";

function HumanGateNodeComponent({ data }: NodeProps) {
  const d = data as any;
  return (
    <div className="bg-card border-2 border-phase-approve rounded-lg p-4 min-w-[140px] shadow-md">
      <Handle type="target" position={Position.Left} className="!bg-phase-approve" />
      <Handle type="source" position={Position.Right} className="!bg-phase-approve" />
      <div className="flex items-center gap-2">
        <ShieldCheck className="h-4 w-4 text-phase-approve" />
        <span className="text-xs uppercase font-semibold text-phase-approve">Approval Gate</span>
      </div>
      <div className="text-sm text-foreground mt-1">{d.approval ?? "required"}</div>
    </div>
  );
}

export const HumanGateNode = memo(HumanGateNodeComponent);
