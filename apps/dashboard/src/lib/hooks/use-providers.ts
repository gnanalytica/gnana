"use client";

import { useState, useEffect, useCallback } from "react";
import { api } from "@/lib/api";
import type { Provider } from "@/types";

export function useProviders() {
  const [providers, setProviders] = useState<Provider[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProviders = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await api.fetch("/api/providers");
      const data = await res.json();
      setProviders(data as Provider[]);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch providers");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProviders();
  }, [fetchProviders]);

  const createProvider = async (data: Partial<Provider>) => {
    const res = await api.fetch("/api/providers", {
      method: "POST",
      body: JSON.stringify(data),
    });
    const created = await res.json();
    await fetchProviders();
    return created as Provider;
  };

  const deleteProvider = async (id: string) => {
    await api.fetch(`/api/providers/${id}`, { method: "DELETE" });
    await fetchProviders();
  };

  return { providers, isLoading, error, refetch: fetchProviders, createProvider, deleteProvider };
}

export function useProvider(id: string) {
  const [provider, setProvider] = useState<Provider | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchProvider() {
      try {
        setIsLoading(true);
        const res = await api.fetch(`/api/providers/${id}`);
        const data = await res.json();
        setProvider(data as Provider);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to fetch provider");
      } finally {
        setIsLoading(false);
      }
    }
    fetchProvider();
  }, [id]);

  return { provider, isLoading, error };
}
