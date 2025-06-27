"use client";

import { Button } from "@/components/ui/button";
import { SlidersHorizontal, X } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type CandidateFiltersProps = {
    company: string;
    setCompany: (value: string) => void;
    availableCompanies: string[];
    experience: string;
    setExperience: (value: string) => void;
    role: string;
    setRole: (value: string) => void;
    onApplyFilters: () => void;
    onClearFilters: () => void;
    isFiltered: boolean;
}

export function CandidateFilters({
    company, setCompany, availableCompanies, experience, setExperience, role, setRole, onApplyFilters, onClearFilters, isFiltered
}: CandidateFiltersProps) {
    return (
        <div className="p-4 bg-card rounded-lg shadow-sm border">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
                <div className="space-y-2">
                    <label htmlFor="company" className="text-sm font-medium">Target Company</label>
                    <Select value={company} onValueChange={setCompany}>
                        <SelectTrigger id="company">
                            <SelectValue placeholder="All Companies" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Companies</SelectItem>
                            {availableCompanies.map(c => (
                                <SelectItem key={c} value={c}>{c}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
                <div className="space-y-2">
                    <label htmlFor="experience" className="text-sm font-medium">Experience Level</label>
                     <Select value={experience} onValueChange={setExperience}>
                        <SelectTrigger id="experience">
                            <SelectValue placeholder="All Levels" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Levels</SelectItem>
                            <SelectItem value="0-2">0-2 Years</SelectItem>
                            <SelectItem value="3-5">3-5 Years</SelectItem>
                            <SelectItem value="5+">5+ Years</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                 <div className="space-y-2">
                    <label htmlFor="role" className="text-sm font-medium">Role</label>
                     <Select value={role} onValueChange={setRole}>
                        <SelectTrigger id="role">
                            <SelectValue placeholder="All Roles" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Roles</SelectItem>
                            <SelectItem value="frontend">Frontend Developer</SelectItem>
                            <SelectItem value="product-manager">Product Manager</SelectItem>
                            <SelectItem value="designer">UX/UI Designer</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                <div className="flex items-center gap-2">
                    <Button onClick={onApplyFilters} className="flex-1">
                        <SlidersHorizontal className="mr-2 h-4 w-4" />
                        Apply Filters
                    </Button>
                     {isFiltered && (
                        <Button onClick={onClearFilters} variant="ghost" size="icon" aria-label="Clear filters">
                            <X className="h-4 w-4" />
                        </Button>
                    )}
                </div>
            </div>
        </div>
    )
}
