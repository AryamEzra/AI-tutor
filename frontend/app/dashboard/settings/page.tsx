"use client"

import { useAuth } from "@/lib/auth-context"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Settings, Key, LogOut } from "lucide-react"
import { useRouter } from "next/navigation"

export default function SettingsPage() {
  const { user, logout } = useAuth()
  const router = useRouter()

  const handleLogout = () => {
    logout()
    router.push("/login")
  }

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="text-muted-foreground">Manage your account settings</p>
      </div>

      <div className="flex flex-col gap-6">
        {/* Profile Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Profile
            </CardTitle>
            <CardDescription>Your account information</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={user?.email || ""}
                disabled
                className="bg-muted"
              />
            </div>
          </CardContent>
        </Card>

        {/* API Keys Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Key className="h-5 w-5" />
              API Keys
            </CardTitle>
            <CardDescription>
              Configure your own API keys for additional features
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="groq-key">Groq API Key</Label>
              <Input
                id="groq-key"
                type="password"
                placeholder="Enter your Groq API key"
              />
              <p className="text-xs text-muted-foreground">
                Used for text generation features
              </p>
            </div>
            <Separator />
            <div className="flex flex-col gap-2">
              <Label htmlFor="pinecone-key">Pinecone API Key</Label>
              <Input
                id="pinecone-key"
                type="password"
                placeholder="Enter your Pinecone API key"
              />
              <p className="text-xs text-muted-foreground">
                Used for document storage and retrieval
              </p>
            </div>
            <Button className="w-full bg-amber-600 hover:bg-slate-600">
              Save API Keys
            </Button>
          </CardContent>
        </Card>

        {/* Danger Zone */}
        <Card className="border-destructive/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <LogOut className="h-5 w-5" />
              Sign Out
            </CardTitle>
            <CardDescription>
              Sign out of your account on this device
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              variant="destructive"
              onClick={handleLogout}
              className="w-full"
            >
              Sign Out
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
