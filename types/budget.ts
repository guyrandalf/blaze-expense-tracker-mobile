export interface BudgetItem {
  id: string;
  budgetId: string;
  category: string;
  estimatedAmount: number;
  createdAt: string;
  updatedAt: string;
}

export interface Budget {
  id: string;
  userId: string;
  month: number;
  year: number;
  expectedIncome?: number;
  createdAt: string;
  updatedAt: string;
  items: BudgetItem[];
} 