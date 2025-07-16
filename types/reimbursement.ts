export interface Reimbursement {
  id: string;
  expenseId: string;
  amount: number;
  date: string;
  note?: string | null;
  status: string; // 'partial' | 'complete'
  createdAt: string;
  updatedAt: string;
} 