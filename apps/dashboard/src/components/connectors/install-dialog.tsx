"use client";

import { useState } from "react";
import { CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

interface InstallDialogProps {
  app: { name: string; type: "oauth" | "api_key" | "mcp" } | null;
  isOpen: boolean;
  onClose: () => void;
  onInstall: () => void;
}

export function InstallDialog({ app, isOpen, onClose, onInstall }: InstallDialogProps) {
  const [value, setValue] = useState("");
  const [success, setSuccess] = useState(false);

  const handleConnect = () => {
    setSuccess(true);
    onInstall();
  };

  const handleClose = () => {
    setValue("");
    setSuccess(false);
    onClose();
  };

  if (!app) return null;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Connect {app.name}</DialogTitle>
          <DialogDescription>
            {app.type === "oauth"
              ? `Authorize ${app.name} to connect with your workspace.`
              : app.type === "api_key"
                ? `Enter your ${app.name} credentials to connect.`
                : "Enter the MCP server URL or command."}
          </DialogDescription>
        </DialogHeader>

        {success ? (
          <div className="flex flex-col items-center gap-3 py-6">
            <CheckCircle2 className="h-12 w-12 text-green-500" />
            <p className="text-lg font-semibold">Connected!</p>
            <Button onClick={handleClose} className="w-full">
              Close
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {app.type === "oauth" && (
              <Button onClick={handleConnect} className="w-full">
                Connect with {app.name}
              </Button>
            )}

            {app.type === "api_key" && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="api-key">API Key</Label>
                  <Input
                    id="api-key"
                    type="password"
                    placeholder="Enter your API key"
                    value={value}
                    onChange={(e) => setValue(e.target.value)}
                  />
                </div>
                <Button onClick={handleConnect} className="w-full" disabled={!value.trim()}>
                  Connect
                </Button>
              </>
            )}

            {app.type === "mcp" && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="mcp-url">URL or Command</Label>
                  <Input
                    id="mcp-url"
                    placeholder="https://... or npx @company/mcp-server"
                    value={value}
                    onChange={(e) => setValue(e.target.value)}
                  />
                </div>
                <Button onClick={handleConnect} className="w-full" disabled={!value.trim()}>
                  Connect
                </Button>
              </>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
