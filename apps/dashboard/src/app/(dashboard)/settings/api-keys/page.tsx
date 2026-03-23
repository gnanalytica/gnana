"use client";

import { useState } from "react";
import { Plus, Copy, AlertTriangle, Loader2, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { useApiKeys, type CreatedKey } from "@/lib/hooks/use-api-keys";

export default function ApiKeysPage() {
  const { keys, isLoading, error, createKey, deleteKey } = useApiKeys();
  const [generateOpen, setGenerateOpen] = useState(false);
  const [newKeyName, setNewKeyName] = useState("");
  const [createdKey, setCreatedKey] = useState<CreatedKey | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [revokeId, setRevokeId] = useState<string | null>(null);
  const [isRevoking, setIsRevoking] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleGenerate = async () => {
    try {
      setIsCreating(true);
      const result = await createKey(newKeyName.trim());
      setCreatedKey(result);
    } catch {
      // Error is handled by the hook
    } finally {
      setIsCreating(false);
    }
  };

  const handleCloseGenerate = () => {
    setGenerateOpen(false);
    setNewKeyName("");
    setCreatedKey(null);
    setCopied(false);
  };

  const handleCopy = async (text: string) => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleRevoke = async (id: string) => {
    try {
      setIsRevoking(true);
      await deleteKey(id);
    } finally {
      setIsRevoking(false);
      setRevokeId(null);
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">API Keys</h1>
          <p className="text-muted-foreground mt-1">Manage API keys for programmatic access.</p>
        </div>
        <Button onClick={() => setGenerateOpen(true)}>
          <Plus className="h-4 w-4" />
          Create API Key
        </Button>
      </div>

      {/* Error state */}
      {error && (
        <div className="rounded-md bg-destructive/10 p-4 text-sm text-destructive">{error}</div>
      )}

      {/* Loading state */}
      {isLoading ? (
        <div className="flex items-center justify-center p-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : (
        /* Keys Table */
        <div className="rounded-md border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="text-left p-3 font-medium">Name</th>
                <th className="text-left p-3 font-medium">Key</th>
                <th className="text-left p-3 font-medium">Created</th>
                <th className="text-left p-3 font-medium">Last Used</th>
                <th className="text-left p-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {keys.map((apiKey) => (
                <tr key={apiKey.id} className="border-b last:border-b-0">
                  <td className="p-3 font-medium">{apiKey.name}</td>
                  <td className="p-3">
                    <Badge variant="secondary" className="font-mono text-xs">
                      {apiKey.prefix}...
                    </Badge>
                  </td>
                  <td className="p-3 text-muted-foreground">{formatDate(apiKey.createdAt)}</td>
                  <td className="p-3 text-muted-foreground">
                    {apiKey.lastUsedAt ? formatDate(apiKey.lastUsedAt) : "Never"}
                  </td>
                  <td className="p-3">
                    {revokeId === apiKey.id ? (
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-destructive">Are you sure?</span>
                        <Button
                          variant="destructive"
                          size="sm"
                          disabled={isRevoking}
                          onClick={() => handleRevoke(apiKey.id)}
                        >
                          {isRevoking ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          ) : (
                            "Yes, revoke"
                          )}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          disabled={isRevoking}
                          onClick={() => setRevokeId(null)}
                        >
                          Cancel
                        </Button>
                      </div>
                    ) : (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-destructive hover:text-destructive"
                        onClick={() => setRevokeId(apiKey.id)}
                      >
                        <Trash2 className="h-3.5 w-3.5 mr-1" />
                        Revoke
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
              {keys.length === 0 && (
                <tr>
                  <td colSpan={5} className="p-6 text-center text-muted-foreground">
                    No API keys. Create one to get started.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Create Key Dialog */}
      <Dialog
        open={generateOpen}
        onOpenChange={(open) => {
          if (!open) handleCloseGenerate();
          else setGenerateOpen(true);
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Create API Key</DialogTitle>
            <DialogDescription>Create a new API key for programmatic access.</DialogDescription>
          </DialogHeader>

          {createdKey ? (
            <div className="space-y-4">
              <div className="flex items-center gap-2 p-3 rounded-md bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800">
                <AlertTriangle className="h-4 w-4 text-yellow-600 shrink-0" />
                <p className="text-xs text-yellow-800 dark:text-yellow-200">
                  This is the only time you will see this key. Copy it now and store it securely.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Input readOnly value={createdKey.key} className="font-mono text-sm" />
                <Button variant="outline" size="icon" onClick={() => handleCopy(createdKey.key)}>
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
              {copied && (
                <p className="text-xs text-green-600 dark:text-green-400">Copied to clipboard</p>
              )}
              <DialogFooter>
                <Button onClick={handleCloseGenerate} className="w-full">
                  Done
                </Button>
              </DialogFooter>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="key-name">Key Name</Label>
                <Input
                  id="key-name"
                  placeholder="e.g., Production Key"
                  value={newKeyName}
                  onChange={(e) => setNewKeyName(e.target.value)}
                />
              </div>
              <DialogFooter>
                <Button
                  onClick={handleGenerate}
                  disabled={!newKeyName.trim() || isCreating}
                  className="w-full"
                >
                  {isCreating ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      Creating...
                    </>
                  ) : (
                    "Create Key"
                  )}
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
