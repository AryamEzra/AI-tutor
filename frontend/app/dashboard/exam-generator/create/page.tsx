'use client'

import { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { useAuth } from '@/lib/auth-context'
import { generateExam } from '@/lib/api'
import { KnowledgeBaseDialog } from '@/components/knowledge-base-dialog'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Upload, FileText, Info, X, CheckCircle, XCircle } from 'lucide-react'

interface ExamQuestion {
  id: string
  question: string
  options: string[]
  correct_answer: string
}

export default function ExamGeneratorPage() {
  const { token } = useAuth()
  const [file, setFile] = useState<File | null>(null)
  const [selectedDocId, setSelectedDocId] = useState<string | null>(null)
  const [numQuestions, setNumQuestions] = useState('10')
  const [instructions, setInstructions] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [questions, setQuestions] = useState<ExamQuestion[] | null>(null)
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, string>>({})
  const [showResults, setShowResults] = useState(false)

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
    setQuestions(null)
    setSelectedAnswers({})
    setShowResults(false)

    try {
      const result = await generateExam(docId, parseInt(numQuestions), instructions, token, true)
      setQuestions(result.questions)
    } catch (error) {
      console.error('Failed to generate exam:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleGenerate = async () => {
    if (!file || !token) return

    setIsLoading(true)
    setQuestions(null)
    setSelectedAnswers({})
    setShowResults(false)

    try {
      const result = await generateExam(file, parseInt(numQuestions), instructions, token)
      setQuestions(result.questions)
    } catch (error) {
      console.error('Failed to generate exam:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleAnswerSelect = (questionId: string, answer: string) => {
    if (showResults) return
    setSelectedAnswers((prev) => ({ ...prev, [questionId]: answer }))
  }

  const handleSubmitExam = () => {
    setShowResults(true)
  }

  const calculateScore = () => {
    if (!questions) return 0
    let correct = 0
    questions.forEach((q) => {
      if (selectedAnswers[q.id] === q.correct_answer) {
        correct++
      }
    })
    return correct
  }

  return (
    <div className="mx-auto max-w-4xl">
      <Card>
        <CardHeader>
          <CardTitle>Create New Exam</CardTitle>
          <CardDescription>
            Upload a file or select from your knowledge base to generate exam questions
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

          {/* Number of Questions */}
          <div className="flex flex-col gap-2">
            <Label className="flex items-center gap-2">
              <span className="grid grid-cols-2 gap-0.5">
                <span className="h-1 w-1 rounded-full bg-current" />
                <span className="h-1 w-1 rounded-full bg-current" />
                <span className="h-1 w-1 rounded-full bg-current" />
                <span className="h-1 w-1 rounded-full bg-current" />
              </span>
              Number of Questions
            </Label>
            <div className="flex items-center gap-2">
              <Input
                type="number"
                min="1"
                max="50"
                value={numQuestions}
                onChange={(e) => setNumQuestions(e.target.value)}
                className="flex-1"
              />
              <Button variant="ghost" size="icon">
                <Info className="h-4 w-4 text-muted-foreground" />
              </Button>
            </div>
            <p className="text-sm text-muted-foreground">
              Set how many questions you want to generate from your document.
            </p>
          </div>

          {/* Special Instructions */}
          <div className="flex flex-col gap-2">
            <Label className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Special Instructions
            </Label>
            <Textarea
              placeholder="E.g., Focus on chapter 3, include definitions, make it challenging..."
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              rows={4}
            />
            <p className="text-sm text-muted-foreground">
              Optional: Add any specific instructions or focus areas for the exam.
            </p>
          </div>

          {/* Generate Button */}
          <Button
            onClick={handleGenerate}
            disabled={!file || isLoading}
            className="w-full bg-slate-600 hover:bg-slate-700"
            size="lg"
          >
            {isLoading ? 'Generating...' : 'Generate Exam'}
          </Button>
          {!file && !selectedDocId && (
            <p className="text-center text-sm text-muted-foreground">
              Please upload a file or select from knowledge base to continue
            </p>
          )}
        </CardContent>
      </Card>

      {/* Generated Questions */}
      {questions && questions.length > 0 && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Generated Exam</CardTitle>
            <CardDescription>
              {showResults
                ? `Score: ${calculateScore()} / ${questions.length}`
                : 'Answer all questions and submit'}
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-6">
            {questions.map((q, index) => (
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
                              ? 'border-green-500 bg-green-50 text-green-900'
                              : isSelected
                                ? 'border-red-500 bg-red-50 text-red-900'
                                : 'border-muted'
                            : isSelected
                              ? 'border-primary bg-primary/5'
                              : 'border-muted hover:border-primary/50'
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
                disabled={Object.keys(selectedAnswers).length !== questions.length}
                className="w-full"
                size="lg"
              >
                Submit Exam
              </Button>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}