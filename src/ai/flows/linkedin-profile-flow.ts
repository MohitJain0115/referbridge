'use server';
/**
 * @fileOverview An AI flow to generate profile data from a LinkedIn URL.
 *
 * - importFromLinkedIn - A function that handles generating profile data.
 * - LinkedInProfileInput - The input type for the importFromLinkedIn function.
 * - LinkedInProfileOutput - The return type for the importFromLinkedIn function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';

const LinkedInProfileInputSchema = z.object({
  url: z.string().url().describe('The URL of the LinkedIn profile.'),
});
export type LinkedInProfileInput = z.infer<typeof LinkedInProfileInputSchema>;

const ExperienceSchema = z.object({
    role: z.string().describe("The user's job title or role."),
    company: z.string().describe("The name of the company."),
    dates: z.string().describe("The start and end dates of the employment."),
    description: z.string().describe("A brief description of responsibilities and achievements in the role."),
});

const EducationSchema = z.object({
    institution: z.string().describe("The name of the educational institution."),
    degree: z.string().describe("The degree or field of study."),
    dates: z.string().describe("The start and end dates of the education."),
    description: z.string().describe("Any notes about the education, like relevant coursework or honors."),
});

const LinkedInProfileOutputSchema = z.object({
  aboutMe: z.string().describe("A brief professional summary about the user."),
  experiences: z
    .array(ExperienceSchema)
    .describe('A list of professional work experiences.'),
  educations: z
    .array(EducationSchema)
    .describe('A list of educational experiences.'),
});
export type LinkedInProfileOutput = z.infer<typeof LinkedInProfileOutputSchema>;


export async function importFromLinkedIn(input: LinkedInProfileInput): Promise<LinkedInProfileOutput> {
  return importFromLinkedInFlow(input);
}

const prompt = ai.definePrompt({
  name: 'linkedinProfilePrompt',
  input: { schema: LinkedInProfileInputSchema },
  output: { schema: LinkedInProfileOutputSchema },
  prompt: `You are an AI assistant that helps users populate their professional profile by generating plausible data based on a LinkedIn profile URL.
IMPORTANT: You cannot access the live internet or the content of the provided URL. You must generate realistic, sample data based on any information you can infer from the URL string itself (like a name or title) and your general knowledge of common job roles and career paths.

The user is filling out their "About Me", "Work Experience", and "Education" sections.

Based on the provided URL: {{{url}}}, generate:
1.  A brief "About Me" summary (3-4 sentences).
2.  A list of 2-3 realistic work experiences, including role, company, dates, and a description of achievements.
3.  A list of 1-2 realistic education entries, including institution, degree, dates, and a brief description.

Return the data in the specified JSON format.`,
});

const importFromLinkedInFlow = ai.defineFlow(
  {
    name: 'importFromLinkedInFlow',
    inputSchema: LinkedInProfileInputSchema,
    outputSchema: LinkedInProfileOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    if (!output) {
      throw new Error("Failed to generate profile data from the model.");
    }
    return output;
  }
);
