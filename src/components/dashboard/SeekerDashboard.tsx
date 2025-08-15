

"use client";

import { useState, useMemo, useEffect } from "react";
import { ReferrerCard } from "./ReferrerCard";
import { ReferrerFilters } from "./ReferrerFilters";
import type { Referrer } from "@/lib/types";
import { Skeleton } from "@/components/ui/skeleton";
import { auth, db, firebaseReady } from "@/lib/firebase";
import { collection, query, getDocs } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";
import type { User } from "firebase/auth";

function ReferrerGridSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {[...Array(8)].map((_, i) => (
        <Skeleton key={i} className="h-[350px] w-full" />
      ))}
    </div>
  );
}

const normalizeCompanyName = (name: string): string => {
  if (!name) return "";
  let lowerName = name.toLowerCase().trim();
  
  // Remove common suffixes
  const suffixes = [
    ', inc.', ', inc', ' inc.', ' inc',
    ', llc', ' llc',
    ', ltd.', ', ltd', ' limited',
    ' private limited', ' pvt ltd',
    ' technologies', ' tech',
    ' solutions', ' services'
  ];
  suffixes.forEach(suffix => {
    if (lowerName.endsWith(suffix)) {
      lowerName = lowerName.slice(0, -suffix.length);
    }
  });

  const commonNames: { [key: string]: string[] } = {
    'Deloitte': ['deloitte'],
    'EY': ['ey', 'ernst & young'],
    'PwC': ['pwc', 'pricewaterhousecoopers'],
    'KPMG': ['kpmg'],
    'Google': ['google', 'alphabet'],
    'Amazon': ['amazon', 'aws'],
    'Microsoft': ['microsoft'],
    'Meta': ['meta', 'facebook'],
    'Hindustan Unilever': ['hindustan unilever'],
    'ICICI Bank': ['icici bank', 'icici securities'],
    'Infosys': ['infosys'],
    'ITC': ['itc'],
    'HCL Tech': ['hcl'],
  };

  for (const standardName in commonNames) {
    if (commonNames[standardName].some(variant => lowerName.includes(variant))) {
      return standardName;
    }
  }
  
  // Return original name (title-cased) if no match
  return name.split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()).join(' ');
};


export function SeekerDashboard() {
  const [allReferrers, setAllReferrers] = useState<Referrer[]>([]);
  const [filteredReferrers, setFilteredReferrers] = useState<Referrer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  
  const [search, setSearch] = useState("");
  const [company, setCompany] = useState("");

  useEffect(() => {
    if (!firebaseReady) return;
    const unsubscribe = auth.onAuthStateChanged((user) => {
        setCurrentUser(user);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    async function fetchData() {
      if (!firebaseReady || !currentUser) {
          setIsLoading(false);
          return;
      }
      setIsLoading(true);
      try {
        const profilesRef = collection(db, "profiles");
        const q = query(profilesRef);
        const querySnapshot = await getDocs(q);

        const fetchedReferrers = querySnapshot.docs
            .filter(doc => doc.id !== currentUser.uid)
            .map(doc => {
                const data = doc.data();
                return {
                    id: doc.id,
                    name: data.name || "Unnamed Referrer",
                    avatar: data.profilePic || "https://placehold.co/100x100.png",
                    role: data.currentRole || "N/A",
                    company: data.referrerCompany || "N/A",
                    location: data.location || "Remote",
                    specialties: data.referrerSpecialties?.split(',').map((s: string) => s.trim()).filter(Boolean) || [],
                    bio: data.referrerAbout || "",
                } as Referrer;
            });
        
        setAllReferrers(fetchedReferrers);
        setFilteredReferrers(fetchedReferrers);
      } catch (error) {
        console.error("Failed to fetch referrers:", error);
        toast({
            title: "Error",
            description: "Could not fetch referrer data. Please check your Firestore connection and rules.",
            variant: "destructive"
        })
      } finally {
        setIsLoading(false);
      }
    }
    fetchData();
  }, [currentUser, toast]);

  const availableCompanies = useMemo(() => {
    const normalizedCompanyNames = allReferrers.map(r => normalizeCompanyName(r.company)).filter(Boolean);
    const uniqueCompanies = new Set(normalizedCompanyNames);
    return Array.from(uniqueCompanies).sort();
  }, [allReferrers]);

  const isFiltered = useMemo(() => {
    return search !== "" || company !== "";
  }, [search, company]);

  const handleApplyFilters = () => {
    let referrers = [...allReferrers];

    if (search) {
      const lowercasedSearch = search.toLowerCase();
      referrers = referrers.filter(r => 
        r.name.toLowerCase().includes(lowercasedSearch) ||
        r.role.toLowerCase().includes(lowercasedSearch)
      );
    }

    if (company) {
      referrers = referrers.filter(r => normalizeCompanyName(r.company) === company);
    }
    
    setFilteredReferrers(referrers);
  };

  const handleClearFilters = () => {
    setSearch("");
    setCompany("");
    setFilteredReferrers(allReferrers);
  };

  return (
    <div className="space-y-6">
      <ReferrerFilters 
        search={search}
        setSearch={setSearch}
        company={company}
        setCompany={setCompany}
        availableCompanies={availableCompanies}
        onApplyFilters={handleApplyFilters}
        onClearFilters={handleClearFilters}
        isFiltered={isFiltered}
      />
      {isLoading ? (
        <ReferrerGridSkeleton />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredReferrers.length > 0 ? (
              filteredReferrers.map(referrer => (
                <ReferrerCard key={referrer.id} referrer={referrer} />
              ))
          ) : (
              <div className="col-span-full text-center text-muted-foreground py-10">
                  No referrers match your criteria.
              </div>
          )}
        </div>
      )}
    </div>
  );
}
