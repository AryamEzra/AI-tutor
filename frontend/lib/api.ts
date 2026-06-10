const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"

export interface User {
  id: string
  email: string
  name?: string
}

export interface AuthResponse {
  access_token: string
  token_type: string
  user: User
}

export interface ChatMessage {
  role: "user" | "assistant"
  content: string
  timestamp?: string
}

export interface ExamQuestion {
  id: string
  question: string
  options: string[]
  correct_answer: string
}

export interface FlashCard {
  id: string
  front: string
  back: string
}

export interface ShortNote {
  id: string
  title: string
  content: string
  created_at: string
}

export interface Audiobook {
  id: string
  title: string
  audio_url: string
  created_at: string
}

// Auth API
export async function login(email: string, password: string): Promise<AuthResponse> {
  const res = await fetch(`${API_BASE_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  })
  if (!res.ok) {
    const error = await res.json().catch(() => ({ detail: "Login failed" }))
    throw new Error(error.detail || "Login failed")
  }
  return res.json()
}

export async function register(email: string, password: string): Promise<AuthResponse> {
  const res = await fetch(`${API_BASE_URL}/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  })
  if (!res.ok) {
    const error = await res.json().catch(() => ({ detail: "Registration failed" }))
    throw new Error(error.detail || "Registration failed")
  }
  return res.json()
}

// Document API
export async function uploadDocument(file: File, token: string): Promise<{ id: string; filename: string }> {
  const formData = new FormData()
  formData.append("file", file)
  
  const res = await fetch(`${API_BASE_URL}/documents/upload`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: formData,
  })
  if (!res.ok) throw new Error("Upload failed")
  return res.json()
}

// Exam Generator API
export async function generateExam(
  fileOrDocId: File | string,
  numQuestions: number,
  instructions: string,
  token: string,
  fromKnowledgeBase: boolean = false
): Promise<{ exam_id: string; questions: ExamQuestion[] }> {
  if (fromKnowledgeBase && typeof fileOrDocId === 'string') {
    // Use document ID from knowledge base
    const res = await fetch(`${API_BASE_URL}/knowledge-base/generate-exam`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        document_id: fileOrDocId,
        num_questions: numQuestions,
        instructions,
      }),
    })
    if (!res.ok) throw new Error('Failed to generate exam')
    return res.json()
  } else if (fileOrDocId instanceof File) {
    // Upload new file
    const formData = new FormData()
    formData.append('file', fileOrDocId)
    formData.append('num_questions', numQuestions.toString())
    formData.append('instructions', instructions)

    const res = await fetch(`${API_BASE_URL}/documents/generate-exam`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: formData,
    })
    if (!res.ok) throw new Error('Failed to generate exam')
    return res.json()
  }
  throw new Error('Invalid input for generateExam')
}

// Short Notes API
export async function generateShortNotes(
  fileOrDocId: File | string,
  instructions: string,
  token: string,
  fromKnowledgeBase: boolean = false
): Promise<{ note_id: string; content: string }> {
  if (fromKnowledgeBase && typeof fileOrDocId === 'string') {
    const res = await fetch(`${API_BASE_URL}/knowledge-base/generate-notes`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        document_id: fileOrDocId,
        instructions,
      }),
    })
    if (!res.ok) throw new Error('Failed to generate notes')
    return res.json()
  } else if (fileOrDocId instanceof File) {
    const formData = new FormData()
    formData.append('file', fileOrDocId)
    formData.append('instructions', instructions)

    const res = await fetch(`${API_BASE_URL}/documents/generate-notes`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: formData,
    })
    if (!res.ok) throw new Error('Failed to generate notes')
    return res.json()
  }
  throw new Error('Invalid input for generateShortNotes')
}

// Flash Cards API
export async function generateFlashCards(
  fileOrDocId: File | string,
  instructions: string,
  token: string,
  fromKnowledgeBase: boolean = false
): Promise<{ flashcard_id: string; cards: FlashCard[] }> {
  if (fromKnowledgeBase && typeof fileOrDocId === 'string') {
    const res = await fetch(`${API_BASE_URL}/knowledge-base/generate-flashcards`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        document_id: fileOrDocId,
        instructions,
      }),
    })
    if (!res.ok) throw new Error('Failed to generate flash cards')
    return res.json()
  } else if (fileOrDocId instanceof File) {
    const formData = new FormData()
    formData.append('file', fileOrDocId)
    formData.append('instructions', instructions)

    const res = await fetch(`${API_BASE_URL}/documents/generate-flashcards`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: formData,
    })
    if (!res.ok) throw new Error('Failed to generate flash cards')
    return res.json()
  }
  throw new Error('Invalid input for generateFlashCards')
}

// Audio Generation API
export async function generateAudio(
  fileOrDocId: File | string,
  token: string,
  fromKnowledgeBase: boolean = false
): Promise<{ audiobook_id: string; audio_url: string }> {
  if (fromKnowledgeBase && typeof fileOrDocId === 'string') {
    const res = await fetch(`${API_BASE_URL}/knowledge-base/generate-audio`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ document_id: fileOrDocId }),
    })
    if (!res.ok) throw new Error('Failed to generate audio')
    return res.json()
  } else if (fileOrDocId instanceof File) {
    const formData = new FormData()
    formData.append('file', fileOrDocId)

    const res = await fetch(`${API_BASE_URL}/documents/generate-audio`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: formData,
    })
    if (!res.ok) throw new Error('Failed to generate audio')
    return res.json()
  }
  throw new Error('Invalid input for generateAudio')
}

// Try Equations (Image Upload) API
export async function checkEquation(
  image: File,
  token: string
): Promise<{ is_correct: boolean; explanation: string; correct_answer?: string }> {
  const formData = new FormData()
  formData.append("image", image)
  
  const res = await fetch(`${API_BASE_URL}/documents/check-equation`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: formData,
  })
  if (!res.ok) throw new Error("Failed to check equation")
  return res.json()
}

// Chat API
export async function sendChatMessage(
  message: string,
  history: ChatMessage[],
  token: string
): Promise<{ response: string }> {
  const res = await fetch(`${API_BASE_URL}/chat/message`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ message, history }),
  })
  if (!res.ok) throw new Error("Failed to send message")
  return res.json()
}

// Saved Data APIs
export async function getSavedExams(token: string): Promise<{ exams: Array<{ id: string; title: string; created_at: string; questions: ExamQuestion[] }> }> {
  const res = await fetch(`${API_BASE_URL}/documents/exams`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!res.ok) throw new Error("Failed to fetch exams")
  return res.json()
}

export async function getSavedNotes(token: string): Promise<{ notes: ShortNote[] }> {
  const res = await fetch(`${API_BASE_URL}/documents/notes`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!res.ok) throw new Error("Failed to fetch notes")
  return res.json()
}

export async function getSavedFlashCards(token: string): Promise<{ flashcards: Array<{ id: string; title: string; cards: FlashCard[] }> }> {
  const res = await fetch(`${API_BASE_URL}/documents/flashcards`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!res.ok) throw new Error("Failed to fetch flashcards")
  return res.json()
}

export async function getSavedAudiobooks(token: string): Promise<{ audiobooks: Audiobook[] }> {
  const res = await fetch(`${API_BASE_URL}/documents/audiobooks`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!res.ok) throw new Error("Failed to fetch audiobooks")
  return res.json()
}

export async function getSavedEquations(token: string): Promise<{ equations: Array<{ id: string; image_url: string; is_correct: boolean; explanation: string; created_at: string }> }> {
  const res = await fetch(`${API_BASE_URL}/documents/equations`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!res.ok) throw new Error("Failed to fetch equations")
  return res.json()
}

// Analytics API
export async function getAnalytics(token: string): Promise<{
  text_tokens: number
  audio_tokens: number
  saved_exams: number
  max_text_tokens: number
  max_audio_tokens: number
}> {
  const res = await fetch(`${API_BASE_URL}/analytics`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!res.ok) throw new Error("Failed to fetch analytics")
  return res.json()
}

// Knowledge Base API
export interface KnowledgeBaseDocument {
  id: string
  filename: string
  created_at: string
  size: number
}

export async function getKnowledgeBaseDocuments(token: string): Promise<{ documents: KnowledgeBaseDocument[] }> {
  const res = await fetch(`${API_BASE_URL}/knowledge-base/documents`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!res.ok) throw new Error("Failed to fetch documents")
  return res.json()
}

export async function uploadKnowledgeBaseDocument(file: File, token: string): Promise<{ id: string; filename: string }> {
  const formData = new FormData()
  formData.append("file", file)

  const res = await fetch(`${API_BASE_URL}/knowledge-base/documents`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: formData,
  })
  if (!res.ok) throw new Error("Failed to upload document")
  return res.json()
}

export async function deleteKnowledgeBaseDocument(docId: string, token: string): Promise<void> {
  const res = await fetch(`${API_BASE_URL}/knowledge-base/documents/${docId}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!res.ok) throw new Error("Failed to delete document")
}
