"use client";

import { User, Users, Plus, ChevronDown, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { useWorkspaces, type Workspace } from "@/lib/hooks/use-workspaces";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

interface WorkspaceSwitcherProps {
  isCollapsed: boolean;
}

function WorkspaceIcon({ workspace }: { workspace: Workspace }) {
  if (workspace.type === "personal") {
    return <User className="h-4 w-4 shrink-0" />;
  }
  return <Users className="h-4 w-4 shrink-0" />;
}

export function WorkspaceSwitcher({ isCollapsed }: WorkspaceSwitcherProps) {
  const { workspaces, current, setCurrent, loading } = useWorkspaces();

  if (loading || !current) {
    return (
      <div
        className={cn("flex items-center h-14 shrink-0", isCollapsed ? "justify-center" : "px-3")}
      >
        <span className="text-primary font-bold text-lg whitespace-nowrap">
          {isCollapsed ? "\u2B21" : "\u2B21 Gnana"}
        </span>
      </div>
    );
  }

  const trigger = (
    <DropdownMenuTrigger asChild>
      <button
        className={cn(
          "flex items-center h-14 shrink-0 w-full transition-colors hover:bg-accent/50",
          isCollapsed ? "justify-center px-1" : "px-3 gap-2",
        )}
      >
        <span className="flex items-center justify-center h-7 w-7 rounded-md bg-primary/10 text-primary shrink-0">
          <WorkspaceIcon workspace={current} />
        </span>
        {!isCollapsed && (
          <>
            <span className="flex-1 text-sm font-semibold text-left truncate">{current.name}</span>
            <ChevronDown className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
          </>
        )}
      </button>
    </DropdownMenuTrigger>
  );

  return (
    <DropdownMenu>
      {isCollapsed ? (
        <Tooltip delayDuration={0}>
          <TooltipTrigger asChild>{trigger}</TooltipTrigger>
          <TooltipContent side="right" sideOffset={8}>
            {current.name}
          </TooltipContent>
        </Tooltip>
      ) : (
        trigger
      )}
      <DropdownMenuContent side={isCollapsed ? "right" : "bottom"} align="start" className="w-56">
        <DropdownMenuLabel>Workspaces</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {workspaces.map((ws) => (
          <DropdownMenuItem
            key={ws.id}
            onClick={() => setCurrent(ws)}
            className="flex items-center gap-2 cursor-pointer"
          >
            <WorkspaceIcon workspace={ws} />
            <span className="flex-1 truncate">{ws.name}</span>
            {ws.id === current.id && <Check className="h-4 w-4 text-primary" />}
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuItem className="flex items-center gap-2 cursor-pointer">
          <Plus className="h-4 w-4" />
          <span>Create Team</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
