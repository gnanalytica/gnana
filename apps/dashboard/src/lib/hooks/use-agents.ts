"use client";

import { useState, useEffect, useCallback } from "react";
import { api } from "@/lib/api";
import type { Agent } from "@/types";

export function useAgents() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAgents = useCallback(async () => {
    try {
      setIsLoading(true);
      const data = await api.agents.list();
      const list = Array.isArray(data) ? data : (data as { data: Agent[] }).data ?? [];
      setAgents(list as Agent[]);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch agents");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAgents();
  }, [fetchAgents]);

  const createAgent = async (data: Partial<Agent>) => {
    const created = await api.agents.create(data as Record<string, unknown>);
    await fetchAgents();
    return created as Agent;
  };

  const updateAgent = async (id: string, data: Partial<Agent>) => {
    const updated = await api.agents.update(id, data as Record<string, unknown>);
    await fetchAgents();
    return updated as Agent;
  };

  const deleteAgent = async (id: string) => {
    await api.agents.delete(id);
    await fetchAgents();
  };

  return { agents, isLoading, error, refetch: fetchAgents, createAgent, updateAgent, deleteAgent };
}

export function useAgent(id: string) {
  const [agent, setAgent] = useState<Agent | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchAgent() {
      try {
        setIsLoading(true);
        const data = await api.agents.get(id);
        setAgent(data as Agent);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to fetch agent");
      } finally {
        setIsLoading(false);
      }
    }
    fetchAgent();
  }, [id]);

  return { agent, isLoading, error };
}
