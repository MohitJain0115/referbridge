
import { z } from 'zod';

// From tracked-requests-flow.ts
export const RequestStatusSchema = z.enum(['Pending', 'Viewed', 'Referred - Awaiting Confirmation', 'Confirmed Referral', 'Not a Fit', 'Resume Downloaded', 'Cancelled']);
export type ReferralRequestStatus = z.infer<typeof RequestStatusSchema>;

// From candidates-flow.ts
export const CandidateSchema = z.object({
  id: z.string().describe("A unique UUID for the candidate."),
  requestId: z.string().optional().describe("The ID of the specific referral request, if applicable."),
  name: z.string().describe("The candidate's full name."),
  avatar: z.string().describe("A placeholder avatar URL from placehold.co (e.g., https://placehold.co/100x100.png)."),
  currentRole: z.string().describe("The candidate's current job title."),
  targetRole: z.string().optional().describe("The candidate's target job title. Can be the same as the current role."),
  company: z.string().describe("The candidate's current or most recent company."),
  salary: z.number().min(0).describe("The candidate's expected annual salary."),
  salaryCurrency: z.string().optional().default("USD").describe("The currency for the expected salary (e.g., USD, EUR)."),
  isSalaryVisible: z.boolean().optional().default(true).describe("Whether the salary is visible to referrers."),
  skills: z.array(z.string()).describe("A list of 3-5 key skills."),
  location: z.string().describe("The candidate's location (e.g., 'San Francisco, CA')."),
  experience: z.number().min(0).max(40).describe("The candidate's years of professional experience."),
  status: RequestStatusSchema.describe("The current status of their application (for referrer view)."),
  jobPostUrl: z.string().describe("A sample URL to a job posting."),
  targetCompanies: z.array(z.string()).describe("A list of 1-3 companies the candidate is targeting."),
});
export type Candidate = z.infer<typeof CandidateSchema>;



// From referrers-flow.ts
export const ReferrerSchema = z.object({
  id: z.string().describe("A unique UUID for the referrer."),
  name: z.string().describe("The referrer's full name."),
  avatar: z.string().describe("A placeholder avatar URL from placehold.co (e.g., https://placehold.co/100x100.png)."),
  role: z.string().describe("The referrer's job title."),
  company: z.string().describe("The company the referrer works at."),
  location: z.string().describe("The referrer's location (e.g., 'San Francisco, CA')."),
  specialties: z.array(z.string()).describe("A list of 2-4 professional specialties."),
  bio: z.string().optional().describe("A short bio from the referrer."),
});
export type Referrer = z.infer<typeof ReferrerSchema>;


export const TrackedRequestSchema = z.object({
  id: z.string().describe("A unique UUID for the tracked request."),
  referrer: ReferrerSchema,
  status: RequestStatusSchema.describe("The current status of the referral request."),
  cancellationReason: z.string().nullable().optional().describe("The reason for cancellation, if applicable. Provide a reason only if the status is 'Cancelled'."),
  requestedAt: z.union([z.string().datetime(), z.date()]).describe("The ISO 8601 timestamp when the request was made."),
});
export type TrackedRequest = z.infer<typeof TrackedRequestSchema>;
