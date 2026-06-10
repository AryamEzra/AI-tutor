'use client'

import { useState } from 'react'
import { useAuth } from '@/lib/auth-context'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Database, Loader2 } from 'lucide-react'

interface Document {
  id: string
  filename: string
  created_at: string
}

interface KnowledgeBaseDialogProps {
  onSelect: (docId: string) => void
  disabled?: boolean
}

export function KnowledgeBaseDialog({ onSelect, disabled }: KnowledgeBaseDialogProps) {
  const { token } = useAuth()
  const [open, setOpen] = useState(false)
  const [documents, setDocuments] = useState<Document[]>([])
  const [loading, setLoading] = useState(false)

  const handleOpenChange = async (newOpen: boolean) => {
    setOpen(newOpen)
    if (newOpen && documents.length === 0 && token) {
      await fetchDocuments()
    }
  }

  const fetchDocuments = async () => {
    try {
      setLoading(true)
      const res = await fetch('http://localhost:8000/knowledge-base/documents', {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) throw new Error('Failed to fetch documents')
      const data = await res.json()
      setDocuments(data.documents || [])
    } catch (err) {
      console.error('Failed to fetch documents:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleSelect = (docId: string) => {
    onSelect(docId)
    setOpen(false)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant="outline" disabled={disabled} className="gap-2">
          <Database className="h-4 w-4" />
          From Knowledge Base
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Select Document</DialogTitle>
          <DialogDescription>Choose a document from your knowledge base</DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : documents.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground">No documents in knowledge base</p>
            <p className="text-sm text-muted-foreground mt-2">Add documents to your knowledge base first</p>
          </div>
        ) : (
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {documents.map((doc) => (
              <Card
                key={doc.id}
                className="p-3 cursor-pointer hover:bg-accent transition-colors"
                onClick={() => handleSelect(doc.id)}
              >
                <p className="font-medium truncate">{doc.filename}</p>
                <p className="text-xs text-muted-foreground">
                  {new Date(doc.created_at).toLocaleDateString()}
                </p>
              </Card>
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
