"use client";

import { Button } from "@/components/ui/button";
import { ArrowUpRight, Sparkles, BookOpen, PenTool } from "lucide-react";

const suggestions = [
    {
        id: 1,
        title: "Add project or work sample",
        description: "Linking a case study helps verified employees understand your problem-solving process.",
        impact: "May improve visibility by +3 to +5",
        action: "Add Item",
        icon: <BookOpen className="w-5 h-5 text-indigo-500" />
    },
    {
        id: 2,
        title: "Clarify system design experience",
        description: "Mentioning specific architectures (e.g., Event-Driven, Microservices) strengthens technical matching.",
        impact: "May improve visibility by +2 to +4",
        action: "Update Experience",
        icon: <PenTool className="w-5 h-5 text-blue-500" />
    },
    {
        id: 3,
        title: "Refine role keywords",
        description: "Aligning your vocabulary with industry standards can help the system surface your profile more accurately.",
        impact: "May improve visibility by +1 to +3",
        action: "Review Keywords",
        icon: <Sparkles className="w-5 h-5 text-amber-500" />
    },
];

export function ImproveScoreTab() {
    return (
        <div className="space-y-8 max-w-4xl mx-auto">

            {/* 1. Supportive Header */}
            <div className="space-y-1">
                <h2 className="text-xl font-semibold text-slate-800">
                    Ways to strengthen your profile
                </h2>
                <p className="text-slate-500 text-sm">
                    These optional improvements can increase how often your profile appears.
                </p>
            </div>

            {/* 2. Actionable Improvement List */}
            <div className="space-y-4">
                {suggestions.map((suggestion) => (
                    <div key={suggestion.id} className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm flex flex-col md:flex-row gap-6 md:items-center">

                        <div className="flex-shrink-0 bg-slate-50 p-3 rounded-full hidden md:block">
                            {suggestion.icon}
                        </div>

                        <div className="space-y-2 flex-1">
                            <div className="flex items-center gap-2 md:hidden">
                                {suggestion.icon}
                                <h3 className="font-medium text-slate-800">{suggestion.title}</h3>
                            </div>
                            <h3 className="font-medium text-slate-800 hidden md:block">{suggestion.title}</h3>

                            <p className="text-slate-500 text-sm leading-relaxed">
                                {suggestion.description}
                            </p>

                            <p className="text-xs font-medium text-emerald-600 bg-emerald-50 inline-block px-2 py-1 rounded">
                                {suggestion.impact}
                            </p>
                        </div>

                        <div className="flex-shrink-0 pt-2 md:pt-0">
                            <Button
                                variant="outline"
                                className="w-full md:w-auto border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50 font-normal"
                            >
                                {suggestion.action} <ArrowUpRight className="w-3 h-3 ml-2 opacity-50" />
                            </Button>
                        </div>

                    </div>
                ))}
            </div>

            {/* 4. Balance & Reassurance */}
            <div className="bg-slate-50 rounded-lg p-6 border border-slate-100/50 text-center md:text-left">
                <p className="text-sm text-slate-500">
                    Many strong profiles already perform well without completing every item. Focus on changes that best represent your actual experience.
                </p>
            </div>

        </div>
    );
}
