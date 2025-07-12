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
        // Robustly get the start date, whether it's a Timestamp or a Date
        const startDate = exp?.from ? (exp.from.toDate ? exp.from.toDate() : new Date(exp.from)) : null;
        if (!startDate || isNaN(startDate.getTime())) return;


        // Robustly get the end date
        let endDate;
        if (exp.currentlyWorking) {
            endDate = now;
        } else if (exp.to) {
            endDate = exp.to.toDate ? exp.to.toDate() : new Date(exp.to);
        } else {
            endDate = null;
        }

        if (!endDate || isNaN(endDate.getTime()) || startDate > endDate) return;

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
