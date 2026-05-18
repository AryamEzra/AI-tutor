"use client"

import { useState, useCallback, useEffect } from "react"
import { useDropzone } from "react-dropzone"
import Link from "next/link"
import { useAuth } from "@/lib/auth-context"
import { generateAudio, getSavedAudiobooks } from "@/lib/api"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Upload, FileText, X, Plus, AlertTriangle, Play, Pause } from "lucide-react"

interface Audiobook {
  id: string
  title: string
  audio_url: string
  created_at: string
}

export default function NotesToAudioPage() {
  const { token } = useAuth()
  const [file, setFile] = useState<File | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [audiobooks, setAudiobooks] = useState<Audiobook[]>([])
  const [currentlyPlaying, setCurrentlyPlaying] = useState<string | null>(null)
  const [showCreate, setShowCreate] = useState(false)

  useEffect(() => {
    async function fetchAudiobooks() {
      if (token) {
        try {
          const data = await getSavedAudiobooks(token)
          setAudiobooks(data.audiobooks || [])
        } catch (error) {
          console.error("Failed to fetch audiobooks:", error)
        }
      }
    }
    fetchAudiobooks()
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
    },
    multiple: false,
  })

  const handleGenerate = async () => {
    if (!file || !token) return

    setIsLoading(true)

    try {
      const result = await generateAudio(file, token)
      const newAudiobook: Audiobook = {
        id: result.audiobook_id,
        title: file.name,
        audio_url: result.audio_url,
        created_at: new Date().toISOString(),
      }
      setAudiobooks((prev) => [newAudiobook, ...prev])
      setFile(null)
      setShowCreate(false)
    } catch (error) {
      console.error("Failed to generate audio:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const togglePlay = (id: string) => {
    if (currentlyPlaying === id) {
      setCurrentlyPlaying(null)
    } else {
      setCurrentlyPlaying(id)
    }
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold text-foreground">Hey, {token ? "User" : "Guest"}</h1>
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

      {/* Audiobooks List */}
      <div>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold">Your Audiobooks</h2>
          <Button
            onClick={() => setShowCreate(!showCreate)}
            className="bg-amber-600 hover:bg-amber-500"
          >
            <Plus className="mr-2 h-4 w-4" />
            Generate a New Audiobook
          </Button>
        </div>

        {showCreate && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Create New Audiobook</CardTitle>
              <CardDescription>
                Upload a file to generate an audio version
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
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
                    <p className="text-sm text-muted-foreground">
                      Drop your file here or click to browse
                    </p>
                  </>
                )}
              </div>
              <Button
                onClick={handleGenerate}
                disabled={!file || isLoading}
                className="bg-slate-600 hover:bg-amber-600"
              >
                {isLoading ? "Generating..." : "Generate Audiobook"}
              </Button>
            </CardContent>
          </Card>
        )}

        <Card className="bg-muted/30">
          <CardContent className="flex min-h-64 flex-col items-center justify-center py-12">
            {audiobooks.length === 0 ? (
              <>
                <div className="mb-4 rounded-lg border-2 border-dashed border-muted-foreground/25 p-4">
                  <FileText className="h-8 w-8 text-muted-foreground" />
                </div>
                <p className="mb-4 text-muted-foreground">
                  No generated audiobook yet. Start creating now!
                </p>
                <Button
                  onClick={() => setShowCreate(true)}
                  className="bg-amber-600 hover:bg-amber-500"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Generate First Audiobook
                </Button>
              </>
            ) : (
              <div className="w-full">
                {audiobooks.map((audiobook) => (
                  <div
                    key={audiobook.id}
                    className="flex items-center justify-between border-b p-4 last:border-0"
                  >
                    <div className="flex items-center gap-3">
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => togglePlay(audiobook.id)}
                      >
                        {currentlyPlaying === audiobook.id ? (
                          <Pause className="h-4 w-4" />
                        ) : (
                          <Play className="h-4 w-4" />
                        )}
                      </Button>
                      <div>
                        <p className="font-medium">{audiobook.title}</p>
                        <p className="text-sm text-muted-foreground">
                          {new Date(audiobook.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
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
