"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Eye, RefreshCw, ArrowRight, ChevronRight, Activity, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState, useEffect } from "react";

export function OverviewTab() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const score = 85;
  const radius = 50;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  return (
    <div className="space-y-8 max-w-5xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-700">

      {/* 1. Primary Status Section */}
      <section className="bg-white/50 backdrop-blur-sm rounded-3xl border border-slate-200/60 p-8 shadow-xl shadow-slate-200/40 text-center md:text-left flex flex-col md:flex-row items-center gap-10 overflow-hidden relative group">
        <div className="absolute inset-0 bg-gradient-to-r from-emerald-50/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />

        <div className="relative z-10">
          <div className="relative w-40 h-40 flex items-center justify-center">
            {/* Animated SVG Circle */}
            <svg className="transform -rotate-90 w-full h-full drop-shadow-lg" viewBox="0 0 120 120">
              <circle
                cx="60"
                cy="60"
                r={radius}
                stroke="currentColor"
                strokeWidth="8"
                fill="transparent"
                className="text-slate-100"
              />
              <circle
                cx="60"
                cy="60"
                r={radius}
                stroke="currentColor"
                strokeWidth="8"
                fill="transparent"
                strokeDasharray={circumference}
                strokeDashoffset={mounted ? strokeDashoffset : circumference}
                strokeLinecap="round"
                className="text-emerald-500 transition-all duration-1000 ease-out"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-5xl font-bold text-slate-800 tracking-tight">{score}</span>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Score</span>
            </div>
          </div>
        </div>

        <div className="space-y-4 max-w-lg z-10">
          <div className="flex items-center justify-center md:justify-start gap-3">
            <Badge variant="secondary" className="bg-emerald-100/80 text-emerald-800 px-4 py-1.5 hover:bg-emerald-200 transition-colors cursor-default border-emerald-200">
              High – Referral Ready
            </Badge>
          </div>
          <h2 className="text-3xl font-bold text-slate-800 tracking-tight">
            You are positioned for visibility.
          </h2>
          <p className="text-slate-600 leading-relaxed text-lg">
            Profiles with scores above <span className="font-semibold text-slate-800">80</span> are reviewed more frequently. Your profile is active and in high-rotation.
          </p>
        </div>
      </section>

      {/* 2. Live Activity Signals (Ambient) */}
      <section className="space-y-4">
        <div className="flex items-center gap-2 pl-1">
          <div className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-blue-500"></span>
          </div>
          <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider">Live Market Signals</h3>
        </div>

        <div className="grid md:grid-cols-3 gap-5">
          {[
            {
              icon: Eye,
              color: "blue",
              text: "Verified employees reviewed Backend profiles this week.",
              highlight: "Backend"
            },
            {
              icon: Sparkles,
              color: "amber",
              text: "Warm intros were initiated recently for Senior roles.",
              highlight: "Senior"
            },
            {
              icon: RefreshCw,
              color: "emerald",
              text: "High-quality profiles are currently being evaluated.",
              highlight: "High-quality"
            }
          ].map((item, i) => (
            <div key={i} className="group flex items-start gap-4 p-5 bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md hover:border-slate-200 transition-all duration-300 hover:-translate-y-1">
              <div className={cn("mt-1 p-2 rounded-xl transition-colors duration-300",
                item.color === 'blue' ? "bg-blue-50 text-blue-600 group-hover:bg-blue-100" :
                  item.color === 'amber' ? "bg-amber-50 text-amber-600 group-hover:bg-amber-100" :
                    "bg-emerald-50 text-emerald-600 group-hover:bg-emerald-100"
              )}>
                <item.icon className="w-5 h-5" />
              </div>
              <p className="text-sm text-slate-600 leading-relaxed">
                {item.text.split(item.highlight).map((part, index) => (
                  <span key={index}>
                    {part}
                    {index === 0 && <span className="font-semibold text-slate-900 bg-slate-100 px-1 rounded">{item.highlight}</span>}
                  </span>
                ))}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* 3. Your Momentum Summary & 4. Gentle Guidance */}
      <div className="grid md:grid-cols-3 gap-8">
        {/* Momentum Summary */}
        <section className="md:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <Activity className="w-5 h-5 text-indigo-500" />
              Your Momentum
            </h3>
            <button className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 transition-colors">View Details</button>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <Card className="border-slate-100 bg-white shadow-sm hover:shadow-md transition-all duration-300 group hover:border-indigo-100 cursor-default">
              <CardContent className="p-6 space-y-2">
                <div className="flex items-end justify-between">
                  <p className="text-4xl font-light text-slate-900 group-hover:text-indigo-600 transition-colors">124</p>
                  <TrendingUp className="w-4 h-4 text-emerald-500 mb-1.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
                <p className="text-xs text-slate-500 font-bold uppercase tracking-wide">Profile Views</p>
              </CardContent>
            </Card>
            <Card className="border-slate-100 bg-white shadow-sm hover:shadow-md transition-all duration-300 group hover:border-indigo-100 cursor-default">
              <CardContent className="p-6 space-y-2">
                <p className="text-4xl font-light text-slate-900 group-hover:text-indigo-600 transition-colors">18</p>
                <p className="text-xs text-slate-500 font-bold uppercase tracking-wide">Shortlisted</p>
              </CardContent>
            </Card>
            <Card className="col-span-2 md:col-span-1 border-slate-100 bg-white shadow-sm hover:shadow-md transition-all duration-300 group hover:border-indigo-100 cursor-default">
              <CardContent className="p-6 space-y-2">
                <div className="flex items-end justify-between">
                  <p className="text-4xl font-light text-slate-900 group-hover:text-indigo-600 transition-colors">72h</p>
                  <RefreshCw className="w-4 h-4 text-slate-400 mb-1.5 group-hover:rotate-180 transition-transform duration-700" />
                </div>
                <p className="text-xs text-slate-500 font-bold uppercase tracking-wide">Avg Review Cycle</p>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Gentle Guidance */}
        <section className="space-y-4">
          <h3 className="text-lg font-bold text-slate-800">Improve Visibility</h3>
          <div className="bg-gradient-to-b from-slate-50 to-white rounded-2xl p-6 border border-slate-200/60 shadow-sm space-y-5">
            <div className="space-y-3 group cursor-pointer">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-slate-800 group-hover:text-indigo-600 transition-colors">Add project proof</p>
                <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-indigo-500 group-hover:translate-x-1 transition-all" />
              </div>
              <p className="text-xs text-slate-500 leading-relaxed">Linking a live repository can strengthen your system design score by up to 15%.</p>
            </div>

            <div className="w-full h-px bg-slate-100"></div>

            <div className="space-y-3 group cursor-pointer">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-slate-800 group-hover:text-indigo-600 transition-colors">Refine keywords</p>
                <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-indigo-500 group-hover:translate-x-1 transition-all" />
              </div>
              <p className="text-xs text-slate-500 leading-relaxed">Specific frameworks like "React Native" match 2x more often than generic terms.</p>
            </div>

            <button className="w-full mt-2 py-2.5 text-xs font-bold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 hover:shadow-lg hover:ring-2 hover:ring-indigo-600/20 transition-all flex items-center justify-center gap-2">
              View All Suggestions <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        </section>
      </div>

    </div>
  );
}
