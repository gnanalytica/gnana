"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import { Bot, Play, Plug, Settings, LayoutDashboard, Plus } from "lucide-react";

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  const navigate = (path: string) => {
    router.push(path);
    setOpen(false);
  };

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput placeholder="Search agents, runs, settings..." />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>
        <CommandGroup heading="Quick Actions">
          <CommandItem onSelect={() => navigate("/agents/new")}>
            <Plus className="mr-2 h-4 w-4" />
            Create Agent
          </CommandItem>
        </CommandGroup>
        <CommandSeparator />
        <CommandGroup heading="Navigation">
          <CommandItem onSelect={() => navigate("/")}>
            <LayoutDashboard className="mr-2 h-4 w-4" />
            Dashboard
          </CommandItem>
          <CommandItem onSelect={() => navigate("/agents")}>
            <Bot className="mr-2 h-4 w-4" />
            Agents
          </CommandItem>
          <CommandItem onSelect={() => navigate("/runs")}>
            <Play className="mr-2 h-4 w-4" />
            Runs
          </CommandItem>
          <CommandItem onSelect={() => navigate("/connectors")}>
            <Plug className="mr-2 h-4 w-4" />
            Connectors
          </CommandItem>
          <CommandItem onSelect={() => navigate("/connectors/store")}>
            <Plug className="mr-2 h-4 w-4" />
            App Store
          </CommandItem>
          <CommandItem onSelect={() => navigate("/settings")}>
            <Settings className="mr-2 h-4 w-4" />
            Settings
          </CommandItem>
        </CommandGroup>
        <CommandSeparator />
        <CommandGroup heading="Agents">
          <CommandItem onSelect={() => navigate("/agents/1")}>
            <Bot className="mr-2 h-4 w-4" />
            Sales Report Agent
          </CommandItem>
          <CommandItem onSelect={() => navigate("/agents/2")}>
            <Bot className="mr-2 h-4 w-4" />
            Bug Triage Agent
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}
