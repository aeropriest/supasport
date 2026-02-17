'use server';
/**
 * @fileOverview An AI agent to generate tailored lesson feedback and preliminary lesson plan suggestions for coaches.
 *
 * - generateLessonFeedbackAndPlan - A function that handles the generation of feedback and lesson plans.
 * - GenerateLessonFeedbackAndPlanInput - The input type for the generateLessonFeedbackAndPlan function.
 * - GenerateLessonFeedbackAndPlanOutput - The return type for the generateLessonFeedbackAndPlan function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateLessonFeedbackAndPlanInputSchema = z.object({
  clientName: z.string().describe('The name of the client for whom the feedback is being generated.').min(1),
  coachName: z.string().describe('The name of the coach providing the observations.').min(1),
  sport: z.string().describe('The sport being coached.').min(1),
  performanceObservations: z
    .string()
    .describe(
      'Detailed observations about the client\u0027s performance during the lesson, including strengths, weaknesses, and specific incidents.'
    )
    .min(1),
});
export type GenerateLessonFeedbackAndPlanInput = z.infer<typeof GenerateLessonFeedbackAndPlanInputSchema>;

const GenerateLessonFeedbackAndPlanOutputSchema = z.object({
  feedbackSummary: z
    .string()
    .describe(
      'A tailored, encouraging, and constructive feedback summary for the client, focusing on key areas from the observations.'
    ),
  lessonPlanSuggestions: z
    .string()
    .describe(
      'Preliminary suggestions for the client\u0027s next lesson plan, outlining specific drills or areas of focus based on their performance.'
    ),
});
export type GenerateLessonFeedbackAndPlanOutput = z.infer<typeof GenerateLessonFeedbackAndPlanOutputSchema>;

export async function generateLessonFeedbackAndPlan(
  input: GenerateLessonFeedbackAndPlanInput
): Promise<GenerateLessonFeedbackAndPlanOutput> {
  return generateLessonFeedbackAndPlanFlow(input);
}

const generateLessonFeedbackAndPlanPrompt = ai.definePrompt({
  name: 'generateLessonFeedbackAndPlanPrompt',
  input: {schema: GenerateLessonFeedbackAndPlanInputSchema},
  output: {schema: GenerateLessonFeedbackAndPlanOutputSchema},
  prompt: `You are an AI assistant specializing in sports coaching. Your task is to help coaches provide personalized feedback and plan future lessons based on client performance observations.

Generate a tailored feedback summary for the client and preliminary suggestions for their next lesson plan.

--- Input ---
Client Name: {{{clientName}}}
Coach Name: {{{coachName}}}
Sport: {{{sport}}}
Performance Observations: {{{performanceObservations}}}

--- Instructions ---
1.  **Feedback Summary**: Create a concise, encouraging, and constructive feedback summary for the client. Highlight their strengths and gently address areas for improvement based on the provided observations. Keep the tone professional and motivating.
2.  **Lesson Plan Suggestions**: Provide 3-5 preliminary suggestions for the client's next lesson plan. These should be actionable and directly address the areas identified for improvement or further development. For example, suggest specific drills, focus areas, or techniques to practice.

Ensure both outputs are well-structured and easy for a coach to relay to their client.`,
});

const generateLessonFeedbackAndPlanFlow = ai.defineFlow(
  {
    name: 'generateLessonFeedbackAndPlanFlow',
    inputSchema: GenerateLessonFeedbackAndPlanInputSchema,
    outputSchema: GenerateLessonFeedbackAndPlanOutputSchema,
  },
  async input => {
    const {output} = await generateLessonFeedbackAndPlanPrompt(input);
    return output!;
  }
);
