import { generateText } from 'ai';
import { openai } from '@ai-sdk/openai';

export async function generateCodeSample(spec: any, prompt: string) {
  const { text } = await generateText({
    model: openai('gpt-4-turbo'),
    system: `You are an AI assistant that generates code samples based on an OpenAPI specification. 
    The specification is provided in the following JSON format: ${JSON.stringify(spec)}`,
    prompt: `Generate a code sample for the following request: ${prompt}`,
  });

  return text;
}

