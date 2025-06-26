"use client";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, SlidersHorizontal, X } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { mockReferrers } from "@/lib/data";

const uniqueCompanies = [...new Set(mockReferrers.map(r => r.company))];

type ReferrerFiltersProps = {
    search: string;
    setSearch: (value: string) => void;
    company: string;
    setCompany: (value: string) => void;
    field: string;
    setField: (value: string) => void;
    onApplyFilters: () => void;
    onClearFilters: () => void;
    isFiltered: boolean;
}

export function ReferrerFilters({
    search, setSearch, company, setCompany, field, setField, onApplyFilters, onClearFilters, isFiltered
}: ReferrerFiltersProps) {
    return (
        <div className="p-4 bg-card rounded-lg shadow-sm border">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
                <div className="space-y-2">
                    <label htmlFor="search" className="text-sm font-medium">Search by name or role</label>
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input 
                            id="search" 
                            placeholder="John Doe, Engineer..." 
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
                    <label htmlFor="field" className="text-sm font-medium">Industry / Field</label>
                     <Select value={field} onValueChange={setField}>
                        <SelectTrigger id="field">
                            <SelectValue placeholder="All Fields" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Fields</SelectItem>
                            <SelectItem value="engineering">Engineering</SelectItem>
                            <SelectItem value="product">Product</SelectItem>
                            <SelectItem value="design">Design</SelectItem>
                             <SelectItem value="data">Data Science</SelectItem>
                             <SelectItem value="marketing">Marketing</SelectItem>
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
