'use server';
/**
 * @fileOverview An AI flow to generate mock referrer data.
 *
 * - generateReferrers - A function that generates a list of referrer profiles.
 * - GenerateReferrersInput - The input type for the generateReferrers function.
 * - Referrer - The Zod schema and type for a single referrer.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';

export const ReferrerSchema = z.object({
  id: z.string().uuid().describe("A unique UUID for the referrer."),
  name: z.string().describe("The referrer's full name."),
  avatar: z.string().url().describe("A placeholder avatar URL from placehold.co (e.g., https://placehold.co/100x100.png)."),
  role: z.string().describe("The referrer's job title."),
  company: z.string().describe("The company the referrer works at."),
  location: z.string().describe("The referrer's location (e.g., 'San Francisco, CA')."),
  specialties: z.array(z.string()).describe("A list of 2-4 professional specialties."),
  connections: z.number().min(50).max(2000).describe("The number of professional connections."),
});
export type Referrer = z.infer<typeof ReferrerSchema>;

const GenerateReferrersInputSchema = z.object({
  count: z.number().int().positive().describe('The number of referrers to generate.'),
});
export type GenerateReferrersInput = z.infer<typeof GenerateReferrersInputSchema>;

const GenerateReferrersOutputSchema = z.object({
  referrers: z.array(ReferrerSchema),
});

export async function generateReferrers(input: GenerateReferrersInput): Promise<Referrer[]> {
  const { output } = await generateReferrersFlow(input);
  return output?.referrers || [];
}

const prompt = ai.definePrompt({
  name: 'generateReferrersPrompt',
  input: { schema: GenerateReferrersInputSchema },
  output: { schema: GenerateReferrersOutputSchema },
  prompt: `You are an AI assistant that generates realistic mock data for a job referral platform.
Generate a list of {{{count}}} diverse referrer profiles. They should work at well-known tech companies.
Ensure a good mix of roles (e.g., Software Engineer, Engineering Manager, Recruiter, Product Lead), seniority, and locations.
Return the data in the specified JSON format.
`,
});

const generateReferrersFlow = ai.defineFlow(
  {
    name: 'generateReferrersFlow',
    inputSchema: GenerateReferrersInputSchema,
    outputSchema: GenerateReferrersOutputSchema,
  },
  async (input) => {
    const {output} = await prompt(input);
    return output!;
  }
);
