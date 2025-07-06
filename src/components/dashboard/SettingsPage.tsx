
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { KeyRound, Loader2, Trash2 } from "lucide-react";
import { onAuthStateChanged, type User as FirebaseUser } from "firebase/auth";
import { auth, db, firebaseReady } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";


const passwordChangeSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required."),
  newPassword: z.string()
    .min(6, { message: "Password must be at least 6 characters long." })
    .refine((password) => /[a-zA-Z]/.test(password) && /\d/.test(password), {
      message: "Password must contain at least one letter and one number.",
    }),
  confirmPassword: z.string(),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords do not match.",
  path: ["confirmPassword"],
});

export function SettingsPage() {
  const router = useRouter();
  const { toast } = useToast();

  // State for Account Info
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  // State for other sections
  const [deleteConfirmation, setDeleteConfirmation] = useState("");
  const [isPasswordDialogOpen, setIsPasswordDialogOpen] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  const form = useForm<z.infer<typeof passwordChangeSchema>>({
    resolver: zodResolver(passwordChangeSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  useEffect(() => {
    if (!firebaseReady) return;
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setCurrentUser(user);
      } else {
        router.push('/login');
      }
    });
    return () => unsubscribe();
  }, [router]);

  useEffect(() => {
    async function loadUserData() {
      if (!currentUser || !db) return;
      setIsLoading(true);
      setEmail(currentUser.email || "No email found");
      try {
        const profileDocRef = doc(db, "profiles", currentUser.uid);
        const profileDocSnap = await getDoc(profileDocRef);
        if (profileDocSnap.exists()) {
          setName(profileDocSnap.data().name || "");
        }
      } catch (error) {
        console.error("Error loading user data:", error);
        toast({
          title: "Loading Error",
          description: "Could not load your profile data.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    }
    loadUserData();
  }, [currentUser, toast]);


  const handleDeleteAccount = () => {
    toast({
      title: "Account Deleted",
      description: "Your account has been permanently deleted.",
      variant: "destructive",
    });
    router.push("/");
  };

  const handlePasswordChange = (values: z.infer<typeof passwordChangeSchema>) => {
    setIsChangingPassword(true);
    // Mock API call to change password
    setTimeout(() => {
      console.log("Password change values:", values);
      toast({
        title: "Password Updated",
        description: "Your password has been changed successfully.",
      });
      setIsChangingPassword(false);
      setIsPasswordDialogOpen(false);
      form.reset();
    }, 1500);
  };

  const resetDeleteConfirmation = () => {
    setDeleteConfirmation("");
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-lg font-semibold md:text-2xl font-headline">
          Settings
        </h1>
        <p className="text-muted-foreground">
          Manage your account settings and preferences.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Account Information</CardTitle>
          <CardDescription>
            This information is managed via your main profile page and cannot be edited here.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Full Name</Label>
            <Input id="name" value={name} readOnly disabled />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" value={email} readOnly disabled />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Account Actions</CardTitle>
        </CardHeader>
        <CardContent>
           <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Change Password</p>
              <p className="text-sm text-muted-foreground">
                Update your account password.
              </p>
            </div>
            <Dialog open={isPasswordDialogOpen} onOpenChange={setIsPasswordDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" disabled>
                  <KeyRound className="mr-2 h-4 w-4" />
                  Change Password
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Change Password</DialogTitle>
                  <DialogDescription>
                    Choose a new password that is at least 6 characters long and includes both letters and numbers. This feature is currently disabled.
                  </DialogDescription>
                </DialogHeader>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(handlePasswordChange)} className="space-y-4 pt-4">
                    <FormField
                      control={form.control}
                      name="currentPassword"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Current Password</FormLabel>
                          <FormControl>
                            <Input type="password" {...field} disabled={isChangingPassword} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="newPassword"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>New Password</FormLabel>
                          <FormControl>
                            <Input type="password" {...field} disabled={isChangingPassword} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="confirmPassword"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Confirm New Password</FormLabel>
                          <FormControl>
                            <Input type="password" {...field} disabled={isChangingPassword} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <DialogFooter>
                        <Button type="button" variant="ghost" onClick={() => setIsPasswordDialogOpen(false)} disabled={isChangingPassword}>Cancel</Button>
                        <Button type="submit" disabled={isChangingPassword}>
                            {isChangingPassword && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Save Changes
                        </Button>
                    </DialogFooter>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </div>
        </CardContent>
      </Card>

      <Card className="border-destructive">
        <CardHeader>
          <CardTitle className="text-destructive">Danger Zone</CardTitle>
          <CardDescription>
            This action is permanent and cannot be undone.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Delete Account</p>
              <p className="text-sm text-muted-foreground">
                Permanently delete your account and all associated data.
              </p>
            </div>
            <AlertDialog onOpenChange={(open) => !open && resetDeleteConfirmation()}>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" disabled>
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete Account
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This action cannot be undone. This will permanently delete
                    your account and remove your data from our servers. This feature is currently disabled.
                    <br />
                    <br />
                    Please type <strong>delete</strong> below to confirm.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <Input
                  id="delete-confirm"
                  value={deleteConfirmation}
                  onChange={(e) => setDeleteConfirmation(e.target.value)}
                  placeholder="delete"
                  className="mt-2"
                />
                <AlertDialogFooter className="mt-4">
                  <AlertDialogCancel onClick={resetDeleteConfirmation}>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleDeleteAccount}
                    disabled={deleteConfirmation.toLowerCase() !== 'delete'}
                    className="bg-destructive hover:bg-destructive/90"
                  >
                    Yes, delete account
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
