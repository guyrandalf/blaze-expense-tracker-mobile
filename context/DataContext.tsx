import React, { createContext, useContext } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Income } from "@/types/income";
import { Expense } from "@/types/expense";
import { Budget } from "@/types/budget";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Reimbursement } from "@/types/reimbursement";

// Define the shape of our context data
interface UserData {
  income: Income[];
  expenses: Expense[];
  budgets: Budget[];
  user: {
    id: string;
    email: string;
    firstName?: string | null;
    lastName?: string | null;
    createdAt: string;
    updatedAt: string;
  } | null;
}

interface DataContextType {
  userData: UserData;
  isLoading: boolean;
  isError: boolean;
  fetchUserData: () => Promise<void>;
  // Reimbursement helpers
  fetchReimbursements: (expenseId: string) => Promise<Reimbursement[]>;
  addReimbursement: (
    expenseId: string,
    data: Partial<Reimbursement>
  ) => Promise<Reimbursement>;
  editReimbursement: (
    expenseId: string,
    reimbursementId: string,
    data: Partial<Reimbursement>
  ) => Promise<Reimbursement>;
  deleteReimbursement: (
    expenseId: string,
    reimbursementId: string
  ) => Promise<void>;
}

// Create the context with default values
const DataContext = createContext<DataContextType>({
  userData: { income: [], expenses: [], budgets: [], user: null },
  isLoading: false,
  isError: false,
  fetchUserData: async () => {},
  // Reimbursement helpers
  fetchReimbursements: async () => [],
  addReimbursement: async () => ({}),
  editReimbursement: async () => ({}),
  deleteReimbursement: async () => {},
});

// Function to fetch user data
const fetchUserDataFn = async (): Promise<UserData> => {
  const storedToken = await AsyncStorage.getItem("token");
  if (!storedToken) {
    return { income: [], expenses: [], budgets: [], user: null };
  }

  const response = await fetch(
    `${process.env.EXPO_PUBLIC_API_URL}/api/user/get-user-data`,
    {
      headers: {
        Authorization: `Bearer ${storedToken}`,
      },
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to get user data");
  }

  const data = await response.json();
  return {
    income: data.income || [],
    expenses: data.expenses || [],
    budgets: data.budgets || [],
    user: data.user || null,
  };
};

// Reimbursement API helpers
const fetchReimbursements = async (
  expenseId: string
): Promise<Reimbursement[]> => {
  const storedToken = await AsyncStorage.getItem("token");
  if (!storedToken) return [];
  const response = await fetch(
    `${process.env.EXPO_PUBLIC_API_URL}/api/expense/${expenseId}/reimbursement`,
    {
      headers: { Authorization: `Bearer ${storedToken}` },
    }
  );
  if (!response.ok) throw new Error("Failed to fetch reimbursements");
  return await response.json();
};
const addReimbursement = async (
  expenseId: string,
  data: Partial<Reimbursement>
): Promise<Reimbursement> => {
  const storedToken = await AsyncStorage.getItem("token");
  if (!storedToken) throw new Error("No token");
  const response = await fetch(
    `${process.env.EXPO_PUBLIC_API_URL}/api/expense/${expenseId}/reimbursement`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${storedToken}`,
      },
      body: JSON.stringify(data),
    }
  );
  if (!response.ok) throw new Error("Failed to add reimbursement");
  return await response.json();
};
const editReimbursement = async (
  expenseId: string,
  reimbursementId: string,
  data: Partial<Reimbursement>
): Promise<Reimbursement> => {
  const storedToken = await AsyncStorage.getItem("token");
  if (!storedToken) throw new Error("No token");
  const response = await fetch(
    `${process.env.EXPO_PUBLIC_API_URL}/api/expense/${expenseId}/reimbursement/${reimbursementId}`,
    {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${storedToken}`,
      },
      body: JSON.stringify(data),
    }
  );
  if (!response.ok) throw new Error("Failed to edit reimbursement");
  return await response.json();
};
const deleteReimbursement = async (
  expenseId: string,
  reimbursementId: string
): Promise<void> => {
  const storedToken = await AsyncStorage.getItem("token");
  if (!storedToken) throw new Error("No token");
  const response = await fetch(
    `${process.env.EXPO_PUBLIC_API_URL}/api/expense/${expenseId}/reimbursement/${reimbursementId}`,
    {
      method: "DELETE",
      headers: { Authorization: `Bearer ${storedToken}` },
    }
  );
  if (!response.ok) throw new Error("Failed to delete reimbursement");
};

// Create a provider component
export const DataProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const queryClient = useQueryClient();

  // Use TanStack Query to fetch and cache user data
  const {
    data = { income: [], expenses: [], user: null },
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ["userData"],
    queryFn: fetchUserDataFn,
    staleTime: 1000 * 60 * 2, // 2 minutes
  });

  // Function to manually refetch data
  const fetchUserData = async () => {
    await queryClient.invalidateQueries({ queryKey: ["userData"] });
  };

  return (
    <DataContext.Provider
      value={{
        userData: data,
        isLoading,
        isError,
        fetchUserData,
        fetchReimbursements,
        addReimbursement,
        editReimbursement,
        deleteReimbursement,
      }}
    >
      {children}
    </DataContext.Provider>
  );
};

// Create a custom hook to use the context
export const useData = () => {
  const context = useContext(DataContext);
  if (context === undefined) {
    throw new Error("useData must be used within a DataProvider");
  }
  return context;
};
