'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { MarkdownRenderer } from "@/components/ui/markdown-renderer"

export function CodeSampleGenerator() {
  const [prompt, setPrompt] = useState('')
  const [generatedContent, setGeneratedContent] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isReady, setIsReady] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [tags, setTags] = useState<string[]>([])
  const [selectedTags, setSelectedTags] = useState<string[]>([])

  useEffect(() => {
    async function loadTags() {
      try {
        const response = await fetch('/api/generate-code')
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }
        const data = await response.json()
        if (data.error) {
          throw new Error(data.error)
        }
        setTags(data.tags)
        setIsReady(true)
      } catch (error) {
        console.error('Error loading tags:', error)
        setError('Failed to load API tags. Please refresh the page.')
      }
    }

    loadTags()
  }, [])

  const handleTagChange = (tag: string) => {
    setSelectedTags(prev => 
      prev.includes(tag) 
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    )
  }

  async function handleGenerateCode() {
    if (selectedTags.length === 0) {
      setError('Please select at least one tag before generating code.')
      return
    }

    setIsLoading(true)
    setError(null)
    setGeneratedContent('')

    try {
      const response = await fetch('/api/generate-code', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ prompt, selectedTags }),
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const reader = response.body?.getReader()
      const decoder = new TextDecoder()

      if (!reader) {
        throw new Error('Failed to get response reader')
      }

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        const chunk = decoder.decode(value)
        setGeneratedContent(prev => prev + chunk)
      }
    } catch (error) {
      console.error('Error:', error)
      setError('Failed to generate content. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  if (!isReady) {
    return <div>Loading API tags...</div>
  }

  return (
    <div className="p-4 space-y-4">
      <div className="space-y-2">
        <Label>Select Tags:</Label>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
          {tags.map((tag) => (
            <div key={tag} className="flex items-center space-x-2">
              <Checkbox 
                id={tag} 
                checked={selectedTags.includes(tag)}
                onCheckedChange={() => handleTagChange(tag)}
              />
              <Label htmlFor={tag}>{tag}</Label>
            </div>
          ))}
        </div>
      </div>
      <Input
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        placeholder="Enter your code sample request"
      />
      <Button onClick={handleGenerateCode} disabled={isLoading || selectedTags.length === 0}>
        {isLoading ? 'Generating...' : 'Generate Code Sample'}
      </Button>
      {error && (
        <Alert variant="destructive">
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      {generatedContent && (
        <MarkdownRenderer content={generatedContent} />
      )}
    </div>
  )
}

