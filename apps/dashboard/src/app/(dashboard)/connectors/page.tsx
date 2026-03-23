"use client";

import Link from "next/link";
import { Plus, Store } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ConnectorCard } from "@/components/connectors/connector-card";

const placeholderConnectors = [
  { id: "c-1", name: "GitHub", type: "github", status: "active" as const, toolCount: 12 },
  { id: "c-2", name: "Slack", type: "slack", status: "active" as const, toolCount: 8 },
  { id: "c-3", name: "PostgreSQL", type: "postgres", status: "active" as const, toolCount: 3 },
  { id: "c-4", name: "HTTP API", type: "http", status: "active" as const, toolCount: 5 },
];

export default function ConnectorsPage() {
  const connectors = placeholderConnectors;

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Connectors</h1>
        <div className="flex gap-2">
          <Button variant="outline">
            <Plus className="h-4 w-4" />
            Add MCP Server
          </Button>
          <Button asChild>
            <Link href="/connectors/store">
              <Store className="h-4 w-4" />
              Browse App Store
            </Link>
          </Button>
        </div>
      </div>

      {/* Connector Grid or Empty State */}
      {connectors.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
          {connectors.map((connector) => (
            <ConnectorCard key={connector.id} connector={connector} />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <p className="text-muted-foreground mb-4">No connectors installed.</p>
          <Button asChild>
            <Link href="/connectors/store">
              <Store className="h-4 w-4" />
              Browse App Store
            </Link>
          </Button>
        </div>
      )}
    </div>
  );
}
