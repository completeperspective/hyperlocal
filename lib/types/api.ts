export interface AuthResponse {
  authenticateUserWithPassword?: {
    sessionToken?: string
    item?: {
      id: string
      email: string
      isAdmin: boolean
    }
    message?: string
  }
}
