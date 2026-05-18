"use client"

import { useState, useCallback } from "react"
import { useDropzone } from "react-dropzone"
import { useAuth } from "@/lib/auth-context"
import { generateShortNotes } from "@/lib/api"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Upload, FileText, X } from "lucide-react"

export default function ShortNotesPage() {
  const { token } = useAuth()
  const [file, setFile] = useState<File | null>(null)
  const [instructions, setInstructions] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [generatedNotes, setGeneratedNotes] = useState<string | null>(null)

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
    setGeneratedNotes(null)

    try {
      const result = await generateShortNotes(file, instructions, token)
      setGeneratedNotes(result.content)
    } catch (error) {
      console.error("Failed to generate notes:", error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="mx-auto max-w-4xl">
      <Card>
        <CardHeader>
          <CardTitle>Create New Short Note</CardTitle>
          <CardDescription>
            Upload a file (PDF, DOCX, TXT, CSV, Excel, PowerPoint) to generate short notes
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-6">
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
                  ? "border-primary bg-primary/5"
                  : "border-muted-foreground/25 hover:border-primary/50"
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
              placeholder="E.g., Focus on chapter 3, include definitions, make it concise"
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              rows={4}
            />
            <p className="text-sm text-muted-foreground">
              Optional: Add any specific instructions or focus areas for the short note.
            </p>
          </div>

          {/* Generate Button */}
          <Button
            onClick={handleGenerate}
            disabled={!file || isLoading}
            className="w-full bg-slate-600 hover:bg-amber-600"
            size="lg"
          >
            {isLoading ? "Generating..." : "Generate Short Note"}
          </Button>
          {!file && (
            <p className="text-center text-sm text-muted-foreground">
              Please upload a file to continue
            </p>
          )}
        </CardContent>
      </Card>

      {/* Generated Notes */}
      {generatedNotes && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Generated Short Notes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="prose prose-sm max-w-none rounded-lg bg-muted/50 p-4">
              <pre className="whitespace-pre-wrap font-sans text-sm">
                {generatedNotes}
              </pre>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
