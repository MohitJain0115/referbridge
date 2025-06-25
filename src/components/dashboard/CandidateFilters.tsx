import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, SlidersHorizontal } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";


export function CandidateFilters() {
    return (
        <div className="p-4 bg-card rounded-lg shadow-sm border">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
                <div className="space-y-2">
                    <label htmlFor="search" className="text-sm font-medium">Search by keyword</label>
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input id="search" placeholder="React, Python, Figma..." className="pl-10" />
                    </div>
                </div>
                <div className="space-y-2">
                    <label htmlFor="company" className="text-sm font-medium">Company</label>
                     <Select>
                        <SelectTrigger id="company">
                            <SelectValue placeholder="All Companies" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="techcorp">TechCorp</SelectItem>
                            <SelectItem value="innovatex">InnovateX</SelectItem>
                            <SelectItem value="creative-solutions">Creative Solutions</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                 <div className="space-y-2">
                    <label htmlFor="role" className="text-sm font-medium">Role</label>
                     <Select>
                        <SelectTrigger id="role">
                            <SelectValue placeholder="All Roles" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="frontend">Frontend Developer</SelectItem>
                            <SelectItem value="product-manager">Product Manager</SelectItem>
                            <SelectItem value="designer">UX/UI Designer</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                <Button>
                    <SlidersHorizontal className="mr-2 h-4 w-4" />
                    Apply Filters
                </Button>
            </div>
        </div>
    )
}
