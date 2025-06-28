'use server';
/**
 * @fileOverview An AI flow to generate mock candidate data.
 *
 * - generateCandidates - A function that generates a list of candidate profiles.
 * - GenerateCandidatesInput - The input type for the generateCandidates function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { CandidateSchema, type Candidate } from '@/lib/types';

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
