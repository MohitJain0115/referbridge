
"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendEmailVerification,
  signOut,
} from "firebase/auth";
import { auth, firebaseReady } from "@/lib/firebase";


const signupSchema = z.object({
  email: z.string().email({ message: "Please enter a valid email address." }),
  password: z.string().min(8, { message: "Password must be at least 8 characters long." }),
  userType: z.enum(["seeker", "referrer"], {
    required_error: "You need to select a user type.",
  }),
});

const loginSchema = z.object({
  email: z.string().email({ message: "Please enter a valid email address." }),
  password: z.string().min(1, { message: "Password is required." }),
});

type UserAuthFormProps = {
  mode: "login" | "signup";
  className?: string;
};

type FormData = z.infer<typeof signupSchema> | z.infer<typeof loginSchema>;

export function UserAuthForm({ mode, className }: UserAuthFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = React.useState(false);
  
  const schema = mode === "signup" ? signupSchema : loginSchema;

  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: mode === 'signup' ? { email: '', password: '', userType: 'seeker' } : { email: '', password: '' }
  });

  async function onSubmit(data: FormData) {
    setIsLoading(true);

    if (!firebaseReady) {
      toast({
        title: "Firebase Not Configured",
        description: "Please make sure your Firebase environment variables are set correctly in the .env file.",
        variant: "destructive",
        duration: 10000,
      });
      setIsLoading(false);
      return;
    }

    const { email, password } = data as z.infer<typeof loginSchema>;

    if (mode === 'login') {
        try {
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;

            if (user.emailVerified) {
                toast({
                    title: "Login Successful",
                    description: "Redirecting to your dashboard...",
                });
                router.push('/dashboard');
            } else {
                await signOut(auth);
                toast({
                    title: "Email Not Verified",
                    description: "Please verify your email before logging in. Check your inbox.",
                    variant: "destructive",
                });
            }
        } catch (error: any) {
            const errorCode = error.code;
            let errorMessage = "An unknown error occurred.";
            if (errorCode === 'auth/user-not-found' || errorCode === 'auth/wrong-password' || errorCode === 'auth/invalid-credential' || errorCode === 'auth/api-key-not-valid') {
                errorMessage = "Invalid email or password. Please check your credentials and that your Firebase config is correct.";
            } else {
                errorMessage = error.message;
            }
            toast({
                title: "Login Failed",
                description: errorMessage,
                variant: "destructive",
            });
        } finally {
            setIsLoading(false);
        }
    } else { // signup mode
        try {
            const userCredential = await createUserWithEmailAndPassword(auth, email, (data as z.infer<typeof signupSchema>).password);
            const user = userCredential.user;
            await sendEmailVerification(user);
            await signOut(auth);

            toast({
              title: "Account Created!",
              description: (
                <span>
                  A verification email has been sent. Please check your inbox and{" "}
                  <strong className="text-foreground">verify your email</strong> before logging in.
                  <br />
                  <span className="text-xs text-muted-foreground/80">(Don't forget to check your spam folder!)</span>
                </span>
              ),
              duration: 10000,
            });

            router.push('/login');
            
        } catch (error: any) {
             toast({
                title: "Signup Failed",
                description: error.message,
                variant: "destructive",
            });
        } finally {
            setIsLoading(false);
        }
    }
  }

  return (
    <div className={cn("grid gap-6", className)}>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input placeholder="name@example.com" {...field} disabled={isLoading} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Password</FormLabel>
                <FormControl>
                  <Input type="password" placeholder="••••••••" {...field} disabled={isLoading} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          {mode === "signup" && (
            <FormField
              control={form.control}
              name="userType"
              render={({ field }) => (
                <FormItem className="space-y-3">
                  <FormLabel>I am a...</FormLabel>
                  <FormControl>
                    <RadioGroup
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      className="flex flex-col space-y-1"
                      disabled={isLoading}
                    >
                      <FormItem className="flex items-center space-x-3 space-y-0">
                        <FormControl>
                          <RadioGroupItem value="seeker" />
                        </FormControl>
                        <FormLabel className="font-normal">Job Seeker</FormLabel>
                      </FormItem>
                      <FormItem className="flex items-center space-x-3 space-y-0">
                        <FormControl>
                          <RadioGroupItem value="referrer" />
                        </FormControl>
                        <FormLabel className="font-normal">Referrer</FormLabel>
                      </FormItem>
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {mode === "login" ? "Log In" : "Create Account"}
          </Button>
        </form>
      </Form>
    </div>
  );
}
