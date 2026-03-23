"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Loader2, Users, ShieldCheck, AlertCircle, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { api } from "@/lib/api";

interface InviteDetails {
  id: string;
  email: string;
  role: string;
  inviterName: string | null;
  workspace: {
    id: string;
    name: string;
    slug: string;
  };
  expiresAt: string;
  createdAt: string;
}

export default function InviteAcceptPage() {
  const params = useParams();
  const router = useRouter();
  const { data: session, status: sessionStatus } = useSession();
  const token = params.token as string;

  const [invite, setInvite] = useState<InviteDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAccepting, setIsAccepting] = useState(false);
  const [accepted, setAccepted] = useState(false);

  const fetchInvite = useCallback(async () => {
    try {
      setIsLoading(true);
      const apiUrl = process.env.NEXT_PUBLIC_GNANA_API_URL ?? "http://localhost:4000";
      const res = await fetch(`${apiUrl}/api/invites/${token}`);

      if (res.status === 404) {
        setError("This invite link is invalid or has already been used.");
        return;
      }
      if (res.status === 410) {
        setError("This invite has expired. Please ask the workspace admin for a new invite.");
        return;
      }
      if (!res.ok) {
        setError("Failed to load invite details.");
        return;
      }

      const data = (await res.json()) as InviteDetails;
      setInvite(data);
    } catch {
      setError("Failed to load invite details. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchInvite();
  }, [fetchInvite]);

  const handleAccept = async () => {
    try {
      setIsAccepting(true);
      const res = await api.fetch(`/api/auth-actions/invites/${token}/accept`, {
        method: "POST",
      });
      const data = (await res.json()) as { ok: boolean; workspaceId?: string; message?: string };

      if (data.ok) {
        setAccepted(true);
        // Redirect to dashboard after a brief delay
        setTimeout(() => {
          router.push("/");
        }, 2000);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to accept invite. Please try again.");
    } finally {
      setIsAccepting(false);
    }
  };

  const handleSignIn = () => {
    const callbackUrl = `/invite/${token}`;
    router.push(`/auth/signin?callbackUrl=${encodeURIComponent(callbackUrl)}`);
  };

  if (isLoading || sessionStatus === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4">
        <Card className="w-full max-w-md">
          <CardContent className="flex items-center justify-center p-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
              <AlertCircle className="h-6 w-6 text-destructive" />
            </div>
            <CardTitle className="text-xl">Invalid Invite</CardTitle>
            <CardDescription>{error}</CardDescription>
          </CardHeader>
          <CardFooter className="justify-center">
            <Button variant="outline" onClick={() => router.push("/")}>
              Go to Dashboard
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  if (accepted) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/20">
              <CheckCircle2 className="h-6 w-6 text-green-600" />
            </div>
            <CardTitle className="text-xl">Invite Accepted</CardTitle>
            <CardDescription>
              You are now a member of {invite?.workspace.name}. Redirecting to dashboard...
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  if (!invite) return null;

  const isLoggedIn = !!session?.user;

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
            <Users className="h-6 w-6 text-primary" />
          </div>
          <CardTitle className="text-xl">Workspace Invite</CardTitle>
          <CardDescription>
            {invite.inviterName
              ? `${invite.inviterName} invited you to join`
              : "You have been invited to join"}
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Workspace details */}
          <div className="rounded-lg border p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Workspace</span>
              <span className="font-medium">{invite.workspace.name}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Role</span>
              <Badge variant="secondary" className="flex items-center gap-1">
                <ShieldCheck className="h-3 w-3" />
                {invite.role}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Invited email</span>
              <span className="text-sm">{invite.email}</span>
            </div>
          </div>
        </CardContent>

        <CardFooter className="flex flex-col gap-2">
          {isLoggedIn ? (
            <Button className="w-full" onClick={handleAccept} disabled={isAccepting}>
              {isAccepting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Accepting...
                </>
              ) : (
                "Accept Invite"
              )}
            </Button>
          ) : (
            <Button className="w-full" onClick={handleSignIn}>
              Sign in to Accept
            </Button>
          )}
        </CardFooter>
      </Card>
    </div>
  );
}
