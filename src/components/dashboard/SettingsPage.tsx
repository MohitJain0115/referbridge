
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
import { onAuthStateChanged, type User as FirebaseUser, EmailAuthProvider, reauthenticateWithCredential, updatePassword, deleteUser } from "firebase/auth";
import { auth, db, storage, firebaseReady } from "@/lib/firebase";
import { doc, getDoc, deleteDoc } from "firebase/firestore";
import { ref as storageRef, deleteObject } from "firebase/storage";


const passwordChangeSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required."),
  newPassword: z.string()
    .min(8, { message: "Password must be at least 8 characters long." })
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
  const [isPasswordDialogOpen, setIsPasswordDialogOpen] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState("");
  const [deletePassword, setDeletePassword] = useState("");


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


  const handleDeleteAccount = async () => {
    if (!currentUser || deleteConfirmation.toLowerCase() !== 'delete' || !deletePassword) {
        return;
    }
    setIsDeleting(true);

    try {
        const credential = EmailAuthProvider.credential(currentUser.email!, deletePassword);
        await reauthenticateWithCredential(currentUser, credential);

        const uid = currentUser.uid;

        // Delete resume from Storage and Firestore
        const resumeDocRef = doc(db, "resumes", uid);
        const resumeDocSnap = await getDoc(resumeDocRef);
        if (resumeDocSnap.exists()) {
            const resumeData = resumeDocSnap.data();
            if (resumeData.fileName) {
                const resumeFileRef = storageRef(storage, `resumes/${uid}/${resumeData.fileName}`);
                await deleteObject(resumeFileRef).catch(e => console.error("Could not delete resume file:", e));
            }
            await deleteDoc(resumeDocRef);
        }

        // Delete profile picture from Storage and profile from Firestore
        const profileDocRef = doc(db, "profiles", uid);
        const profileDocSnap = await getDoc(profileDocRef);
        if (profileDocSnap.exists()) {
            const profileData = profileDocSnap.data();
            if (profileData.profilePic && profileData.profilePic.includes('firebasestorage.googleapis.com')) {
                try {
                    const picUrl = new URL(profileData.profilePic);
                    const path = decodeURIComponent(picUrl.pathname.split('/o/')[1]);
                    const profilePicRef = storageRef(storage, path);
                    await deleteObject(profilePicRef).catch(e => console.error("Could not delete profile pic file:", e));
                } catch(e) {
                    console.error("Could not parse or delete profile picture:", e)
                }
            }
            await deleteDoc(profileDocRef);
        }

        await deleteUser(currentUser);

        toast({
            title: "Account Deleted",
            description: "Your account and all associated data have been permanently deleted.",
        });
        
        router.push("/");

    } catch (error: any) {
        console.error("Account deletion error:", error);
        let description = "An error occurred during account deletion.";
        if (error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
            description = "The password you entered is incorrect.";
        }
        toast({
            title: "Deletion Failed",
            description,
            variant: "destructive",
        });
    } finally {
        setIsDeleting(false);
    }
  };

  const handlePasswordChange = async (values: z.infer<typeof passwordChangeSchema>) => {
    if (!currentUser) return;
    setIsChangingPassword(true);

    try {
        const credential = EmailAuthProvider.credential(currentUser.email!, values.currentPassword);
        await reauthenticateWithCredential(currentUser, credential);
        await updatePassword(currentUser, values.newPassword);
        toast({
            title: "Password Updated",
            description: "Your password has been changed successfully.",
        });
        setIsPasswordDialogOpen(false);
        form.reset();
    } catch (error: any) {
        console.error("Password change error:", error);
        let description = "An error occurred while changing your password.";
        if (error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
            description = "The current password you entered is incorrect.";
        } else if (error.code === 'auth/weak-password') {
            description = "The new password is not strong enough."
        }
        toast({
            title: "Update Failed",
            description,
            variant: "destructive",
        });
    } finally {
        setIsChangingPassword(false);
    }
  };

  const resetDeleteConfirmation = () => {
    setDeleteConfirmation("");
    setDeletePassword("");
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
                <Button variant="outline">
                  <KeyRound className="mr-2 h-4 w-4" />
                  Change Password
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Change Password</DialogTitle>
                  <DialogDescription>
                    Choose a new password that is at least 8 characters long and includes both letters and numbers.
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
                            <Input type="password" {...field} disabled={isChangingPassword} placeholder="••••••••" />
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
                            <Input type="password" {...field} disabled={isChangingPassword} placeholder="••••••••" />
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
                            <Input type="password" {...field} disabled={isChangingPassword} placeholder="••••••••" />
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
                <Button variant="destructive">
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete Account
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This action cannot be undone. This will permanently delete your account and remove your data from our servers.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                 <div className="space-y-4">
                    <div>
                        <Label htmlFor="delete-confirm-text" className="text-sm font-normal">
                            Please type <strong>delete</strong> below to confirm.
                        </Label>
                        <Input
                            id="delete-confirm-text"
                            value={deleteConfirmation}
                            onChange={(e) => setDeleteConfirmation(e.target.value)}
                            placeholder="delete"
                            className="mt-1"
                            disabled={isDeleting}
                        />
                    </div>
                    <div>
                        <Label htmlFor="delete-confirm-password">
                            For your security, please enter your password.
                        </Label>
                        <Input
                            id="delete-confirm-password"
                            type="password"
                            value={deletePassword}
                            onChange={(e) => setDeletePassword(e.target.value)}
                            placeholder="••••••••"
                            className="mt-1"
                            disabled={isDeleting}
                        />
                    </div>
                </div>
                <AlertDialogFooter className="mt-4">
                  <AlertDialogCancel onClick={resetDeleteConfirmation} disabled={isDeleting}>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleDeleteAccount}
                    disabled={isDeleting || deleteConfirmation.toLowerCase() !== 'delete' || !deletePassword}
                    className="bg-destructive hover:bg-destructive/90"
                  >
                    {isDeleting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
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
