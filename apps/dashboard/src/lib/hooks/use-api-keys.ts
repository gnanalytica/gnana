"use client";

import { useState, useEffect, useCallback } from "react";
import { api } from "@/lib/api";

interface ApiKey {
  id: string;
  name: string;
  prefix: string;
  lastUsedAt: string | null;
  createdAt: string;
}

interface CreatedKey extends ApiKey {
  key: string; // full key, only available on creation
}

export function useApiKeys() {
  const [keys, setKeys] = useState<ApiKey[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchKeys = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await api.fetch("/api/keys");
      const data = await res.json();
      setKeys(data as ApiKey[]);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch API keys");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchKeys();
  }, [fetchKeys]);

  const createKey = async (name: string): Promise<CreatedKey> => {
    const res = await api.fetch("/api/keys", {
      method: "POST",
      body: JSON.stringify({ name }),
    });
    const created = (await res.json()) as CreatedKey;
    await fetchKeys();
    return created;
  };

  const deleteKey = async (id: string) => {
    await api.fetch(`/api/keys/${id}`, { method: "DELETE" });
    await fetchKeys();
  };

  return { keys, isLoading, error, createKey, deleteKey, refetch: fetchKeys };
}

export type { ApiKey, CreatedKey };
