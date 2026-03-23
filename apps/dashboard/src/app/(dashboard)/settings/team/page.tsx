"use client";

import { useState } from "react";
import { UserPlus, MoreHorizontal, Trash2, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: "owner" | "admin" | "editor" | "viewer";
  avatarUrl?: string;
}

const roleBadgeClasses: Record<TeamMember["role"], string> = {
  owner: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400",
  admin: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  editor: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  viewer: "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400",
};

// TODO: Replace with actual API data when auth is wired
const mockMembers: TeamMember[] = [
  { id: "1", name: "You", email: "you@example.com", role: "owner" },
];

export default function TeamSettingsPage() {
  const [members, setMembers] = useState<TeamMember[]>(mockMembers);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<TeamMember["role"]>("viewer");
  const [inviteOpen, setInviteOpen] = useState(false);

  const handleInvite = () => {
    if (!inviteEmail.trim()) return;

    const newMember: TeamMember = {
      id: crypto.randomUUID(),
      name: inviteEmail.split("@")[0] ?? "User",
      email: inviteEmail,
      role: inviteRole,
    };

    setMembers((prev) => [...prev, newMember]);
    setInviteEmail("");
    setInviteRole("viewer");
    setInviteOpen(false);
  };

  const handleRemove = (id: string) => {
    setMembers((prev) => prev.filter((m) => m.id !== id));
  };

  const handleRoleChange = (id: string, role: TeamMember["role"]) => {
    setMembers((prev) => prev.map((m) => (m.id === id ? { ...m, role } : m)));
  };

  return (
    <div className="p-8 max-w-3xl space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Team Members</h1>
          <p className="text-muted-foreground mt-1">Manage who has access to this workspace.</p>
        </div>

        <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
          <DialogTrigger asChild>
            <Button>
              <UserPlus className="h-4 w-4" />
              Invite Member
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Invite Team Member</DialogTitle>
              <DialogDescription>Send an invitation to join your workspace.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div className="space-y-2">
                <Label htmlFor="invite-email">Email address</Label>
                <Input
                  id="invite-email"
                  type="email"
                  placeholder="colleague@company.com"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="invite-role">Role</Label>
                <Select
                  value={inviteRole}
                  onValueChange={(v) => setInviteRole(v as TeamMember["role"])}
                >
                  <SelectTrigger id="invite-role">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="editor">Editor</SelectItem>
                    <SelectItem value="viewer">Viewer</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setInviteOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleInvite} disabled={!inviteEmail.trim()}>
                Send Invite
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Separator />

      {/* Members list */}
      <div className="rounded-lg border">
        <div className="grid grid-cols-[1fr_1fr_auto_auto] gap-4 px-4 py-3 border-b bg-muted/50 text-sm font-medium text-muted-foreground">
          <span>Name</span>
          <span>Email</span>
          <span>Role</span>
          <span className="w-10" />
        </div>
        {members.map((member) => (
          <div
            key={member.id}
            className="grid grid-cols-[1fr_1fr_auto_auto] gap-4 items-center px-4 py-3 border-b last:border-b-0"
          >
            <span className="text-sm font-medium truncate">{member.name}</span>
            <span className="text-sm text-muted-foreground truncate">{member.email}</span>
            <div>
              {member.role === "owner" ? (
                <Badge variant="secondary" className={`border-0 ${roleBadgeClasses[member.role]}`}>
                  {member.role}
                </Badge>
              ) : (
                <Select
                  value={member.role}
                  onValueChange={(v) => handleRoleChange(member.id, v as TeamMember["role"])}
                >
                  <SelectTrigger className="h-7 w-24 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="editor">Editor</SelectItem>
                    <SelectItem value="viewer">Viewer</SelectItem>
                  </SelectContent>
                </Select>
              )}
            </div>
            <div className="w-10 flex justify-end">
              {member.role !== "owner" && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem className="flex items-center gap-2">
                      <Shield className="h-4 w-4" />
                      <span>Change role</span>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={() => handleRemove(member.id)}
                      className="flex items-center gap-2 text-destructive focus:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                      <span>Remove member</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
