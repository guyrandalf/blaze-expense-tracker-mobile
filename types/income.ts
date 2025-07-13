export interface Income {
  id: string
  userId: string
  amount: number
  source?: string | null
  isRecurring: boolean
  createdAt: string
  updatedAt: string
}
