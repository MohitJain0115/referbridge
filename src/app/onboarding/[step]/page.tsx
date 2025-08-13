

"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import { useParams, useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Save, Upload, User, Briefcase, GraduationCap, PlusCircle, Trash2, Sparkles, Building2, Download, FileText, Loader2, Info, ArrowLeft, ArrowRight, DollarSign } from "lucide-react";
import Image from 'next/image';
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { format, getMonth, getYear } from "date-fns";
import { Checkbox } from "@/components/ui/checkbox";
import { ref as storageRef, uploadBytes, getDownloadURL } from "firebase/storage";
import { doc, setDoc, getDoc, Timestamp } from "firebase/firestore";
import { onAuthStateChanged, type User as FirebaseUser } from "firebase/auth";
import { auth, db, storage, firebaseReady } from "@/lib/firebase";
import { Skeleton } from "@/components/ui/skeleton";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";


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
    to: Date | undefined | null;
    currentlyWorking: boolean;
    description: string;
};

type Education = {
    id: number;
    institution: string;
    degree: string;
    from: Date | undefined;
    to: Date | undefined | null;
    description: string;
};

const TOTAL_STEPS = 8;

export default function OnboardingStepPage() {
  const router = useRouter();
  const params = useParams();
  const currentStep = parseInt(params.step as string, 10);

  const { toast } = useToast();
  
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 70 }, (_, i) => currentYear - i);
  const months = Array.from({ length: 12 }, (_, i) => ({
    value: i,
    label: format(new Date(0, i), 'MMMM'),
  }));

  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  
  // Profile State
  const [profilePic, setProfilePic] = useState<string>("https://placehold.co/128x128.png");
  const [isUploadingPic, setIsUploadingPic] = useState(false);
  const profilePicInputRef = useRef<HTMLInputElement>(null);
  const [name, setName] = useState("");
  const [currentRole, setCurrentRole] = useState("");
  const [targetRole, setTargetRole] = useState("");
  const [expectedSalary, setExpectedSalary] = useState<number | string>("");
  const [expectedSalaryCurrency, setExpectedSalaryCurrency] = useState("INR");
  const [about, setAbout] = useState("");
  const [skills, setSkills] = useState("");
  const [experiences, setExperiences] = useState<Experience[]>([]);
  const [educations, setEducations] = useState<Education[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [isFresher, setIsFresher] = useState(false);

  // Resume State
  const [resumeUrl, setResumeUrl] = useState<string | null>(null);
  const [resumeName, setResumeName] = useState<string | null>(null);
  const [isUploadingResume, setIsUploadingResume] = useState(false);
  const [showOverwriteDialog, setShowOverwriteDialog] = useState(false);
  const [pendingResume, setPendingResume] = useState<File | null>(null);
  const resumeInputRef = useRef<HTMLInputElement>(null);


  useEffect(() => {
    if (!firebaseReady) {
        setIsLoading(false);
        return;
    }
    const unsubscribe = onAuthStateChanged(auth, (user) => {
        if (user) {
            setCurrentUser(user);
        } else {
            router.push("/login");
        }
    });
    return () => unsubscribe();
  }, [router]);

  useEffect(() => {
    async function loadUserData() {
      if (!currentUser || !db) return;
      
      try {
        const profileDocRef = doc(db, "profiles", currentUser.uid);
        const profileDocSnap = await getDoc(profileDocRef);
        if (profileDocSnap.exists()) {
            const data = profileDocSnap.data();
            setName(data.name || "");
            setCurrentRole(data.currentRole || "");
            setTargetRole(data.targetRole || "");
            setExpectedSalary(data.expectedSalary || "");
            setExpectedSalaryCurrency(data.expectedSalaryCurrency || "INR");
            setAbout(data.about || "");
            setSkills(data.skills?.join(', ') || "");
            setCompanies(data.companies || []);
            const loadedExperiences = data.experiences?.map((exp: any) => ({ ...exp, id: exp.id || Date.now() + Math.random(), from: exp.from?.toDate(), to: exp.to?.toDate() })) || [];
            setExperiences(loadedExperiences);
            if (loadedExperiences.length === 0) {
              setIsFresher(data.isFresher === true);
            }
            setEducations(data.educations?.map((edu: any) => ({ ...edu, id: edu.id || Date.now() + Math.random(), from: edu.from?.toDate(), to: edu.to?.toDate() })) || []);
            setProfilePic(data.profilePic || "https://placehold.co/128x128.png");
        }

        const resumeDocRef = doc(db, "resumes", currentUser.uid);
        const resumeDocSnap = await getDoc(resumeDocRef);
        if (resumeDocSnap.exists()) {
            const resumeData = resumeDocSnap.data();
            setResumeUrl(resumeData.fileUrl);
            setResumeName(resumeData.fileName);
        }
      } catch (error) {
        console.error("Error loading user data:", error);
      } finally {
        setIsLoading(false);
      }
    }
    if (currentUser) {
        loadUserData();
    }
  }, [currentUser]);

  const handleProfilePicChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!currentUser || !storage) {
        toast({ title: "Please log in", description: "You must be logged in to upload a photo.", variant: "destructive" });
        return;
    }
    const file = event.target.files?.[0];
    if (file && file.type.startsWith("image/")) {
        setIsUploadingPic(true);
        try {
            const fileRef = storageRef(storage, `profile-pics/${currentUser.uid}/${file.name}`);
            await uploadBytes(fileRef, file);
            const url = await getDownloadURL(fileRef);
            setProfilePic(url);
            await setDoc(doc(db, "profiles", currentUser.uid), { profilePic: url }, { merge: true });
            toast({ title: "Photo Updated", description: "Your new profile picture has been saved." });
        } catch (error: any) {
            console.error("Profile picture upload error:", error);
            if (error.code === 'storage/unauthorized') {
                toast({
                    title: "Storage Access Denied",
                    description: "Check Storage CORS and Security Rules.",
                    variant: "destructive",
                    duration: 10000
                });
            } else if (error.code === 'permission-denied') {
                 toast({
                    title: "Permission Denied",
                    description: "Could not save photo URL. Check Firestore Security Rules.",
                    variant: "destructive",
                    duration: 10000,
                });
            } else {
                toast({ title: "Upload Failed", description: "There was a problem uploading your photo.", variant: "destructive" });
            }
        } finally {
            setIsUploadingPic(false);
        }
    } else {
        toast({ title: "Invalid File Type", description: "Please select an image file.", variant: "destructive" });
    }
  };


  const handleSaveAndContinue = async () => {
    if (!currentUser) return;
    setIsSaving(true);
    
    const profileData = {
      name,
      currentRole,
      targetRole,
      expectedSalary: Number(expectedSalary) || 0,
      expectedSalaryCurrency,
      isSalaryVisible: true,
      about,
      skills: skills.split(',').map(s => s.trim()).filter(Boolean),
      experiences: isFresher ? [] : experiences.map(exp => ({ ...exp, from: exp.from ? Timestamp.fromDate(exp.from) : undefined, to: exp.to ? Timestamp.fromDate(exp.to) : null })),
      isFresher: isFresher,
      educations: educations.map(edu => ({ ...edu, from: edu.from ? Timestamp.fromDate(edu.from) : undefined, to: edu.to ? Timestamp.fromDate(edu.to) : null })),
      companies,
      profilePic,
      updatedAt: new Date(),
    };

    try {
      await setDoc(doc(db, "profiles", currentUser.uid), profileData, { merge: true });
      if (currentStep < TOTAL_STEPS) {
          router.push(`/onboarding/${currentStep + 1}`);
      } else {
          toast({ title: "Profile Complete!", description: "You can now explore the dashboard."});
          router.push('/dashboard');
      }
    } catch (error) {
      console.error("Error saving profile:", error);
      toast({ title: "Save Failed", description: "Could not save your progress.", variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };
  
  const handleBack = () => {
    if (currentStep > 1) {
        router.push(`/onboarding/${currentStep - 1}`);
    }
  };

  const handleSkip = () => {
    if (currentStep < TOTAL_STEPS) {
      router.push(`/onboarding/${currentStep + 1}`);
    } else {
      router.push("/dashboard");
    }
  };

  const addExperience = () => setExperiences([...experiences, {id: Date.now(), role: '', company: '', from: undefined, to: undefined, currentlyWorking: false, description: ''}]);
  const removeExperience = (id: number) => setExperiences(experiences.filter(e => e.id !== id));
  const handleExperienceChange = (id: number, field: keyof Omit<Experience, 'id'>, value: string | boolean) => {
    setExperiences(experiences.map(exp => {
        if (exp.id === id) {
            const updatedExp = { ...exp, [field]: value };
            if (field === 'currentlyWorking' && value === true) {
                updatedExp.to = null;
            }
            return updatedExp;
        }
        return exp;
    }));
  };

  const handleExperienceDateChange = (id: number, field: 'from' | 'to', part: 'month' | 'year', value: string) => {
    setExperiences(experiences.map(exp => {
      if (exp.id === id) {
        const currentDate = exp[field] || new Date();
        const newDate = new Date(currentDate);
        if (part === 'month') {
          newDate.setMonth(parseInt(value, 10));
        } else {
          newDate.setFullYear(parseInt(value, 10));
        }
        return { ...exp, [field]: newDate };
      }
      return exp;
    }));
  };
  
  const addEducation = () => setEducations([...educations, {id: Date.now(), institution: '', degree: '', from: undefined, to: undefined, description: ''}]);
  const removeEducation = (id: number) => setEducations(educations.filter(e => e.id !== id));
  const handleEducationChange = (id: number, field: keyof Omit<Education, 'id'>, value: string) => {
    setEducations(educations.map(edu => edu.id === id ? { ...edu, [field]: value } : edu));
  };
  
  const handleEducationDateChange = (id: number, field: 'from' | 'to', part: 'month' | 'year', value: string) => {
    setEducations(educations.map(edu => {
      if (edu.id === id) {
        const currentDate = edu[field] || new Date();
        const newDate = new Date(currentDate);
        if (part === 'month') {
          newDate.setMonth(parseInt(value, 10));
        } else {
          newDate.setFullYear(parseInt(value, 10));
        }
        return { ...edu, [field]: newDate };
      }
      return edu;
    }));
  };
  
  const addCompany = () => setCompanies([...companies, { id: Date.now(), name: '', jobs: [{ id: Date.now(), url: '' }] }]);
  const removeCompany = (companyId: number) => setCompanies(companies.filter(c => c.id !== companyId));
  const updateCompanyName = (companyId: number, name: string) => setCompanies(companies.map(c => c.id === companyId ? { ...c, name } : c));
  const addJobLink = (companyId: number) => setCompanies(companies.map(c => c.id === companyId ? { ...c, jobs: [...c.jobs, { id: Date.now(), url: '' }] } : c));
  const removeJobLink = (companyId: number, jobId: number) => setCompanies(companies.map(c => c.id === companyId ? { ...c, jobs: c.jobs.filter(j => j.id !== jobId) } : c));
  const updateJobLink = (companyId: number, jobId: number, url: string) => setCompanies(companies.map(c => c.id === companyId ? { ...c, jobs: c.jobs.map(j => j.id === jobId ? { ...j, url } : j) } : c));
  
  // Resume handlers
  const handleResumeFileSelected = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) { // 5MB limit
      toast({ title: "File Too Large", description: "Please select a file smaller than 5MB.", variant: "destructive" });
      return;
    }

    if (resumeUrl) {
      setPendingResume(file);
      setShowOverwriteDialog(true);
    } else {
      uploadResume(file);
    }
    event.target.value = '';
  };

  const uploadResume = async (file: File) => {
    if (!currentUser || !storage || !db) {
        toast({ title: "Not Logged In", description: "You must be logged in to upload a resume.", variant: "destructive" });
        return;
    }
    setIsUploadingResume(true);
    try {
        const fileRef = storageRef(storage, `resumes/${currentUser.uid}/${file.name}`);
        const uploadResult = await uploadBytes(fileRef, file);
        const url = await getDownloadURL(uploadResult.ref);

        await setDoc(doc(db, "resumes", currentUser.uid), {
            userId: currentUser.uid,
            fileName: file.name,
            fileUrl: url,
            uploadedAt: new Date(),
        }, { merge: true });

        setResumeUrl(url);
        setResumeName(file.name);
        toast({ title: "Success", description: "Your resume has been uploaded successfully." });
    } catch (error: any) {
        console.error("Resume upload error:", error);
        if (error.code === 'storage/unauthorized') {
          toast({
            title: "Permission Denied",
            description: "Check Storage CORS and Security Rules.",
            variant: "destructive",
            duration: 10000,
          });
        } else if (error.code === 'permission-denied') {
             toast({
                title: "Permission Denied",
                description: "Could not save resume data. Check Firestore Security Rules.",
                variant: "destructive",
                duration: 10000,
            });
        } else {
          toast({ title: "Upload Failed", description: "There was a problem uploading your resume.", variant: "destructive" });
        }
    } finally {
        setIsUploadingResume(false);
        setPendingResume(null);
    }
  };

  const handleConfirmOverwrite = () => {
    if (pendingResume) {
        uploadResume(pendingResume);
    }
    setShowOverwriteDialog(false);
  };

  const handleCancelOverwrite = () => {
    setShowOverwriteDialog(false);
    setPendingResume(null);
  };
  
  const handleDownloadResume = () => {
    if (resumeUrl) {
      window.open(resumeUrl, '_blank');
    }
  };

  const shouldShowSkip = useMemo(() => {
    return [3, 4, 7].includes(currentStep);
  }, [currentStep]);

  const isStep1Invalid = currentStep === 1 && (!name.trim() || !currentRole.trim());
  const isStep2Invalid = currentStep === 2 && profilePic === "https://placehold.co/128x128.png";
  const isStep5Invalid = useMemo(() => {
    if (currentStep !== 5) return false;
    if (isFresher) return false;
    if (experiences.length === 0) return true;
    return experiences.some(
      (exp) =>
        !exp.role.trim() ||
        !exp.company.trim() ||
        !exp.from ||
        (!exp.to && !exp.currentlyWorking) ||
        (exp.from && exp.to && exp.from > exp.to)
    );
  }, [currentStep, experiences, isFresher]);


  if (isLoading) {
      return <Skeleton className="w-full h-[400px]" />;
  }
  
  return (
    <>
    <Card className="w-full">
      <CardHeader>
        {currentStep === 1 && (
            <>
                <CardTitle className="font-headline text-2xl">Welcome! Let's get started.</CardTitle>
                <CardDescription>Tell us a bit about yourself.</CardDescription>
            </>
        )}
        {currentStep === 2 && (
            <>
                <CardTitle className="font-headline text-2xl">Upload Your Profile Picture</CardTitle>
                <CardDescription>A professional headshot helps referrers put a face to a name.</CardDescription>
            </>
        )}
        {currentStep === 3 && (
            <>
                <CardTitle className="font-headline text-2xl">Target Role & Salary</CardTitle>
                <CardDescription>Let referrers know what your career and salary expectations are.</CardDescription>
            </>
        )}
        {currentStep === 4 && (
            <>
                <CardTitle className="font-headline text-2xl">Your Professional Summary</CardTitle>
                <CardDescription>Highlight your key skills and write a brief bio.</CardDescription>
            </>
        )}
        {currentStep === 5 && (
            <>
                <CardTitle className="font-headline text-2xl">Work Experience</CardTitle>
                <CardDescription>Detail your professional journey so far.</CardDescription>
            </>
        )}
        {currentStep === 6 && (
            <>
                <CardTitle className="font-headline text-2xl">Education</CardTitle>
                <CardDescription>Add your educational background.</CardDescription>
            </>
        )}
        {currentStep === 7 && (
            <>
                <CardTitle className="font-headline text-2xl">Target Companies</CardTitle>
                <CardDescription>Add companies you're interested in and links to specific job postings.</CardDescription>
            </>
        )}
        {currentStep === 8 && (
            <>
                <CardTitle className="font-headline text-2xl">Upload Your Resume</CardTitle>
                <CardDescription>A resume is crucial for getting referrals. You can upload a PDF, DOC, or DOCX file (max 5MB).</CardDescription>
            </>
        )}
      </CardHeader>
      <CardContent className="space-y-6">
        {currentStep === 1 && (
            <div className="space-y-4">
                <div className="space-y-2">
                    <Label htmlFor="name">Full Name<span className="text-destructive pl-1">*</span></Label>
                    <Input id="name" placeholder="e.g., Jane Doe" value={name} onChange={(e) => setName(e.target.value)} />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="current-role">Current Role<span className="text-destructive pl-1">*</span></Label>
                    <Input id="current-role" placeholder="e.g., Product Manager" value={currentRole} onChange={(e) => setCurrentRole(e.target.value)} />
                </div>
            </div>
        )}
        {currentStep === 2 && (
            <div className="flex flex-col items-center gap-4">
                <Image
                    src={profilePic}
                    alt="Profile Picture"
                    width={128}
                    height={128}
                    className="rounded-full object-cover aspect-square border-4 border-primary/20 shadow-md"
                    data-ai-hint="person avatar"
                />
                <input
                    type="file"
                    ref={profilePicInputRef}
                    onChange={handleProfilePicChange}
                    className="hidden"
                    accept="image/*"
                    disabled={isUploadingPic}
                />
                <Button variant="outline" onClick={() => profilePicInputRef.current?.click()} disabled={isUploadingPic}>
                    {isUploadingPic ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
                    {isUploadingPic ? 'Uploading...' : 'Upload Photo'}
                </Button>
            </div>
        )}
        {currentStep === 3 && (
            <div className="space-y-6">
              <div className="space-y-2">
                  <Label htmlFor="target-role">Target Role</Label>
                  <Input id="target-role" placeholder="e.g., Senior Product Manager" value={targetRole} onChange={(e) => setTargetRole(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="salary" className="flex items-center gap-2 font-medium">
                  <DollarSign className="h-4 w-4 text-primary" /> Expected Annual Salary
                </Label>
                <div className="flex gap-2">
                    <Select value={expectedSalaryCurrency} onValueChange={setExpectedSalaryCurrency}>
                        <SelectTrigger className="w-[100px]">
                            <SelectValue placeholder="Currency" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="INR">INR</SelectItem>
                            <SelectItem value="USD">USD</SelectItem>
                            <SelectItem value="EUR">EUR</SelectItem>
                            <SelectItem value="GBP">GBP</SelectItem>
                        </SelectContent>
                    </Select>
                    <Input
                        id="salary"
                        type="number"
                        placeholder="e.g., 1500000"
                        value={expectedSalary}
                        onChange={(e) => setExpectedSalary(e.target.value)}
                        className="no-spinner"
                    />
                </div>
                <p className="text-xs text-muted-foreground">(This will be visible to anyone who sees your profile)</p>
              </div>
            </div>
        )}
        {currentStep === 4 && (
             <div className="space-y-6">
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
                <div className="space-y-2">
                    <Label htmlFor="skills" className="flex items-center gap-2 font-medium">
                        <Sparkles className="h-4 w-4 text-primary" /> Top Skills
                    </Label>
                    <Input
                        id="skills"
                        placeholder="e.g., React, Node.js, TypeScript"
                        value={skills}
                        onChange={(e) => setSkills(e.target.value)}
                    />
                    <p className="text-xs text-muted-foreground">Enter your key skills, separated by commas.</p>
                </div>
            </div>
        )}
        {currentStep === 5 && (
            <div className="space-y-4">
              <h3 className="flex items-center gap-2 font-medium text-base">
                  <Briefcase className="h-5 w-5 text-primary" /> Work Experience
              </h3>
              <div className="flex items-center space-x-2">
                <Checkbox id="fresher" checked={isFresher} onCheckedChange={(checked) => setIsFresher(!!checked)} />
                <Label htmlFor="fresher" className="font-normal cursor-pointer">I am a fresher (no work experience)</Label>
              </div>

              {!isFresher && (
                <>
                  <div className="space-y-4 max-h-96 overflow-y-auto pr-2">
                      {experiences.map((exp) => (
                          <Card key={exp.id} className="p-4 bg-muted/20 border-dashed">
                              <div className="flex items-center justify-end mb-2 -mt-2 -mr-2">
                                  <Button variant="ghost" size="icon" onClick={() => removeExperience(exp.id)} aria-label="Remove Experience">
                                      <Trash2 className="h-4 w-4 text-destructive" />
                                  </Button>
                              </div>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                  <div className="space-y-2">
                                      <Label htmlFor={`exp-role-${exp.id}`}>Role<span className="text-destructive pl-1">*</span></Label>
                                      <Input id={`exp-role-${exp.id}`} placeholder="e.g., Product Manager" value={exp.role} onChange={(e) => handleExperienceChange(exp.id, 'role', e.target.value)} />
                                  </div>
                                  <div className="space-y-2">
                                      <Label htmlFor={`exp-company-${exp.id}`}>Company<span className="text-destructive pl-1">*</span></Label>
                                      <Input id={`exp-company-${exp.id}`} placeholder="e.g., TechCorp" value={exp.company} onChange={(e) => handleExperienceChange(exp.id, 'company', e.target.value)} />
                                  </div>
                              </div>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-2">
                                  <div className="space-y-2">
                                      <Label>From<span className="text-destructive pl-1">*</span></Label>
                                      <div className="flex gap-2">
                                          <Select value={exp.from ? getMonth(exp.from).toString() : ""} onValueChange={(value) => handleExperienceDateChange(exp.id, 'from', 'month', value)}>
                                              <SelectTrigger><SelectValue placeholder="Month" /></SelectTrigger>
                                              <SelectContent>
                                                  {months.map(month => <SelectItem key={month.value} value={month.value.toString()}>{month.label}</SelectItem>)}
                                              </SelectContent>
                                          </Select>
                                          <Select value={exp.from ? getYear(exp.from).toString() : ""} onValueChange={(value) => handleExperienceDateChange(exp.id, 'from', 'year', value)}>
                                              <SelectTrigger><SelectValue placeholder="Year" /></SelectTrigger>
                                              <SelectContent>
                                                  {years.map(year => <SelectItem key={year} value={year.toString()}>{year}</SelectItem>)}
                                              </SelectContent>
                                          </Select>
                                      </div>
                                  </div>
                                  <div className="space-y-2">
                                      <Label>To<span className="text-destructive pl-1">*</span></Label>
                                      <div className="flex gap-2">
                                          <Select disabled={exp.currentlyWorking} value={exp.to ? getMonth(exp.to).toString() : ""} onValueChange={(value) => handleExperienceDateChange(exp.id, 'to', 'month', value)}>
                                              <SelectTrigger><SelectValue placeholder="Month" /></SelectTrigger>
                                              <SelectContent>
                                                  {months.map(month => <SelectItem key={month.value} value={month.value.toString()}>{month.label}</SelectItem>)}
                                              </SelectContent>
                                          </Select>
                                          <Select disabled={exp.currentlyWorking} value={exp.to ? getYear(exp.to).toString() : ""} onValueChange={(value) => handleExperienceDateChange(exp.id, 'to', 'year', value)}>
                                              <SelectTrigger><SelectValue placeholder="Year" /></SelectTrigger>
                                              <SelectContent>
                                                  {years.map(year => <SelectItem key={year} value={year.toString()}>{year}</SelectItem>)}
                                              </SelectContent>
                                          </Select>
                                      </div>
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
                </>
              )}
            </div>
        )}
        {currentStep === 6 && (
            <div className="space-y-4">
              <h3 className="flex items-center gap-2 font-medium text-base">
                  <GraduationCap className="h-5 w-5 text-primary" /> Education
              </h3>
              <div className="space-y-4 max-h-96 overflow-y-auto pr-2">
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

                         <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-2">
                              <div className="space-y-2">
                                  <Label>From</Label>
                                  <div className="flex gap-2">
                                      <Select value={edu.from ? getMonth(edu.from).toString() : ""} onValueChange={(value) => handleEducationDateChange(edu.id, 'from', 'month', value)}>
                                          <SelectTrigger><SelectValue placeholder="Month" /></SelectTrigger>
                                          <SelectContent>
                                              {months.map(month => <SelectItem key={month.value} value={month.value.toString()}>{month.label}</SelectItem>)}
                                          </SelectContent>
                                      </Select>
                                      <Select value={edu.from ? getYear(edu.from).toString() : ""} onValueChange={(value) => handleEducationDateChange(edu.id, 'from', 'year', value)}>
                                          <SelectTrigger><SelectValue placeholder="Year" /></SelectTrigger>
                                          <SelectContent>
                                              {years.map(year => <SelectItem key={year} value={year.toString()}>{year}</SelectItem>)}
                                          </SelectContent>
                                      </Select>
                                  </div>
                              </div>
                              <div className="space-y-2">
                                  <Label>To</Label>
                                  <div className="flex gap-2">
                                      <Select value={edu.to ? getMonth(edu.to).toString() : ""} onValueChange={(value) => handleEducationDateChange(edu.id, 'to', 'month', value)}>
                                          <SelectTrigger><SelectValue placeholder="Month" /></SelectTrigger>
                                          <SelectContent>
                                              {months.map(month => <SelectItem key={month.value} value={month.value.toString()}>{month.label}</SelectItem>)}
                                          </SelectContent>
                                      </Select>
                                      <Select value={edu.to ? getYear(edu.to).toString() : ""} onValueChange={(value) => handleEducationDateChange(edu.id, 'to', 'year', value)}>
                                          <SelectTrigger><SelectValue placeholder="Year" /></SelectTrigger>
                                          <SelectContent>
                                              {years.map(year => <SelectItem key={year} value={year.toString()}>{year}</SelectItem>)}
                                          </SelectContent>
                                      </Select>
                                  </div>
                              </div>
                          </div>
                          <div className="space-y-2 mt-4">
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
        )}
        {currentStep === 7 && (
            <div className="space-y-6">
                 <div className="space-y-4">
                    <div className="space-y-1">
                        <h3 className="flex items-center gap-2 font-medium text-base">
                            <Building2 className="h-5 w-5 text-primary" /> Target Companies & Job Links
                        </h3>
                        <p className="text-sm text-muted-foreground">Add companies you're interested in and links to specific job postings.</p>
                    </div>
                    <div className="space-y-4 max-h-96 overflow-y-auto pr-2">
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
            </div>
        )}
        {currentStep === 8 && (
            <div className="space-y-2">
              <Label>Resume<span className="text-destructive pl-1">*</span></Label>
                <Card className={cn("p-4 bg-muted/20 border-dashed min-h-[116px] flex items-center justify-center")}>
                  {isUploadingResume ? (
                      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  ) : resumeUrl ? (
                    <div className="flex items-center justify-between gap-4 w-full">
                      <div className="flex items-center gap-2 overflow-hidden">
                        <FileText className="h-5 w-5 text-primary flex-shrink-0" />
                        <span className="font-medium text-sm truncate">{resumeName}</span>
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
                    <div className="flex flex-col items-center justify-center text-center">
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
                  onChange={handleResumeFileSelected}
                  className="hidden"
                  accept=".pdf,.doc,.docx"
                  disabled={isUploadingResume}
                />
                <p className="text-xs text-muted-foreground pl-1">Upload your resume (PDF, DOC, DOCX). Max 5MB.</p>
            </div>
        )}
      </CardContent>
      <CardContent>
        <div className="flex justify-between items-center gap-2 pt-4 border-t">
          <Button variant="outline" onClick={handleBack} disabled={currentStep === 1}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
          </Button>
          <div className="flex items-center gap-2">
              {shouldShowSkip && (
                <Button variant="link" onClick={handleSkip}>
                  Skip for now
                </Button>
              )}
              <Button onClick={handleSaveAndContinue} disabled={isSaving || isUploadingPic || isUploadingResume || isStep1Invalid || isStep2Invalid || isStep5Invalid}>
                  {isSaving || isUploadingPic || isUploadingResume ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  {currentStep === TOTAL_STEPS ? 'Finish' : 'Save & Continue'}
                  {currentStep < TOTAL_STEPS && !isSaving && !isUploadingPic && !isUploadingResume && <ArrowRight className="ml-2 h-4 w-4" />}
              </Button>
          </div>
        </div>
      </CardContent>
    </Card>

    <AlertDialog open={showOverwriteDialog} onOpenChange={setShowOverwriteDialog}>
        <AlertDialogContent>
            <AlertDialogHeader>
                <AlertDialogTitle>Replace existing resume?</AlertDialogTitle>
                <AlertDialogDescription>
                    You have already uploaded a resume. Do you want to replace "{resumeName}" with "{pendingResume?.name}"?
                </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
                <AlertDialogCancel onClick={handleCancelOverwrite}>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleConfirmOverwrite}>Replace</AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
    </AlertDialog>

    </>
  );
}
