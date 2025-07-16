import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "../../lib/auth";
import { Colors } from "../../utils/constant";
import React, { useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Expense } from "@/types/expense";
import DateTimePicker from "@react-native-community/datetimepicker";
import { FontAwesome } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { Picker } from "@react-native-picker/picker";
import { useData } from "@/context/DataContext";
import { Reimbursement } from "@/types/reimbursement";

// Common expense categories
const EXPENSE_CATEGORIES = [
  "Rent/Mortgage",
  "Utilities",
  "Groceries",
  "Transportation",
  "Dining Out",
  "Entertainment",
  "Healthcare",
  "Education",
  "Shopping",
  "Travel",
  "Insurance",
  "Savings",
  "Debt Payment",
  "Gifts/Donations",
  "Other",
];

// Currency formatter for Naira
const nairaFormatter = new Intl.NumberFormat("en-NG", {
  style: "currency",
  currency: "NGN",
});

export default function ExpensesScreen() {
  const { user } = useAuth();
  const {
    userData,
    isLoading: dataLoading,
    fetchUserData,
    fetchReimbursements,
    addReimbursement,
    editReimbursement,
    deleteReimbursement,
  } = useData();
  const [modalVisible, setModalVisible] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [formData, setFormData] = useState({
    amount: "",
    name: "",
    category: EXPENSE_CATEGORIES[0],
    isRecurring: false,
    showCustomInput: false,
    expenseDate: new Date(),
    recurrenceInterval: "monthly",
    startDate: new Date(),
    endDate: null,
  });
  const [showExpenseDatePicker, setShowExpenseDatePicker] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [reimbursementModalVisible, setReimbursementModalVisible] =
    useState(false);
  const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null);
  const [reimbursements, setReimbursements] = useState<Reimbursement[]>([]);
  const [reimbursementLoading, setReimbursementLoading] = useState(false);
  const [reimbursementForm, setReimbursementForm] = useState({
    amount: "",
    date: new Date(),
    note: "",
    status: "partial",
  });
  const [editingReimbursement, setEditingReimbursement] =
    useState<Reimbursement | null>(null);

  // Refresh data when screen is focused
  useFocusEffect(
    React.useCallback(() => {
      fetchUserData();
    }, [fetchUserData])
  );

  // Calculate total expenses
  const totalExpenses = userData.expenses.reduce(
    (sum, expense) => sum + expense.amount,
    0
  );

  // Handle category change
  const handleCategoryChange = (category: string) => {
    const showCustomInput = category === "Other";
    setFormData({
      ...formData,
      category,
      showCustomInput,
      name: showCustomInput ? formData.name : category,
    });
  };

  // Handle form submission
  const handleSubmit = async () => {
    if (!formData.amount || isNaN(Number(formData.amount))) {
      Alert.alert("Error", "Please enter a valid amount");
      return;
    }

    // Determine the expense name based on category selection
    const expenseName =
      formData.category === "Other" ? formData.name : formData.category;

    if (formData.category === "Other" && !formData.name.trim()) {
      Alert.alert("Error", "Please specify the expense name");
      return;
    }

    setIsSubmitting(true);
    try {
      const storedToken = await AsyncStorage.getItem("token");
      if (!storedToken) return;

      const endpoint = editingExpense
        ? `${process.env.EXPO_PUBLIC_API_URL}/api/expense/update/${editingExpense.id}`
        : `${process.env.EXPO_PUBLIC_API_URL}/api/expense/create`;

      const method = editingExpense ? "PUT" : "POST";

      const response = await fetch(endpoint, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${storedToken}`,
        },
        body: JSON.stringify({
          amount: Number(formData.amount),
          name: expenseName,
          isRecurring: formData.isRecurring,
          expenseDate: formData.expenseDate,
          recurrenceInterval: formData.isRecurring
            ? formData.recurrenceInterval
            : null,
          startDate: formData.isRecurring ? formData.startDate : null,
          endDate: formData.isRecurring ? formData.endDate : null,
        }),
      });

      if (response.ok) {
        setModalVisible(false);
        fetchUserData(); // Use context method to refresh data
        resetForm();
      } else {
        const error = await response.json();
        Alert.alert("Error", error.error || "Failed to save expense");
      }
    } catch (error) {
      console.error("Error saving expense:", error);
      Alert.alert("Error", "Failed to save expense");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle delete expense
  const handleDelete = async (id: string) => {
    Alert.alert(
      "Confirm Delete",
      "Are you sure you want to delete this expense?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            setIsSubmitting(true);
            try {
              const storedToken = await AsyncStorage.getItem("token");
              if (!storedToken) return;

              const response = await fetch(
                `${process.env.EXPO_PUBLIC_API_URL}/api/expense/delete/${id}`,
                {
                  method: "DELETE",
                  headers: {
                    Authorization: `Bearer ${storedToken}`,
                  },
                }
              );

              if (response.ok) {
                fetchUserData(); // Use context method to refresh data
              } else {
                const error = await response.json();
                Alert.alert("Error", error.error || "Failed to delete expense");
              }
            } catch (error) {
              console.error("Error deleting expense:", error);
              Alert.alert("Error", "Failed to delete expense");
            } finally {
              setIsSubmitting(false);
            }
          },
        },
      ]
    );
  };

  // Reset form
  const resetForm = () => {
    setFormData({
      amount: "",
      name: "",
      category: EXPENSE_CATEGORIES[0],
      isRecurring: false,
      showCustomInput: false,
      expenseDate: new Date(),
      recurrenceInterval: "monthly",
      startDate: new Date(),
      endDate: null,
    });
    setEditingExpense(null);
  };

  // Set form data when editing an expense
  const setupEditForm = (expense: Expense) => {
    const category = EXPENSE_CATEGORIES.includes(expense.name || "")
      ? expense.name || ""
      : "Other";

    setFormData({
      amount: expense.amount.toString(),
      name: category === "Other" ? expense.name || "" : "",
      category: category,
      isRecurring: expense.isRecurring,
      showCustomInput: category === "Other",
      expenseDate: expense.expenseDate
        ? new Date(expense.expenseDate)
        : new Date(),
      recurrenceInterval: expense.recurrenceInterval || "monthly",
      startDate: expense.startDate ? new Date(expense.startDate) : new Date(),
      endDate: expense.endDate ? new Date(expense.endDate) : null,
    });
    setEditingExpense(expense);
    setModalVisible(true);
  };

  // Open reimbursement modal and fetch data
  const openReimbursementModal = async (expense: Expense) => {
    setSelectedExpense(expense);
    setReimbursementModalVisible(true);
    setReimbursementLoading(true);
    try {
      const data = await fetchReimbursements(expense.id);
      setReimbursements(data);
    } catch (e) {
      setReimbursements([]);
    } finally {
      setReimbursementLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Expense Management</Text>
        <Text style={styles.totalAmount}>
          {nairaFormatter.format(totalExpenses)}
        </Text>
      </View>

      {dataLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Loading expense data...</Text>
        </View>
      ) : userData.expenses.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No expenses yet</Text>
          <Text style={styles.emptySubText}>
            Tap the + button to add your first expense
          </Text>
        </View>
      ) : (
        <FlatList
          data={userData.expenses}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => {
            // Calculate reimbursement status
            let reimbursementStatus = "none";
            let totalReimbursed = 0;
            if (item.reimbursements && item.reimbursements.length > 0) {
              totalReimbursed = item.reimbursements.reduce(
                (sum, r) => sum + r.amount,
                0
              );
              if (item.reimbursements.every((r) => r.status === "complete")) {
                reimbursementStatus = "complete";
              } else {
                reimbursementStatus = "partial";
              }
            }
            return (
              <View style={styles.expenseItem}>
                <TouchableOpacity
                  style={styles.expenseDetails}
                  onPress={() => setupEditForm(item)}
                >
                  <Text style={styles.expenseName}>
                    {item.name || "Unnamed Expense"}
                  </Text>
                  <Text style={styles.expenseAmount}>
                    {nairaFormatter.format(item.amount)}
                  </Text>
                  <Text style={styles.expenseDate}>
                    Added: {new Date(item.createdAt).toLocaleDateString()}
                  </Text>
                  {/* Reimbursement status badge */}
                  <View style={styles.reimbursementBadgeRow}>
                    {reimbursementStatus === "none" && (
                      <View
                        style={[
                          styles.reimbursementBadge,
                          { backgroundColor: Colors.grayLight },
                        ]}
                      >
                        <Text style={styles.reimbursementBadgeText}>
                          Not Reimbursed
                        </Text>
                      </View>
                    )}
                    {reimbursementStatus === "partial" && (
                      <View
                        style={[
                          styles.reimbursementBadge,
                          { backgroundColor: Colors.warning },
                        ]}
                      >
                        <Text style={styles.reimbursementBadgeText}>
                          Partially Reimbursed
                        </Text>
                      </View>
                    )}
                    {reimbursementStatus === "complete" && (
                      <View
                        style={[
                          styles.reimbursementBadge,
                          { backgroundColor: Colors.success },
                        ]}
                      >
                        <Text style={styles.reimbursementBadgeText}>
                          Fully Reimbursed
                        </Text>
                      </View>
                    )}
                  </View>
                </TouchableOpacity>
                <View style={styles.expenseActions}>
                  {item.isRecurring && (
                    <View style={styles.recurringBadge}>
                      <Text style={styles.recurringText}>Recurring</Text>
                    </View>
                  )}
                  {/* Reimbursement button */}
                  <TouchableOpacity
                    style={styles.reimbursementButton}
                    onPress={() => openReimbursementModal(item)}
                  >
                    <FontAwesome
                      name="money"
                      size={18}
                      color={Colors.primary}
                    />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.deleteButton}
                    onPress={() => handleDelete(item.id)}
                    disabled={isSubmitting}
                  >
                    <FontAwesome name="trash" size={18} color={Colors.light} />
                  </TouchableOpacity>
                </View>
              </View>
            );
          }}
        />
      )}

      <TouchableOpacity
        style={styles.addButton}
        onPress={() => {
          resetForm();
          setModalVisible(true);
        }}
      >
        <FontAwesome name="plus" size={24} color={Colors.light} />
      </TouchableOpacity>

      {/* Modal for adding/editing expense */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => {
          setModalVisible(false);
          resetForm();
        }}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              {editingExpense ? "Edit Expense" : "Add Expense"}
            </Text>

            <TextInput
              style={styles.input}
              placeholder="Amount"
              keyboardType="numeric"
              value={formData.amount}
              onChangeText={(text) =>
                setFormData({ ...formData, amount: text })
              }
            />

            <View style={styles.pickerContainer}>
              <Text style={styles.pickerLabel}>Expense Category:</Text>
              <Picker
                selectedValue={formData.category}
                onValueChange={(itemValue) => handleCategoryChange(itemValue)}
                style={styles.picker}
              >
                {EXPENSE_CATEGORIES.map((category) => (
                  <Picker.Item
                    key={category}
                    label={category}
                    value={category}
                  />
                ))}
              </Picker>
            </View>

            {formData.showCustomInput && (
              <TextInput
                style={styles.input}
                placeholder="Specify expense name"
                value={formData.name}
                onChangeText={(text) =>
                  setFormData({ ...formData, name: text })
                }
              />
            )}

            <Text style={styles.pickerLabel}>Expense Date:</Text>
            <TouchableOpacity
              style={styles.input}
              onPress={() => setShowExpenseDatePicker(true)}
            >
              <Text>
                {formData.expenseDate
                  ? new Date(formData.expenseDate).toLocaleDateString()
                  : "Select Date"}
              </Text>
            </TouchableOpacity>
            {showExpenseDatePicker && (
              <DateTimePicker
                value={formData.expenseDate || new Date()}
                mode="date"
                display="default"
                onChange={(_, date) => {
                  setShowExpenseDatePicker(false);
                  if (date) setFormData({ ...formData, expenseDate: date });
                }}
              />
            )}
            {formData.isRecurring && (
              <>
                <Text style={styles.pickerLabel}>Recurrence Interval:</Text>
                <Picker
                  selectedValue={formData.recurrenceInterval}
                  onValueChange={(itemValue) =>
                    setFormData({ ...formData, recurrenceInterval: itemValue })
                  }
                  style={styles.picker}
                >
                  <Picker.Item label="Monthly" value="monthly" />
                  <Picker.Item label="Weekly" value="weekly" />
                  <Picker.Item label="Yearly" value="yearly" />
                </Picker>
                <Text style={styles.pickerLabel}>Start Date:</Text>
                <DateTimePicker
                  value={formData.startDate || new Date()}
                  mode="date"
                  display="default"
                  onChange={(_, date) =>
                    setFormData({ ...formData, startDate: date || new Date() })
                  }
                />
                <Text style={styles.pickerLabel}>End Date (optional):</Text>
                <DateTimePicker
                  value={formData.endDate || new Date()}
                  mode="date"
                  display="default"
                  onChange={(_, date) =>
                    setFormData({ ...formData, endDate: date })
                  }
                />
              </>
            )}

            <TouchableOpacity
              style={styles.recurringToggle}
              onPress={() =>
                setFormData({ ...formData, isRecurring: !formData.isRecurring })
              }
            >
              <View style={styles.toggleRow}>
                <Text style={styles.toggleLabel}>Recurring Expense: </Text>
                <View
                  style={[
                    styles.toggleButton,
                    formData.isRecurring
                      ? styles.toggleActive
                      : styles.toggleInactive,
                  ]}
                >
                  <View
                    style={[
                      styles.toggleCircle,
                      formData.isRecurring
                        ? styles.toggleCircleRight
                        : styles.toggleCircleLeft,
                    ]}
                  />
                </View>
              </View>
            </TouchableOpacity>

            <View style={styles.buttonRow}>
              <TouchableOpacity
                style={[styles.button, styles.cancelButton]}
                onPress={() => {
                  setModalVisible(false);
                  resetForm();
                }}
              >
                <Text style={styles.buttonText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.button, styles.submitButton]}
                onPress={handleSubmit}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <ActivityIndicator size="small" color={Colors.light} />
                ) : (
                  <Text style={styles.buttonText}>
                    {editingExpense ? "Update" : "Add"}
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Reimbursement Modal */}
      <Modal
        visible={reimbursementModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => {
          setReimbursementModalVisible(false);
          setSelectedExpense(null);
          setEditingReimbursement(null);
          setReimbursementForm({
            amount: "",
            date: new Date(),
            note: "",
            status: "partial",
          });
        }}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Reimbursements</Text>
            {selectedExpense && (
              <Text style={styles.modalSubTitle}>
                {selectedExpense.name || "Expense"}
              </Text>
            )}
            {reimbursementLoading ? (
              <ActivityIndicator size="large" color={Colors.primary} />
            ) : (
              <>
                {/* Analytics */}
                <View style={styles.analyticsRow}>
                  <Text style={styles.analyticsText}>
                    Total:{" "}
                    {selectedExpense
                      ? nairaFormatter.format(selectedExpense.amount)
                      : "-"}
                  </Text>
                  <Text style={styles.analyticsText}>
                    Reimbursed:{" "}
                    {nairaFormatter.format(
                      reimbursements.reduce((sum, r) => sum + r.amount, 0)
                    )}
                  </Text>
                  <Text style={styles.analyticsText}>
                    Outstanding:{" "}
                    {selectedExpense
                      ? nairaFormatter.format(
                          selectedExpense.amount -
                            reimbursements.reduce((sum, r) => sum + r.amount, 0)
                        )
                      : "-"}
                  </Text>
                </View>
                {/* List reimbursements */}
                <FlatList
                  data={reimbursements}
                  keyExtractor={(r) => r.id}
                  style={{ maxHeight: 180, marginVertical: 10 }}
                  renderItem={({ item }) => (
                    <View style={styles.reimbursementItem}>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.reimbursementAmount}>
                          {nairaFormatter.format(item.amount)}
                        </Text>
                        <Text style={styles.reimbursementDate}>
                          {new Date(item.date).toLocaleDateString()}
                        </Text>
                        {item.note && (
                          <Text style={styles.reimbursementNote}>
                            {item.note}
                          </Text>
                        )}
                      </View>
                      <View style={styles.reimbursementStatusBadge}>
                        <Text style={{ color: Colors.light, fontSize: 12 }}>
                          {item.status === "complete" ? "Complete" : "Partial"}
                        </Text>
                      </View>
                      <TouchableOpacity
                        onPress={() => {
                          setEditingReimbursement(item);
                          setReimbursementForm({
                            amount: item.amount.toString(),
                            date: new Date(item.date),
                            note: item.note || "",
                            status: item.status,
                          });
                        }}
                      >
                        <FontAwesome
                          name="edit"
                          size={16}
                          color={Colors.primary}
                        />
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={async () => {
                          await deleteReimbursement(item.expenseId, item.id);
                          const data = await fetchReimbursements(
                            item.expenseId
                          );
                          setReimbursements(data);
                        }}
                      >
                        <FontAwesome
                          name="trash"
                          size={16}
                          color={Colors.error}
                        />
                      </TouchableOpacity>
                    </View>
                  )}
                  ListEmptyComponent={
                    <Text style={styles.emptyText}>No reimbursements yet</Text>
                  }
                />
                {/* Add/Edit reimbursement form */}
                <View style={styles.reimbursementFormRow}>
                  <TextInput
                    style={styles.input}
                    placeholder="Amount"
                    keyboardType="numeric"
                    value={reimbursementForm.amount}
                    onChangeText={(text) =>
                      setReimbursementForm({
                        ...reimbursementForm,
                        amount: text,
                      })
                    }
                  />
                  <TouchableOpacity
                    style={styles.input}
                    onPress={() => setShowExpenseDatePicker(true)}
                  >
                    <Text>
                      {reimbursementForm.date
                        ? new Date(reimbursementForm.date).toLocaleDateString()
                        : "Select Date"}
                    </Text>
                  </TouchableOpacity>
                  <TextInput
                    style={styles.input}
                    placeholder="Note (optional)"
                    value={reimbursementForm.note}
                    onChangeText={(text) =>
                      setReimbursementForm({ ...reimbursementForm, note: text })
                    }
                  />
                  <Picker
                    selectedValue={reimbursementForm.status}
                    onValueChange={(value) =>
                      setReimbursementForm({
                        ...reimbursementForm,
                        status: value,
                      })
                    }
                    style={styles.picker}
                  >
                    <Picker.Item label="Partial" value="partial" />
                    <Picker.Item label="Complete" value="complete" />
                  </Picker>
                  <TouchableOpacity
                    style={[styles.button, styles.submitButton]}
                    onPress={async () => {
                      if (!selectedExpense) return;
                      if (
                        !reimbursementForm.amount ||
                        isNaN(Number(reimbursementForm.amount))
                      )
                        return;
                      if (editingReimbursement) {
                        await editReimbursement(
                          selectedExpense.id,
                          editingReimbursement.id,
                          {
                            amount: Number(reimbursementForm.amount),
                            date: reimbursementForm.date,
                            note: reimbursementForm.note,
                            status: reimbursementForm.status,
                          }
                        );
                      } else {
                        await addReimbursement(selectedExpense.id, {
                          amount: Number(reimbursementForm.amount),
                          date: reimbursementForm.date,
                          note: reimbursementForm.note,
                          status: reimbursementForm.status,
                        });
                      }
                      const data = await fetchReimbursements(
                        selectedExpense.id
                      );
                      setReimbursements(data);
                      setEditingReimbursement(null);
                      setReimbursementForm({
                        amount: "",
                        date: new Date(),
                        note: "",
                        status: "partial",
                      });
                    }}
                  >
                    <Text style={styles.buttonText}>
                      {editingReimbursement ? "Update" : "Add"}
                    </Text>
                  </TouchableOpacity>
                  {editingReimbursement && (
                    <TouchableOpacity
                      style={[styles.button, styles.cancelButton]}
                      onPress={() => {
                        setEditingReimbursement(null);
                        setReimbursementForm({
                          amount: "",
                          date: new Date(),
                          note: "",
                          status: "partial",
                        });
                      }}
                    >
                      <Text style={styles.buttonText}>Cancel</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </>
            )}
            <TouchableOpacity
              style={[styles.button, styles.cancelButton, { marginTop: 10 }]}
              onPress={() => {
                setReimbursementModalVisible(false);
                setSelectedExpense(null);
                setEditingReimbursement(null);
                setReimbursementForm({
                  amount: "",
                  date: new Date(),
                  note: "",
                  status: "partial",
                });
              }}
            >
              <Text style={styles.buttonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    paddingTop: 0,
  },
  header: {
    backgroundColor: Colors.primary,
    padding: 28,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
    alignItems: "center",
    shadowColor: Colors.dark,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: Colors.light,
    letterSpacing: 1.2,
    marginBottom: 4,
    fontFamily: "SpaceMono-Regular",
  },
  totalAmount: {
    fontSize: 40,
    fontWeight: "800",
    color: Colors.light,
    marginTop: 8,
    textShadowColor: Colors.dark,
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 8,
  },
  expenseItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginHorizontal: 18,
    marginVertical: 10,
    padding: 18,
    borderRadius: 22,
    backgroundColor: "rgba(255,255,255,0.18)",
    shadowColor: Colors.dark,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 6,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.25)",
    backdropFilter: "blur(8px)", // for web, ignored on native
  },
  expenseDetails: {
    flex: 1,
  },
  expenseName: {
    fontSize: 18,
    fontWeight: "700",
    color: Colors.text,
    marginBottom: 2,
    fontFamily: "SpaceMono-Regular",
  },
  expenseAmount: {
    fontSize: 20,
    fontWeight: "700",
    color: Colors.error,
    marginTop: 2,
    marginBottom: 2,
    fontFamily: "SpaceMono-Regular",
  },
  expenseDate: {
    fontSize: 13,
    color: Colors.gray,
    marginTop: 2,
    fontFamily: "SpaceMono-Regular",
  },
  reimbursementBadgeRow: {
    flexDirection: "row",
    marginTop: 8,
    gap: 8,
  },
  reimbursementBadge: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 12,
    alignSelf: "flex-start",
    shadowColor: Colors.dark,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 2,
  },
  reimbursementBadgeText: {
    color: Colors.light,
    fontSize: 13,
    fontWeight: "600",
    fontFamily: "SpaceMono-Regular",
  },
  expenseActions: {
    flexDirection: "column",
    alignItems: "flex-end",
    gap: 10,
  },
  recurringBadge: {
    backgroundColor: Colors.purpleLight,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
    marginBottom: 6,
    shadowColor: Colors.purple,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  recurringText: {
    color: Colors.light,
    fontSize: 13,
    fontWeight: "600",
    fontFamily: "SpaceMono-Regular",
  },
  reimbursementButton: {
    padding: 10,
    backgroundColor: Colors.background,
    borderRadius: 10,
    marginBottom: 4,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  deleteButton: {
    padding: 10,
    backgroundColor: Colors.error,
    borderRadius: 10,
    marginTop: 4,
    shadowColor: Colors.error,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  addButton: {
    position: "absolute",
    bottom: 30,
    right: 30,
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: Colors.primary,
    justifyContent: "center",
    alignItems: "center",
    elevation: 8,
    shadowColor: Colors.dark,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
  },
  modalContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.35)",
  },
  modalContent: {
    width: "92%",
    backgroundColor: "rgba(255,255,255,0.95)",
    borderRadius: 28,
    padding: 24,
    alignItems: "center",
    shadowColor: Colors.dark,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18,
    shadowRadius: 24,
    elevation: 12,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: Colors.primary,
    marginBottom: 8,
    fontFamily: "SpaceMono-Regular",
  },
  modalSubTitle: {
    fontSize: 16,
    color: Colors.text,
    marginBottom: 15,
    textAlign: "center",
    fontFamily: "SpaceMono-Regular",
  },
  input: {
    borderWidth: 1,
    borderColor: Colors.grayLight,
    borderRadius: 12,
    padding: 12,
    marginVertical: 6,
    fontSize: 16,
    backgroundColor: "rgba(255,255,255,0.7)",
    fontFamily: "SpaceMono-Regular",
  },
  pickerContainer: {
    marginVertical: 8,
  },
  pickerLabel: {
    fontSize: 15,
    color: Colors.text,
    fontWeight: "600",
    marginBottom: 4,
    fontFamily: "SpaceMono-Regular",
  },
  picker: {
    backgroundColor: Colors.grayLight,
    borderRadius: 10,
    fontFamily: "SpaceMono-Regular",
  },
  recurringToggle: {
    marginBottom: 20,
  },
  toggleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  toggleLabel: {
    fontSize: 16,
    color: Colors.text,
  },
  toggleButton: {
    width: 50,
    height: 30,
    borderRadius: 15,
    padding: 2,
  },
  toggleActive: {
    backgroundColor: Colors.primary,
  },
  toggleInactive: {
    backgroundColor: Colors.gray,
  },
  toggleCircle: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: Colors.light,
  },
  toggleCircleLeft: {
    alignSelf: "flex-start",
  },
  toggleCircleRight: {
    alignSelf: "flex-end",
  },
  buttonRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 18,
    width: "100%",
  },
  button: {
    flex: 1,
    padding: 14,
    borderRadius: 14,
    alignItems: "center",
    marginHorizontal: 6,
    backgroundColor: Colors.primary,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  submitButton: {
    backgroundColor: Colors.success,
  },
  cancelButton: {
    backgroundColor: Colors.gray,
  },
  buttonText: {
    color: Colors.light,
    fontWeight: "600",
    fontSize: 16,
  },
  reimbursementItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: Colors.grayLight,
    gap: 10,
  },
  reimbursementAmount: {
    fontSize: 17,
    fontWeight: "700",
    color: Colors.success,
    fontFamily: "SpaceMono-Regular",
  },
  reimbursementDate: {
    fontSize: 13,
    color: Colors.gray,
    fontFamily: "SpaceMono-Regular",
  },
  reimbursementNote: {
    fontSize: 13,
    color: Colors.text,
    fontStyle: "italic",
    fontFamily: "SpaceMono-Regular",
  },
  reimbursementStatusBadge: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 10,
    marginRight: 6,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  reimbursementFormRow: {
    marginTop: 12,
    gap: 10,
    width: "100%",
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
    fontFamily: "SpaceMono-Regular",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: "600",
    color: Colors.gray,
    marginBottom: 10,
    textAlign: "center",
    fontFamily: "SpaceMono-Regular",
  },
  emptySubText: {
    fontSize: 14,
    color: Colors.gray,
    textAlign: "center",
    fontFamily: "SpaceMono-Regular",
  },
  analyticsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginVertical: 10,
    width: "100%",
  },
  analyticsText: {
    fontSize: 15,
    color: Colors.text,
    fontWeight: "600",
    fontFamily: "SpaceMono-Regular",
  },
});
