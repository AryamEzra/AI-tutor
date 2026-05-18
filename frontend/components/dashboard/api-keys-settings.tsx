"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/components/auth/auth-provider"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { 
  Key, 
  Check, 
  AlertCircle, 
  Loader2,
  ExternalLink,
  Eye,
  EyeOff
} from "lucide-react"

interface APIKeys {
  groq: string | null
  gemini: string | null
}

export function APIKeysSettings() {
  const { token } = useAuth()
  const [keys, setKeys] = useState<APIKeys>({ groq: null, gemini: null })
  const [groqKey, setGroqKey] = useState("")
  const [geminiKey, setGeminiKey] = useState("")
  const [showGroq, setShowGroq] = useState(false)
  const [showGemini, setShowGemini] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchKeys()
  }, [token])

  const fetchKeys = async () => {
    if (!token) return
    const API_BASE = (process.env.NEXT_PUBLIC_API_URL || "").replace(/\/+$/, "")

    try {
      const response = await fetch(`${API_BASE}/settings/api-keys`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      if (response.ok) {
        const data = await response.json()
        setKeys(data)
      }
    } catch (err) {
      console.error("Failed to fetch API keys:", err)
    } finally {
      setIsLoading(false)
    }
  }

  const saveKey = async (provider: "groq" | "gemini") => {
    const apiKey = provider === "groq" ? groqKey : geminiKey
    if (!apiKey.trim()) {
      setError("Please enter an API key")
      return
    }

    setIsSaving(provider)
    setError(null)
    setSuccess(null)

    try {
      const API_BASE = (process.env.NEXT_PUBLIC_API_URL || "").replace(/\/+$/, "")

      const response = await fetch(`${API_BASE}/settings/api-keys`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ provider, api_key: apiKey }),
      })

      if (!response.ok) {
        throw new Error("Failed to save API key")
      }

      setSuccess(`${provider === "groq" ? "Groq" : "Google Gemini"} API key saved successfully`)
      if (provider === "groq") {
        setGroqKey("")
      } else {
        setGeminiKey("")
      }
      fetchKeys()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save API key")
    } finally {
      setIsSaving(null)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">API Keys</h1>
        <p className="text-muted-foreground">
          Configure your AI provider API keys to enable tutoring features
        </p>
      </div>

      {success && (
        <Alert className="bg-green-50 border-green-200">
          <Check className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">{success}</AlertDescription>
        </Alert>
      )}

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="grid gap-6">
        {/* Groq API Key */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-orange-100">
                  <Key className="h-5 w-5 text-orange-600" />
                </div>
                <div>
                  <CardTitle className="text-lg">Groq</CardTitle>
                  <CardDescription>
                    Fast inference with Llama 3.3 70B
                  </CardDescription>
                </div>
              </div>
              {keys.groq && (
                <Badge variant="secondary" className="bg-green-100 text-green-800">
                  Configured
                </Badge>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {keys.groq && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span>Current key:</span>
                <code className="bg-muted px-2 py-1 rounded">{keys.groq}</code>
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="groq-key">API Key</Label>
              <div className="relative">
                <Input
                  id="groq-key"
                  type={showGroq ? "text" : "password"}
                  placeholder="gsk_..."
                  value={groqKey}
                  onChange={(e) => setGroqKey(e.target.value)}
                  disabled={isSaving === "groq"}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8"
                  onClick={() => setShowGroq(!showGroq)}
                >
                  {showGroq ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <a
                href="https://console.groq.com/keys"
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-primary hover:underline flex items-center gap-1"
              >
                Get a free API key
                <ExternalLink className="h-3 w-3" />
              </a>
              <Button 
                onClick={() => saveKey("groq")} 
                disabled={isSaving === "groq" || !groqKey.trim()}
              >
                {isSaving === "groq" ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  "Save Key"
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Google Gemini API Key */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100">
                  <Key className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <CardTitle className="text-lg">Google Gemini</CardTitle>
                  <CardDescription>
                    Powerful multimodal AI from Google
                  </CardDescription>
                </div>
              </div>
              {keys.gemini && (
                <Badge variant="secondary" className="bg-green-100 text-green-800">
                  Configured
                </Badge>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {keys.gemini && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span>Current key:</span>
                <code className="bg-muted px-2 py-1 rounded">{keys.gemini}</code>
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="gemini-key">API Key</Label>
              <div className="relative">
                <Input
                  id="gemini-key"
                  type={showGemini ? "text" : "password"}
                  placeholder="AIza..."
                  value={geminiKey}
                  onChange={(e) => setGeminiKey(e.target.value)}
                  disabled={isSaving === "gemini"}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8"
                  onClick={() => setShowGemini(!showGemini)}
                >
                  {showGemini ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <a
                href="https://aistudio.google.com/app/apikey"
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-primary hover:underline flex items-center gap-1"
              >
                Get a free API key
                <ExternalLink className="h-3 w-3" />
              </a>
              <Button 
                onClick={() => saveKey("gemini")} 
                disabled={isSaving === "gemini" || !geminiKey.trim()}
              >
                {isSaving === "gemini" ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  "Save Key"
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Your API keys are stored securely and never shared. They are only used to make requests to the AI providers on your behalf.
        </AlertDescription>
      </Alert>
    </div>
  )
}
