"use client"

import Link from "next/link"
import { useAuth } from "@/components/auth/auth-provider"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { 
  AlertTriangle, 
  ArrowUpRight, 
  MessageSquare, 
  Upload, 
  BookOpen, 
  Info,
  Sparkles
} from "lucide-react"

export function DashboardContent() {
  const { user } = useAuth()
  const userName = user?.name || user?.email?.split("@")[0] || "Guest"

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">
          Hey, {userName}
        </h1>
        <p className="text-muted-foreground mt-1">
          {"Let's start learning with guided questions"}
        </p>
      </div>

      {/* Premium Banner */}
      <Alert className="bg-card border-border">
        <AlertTriangle className="h-4 w-4 text-primary" />
        <AlertTitle className="text-foreground font-medium">
          {"Not a Premium User? We've got you"}
        </AlertTitle>
        <AlertDescription className="text-muted-foreground">
          You can bring your own API key to enable AI-powered tutoring and document processing.
        </AlertDescription>
        <div className="mt-4">
          <Button asChild>
            <Link href="/dashboard/settings/api-keys">Get Started</Link>
          </Button>
        </div>
      </Alert>

      {/* Analytics Section */}
      <div>
        <h2 className="text-xl font-semibold mb-4 text-foreground">Analytics</h2>
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Total Chat Sessions</CardDescription>
              <CardTitle className="text-4xl font-bold">0</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                <Info className="h-3.5 w-3.5" />
                <span>Start chatting to track</span>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Documents Uploaded</CardDescription>
              <CardTitle className="text-4xl font-bold">0</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                <Info className="h-3.5 w-3.5" />
                <span>Upload PDFs to learn from</span>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Topics Mastered</CardDescription>
              <CardTitle className="text-4xl font-bold">0</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                <Info className="h-3.5 w-3.5" />
                <span>No limits</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Quick Starts Section */}
      <div>
        <h2 className="text-xl font-semibold mb-4 text-foreground">Quick Starts</h2>
        <div className="grid gap-4 md:grid-cols-3">
          <Card className="group hover:shadow-md transition-shadow cursor-pointer">
            <Link href="/dashboard/chat">
              <CardHeader>
                <CardTitle className="text-lg">Start Learning</CardTitle>
                <CardDescription>
                  Begin a Socratic dialogue with your AI tutor about any topic.
                </CardDescription>
              </CardHeader>
              <CardContent className="flex justify-end">
                <div className="flex h-10 w-10 items-center justify-center rounded-full border group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                  <ArrowUpRight className="h-5 w-5" />
                </div>
              </CardContent>
            </Link>
          </Card>

          <Card className="group hover:shadow-md transition-shadow cursor-pointer">
            <Link href="/dashboard/upload">
              <CardHeader>
                <CardTitle className="text-lg">Upload Documents</CardTitle>
                <CardDescription>
                  Upload PDFs to create a personalized knowledge base for tutoring.
                </CardDescription>
              </CardHeader>
              <CardContent className="flex justify-end">
                <div className="flex h-10 w-10 items-center justify-center rounded-full border group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                  <ArrowUpRight className="h-5 w-5" />
                </div>
              </CardContent>
            </Link>
          </Card>

          <Card className="group hover:shadow-md transition-shadow cursor-pointer">
            <Link href="/dashboard/knowledge">
              <CardHeader>
                <CardTitle className="text-lg">Knowledge Base</CardTitle>
                <CardDescription>
                  Browse and manage your uploaded documents and learning materials.
                </CardDescription>
              </CardHeader>
              <CardContent className="flex justify-end">
                <div className="flex h-10 w-10 items-center justify-center rounded-full border group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                  <ArrowUpRight className="h-5 w-5" />
                </div>
              </CardContent>
            </Link>
          </Card>

          <Card className="group hover:shadow-md transition-shadow cursor-pointer">
            <Link href="/dashboard/chat/history">
              <CardHeader>
                <CardTitle className="text-lg">Chat History</CardTitle>
                <CardDescription>
                  Review past tutoring sessions and continue where you left off.
                </CardDescription>
              </CardHeader>
              <CardContent className="flex justify-end">
                <div className="flex h-10 w-10 items-center justify-center rounded-full border group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                  <ArrowUpRight className="h-5 w-5" />
                </div>
              </CardContent>
            </Link>
          </Card>

          <Card className="group hover:shadow-md transition-shadow cursor-pointer">
            <Link href="/dashboard/settings/api-keys">
              <CardHeader>
                <CardTitle className="text-lg">Configure API Keys</CardTitle>
                <CardDescription>
                  Add your Groq or Google Gemini API keys to enable AI features.
                </CardDescription>
              </CardHeader>
              <CardContent className="flex justify-end">
                <div className="flex h-10 w-10 items-center justify-center rounded-full border group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                  <ArrowUpRight className="h-5 w-5" />
                </div>
              </CardContent>
            </Link>
          </Card>

          <Card className="group hover:shadow-md transition-shadow cursor-pointer">
            <Link href="/dashboard/chat">
              <CardHeader>
                <CardTitle className="text-lg">Socratic Method</CardTitle>
                <CardDescription>
                  Learn through guided questions that help you discover answers yourself.
                </CardDescription>
              </CardHeader>
              <CardContent className="flex justify-end">
                <div className="flex h-10 w-10 items-center justify-center rounded-full border group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                  <ArrowUpRight className="h-5 w-5" />
                </div>
              </CardContent>
            </Link>
          </Card>
        </div>
      </div>
    </div>
  )
}
