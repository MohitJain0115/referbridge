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
Generate a list of {{{count}}} diverse candidate profiles. For each profile:
1.  Provide a realistic \`currentRole\` (e.g., Software Engineer, Product Manager).
2.  Provide a \`targetRole\` which could be a more senior version of the current role or a related role. Sometimes, this can be the same as the current role if the candidate is not looking for a promotion.
3.  Ensure a good mix of experience levels, locations, and target companies.
4.  The target companies should be well-known tech companies.
5.  Make the data feel authentic and varied.

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
