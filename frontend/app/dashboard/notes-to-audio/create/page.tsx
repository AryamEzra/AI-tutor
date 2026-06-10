'use client'

import { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { useAuth } from '@/lib/auth-context'
import { generateAudio } from '@/lib/api'
import { KnowledgeBaseDialog } from '@/components/knowledge-base-dialog'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Upload, FileText, X, Play, Download } from 'lucide-react'

export default function AudioGeneratorPage() {
  const { token } = useAuth()
  const [file, setFile] = useState<File | null>(null)
  const [selectedDocId, setSelectedDocId] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [audioUrl, setAudioUrl] = useState<string | null>(null)

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
    setAudioUrl(null)

    try {
      const result = await generateAudio(docId, token, true)
      setAudioUrl(result.audio_url)
    } catch (error) {
      console.error('Failed to generate audio:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleGenerate = async () => {
    if (!file || !token) return

    setIsLoading(true)
    setAudioUrl(null)

    try {
      const result = await generateAudio(file, token)
      setAudioUrl(result.audio_url)
    } catch (error) {
      console.error('Failed to generate audio:', error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="mx-auto max-w-4xl">
      <Card>
        <CardHeader>
          <CardTitle>Generate Audio</CardTitle>
          <CardDescription>
            Upload a file or select from your knowledge base to generate audio
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

          {/* Generate Button */}
          <Button
            onClick={handleGenerate}
            disabled={!file || isLoading}
            className="w-full bg-slate-600 hover:bg-slate-700"
            size="lg"
          >
            {isLoading ? 'Generating...' : 'Generate Audio'}
          </Button>
          {!file && !selectedDocId && (
            <p className="text-center text-sm text-muted-foreground">
              Please upload a file or select from knowledge base to continue
            </p>
          )}
        </CardContent>
      </Card>

      {/* Audio Player */}
      {audioUrl && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Your Audiobook</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <audio
              controls
              className="w-full"
              src={audioUrl}
            >
              Your browser does not support the audio element.
            </audio>
            <a href={audioUrl} download>
              <Button className="w-full gap-2" variant="outline">
                <Download className="h-4 w-4" />
                Download Audio
              </Button>
            </a>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
