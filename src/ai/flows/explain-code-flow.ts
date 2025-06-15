
'use server';
/**
 * @fileOverview An AI agent to explain C++ code snippets.
 *
 * - explainCode - A function that handles the C++ code explanation process.
 * - ExplainCodeInput - The input type for the explainCode function.
 * - ExplainCodeOutput - The return type for the explainCode function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ExplainCodeInputSchema = z.object({
  code: z.string().describe('The C++ code snippet to be explained.'),
});
export type ExplainCodeInput = z.infer<typeof ExplainCodeInputSchema>;

const ExplainCodeOutputSchema = z.object({
  explanation: z.string().describe('The AI-generated explanation of the C++ code.'),
});
export type ExplainCodeOutput = z.infer<typeof ExplainCodeOutputSchema>;

export async function explainCode(input: ExplainCodeInput): Promise<ExplainCodeOutput> {
  return explainCodeFlow(input);
}

const prompt = ai.definePrompt({
  name: 'explainCodePrompt',
  input: {schema: ExplainCodeInputSchema},
  output: {schema: ExplainCodeOutputSchema},
  prompt: `You are an AI expert in C++ programming and teaching.
Your task is to explain the provided C++ code snippet.

Provide a clear, concise, and easy-to-understand explanation.
Break down the code into logical parts if necessary.
Explain what each part does and the overall functionality of the snippet.
Highlight any important C++ concepts, syntax, or best practices demonstrated in the code.
Format your explanation for readability. You can use markdown-like formatting for emphasis if helpful, but the final output will be rendered as HTML (newlines will be preserved).

C++ Code to Explain:
\`\`\`cpp
{{{code}}}
\`\`\`

Explanation:
`,
});

const explainCodeFlow = ai.defineFlow(
  {
    name: 'explainCodeFlow',
    inputSchema: ExplainCodeInputSchema,
    outputSchema: ExplainCodeOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
