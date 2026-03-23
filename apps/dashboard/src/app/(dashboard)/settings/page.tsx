"use client";

import { useState } from "react";
import Link from "next/link";
import { Users, CreditCard, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";

export default function SettingsPage() {
  const [workspaceName, setWorkspaceName] = useState("My Workspace");
  const [approvalMode, setApprovalMode] = useState("required");
  const [maxConcurrent, setMaxConcurrent] = useState("10");
  const [theme, setTheme] = useState("system");

  return (
    <div className="p-8 max-w-2xl space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="text-muted-foreground mt-1">Manage your workspace preferences.</p>
      </div>

      <Separator />

      {/* Quick links to sub-settings */}
      <div className="grid gap-3 sm:grid-cols-2">
        <Link href="/settings/team">
          <Card className="hover:bg-accent/50 transition-colors cursor-pointer">
            <CardContent className="flex items-center gap-3 py-4">
              <div className="flex items-center justify-center h-9 w-9 rounded-md bg-primary/10 text-primary shrink-0">
                <Users className="h-5 w-5" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium">Team Members</p>
                <p className="text-xs text-muted-foreground">Invite and manage team access</p>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
            </CardContent>
          </Card>
        </Link>
        <Link href="/settings/billing">
          <Card className="hover:bg-accent/50 transition-colors cursor-pointer">
            <CardContent className="flex items-center gap-3 py-4">
              <div className="flex items-center justify-center h-9 w-9 rounded-md bg-primary/10 text-primary shrink-0">
                <CreditCard className="h-5 w-5" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium">Billing & Plans</p>
                <p className="text-xs text-muted-foreground">Manage subscription and usage</p>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
            </CardContent>
          </Card>
        </Link>
      </div>

      <Separator />

      <div className="space-y-6">
        {/* Workspace Name */}
        <div className="space-y-2">
          <Label htmlFor="workspace-name">Workspace Name</Label>
          <Input
            id="workspace-name"
            value={workspaceName}
            onChange={(e) => setWorkspaceName(e.target.value)}
          />
        </div>

        {/* Default Approval Mode */}
        <div className="space-y-2">
          <Label htmlFor="approval-mode">Default Approval Mode</Label>
          <Select value={approvalMode} onValueChange={setApprovalMode}>
            <SelectTrigger id="approval-mode">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="required">Required</SelectItem>
              <SelectItem value="auto">Auto-approve</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Max Concurrent Runs */}
        <div className="space-y-2">
          <Label htmlFor="max-concurrent">Max Concurrent Runs</Label>
          <Input
            id="max-concurrent"
            type="number"
            min={1}
            value={maxConcurrent}
            onChange={(e) => setMaxConcurrent(e.target.value)}
          />
        </div>

        {/* Theme Preference */}
        <div className="space-y-2">
          <Label htmlFor="theme">Theme Preference</Label>
          <Select value={theme} onValueChange={setTheme}>
            <SelectTrigger id="theme">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="system">System</SelectItem>
              <SelectItem value="light">Light</SelectItem>
              <SelectItem value="dark">Dark</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <Button>Save</Button>
    </div>
  );
}
