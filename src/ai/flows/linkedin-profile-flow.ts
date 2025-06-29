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
    startDate: z.string().describe("The start date of the employment, in 'Month YYYY' format (e.g., 'Jan 2020')."),
    endDate: z.string().describe("The end date of the employment, in 'Month YYYY' format (e.g., 'Dec 2022'). If the user is currently working here, return 'Present'."),
    description: z.string().describe("A brief description of responsibilities and achievements in the role."),
});

const EducationSchema = z.object({
    institution: z.string().describe("The name of the educational institution."),
    degree: z.string().describe("The degree or field of study."),
    startDate: z.string().describe("The start date of the education, in 'Month YYYY' format (e.g., 'Aug 2018')."),
    endDate: z.string().describe("The end date of the education, in 'Month YYYY' format (e.g., 'May 2020')."),
    description: z.string().describe("Any notes about the education, like relevant coursework or honors."),
});

const LinkedInProfileOutputSchema = z.object({
  name: z.string().describe("The user's full name based on the profile URL."),
  profilePicUrl: z.string().describe("A placeholder avatar URL from placehold.co (e.g., https://placehold.co/128x128.png)."),
  aboutMe: z.string().describe("A brief professional summary about the user."),
  experiences: z
    .array(ExperienceSchema)
    .describe('A list of professional work experiences.'),
  educations: z
    .array(EducationSchema)
    .describe('A list of educational experiences.'),
  referrerCompany: z.string().describe("The user's most recent company, to be used in their referrer profile."),
  referrerBio: z.string().describe("A bio for the user's referrer profile, explaining what kinds of candidates they can refer (2-3 sentences)."),
  referrerSpecialties: z.string().describe("A comma-separated string of the user's key skills and specialties for their referrer profile."),
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

The user is filling out their profile, which has two views: a Job Seeker profile and a Referrer profile.

Based on the provided URL: {{{url}}}, generate the following:

**General:**
1.  The user's full name (\`name\`).
2.  A placeholder profile picture URL (\`profilePicUrl\`) from placehold.co (e.g., 'https://placehold.co/128x128.png').

**For the Job Seeker Profile:**
1.  A brief "About Me" summary (3-4 sentences).
2.  A list of 2-3 realistic work experiences, including role, company, description, and dates. For dates, provide a separate 'startDate' and 'endDate' in "Month YYYY" format (e.g., startDate: "Jan 2020", endDate: "Dec 2022"). If it's the current role, the 'endDate' should be "Present".
3.  A list of 1-2 realistic education entries, including institution, degree, description, and dates in the same "Month YYYY" format.

**For the Referrer Profile:**
1.  The user's most recent company for the \`referrerCompany\` field. This should match the company of their most recent work experience.
2.  A brief bio (\`referrerBio\`) for their referrer profile, written from their perspective, explaining what kind of candidates they can refer (e.g., "As a [Most Recent Role] at [Most Recent Company], I'm happy to refer strong candidates in the [field/domain] space.").
3.  A comma-separated string of their key skills and specialties for the \`referrerSpecialties\` field (e.g., "Backend, Go, Python, AWS").

Return all data in the specified JSON format.`,
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
