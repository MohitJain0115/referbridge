"use client";

import { useState, useMemo, useEffect } from "react";
import { CandidateCard } from "./CandidateCard";
import { CandidateFilters } from "./CandidateFilters";
import type { Candidate } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Download } from "lucide-react";

type CandidateGridProps = {
    candidates: Candidate[];
};

export function CandidateGrid({ candidates: initialCandidates }: CandidateGridProps) {
  const [filteredCandidates, setFilteredCandidates] = useState<Candidate[]>(initialCandidates);
  const [company, setCompany] = useState("all");
  const [experience, setExperience] = useState("all");
  const [role, setRole] = useState("all");
  const [selectedCandidates, setSelectedCandidates] = useState<string[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    // Reset filters and candidates when the initial list changes
    setFilteredCandidates(initialCandidates);
    setCompany("all");
    setExperience("all");
    setRole("all");
    setSelectedCandidates([]);
  }, [initialCandidates]);

  const availableCompanies = useMemo(() => {
    const companies = new Set(initialCandidates.flatMap(c => c.targetCompanies));
    return Array.from(companies).sort();
  }, [initialCandidates]);

  const isFiltered = useMemo(() => {
    return company !== "all" || experience !== "all" || role !== "all";
  }, [company, experience, role]);

  const handleApplyFilters = () => {
    let candidates = [...initialCandidates];

    if (company !== "all") {
      candidates = candidates.filter(c => c.targetCompanies.includes(company));
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

    if (role !== "all") {
      const roleKeywords: Record<string, string[]> = {
          'frontend': ['frontend'],
          'product-manager': ['product manager'],
          'designer': ['designer']
      };
      if (roleKeywords[role]) {
        candidates = candidates.filter(c => 
            roleKeywords[role].some(keyword => c.role.toLowerCase().includes(keyword))
        );
      }
    }
    
    setFilteredCandidates(candidates);
    setSelectedCandidates([]); // Clear selection on new filter
  };

  const handleClearFilters = () => {
    setCompany("all");
    setExperience("all");
    setRole("all");
    setFilteredCandidates(initialCandidates);
    setSelectedCandidates([]); // Clear selection on clear filters
  };

  const toggleCandidateSelection = (candidateId: string) => {
    setSelectedCandidates(prev => 
      prev.includes(candidateId) 
        ? prev.filter(id => id !== candidateId)
        : [...prev, candidateId]
    );
  };

  const handleBulkDownload = () => {
    if (selectedCandidates.length === 0) return;
    toast({
        title: "Download Started",
        description: `Preparing resumes for ${selectedCandidates.length} candidate(s).`
    });
    // In a real app, you'd trigger a zip download here.
    // For now, just clear selection
    setTimeout(() => {
        setSelectedCandidates([]);
    }, 300);
  };

  return (
    <>
      <CandidateFilters 
        company={company}
        setCompany={setCompany}
        availableCompanies={availableCompanies}
        experience={experience}
        setExperience={setExperience}
        role={role}
        setRole={setRole}
        onApplyFilters={handleApplyFilters}
        onClearFilters={handleClearFilters}
        isFiltered={isFiltered}
      />
      
      <div className="flex items-center justify-start min-h-[40px] -mb-2">
        {selectedCandidates.length > 0 && (
          <div className="flex items-center gap-4 p-2 rounded-lg bg-muted">
            <span className="text-sm text-muted-foreground font-medium pl-2">
              {selectedCandidates.length} candidate(s) selected
            </span>
            <Button 
              onClick={handleBulkDownload} 
              size="sm"
            >
              <Download className="mr-2 h-4 w-4" />
              Download Resumes
            </Button>
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

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filteredCandidates.length > 0 ? (
            filteredCandidates.map(candidate => (
              <CandidateCard 
                key={candidate.id} 
                candidate={candidate}
                isSelected={selectedCandidates.includes(candidate.id)}
                onSelect={toggleCandidateSelection}
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
