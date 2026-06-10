'use client'

import { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { useAuth } from '@/lib/auth-context'
import { generateFlashCards } from '@/lib/api'
import { KnowledgeBaseDialog } from '@/components/knowledge-base-dialog'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Upload, FileText, X, RotateCw } from 'lucide-react'

interface FlashCard {
  id: string
  front: string
  back: string
}

export default function FlashCardsGeneratorPage() {
  const { token } = useAuth()
  const [file, setFile] = useState<File | null>(null)
  const [selectedDocId, setSelectedDocId] = useState<string | null>(null)
  const [instructions, setInstructions] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [flashCards, setFlashCards] = useState<FlashCard[] | null>(null)
  const [currentCardIndex, setCurrentCardIndex] = useState(0)
  const [isFlipped, setIsFlipped] = useState(false)

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      setFile(acceptedFiles[0])
      setSelectedDocId(null)
    }
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'text/plain': ['.txt'],
      'text/csv': ['.csv'],
      'application/vnd.ms-excel': ['.xls'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'application/vnd.ms-powerpoint': ['.ppt'],
      'application/vnd.openxmlformats-officedocument.presentationml.presentation': ['.pptx'],
    },
    multiple: false,
  })

  const handleGenerateFromKB = async (docId: string) => {
    if (!token) return
    setSelectedDocId(docId)
    setFile(null)
    setIsLoading(true)
    setFlashCards(null)
    setCurrentCardIndex(0)
    setIsFlipped(false)

    try {
      const result = await generateFlashCards(docId, instructions, token, true)
      setFlashCards(result.cards)
    } catch (error) {
      console.error('Failed to generate flashcards:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleGenerate = async () => {
    if (!file || !token) return

    setIsLoading(true)
    setFlashCards(null)
    setCurrentCardIndex(0)
    setIsFlipped(false)

    try {
      const result = await generateFlashCards(file, instructions, token)
      setFlashCards(result.cards)
    } catch (error) {
      console.error('Failed to generate flashcards:', error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="mx-auto max-w-4xl">
      <Card>
        <CardHeader>
          <CardTitle>Create Flash Cards</CardTitle>
          <CardDescription>
            Upload a file or select from your knowledge base to generate flashcards
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-6">
          {/* Button Group */}
          <div className="flex gap-2">
            <KnowledgeBaseDialog onSelect={handleGenerateFromKB} disabled={isLoading} />
            <span className="flex items-center text-muted-foreground">or</span>
          </div>

          {/* Document Upload */}
          <div className="flex flex-col gap-2">
            <Label className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Document Upload
            </Label>
            <div
              {...getRootProps()}
              className={`flex min-h-40 cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed transition-colors ${
                isDragActive
                  ? 'border-primary bg-primary/5'
                  : 'border-muted-foreground/25 hover:border-primary/50'
              }`}
            >
              <input {...getInputProps()} />
              {file ? (
                <div className="flex items-center gap-2">
                  <FileText className="h-8 w-8 text-muted-foreground" />
                  <div className="text-center">
                    <p className="font-medium">{file.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {(file.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={(e) => {
                      e.stopPropagation()
                      setFile(null)
                    }}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <>
                  <Upload className="mb-2 h-8 w-8 text-muted-foreground" />
                  <p className="font-medium">Drag files</p>
                  <p className="text-sm text-muted-foreground">
                    Click to upload files (PDF, DOCX, TXT, CSV, Excel, PowerPoint)
                  </p>
                </>
              )}
            </div>
          </div>

          {/* Special Instructions */}
          <div className="flex flex-col gap-2">
            <Label className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Special Instructions
            </Label>
            <Textarea
              placeholder="E.g., Focus on definitions, medical terms, vocabulary..."
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              rows={4}
            />
            <p className="text-sm text-muted-foreground">
              Optional: Add any specific instructions for the flashcards.
            </p>
          </div>

          {/* Generate Button */}
          <Button
            onClick={handleGenerate}
            disabled={!file || isLoading}
            className="w-full bg-slate-600 hover:bg-slate-700"
            size="lg"
          >
            {isLoading ? 'Generating...' : 'Generate Flash Cards'}
          </Button>
          {!file && !selectedDocId && (
            <p className="text-center text-sm text-muted-foreground">
              Please upload a file or select from knowledge base to continue
            </p>
          )}
        </CardContent>
      </Card>

      {/* Flash Card Display */}
      {flashCards && flashCards.length > 0 && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Study Flash Cards</CardTitle>
            <CardDescription>
              Card {currentCardIndex + 1} of {flashCards.length}
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-6">
            {/* Card Flipper */}
            <div
              className="min-h-72 cursor-pointer rounded-lg border-2 border-dashed p-8 text-center transition-all hover:border-primary"
              onClick={() => setIsFlipped(!isFlipped)}
            >
              <div className="flex h-full items-center justify-center">
                <div>
                  <p className="text-sm text-muted-foreground mb-4">
                    {isFlipped ? 'Answer' : 'Question'}
                  </p>
                  <p className="text-2xl font-semibold">
                    {isFlipped ? flashCards[currentCardIndex].back : flashCards[currentCardIndex].front}
                  </p>
                  <p className="text-sm text-muted-foreground mt-4">Click to flip</p>
                </div>
              </div>
            </div>

            {/* Navigation */}
            <div className="flex gap-2 justify-center">
              <Button
                variant="outline"
                onClick={() => setCurrentCardIndex(Math.max(0, currentCardIndex - 1))}
                disabled={currentCardIndex === 0}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                onClick={() => setIsFlipped(!isFlipped)}
                className="gap-2"
              >
                <RotateCw className="h-4 w-4" />
                Flip
              </Button>
              <Button
                variant="outline"
                onClick={() => setCurrentCardIndex(Math.min(flashCards.length - 1, currentCardIndex + 1))}
                disabled={currentCardIndex === flashCards.length - 1}
              >
                Next
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}