"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Info, Check, BarChart2 } from "lucide-react";

// Mock data reflecting "Signal Board" philosophy
const signals = [
    {
        role: "Backend Engineer",
        experience: "3-5 years",
        demand: "High",
        alignment: true,
        hint: "Improve alignment to appear more often in this role.",
    },
    {
        role: "Data Analyst",
        experience: "2-4 years",
        demand: "Medium",
        alignment: true,
        hint: "Add specific visualization tools to your skills.",
    },
    {
        role: "Product Analyst",
        experience: "4-6 years",
        demand: "Low",
        alignment: false,
        hint: "Product strategy keywords are missing.",
    },
    {
        role: "Senior Frontend Engineer",
        experience: "5-8 years",
        demand: "High",
        alignment: false,
        hint: "React performance optimization experience is highly sought.",
    },
];

export function OpportunitiesTab() {
    return (
        <div className="space-y-8 max-w-4xl mx-auto">

            {/* 1. Header Section */}
            <div className="space-y-1">
                <div className="flex items-baseline gap-2">
                    <h2 className="text-xl font-semibold text-slate-800">
                        Where Referrals Are Active
                    </h2>
                    <span className="text-xs font-normal text-slate-400">(Updated weekly)</span>
                </div>
                <p className="text-slate-500 text-sm">
                    These roles currently see referral activity from verified employees.
                </p>
            </div>

            {/* 2. Anonymous Role Signal Cards */}
            <div className="space-y-4">
                {signals.map((signal, index) => (
                    <Card key={index} className="border border-slate-100 shadow-sm bg-white">
                        <CardContent className="p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">

                            {/* Role & Experience */}
                            <div className="space-y-1.5 flex-1">
                                <div className="flex items-center gap-3">
                                    <h3 className="font-medium text-slate-900 text-base">{signal.role}</h3>
                                    <span className="text-xs text-slate-400 font-medium px-2 py-0.5 rounded-full bg-slate-50 border border-slate-100">
                                        {signal.experience}
                                    </span>
                                </div>

                                {/* Hint Text */}
                                <p className="text-sm text-slate-500">
                                    {signal.hint}
                                </p>

                                {/* Alignment Cue - Positive Only */}
                                {signal.alignment && (
                                    <div className="flex items-center gap-1.5 pt-1">
                                        <Check className="w-3 h-3 text-slate-600" />
                                        <span className="text-xs text-slate-600 font-medium">Good alignment</span>
                                    </div>
                                )}
                            </div>

                            {/* Demand Indicator - Neutral Colors */}
                            <div className="flex items-center gap-3 border-t sm:border-t-0 sm:border-l border-slate-100 pt-4 sm:pt-0 sm:pl-6 min-w-[140px]">
                                <div className="flex flex-col items-start sm:items-end w-full">
                                    <span className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold mb-1">
                                        Referral Activity
                                    </span>
                                    <Badge
                                        variant="outline"
                                        className="font-normal border-0 px-2 py-0.5 bg-slate-50 text-slate-700"
                                    >
                                        {signal.demand}
                                    </Badge>
                                </div>
                            </div>

                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* 3. Context, Not Urgency */}
            <div className="flex items-start gap-3 p-4 bg-slate-50 rounded-lg border border-slate-100/50">
                <Info className="w-4 h-4 text-slate-400 mt-0.5" />
                <p className="text-sm text-slate-500 leading-relaxed">
                    This board shows where referral activity tends to occur, not open roles or guarantees.
                </p>
            </div>

        </div>
    );
}
