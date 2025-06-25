import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Sparkles, ShieldCheck, Handshake } from "lucide-react";
import type { LucideIcon } from "lucide-react";

interface ValueProp {
  icon: LucideIcon;
  title: string;
  description: string;
}

const valueProps: ValueProp[] = [
  {
    icon: Handshake,
    title: "No Awkward DMs",
    description: "Connect with referrers in a professional context. No more sending cold messages into the void."
  },
  {
    icon: Sparkles,
    title: "Streamlined Referrals",
    description: "A clear, structured process makes it easy for referrers to find and help qualified candidates."
  },
  {
    icon: ShieldCheck,
    title: "Privacy-Focused",
    description: "Your profile is only visible to potential referrers. No public posts, no social feeds."
  },
];

export function ValueProps() {
  return (
    <section className="py-20 md:py-32">
      <div className="container">
        <div className="text-center max-w-3xl mx-auto mb-12">
          <h2 className="font-headline text-3xl md:text-4xl font-bold">A Better Way to Get Hired</h2>
          <p className="text-lg text-muted-foreground mt-4">
            We built ReferBridge to remove the friction from the referral process.
          </p>
        </div>
        <div className="grid md:grid-cols-3 gap-8">
          {valueProps.map((prop) => (
            <Card key={prop.title} className="border-2 border-transparent hover:border-primary transition-colors duration-300 shadow-lg">
              <CardHeader className="flex flex-row items-center gap-4">
                 <div className="bg-primary/10 text-primary p-3 rounded-lg">
                    <prop.icon className="h-6 w-6" />
                 </div>
                 <CardTitle className="font-headline">{prop.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">{prop.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
