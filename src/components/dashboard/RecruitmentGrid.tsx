"use client";

import { useState, useMemo, useEffect } from "react";
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import { CandidateCard } from "./CandidateCard";
import type { Candidate } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Download, Mail, ChevronDown, Loader2 } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { doc, getDoc } from "firebase/firestore";
import { db, firebaseReady, auth } from "@/lib/firebase";
import { Checkbox } from "@/components/ui/checkbox";
import { downloadResumeWithLimit } from "@/actions/resume";
import { RecruitmentFilters } from "./RecruitmentFilters";

const normalizeCompanyName = (name: string): string => {
  if (!name || typeof name !== 'string') return "";
  let lowerName = name.toLowerCase().trim();
  const commonNames: { [key: string]: string[] } = {
    'EY': ['ey', 'ernst & young', 'ernst and young'],
    'Google': ['google', 'alphabet'],
    'Amazon': ['amazon', 'aws'],
    'Microsoft': ['microsoft'],
    'Meta': ['meta', 'facebook'],
    'HCL Tech': ['hcl', 'hcltech'],
    'Deloitte': ['deloitte', 'deloitte consulting'],
    'Accenture': ['accenture'],
    'Deutsche Bank': ['deutsche bank', 'deustche bank', 'detusche bank', 'destuche bank', 'dbs bank', 'dos bank'],
  };
  for (const standardName in commonNames) {
    if (commonNames[standardName].some(variant => lowerName.includes(variant))) {
      return standardName;
    }
  }
  const suffixesToRemove = [
    /\sgroup$/, /\sllc$/, /\sllp$/, /\sinc$/, /\sltd$/, /\spvt\s?ltd$/,
    /,?\sinc\.?$/, /,?\sllc\.?$/, /,?\sltd\.?$/,
    /\scorporation$/, /\sincorporated$/, /\slimited$/, /\sprivate\slimited$/,
    /\stechnologies$/, /\stech$/, /\ssolutions$/, /\sservices$/,
  ];
  suffixesToRemove.forEach(suffixRegex => {
    lowerName = lowerName.replace(suffixRegex, '');
  });
  return lowerName
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};


type RecruitmentGridProps = {
  candidates: Candidate[];
};

export function RecruitmentGrid({ candidates: initialCandidates }: RecruitmentGridProps) {
  const [filteredCandidates, setFilteredCandidates] = useState<Candidate[]>(initialCandidates);
  const [companies, setCompanies] = useState<string[]>([]);
  const [skills, setSkills] = useState<string[]>([]);
  const [experience, setExperience] = useState("all");
  const [role, setRole] = useState("");
  const [status, setStatus] = useState<Candidate['status'] | 'all'>('all');
  const [location, setLocation] = useState("");
  const [salaryRange, setSalaryRange] = useState<[number, number]>([0, 2000000]);
  const [selectedCandidates, setSelectedCandidates] = useState<string[]>([]);
  const [isActionDialogOpen, setIsActionDialogOpen] = useState(false);
  const [isActionLoading, setIsActionLoading] = useState(false);
  const [isEmailing, setIsEmailing] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    setFilteredCandidates(initialCandidates);
    handleClearFilters();
  }, [initialCandidates]);

  const availableCompanies = useMemo(() => {
    const companyNames = new Set(
      initialCandidates
        .flatMap(c => c.targetCompanies)
        .filter(name => typeof name === 'string' && !name.includes(','))
        .map(normalizeCompanyName)
        .filter(Boolean)
    );
    return Array.from(companyNames).sort();
  }, [initialCandidates]);

  const allSkills = useMemo(() => {
    const skillSet = new Set<string>();
    initialCandidates.forEach(c => (c.skills || []).forEach(s => skillSet.add(s)));
    return Array.from(skillSet).sort();
  }, [initialCandidates]);

  const minSalary = 0;
  const maxSalary = useMemo(() => {
    return Math.max(100000, ...initialCandidates.map(c => c.salary || 0));
  }, [initialCandidates]);

  const isFiltered = useMemo(() => {
    return companies.length > 0 || skills.length > 0 || experience !== "all" || role !== "" || status !== "all" || location !== "" || salaryRange[0] > minSalary || salaryRange[1] < maxSalary;
  }, [companies, skills, experience, role, status, location, salaryRange, maxSalary]);

  const handleApplyFilters = () => {
    let candidates = [...initialCandidates];

    if (companies.length > 0) {
      candidates = candidates.filter(c => 
        c.targetCompanies.some(tc => companies.includes(normalizeCompanyName(tc)))
      );
    }

    if (skills.length > 0) {
      candidates = candidates.filter(c => (c.skills || []).some(s => skills.includes(s)));
    }

    if (experience !== "all") {
      switch (experience) {
        case '0-2':
          candidates = candidates.filter(c => c.experience >= 0 && c.experience <= 2);
          break;
        case '3-5':
          candidates = candidates.filter(c => c.experience >= 3 && c.experience <= 5);
          break;
        case '5+':
          candidates = candidates.filter(c => c.experience > 5);
          break;
      }
    }

    if (role) {
      const lowercasedRole = role.toLowerCase();
      candidates = candidates.filter(c =>
        c.currentRole?.toLowerCase().includes(lowercasedRole) || 
        (c.targetRole && c.targetRole.toLowerCase().includes(lowercasedRole))
      );
    }

    if (location) {
      const lowerLoc = location.toLowerCase();
      candidates = candidates.filter(c => (c.location || '').toLowerCase().includes(lowerLoc));
    }

    if (status !== "all") {
      candidates = candidates.filter(c => c.status === status);
    }

    if (salaryRange) {
      candidates = candidates.filter(c => (c.salary || 0) >= salaryRange[0] && (c.salary || 0) <= salaryRange[1]);
    }
    
    setFilteredCandidates(candidates);
    setSelectedCandidates([]);
  };

  const handleClearFilters = () => {
    setCompanies([]);
    setSkills([]);
    setExperience("all");
    setRole("");
    setStatus("all");
    setLocation("");
    setSalaryRange([minSalary, maxSalary]);
    setFilteredCandidates(initialCandidates);
    setSelectedCandidates([]);
  };

  const toggleCandidateSelection = (candidateId: string) => {
    setSelectedCandidates(prev => 
      prev.includes(candidateId) 
        ? prev.filter(id => id !== candidateId)
        : [...prev, candidateId]
    );
  };

  const handleBulkDownload = async () => {
    if (selectedCandidates.length === 0 || !auth.currentUser) return;
    setIsActionLoading(true);

    const zip = new JSZip();
    let downloadedCount = 0;
    
    toast({
      title: "Preparing Download",
      description: `Fetching ${selectedCandidates.length} resumes. This may take a moment...`
    });

    for (const candidateId of selectedCandidates) {
      try {
        const result = await downloadResumeWithLimit({
          candidateId,
          downloaderId: auth.currentUser.uid,
          source: 'recruitment',
        });
        
        if (result.success && result.url) {
          const response = await fetch(result.url, { mode: 'cors' });
          if (!response.ok) throw new Error(`Fetch failed for ${result.fileName}`);
          const blob = await response.blob();
          const candidate = initialCandidates.find(c => c.id === candidateId);
          const sanitizedName = candidate?.name.replace(/[^a-z0-9]/gi, '_') || 'candidate';
          zip.file(`${sanitizedName}_${result.fileName}`, blob);
          downloadedCount++;
        } else {
          toast({ title: "Download Skipped", description: result.message, variant: "destructive" });
        }
      } catch (error) {
        console.error(`Error processing resume for ${candidateId}:`, error);
        toast({ title: "Download Error", description: `Could not fetch resume for a candidate.`, variant: "destructive" });
      }
    }

    if (downloadedCount === 0) {
      toast({ title: "No Resumes Downloaded", description: "Could not download any of the selected resumes.", variant: "destructive" });
    } else if (downloadedCount === 1) {
      const zipEntries = Object.values(zip.files);
      const fileData = await zipEntries[0].async("blob");
      saveAs(fileData, zipEntries[0].name);
      toast({ title: "Download Ready", description: "Your file is downloading." });
    } else {
      const zipBlob = await zip.generateAsync({ type: "blob" });
      saveAs(zipBlob, "ReferBridge_Resumes.zip");
      toast({ title: "Download Ready", description: `Your zip file with ${downloadedCount} resumes is downloading.` });
    }

    setIsActionLoading(false);
    setIsActionDialogOpen(false);
    setSelectedCandidates([]);
  };

  const handleBulkEmail = () => {
    if (selectedCandidates.length === 0 || !auth.currentUser?.email) {
      toast({ title: "Error", description: "Could not find your email address or no candidates selected.", variant: "destructive" });
      return;
    }
    
    const candidatesWithLinks = selectedCandidates
      .map(id => initialCandidates.find(c => c.id === id))
      .filter(Boolean) as Candidate[];
    
    const body = `Hi,\n\nPlease find the profiles for the ${candidatesWithLinks.length} candidate(s) you selected:\n\n${candidatesWithLinks.map(c => `${c.name}: ${window.location.origin}/profile/${c.id}`).join('\n')}\n\nSent from ReferBridge.`;
    const mailtoLink = `mailto:${auth.currentUser.email}?subject=${encodeURIComponent(`Profiles for ${candidatesWithLinks.length} candidate(s)`)}&body=${encodeURIComponent(body)}`;
    window.location.href = mailtoLink;

    setIsActionDialogOpen(false);
    setSelectedCandidates([]);
  };

  const allVisibleCandidates = filteredCandidates; // no per-page selection limit
  const allVisibleIds = allVisibleCandidates.map(c => c.id);
  const selectedVisibleCount = selectedCandidates.filter(id => allVisibleIds.includes(id)).length;

  const selectAllCheckedState =
    allVisibleIds.length > 0 && selectedVisibleCount === allVisibleIds.length
      ? true
      : selectedVisibleCount > 0
      ? 'indeterminate'
      : false;

  return (
    <>
      <RecruitmentFilters
        companies={companies}
        setCompanies={setCompanies}
        availableCompanies={availableCompanies}
        skills={skills}
        setSkills={setSkills}
        availableSkills={allSkills}
        experience={experience}
        setExperience={setExperience}
        role={role}
        setRole={setRole}
        status={status}
        setStatus={setStatus}
        location={location}
        setLocation={setLocation}
        salaryRange={salaryRange}
        setSalaryRange={setSalaryRange}
        minSalary={minSalary}
        maxSalary={maxSalary}
        onApplyFilters={handleApplyFilters}
        onClearFilters={handleClearFilters}
        isFiltered={isFiltered}
      />

      <div className="flex items-center justify-between min-h-[40px] -mb-2">
        <div className="flex items-center gap-2">
          {filteredCandidates.length > 0 && (
            <>
              <Checkbox
                id="select-all"
                onCheckedChange={() => {
                  if (selectAllCheckedState === true) {
                    setSelectedCandidates([]);
                  } else {
                    setSelectedCandidates(allVisibleIds);
                  }
                }}
                checked={selectAllCheckedState}
                aria-label="Select all candidates"
              />
              <Label htmlFor="select-all" className="text-sm font-medium cursor-pointer">
                Select All ({filteredCandidates.length})
              </Label>
            </>
          )}
        </div>

        {selectedCandidates.length > 0 && (
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground font-medium pl-2">
              {selectedCandidates.length} candidate(s) selected
            </span>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button size="sm">
                  Actions
                  <ChevronDown className="ml-2 h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onSelect={() => setIsActionDialogOpen(true)}>
                  <Download className="mr-2 h-4 w-4" />
                  Download/Share Resume
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => setSelectedCandidates([])}
            >
              Clear selection
            </Button>
          </div>
        )}
      </div>

      <Dialog open={isActionDialogOpen} onOpenChange={setIsActionDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Resume Actions</DialogTitle>
            <DialogDescription>
              You have selected {selectedCandidates.length} candidate(s). Choose how you would like to handle their resumes. No download limits apply in Recruitment Specialist.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col sm:flex-row justify-center gap-4 pt-4">
            <Button variant="outline" onClick={handleBulkDownload} className="flex-1" disabled={isActionLoading || isEmailing}>
              {isActionLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
              Download to Device
            </Button>
            <Button onClick={handleBulkEmail} className="flex-1" disabled={isActionLoading || isEmailing}>
              {isEmailing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Mail className="mr-2 h-4 w-4" />}
              Email Links to Myself
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filteredCandidates.length > 0 ? (
          filteredCandidates.map(candidate => (
            <CandidateCard 
              key={candidate.id} 
              candidate={candidate}
              isSelected={selectedCandidates.includes(candidate.id)}
              onSelect={toggleCandidateSelection}
              downloadSource="recruitment"
            />
          ))
        ) : (
          <div className="col-span-full text-center text-muted-foreground py-10">
            No candidates match your criteria.
          </div>
        )}
      </div>
    </>
  );
}

