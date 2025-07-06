"use client";

import { useState, useMemo, useEffect } from "react";
import { ReferrerCard } from "./ReferrerCard";
import { ReferrerFilters } from "./ReferrerFilters";
import type { Referrer } from "@/lib/types";
import { Skeleton } from "@/components/ui/skeleton";
import { auth, db, firebaseReady } from "@/lib/firebase";
import { collection, query, where, getDocs } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";
import type { User } from "firebase/auth";

function ReferrerGridSkeleton() {
  return (
    <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {[...Array(8)].map((_, i) => (
        <Skeleton key={i} className="h-[350px] w-full" />
      ))}
    </div>
  );
}

export function SeekerDashboard() {
  const [allReferrers, setAllReferrers] = useState<Referrer[]>([]);
  const [filteredReferrers, setFilteredReferrers] = useState<Referrer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  
  const [search, setSearch] = useState("");
  const [company, setCompany] = useState("all");
  const [field, setField] = useState("all");

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
        // We look for profiles where referrerCompany is explicitly set and not empty.
        const q = query(profilesRef, where("referrerCompany", "!=", ""));
        const querySnapshot = await getDocs(q);

        const fetchedReferrers = querySnapshot.docs
            .filter(doc => doc.id !== currentUser.uid) // Filter out the current user
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
                    connections: Math.floor(Math.random() * 451) + 50, // Placeholder
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
    const companies = new Set(allReferrers.map(r => r.company));
    return Array.from(companies).sort();
  }, [allReferrers]);

  const isFiltered = useMemo(() => {
    return search !== "" || company !== "all" || field !== "all";
  }, [search, company, field]);

  const handleApplyFilters = () => {
    let referrers = [...allReferrers];

    if (search) {
      const lowercasedSearch = search.toLowerCase();
      referrers = referrers.filter(r => 
        r.name.toLowerCase().includes(lowercasedSearch) ||
        r.role.toLowerCase().includes(lowercasedSearch)
      );
    }

    if (company !== "all") {
      referrers = referrers.filter(r => r.company === company);
    }

    if (field !== "all") {
       const fieldKeywords: Record<string, string[]> = {
          'engineering': ['engineer', 'developer'],
          'product': ['product'],
          'design': ['design'],
          'data': ['data', 'scientist'],
          'marketing': ['marketing'],
      };
      if (fieldKeywords[field]) {
        referrers = referrers.filter(r => 
            fieldKeywords[field].some(keyword => r.role.toLowerCase().includes(keyword))
        );
      }
    }
    
    setFilteredReferrers(referrers);
  };

  const handleClearFilters = () => {
    setSearch("");
    setCompany("all");
    setField("all");
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
        field={field}
        setField={setField}
        onApplyFilters={handleApplyFilters}
        onClearFilters={handleClearFilters}
        isFiltered={isFiltered}
      />
      {isLoading ? (
        <ReferrerGridSkeleton />
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
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
