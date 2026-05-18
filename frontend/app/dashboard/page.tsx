"use client"

import Link from "next/link"
import { useAuth } from "@/lib/auth-context"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  FileText,
  NotebookText,
  ImageIcon,
  Headset,
  CreditCard,
  RotateCcw,
  ArrowUpRight,
  AlertTriangle,
} from "lucide-react"

const quickStartCards = [
  {
    title: "Create Exams Instantly",
    description: "Generate multiple-choice questions from your documents in seconds.",
    href: "/dashboard/exam-generator",
    icon: FileText,
  },
  {
    title: "Summarize with Smart Notes",
    description: "Convert study materials into concise, easy-to-digest notes with guided questions.",
    href: "/dashboard/short-notes",
    icon: NotebookText,
  },
  {
    title: "Try Equations",
    description: "Upload photos of your math work and get instant answer verification.",
    href: "/dashboard/try-equations",
    icon: ImageIcon,
  },
  {
    title: "Listen & Learn",
    description: "Upload your notes and enjoy an AI-generated audio summary for hands-free studying.",
    href: "/dashboard/notes-to-audio",
    icon: Headset,
  },
  {
    title: "Flash Cards Generator",
    description: "Create flash cards from your documents to help you memorize and study effectively.",
    href: "/dashboard/flash-cards",
    icon: CreditCard,
  },
  {
    title: "Retry Saved Exams",
    description: "Test yourself with previously attempted exams and see how much you've improved.",
    href: "/dashboard/retry-exams",
    icon: RotateCcw,
  },
]

export default function DashboardPage() {
  const { user, token } = useAuth()

  const firstName = user?.name?.split(" ")[0] || user?.email?.split("@")[0] || "User"

  return (
    <div className="flex flex-col gap-8">
      {/* Welcome Section */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">Hey, {firstName}</h1>
        <p className="text-muted-foreground">{"Let's get some studying done"}</p>
      </div>

      {/* API Key Banner */}
      <Card className="border-amber-200 bg-amber-50/50">
        <CardContent className="flex flex-col items-start justify-between gap-4 py-4 sm:flex-row sm:items-center">
          <div className="flex items-start gap-3">
            <AlertTriangle className="mt-0.5 h-5 w-5 text-amber-600" />
            <div>
              <p className="font-medium text-amber-900">{"Not a Premium User? We've got you"}</p>
              <p className="text-sm text-amber-700">
                You can bring your own API key to enable audio generation and text generation.
              </p>
            </div>
          </div>
          <Button asChild className="shrink-0 bg-amber-600 hover:bg-amber-500">
            <Link href="/dashboard/settings">Get Started</Link>
          </Button>
        </CardContent>
      </Card>

      {/* Quick Starts Section */}
      <div>
        <h2 className="mb-4 text-xl font-semibold text-foreground">Quick Starts</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {quickStartCards.map((card) => (
            <Link key={card.href} href={card.href}>
              <Card className="group relative h-full overflow-hidden transition-all hover:shadow-md">
                <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-muted/50 to-transparent" />
                <CardHeader>
                  <CardTitle className="text-lg">{card.title}</CardTitle>
                  <CardDescription>{card.description}</CardDescription>
                </CardHeader>
                <CardContent className="flex justify-end pb-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-600 text-white transition-transform group-hover:scale-110">
                    <ArrowUpRight className="h-5 w-5" />
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
