"use client";

import { useState, useEffect } from "react";

export interface Workspace {
  id: string;
  name: string;
  slug: string;
  type: "personal" | "team";
  role: string;
}

// For now, return mock data since the API needs auth wired up
// This will be replaced with actual API calls later
export function useWorkspaces() {
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [current, setCurrent] = useState<Workspace | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // TODO: Replace with actual API call when auth is wired
    const mockWorkspaces: Workspace[] = [
      { id: "personal", name: "Personal", slug: "personal", type: "personal", role: "owner" },
    ];
    setWorkspaces(mockWorkspaces);
    setCurrent(mockWorkspaces[0]);
    setLoading(false);
  }, []);

  return { workspaces, current, setCurrent, loading };
}
