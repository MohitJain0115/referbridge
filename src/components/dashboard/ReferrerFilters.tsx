import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, SlidersHorizontal } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";


export function ReferrerFilters() {
    return (
        <div className="p-4 bg-card rounded-lg shadow-sm border">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
                <div className="space-y-2">
                    <label htmlFor="search" className="text-sm font-medium">Search by name or role</label>
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input id="search" placeholder="John Doe, Engineer..." className="pl-10" />
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
                            <SelectItem value="datadriven-inc">DataDriven Inc.</SelectItem>
                            <SelectItem value="cloudworks">CloudWorks</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                 <div className="space-y-2">
                    <label htmlFor="role" className="text-sm font-medium">Industry / Field</label>
                     <Select>
                        <SelectTrigger id="role">
                            <SelectValue placeholder="All Fields" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="engineering">Engineering</SelectItem>
                            <SelectItem value="product">Product</SelectItem>
                            <SelectItem value="design">Design</SelectItem>
                             <SelectItem value="data">Data Science</SelectItem>
                             <SelectItem value="marketing">Marketing</SelectItem>
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
