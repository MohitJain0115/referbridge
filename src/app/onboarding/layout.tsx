
"use client";

import { usePathname, useRouter } from "next/navigation";
import { Logo } from "@/components/shared/Logo";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";

export default function OnboardingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const currentStep = parseInt(pathname.split("/").pop() || "1", 10);
  const totalSteps = 8;

  const handleSkip = () => {
    if (currentStep < totalSteps) {
      router.push(`/onboarding/${currentStep + 1}`);
    } else {
      router.push("/dashboard");
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center bg-secondary p-4">
      <div className="absolute top-4 left-4">
        <Logo />
      </div>
      <div className="w-full max-w-2xl mt-20">
        <div className="mb-8 text-center">
            <p className="text-sm font-semibold text-primary">
                Step {currentStep} of {totalSteps}
            </p>
            <Progress value={(currentStep / totalSteps) * 100} className="mt-2 h-2" />
        </div>
        
        {children}
        
        <div className="mt-6 text-center">
            <Button variant="link" onClick={handleSkip}>
                Skip for now
            </Button>
        </div>
      </div>
    </div>
  );
}
