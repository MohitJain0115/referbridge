"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { SlidersHorizontal, X, Check, ChevronsUpDown, XIcon } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import type { Candidate } from "@/lib/types";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";


type Status = Candidate['status'] | 'all';

type RecruitmentFiltersProps = {
  companies: string[];
  setCompanies: (value: string[]) => void;
  availableCompanies: string[];
  skills: string[];
  setSkills: (value: string[]) => void;
  availableSkills: string[];
  experience: string;
  setExperience: (value: string) => void;
  role: string;
  setRole: (value: string) => void;
  status: Status;
  setStatus: (value: Status) => void;
  location: string;
  setLocation: (value: string) => void;
  salaryRange: [number, number];
  setSalaryRange: (value: [number, number]) => void;
  minSalary: number;
  maxSalary: number;
  onApplyFilters: () => void;
  onClearFilters: () => void;
  isFiltered: boolean;
}

export function RecruitmentFilters({
  companies, setCompanies, availableCompanies,
  skills, setSkills, availableSkills,
  experience, setExperience, role, setRole, status, setStatus,
  location, setLocation,
  salaryRange, setSalaryRange, minSalary, maxSalary,
  onApplyFilters, onClearFilters, isFiltered
}: RecruitmentFiltersProps) {
  const [openCompanies, setOpenCompanies] = React.useState(false);
  const [openSkills, setOpenSkills] = React.useState(false);

  const companyOptions = availableCompanies.map(c => ({ value: c, label: c }));
  const skillOptions = availableSkills.map(s => ({ value: s, label: s }));

  const handleMultiSelectToggle = (value: string, list: string[], setList: (v: string[]) => void) => {
    setList(
      list.includes(value)
        ? list.filter((c) => c !== value)
        : [...list, value]
    );
  };

  const handleSalaryChange = (vals: number[]) => {
    const next: [number, number] = [vals[0], vals[1] ?? vals[0]];
    setSalaryRange(next);
  };

  const formatSalary = (n: number) => {
    try {
      return new Intl.NumberFormat(undefined, { maximumFractionDigits: 0 }).format(n);
    } catch {
      return String(n);
    }
  };

  return (
    <div className="p-4 bg-card rounded-lg shadow-sm border space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
        <div className="space-y-2 lg:col-span-1">
          <label htmlFor="company" className="text-sm font-medium">Target Company</label>
          <Popover open={openCompanies} onOpenChange={setOpenCompanies}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                role="combobox"
                aria-expanded={openCompanies}
                className="w-full justify-between font-normal"
              >
                <span className="truncate">
                  {companies.length === 0 && "Select companies..."}
                  {companies.length === 1 && companies[0]}
                  {companies.length > 1 && `${companies.length} companies selected`}
                </span>
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
                        onSelect={() => handleMultiSelectToggle(c.value, companies, setCompanies)}
                      >
                        <Check
                          className={cn(
                            "mr-2 h-4 w-4",
                            companies.includes(c.value) ? "opacity-100" : "opacity-0"
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

        <div className="space-y-2 lg:col-span-1">
          <label htmlFor="skills" className="text-sm font-medium">Skills</label>
          <Popover open={openSkills} onOpenChange={setOpenSkills}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                role="combobox"
                aria-expanded={openSkills}
                className="w-full justify-between font-normal"
              >
                <span className="truncate">
                  {skills.length === 0 && "Select skills..."}
                  {skills.length === 1 && skills[0]}
                  {skills.length > 1 && `${skills.length} skills selected`}
                </span>
                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
              <Command>
                <CommandInput placeholder="Search skill..." />
                <CommandList>
                  <CommandEmpty>No skill found.</CommandEmpty>
                  <CommandGroup>
                    {skillOptions.map((s) => (
                      <CommandItem
                        key={s.value}
                        value={s.value}
                        onSelect={() => handleMultiSelectToggle(s.value, skills, setSkills)}
                      >
                        <Check
                          className={cn(
                            "mr-2 h-4 w-4",
                            skills.includes(s.value) ? "opacity-100" : "opacity-0"
                          )}
                        />
                        {s.label}
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
          <label htmlFor="location" className="text-sm font-medium">Location</label>
          <Input
            id="location"
            placeholder="e.g. Bengaluru or Remote"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
          />
        </div>

        <div className="space-y-2 lg:col-span-1">
          <label className="text-sm font-medium">Salary Range</label>
          <div className="px-2">
            <Slider
              value={[salaryRange[0], salaryRange[1]]}
              min={minSalary}
              max={maxSalary}
              step={1000}
              onValueChange={handleSalaryChange}
            />
            <div className="flex justify-between text-xs text-muted-foreground mt-1">
              <span>{formatSalary(salaryRange[0])}</span>
              <span>{formatSalary(salaryRange[1])}</span>
            </div>
          </div>
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
              <SelectItem value="Referred - Awaiting Confirmation">Referred</SelectItem>
              <SelectItem value="Not a Fit">Not a Fit</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {(companies.length > 0 || skills.length > 0) && (
        <div className="flex flex-wrap gap-2 items-center">
          {companies.length > 0 && (
            <>
              <span className="text-sm font-medium">Companies:</span>
              {companies.map(company => (
                <Badge key={company} variant="secondary" className="pl-2 pr-1">
                  {company}
                  <button
                    onClick={() => handleMultiSelectToggle(company, companies, setCompanies)}
                    className="ml-1 rounded-full outline-none ring-offset-background focus:ring-2 focus:ring-ring focus:ring-offset-2 hover:bg-muted-foreground/20"
                    aria-label={`Remove ${company}`}
                  >
                    <XIcon className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </>
          )}
          {skills.length > 0 && (
            <>
              <span className="text-sm font-medium ml-2">Skills:</span>
              {skills.map(skill => (
                <Badge key={skill} variant="secondary" className="pl-2 pr-1">
                  {skill}
                  <button
                    onClick={() => handleMultiSelectToggle(skill, skills, setSkills)}
                    className="ml-1 rounded-full outline-none ring-offset-background focus:ring-2 focus:ring-ring focus:ring-offset-2 hover:bg-muted-foreground/20"
                    aria-label={`Remove ${skill}`}
                  >
                    <XIcon className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </>
          )}
        </div>
      )}

      <div className="flex items-center justify-end gap-2 pt-2">
        <Button onClick={onApplyFilters}>
          <SlidersHorizontal className="mr-2 h-4 w-4" />
          Apply Filters
        </Button>
        {isFiltered && (
          <Button onClick={onClearFilters} variant="ghost">
            <X className="mr-2 h-4 w-4" />
            Clear
          </Button>
        )}
      </div>
    </div>
  );
}

