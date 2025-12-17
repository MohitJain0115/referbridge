"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Eye, FileText, RefreshCw, ArrowRight } from "lucide-react";

export function OverviewTab() {
  return (
    <div className="space-y-8 max-w-5xl mx-auto">

      {/* 1. Primary Status Section */}
      <section className="bg-white rounded-2xl border border-slate-100 p-8 shadow-sm text-center md:text-left flex flex-col md:flex-row items-center gap-8">
        <div className="relative">
          <div className="w-32 h-32 rounded-full border-4 border-emerald-50 flex items-center justify-center bg-white shadow-inner">
            <span className="text-4xl font-light text-slate-900">85</span>
          </div>
          <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-white px-2">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-widest">Score</span>
          </div>
        </div>

        <div className="space-y-2 max-w-lg">
          <div className="flex items-center justify-center md:justify-start gap-3">
            <Badge variant="secondary" className="bg-emerald-50 text-emerald-700 hover:bg-emerald-100 font-normal px-3 py-1">
              High – Referral Ready
            </Badge>
          </div>
          <h2 className="text-2xl font-medium text-slate-800">
            You are positioned for visibility.
          </h2>
          <p className="text-slate-500 leading-relaxed">
            Profiles with scores above 80 are reviewed more frequently by employees. Your profile is active and in rotation.
          </p>
        </div>
      </section>

      {/* 2. Live Activity Signals (Ambient) */}
      <section className="bg-slate-50/50 rounded-xl p-6 border border-slate-100/50">
        <div className="flex items-center gap-2 mb-4">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
          </span>
          <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Live Activity Signals</h3>
        </div>
        <div className="grid md:grid-cols-3 gap-4">
          <div className="flex items-start gap-3 p-3 bg-white rounded-lg border border-slate-100 shadow-sm">
            <div className="mt-1 p-1.5 bg-blue-50 text-blue-600 rounded-full">
              <Eye className="w-3 h-3" />
            </div>
            <p className="text-sm text-slate-600">
              Verified employees reviewed <span className="font-medium text-slate-800">Backend</span> profiles this week.
            </p>
          </div>
          <div className="flex items-start gap-3 p-3 bg-white rounded-lg border border-slate-100 shadow-sm">
            <div className="mt-1 p-1.5 bg-amber-50 text-amber-600 rounded-full">
              <Sparkles className="w-3 h-3" />
            </div>
            <p className="text-sm text-slate-600">
              Warm intros were initiated recently for <span className="font-medium text-slate-800">Senior</span> roles.
            </p>
          </div>
          <div className="flex items-start gap-3 p-3 bg-white rounded-lg border border-slate-100 shadow-sm">
            <div className="mt-1 p-1.5 bg-emerald-50 text-emerald-600 rounded-full">
              <RefreshCw className="w-3 h-3" />
            </div>
            <p className="text-sm text-slate-600">
              High-quality profiles are currently being evaluated in your region.
            </p>
          </div>
        </div>
      </section>

      {/* 3. Your Momentum Summary & 4. Gentle Guidance */}
      <div className="grid md:grid-cols-3 gap-8">
        {/* Momentum Summary */}
        <section className="md:col-span-2 space-y-4">
          <h3 className="text-lg font-medium text-slate-800">Your Momentum Summary</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <Card className="border-none shadow-sm ring-1 ring-slate-100 bg-white">
              <CardContent className="p-5 space-y-1">
                <p className="text-3xl font-light text-slate-900">124</p>
                <p className="text-xs text-slate-500 font-medium uppercase tracking-wide">Profile Views</p>
              </CardContent>
            </Card>
            <Card className="border-none shadow-sm ring-1 ring-slate-100 bg-white">
              <CardContent className="p-5 space-y-1">
                <p className="text-3xl font-light text-slate-900">18</p>
                <p className="text-xs text-slate-500 font-medium uppercase tracking-wide">Shortlisted</p>
              </CardContent>
            </Card>
            <Card className="col-span-2 md:col-span-1 border-none shadow-sm ring-1 ring-slate-100 bg-white">
              <CardContent className="p-5 space-y-1">
                <p className="text-3xl font-light text-slate-900">72h</p>
                <p className="text-xs text-slate-500 font-medium uppercase tracking-wide">Review Cycle</p>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Gentle Guidance */}
        <section className="space-y-4">
          <h3 className="text-lg font-medium text-slate-800">What improves visibility</h3>
          <div className="bg-slate-50 rounded-xl p-5 border border-slate-100 space-y-4">
            <div className="space-y-1">
              <p className="text-sm font-medium text-slate-800">Add project proof</p>
              <p className="text-xs text-slate-500">Linking a repository can strengthen your system design score.</p>
            </div>
            <div className="w-full h-px bg-slate-200"></div>
            <div className="space-y-1">
              <p className="text-sm font-medium text-slate-800">Refine role alignment</p>
              <p className="text-xs text-slate-500">Updating keywords may improve matching for specific roles.</p>
            </div>
            <button className="text-xs font-semibold text-blue-600 flex items-center hover:underline mt-2">
              View Suggestions <ArrowRight className="w-3 h-3 ml-1" />
            </button>
          </div>
        </section>
      </div>

    </div>
  );
}
