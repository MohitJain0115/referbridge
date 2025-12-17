"use client";

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { OverviewTab } from "./seeker/OverviewTab";
import { OpportunitiesTab } from "./seeker/OpportunitiesTab";
import { VisibilityTab } from "./seeker/VisibilityTab";
import { ImproveScoreTab } from "./seeker/ImproveScoreTab";
import { Info } from "lucide-react";

export function SeekerDashboard() {
  const [activeTab, setActiveTab] = useState("overview");

  return (
    <div className="space-y-6">
      <Tabs defaultValue="overview" value={activeTab} onValueChange={setActiveTab} className="w-full">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <TabsList className="grid w-full md:w-auto grid-cols-4 bg-slate-100 p-1 rounded-lg">
            <TabsTrigger value="overview" className="data-[state=active]:bg-white data-[state=active]:shadow-sm">Overview</TabsTrigger>
            <TabsTrigger value="opportunities" className="data-[state=active]:bg-white data-[state=active]:shadow-sm">Opportunities</TabsTrigger>
            <TabsTrigger value="visibility" className="data-[state=active]:bg-white data-[state=active]:shadow-sm">Visibility</TabsTrigger>
            <TabsTrigger value="improve" className="data-[state=active]:bg-white data-[state=active]:shadow-sm">Improve Score</TabsTrigger>
          </TabsList>

          <div className="hidden md:flex items-center text-xs text-slate-400 bg-slate-50 px-3 py-1.5 rounded-full border border-slate-100">
            <Info className="w-3 h-3 mr-2" />
            ReferBridge enables discovery, not requests. Referrals happen when employees opt in.
          </div>
        </div>

        <TabsContent value="overview" className="mt-0 focus-visible:outline-none">
          <OverviewTab />
        </TabsContent>
        <TabsContent value="opportunities" className="mt-0 focus-visible:outline-none">
          <OpportunitiesTab />
        </TabsContent>
        <TabsContent value="visibility" className="mt-0 focus-visible:outline-none">
          <VisibilityTab />
        </TabsContent>
        <TabsContent value="improve" className="mt-0 focus-visible:outline-none">
          <ImproveScoreTab />
        </TabsContent>

        <div className="md:hidden mt-8 pt-4 border-t border-slate-100">
          <p className="text-xs text-center text-slate-400">
            ReferBridge enables discovery, not requests. Referrals happen when employees opt in.
          </p>
        </div>
      </Tabs>
    </div>
  );
}
