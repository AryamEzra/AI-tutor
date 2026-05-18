"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useAuth } from "@/lib/auth-context"
import { getSavedExams } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Plus, FileText, Clock, ChevronRight } from "lucide-react"

interface SavedExam {
  id: string
  title: string
  created_at: string
  questions: Array<{ id: string; question: string }>
}

export default function ExamGeneratorListPage() {
  const { user, token, isLoading: authLoading } = useAuth()
  const [exams, setExams] = useState<SavedExam[]>([])
  const [isLoadingExams, setIsLoadingExams] = useState(true)

  useEffect(() => {
    const fetchExams = async () => {
      if (!token || authLoading) return
      try {
        const data = await getSavedExams(token)
        setExams(data.exams || [])
      } catch (error) {
        console.error("Failed to fetch exams:", error)
      } finally {
        setIsLoadingExams(false)
      }
    }
    fetchExams()
  }, [token, authLoading])

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
        <h2 className="text-xl font-semibold">Your Exams</h2>
        <Button asChild className="gap-2 bg-primary text-primary-foreground hover:bg-primary/90">
          <Link href="/dashboard/exam-generator/create">
            <Plus className="h-4 w-4" />
            Generate New Exam
          </Link>
        </Button>
      </div>

      {/* Content */}
      {isLoadingExams ? (
        <Card>
          <CardContent className="flex min-h-64 items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          </CardContent>
        </Card>
      ) : exams.length === 0 ? (
        <Card className="bg-muted/30">
          <CardContent className="flex min-h-64 flex-col items-center justify-center gap-4 py-12">
            <div className="flex h-16 w-16 items-center justify-center rounded-lg border-2 border-dashed border-muted-foreground/25">
              <FileText className="h-8 w-8 text-muted-foreground/50" />
            </div>
            <p className="text-muted-foreground">No generated exams yet. Start creating now!</p>
            <Button asChild className="gap-2 bg-primary text-primary-foreground hover:bg-primary/90">
              <Link href="/dashboard/exam-generator/create">
                <Plus className="h-4 w-4" />
                Generate First Exam
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {exams.map((exam) => (
            <Card key={exam.id} className="group transition-shadow hover:shadow-md">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-start justify-between text-base">
                  <span className="line-clamp-2">{exam.title || "Untitled Exam"}</span>
                  <ChevronRight className="h-5 w-5 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-1" />
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col gap-2 text-sm text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    <span>{exam.questions?.length || 0} questions</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    <span>{formatDate(exam.created_at)}</span>
                  </div>
                </div>
                <Button asChild variant="outline" className="mt-4 w-full">
                  <Link href={`/dashboard/retry-exams/${exam.id}`}>
                    Take Exam
                  </Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
