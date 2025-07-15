import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  TextInput,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "../../lib/auth";
import { Colors } from "../../utils/constant";
import { AntDesign, FontAwesome6 } from "@expo/vector-icons";
import { useData } from "@/context/DataContext";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useState, useEffect, useCallback } from "react";
import { useFocusEffect } from "@react-navigation/native";

export default function ProfileScreen() {
  const { user, signOut } = useAuth();
  const { userData, isLoading, fetchUserData } = useData();

  // Refresh data when screen is focused
  useFocusEffect(
    useCallback(() => {
      fetchUserData();
    }, [fetchUserData])
  );

  // Calculate financial summary
  const totalIncome = userData.income.reduce(
    (sum, income) => sum + income.amount,
    0
  );
  const totalExpenses = userData.expenses.reduce(
    (sum, expense) => sum + expense.amount,
    0
  );
  const balance = totalIncome - totalExpenses;

  // Calculate recurring amounts
  const recurringIncome = userData.income
    .filter((income) => income.isRecurring)
    .reduce((sum, income) => sum + income.amount, 0);
  const recurringExpenses = userData.expenses
    .filter((expense) => expense.isRecurring)
    .reduce((sum, expense) => sum + expense.amount, 0);

  const getCurrentYearMonthNum = () => {
    const now = new Date();
    return { year: now.getFullYear(), month: now.getMonth() + 1 };
  };

  const [budgetAmount, setBudgetAmount] = useState("");
  const [currentBudget, setCurrentBudget] = useState<number | null>(null);
  const [isBudgetSubmitting, setIsBudgetSubmitting] = useState(false);
  const { year, month } = getCurrentYearMonthNum();
  useEffect(() => {
    const found = userData.budgets.find(
      (b) => b.year === year && b.month === month
    );
    setCurrentBudget(found ? found.amount : null);
  }, [userData.budgets]);

  const handleBudgetSubmit = async () => {
    if (!budgetAmount || isNaN(Number(budgetAmount))) return;
    setIsBudgetSubmitting(true);
    const storedToken = await AsyncStorage.getItem("token");
    if (!storedToken) return;
    const res = await fetch(
      `${process.env.EXPO_PUBLIC_API_URL}/api/budget/create`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${storedToken}`,
        },
        body: JSON.stringify({ month, year, amount: Number(budgetAmount) }),
      }
    );
    setIsBudgetSubmitting(false);
    if (res.ok) {
      setBudgetAmount("");
      fetchUserData();
    }
  };

  // Format date for better display
  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const nairaFormatter = new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
  });

  return (
    <SafeAreaView style={styles.container}>
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Loading profile data...</Text>
        </View>
      ) : (
        <ScrollView>
          <View style={styles.headerContainer}>
            <View style={styles.headerContent}>
              <FontAwesome6 name="user-circle" size={80} color={Colors.light} />
              <Text style={styles.userName}>
                {user?.firstName} {user?.lastName}
              </Text>
              <Text style={styles.userEmail}>{user?.email}</Text>
            </View>
            <View
              style={[
                styles.bubble,
                { top: 20, left: 20, width: 40, height: 40 },
              ]}
            />
            <View
              style={[
                styles.bubble,
                { top: 60, right: 40, width: 30, height: 30 },
              ]}
            />
            <View
              style={[
                styles.bubble,
                { bottom: 40, left: 60, width: 50, height: 50 },
              ]}
            />
            <View
              style={[
                styles.bubble,
                { top: 100, right: 80, width: 25, height: 25 },
              ]}
            />
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Account Information</Text>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Member Since</Text>
              <Text style={styles.infoValue}>
                {formatDate(user?.createdAt)}
              </Text>
            </View>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Last Updated</Text>
              <Text style={styles.infoValue}>
                {formatDate(user?.updatedAt)}
              </Text>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Financial Summary</Text>
            <View style={styles.financialCards}>
              <View style={[styles.card, styles.incomeCard]}>
                <FontAwesome6
                  name="arrow-trend-up"
                  size={24}
                  color={Colors.primary}
                />
                <Text style={styles.cardTitle}>Income</Text>
                <Text style={styles.cardAmount}>
                  {nairaFormatter.format(totalIncome)}
                </Text>
                <Text style={styles.cardSubtitle}>
                  {userData.income.length} source
                  {userData.income.length !== 1 ? "s" : ""}
                </Text>
              </View>

              <View style={[styles.card, styles.expenseCard]}>
                <FontAwesome6
                  name="arrow-trend-down"
                  size={24}
                  color={Colors.error}
                />
                <Text style={styles.cardTitle}>Expenses</Text>
                <Text style={[styles.cardAmount, { color: Colors.error }]}>
                  {nairaFormatter.format(totalExpenses)}
                </Text>
                <Text style={styles.cardSubtitle}>
                  {userData.expenses.length} expense
                  {userData.expenses.length !== 1 ? "s" : ""}
                </Text>
              </View>
            </View>

            <View style={[styles.card, styles.balanceCard]}>
              <AntDesign
                name="wallet"
                size={24}
                color={balance >= 0 ? Colors.success : Colors.error}
              />
              <Text style={styles.cardTitle}>Balance</Text>
              <Text
                style={[
                  styles.cardAmount,
                  { color: balance >= 0 ? Colors.success : Colors.error },
                ]}
              >
                {nairaFormatter.format(balance)}
              </Text>
              <View style={styles.balanceDetails}>
                <Text style={styles.balanceDetailText}>
                  Recurring Income: {nairaFormatter.format(recurringIncome)}
                </Text>
                <Text style={styles.balanceDetailText}>
                  Recurring Expenses: {nairaFormatter.format(recurringExpenses)}
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Monthly Budget</Text>
            {currentBudget !== null ? (
              <Text>
                Current Budget: {nairaFormatter.format(currentBudget)}
              </Text>
            ) : (
              <Text>No budget set for this month.</Text>
            )}
            <TextInput
              style={styles.input}
              placeholder="Set/Update Budget (₦)"
              keyboardType="numeric"
              value={budgetAmount}
              onChangeText={setBudgetAmount}
            />
            <Pressable
              onPress={handleBudgetSubmit}
              style={({ pressed }) => [
                {
                  backgroundColor: pressed ? Colors.purpleDark : Colors.primary,
                  opacity: isBudgetSubmitting ? 0.5 : 1,
                },
                styles.logoutButton,
              ]}
              disabled={isBudgetSubmitting}
            >
              <Text style={styles.logoutText}>
                {isBudgetSubmitting ? "Saving..." : "Save Budget"}
              </Text>
            </Pressable>
          </View>

          <View style={styles.logoutContainer}>
            <Pressable
              onPress={() => signOut()}
              style={({ pressed }) => [
                {
                  backgroundColor: pressed ? Colors.purpleDark : Colors.error,
                },
                styles.logoutButton,
              ]}
            >
              <AntDesign
                name="logout"
                size={18}
                color={Colors.light}
                style={styles.logoutIcon}
              />
              <Text style={styles.logoutText}>Logout</Text>
            </Pressable>
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
  bubble: {
    position: "absolute",
    backgroundColor: "rgba(255, 255, 255, 0.3)",
    borderRadius: 50,
  },
  headerContainer: {
    height: 220,
    backgroundColor: Colors.background,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    position: "relative",
    overflow: "hidden",
  },
  headerContent: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1,
  },
  userName: {
    fontSize: 24,
    fontWeight: "bold",
    color: Colors.light,
    marginTop: 10,
  },
  userEmail: {
    fontSize: 16,
    color: Colors.light,
    opacity: 0.8,
  },
  section: {
    padding: 20,
    backgroundColor: Colors.light,
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: Colors.background,
    marginBottom: 15,
  },
  infoItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: Colors.grayLight,
  },
  infoLabel: {
    fontSize: 16,
    color: Colors.text,
  },
  infoValue: {
    fontSize: 16,
    fontWeight: "500",
    color: Colors.dark,
  },
  financialCards: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 15,
  },
  card: {
    backgroundColor: Colors.light,
    borderRadius: 12,
    padding: 15,
    alignItems: "center",
    shadowColor: Colors.dark,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  incomeCard: {
    flex: 1,
    marginRight: 8,
    borderWidth: 1,
    borderColor: Colors.grayLight,
  },
  expenseCard: {
    flex: 1,
    marginLeft: 8,
    borderWidth: 1,
    borderColor: Colors.grayLight,
  },
  balanceCard: {
    width: "100%",
    marginTop: 10,
    borderWidth: 1,
    borderColor: Colors.grayLight,
  },
  cardTitle: {
    fontSize: 14,
    color: Colors.gray,
    marginTop: 8,
  },
  cardAmount: {
    fontSize: 22,
    fontWeight: "bold",
    color: Colors.primary,
    marginTop: 5,
  },
  cardSubtitle: {
    fontSize: 12,
    color: Colors.gray,
    marginTop: 5,
  },
  balanceDetails: {
    width: "100%",
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: Colors.grayLight,
  },
  balanceDetailText: {
    fontSize: 14,
    color: Colors.text,
    marginBottom: 5,
  },
  logoutContainer: {
    alignItems: "center",
    marginVertical: 20,
  },
  logoutButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 15,
    borderRadius: 10,
    width: "80%",
  },
  logoutIcon: {
    marginRight: 10,
  },
  logoutText: {
    color: Colors.light,
    fontSize: 18,
    fontWeight: "bold",
    textAlign: "center",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  input: {
    height: 50,
    borderColor: Colors.grayLight,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
    marginTop: 15,
    fontSize: 18,
    color: Colors.dark,
  },
});
