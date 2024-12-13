import { type NextRequest, NextResponse } from 'next/server'
import { streamText } from 'ai'
import { openai } from '@ai-sdk/openai'

export const maxDuration = 60

interface OpenAPISpec {
  paths: {
    [path: string]: {
      [method: string]: {
        tags?: string[];
        [key: string]: unknown;
      };
    };
  };
  [key: string]: unknown;
}

interface ParsedSpec {
  spec: OpenAPISpec;
  tags: string[];
}

let cachedSpec: OpenAPISpec | null = null;

async function loadOpenApiSpec(): Promise<OpenAPISpec> {
  if (cachedSpec) return cachedSpec;

  try {
    const response = await fetch('https://spec.speakeasy.com/vercel/vercel-docs/vercel-oas-with-code-samples');
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    cachedSpec = await response.json() as OpenAPISpec;
    return cachedSpec;
  } catch (error) {
    console.error('Error loading OpenAPI spec:', error);
    throw error;
  }
}

function parseOpenApiSpec(spec: OpenAPISpec): ParsedSpec {
  const tags = new Set<string>();

  // biome-ignore lint/complexity/noForEach: <explanation>
  Object.values(spec.paths).forEach((pathItem) => {
    // biome-ignore lint/complexity/noForEach: <explanation>
    Object.values(pathItem).forEach((method) => {
      if (method.tags && Array.isArray(method.tags)) {
        // biome-ignore lint/complexity/noForEach: <explanation>
        method.tags.forEach((tag) => tags.add(tag));
      }
    });
  });

  return {
    spec,
    tags: Array.from(tags).sort(),
  };
}

export async function GET() {
  try {
    const fullSpec = await loadOpenApiSpec();
    const { tags } = parseOpenApiSpec(fullSpec);
    return NextResponse.json({ tags });
  } catch (error) {
    console.error('Error in GET route:', error);
    return NextResponse.json({ error: 'Failed to load API tags' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { prompt, selectedTags } = await req.json() as { prompt: string; selectedTags: string[] };

    if (!cachedSpec) {
      await loadOpenApiSpec();
    }

    if (!cachedSpec) {
      throw new Error('Failed to load OpenAPI specification');
    }

    const filteredSpec: OpenAPISpec = {
      ...cachedSpec,
      paths: Object.fromEntries(
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        Object.entries(cachedSpec.paths).filter(([_, pathItem]) => 
          Object.values(pathItem).some((method) => 
            // biome-ignore lint/complexity/useOptionalChain: <explanation>
            method.tags && method.tags.some((tag) => selectedTags.includes(tag))
          )
        )
      )
    };

    const stream = streamText({
      model: openai('gpt-4o'),
      system: `You are a Senior Software Engineer with a deep understanding of the OpenAPI specification. 
      The specification is provided in the following JSON format: ${JSON.stringify(filteredSpec)}`,
      prompt: `Generate a code sample only using the Vercel/SDK for the following request related to the '${selectedTags.join(", ")}' tags: ${prompt}`,
    });

    return new NextResponse(stream.textStream);
  } catch (error) {
    console.error('Error in POST route:', error);
    return NextResponse.json({ error: 'Failed to generate code sample' }, { status: 500 });
  }
}

