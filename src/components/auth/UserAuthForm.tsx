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

    // Mock API call
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    setIsLoading(false);

    toast({
      title: mode === "login" ? "Login Successful" : "Account Created",
      description: mode === "login" ? "Redirecting to your dashboard..." : "Welcome to ReferBridge! Redirecting...",
    });

    const userType = mode === 'signup' ? (data as z.infer<typeof signupSchema>).userType : 'seeker'; // Default to seeker on login for demo
    
    // Redirect to dashboard with user type for demo purposes
    router.push(`/dashboard?view=${userType}`);
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
