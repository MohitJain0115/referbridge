
"use client";

import { usePathname } from "next/navigation";
import { Logo } from "@/components/shared/Logo";
import { Progress } from "@/components/ui/progress";

export default function OnboardingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const currentStep = parseInt(pathname.split("/").pop() || "1", 10);
  const totalSteps = 8;

  return (
    <div className="flex min-h-screen flex-col items-center bg-secondary p-4 px-6">
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
        
      </div>
    </div>
  );
}
