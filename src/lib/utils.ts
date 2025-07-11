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
        // Handle both client-side Date objects and Firestore Timestamps
        const startDate = exp.from?.toDate ? exp.from.toDate() : (exp.from instanceof Date ? exp.from : null);
        if (!startDate) return;

        const endDate = exp.currentlyWorking ? now : (exp.to?.toDate ? exp.to.toDate() : (exp.to instanceof Date ? exp.to : null));
        if (!endDate || startDate > endDate) return;

        let yearDiff = endDate.getFullYear() - startDate.getFullYear();
        let monthDiff = endDate.getMonth() - startDate.getMonth();
        let dayDiff = endDate.getDate() - startDate.getDate();

        // If dayDiff is negative, it means we haven't completed the last month.
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
