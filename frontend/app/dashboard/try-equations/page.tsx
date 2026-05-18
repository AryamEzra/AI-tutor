"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useAuth } from "@/lib/auth-context"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Plus, ImageIcon, Clock, CheckCircle, XCircle, ChevronRight } from "lucide-react"

interface SavedEquation {
  id: string
  image_url: string
  is_correct: boolean
  explanation: string
  created_at: string
}

export default function TryEquationsListPage() {
  const { user, token } = useAuth()
  const [equations, setEquations] = useState<SavedEquation[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchEquations = async () => {
      if (!token) return
      try {
        // Fetch saved equations from API - you'll need to implement this endpoint
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/documents/equations`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        if (res.ok) {
          const data = await res.json()
          setEquations(data.equations || [])
        }
      } catch (error) {
        console.error("Failed to fetch equations:", error)
      } finally {
        setIsLoading(false)
      }
    }
    fetchEquations()
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
        <p className="text-muted-foreground">Upload photos of your math work to check your answers!</p>
      </div>

      {/* Title and Action */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Your Equation Checks</h2>
        <Button asChild className="gap-2 bg-primary text-primary-foreground hover:bg-primary/90">
          <Link href="/dashboard/try-equations/create">
            <Plus className="h-4 w-4" />
            Check New Equation
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
      ) : equations.length === 0 ? (
        <Card className="bg-muted/30">
          <CardContent className="flex min-h-64 flex-col items-center justify-center gap-4 py-12">
            <div className="flex h-16 w-16 items-center justify-center rounded-lg border-2 border-dashed border-muted-foreground/25">
              <ImageIcon className="h-8 w-8 text-muted-foreground/50" />
            </div>
            <p className="text-muted-foreground">No equation checks yet. Start uploading now!</p>
            <Button asChild className="gap-2 bg-primary text-primary-foreground hover:bg-primary/90">
              <Link href="/dashboard/try-equations/create">
                <Plus className="h-4 w-4" />
                Check First Equation
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {equations.map((equation) => (
            <Card key={equation.id} className="group transition-shadow hover:shadow-md">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-start justify-between text-base">
                  <span className="flex items-center gap-2">
                    {equation.is_correct ? (
                      <CheckCircle className="h-5 w-5 text-green-600" />
                    ) : (
                      <XCircle className="h-5 w-5 text-red-600" />
                    )}
                    {equation.is_correct ? "Correct" : "Incorrect"}
                  </span>
                  <ChevronRight className="h-5 w-5 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-1" />
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="line-clamp-3 text-sm text-muted-foreground">{equation.explanation}</p>
                <div className="mt-3 flex items-center gap-2 text-sm text-muted-foreground">
                  <Clock className="h-4 w-4" />
                  <span>{formatDate(equation.created_at)}</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
