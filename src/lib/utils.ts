import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const calculateTotalExperienceInYears = (experiences: any[] | undefined): number => {
    if (!experiences || experiences.length === 0) return 0;

    let totalMonths = 0;
    const now = new Date();

    experiences.forEach((exp: any) => {
        // Guard against null/undefined exp object
        if (!exp) return;

        // Robustly get the start date. It could be a Timestamp, a Date object, or undefined.
        const startDate = exp.from ? (exp.from.toDate ? exp.from.toDate() : new Date(exp.from)) : null;
        if (!startDate || isNaN(startDate.getTime())) {
            return; // Skip if start date is invalid
        }

        // Robustly get the end date.
        let endDate;
        if (exp.currentlyWorking) {
            endDate = now;
        } else if (exp.to) {
            // It could be a Timestamp, a Date object, or null/undefined
            endDate = exp.to.toDate ? exp.to.toDate() : new Date(exp.to);
        } else {
            endDate = null;
        }

        // Ensure endDate is valid and after startDate before calculating
        if (!endDate || isNaN(endDate.getTime()) || startDate > endDate) {
            return;
        }

        let yearDiff = endDate.getFullYear() - startDate.getFullYear();
        let monthDiff = endDate.getMonth() - startDate.getMonth();
        let dayDiff = endDate.getDate() - startDate.getDate();

        if (dayDiff < 0) {
            monthDiff--;
        }

        totalMonths += yearDiff * 12 + monthDiff;
    });

    if (totalMonths < 0) totalMonths = 0;

    return Math.floor(totalMonths / 12);
};

export const formatCurrency = (amount: number, currency: string = 'USD') => {
    const formattedAmount = new Intl.NumberFormat('en-US', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(amount);

    return `${formattedAmount} ${currency}`;
};
