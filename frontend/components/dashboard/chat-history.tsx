"use client"

import { useState } from "react"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { 
  MessageSquare, 
  Search, 
  Trash2, 
  MoreVertical,
  Calendar,
  Clock,
  Plus
} from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Empty } from "@/components/ui/empty"

interface ChatSession {
  id: string
  title: string
  lastMessage: string
  createdAt: string
  messageCount: number
}

// Mock data - will be replaced with actual data from backend
const mockSessions: ChatSession[] = []

export function ChatHistory() {
  const [searchQuery, setSearchQuery] = useState("")
  const [sessions] = useState<ChatSession[]>(mockSessions)

  const filteredSessions = sessions.filter((session) =>
    session.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    session.lastMessage.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Chat History</h1>
          <p className="text-muted-foreground">
            Review and continue your past tutoring sessions
          </p>
        </div>
        <Button asChild>
          <Link href="/dashboard/chat">
            <Plus className="mr-2 h-4 w-4" />
            New Chat
          </Link>
        </Button>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search chat history..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Sessions List */}
      {filteredSessions.length === 0 ? (
        <Card className="py-16">
          <CardContent>
            <Empty
              icon={MessageSquare}
              title="No chat sessions yet"
              description="Start a new tutoring session to begin your learning journey."
            >
              <Button asChild className="mt-4">
                <Link href="/dashboard/chat">Start Learning</Link>
              </Button>
            </Empty>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredSessions.map((session) => (
            <Card key={session.id} className="group hover:shadow-md transition-shadow">
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <Link href={`/dashboard/chat/${session.id}`}>
                      <CardTitle className="text-base hover:text-primary transition-colors cursor-pointer">
                        {session.title}
                      </CardTitle>
                    </Link>
                    <CardDescription className="line-clamp-1 mt-1">
                      {session.lastMessage}
                    </CardDescription>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem asChild>
                        <Link href={`/dashboard/chat/${session.id}`}>Continue Chat</Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem className="text-destructive">
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Calendar className="h-3.5 w-3.5" />
                    <span>{session.createdAt}</span>
                  </div>
                  <Badge variant="secondary" className="text-xs">
                    {session.messageCount} messages
                  </Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
