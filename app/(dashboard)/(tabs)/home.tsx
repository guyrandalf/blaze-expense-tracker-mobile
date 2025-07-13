import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "../../lib/auth";
import { Colors } from "../../utils/constant";
import React, { useState, useEffect } from "react";
import { useFocusEffect } from "@react-navigation/native";
import { useData } from "@/context/DataContext";

export default function HomeScreen() {
  const { user } = useAuth();
  const { userData, isLoading, fetchUserData } = useData();
  const [currentMonthIncome, setCurrentMonthIncome] = useState<number>(0);
  const [currentMonthExpenses, setCurrentMonthExpenses] = useState<number>(0);
  const [previousMonthRollover, setPreviousMonthRollover] = useState<number>(0);

  // Helper function to get current year and month in YYYY-MM format
  function getCurrentYearMonth() {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(
      2,
      "0"
    )}`;
  }

  // Calculate previous month's rollover and filter data for current month
  useEffect(() => {
    if (userData.income.length > 0 || userData.expenses.length > 0) {
      const currentYearMonth = getCurrentYearMonth();

      // Filter income for current month
      const filteredIncome = userData.income.filter((income) => {
        const incomeDate = new Date(income.createdAt);
        const incomeYearMonth = `${incomeDate.getFullYear()}-${String(
          incomeDate.getMonth() + 1
        ).padStart(2, "0")}`;
        return incomeYearMonth === currentYearMonth;
      });

      // Filter expenses for current month
      const filteredExpenses = userData.expenses.filter((expense) => {
        const expenseDate = new Date(expense.createdAt);
        const expenseYearMonth = `${expenseDate.getFullYear()}-${String(
          expenseDate.getMonth() + 1
        ).padStart(2, "0")}`;
        return expenseYearMonth === currentYearMonth;
      });

      // Calculate totals for current month
      const monthlyIncome = filteredIncome.reduce(
        (sum, income) => sum + income.amount,
        0
      );
      const monthlyExpenses = filteredExpenses.reduce(
        (sum, expense) => sum + expense.amount,
        0
      );

      setCurrentMonthIncome(monthlyIncome);
      setCurrentMonthExpenses(monthlyExpenses);

      // Calculate previous month's rollover
      // Sum all income and expenses before the current month
      const previousIncome = userData.income.filter((income) => {
        const incomeDate = new Date(income.createdAt);
        const incomeYearMonth = `${incomeDate.getFullYear()}-${String(
          incomeDate.getMonth() + 1
        ).padStart(2, "0")}`;
        return incomeYearMonth < currentYearMonth;
      });
      const previousExpenses = userData.expenses.filter((expense) => {
        const expenseDate = new Date(expense.createdAt);
        const expenseYearMonth = `${expenseDate.getFullYear()}-${String(
          expenseDate.getMonth() + 1
        ).padStart(2, "0")}`;
        return expenseYearMonth < currentYearMonth;
      });
      const prevIncomeSum = previousIncome.reduce(
        (sum, income) => sum + income.amount,
        0
      );
      const prevExpenseSum = previousExpenses.reduce(
        (sum, expense) => sum + expense.amount,
        0
      );
      setPreviousMonthRollover(prevIncomeSum - prevExpenseSum);
    } else {
      setCurrentMonthIncome(0);
      setCurrentMonthExpenses(0);
      setPreviousMonthRollover(0);
    }
  }, [userData.income, userData.expenses]);

  // Refresh data when screen is focused
  useFocusEffect(
    React.useCallback(() => {
      fetchUserData();
    }, [fetchUserData])
  );

  // Calculate total income (all-time for statistics)
  const totalIncome = userData.income.reduce(
    (sum, income) => sum + income.amount,
    0
  );

  // Get recurring income
  const recurringIncome = userData.income.filter(
    (income) => income.isRecurring
  );
  const totalRecurringIncome = recurringIncome.reduce(
    (sum, income) => sum + income.amount,
    0
  );

  // Calculate total expenses (all-time for statistics)
  const totalExpenses = userData.expenses.reduce(
    (sum, expense) => sum + expense.amount,
    0
  );

  // Get recurring expenses
  const recurringExpenses = userData.expenses.filter(
    (expense) => expense.isRecurring
  );
  const totalRecurringExpenses = recurringExpenses.reduce(
    (sum, expense) => sum + expense.amount,
    0
  );

  // Calculate balance (current month with rollover)
  const balance =
    previousMonthRollover + currentMonthIncome - currentMonthExpenses;

  return (
    <SafeAreaView style={styles.container}>
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Loading data...</Text>
        </View>
      ) : (
        <ScrollView>
          <View style={styles.topBanner}>
            <Text style={styles.welcome}>Welcome</Text>
            <Text style={styles.userName}>
              {user?.firstName} {user?.lastName}
            </Text>
            <View style={styles.summaryContainer}>
              <Text style={styles.summaryTitle}>Current Month Balance</Text>
              <Text
                style={[
                  styles.summaryAmount,
                  balance < 0 ? styles.negativeBalance : {},
                ]}
              >
                ${balance.toFixed(2)}
              </Text>
              <Text style={styles.rolloverText}>
                Previous Month Rollover: ${previousMonthRollover.toFixed(2)}
              </Text>
              <View style={styles.summaryRow}>
                <View style={styles.summaryItem}>
                  <Text style={styles.summaryItemLabel}>Month Income</Text>
                  <Text style={styles.summaryItemValue}>
                    ${currentMonthIncome.toFixed(2)}
                  </Text>
                </View>
                <View style={styles.summaryItem}>
                  <Text style={styles.summaryItemLabel}>Month Expenses</Text>
                  <Text
                    style={[styles.summaryItemValue, { color: Colors.error }]}
                  >
                    ${currentMonthExpenses.toFixed(2)}
                  </Text>
                </View>
              </View>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Income Breakdown</Text>
            {userData.income.length === 0 ? (
              <Text style={styles.noDataText}>No income data available</Text>
            ) : (
              <>
                {userData.income.map((income) => (
                  <View key={income.id} style={styles.incomeItem}>
                    <View style={styles.incomeDetails}>
                      <Text style={styles.incomeSource}>
                        {income.source || "Unnamed Source"}
                      </Text>
                      <Text style={styles.incomeAmount}>
                        ${income.amount.toFixed(2)}
                      </Text>
                    </View>
                    {income.isRecurring && (
                      <View style={styles.recurringBadge}>
                        <Text style={styles.recurringText}>Recurring</Text>
                      </View>
                    )}
                  </View>
                ))}
              </>
            )}
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Expense Breakdown</Text>
            {userData.expenses.length === 0 ? (
              <Text style={styles.noDataText}>No expense data available</Text>
            ) : (
              <>
                {userData.expenses.map((expense) => (
                  <View key={expense.id} style={styles.expenseItem}>
                    <View style={styles.expenseDetails}>
                      <Text style={styles.expenseName}>
                        {expense.name || "Unnamed Expense"}
                      </Text>
                      <Text style={styles.expenseAmount}>
                        ${expense.amount.toFixed(2)}
                      </Text>
                    </View>
                    {expense.isRecurring && (
                      <View style={styles.recurringBadge}>
                        <Text style={styles.recurringText}>Recurring</Text>
                      </View>
                    )}
                  </View>
                ))}
              </>
            )}
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              All-Time Financial Statistics
            </Text>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>Total Income:</Text>
              <Text style={styles.statValue}>${totalIncome.toFixed(2)}</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>Recurring Income:</Text>
              <Text style={styles.statValue}>
                ${totalRecurringIncome.toFixed(2)}
              </Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>Total Expenses:</Text>
              <Text style={[styles.statValue, { color: Colors.error }]}>
                ${totalExpenses.toFixed(2)}
              </Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>Recurring Expenses:</Text>
              <Text style={[styles.statValue, { color: Colors.error }]}>
                ${totalRecurringExpenses.toFixed(2)}
              </Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>All-Time Net Balance:</Text>
              <Text
                style={[
                  styles.statValue,
                  totalIncome - totalExpenses < 0
                    ? { color: Colors.error }
                    : {},
                ]}
              >
                ${(totalIncome - totalExpenses).toFixed(2)}
              </Text>
            </View>
          </View>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: Colors.text,
  },
  topBanner: {
    alignItems: "flex-start",
    backgroundColor: Colors.background,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    padding: 20,
    paddingBottom: 30,
  },
  welcome: {
    fontSize: 30,
    fontWeight: "700",
    color: Colors.light,
    marginTop: 10,
  },
  userName: {
    fontSize: 20,
    color: Colors.light,
    marginTop: 5,
    fontWeight: "400",
  },
  summaryContainer: {
    marginTop: 20,
    alignItems: "center",
    width: "100%",
  },
  summaryTitle: {
    fontSize: 16,
    color: Colors.light,
    fontWeight: "600",
  },
  summaryAmount: {
    fontSize: 36,
    color: Colors.light,
    fontWeight: "700",
    marginTop: 5,
  },
  negativeBalance: {
    color: Colors.error,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
    marginTop: 15,
  },
  summaryItem: {
    alignItems: "center",
    flex: 1,
  },
  summaryItemLabel: {
    fontSize: 14,
    color: Colors.light,
    opacity: 0.8,
  },
  summaryItemValue: {
    fontSize: 18,
    fontWeight: "600",
    color: Colors.light,
    marginTop: 5,
  },
  rolloverText: {
    fontSize: 14,
    color: Colors.gray,
    marginTop: 5,
    marginBottom: 5,
    fontStyle: "italic",
    textAlign: "center",
  },
  section: {
    padding: 20,
    backgroundColor: Colors.light,
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: Colors.background,
    marginBottom: 15,
  },
  noDataText: {
    color: Colors.gray,
    textAlign: "center",
    marginTop: 10,
  },
  incomeItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.grayLight,
  },
  incomeDetails: {
    flex: 1,
  },
  incomeSource: {
    fontSize: 16,
    fontWeight: "500",
    color: Colors.text,
  },
  incomeAmount: {
    fontSize: 18,
    fontWeight: "600",
    color: Colors.primary,
    marginTop: 4,
  },
  expenseItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.grayLight,
  },
  expenseDetails: {
    flex: 1,
  },
  expenseName: {
    fontSize: 16,
    fontWeight: "500",
    color: Colors.text,
  },
  expenseAmount: {
    fontSize: 18,
    fontWeight: "600",
    color: Colors.error,
    marginTop: 4,
  },
  recurringBadge: {
    backgroundColor: Colors.purpleLight,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  recurringText: {
    color: Colors.light,
    fontSize: 12,
    fontWeight: "500",
  },
  statItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: Colors.grayLight,
  },
  statLabel: {
    fontSize: 16,
    color: Colors.text,
  },
  statValue: {
    fontSize: 16,
    fontWeight: "600",
    color: Colors.primary,
  },
});
