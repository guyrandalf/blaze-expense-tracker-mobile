import React, { createContext, useContext } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Income } from "@/types/income";
import { Expense } from "@/types/expense";
import { useQuery, useQueryClient } from "@tanstack/react-query";

// Define the shape of our context data
interface UserData {
  income: Income[];
  expenses: Expense[];
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
}

// Create the context with default values
const DataContext = createContext<DataContextType>({
  userData: { income: [], expenses: [], user: null },
  isLoading: false,
  isError: false,
  fetchUserData: async () => {},
});

// Function to fetch user data
const fetchUserDataFn = async (): Promise<UserData> => {
  const storedToken = await AsyncStorage.getItem("token");
  if (!storedToken) {
    return { income: [], expenses: [], user: null };
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
    user: data.user || null,
  };
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
