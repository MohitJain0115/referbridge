'use server';
/**
 * @fileOverview An AI flow to generate mock candidate data.
 *
 * - generateCandidates - A function that generates a list of candidate profiles.
 * - GenerateCandidatesInput - The input type for the generateCandidates function.
 * - Candidate - The Zod schema and type for a single candidate.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';

export const CandidateSchema = z.object({
  id: z.string().uuid().describe("A unique UUID for the candidate."),
  name: z.string().describe("The candidate's full name."),
  avatar: z.string().url().describe("A placeholder avatar URL from placehold.co (e.g., https://placehold.co/100x100.png)."),
  role: z.string().describe("The candidate's current or target job title."),
  company: z.string().describe("The candidate's current or most recent company."),
  salary: z.number().min(40000).max(250000).describe("The candidate's expected annual salary in USD."),
  skills: z.array(z.string()).describe("A list of 3-5 key skills."),
  location: z.string().describe("The candidate's location (e.g., 'San Francisco, CA')."),
  experience: z.number().min(0).max(20).describe("The candidate's years of professional experience."),
  status: z.enum(['Pending', 'Viewed', 'Referred', 'Not a Fit']).describe("The current status of their application (for referrer view)."),
  jobPostUrl: z.string().url().describe("A sample URL to a job posting."),
  targetCompanies: z.array(z.string()).describe("A list of 1-3 companies the candidate is targeting."),
});
export type Candidate = z.infer<typeof CandidateSchema>;

const GenerateCandidatesInputSchema = z.object({
  count: z.number().int().positive().describe('The number of candidates to generate.'),
});
export type GenerateCandidatesInput = z.infer<typeof GenerateCandidatesInputSchema>;

const GenerateCandidatesOutputSchema = z.object({
  candidates: z.array(CandidateSchema),
});

export async function generateCandidates(input: GenerateCandidatesInput): Promise<Candidate[]> {
  const { output } = await generateCandidatesFlow(input);
  return output?.candidates || [];
}

const prompt = ai.definePrompt({
  name: 'generateCandidatesPrompt',
  input: { schema: GenerateCandidatesInputSchema },
  output: { schema: GenerateCandidatesOutputSchema },
  prompt: `You are an AI assistant that generates realistic mock data for a job referral platform.
Generate a list of {{{count}}} diverse candidate profiles. Ensure a good mix of roles (e.g., Software Engineer, Product Manager, UX/UI Designer, Data Scientist, DevOps Engineer), experience levels, locations, and target companies.
The target companies should be well-known tech companies. Make the data feel authentic and varied.
Return the data in the specified JSON format.
`,
});

const generateCandidatesFlow = ai.defineFlow(
  {
    name: 'generateCandidatesFlow',
    inputSchema: GenerateCandidatesInputSchema,
    outputSchema: GenerateCandidatesOutputSchema,
  },
  async (input) => {
    const {output} = await prompt(input);
    return output!;
  }
);
