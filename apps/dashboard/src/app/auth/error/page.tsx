"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const errorMessages: Record<string, string> = {
  Configuration: "There is a problem with the server configuration. Please contact support.",
  AccessDenied: "Access denied. You do not have permission to sign in.",
  Verification: "The verification link has expired or has already been used.",
  OAuthSignin: "Could not start the sign-in process. Please try again.",
  OAuthCallback: "Could not complete the sign-in process. Please try again.",
  OAuthCreateAccount: "Could not create your account. Please try a different provider.",
  EmailCreateAccount: "Could not create your account using this email.",
  Callback: "Something went wrong during authentication. Please try again.",
  OAuthAccountNotLinked:
    "This email is already associated with another account. Sign in with your original provider.",
  CredentialsSignin: "Invalid email or password. Please check your credentials and try again.",
  Default: "An unexpected error occurred. Please try again.",
};

function ErrorContent() {
  const searchParams = useSearchParams();
  const errorType = searchParams.get("error") || "Default";
  const message = errorMessages[errorType] || errorMessages.Default;

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl font-bold">Authentication Error</CardTitle>
        <CardDescription>Something went wrong during sign-in</CardDescription>
      </CardHeader>

      <CardContent>
        <div className="rounded-md bg-destructive/10 p-4 text-sm text-destructive">{message}</div>
      </CardContent>

      <CardFooter className="justify-center gap-2">
        <Button asChild variant="outline">
          <Link href="/auth/signin">Try again</Link>
        </Button>
        <Button asChild variant="ghost">
          <Link href="/">Go home</Link>
        </Button>
      </CardFooter>
    </Card>
  );
}

export default function AuthErrorPage() {
  return (
    <Suspense
      fallback={
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold">Authentication Error</CardTitle>
            <CardDescription>Loading error details...</CardDescription>
          </CardHeader>
        </Card>
      }
    >
      <ErrorContent />
    </Suspense>
  );
}
