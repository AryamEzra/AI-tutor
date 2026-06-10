'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/lib/auth-context'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import Link from 'next/link'
import { Plus, Database, FileText } from 'lucide-react'

interface Document {
  id: string
  filename: string
  created_at: string
  size: number
}

export default function KnowledgeBasePage() {
  const { user, token } = useAuth()
  const [documents, setDocuments] = useState<Document[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!token) return
    fetchDocuments()
  }, [token])

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
      setError(err instanceof Error ? err.message : 'Failed to fetch documents')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (docId: string) => {
    if (!confirm('Are you sure you want to delete this document?')) return
    try {
      const res = await fetch(`http://localhost:8000/knowledge-base/documents/${docId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) throw new Error('Failed to delete document')
      setDocuments(documents.filter(d => d.id !== docId))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete document')
    }
  }

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-3xl font-bold">Build Knowledge Base</h1>
        <p className="text-muted-foreground">Manage your documents and reuse them across all study tools</p>
      </div>

      <div className="flex justify-end">
        <Link href="/dashboard/knowledge-base/add">
          <Button className="gap-2 bg-amber-500 hover:bg-amber-600">
            <Plus className="h-4 w-4" />
            Add Document
          </Button>
        </Link>
      </div>

      {loading ? (
        <div className="text-center py-12">Loading documents...</div>
      ) : error ? (
        <div className="text-center py-12 text-destructive">{error}</div>
      ) : documents.length === 0 ? (
        <Card className="flex flex-col items-center justify-center py-12">
          <Database className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">No documents yet</h3>
          <p className="text-muted-foreground mb-6">Start building your knowledge base by adding documents</p>
          <Link href="/dashboard/knowledge-base/add">
            <Button className="gap-2 bg-amber-500 hover:bg-amber-600">
              <Plus className="h-4 w-4" />
              Add First Document
            </Button>
          </Link>
        </Card>
      ) : (
        <div className="grid gap-4">
          {documents.map((doc) => (
            <Card key={doc.id} className="p-4 flex items-center justify-between hover:bg-accent transition-colors">
              <div className="flex items-center gap-3">
                <FileText className="h-5 w-5 text-amber-500" />
                <div>
                  <h3 className="font-semibold">{doc.filename}</h3>
                  <p className="text-sm text-muted-foreground">
                    {new Date(doc.created_at).toLocaleDateString()} • {(doc.size / 1024).toFixed(2)} KB
                  </p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleDelete(doc.id)}
                className="text-destructive"
              >
                Delete
              </Button>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
