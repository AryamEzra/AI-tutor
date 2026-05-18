"use client"

import { useState, useCallback } from "react"
import { useDropzone } from "react-dropzone"
import { useAuth } from "@/lib/auth-context"
import { checkEquation } from "@/lib/api"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Upload, ImageIcon, X, CheckCircle, XCircle } from "lucide-react"
import Image from "next/image"

interface EquationResult {
  is_correct: boolean
  explanation: string
  correct_answer?: string
}

export default function TryEquationsPage() {
  const { token } = useAuth()
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [result, setResult] = useState<EquationResult | null>(null)

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      const selectedFile = acceptedFiles[0]
      setFile(selectedFile)
      setResult(null)
      
      // Create preview
      const reader = new FileReader()
      reader.onloadend = () => {
        setPreview(reader.result as string)
      }
      reader.readAsDataURL(selectedFile)
    }
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "image/jpeg": [".jpg", ".jpeg"],
      "image/png": [".png"],
      "image/gif": [".gif"],
      "image/webp": [".webp"],
    },
    multiple: false,
  })

  const handleCheck = async () => {
    if (!file || !token) return

    setIsLoading(true)
    setResult(null)

    try {
      const response = await checkEquation(file, token)
      setResult(response)
    } catch (error) {
      console.error("Failed to check equation:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const clearFile = () => {
    setFile(null)
    setPreview(null)
    setResult(null)
  }

  return (
    <div className="mx-auto max-w-4xl">
      <Card>
        <CardHeader>
          <CardTitle>Try Equations</CardTitle>
          <CardDescription>
            Upload a photo of your math work or equation exercises to check your answers
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-6">
          {/* Image Upload */}
          <div className="flex flex-col gap-2">
            <Label className="flex items-center gap-2">
              <ImageIcon className="h-4 w-4" />
              Photo Upload
            </Label>
            <div
              {...getRootProps()}
              className={`flex min-h-48 cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed transition-colors ${
                isDragActive
                  ? "border-primary bg-primary/5"
                  : "border-muted-foreground/25 hover:border-primary/50"
              }`}
            >
              <input {...getInputProps()} />
              {preview ? (
                <div className="relative flex w-full flex-col items-center gap-2 p-4">
                  <div className="relative h-48 w-full">
                    <Image
                      src={preview}
                      alt="Uploaded equation"
                      fill
                      className="rounded-lg object-contain"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium">{file?.name}</p>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={(e) => {
                        e.stopPropagation()
                        clearFile()
                      }}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ) : (
                <>
                  <Upload className="mb-2 h-8 w-8 text-muted-foreground" />
                  <p className="font-medium">Drag photos here</p>
                  <p className="text-sm text-muted-foreground">
                    Click to upload images (JPG, PNG, GIF, WebP)
                  </p>
                </>
              )}
            </div>
          </div>

          {/* Instructions */}
          <div className="rounded-lg bg-muted/50 p-4">
            <h4 className="mb-2 font-medium">Tips for best results:</h4>
            <ul className="flex flex-col gap-1 text-sm text-muted-foreground">
              <li>- Make sure your handwriting is clear and legible</li>
              <li>- Include the complete equation or problem</li>
              <li>- Ensure good lighting and minimal blur</li>
              <li>- Show all your work for step-by-step verification</li>
            </ul>
          </div>

          {/* Check Button */}
          <Button
            onClick={handleCheck}
            disabled={!file || isLoading}
            className="w-full bg-slate-600 hover:bg-amber-600"
            size="lg"
          >
            {isLoading ? "Checking..." : "Check My Answer"}
          </Button>
          {!file && (
            <p className="text-center text-sm text-muted-foreground">
              Please upload an image to continue
            </p>
          )}
        </CardContent>
      </Card>

      {/* Result */}
      {result && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {result.is_correct ? (
                <>
                  <CheckCircle className="h-6 w-6 text-green-600" />
                  <span className="text-green-600">Correct!</span>
                </>
              ) : (
                <>
                  <XCircle className="h-6 w-6 text-red-600" />
                  <span className="text-red-600">Not quite right</span>
                </>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <div className="rounded-lg bg-muted/50 p-4">
              <h4 className="mb-2 font-medium">Explanation:</h4>
              <p className="text-sm text-muted-foreground">{result.explanation}</p>
            </div>
            {result.correct_answer && (
              <div className="rounded-lg border border-green-200 bg-green-50 p-4">
                <h4 className="mb-2 font-medium text-green-900">Correct Answer:</h4>
                <p className="text-sm text-green-800">{result.correct_answer}</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
