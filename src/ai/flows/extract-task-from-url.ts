
'use server';
/**
 * @fileOverview An AI flow to extract task details from a URL.
 *
 * - extractTaskFromUrl - A function that analyzes a URL and returns structured task data.
 * - ExtractTaskFromUrlInput - The input type for the flow.
 * - ExtractTaskFromUrlOutput - The return type for the flow.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { format } from 'date-fns';

const ExtractTaskFromUrlInputSchema = z.object({
  url: z.string().url().describe('The URL of the webpage to analyze.'),
});
export type ExtractTaskFromUrlInput = z.infer<typeof ExtractTaskFromUrlInputSchema>;

const ExtractTaskFromUrlOutputSchema = z.object({
  title: z.string().describe('A clear, concise title for the task. Max 100 characters.'),
  description: z.string().describe('A detailed summary of the task, including actionable step-by-step instructions. Formatted as a single string with newlines.'),
  dueDate: z.string().optional().describe(`The suggested due date in 'YYYY-MM-DD' format. If no date is found, this should be omitted. Today is ${format(new Date(), 'PPP')}.`),
  tags: z.array(z.string()).describe('An array of 1-3 relevant lowercase tags for the task. The "ai" tag is added automatically and should not be included here.'),
  recurrence: z.enum(['daily', 'weekly', 'monthly']).optional().describe('The recurrence pattern if the task is repetitive.'),
  goalType: z.enum(['count', 'amount']).optional().describe('The type of goal if it is a recurring task.'),
  goalTarget: z.coerce.number().optional().describe('The quantitative target for the goal.'),
  goalUnit: z.string().optional().describe('The unit for the goal target (e.g., "articles", "km", "$").'),
});
export type ExtractTaskFromUrlOutput = z.infer<typeof ExtractTaskFromUrlOutputSchema>;


export async function extractTaskFromUrl(input: ExtractTaskFromUrlInput): Promise<ExtractTaskFromUrlOutput> {
  return extractTaskFlow(input);
}

const prompt = ai.definePrompt({
  name: 'extractTaskPrompt',
  input: { schema: ExtractTaskFromUrlInputSchema },
  output: { schema: ExtractTaskFromUrlOutputSchema },
  prompt: `You are an expert at analyzing web content and creating actionable tasks. Your task is to analyze the content of the provided URL and extract the key information to create a task in a to-do list application.

Today's date is ${format(new Date(), 'PPP')}. Use this as a reference for any relative dates (e.g., "next Friday", "in 30 days").

From the content at the URL, extract the following information:

1.  **Title**: Create a clear and concise title for the task. It should be easy to understand at a glance.
2.  **Description**: Generate a detailed summary of the task. If the content contains steps, format them as a clear, actionable, step-by-step list. Each step should start with a number (e.g., "1. First step...\\n2. Second step...").
3.  **Due Date**: If a specific deadline or date is mentioned, parse it and provide it in YYYY-MM-DD format. If no date is mentioned, omit this field.
4.  **Tags**: Identify 1-3 relevant keywords from the content to use as lowercase tags. Do not include "ai" as a tag.
5.  **Recurrence & Goal**: Check if the task is described as recurring or having a quantitative goal.
    *   If it is, determine the **recurrence** pattern ('daily', 'weekly', 'monthly').
    *   Identify the **goalType** ('count' or 'amount').
    *   Extract the numeric **goalTarget**.
    *   Extract the **goalUnit** if specified (e.g., "articles", "km", "$").
    *   If the task is not recurring or has no clear goal, omit all these fields.

Analyze the content at the following URL: {{media url=url}}`,
});

const extractTaskFlow = ai.defineFlow(
  {
    name: 'extractTaskFlow',
    inputSchema: ExtractTaskFromUrlInputSchema,
    outputSchema: ExtractTaskFromUrlOutputSchema,
  },
  async (input) => {
    try {
      const { output } = await prompt(input);
      if (!output) {
        throw new Error("The AI model did not return any output.");
      }
      return output;
    } catch (error: any) {
        if (error.message && error.message.includes('HTTP error downloading media')) {
            console.error('Blocked by source:', error.message);
            throw new Error(`Failed to access the URL. The website may be blocking automated access. Please try a different link or enter the task manually.`);
        }
        console.error('An unexpected error occurred during task extraction:', error);
        throw new Error("An unexpected error occurred while trying to extract the task.");
    }
  }
);
