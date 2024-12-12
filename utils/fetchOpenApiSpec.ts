import { generateObject } from 'ai';
import { openai } from '@ai-sdk/openai';
import { z } from 'zod';

export async function fetchOpenApiSpec(url: string) {
  const response = await fetch(url);
  const spec = await response.json();

  console.log(process.env)

  const { object } = await generateObject({
    model: openai("gpt-3.5-turbo"),
    schema: z.object({
      paths: z.record(z.unknown()),
      components: z.object({
        schemas: z.record(z.unknown()),
      }),
    }),
    prompt: `Parse the following OpenAPI specification and extract the paths and components:
    ${JSON.stringify(spec)}`,
  });

  return object;
}

