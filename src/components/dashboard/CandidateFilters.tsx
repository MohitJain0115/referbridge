"use client";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, SlidersHorizontal } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { mockCandidates } from "@/lib/data";

const uniqueCompanies = [...new Set(mockCandidates.map(c => c.company))];

type CandidateFiltersProps = {
    search: string;
    setSearch: (value: string) => void;
    company: string;
    setCompany: (value: string) => void;
    role: string;
    setRole: (value: string) => void;
    onApplyFilters: () => void;
}

export function CandidateFilters({
    search, setSearch, company, setCompany, role, setRole, onApplyFilters
}: CandidateFiltersProps) {
    return (
        <div className="p-4 bg-card rounded-lg shadow-sm border">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
                <div className="space-y-2">
                    <label htmlFor="search" className="text-sm font-medium">Search by keyword</label>
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input 
                            id="search" 
                            placeholder="React, Python, Figma..." 
                            className="pl-10" 
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                </div>
                <div className="space-y-2">
                    <label htmlFor="company" className="text-sm font-medium">Company</label>
                     <Select value={company} onValueChange={setCompany}>
                        <SelectTrigger id="company">
                            <SelectValue placeholder="All Companies" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Companies</SelectItem>
                            {uniqueCompanies.map(c => (
                                <SelectItem key={c} value={c}>{c}</SelectItem>
                            ))}
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
                <Button onClick={onApplyFilters}>
                    <SlidersHorizontal className="mr-2 h-4 w-4" />
                    Apply Filters
                </Button>
            </div>
        </div>
    )
}
