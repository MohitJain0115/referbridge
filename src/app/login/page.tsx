
'use client';

import { useState } from "react";
import Link from "next/link";
import { UserAuthForm } from "@/components/auth/UserAuthForm";
import { Logo } from "@/components/shared/Logo";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { sendPasswordResetEmail } from "firebase/auth";
import { auth, firebaseReady } from "@/lib/firebase";
import { Loader2 } from "lucide-react";


export default function LoginPage() {
  const [isForgotPasswordOpen, setIsForgotPasswordOpen] = useState(false);
  const [emailForReset, setEmailForReset] = useState("");
  const [isSendingReset, setIsSendingReset] = useState(false);
  const { toast } = useToast();

  const handleForgotPassword = async () => {
    if (!firebaseReady) {
      toast({ title: "Service not ready", variant: "destructive" });
      return;
    }
    if (!emailForReset) {
      toast({ title: "Email is required", variant: "destructive" });
      return;
    }
    setIsSendingReset(true);
    try {
      await sendPasswordResetEmail(auth, emailForReset);
      toast({
        title: "Password Reset Email Sent",
        description: "Please check your inbox (and spam folder) for instructions to reset your password.",
      });
      setIsForgotPasswordOpen(false);
      setEmailForReset("");
    } catch (error: any) {
      let description = "An error occurred. Please try again.";
      if (error.code === 'auth/user-not-found') {
        description = "No user found with this email address."
      }
      toast({
        title: "Failed to Send Email",
        description,
        variant: "destructive",
      });
    } finally {
      setIsSendingReset(false);
    }
  };

  return (
    <>
      <div className="flex min-h-screen flex-col items-center justify-center bg-secondary p-4">
        <div className="absolute top-4 left-6">
          <Logo />
        </div>
        <Card className="w-full max-w-md shadow-xl">
          <CardHeader className="text-center">
            <CardTitle className="font-headline text-2xl">Welcome Back!</CardTitle>
            <CardDescription>Enter your credentials to access your account.</CardDescription>
          </CardHeader>
          <CardContent>
            <UserAuthForm mode="login" onForgotPassword={() => setIsForgotPasswordOpen(true)} />
            <p className="mt-4 text-center text-sm text-muted-foreground">
              Don&apos;t have an account?{" "}
              <Link href="/signup" className="font-medium text-primary hover:underline">
                Sign Up
              </Link>
            </p>
          </CardContent>
        </Card>
      </div>

      <Dialog open={isForgotPasswordOpen} onOpenChange={setIsForgotPasswordOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Forgot Password</DialogTitle>
            <DialogDescription>
              Enter your email address below and we&apos;ll send you a link to reset your password.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="email-reset" className="text-right">
                Email
              </Label>
              <Input
                id="email-reset"
                value={emailForReset}
                onChange={(e) => setEmailForReset(e.target.value)}
                className="col-span-3"
                placeholder="name@example.com"
                disabled={isSendingReset}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setIsForgotPasswordOpen(false)} disabled={isSendingReset}>Cancel</Button>
            <Button onClick={handleForgotPassword} disabled={isSendingReset}>
              {isSendingReset && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Send Reset Link
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
