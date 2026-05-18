"use client"

import { useCallback, useState } from "react"
import { useDropzone } from "react-dropzone"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Upload, FileText, X, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"

interface UploadedFile {
  id: string
  name: string
  size: number
  status: "pending" | "uploading" | "success" | "error"
}

export function DocumentUpload() {
  const [files, setFiles] = useState<UploadedFile[]>([])
  const [instructions, setInstructions] = useState("")
  const [isUploading, setIsUploading] = useState(false)

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const newFiles: UploadedFile[] = acceptedFiles.map((file) => ({
      id: Math.random().toString(36).substring(7),
      name: file.name,
      size: file.size,
      status: "pending" as const,
    }))
    setFiles((prev) => [...prev, ...newFiles])
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "application/pdf": [".pdf"],
    },
    maxSize: 10 * 1024 * 1024, // 10MB
  })

  const removeFile = (id: string) => {
    setFiles((prev) => prev.filter((f) => f.id !== id))
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes"
    const k = 1024
    const sizes = ["Bytes", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
  }

  const handleUpload = async () => {
    if (files.length === 0) return
    
    setIsUploading(true)
    // TODO: Implement actual upload to backend
    await new Promise((resolve) => setTimeout(resolve, 2000))
    setFiles((prev) =>
      prev.map((f) => ({ ...f, status: "success" as const }))
    )
    setIsUploading(false)
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Upload Documents</CardTitle>
          <CardDescription>
            Upload a PDF file to add to your knowledge base for tutoring
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Document Upload Section */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-muted-foreground" />
              <Label className="text-base font-medium">Document Upload</Label>
            </div>
            <div
              {...getRootProps()}
              className={cn(
                "border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors",
                isDragActive
                  ? "border-primary bg-primary/5"
                  : "border-border hover:border-primary/50 hover:bg-muted/50"
              )}
            >
              <input {...getInputProps()} />
              <div className="flex flex-col items-center gap-2">
                <div className="flex h-12 w-12 items-center justify-center rounded-full border bg-background">
                  <Upload className="h-5 w-5 text-muted-foreground" />
                </div>
                <div>
                  <p className="font-medium text-foreground">Drag files</p>
                  <p className="text-sm text-muted-foreground">
                    Click to upload files (PDF)
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Uploaded Files List */}
          {files.length > 0 && (
            <div className="space-y-2">
              {files.map((file) => (
                <div
                  key={file.id}
                  className="flex items-center justify-between p-3 rounded-lg border bg-muted/30"
                >
                  <div className="flex items-center gap-3">
                    <FileText className="h-5 w-5 text-primary" />
                    <div>
                      <p className="text-sm font-medium text-foreground">{file.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatFileSize(file.size)}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => removeFile(file.id)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}

          {/* Special Instructions */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-muted-foreground" />
              <Label className="text-base font-medium">Special Instructions</Label>
            </div>
            <Textarea
              placeholder="E.g., Focus on chapter 3, include definitions, make it concise"
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              className="min-h-[120px] resize-none"
            />
            <p className="text-sm text-muted-foreground">
              Optional: Add any specific instructions or focus areas for the knowledge base.
            </p>
          </div>

          {/* Upload Button */}
          <Button
            className="w-full"
            size="lg"
            disabled={files.length === 0 || isUploading}
            onClick={handleUpload}
          >
            {isUploading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : (
              "Upload to Knowledge Base"
            )}
          </Button>
          {files.length === 0 && (
            <p className="text-center text-sm text-muted-foreground">
              Please upload a file to continue
            </p>
          )}
        </CardContent>
      </Card>

      {/* Help Section */}
      <p className="text-center text-sm text-muted-foreground">
        Need help? Check our{" "}
        <a href="#" className="underline hover:text-foreground">
          FAQ
        </a>{" "}
        or{" "}
        <a href="#" className="underline hover:text-foreground">
          contact support
        </a>
      </p>
    </div>
  )
}

// Needed for the special instructions icon
import { BookOpen } from "lucide-react"
