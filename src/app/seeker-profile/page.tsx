
"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Save, Upload, User, Briefcase, GraduationCap, PlusCircle, Trash2, Linkedin, Eye, Sparkles, Building2, Calendar as CalendarIcon, Download, FileText, Loader2, Info } from "lucide-react";
import Link from 'next/link';
import Image from 'next/image';
import { cn, calculateTotalExperienceInYears, formatCurrency } from "@/lib/utils";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { Checkbox } from "@/components/ui/checkbox";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { ref as storageRef, uploadBytes, getDownloadURL } from "firebase/storage";
import { doc, setDoc, getDoc, Timestamp } from "firebase/firestore";
import { onAuthStateChanged, type User as FirebaseUser } from "firebase/auth";
import { auth, db, storage, firebaseReady } from "@/lib/firebase";
import { Skeleton } from "@/components/ui/skeleton";
import { useRouter } from "next/navigation";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

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

function PageSkeleton() {
    return (
        <div className="flex min-h-screen items-center justify-center bg-secondary p-4">
            <Card className="w-full max-w-2xl">
                <CardHeader>
                    <Skeleton className="h-8 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="flex flex-col items-center gap-4 border-b pb-6">
                        <Skeleton className="h-32 w-32 rounded-full" />
                        <Skeleton className="h-10 w-32" />
                    </div>
                    <div className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Skeleton className="h-4 w-1/4" />
                                <Skeleton className="h-10 w-full" />
                            </div>
                            <div className="space-y-2">
                                <Skeleton className="h-4 w-1/4" />
                                <Skeleton className="h-10 w-full" />
                            </div>
                        </div>
                    </div>
                    <div className="space-y-2">
                        <Skeleton className="h-4 w-1/5" />
                        <Skeleton className="h-24 w-full" />
                    </div>
                     <div className="space-y-2">
                        <Skeleton className="h-4 w-1/5" />
                        <Skeleton className="h-24 w-full" />
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}

export default function SeekerProfilePage() {
  const { toast } = useToast();
  const router = useRouter();
  const currentYear = new Date().getFullYear();

  // State for which calendar popover is open
  const [openPopoverId, setOpenPopoverId] = useState<string | null>(null);

  // Auth and loading states
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // General state
  const [profileView, setProfileView] = useState<'seeker' | 'referrer'>('seeker');
  const [profilePic, setProfilePic] = useState<string>("https://placehold.co/128x128.png");
  const [isUploadingPic, setIsUploadingPic] = useState(false);
  const profilePicInputRef = useRef<HTMLInputElement>(null);
  
  // Form fields states
  const [name, setName] = useState("");
  const [currentRole, setCurrentRole] = useState("");
  const [targetRole, setTargetRole] = useState("");
  const [expectedSalary, setExpectedSalary] = useState<number | string>("");
  const [expectedSalaryCurrency, setExpectedSalaryCurrency] = useState("USD");
  const [errors, setErrors] = useState<{ name?: boolean; currentRole?: boolean; referrerCompany?: boolean; }>({});


  // Resume state
  const [resumeUrl, setResumeUrl] = useState<string | null>(null);
  const [resumeName, setResumeName] = useState<string | null>(null);
  const [isUploadingResume, setIsUploadingResume] = useState(false);
  const [showOverwriteDialog, setShowOverwriteDialog] = useState(false);
  const [pendingResume, setPendingResume] = useState<File | null>(null);
  const resumeInputRef = useRef<HTMLInputElement>(null);

  // Seeker states
  const [about, setAbout] = useState("");
  const [skills, setSkills] = useState("");
  const [companies, setCompanies] = useState<Company[]>([]);
  const [experiences, setExperiences] = useState<Experience[]>([]);
  const [educations, setEducations] = useState<Education[]>([]);

  // Referrer states
  const [referrerCompany, setReferrerCompany] = useState("");
  const [referrerAbout, setReferrerAbout] = useState("");
  const [referrerSpecialties, setReferrerSpecialties] = useState("");
  
  const totalExperience = useMemo(() => calculateTotalExperienceInYears(experiences), [experiences]);

  // Effect to handle auth state changes
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

  // Effect to load data once user is authenticated
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
            setExpectedSalaryCurrency(data.expectedSalaryCurrency || "USD");
            setAbout(data.about || "");
            setSkills(data.skills?.join(', ') || "");
            setCompanies(data.companies || []);
            setExperiences(data.experiences?.map((exp: any) => ({ ...exp, id: exp.id || Date.now() + Math.random(), from: exp.from?.toDate(), to: exp.to?.toDate() })) || []);
            setEducations(data.educations?.map((edu: any) => ({ ...edu, id: edu.id || Date.now() + Math.random(), from: edu.from?.toDate(), to: edu.to?.toDate() })) || []);
            setReferrerCompany(data.referrerCompany || "");
            setReferrerAbout(data.referrerAbout || "");
            setReferrerSpecialties(data.referrerSpecialties || "");
            setProfilePic(data.profilePic || "https://placehold.co/128x128.png");
        }

        const resumeDocRef = doc(db, "resumes", currentUser.uid);
        const resumeDocSnap = await getDoc(resumeDocRef);
        if (resumeDocSnap.exists()) {
            const resumeData = resumeDocSnap.data();
            setResumeUrl(resumeData.fileUrl);
            setResumeName(resumeData.fileName);
        }
      } catch (error: any) {
          console.error("Error loading user data:", error);
          console.log("Firestore error code:", error.code);
          if (error.code === 'permission-denied') {
            toast({
              title: "Permission Denied",
              description: "Could not load profile. Please check your Firestore Security Rules to allow reads.",
              variant: "destructive",
              duration: 10000,
            });
          } else {
            toast({
                title: "Loading Error",
                description: "Could not load your profile data. Please try refreshing.",
                variant: "destructive",
            });
          }
      } finally {
        setIsLoading(false);
      }
    }
    loadUserData();
  }, [currentUser, toast]);

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
                updatedExp.to = null;
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
                    description: "Please check your Firebase Storage CORS and Security Rules configuration.",
                    variant: "destructive",
                    duration: 10000
                });
            } else if (error.code === 'permission-denied') {
                 toast({
                    title: "Permission Denied",
                    description: "Could not save photo URL. Please check your Firestore Security Rules.",
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
        await uploadBytes(fileRef, file);
        const url = await getDownloadURL(fileRef);

        await setDoc(doc(db, "resumes", currentUser.uid), {
            userId: currentUser.uid,
            fileName: file.name,
            fileUrl: url,
            uploadedAt: new Date(),
        });

        setResumeUrl(url);
        setResumeName(file.name);
        toast({ title: "Success", description: "Your resume has been uploaded successfully." });
    } catch (error: any) {
        console.error("Resume upload error:", error);
        if (error.code === 'storage/unauthorized') {
          toast({
            title: "Permission Denied",
            description: "Please check your Firebase Storage CORS and Security Rules configuration. This is a common issue for new projects.",
            variant: "destructive",
            duration: 10000,
          });
        } else if (error.code === 'permission-denied') {
             toast({
                title: "Permission Denied",
                description: "Could not save resume data. Please check your Firestore Security Rules.",
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

  const handleSave = async () => {
    if (!currentUser || !db) {
      toast({ title: "Error", description: "You must be logged in to save.", variant: "destructive" });
      return;
    }

    const validationErrors: typeof errors = {};
    if (!name.trim()) validationErrors.name = true;
    if (!currentRole.trim()) validationErrors.currentRole = true;
    if (profileView === 'referrer' && !referrerCompany.trim()) {
      validationErrors.referrerCompany = true;
    }

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      toast({
        title: "Missing Required Fields",
        description: "Please fill in all fields marked with an asterisk (*).",
        variant: "destructive",
      });
      return;
    }

    setErrors({});
    setIsSaving(true);
    
    // Auto-populate referrer fields if saving the seeker view
    let updatedReferrerCompany = referrerCompany;
    let updatedReferrerAbout = referrerAbout;
    let updatedReferrerSpecialties = referrerSpecialties;

    if (profileView === 'seeker') {
      const mostRecentExperience = [...experiences].sort((a, b) => {
        const aDate = a.currentlyWorking ? new Date() : a.to;
        const bDate = b.currentlyWorking ? new Date() : b.to;
        if (!aDate) return 1;
        if (!bDate) return -1;
        return bDate.getTime() - aDate.getTime();
      })[0];
      
      if (mostRecentExperience) {
        updatedReferrerCompany = mostRecentExperience.company;
        updatedReferrerAbout = `As a ${mostRecentExperience.role} at ${mostRecentExperience.company}, I'm happy to refer strong candidates in my field.`;
      }
      updatedReferrerSpecialties = skills;
    }

    // Convert dates to Firestore Timestamps before saving
    const experiencesForFirestore = experiences.map(exp => ({
        ...exp,
        from: exp.from ? Timestamp.fromDate(exp.from) : undefined,
        to: exp.to ? Timestamp.fromDate(exp.to) : null
    }));

    const educationsForFirestore = educations.map(edu => ({
        ...edu,
        from: edu.from ? Timestamp.fromDate(edu.from) : undefined,
        to: edu.to ? Timestamp.fromDate(edu.to) : null
    }));

    const profileData = {
      name,
      currentRole,
      targetRole,
      expectedSalary: Number(expectedSalary) || 0,
      expectedSalaryCurrency,
      isSalaryVisible: true,
      about,
      skills: skills.split(',').map(s => s.trim()).filter(Boolean),
      companies,
      experiences: experiencesForFirestore,
      educations: educationsForFirestore,
      referrerCompany: updatedReferrerCompany,
      referrerAbout: updatedReferrerAbout,
      referrerSpecialties: updatedReferrerSpecialties,
      profilePic,
      updatedAt: new Date(),
    };

    try {
      await setDoc(doc(db, "profiles", currentUser.uid), profileData, { merge: true });
      toast({
        title: "Profile Saved!",
        description: `Your ${profileView} profile has been successfully updated.`,
      });
       if (profileView === 'seeker') {
        setReferrerCompany(updatedReferrerCompany);
        setReferrerAbout(updatedReferrerAbout);
        setReferrerSpecialties(updatedReferrerSpecialties);
      }
    } catch (error: any) {
      console.error("Error saving profile:", error);
      if (error.code === 'permission-denied') {
        toast({
          title: "Permission Denied",
          description: "Could not save profile. Please check your Firestore Security Rules to allow writes.",
          variant: "destructive",
          duration: 10000,
        });
      } else {
        toast({ title: "Save Failed", description: "Could not save your profile. Please try again.", variant: "destructive" });
      }
    } finally {
      setIsSaving(false);
    }
  };
  
  if (isLoading) {
    return <PageSkeleton />;
  }

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
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <span tabIndex={0}>
                    <Button variant="outline" size="sm" disabled>
                      <Linkedin className="mr-2 h-4 w-4" />
                      Import from LinkedIn
                    </Button>
                  </span>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Feature under development</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
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
                     {isUploadingPic ? <Loader2 className="text-white h-8 w-8 animate-spin" /> : <Eye className="text-white h-8 w-8" />}
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
              disabled={isUploadingPic}
            />
            <Button variant="outline" onClick={() => profilePicInputRef.current?.click()} disabled={isUploadingPic}>
              {isUploadingPic ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
              {isUploadingPic ? 'Uploading...' : 'Upload Photo'}
            </Button>
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name<span className="text-destructive pl-1">*</span></Label>
                <Input id="name" placeholder="e.g., Jane Doe" value={name} onChange={(e) => setName(e.target.value)} className={cn(errors.name && "border-destructive")} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="current-role">Current Role<span className="text-destructive pl-1">*</span></Label>
                <Input id="current-role" placeholder="e.g., Product Manager" value={currentRole} onChange={(e) => setCurrentRole(e.target.value)} className={cn(errors.currentRole && "border-destructive")}/>
              </div>
            </div>
          </div>

          {profileView === 'seeker' ? (
            <div className="space-y-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label className="flex items-center gap-1.5">
                    Total Calculated Experience
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger type="button"><Info className="h-3 w-3 text-muted-foreground"/></TooltipTrigger>
                        <TooltipContent>
                          <p>This is calculated automatically from your work history below.</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </Label>
                  <div className="flex h-10 w-full items-center rounded-md border border-input bg-muted px-3 py-2 text-sm">
                      {totalExperience > 0 ? `${totalExperience} ${totalExperience === 1 ? 'year' : 'years'}` : 'No experience added'}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="target-role">Target Role</Label>
                  <Input id="target-role" placeholder="e.g., Senior Product Manager" value={targetRole} onChange={(e) => setTargetRole(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="salary">Expected Salary</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      id="salary"
                      type="number"
                      placeholder="e.g., 150000"
                      value={expectedSalary}
                      onChange={(e) => setExpectedSalary(e.target.value)}
                      className="w-full"
                    />
                     <Select value={expectedSalaryCurrency} onValueChange={setExpectedSalaryCurrency}>
                        <SelectTrigger className="w-[120px]">
                            <SelectValue placeholder="Currency" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="USD">USD</SelectItem>
                            <SelectItem value="EUR">EUR</SelectItem>
                            <SelectItem value="GBP">GBP</SelectItem>
                            <SelectItem value="JPY">JPY</SelectItem>
                            <SelectItem value="INR">INR</SelectItem>
                        </SelectContent>
                    </Select>
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
                                    <Popover open={openPopoverId === `exp-from-${exp.id}`} onOpenChange={(open) => setOpenPopoverId(open ? `exp-from-${exp.id}` : null)}>
                                        <PopoverTrigger asChild>
                                            <Button id={`exp-from-${exp.id}`} variant="outline" className={cn("w-full justify-start text-left font-normal", !exp.from && "text-muted-foreground")}>
                                                <CalendarIcon className="mr-2 h-4 w-4" />
                                                {exp.from ? format(exp.from, "MMM yyyy") : <span>Pick a date</span>}
                                            </Button>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-auto p-0">
                                            <Calendar 
                                                mode="single" 
                                                selected={exp.from} 
                                                onSelect={(date) => {
                                                    handleExperienceChange(exp.id, 'from', date);
                                                    setOpenPopoverId(null);
                                                }}
                                                disabled={(date) => date > new Date() || date < new Date("1900-01-01")}
                                                captionLayout="dropdown-buttons"
                                                fromYear={currentYear - 70}
                                                toYear={currentYear}
                                            />
                                        </PopoverContent>
                                    </Popover>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor={`exp-to-${exp.id}`}>To</Label>
                                    <Popover open={openPopoverId === `exp-to-${exp.id}`} onOpenChange={(open) => setOpenPopoverId(open ? `exp-to-${exp.id}` : null)}>
                                        <PopoverTrigger asChild>
                                            <Button id={`exp-to-${exp.id}`} variant="outline" className={cn("w-full justify-start text-left font-normal", !exp.to && "text-muted-foreground")} disabled={exp.currentlyWorking}>
                                                <CalendarIcon className="mr-2 h-4 w-4" />
                                                {exp.currentlyWorking ? 'Present' : exp.to ? format(exp.to, "MMM yyyy") : <span>Pick a date</span>}
                                            </Button>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-auto p-0">
                                            <Calendar 
                                                mode="single" 
                                                selected={exp.to} 
                                                onSelect={(date) => {
                                                    handleExperienceChange(exp.id, 'to', date);
                                                    setOpenPopoverId(null);
                                                }}
                                                disabled={(date) => date > new Date() || date < new Date("1900-01-01")}
                                                captionLayout="dropdown-buttons"
                                                fromYear={currentYear - 70}
                                                toYear={currentYear}
                                            />
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
                                    <Popover open={openPopoverId === `edu-from-${edu.id}`} onOpenChange={(open) => setOpenPopoverId(open ? `edu-from-${edu.id}` : null)}>
                                        <PopoverTrigger asChild>
                                            <Button id={`edu-from-${edu.id}`} variant="outline" className={cn("w-full justify-start text-left font-normal", !edu.from && "text-muted-foreground")}>
                                                <CalendarIcon className="mr-2 h-4 w-4" />
                                                {edu.from ? format(edu.from, "MMM yyyy") : <span>Pick a date</span>}
                                            </Button>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-auto p-0">
                                            <Calendar 
                                                mode="single" 
                                                selected={edu.from} 
                                                onSelect={(date) => {
                                                    handleEducationChange(edu.id, 'from', date);
                                                    setOpenPopoverId(null);
                                                }}
                                                disabled={(date) => date > new Date() || date < new Date("1900-01-01")}
                                                captionLayout="dropdown-buttons"
                                                fromYear={currentYear - 70}
                                                toYear={currentYear}
                                            />
                                        </PopoverContent>
                                    </Popover>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor={`edu-to-${edu.id}`}>To</Label>
                                    <Popover open={openPopoverId === `edu-to-${edu.id}`} onOpenChange={(open) => setOpenPopoverId(open ? `edu-to-${edu.id}` : null)}>
                                        <PopoverTrigger asChild>
                                            <Button id={`edu-to-${edu.id}`} variant="outline" className={cn("w-full justify-start text-left font-normal", !edu.to && "text-muted-foreground")}>
                                                <CalendarIcon className="mr-2 h-4 w-4" />
                                                {edu.to ? format(edu.to, "MMM yyyy") : <span>Pick a date</span>}
                                            </Button>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-auto p-0">
                                            <Calendar 
                                                mode="single" 
                                                selected={edu.to} 
                                                onSelect={(date) => {
                                                    handleEducationChange(edu.id, 'to', date);
                                                    setOpenPopoverId(null);
                                                }}
                                                disabled={(date) => date > new Date() || date < new Date("1900-01-01")}
                                                captionLayout="dropdown-buttons"
                                                fromYear={currentYear - 70}
                                                toYear={currentYear}
                                            />
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

            </div>
          ) : (
            <div className="space-y-6">
                <div className="space-y-2">
                    <Label htmlFor="referrer-company">Your Company<span className="text-destructive pl-1">*</span></Label>
                    <Input
                      id="referrer-company"
                      placeholder="e.g., Google"
                      value={referrerCompany}
                      onChange={(e) => setReferrerCompany(e.target.value)}
                      className={cn(errors.referrerCompany && "border-destructive")}
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
               <Button onClick={handleSave} disabled={isSaving || isUploadingPic || isUploadingResume}>
                {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                {isSaving ? 'Saving...' : 'Save Changes'}
            </Button>
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

    </div>
  );
}
