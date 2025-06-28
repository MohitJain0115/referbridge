'use server';
/**
 * @fileOverview An AI flow to generate mock tracked referral request data.
 *
 * - generateTrackedRequests - Generates a list of tracked requests.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { TrackedRequestSchema, type TrackedRequest } from '@/lib/types';


const GenerateTrackedRequestsInputSchema = z.object({
  count: z.number().int().positive().describe('The number of tracked requests to generate.'),
});

const GenerateTrackedRequestsOutputSchema = z.object({
  requests: z.array(TrackedRequestSchema),
});

export async function generateTrackedRequests(count: number): Promise<TrackedRequest[]> {
  const { output } = await generateTrackedRequestsFlow({ count });
  return output?.requests || [];
}

const prompt = ai.definePrompt({
  name: 'generateTrackedRequestsPrompt',
  input: { schema: GenerateTrackedRequestsInputSchema },
  output: { schema: GenerateTrackedRequestsOutputSchema },
  prompt: `You are an AI assistant that generates realistic mock data for a job referral platform.
Generate a list of {{{count}}} diverse tracked referral requests. For each request:
1. Create a realistic referrer profile (name, role, company, etc.).
2. Assign a status from: 'Pending', 'Resume Downloaded', 'Cancelled'.
3. If the status is 'Cancelled', provide a brief, professional cancellation reason (e.g., "Experience level does not match", "Not a good fit for current openings"). Otherwise, the cancellationReason should be null or omitted.
4. Provide a recent ISO 8601 date for 'requestedAt'.

Return the data in the specified JSON format.
`,
});

const generateTrackedRequestsFlow = ai.defineFlow(
  {
    name: 'generateTrackedRequestsFlow',
    inputSchema: GenerateTrackedRequestsInputSchema,
    outputSchema: GenerateTrackedRequestsOutputSchema,
  },
  async (input) => {
    const {output} = await prompt(input);
    return output!;
  }
);
