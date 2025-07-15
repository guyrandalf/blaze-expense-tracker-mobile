export interface Expense {
  id: string
  userId: string
  amount: number
  name?: string | null
  isRecurring: boolean
  expenseDate?: string | null
  recurrenceInterval?: string | null
  startDate?: string | null
  endDate?: string | null
  createdAt: string
  updatedAt: string
}
