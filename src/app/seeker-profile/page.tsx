"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Save, Upload, User, Briefcase, GraduationCap, PlusCircle, Trash2, Linkedin, Loader2, Eye } from "lucide-react";
import Link from 'next/link';
import Image from 'next/image';
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { importFromLinkedIn, LinkedInProfileOutput } from "@/ai/flows/linkedin-profile-flow";

type Job = {
  id: number;
  url: string;
};

type Company = {
  id: number;
  name: string;
  jobs: Job[];
};

type Experience = {
    id: number;
    role: string;
    company: string;
    dates: string;
    description: string;
};

type Education = {
    id: number;
    institution: string;
    degree: string;
    dates: string;
    description: string;
};

export default function SeekerProfilePage() {
  const { toast } = useToast();
  const [isSalaryVisible, setIsSalaryVisible] = useState(true);
  const [isImporting, setIsImporting] = useState(false);
  const [isFetching, setIsFetching] = useState(false);
  const [linkedinUrl, setLinkedinUrl] = useState("");
  
  const [profilePic, setProfilePic] = useState<string>("https://placehold.co/128x128.png");
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const profilePicInputRef = useRef<HTMLInputElement>(null);
  const resumeInputRef = useRef<HTMLInputElement>(null);

  const [about, setAbout] = useState(
    "Passionate Product Manager with 3 years of experience in fast-paced tech environments. Skilled in user research, agile methodologies, and cross-functional team leadership. Eager to leverage my skills to build innovative products that users love."
  );

  const [companies, setCompanies] = useState<Company[]>([
    { 
      id: 1, 
      name: 'Google', 
      jobs: [
        { id: 1, url: 'https://www.linkedin.com/jobs/view/12345' }
      ] 
    },
    { id: 2, name: 'Stripe', jobs: [{ id: 1, url: '' }] },
  ]);

  const [experiences, setExperiences] = useState<Experience[]>(
    [
      { id: 101, role: 'Product Manager', company: 'TechCorp', dates: 'Jan 2020 - Present', description: '- Managed the product lifecycle...\n- Increased user engagement by 15%...' }
    ]
  );

  const [educations, setEducations] = useState<Education[]>(
    [
      { id: 201, institution: 'Carnegie Mellon University', degree: 'M.S. in Human-Computer Interaction', dates: '2018 - 2020', description: 'Relevant coursework: User-Centered Research, Interaction Design.' }
    ]
  );

  const addCompany = () => {
    setCompanies([...companies, { id: Date.now(), name: '', jobs: [{ id: Date.now(), url: '' }] }]);
  };

  const removeCompany = (companyId: number) => {
    setCompanies(companies.filter(c => c.id !== companyId));
  };

  const updateCompanyName = (companyId: number, name: string) => {
    setCompanies(companies.map(c => c.id === companyId ? { ...c, name } : c));
  };

  const addJobLink = (companyId: number) => {
    setCompanies(companies.map(c => 
      c.id === companyId 
        ? { ...c, jobs: [...c.jobs, { id: Date.now(), url: '' }] } 
        : c
    ));
  };
  
  const removeJobLink = (companyId: number, jobId: number) => {
    setCompanies(companies.map(c => 
      c.id === companyId
        ? { ...c, jobs: c.jobs.filter(j => j.id !== jobId) }
        : c
    ));
  };
  
  const updateJobLink = (companyId: number, jobId: number, url: string) => {
    setCompanies(companies.map(c =>
      c.id === companyId
        ? { ...c, jobs: c.jobs.map(j => j.id === jobId ? { ...j, url } : j) }
        : c
    ));
  };

  const addExperience = () => {
    setExperiences([...experiences, {id: Date.now(), role: '', company: '', dates: '', description: ''}]);
  };

  const removeExperience = (id: number) => {
      setExperiences(experiences.filter(e => e.id !== id));
  };

  const updateExperience = (id: number, field: keyof Omit<Experience, 'id'>, value: string) => {
      setExperiences(experiences.map(e => e.id === id ? {...e, [field]: value} : e));
  };

  const addEducation = () => {
      setEducations([...educations, {id: Date.now(), institution: '', degree: '', dates: '', description: ''}]);
  };

  const removeEducation = (id: number) => {
      setEducations(educations.filter(e => e.id !== id));
  };

  const updateEducation = (id: number, field: keyof Omit<Education, 'id'>, value: string) => {
      setEducations(educations.map(e => e.id === id ? {...e, [field]: value} : e));
  };

  const handleProfilePicChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfilePic(reader.result as string);
      };
      reader.readAsDataURL(file);
    } else {
        toast({
            title: "Invalid File Type",
            description: "Please select an image file.",
            variant: "destructive",
        })
    }
  };

  const handleResumeChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        toast({
            title: "File Too Large",
            description: "Please select a file smaller than 5MB.",
            variant: "destructive",
        });
        return;
      }
      setResumeFile(file);
    }
  };

  const handleImport = async () => {
    if (!linkedinUrl) {
        toast({ title: "Please enter a URL", variant: "destructive" });
        return;
    }
    setIsFetching(true);
    try {
        const result: LinkedInProfileOutput = await importFromLinkedIn({ url: linkedinUrl });
        if (result) {
            setAbout(result.aboutMe || "");

            const importedExperiences = Array.isArray(result.experiences) ? result.experiences : [];
            setExperiences(importedExperiences.map(e => ({...e, id: Date.now() + Math.random()})));

            const importedEducations = Array.isArray(result.educations) ? result.educations : [];
            setEducations(importedEducations.map(e => ({...e, id: Date.now() + Math.random()})));
            
            toast({ title: "Profile Imported!", description: "Please review the generated information."});
            setIsImporting(false);
            setLinkedinUrl('');
        }
    } catch (error) {
        console.error("Failed to import LinkedIn profile:", error);
        toast({ title: "Import Failed", description: "Could not generate profile data. Please try again.", variant: "destructive" });
    } finally {
        setIsFetching(false);
    }
};

  return (
    <div className="flex min-h-screen items-center justify-center bg-secondary p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader>
            <div className="flex justify-between items-start">
                <div>
                    <CardTitle className="font-headline text-2xl">Your Profile</CardTitle>
                    <CardDescription>
                        This information will be visible to potential referrers. Make it count!
                    </CardDescription>
                </div>
                <Dialog open={isImporting} onOpenChange={setIsImporting}>
                    <DialogTrigger asChild>
                        <Button variant="outline">
                            <Linkedin className="mr-2 h-4 w-4" />
                            Import from LinkedIn
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Import from LinkedIn</DialogTitle>
                            <DialogDescription>
                                Paste your LinkedIn profile URL below. We'll use AI to generate a draft of your profile.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-2">
                           <Label htmlFor="linkedin-url">LinkedIn Profile URL</Label>
                           <Input 
                             id="linkedin-url" 
                             placeholder="https://www.linkedin.com/in/your-profile/"
                             value={linkedinUrl}
                             onChange={(e) => setLinkedinUrl(e.target.value)}
                             disabled={isFetching}
                           />
                        </div>
                        <DialogFooter>
                            <Button variant="ghost" onClick={() => setIsImporting(false)} disabled={isFetching}>Cancel</Button>
                            <Button onClick={handleImport} disabled={isFetching}>
                                {isFetching && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Fetch Profile
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex flex-col items-center gap-4 border-b pb-6">
            <Dialog>
              <DialogTrigger asChild>
                <button className="relative group rounded-full focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2">
                  <Image
                    src={profilePic}
                    alt="Profile Picture"
                    width={128}
                    height={128}
                    className="rounded-full object-cover aspect-square border-4 border-primary/20 shadow-md"
                    data-ai-hint="person avatar"
                  />
                  <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <Eye className="text-white h-8 w-8" />
                  </div>
                </button>
              </DialogTrigger>
              <DialogContent className="border-0 bg-transparent shadow-none w-screen h-screen flex items-center justify-center p-4 [&>[data-radix-dialog-close]]:text-white">
                  <DialogHeader className="sr-only">
                    <DialogTitle>Profile Picture Preview</DialogTitle>
                    <DialogDescription>
                      A larger, full-screen view of the profile picture.
                    </DialogDescription>
                  </DialogHeader>
                  <Image
                      src={profilePic}
                      alt="Profile Picture"
                      width={1024}
                      height={1024}
                      className="rounded-lg object-contain h-auto max-h-[calc(100vh-2rem)] max-w-[calc(100vw-2rem)]"
                  />
              </DialogContent>
            </Dialog>

            <input
              type="file"
              ref={profilePicInputRef}
              onChange={handleProfilePicChange}
              className="hidden"
              accept="image/*"
            />
            <Button variant="outline" onClick={() => profilePicInputRef.current?.click()}>
              <Upload className="mr-2 h-4 w-4" />
              Upload Photo
            </Button>
          </div>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <Input id="name" placeholder="e.g., Jane Doe" defaultValue="Jane Doe" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="current-role">Current Role</Label>
                <Input id="current-role" placeholder="e.g., Product Manager" defaultValue="Product Manager" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="current-experience">Experience in Current Role</Label>
                <Input id="current-experience" placeholder="e.g., 3 years" defaultValue="3 years" />
              </div>
               <div className="space-y-2">
                <Label htmlFor="target-role">Target Role</Label>
                <Input id="target-role" placeholder="e.g., Senior Product Manager" defaultValue="Senior Product Manager" />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
              <div className="space-y-2">
                <Label htmlFor="salary">Expected Salary (USD)</Label>
                <Input
                  id="salary"
                  type="number"
                  placeholder="e.g., 150000"
                  defaultValue="150000"
                  className={cn("transition-all", !isSalaryVisible && "blur-sm")}
                />
              </div>
              <div className="flex items-center space-x-3">
                <Switch
                  id="salary-visibility"
                  checked={isSalaryVisible}
                  onCheckedChange={setIsSalaryVisible}
                />
                <div className="grid gap-0.5">
                  <Label htmlFor="salary-visibility" className="text-sm font-medium leading-none cursor-pointer">Show on Profile</Label>
                  <p className="text-xs text-muted-foreground">
                      Visible to referrers.
                  </p>
                </div>
              </div>
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
                value={about}
                onChange={(e) => setAbout(e.target.value)}
            />
          </div>

          <div className="space-y-4">
            <Label className="flex items-center gap-2 font-medium text-base">
                <Briefcase className="h-5 w-5 text-primary" /> Work Experience
            </Label>
            <div className="space-y-4">
                {experiences.map((exp) => (
                    <Card key={exp.id} className="p-4 bg-muted/20 border-dashed">
                        <div className="flex items-center justify-end mb-2 -mt-2 -mr-2">
                            <Button variant="ghost" size="icon" onClick={() => removeExperience(exp.id)} aria-label="Remove Experience">
                                <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                             <div className="space-y-2">
                                <Label htmlFor={`exp-role-${exp.id}`}>Role</Label>
                                <Input id={`exp-role-${exp.id}`} placeholder="e.g., Product Manager" value={exp.role} onChange={(e) => updateExperience(exp.id, 'role', e.target.value)} />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor={`exp-company-${exp.id}`}>Company</Label>
                                <Input id={`exp-company-${exp.id}`} placeholder="e.g., TechCorp" value={exp.company} onChange={(e) => updateExperience(exp.id, 'company', e.target.value)} />
                            </div>
                        </div>
                         <div className="space-y-2 mb-4">
                            <Label htmlFor={`exp-dates-${exp.id}`}>Dates</Label>
                            <Input id={`exp-dates-${exp.id}`} placeholder="e.g., Jan 2020 - Present" value={exp.dates} onChange={(e) => updateExperience(exp.id, 'dates', e.target.value)} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor={`exp-desc-${exp.id}`}>Description</Label>
                            <Textarea id={`exp-desc-${exp.id}`} placeholder="Describe your responsibilities and achievements..." value={exp.description} onChange={(e) => updateExperience(exp.id, 'description', e.target.value)} className="min-h-[100px]" />
                        </div>
                    </Card>
                ))}
            </div>
            <Button variant="secondary" onClick={addExperience} className="w-full">
              <PlusCircle className="mr-2 h-4 w-4" />
              Add Work Experience
            </Button>
          </div>

          <div className="space-y-4">
            <Label className="flex items-center gap-2 font-medium text-base">
                <GraduationCap className="h-5 w-5 text-primary" /> Education
            </Label>
            <div className="space-y-4">
                {educations.map((edu) => (
                    <Card key={edu.id} className="p-4 bg-muted/20 border-dashed">
                        <div className="flex items-center justify-end mb-2 -mt-2 -mr-2">
                             <Button variant="ghost" size="icon" onClick={() => removeEducation(edu.id)} aria-label="Remove Education">
                                <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                        </div>
                         <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                             <div className="space-y-2">
                                <Label htmlFor={`edu-institution-${edu.id}`}>Institution</Label>
                                <Input id={`edu-institution-${edu.id}`} placeholder="e.g., Carnegie Mellon University" value={edu.institution} onChange={(e) => updateEducation(edu.id, 'institution', e.target.value)} />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor={`edu-degree-${edu.id}`}>Degree</Label>
                                <Input id={`edu-degree-${edu.id}`} placeholder="e.g., M.S. in HCI" value={edu.degree} onChange={(e) => updateEducation(edu.id, 'degree', e.target.value)} />
                            </div>
                        </div>
                        <div className="space-y-2 mb-4">
                            <Label htmlFor={`edu-dates-${edu.id}`}>Dates</Label>
                            <Input id={`edu-dates-${edu.id}`} placeholder="e.g., 2018 - 2020" value={edu.dates} onChange={(e) => updateEducation(edu.id, 'dates', e.target.value)} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor={`edu-desc-${edu.id}`}>Description / Notes</Label>
                            <Textarea id={`edu-desc-${edu.id}`} placeholder="Describe any relevant coursework, activities, or honors..." value={edu.description} onChange={(e) => updateEducation(edu.id, 'description', e.target.value)} className="min-h-[80px]" />
                        </div>
                    </Card>
                ))}
            </div>
            <Button variant="secondary" onClick={addEducation} className="w-full">
              <PlusCircle className="mr-2 h-4 w-4" />
              Add Education
            </Button>
          </div>

          <div className="space-y-4">
            <Label className="text-base font-medium">Preferred Companies & Job Links</Label>
            <p className="text-sm text-muted-foreground">Add companies you're interested in and links to specific job postings.</p>
            <div className="space-y-4">
              {companies.map((company) => (
                <Card key={company.id} className="p-4 bg-muted/20 border-dashed">
                  <div className="flex items-center gap-2 mb-4">
                    <Input 
                      placeholder="Company Name" 
                      value={company.name}
                      onChange={(e) => updateCompanyName(company.id, e.target.value)}
                      className="text-base font-semibold"
                    />
                    <Button variant="ghost" size="icon" onClick={() => removeCompany(company.id)} aria-label="Remove Company">
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                  <div className="space-y-2 pl-4 border-l-2 border-primary/50">
                    <Label className="text-xs text-muted-foreground font-normal">Links to job postings</Label>
                    {company.jobs.map((job) => (
                      <div key={job.id} className="flex items-center gap-2">
                        <Input 
                          placeholder="https://..." 
                          value={job.url}
                          onChange={(e) => updateJobLink(company.id, job.id, e.target.value)}
                        />
                         <Button variant="ghost" size="icon" onClick={() => removeJobLink(company.id, job.id)} aria-label="Remove Job Link">
                          <Trash2 className="h-4 w-4 text-destructive/70" />
                        </Button>
                      </div>
                    ))}
                    <Button variant="outline" size="sm" onClick={() => addJobLink(company.id)} className="mt-2">
                      <PlusCircle className="mr-2 h-4 w-4" />
                      Add Job Link
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
            <Button variant="secondary" onClick={addCompany} className="w-full">
              <PlusCircle className="mr-2 h-4 w-4" />
              Add Another Company
            </Button>
          </div>

          <div className="space-y-2">
            <Label>Resume</Label>
            <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 p-2 border rounded-md bg-muted/50 w-full">
                    <span className="text-sm text-muted-foreground truncate">{resumeFile?.name || 'my_awesome_resume_final.pdf'}</span>
                </div>
                 <input 
                    type="file" 
                    ref={resumeInputRef} 
                    onChange={handleResumeChange} 
                    className="hidden" 
                    accept=".pdf,.doc,.docx"
                />
                <Button variant="outline" onClick={() => resumeInputRef.current?.click()}>
                    <Upload className="mr-2 h-4 w-4" />
                    Upload
                </Button>
            </div>
            <p className="text-xs text-muted-foreground">Upload your resume (PDF, DOCX). Max 5MB.</p>
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
