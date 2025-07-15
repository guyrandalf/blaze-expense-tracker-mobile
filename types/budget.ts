export interface Budget {
  id: string;
  userId: string;
  month: number; // 1-12
  year: number;
  amount: number;
  createdAt: string;
  updatedAt: string;
} 