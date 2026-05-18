"use client"

import { useState, useCallback, useEffect } from "react"
import { useDropzone } from "react-dropzone"
import Link from "next/link"
import { useAuth } from "@/lib/auth-context"
import { generateFlashCards, getSavedFlashCards } from "@/lib/api"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Upload, FileText, X, Plus, AlertTriangle, RotateCw } from "lucide-react"

interface FlashCard {
  id: string
  front: string
  back: string
}

interface FlashCardSet {
  id: string
  title: string
  cards: FlashCard[]
}

export default function FlashCardsPage() {
  const { token } = useAuth()
  const [file, setFile] = useState<File | null>(null)
  const [instructions, setInstructions] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [flashCardSets, setFlashCardSets] = useState<FlashCardSet[]>([])
  const [showCreate, setShowCreate] = useState(false)
  const [currentSet, setCurrentSet] = useState<FlashCardSet | null>(null)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isFlipped, setIsFlipped] = useState(false)

  useEffect(() => {
    async function fetchFlashCards() {
      if (token) {
        try {
          const data = await getSavedFlashCards(token)
          setFlashCardSets(data.flashcards || [])
        } catch (error) {
          console.error("Failed to fetch flashcards:", error)
        }
      }
    }
    fetchFlashCards()
  }, [token])

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      setFile(acceptedFiles[0])
    }
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "application/pdf": [".pdf"],
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [".docx"],
      "text/plain": [".txt"],
      "text/csv": [".csv"],
      "application/vnd.ms-excel": [".xls"],
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [".xlsx"],
      "application/vnd.ms-powerpoint": [".ppt"],
      "application/vnd.openxmlformats-officedocument.presentationml.presentation": [".pptx"],
    },
    multiple: false,
  })

  const handleGenerate = async () => {
    if (!file || !token) return

    setIsLoading(true)

    try {
      const result = await generateFlashCards(file, instructions, token)
      const newSet: FlashCardSet = {
        id: result.flashcard_id,
        title: file.name,
        cards: result.cards,
      }
      setFlashCardSets((prev) => [newSet, ...prev])
      setFile(null)
      setInstructions("")
      setShowCreate(false)
    } catch (error) {
      console.error("Failed to generate flash cards:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const startStudying = (set: FlashCardSet) => {
    setCurrentSet(set)
    setCurrentIndex(0)
    setIsFlipped(false)
  }

  const nextCard = () => {
    if (currentSet && currentIndex < currentSet.cards.length - 1) {
      setCurrentIndex(currentIndex + 1)
      setIsFlipped(false)
    }
  }

  const prevCard = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1)
      setIsFlipped(false)
    }
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold text-foreground">Hey, User</h1>
        <p className="text-muted-foreground">
          Let Socratic Tutor generate your exams and help you ace your scores!
        </p>
      </div>

      {/* Warning Banner */}
      <Card className="border-red-200 bg-red-50/50">
        <CardContent className="flex flex-col items-start justify-between gap-4 py-4 sm:flex-row sm:items-center">
          <div className="flex items-start gap-3">
            <AlertTriangle className="mt-0.5 h-5 w-5 text-red-600" />
            <div>
              <p className="font-medium text-red-900">Free Tier Limitation</p>
              <p className="text-sm text-red-700">
                Free users only have data retention for 3 days. Upgrade your account for longer access.
              </p>
            </div>
          </div>
          <Button asChild className="shrink-0 bg-amber-600 hover:bg-amber-500">
            <Link href="/dashboard/settings">Upgrade</Link>
          </Button>
        </CardContent>
      </Card>

      {/* Study Mode */}
      {currentSet && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Studying: {currentSet.title}</span>
              <Button variant="ghost" onClick={() => setCurrentSet(null)}>
                <X className="h-4 w-4" />
              </Button>
            </CardTitle>
            <CardDescription>
              Card {currentIndex + 1} of {currentSet.cards.length}
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center gap-4">
            <div
              onClick={() => setIsFlipped(!isFlipped)}
              className="flex min-h-48 w-full max-w-md cursor-pointer items-center justify-center rounded-xl border-2 bg-muted/50 p-8 text-center transition-all hover:shadow-md"
            >
              <div>
                <p className="mb-2 text-xs uppercase tracking-wide text-muted-foreground">
                  {isFlipped ? "Answer" : "Question"}
                </p>
                <p className="text-lg font-medium">
                  {isFlipped
                    ? currentSet.cards[currentIndex]?.back
                    : currentSet.cards[currentIndex]?.front}
                </p>
              </div>
            </div>
            <p className="text-sm text-muted-foreground">
              Click the card to flip it
            </p>
            <div className="flex items-center gap-4">
              <Button
                variant="outline"
                onClick={prevCard}
                disabled={currentIndex === 0}
              >
                Previous
              </Button>
              <Button onClick={() => setIsFlipped(!isFlipped)}>
                <RotateCw className="mr-2 h-4 w-4" />
                Flip
              </Button>
              <Button
                variant="outline"
                onClick={nextCard}
                disabled={currentIndex === currentSet.cards.length - 1}
              >
                Next
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Flash Cards List */}
      <div>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold">Your Flash Cards</h2>
          <Button
            onClick={() => setShowCreate(!showCreate)}
            className="bg-amber-600 hover:bg-amber-500"
          >
            <Plus className="mr-2 h-4 w-4" />
            Generate a New Flash Cards
          </Button>
        </div>

        {showCreate && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Create New Flash Card</CardTitle>
              <CardDescription>
                Upload a file (PDF, DOCX, TXT, CSV, Excel, PowerPoint) to generate flash cards
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <Label className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Document Upload
                </Label>
                <div
                  {...getRootProps()}
                  className={`flex min-h-32 cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed transition-colors ${
                    isDragActive
                      ? "border-primary bg-primary/5"
                      : "border-muted-foreground/25 hover:border-primary/50"
                  }`}
                >
                  <input {...getInputProps()} />
                  {file ? (
                    <div className="flex items-center gap-2">
                      <FileText className="h-6 w-6 text-muted-foreground" />
                      <span className="font-medium">{file.name}</span>
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
                      <Upload className="mb-2 h-6 w-6 text-muted-foreground" />
                      <p className="font-medium">Drag files</p>
                      <p className="text-sm text-muted-foreground">
                        Click to upload files (PDF, DOCX, TXT, CSV, Excel, PowerPoint)
                      </p>
                    </>
                  )}
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <Label className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Special Instructions
                </Label>
                <Textarea
                  placeholder="E.g., Focus on chapter 3, include definitions, make it concise"
                  value={instructions}
                  onChange={(e) => setInstructions(e.target.value)}
                  rows={3}
                />
                <p className="text-sm text-muted-foreground">
                  Optional: Add any specific instructions or focus areas for the flash cards.
                </p>
              </div>

              <Button
                onClick={handleGenerate}
                disabled={!file || isLoading}
                className="bg-slate-600 hover:bg-amber-600"
              >
                {isLoading ? "Generating..." : "Generate Flash Cards"}
              </Button>
              {!file && (
                <p className="text-center text-sm text-muted-foreground">
                  Please upload a file to continue
                </p>
              )}
            </CardContent>
          </Card>
        )}

        <Card className="bg-muted/30">
          <CardContent className="flex min-h-64 flex-col items-center justify-center py-12">
            {flashCardSets.length === 0 ? (
              <>
                <div className="mb-4 rounded-lg border-2 border-dashed border-muted-foreground/25 p-4">
                  <FileText className="h-8 w-8 text-muted-foreground" />
                </div>
                <p className="mb-4 text-muted-foreground">
                  No generated flash cards yet. Start creating now!
                </p>
                <Button
                  onClick={() => setShowCreate(true)}
                  className="bg-amber-600 hover:bg-amber-500"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Generate a New Flash Card
                </Button>
              </>
            ) : (
              <div className="w-full">
                {flashCardSets.map((set) => (
                  <div
                    key={set.id}
                    className="flex items-center justify-between border-b p-4 last:border-0"
                  >
                    <div>
                      <p className="font-medium">{set.title}</p>
                      <p className="text-sm text-muted-foreground">
                        {set.cards.length} cards
                      </p>
                    </div>
                    <Button onClick={() => startStudying(set)} variant="outline">
                      Study
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
