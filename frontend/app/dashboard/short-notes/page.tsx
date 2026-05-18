"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useAuth } from "@/lib/auth-context"
import { getSavedNotes } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Plus, FileText, Clock, ChevronRight } from "lucide-react"

interface SavedNote {
  id: string
  title: string
  content: string
  created_at: string
}

export default function ShortNotesListPage() {
  const { user, token } = useAuth()
  const [notes, setNotes] = useState<SavedNote[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchNotes = async () => {
      if (!token) return
      try {
        const data = await getSavedNotes(token)
        setNotes(data.notes || [])
      } catch (error) {
        console.error("Failed to fetch notes:", error)
      } finally {
        setIsLoading(false)
      }
    }
    fetchNotes()
  }, [token])

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    })
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Hey, {user?.email?.split("@")[0] || "User"}</h1>
        <p className="text-muted-foreground">Let Socratic Tutor generate your exams and help you ace your scores!</p>
      </div>

      {/* Title and Action */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Your Short Notes</h2>
        <Button asChild className="gap-2 bg-primary text-primary-foreground hover:bg-primary/90">
          <Link href="/dashboard/short-notes/create">
            <Plus className="h-4 w-4" />
            Generate a New Short Note
          </Link>
        </Button>
      </div>

      {/* Content */}
      {isLoading ? (
        <Card>
          <CardContent className="flex min-h-64 items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          </CardContent>
        </Card>
      ) : notes.length === 0 ? (
        <Card className="bg-muted/30">
          <CardContent className="flex min-h-64 flex-col items-center justify-center gap-4 py-12">
            <div className="flex h-16 w-16 items-center justify-center rounded-lg border-2 border-dashed border-muted-foreground/25">
              <FileText className="h-8 w-8 text-muted-foreground/50" />
            </div>
            <p className="text-muted-foreground">No generated short notes yet. Start creating now!</p>
            <Button asChild className="gap-2 bg-primary text-primary-foreground hover:bg-primary/90">
              <Link href="/dashboard/short-notes/create">
                <Plus className="h-4 w-4" />
                Generate a New Short Note
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {notes.map((note) => (
            <Card key={note.id} className="group transition-shadow hover:shadow-md">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-start justify-between text-base">
                  <span className="line-clamp-2">{note.title || "Untitled Note"}</span>
                  <ChevronRight className="h-5 w-5 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-1" />
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="line-clamp-3 text-sm text-muted-foreground">{note.content}</p>
                <div className="mt-3 flex items-center gap-2 text-sm text-muted-foreground">
                  <Clock className="h-4 w-4" />
                  <span>{formatDate(note.created_at)}</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
