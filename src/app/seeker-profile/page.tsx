import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Save, Upload, User, Briefcase, GraduationCap } from "lucide-react";
import Link from 'next/link';
import { Switch } from "@/components/ui/switch";

export default function SeekerProfilePage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-secondary p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <CardTitle className="font-headline text-2xl">Your Profile</CardTitle>
          <CardDescription>
            This information will be visible to potential referrers. Make it count!
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <Input id="name" placeholder="e.g., Jane Doe" defaultValue="Jane Doe" />
            </div>
             <div className="space-y-2">
              <Label htmlFor="role">Target Role</Label>
              <Input id="role" placeholder="e.g., Senior Product Manager" defaultValue="Senior Product Manager" />
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="about" className="flex items-center gap-2 font-medium">
                <User className="h-4 w-4 text-primary" /> About Me
            </Label>
            <Textarea 
                id="about" 
                placeholder="A brief summary about your professional background, skills, and career aspirations." 
                className="min-h-[100px]"
            />
          </div>

          <div className="space-y-2">
             <Label htmlFor="experience" className="flex items-center gap-2 font-medium">
                <Briefcase className="h-4 w-4 text-primary" /> Work Experience
            </Label>
            <Textarea 
                id="experience" 
                placeholder="Detail your work experience here. e.g.,&#10;Product Manager at TechCorp (Jan 2020 - Present)&#10;- Managed the product lifecycle...&#10;- Increased user engagement by 15%..."
                className="min-h-[150px]"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="education" className="flex items-center gap-2 font-medium">
                <GraduationCap className="h-4 w-4 text-primary" /> Education
            </Label>
            <Textarea 
                id="education" 
                placeholder="List your degrees and certifications. e.g.,&#10;M.S. in Human-Computer Interaction - Carnegie Mellon University (2018-2020)&#10;B.S. in Computer Science - University of Example (2014-2018)" 
                className="min-h-[120px]"
            />
          </div>

           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="companies">Preferred Companies</Label>
              <Input id="companies" placeholder="e.g., Google, Stripe, Figma" defaultValue="Google, Stripe" />
            </div>
             <div className="space-y-2">
              <Label htmlFor="salary">Expected Salary (USD)</Label>
              <Input id="salary" type="number" placeholder="e.g., 150000" defaultValue="150000" />
            </div>
          </div>

          <div className="flex items-center justify-between rounded-lg border p-4">
            <div className="space-y-1">
              <Label htmlFor="salary-visibility" className="font-medium">Show Salary on Profile</Label>
              <p className="text-xs text-muted-foreground">
                Enable this to let referrers see your desired compensation.
              </p>
            </div>
            <Switch id="salary-visibility" defaultChecked />
          </div>

          <div className="space-y-2">
            <Label>Resume</Label>
            <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 p-2 border rounded-md bg-muted/50 w-full">
                    <span className="text-sm text-muted-foreground truncate">my_awesome_resume_final.pdf</span>
                </div>
                <Button variant="outline">
                    <Upload className="mr-2 h-4 w-4" />
                    Upload
                </Button>
            </div>
            <p className="text-xs text-muted-foreground">Upload your resume (PDF, DOCX). Max 5MB.</p>
          </div>

           <div className="space-y-2">
            <Label htmlFor="job-links">Links to Job Postings</Label>
            <Textarea 
                id="job-links" 
                placeholder="Paste links to specific jobs, one per line." 
                defaultValue="https://www.linkedin.com/jobs/view/12345"
            />
             <p className="text-xs text-muted-foreground">This helps referrers know exactly which role you are targeting.</p>
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t">
              <Button variant="ghost" asChild>
                  <Link href="/dashboard">Cancel</Link>
              </Button>
               <Button>
                <Save className="mr-2 h-4 w-4" />
                Save Changes
            </Button>
          </div>

        </CardContent>
      </Card>
    </div>
  );
}
