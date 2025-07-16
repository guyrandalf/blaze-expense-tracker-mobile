import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  Alert,
  ActivityIndicator,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useData } from "@/context/DataContext";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Budget, BudgetItem } from "@/types/budget";
import { Colors } from "../../utils/constant";
import { Picker } from "@react-native-picker/picker";

const nairaFormatter = new Intl.NumberFormat("en-NG", {
  style: "currency",
  currency: "NGN",
});

const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

const getCurrentYearMonthNum = () => {
  const now = new Date();
  return { year: now.getFullYear(), month: now.getMonth() + 1 };
};

export default function BudgetScreen() {
  const { userData, fetchUserData } = useData();
  const { year, month } = getCurrentYearMonthNum();
  const [loading, setLoading] = useState(true);
  const [budget, setBudget] = useState<Budget | null>(null);
  const [expectedIncome, setExpectedIncome] = useState("");
  const [items, setItems] = useState<BudgetItem[]>([]);
  const [newCategory, setNewCategory] = useState("");
  const [newAmount, setNewAmount] = useState("");
  const [saving, setSaving] = useState(false);
  const [reconciliation, setReconciliation] = useState<{
    [cat: string]: number;
  }>({});
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [editCategory, setEditCategory] = useState("");
  const [editAmount, setEditAmount] = useState("");
  const [selectedMonth, setSelectedMonth] = useState(month);
  const [selectedYear, setSelectedYear] = useState(year);

  useEffect(() => {
    const fetchBudget = async () => {
      setLoading(true);
      const storedToken = await AsyncStorage.getItem("token");
      if (!storedToken) return;
      const res = await fetch(
        `${process.env.EXPO_PUBLIC_API_URL}/api/budget/get?month=${selectedMonth}&year=${selectedYear}`,
        { headers: { Authorization: `Bearer ${storedToken}` } }
      );
      if (res.ok) {
        const data = await res.json();
        setBudget(data);
        setExpectedIncome(
          data?.expectedIncome ? String(data.expectedIncome) : ""
        );
        setItems(data?.items || []);
      }
      setLoading(false);
    };
    fetchBudget();
  }, [userData.budgets, selectedMonth, selectedYear]);

  useEffect(() => {
    // Calculate reconciliation: actual spent per category
    const rec: { [cat: string]: number } = {};
    userData.expenses.forEach((exp) => {
      // Only count expenses for the selected month/year
      const expDate = exp.expenseDate
        ? new Date(exp.expenseDate)
        : new Date(exp.createdAt);
      if (
        expDate.getFullYear() === selectedYear &&
        expDate.getMonth() + 1 === selectedMonth
      ) {
        const cat = exp.name || "Other";
        rec[cat] = (rec[cat] || 0) + exp.amount;
      }
    });
    setReconciliation(rec);
  }, [userData.expenses, selectedMonth, selectedYear]);

  const handleSaveBudget = async () => {
    setSaving(true);
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
        body: JSON.stringify({
          month: selectedMonth,
          year: selectedYear,
          expectedIncome: expectedIncome ? Number(expectedIncome) : undefined,
          items: items.map((i) => ({
            category: i.category,
            estimatedAmount: i.estimatedAmount,
          })),
        }),
      }
    );
    setSaving(false);
    if (res.ok) {
      Alert.alert("Success", "Budget saved!");
      fetchUserData();
    } else {
      Alert.alert("Error", "Failed to save budget");
    }
  };

  const handleAddItem = () => {
    if (!newCategory.trim() || !newAmount || isNaN(Number(newAmount))) return;
    setItems([
      ...items,
      {
        id: Math.random().toString(),
        budgetId: budget?.id || "temp",
        category: newCategory.trim(),
        estimatedAmount: Number(newAmount),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ]);
    setNewCategory("");
    setNewAmount("");
  };

  const handleDeleteItem = (id: string) => {
    setItems(items.filter((i) => i.id !== id));
  };

  const handleEditItem = (item: BudgetItem) => {
    setEditingItemId(item.id);
    setEditCategory(item.category);
    setEditAmount(String(item.estimatedAmount));
  };
  const handleSaveEditItem = (id: string) => {
    setItems(
      items.map((i) =>
        i.id === id
          ? {
              ...i,
              category: editCategory,
              estimatedAmount: Number(editAmount),
            }
          : i
      )
    );
    setEditingItemId(null);
    setEditCategory("");
    setEditAmount("");
  };

  // Analytics
  const totalEstimated = items.reduce(
    (sum, i) => sum + (i.estimatedAmount || 0),
    0
  );
  const totalActual = items.reduce(
    (sum, i) => sum + (reconciliation[i.category] || 0),
    0
  );
  const totalDiff = totalEstimated - totalActual;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.headerCard}>
        <Text style={styles.title}>
          Budget for {MONTHS[selectedMonth - 1]} {selectedYear}
        </Text>
        <View style={styles.pickerRow}>
          <Picker
            selectedValue={selectedMonth}
            style={styles.picker}
            onValueChange={setSelectedMonth}
          >
            {MONTHS.map((m, i) => (
              <Picker.Item key={m} label={m} value={i + 1} />
            ))}
          </Picker>
          <Picker
            selectedValue={selectedYear}
            style={styles.picker}
            onValueChange={setSelectedYear}
          >
            {[...Array(5)].map((_, i) => {
              const y = year - 2 + i;
              return <Picker.Item key={y} label={String(y)} value={y} />;
            })}
          </Picker>
        </View>
      </View>

      <View style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>Expected Income</Text>
        <TextInput
          style={styles.input}
          keyboardType="numeric"
          value={expectedIncome}
          onChangeText={setExpectedIncome}
          placeholder="Enter expected income"
        />
      </View>

      <View style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>Budget Items</Text>
        <FlatList
          data={items}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <View style={styles.itemRow}>
              {editingItemId === item.id ? (
                <>
                  <TextInput
                    style={[styles.input, { flex: 1 }]}
                    value={editCategory}
                    onChangeText={setEditCategory}
                  />
                  <TextInput
                    style={[styles.input, { flex: 1, marginLeft: 8 }]}
                    value={editAmount}
                    keyboardType="numeric"
                    onChangeText={setEditAmount}
                  />
                  <TouchableOpacity onPress={() => handleSaveEditItem(item.id)}>
                    <Text style={styles.addBtnText}>Save</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => setEditingItemId(null)}>
                    <Text style={styles.deleteBtn}>Cancel</Text>
                  </TouchableOpacity>
                </>
              ) : (
                <>
                  <Text style={styles.itemCategory}>{item.category}</Text>
                  <Text style={styles.itemAmount}>
                    {nairaFormatter.format(item.estimatedAmount)}
                  </Text>
                  <Text style={styles.itemActual}>
                    Actual:{" "}
                    {nairaFormatter.format(reconciliation[item.category] || 0)}
                  </Text>
                  <Text style={styles.itemDiff}>
                    Diff:{" "}
                    {nairaFormatter.format(
                      (item.estimatedAmount || 0) -
                        (reconciliation[item.category] || 0)
                    )}
                  </Text>
                  <TouchableOpacity onPress={() => handleEditItem(item)}>
                    <Text style={styles.addBtnText}>Edit</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => handleDeleteItem(item.id)}>
                    <Text style={styles.deleteBtn}>Delete</Text>
                  </TouchableOpacity>
                </>
              )}
            </View>
          )}
          ListEmptyComponent={
            <Text style={styles.emptyText}>No budget items yet.</Text>
          }
          contentContainerStyle={{ paddingBottom: 120 }}
        />
        <View style={styles.addRow}>
          <TextInput
            style={[styles.input, { flex: 1 }]}
            placeholder="Category"
            value={newCategory}
            onChangeText={setNewCategory}
          />
          <TextInput
            style={[styles.input, { flex: 1, marginLeft: 8 }]}
            placeholder="Estimated Amount"
            keyboardType="numeric"
            value={newAmount}
            onChangeText={setNewAmount}
          />
          <TouchableOpacity style={styles.addBtn} onPress={handleAddItem}>
            <Text style={styles.addBtnText}>Add</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>Summary</Text>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Total Estimated:</Text>
          <Text style={styles.summaryValue}>
            {nairaFormatter.format(totalEstimated)}
          </Text>
        </View>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Total Actual:</Text>
          <Text style={styles.summaryValue}>
            {nairaFormatter.format(totalActual)}
          </Text>
        </View>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Total Difference:</Text>
          <Text
            style={[
              styles.summaryValue,
              { color: totalDiff < 0 ? Colors.error : Colors.success },
            ]}
          >
            {nairaFormatter.format(totalDiff)}
          </Text>
        </View>
      </View>

      <TouchableOpacity
        style={styles.saveBtn}
        onPress={handleSaveBudget}
        disabled={saving}
      >
        <Text style={styles.saveBtnText}>
          {saving ? "Saving..." : "Save Budget"}
        </Text>
      </TouchableOpacity>
      {loading && <ActivityIndicator size="large" color={Colors.primary} />}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light,
  },
  headerCard: {
    backgroundColor: Colors.background,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    padding: 20,
    alignItems: "center",
    marginBottom: 15,
  },
  title: {
    fontSize: 22,
    fontWeight: "bold",
    color: Colors.light,
    marginBottom: 10,
  },
  pickerRow: {
    flexDirection: "row",
    width: "100%",
    marginTop: 10,
    justifyContent: "space-between",
  },
  picker: {
    flex: 1,
    backgroundColor: Colors.light,
    borderRadius: 8,
    marginHorizontal: 5,
  },
  sectionCard: {
    backgroundColor: Colors.light,
    borderRadius: 12,
    padding: 15,
    marginBottom: 15,
    shadowColor: Colors.dark,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: Colors.background,
    marginBottom: 10,
  },
  input: {
    borderWidth: 1,
    borderColor: Colors.grayLight,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 10,
    backgroundColor: Colors.light,
  },
  itemRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
    backgroundColor: Colors.grayLight,
    borderRadius: 8,
    padding: 8,
  },
  itemCategory: {
    flex: 1,
    fontSize: 16,
    color: Colors.text,
  },
  itemAmount: {
    flex: 1,
    fontSize: 16,
    color: Colors.primary,
  },
  itemActual: {
    flex: 1,
    fontSize: 14,
    color: Colors.success,
  },
  itemDiff: {
    flex: 1,
    fontSize: 14,
    color: Colors.error,
  },
  deleteBtn: {
    color: Colors.error,
    fontWeight: "bold",
    marginLeft: 8,
  },
  addRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 10,
    marginBottom: 10,
  },
  addBtn: {
    backgroundColor: Colors.primary,
    padding: 12,
    borderRadius: 8,
    marginLeft: 8,
  },
  addBtnText: {
    color: Colors.light,
    fontWeight: "bold",
  },
  saveBtn: {
    backgroundColor: Colors.primary,
    padding: 16,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 10,
    marginBottom: 30,
  },
  saveBtnText: {
    color: Colors.light,
    fontWeight: "bold",
    fontSize: 18,
  },
  emptyText: {
    color: Colors.gray,
    textAlign: "center",
    marginVertical: 20,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  summaryLabel: {
    fontSize: 16,
    color: Colors.text,
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: "bold",
    color: Colors.primary,
  },
});
