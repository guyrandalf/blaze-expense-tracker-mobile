export interface Expense {
  id: string
  userId: string
  amount: number
  name?: string | null
  isRecurring: boolean
  createdAt: string
  updatedAt: string
}
