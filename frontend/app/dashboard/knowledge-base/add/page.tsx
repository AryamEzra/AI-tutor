'use client'

import { useState } from 'react'
import { useAuth } from '@/lib/auth-context'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Upload } from 'lucide-react'
import { useDropzone } from 'react-dropzone'

export default function AddDocumentPage() {
  const { token } = useAuth()
  const router = useRouter()
  const [file, setFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const onDrop = (acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      setFile(acceptedFiles[0])
      setError(null)
    }
  }

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'text/plain': ['.txt'],
      'text/csv': ['.csv'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'application/vnd.ms-powerpoint': ['.ppt'],
      'application/vnd.openxmlformats-officedocument.presentationml.presentation': ['.pptx'],
    },
  })

  const handleUpload = async () => {
    if (!file || !token) return

    try {
      setLoading(true)
      setError(null)
      
      const formData = new FormData()
      formData.append('file', file)

      const res = await fetch('http://localhost:8000/knowledge-base/documents', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      })

      if (!res.ok) {
        const error = await res.json().catch(() => ({ detail: 'Upload failed' }))
        throw new Error(error.detail || 'Upload failed')
      }

      router.push('/dashboard/knowledge-base')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-3xl font-bold">Add Document to Knowledge Base</h1>
        <p className="text-muted-foreground">Upload a file to add to your knowledge base</p>
      </div>

      <Card className="p-8 space-y-6">
        <div
          {...getRootProps()}
          className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
            isDragActive ? 'border-amber-500 bg-amber-50 dark:bg-amber-950/20' : 'border-muted'
          }`}
        >
          <input {...getInputProps()} />
          <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <h3 className="font-semibold mb-2">Drag files here or click to select</h3>
          <p className="text-sm text-muted-foreground">
            Supports PDF, DOCX, TXT, CSV, Excel, PowerPoint
          </p>
        </div>

        {file && (
          <div className="p-4 bg-accent rounded-lg flex items-center justify-between">
            <div>
              <p className="font-semibold">{file.name}</p>
              <p className="text-sm text-muted-foreground">{(file.size / 1024).toFixed(2)} KB</p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setFile(null)}
            >
              Remove
            </Button>
          </div>
        )}

        {error && (
          <div className="p-4 bg-destructive/10 text-destructive rounded-lg">
            {error}
          </div>
        )}

        <Button
          onClick={handleUpload}
          disabled={!file || loading}
          className="w-full bg-amber-500 hover:bg-amber-600"
          size="lg"
        >
          {loading ? 'Uploading...' : 'Upload Document'}
        </Button>
      </Card>
    </div>
  )
}
