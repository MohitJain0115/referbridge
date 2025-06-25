import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { UserPlus, FileText, Handshake, Search, Users, CheckCircle } from "lucide-react";
import type { LucideIcon } from "lucide-react";

interface Step {
  icon: LucideIcon;
  title: string;
  description: string;
}

const seekerSteps: Step[] = [
  {
    icon: UserPlus,
    title: "Create Your Profile",
    description: "Sign up in seconds and build a profile that highlights your skills, experience, and what you're looking for."
  },
  {
    icon: FileText,
    title: "Add Target Jobs",
    description: "Upload your resume and add links to specific job postings you're interested in."
  },
  {
    icon: Handshake,
    title: "Get Referred",
    description: "Employees at your target companies can find your profile and refer you directly for the roles you want."
  }
];

const referrerSteps: Step[] = [
  {
    icon: Search,
    title: "Discover Talent",
    description: "Browse or search a curated pool of motivated candidates who are actively seeking roles at your company."
  },
  {
    icon: Users,
    title: "Find the Perfect Fit",
    description: "Filter candidates by role, skills, and job ID to find the ideal person for your team's open position."
  },
  {
    icon: CheckCircle,
    title: "Refer with a Click",
    description: "Easily download resumes and mark candidates as referred, helping them get noticed by hiring managers."
  }
];

const StepCard = ({ step }: { step: Step }) => (
  <Card className="text-center bg-card/50">
    <CardHeader>
      <div className="mx-auto bg-primary/10 text-primary p-3 rounded-full">
        <step.icon className="h-8 w-8" />
      </div>
      <CardTitle className="font-headline pt-4">{step.title}</CardTitle>
    </CardHeader>
    <CardContent>
      <p className="text-muted-foreground">{step.description}</p>
    </CardContent>
  </Card>
);

export function HowItWorks() {
  return (
    <section className="py-20 md:py-32 bg-secondary">
      <div className="container">
        <div className="text-center max-w-3xl mx-auto mb-12">
          <h2 className="font-headline text-3xl md:text-4xl font-bold">How ReferBridge Works</h2>
          <p className="text-lg text-muted-foreground mt-4">
            A streamlined, private process for both job seekers and referrers.
          </p>
        </div>

        <Tabs defaultValue="seekers" className="w-full">
          <TabsList className="grid w-full grid-cols-2 max-w-md mx-auto">
            <TabsTrigger value="seekers">For Job Seekers</TabsTrigger>
            <TabsTrigger value="referrers">For Referrers</TabsTrigger>
          </TabsList>
          <TabsContent value="seekers" className="mt-10">
            <div className="grid md:grid-cols-3 gap-8">
              {seekerSteps.map((step, index) => <StepCard key={index} step={step} />)}
            </div>
          </TabsContent>
          <TabsContent value="referrers" className="mt-10">
            <div className="grid md:grid-cols-3 gap-8">
              {referrerSteps.map((step, index) => <StepCard key={index} step={step} />)}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </section>
  );
}
