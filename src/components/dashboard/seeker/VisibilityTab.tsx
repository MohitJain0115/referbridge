"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Info, BarChart, Clock, Layers } from "lucide-react";

export function VisibilityTab() {
    return (
        <div className="space-y-8 max-w-4xl mx-auto">

            {/* 1. Position Snapshot */}
            <Card className="bg-white border text-center md:text-left border-slate-100 shadow-sm overflow-hidden">
                <CardContent className="p-8 flex flex-col md:flex-row items-center gap-8">
                    <div className="relative flex-shrink-0">
                        <div className="w-24 h-24 rounded-full border-4 border-slate-50 bg-slate-50 flex items-center justify-center">
                            <BarChart className="w-8 h-8 text-slate-300" />
                        </div>
                    </div>
                    <div className="space-y-2 max-w-lg">
                        <h3 className="text-sm font-medium text-slate-400 uppercase tracking-widest">Your Current Visibility</h3>
                        <p className="text-2xl md:text-3xl font-light text-slate-900">
                            Top <span className="font-semibold">18%</span> for Backend roles this week
                        </p>
                        <p className="text-slate-500 leading-relaxed text-sm">
                            This reflects how often your profile appears relative to similar candidates.
                        </p>
                    </div>
                </CardContent>
            </Card>

            {/* 2. Exposure Rhythm */}
            <div className="grid md:grid-cols-2 gap-8 items-center bg-slate-50/50 rounded-xl p-6 border border-slate-100">
                <div className="space-y-3">
                    <div className="flex items-center gap-2 text-slate-700 font-medium">
                        <Clock className="w-4 h-4 text-slate-400" />
                        <span>How visibility works</span>
                    </div>
                    <p className="text-sm text-slate-500 leading-relaxed">
                        Your profile is rotated and re-shown every <span className="font-semibold text-slate-700">72 hours</span>. Exposure is distributed fairly across candidates to ensure everyone gets seen by relevant employees.
                    </p>
                </div>
                <div className="space-y-3">
                    <div className="flex items-center gap-2 text-slate-700 font-medium">
                        <Layers className="w-4 h-4 text-slate-400" />
                        <span>Consistency over Speed</span>
                    </div>
                    <p className="text-sm text-slate-500 leading-relaxed">
                        Instant refreshing won't change your visibility. The system prioritizes steady, high-quality matches over rapid spikes.
                    </p>
                </div>
            </div>

            {/* 3. Visibility Metrics */}
            <section className="space-y-4">
                <h3 className="text-lg font-medium text-slate-800">Activity Overview</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Card className="border border-slate-100 shadow-sm bg-white">
                        <CardContent className="p-5 space-y-2">
                            <p className="text-sm text-slate-500">Profile Appearances</p>
                            <p className="text-2xl font-light text-slate-900">840</p>
                            <p className="text-xs text-slate-400">Batched over last 7 days</p>
                        </CardContent>
                    </Card>
                    <Card className="border border-slate-100 shadow-sm bg-white">
                        <CardContent className="p-5 space-y-2">
                            <p className="text-sm text-slate-500">Cycles Completed</p>
                            <p className="text-2xl font-light text-slate-900">4</p>
                            <p className="text-xs text-slate-400">Full 72h rotations</p>
                        </CardContent>
                    </Card>
                    <Card className="border border-slate-100 shadow-sm bg-white">
                        <CardContent className="p-5 space-y-2">
                            <p className="text-sm text-slate-500">Shortlists</p>
                            <p className="text-2xl font-light text-slate-900">3</p>
                            <p className="text-xs text-slate-400">Potential matches found</p>
                        </CardContent>
                    </Card>
                </div>
            </section>

            {/* 4. Trend Without Pressure */}
            <div className="flex items-center justify-between p-4 rounded-lg border border-slate-100 bg-white">
                <span className="text-sm text-slate-600">Visibility Trend</span>
                <span className="text-sm text-slate-400">Steady activity observed over the last 14 days.</span>
            </div>

            {/* 5. Reassurance Footer */}
            <div className="flex items-start gap-3 p-4 bg-slate-50 rounded-lg border border-slate-100/50">
                <Info className="w-4 h-4 text-slate-400 mt-0.5" />
                <p className="text-sm text-slate-500 leading-relaxed">
                    Visibility varies week to week. Improving alignment increases frequency, not guarantees.
                </p>
            </div>

        </div>
    );
}
