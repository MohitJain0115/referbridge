
"use client";

import * as React from "react"
import { Button } from "@/components/ui/button";
import { SlidersHorizontal, X, Check, ChevronsUpDown } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import type { Candidate } from "@/lib/types";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";


type Status = Candidate['status'] | 'all';

type CandidateFiltersProps = {
    company: string;
    setCompany: (value: string) => void;
    availableCompanies: string[];
    experience: string;
    setExperience: (value: string) => void;
    role: string;
    setRole: (value: string) => void;
    status: Status;
    setStatus: (value: Status) => void;
    onApplyFilters: () => void;
    onClearFilters: () => void;
    isFiltered: boolean;
}

export function CandidateFilters({
    company, setCompany, availableCompanies, experience, setExperience, role, setRole, status, setStatus, onApplyFilters, onClearFilters, isFiltered
}: CandidateFiltersProps) {
    const [open, setOpen] = React.useState(false)
    const companyOptions = availableCompanies.map(c => ({ value: c, label: c }));

    return (
        <div className="p-4 bg-card rounded-lg shadow-sm border">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 items-end">
                <div className="space-y-2">
                    <label htmlFor="company" className="text-sm font-medium">Target Company</label>
                     <Popover open={open} onOpenChange={setOpen}>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          role="combobox"
                          aria-expanded={open}
                          className="w-full justify-between font-normal"
                        >
                          {company
                            ? companyOptions.find((c) => c.value.toLowerCase() === company.toLowerCase())?.label
                            : "Select company..."}
                          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                        <Command>
                          <CommandInput placeholder="Search company..." />
                          <CommandList>
                            <CommandEmpty>No company found.</CommandEmpty>
                            <CommandGroup>
                              {companyOptions.map((c) => (
                                <CommandItem
                                  key={c.value}
                                  value={c.value}
                                  onSelect={(currentValue) => {
                                    setCompany(currentValue.toLowerCase() === company.toLowerCase() ? "" : c.value)
                                    setOpen(false)
                                  }}
                                >
                                  <Check
                                    className={cn(
                                      "mr-2 h-4 w-4",
                                      company.toLowerCase() === c.value.toLowerCase() ? "opacity-100" : "opacity-0"
                                    )}
                                  />
                                  {c.label}
                                </CommandItem>
                              ))}
                            </CommandGroup>
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>
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
                    <Input 
                        id="role"
                        placeholder="e.g. Software Engineer"
                        value={role}
                        onChange={(e) => setRole(e.target.value)}
                    />
                </div>
                <div className="space-y-2">
                    <label htmlFor="status" className="text-sm font-medium">Status</label>
                    <Select value={status} onValueChange={value => setStatus(value as Status)}>
                        <SelectTrigger id="status">
                            <SelectValue placeholder="All" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All</SelectItem>
                            <SelectItem value="Pending">Pending</SelectItem>
                            <SelectItem value="Viewed">Viewed</SelectItem>
                            <SelectItem value="Referred">Referred</SelectItem>
                            <SelectItem value="Not a Fit">Not a Fit</SelectItem>
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
