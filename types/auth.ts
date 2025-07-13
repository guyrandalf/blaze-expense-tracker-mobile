export interface User {
  id: string
  email: string
  firstName?: string | null
  lastName?: string | null
  createdAt: string
  updatedAt: string
}

export interface AuthResponse {
  user: User
  token: string
}

export interface AuthError {
  error: string
}
