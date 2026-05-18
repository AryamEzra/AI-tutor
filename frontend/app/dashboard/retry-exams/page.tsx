"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useAuth } from "@/lib/auth-context"
import { getSavedExams } from "@/lib/api"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { AlertTriangle, FileText, Plus, CheckCircle, XCircle } from "lucide-react"

interface ExamQuestion {
  id: string
  question: string
  options: string[]
  correct_answer: string
}

interface SavedExam {
  id: string
  title: string
  created_at: string
  questions: ExamQuestion[]
}

export default function RetryExamsPage() {
  const { token } = useAuth()
  const [exams, setExams] = useState<SavedExam[]>([])
  const [currentExam, setCurrentExam] = useState<SavedExam | null>(null)
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, string>>({})
  const [showResults, setShowResults] = useState(false)

  useEffect(() => {
    async function fetchExams() {
      if (token) {
        try {
          const data = await getSavedExams(token)
          setExams(data.exams || [])
        } catch (error) {
          console.error("Failed to fetch exams:", error)
        }
      }
    }
    fetchExams()
  }, [token])

  const startExam = (exam: SavedExam) => {
    setCurrentExam(exam)
    setSelectedAnswers({})
    setShowResults(false)
  }

  const handleAnswerSelect = (questionId: string, answer: string) => {
    if (showResults) return
    setSelectedAnswers((prev) => ({ ...prev, [questionId]: answer }))
  }

  const handleSubmitExam = () => {
    setShowResults(true)
  }

  const calculateScore = () => {
    if (!currentExam) return 0
    let correct = 0
    currentExam.questions.forEach((q) => {
      if (selectedAnswers[q.id] === q.correct_answer) {
        correct++
      }
    })
    return correct
  }

  const exitExam = () => {
    setCurrentExam(null)
    setSelectedAnswers({})
    setShowResults(false)
  }

  if (currentExam) {
    return (
      <div className="mx-auto max-w-4xl">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>{currentExam.title}</span>
              <Button variant="ghost" onClick={exitExam}>
                Exit
              </Button>
            </CardTitle>
            <CardDescription>
              {showResults
                ? `Score: ${calculateScore()} / ${currentExam.questions.length}`
                : "Answer all questions and submit"}
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-6">
            {currentExam.questions.map((q, index) => (
              <div key={q.id} className="flex flex-col gap-3 rounded-lg border p-4">
                <p className="font-medium">
                  {index + 1}. {q.question}
                </p>
                <div className="flex flex-col gap-2">
                  {q.options.map((option, optionIndex) => {
                    const isSelected = selectedAnswers[q.id] === option
                    const isCorrect = option === q.correct_answer
                    const showCorrectness = showResults

                    return (
                      <button
                        key={optionIndex}
                        onClick={() => handleAnswerSelect(q.id, option)}
                        disabled={showResults}
                        className={`flex items-center gap-2 rounded-lg border p-3 text-left transition-colors ${
                          showCorrectness
                            ? isCorrect
                              ? "border-green-500 bg-green-50 text-green-900"
                              : isSelected
                                ? "border-red-500 bg-red-50 text-red-900"
                                : "border-muted"
                            : isSelected
                              ? "border-primary bg-primary/5"
                              : "border-muted hover:border-primary/50"
                        }`}
                      >
                        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-sm">
                          {String.fromCharCode(65 + optionIndex)}
                        </span>
                        <span className="flex-1">{option}</span>
                        {showCorrectness && isCorrect && (
                          <CheckCircle className="h-5 w-5 text-green-600" />
                        )}
                        {showCorrectness && isSelected && !isCorrect && (
                          <XCircle className="h-5 w-5 text-red-600" />
                        )}
                      </button>
                    )
                  })}
                </div>
              </div>
            ))}

            {!showResults && (
              <Button
                onClick={handleSubmitExam}
                disabled={Object.keys(selectedAnswers).length !== currentExam.questions.length}
                className="w-full"
                size="lg"
              >
                Submit Exam
              </Button>
            )}
            {showResults && (
              <Button onClick={exitExam} className="w-full" size="lg">
                Back to Saved Exams
              </Button>
            )}
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold text-foreground">Retry Saved Exams</h1>
        <p className="text-muted-foreground">
          Test yourself with previously attempted exams and see how much you&apos;ve improved.
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

      {/* Exams List */}
      <div>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold">Your Saved Exams</h2>
          <Button asChild className="bg-amber-600 hover:bg-amber-500">
            <Link href="/dashboard/exam-generator">
              <Plus className="mr-2 h-4 w-4" />
              Create New Exam
            </Link>
          </Button>
        </div>

        <Card className="bg-muted/30">
          <CardContent className="flex min-h-64 flex-col items-center justify-center py-12">
            {exams.length === 0 ? (
              <>
                <div className="mb-4 rounded-lg border-2 border-dashed border-muted-foreground/25 p-4">
                  <FileText className="h-8 w-8 text-muted-foreground" />
                </div>
                <p className="mb-4 text-muted-foreground">
                  No saved exams yet. Generate your first exam!
                </p>
                <Button asChild className="bg-amber-600 hover:bg-amber-500">
                  <Link href="/dashboard/exam-generator">
                    <Plus className="mr-2 h-4 w-4" />
                    Create First Exam
                  </Link>
                </Button>
              </>
            ) : (
              <div className="w-full">
                {exams.map((exam) => (
                  <div
                    key={exam.id}
                    className="flex items-center justify-between border-b p-4 last:border-0"
                  >
                    <div>
                      <p className="font-medium">{exam.title}</p>
                      <p className="text-sm text-muted-foreground">
                        {exam.questions.length} questions -{" "}
                        {new Date(exam.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <Button onClick={() => startExam(exam)} variant="outline">
                      Retry
                    </Button>
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
