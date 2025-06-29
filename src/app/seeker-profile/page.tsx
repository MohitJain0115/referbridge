
"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Save, Upload, User, Briefcase, GraduationCap, PlusCircle, Trash2, Linkedin, Eye, Sparkles, Building2, Calendar as CalendarIcon, Download, FileText } from "lucide-react";
import Link from 'next/link';
import Image from 'next/image';
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { Checkbox } from "@/components/ui/checkbox";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";

export const dynamic = 'force-dynamic';

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
    from: Date | undefined;
    to: Date | undefined;
    currentlyWorking: boolean;
    description: string;
};

type Education = {
    id: number;
    institution: string;
    degree: string;
    from: Date | undefined;
    to: Date | undefined;
    description: string;
};

function ProfileViewToggle({ currentView, setView }: { currentView: 'seeker' | 'referrer', setView: (view: 'seeker' | 'referrer') => void }) {
  const baseClasses = "transition-all";

  return (
    <div className="flex items-center gap-2 p-1 rounded-lg bg-muted">
      <Button
        onClick={() => setView('seeker')}
        variant={currentView === 'seeker' ? 'default' : 'ghost'}
        size="sm"
        className={cn(baseClasses, {'shadow-md': currentView === 'seeker'})}
      >
        Job Seeker Profile
      </Button>
      <Button
        onClick={() => setView('referrer')}
        variant={currentView === 'referrer' ? 'default' : 'ghost'}
        size="sm"
        className={cn(baseClasses, {'shadow-md': currentView === 'referrer'})}
      >
        Referrer Profile
      </Button>
    </div>
  );
}

export default function SeekerProfilePage() {
  const { toast } = useToast();
  const [profileView, setProfileView] = useState<'seeker' | 'referrer'>('seeker');
  const [isSalaryVisible, setIsSalaryVisible] = useState(true);

  // Profile picture state
  const [profilePic, setProfilePic] = useState<string>("https://placehold.co/128x128.png");
  const profilePicInputRef = useRef<HTMLInputElement>(null);

  // Resume state
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [showOverwriteDialog, setShowOverwriteDialog] = useState(false);
  const [pendingResume, setPendingResume] = useState<File | null>(null);
  const resumeInputRef = useRef<HTMLInputElement>(null);

  // Seeker states
  const [about, setAbout] = useState(
    "Passionate Product Manager with 3 years of experience in fast-paced tech environments. Skilled in user research, agile methodologies, and cross-functional team leadership. Eager to leverage my skills to build innovative products that users love."
  );
  const [companies, setCompanies] = useState<Company[]>([
    { id: 1, name: 'Google', jobs: [{ id: 1, url: 'https://www.linkedin.com/jobs/view/12345' }] },
    { id: 2, name: 'Stripe', jobs: [{ id: 1, url: '' }] },
  ]);
  const [experiences, setExperiences] = useState<Experience[]>([
      { id: 101, role: 'Product Manager', company: 'TechCorp', from: new Date(2021, 0, 1), to: undefined, currentlyWorking: true, description: '- Managed the product lifecycle...\n- Increased user engagement by 15%...' }
  ]);
  const [educations, setEducations] = useState<Education[]>([
      { id: 201, institution: 'Carnegie Mellon University', degree: 'M.S. in Human-Computer Interaction', from: new Date(2018, 7), to: new Date(2020, 4), description: 'Relevant coursework: User-Centered Research, Interaction Design.' }
  ]);

  // Referrer states
  const [referrerCompany, setReferrerCompany] = useState("InnovateX");
  const [referrerAbout, setReferrerAbout] = useState("As a Senior Engineer at InnovateX, I often have visibility into new roles in the backend and cloud domains. Happy to refer strong candidates who are passionate about building scalable systems.");
  const [referrerSpecialties, setReferrerSpecialties] = useState("Backend, Go, Python, AWS, Scaling");

  const addCompany = () => setCompanies([...companies, { id: Date.now(), name: '', jobs: [{ id: Date.now(), url: '' }] }]);
  const removeCompany = (companyId: number) => setCompanies(companies.filter(c => c.id !== companyId));
  const updateCompanyName = (companyId: number, name: string) => setCompanies(companies.map(c => c.id === companyId ? { ...c, name } : c));
  const addJobLink = (companyId: number) => setCompanies(companies.map(c => c.id === companyId ? { ...c, jobs: [...c.jobs, { id: Date.now(), url: '' }] } : c));
  const removeJobLink = (companyId: number, jobId: number) => setCompanies(companies.map(c => c.id === companyId ? { ...c, jobs: c.jobs.filter(j => j.id !== jobId) } : c));
  const updateJobLink = (companyId: number, jobId: number, url: string) => setCompanies(companies.map(c => c.id === companyId ? { ...c, jobs: c.jobs.map(j => j.id === jobId ? { ...j, url } : j) } : c));

  const addExperience = () => setExperiences([...experiences, {id: Date.now(), role: '', company: '', from: undefined, to: undefined, currentlyWorking: false, description: ''}]);
  const removeExperience = (id: number) => setExperiences(experiences.filter(e => e.id !== id));
  const handleExperienceChange = (id: number, field: keyof Omit<Experience, 'id'>, value: string | boolean | Date | undefined) => {
    setExperiences(experiences.map(exp => {
        if (exp.id === id) {
            const updatedExp = { ...exp, [field]: value };
            if (field === 'currentlyWorking' && value === true) {
                updatedExp.to = undefined;
            }
            return updatedExp;
        }
        return exp;
    }));
  };

  const addEducation = () => setEducations([...educations, {id: Date.now(), institution: '', degree: '', from: undefined, to: undefined, description: ''}]);
  const removeEducation = (id: number) => setEducations(educations.filter(e => e.id !== id));
  const handleEducationChange = (id: number, field: keyof Omit<Education, 'id'>, value: string | Date | undefined) => {
    setEducations(educations.map(edu => edu.id === id ? { ...edu, [field]: value } : edu));
  };

  const handleProfilePicChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onloadend = () => setProfilePic(reader.result as string);
      reader.readAsDataURL(file);
    } else {
      toast({ title: "Invalid File Type", description: "Please select an image file.", variant: "destructive" });
    }
  };

  const handleResumeChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) { // 5MB limit
      toast({ title: "File Too Large", description: "Please select a file smaller than 5MB.", variant: "destructive" });
      return;
    }

    if (resumeFile) {
      setPendingResume(file);
      setShowOverwriteDialog(true);
    } else {
      setResumeFile(file);
    }
    // Clear the input value so the same file can be selected again
    event.target.value = '';
  };

  const handleConfirmOverwrite = () => {
    if (pendingResume) {
      const oldFileName = resumeFile?.name || 'the previous file';
      setResumeFile(pendingResume);
      toast({
          title: "Resume Updated",
          description: `Replaced ${oldFileName} with ${pendingResume.name}.`
      });
    }
    setShowOverwriteDialog(false);
    setPendingResume(null);
  };

  const handleCancelOverwrite = () => {
    setShowOverwriteDialog(false);
    setPendingResume(null);
  };

  const handleDownloadResume = () => {
    if (resumeFile) {
      const url = URL.createObjectURL(resumeFile);
      const a = document.createElement('a');
      a.href = url;
      a.download = resumeFile.name;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  };

  const handleSave = () => {
    toast({
      title: "Profile Saved!",
      description: `Your ${profileView} profile has been successfully updated.`,
    });
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-secondary p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <div>
            <CardTitle className="font-headline text-2xl">Your {profileView === 'seeker' ? 'Job Seeker' : 'Referrer'} Profile</CardTitle>
            <CardDescription>
              This information will be visible to potential {profileView === 'seeker' ? 'referrers' : 'job seekers'}. Make it count!
            </CardDescription>
          </div>
          <div className="flex items-center justify-between pt-4">
            <ProfileViewToggle currentView={profileView} setView={setProfileView} />
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                toast({
                  title: "Coming Soon!",
                  description: "This feature is under development. For now, please fill in your details manually.",
                });
              }}
              className="opacity-60"
            >
              <Linkedin className="mr-2 h-4 w-4" />
              Import from LinkedIn
            </Button>
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
              <DialogContent className="border-0 bg-transparent shadow-none w-auto h-auto p-0 flex items-center justify-center [&>[data-radix-dialog-close]]:text-white">
                <DialogHeader className="sr-only">
                    <DialogTitle>Profile Picture</DialogTitle>
                    <DialogDescription>A larger view of the user's profile picture.</DialogDescription>
                </DialogHeader>
                <div className="p-4">
                  <Image
                      src={profilePic}
                      alt="Profile Picture"
                      width={1024}
                      height={1024}
                      className="rounded-lg object-contain h-auto max-h-[calc(100vh-4rem)] max-w-[calc(100vw-4rem)]"
                  />
                </div>
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
            </div>
          </div>

          {profileView === 'seeker' ? (
            <div className="space-y-6">
              <div className="space-y-4">
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                <h3 className="flex items-center gap-2 font-medium text-base">
                    <Briefcase className="h-5 w-5 text-primary" /> Work Experience
                </h3>
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
                                    <Input id={`exp-role-${exp.id}`} placeholder="e.g., Product Manager" value={exp.role} onChange={(e) => handleExperienceChange(exp.id, 'role', e.target.value)} />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor={`exp-company-${exp.id}`}>Company</Label>
                                    <Input id={`exp-company-${exp.id}`} placeholder="e.g., TechCorp" value={exp.company} onChange={(e) => handleExperienceChange(exp.id, 'company', e.target.value)} />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-2">
                                <div className="space-y-2">
                                    <Label htmlFor={`exp-from-${exp.id}`}>From</Label>
                                    <Popover>
                                        <PopoverTrigger asChild>
                                            <Button id={`exp-from-${exp.id}`} variant="outline" className={cn("w-full justify-start text-left font-normal", !exp.from && "text-muted-foreground")}>
                                                <CalendarIcon className="mr-2 h-4 w-4" />
                                                {exp.from ? format(exp.from, "MMM yyyy") : <span>Pick a date</span>}
                                            </Button>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-auto p-0">
                                            <Calendar mode="single" selected={exp.from} onSelect={(date) => handleExperienceChange(exp.id, 'from', date)} captionLayout="dropdown-buttons" fromYear={1980} toYear={new Date().getFullYear()} />
                                        </PopoverContent>
                                    </Popover>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor={`exp-to-${exp.id}`}>To</Label>
                                    <Popover>
                                        <PopoverTrigger asChild>
                                            <Button id={`exp-to-${exp.id}`} variant="outline" className={cn("w-full justify-start text-left font-normal", !exp.to && "text-muted-foreground")} disabled={exp.currentlyWorking}>
                                                <CalendarIcon className="mr-2 h-4 w-4" />
                                                {exp.currentlyWorking ? 'Present' : exp.to ? format(exp.to, "MMM yyyy") : <span>Pick a date</span>}
                                            </Button>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-auto p-0">
                                            <Calendar mode="single" selected={exp.to} onSelect={(date) => handleExperienceChange(exp.id, 'to', date)} disabled={exp.currentlyWorking} captionLayout="dropdown-buttons" fromYear={1980} toYear={new Date().getFullYear()}/>
                                        </PopoverContent>
                                    </Popover>
                                </div>
                            </div>
                            <div className="flex items-center space-x-2 mb-4">
                                <Checkbox id={`exp-current-${exp.id}`} checked={exp.currentlyWorking} onCheckedChange={(checked) => handleExperienceChange(exp.id, 'currentlyWorking', !!checked)} />
                                <Label htmlFor={`exp-current-${exp.id}`} className="font-normal cursor-pointer">I currently work here</Label>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor={`exp-desc-${exp.id}`}>Description</Label>
                                <Textarea id={`exp-desc-${exp.id}`} placeholder="Describe your responsibilities and achievements..." value={exp.description} onChange={(e) => handleExperienceChange(exp.id, 'description', e.target.value)} className="min-h-[100px]" />
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
                <h3 className="flex items-center gap-2 font-medium text-base">
                    <GraduationCap className="h-5 w-5 text-primary" /> Education
                </h3>
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
                                    <Input id={`edu-institution-${edu.id}`} placeholder="e.g., Carnegie Mellon University" value={edu.institution} onChange={(e) => handleEducationChange(edu.id, 'institution', e.target.value)} />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor={`edu-degree-${edu.id}`}>Degree</Label>
                                    <Input id={`edu-degree-${edu.id}`} placeholder="e.g., M.S. in HCI" value={edu.degree} onChange={(e) => handleEducationChange(edu.id, 'degree', e.target.value)} />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                <div className="space-y-2">
                                    <Label htmlFor={`edu-from-${edu.id}`}>From</Label>
                                    <Popover>
                                        <PopoverTrigger asChild>
                                            <Button id={`edu-from-${edu.id}`} variant="outline" className={cn("w-full justify-start text-left font-normal", !edu.from && "text-muted-foreground")}>
                                                <CalendarIcon className="mr-2 h-4 w-4" />
                                                {edu.from ? format(edu.from, "MMM yyyy") : <span>Pick a date</span>}
                                            </Button>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-auto p-0">
                                            <Calendar mode="single" selected={edu.from} onSelect={(date) => handleEducationChange(edu.id, 'from', date)} captionLayout="dropdown-buttons" fromYear={1980} toYear={new Date().getFullYear()} />
                                        </PopoverContent>
                                    </Popover>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor={`edu-to-${edu.id}`}>To</Label>
                                    <Popover>
                                        <PopoverTrigger asChild>
                                            <Button id={`edu-to-${edu.id}`} variant="outline" className={cn("w-full justify-start text-left font-normal", !edu.to && "text-muted-foreground")}>
                                                <CalendarIcon className="mr-2 h-4 w-4" />
                                                {edu.to ? format(edu.to, "MMM yyyy") : <span>Pick a date</span>}
                                            </Button>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-auto p-0">
                                            <Calendar mode="single" selected={edu.to} onSelect={(date) => handleEducationChange(edu.id, 'to', date)} captionLayout="dropdown-buttons" fromYear={1980} toYear={new Date().getFullYear()} />
                                        </PopoverContent>
                                    </Popover>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor={`edu-desc-${edu.id}`}>Description / Notes</Label>
                                <Textarea id={`edu-desc-${edu.id}`} placeholder="Describe any relevant coursework, activities, or honors..." value={edu.description} onChange={(e) => handleEducationChange(edu.id, 'description', e.target.value)} className="min-h-[80px]" />
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
                 <div className="space-y-1">
                    <h3 className="flex items-center gap-2 font-medium text-base">
                        <Building2 className="h-5 w-5 text-primary" /> Target Companies & Job Links
                    </h3>
                    <p className="text-sm text-muted-foreground">Add companies you're interested in and links to specific job postings.</p>
                </div>
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
                  <Card className="p-4 bg-muted/20 border-dashed">
                    {resumeFile ? (
                      <div className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-2 overflow-hidden">
                          <FileText className="h-5 w-5 text-primary flex-shrink-0" />
                          <span className="font-medium text-sm truncate">{resumeFile.name}</span>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                            <Button variant="outline" size="sm" onClick={handleDownloadResume}>
                                <Download className="mr-2 h-4 w-4" />
                                Download
                            </Button>
                            <Button variant="secondary" size="sm" onClick={() => resumeInputRef.current?.click()}>
                                <Upload className="mr-2 h-4 w-4" />
                                Replace
                            </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center p-4 text-center">
                        <p className="mb-2 text-sm text-muted-foreground">No resume uploaded.</p>
                        <Button variant="outline" onClick={() => resumeInputRef.current?.click()}>
                          <Upload className="mr-2 h-4 w-4" />
                          Upload Resume
                        </Button>
                      </div>
                    )}
                  </Card>
                  <input
                    type="file"
                    ref={resumeInputRef}
                    onChange={handleResumeChange}
                    className="hidden"
                    accept=".pdf,.doc,.docx"
                  />
                  <p className="text-xs text-muted-foreground pl-1">Upload your resume (PDF, DOC, DOCX). Max 5MB.</p>
              </div>

            </div>
          ) : (
            <div className="space-y-6">
                <div className="space-y-2">
                    <Label htmlFor="referrer-company">Your Company</Label>
                    <Input
                      id="referrer-company"
                      placeholder="e.g., Google"
                      value={referrerCompany}
                      onChange={(e) => setReferrerCompany(e.target.value)}
                    />
                </div>

                <div className="space-y-2">
                    <Label htmlFor="referrer-about" className="flex items-center gap-2 font-medium">
                        <User className="h-4 w-4 text-primary" /> Referrer Bio
                    </Label>
                    <Textarea
                        id="referrer-about"
                        placeholder="Describe your role and the types of candidates you can refer."
                        className="min-h-[100px]"
                        value={referrerAbout}
                        onChange={(e) => setReferrerAbout(e.target.value)}
                    />
                    <p className="text-xs text-muted-foreground">This will be shown to job seekers viewing your referrer profile.</p>
                </div>

                <div className="space-y-2">
                    <Label htmlFor="referrer-specialties" className="flex items-center gap-2 font-medium">
                        <Sparkles className="h-4 w-4 text-primary" /> Your Specialties
                    </Label>
                    <Input
                        id="referrer-specialties"
                        placeholder="e.g., Frontend, React, Product Management"
                        value={referrerSpecialties}
                        onChange={(e) => setReferrerSpecialties(e.target.value)}
                    />
                    <p className="text-xs text-muted-foreground">Enter comma-separated skills or roles you specialize in.</p>
                </div>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-4 border-t">
              <Button variant="ghost" asChild>
                  <Link href="/dashboard">Cancel</Link>
              </Button>
               <Button onClick={handleSave}>
                <Save className="mr-2 h-4 w-4" />
                Save Changes
            </Button>
          </div>

        </CardContent>
      </Card>

      <AlertDialog open={showOverwriteDialog} onOpenChange={setShowOverwriteDialog}>
        <AlertDialogContent>
            <AlertDialogHeader>
                <AlertDialogTitle>Replace existing resume?</AlertDialogTitle>
                <AlertDialogDescription>
                    You have already uploaded a resume. Do you want to replace "{resumeFile?.name}" with "{pendingResume?.name}"?
                </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
                <AlertDialogCancel onClick={handleCancelOverwrite}>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleConfirmOverwrite}>Replace</AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

    </div>
  );
}
