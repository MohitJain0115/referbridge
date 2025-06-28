'use server';
/**
 * @fileOverview An AI flow to generate mock tracked referral request data.
 *
 * - generateTrackedRequests - Generates a list of tracked requests.
 * - TrackedRequest - The Zod schema and type for a single tracked request.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { ReferrerSchema } from './referrers-flow';

const RequestStatusSchema = z.enum(['Pending', 'Resume Downloaded', 'Cancelled']);
export type ReferralRequestStatus = z.infer<typeof RequestStatusSchema>;


export const TrackedRequestSchema = z.object({
  id: z.string().uuid().describe("A unique UUID for the tracked request."),
  referrer: ReferrerSchema,
  status: RequestStatusSchema.describe("The current status of the referral request."),
  cancellationReason: z.string().optional().describe("The reason for cancellation, if applicable. Provide a reason only if the status is 'Cancelled'."),
  requestedAt: z.string().datetime().describe("The ISO 8601 timestamp when the request was made."),
});
export type TrackedRequest = z.infer<typeof TrackedRequestSchema>;

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
