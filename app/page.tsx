import { CodeSampleGenerator } from '@/components/CodeSampleGenerator'

export default function Home() {
  return (
    <main className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">OpenAPI Code Sample Generator</h1>
      <CodeSampleGenerator />
    </main>
  )
}

