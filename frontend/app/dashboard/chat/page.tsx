"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { useDropzone } from "react-dropzone"
import { useAuth } from "@/lib/auth-context"
import { sendChatMessage, ChatMessage } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Menu, Paperclip, ImageIcon, Send } from "lucide-react"
import { cn } from "@/lib/utils"

const suggestionPrompts = [
  "Teach me about World War II",
  "What is the power house of the cell",
  "Explain Dijkstra's algorithm",
]

export default function ChatPage() {
  const { token } = useAuth()
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [attachedFile, setAttachedFile] = useState<File | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const onDropFile = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      setAttachedFile(acceptedFiles[0])
    }
  }, [])

  const { getRootProps: getFileRootProps, getInputProps: getFileInputProps, open: openFileDialog } = useDropzone({
    onDrop: onDropFile,
    accept: {
      "application/pdf": [".pdf"],
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [".docx"],
      "text/plain": [".txt"],
    },
    multiple: false,
    noClick: true,
    noKeyboard: true,
  })

  const onDropImage = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      setAttachedFile(acceptedFiles[0])
    }
  }, [])

  const { getRootProps: getImageRootProps, getInputProps: getImageInputProps, open: openImageDialog } = useDropzone({
    onDrop: onDropImage,
    accept: {
      "image/jpeg": [".jpg", ".jpeg"],
      "image/png": [".png"],
      "image/gif": [".gif"],
      "image/webp": [".webp"],
    },
    multiple: false,
    noClick: true,
    noKeyboard: true,
  })

  const handleSend = async () => {
    if ((!input.trim() && !attachedFile) || !token || isLoading) return

    const userMessage: ChatMessage = {
      role: "user",
      content: input.trim() || (attachedFile ? `[Attached: ${attachedFile.name}]` : ""),
      timestamp: new Date().toISOString(),
    }

    setMessages((prev) => [...prev, userMessage])
    setInput("")
    setAttachedFile(null)
    setIsLoading(true)

    try {
      const response = await sendChatMessage(userMessage.content, messages, token)
      const assistantMessage: ChatMessage = {
        role: "assistant",
        content: response.response,
        timestamp: new Date().toISOString(),
      }
      setMessages((prev) => [...prev, assistantMessage])
    } catch (error) {
      console.error("Failed to send message:", error)
      const errorMessage: ChatMessage = {
        role: "assistant",
        content: "Sorry, I encountered an error. Please try again.",
        timestamp: new Date().toISOString(),
      }
      setMessages((prev) => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }

  const handleSuggestionClick = (prompt: string) => {
    setInput(prompt)
    textareaRef.current?.focus()
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div className="flex h-[calc(100vh-8rem)] flex-col" {...getFileRootProps()} {...getImageRootProps()}>
      <input {...getFileInputProps()} />
      <input {...getImageInputProps()} />
      
      {/* Header */}
      <div className="border-b pb-4">
        <Button variant="ghost" size="icon">
          <Menu className="h-5 w-5" />
        </Button>
      </div>

      {/* Chat Area */}
      <ScrollArea className="flex-1 px-4">
        {messages.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center py-12">
            <div className="flex flex-col items-center gap-8">
              {/* Empty state - suggestion prompts will be at bottom */}
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-6 py-6">
            {messages.map((message, index) => (
              <div
                key={index}
                className={cn(
                  "flex max-w-[80%] flex-col gap-1 rounded-2xl px-4 py-3",
                  message.role === "user"
                    ? "ml-auto bg-primary text-primary-foreground"
                    : "bg-muted"
                )}
              >
                <p className="whitespace-pre-wrap text-sm">{message.content}</p>
                {message.timestamp && (
                  <span className="text-xs opacity-70">
                    {new Date(message.timestamp).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                )}
              </div>
            ))}
            {isLoading && (
              <div className="flex max-w-[80%] flex-col gap-1 rounded-2xl bg-muted px-4 py-3">
                <div className="flex gap-1">
                  <span className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground [animation-delay:0ms]" />
                  <span className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground [animation-delay:150ms]" />
                  <span className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground [animation-delay:300ms]" />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        )}
      </ScrollArea>

      {/* Suggestion Prompts */}
      {messages.length === 0 && (
        <div className="flex flex-wrap justify-center gap-2 border-t px-4 py-4">
          {suggestionPrompts.map((prompt, index) => (
            <Button
              key={index}
              variant="outline"
              size="sm"
              className="rounded-full"
              onClick={() => handleSuggestionClick(prompt)}
            >
              {prompt}
            </Button>
          ))}
        </div>
      )}

      {/* Input Area */}
      <div className="border-t px-4 py-4">
        {attachedFile && (
          <div className="mb-2 flex items-center gap-2 rounded-lg bg-muted p-2">
            <Paperclip className="h-4 w-4 text-muted-foreground" />
            <span className="flex-1 truncate text-sm">{attachedFile.name}</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setAttachedFile(null)}
            >
              Remove
            </Button>
          </div>
        )}
        <div className="flex items-end gap-2 rounded-xl border bg-background p-2">
          <Textarea
            ref={textareaRef}
            placeholder="Ask me anything..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            className="min-h-[44px] flex-1 resize-none border-0 bg-transparent p-2 focus-visible:ring-0"
            rows={1}
          />
          <div className="flex items-center gap-1 pb-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={openFileDialog}
            >
              <Paperclip className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={openImageDialog}
            >
              <ImageIcon className="h-4 w-4" />
            </Button>
            <Button
              size="icon"
              className="h-8 w-8 rounded-full bg-amber-600 hover:bg-amber-500"
              onClick={handleSend}
              disabled={(!input.trim() && !attachedFile) || isLoading}
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
