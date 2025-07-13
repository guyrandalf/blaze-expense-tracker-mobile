import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from "react-native"
import {SafeAreaView} from "react-native-safe-area-context"
import {useAuth} from "../../lib/auth"
import {Colors} from "../../utils/constant"
import React, {useState} from "react"
import AsyncStorage from "@react-native-async-storage/async-storage"
import {Expense} from "@/types/expense"
import {FontAwesome} from "@expo/vector-icons"
import {useFocusEffect} from '@react-navigation/native'
import {Picker} from '@react-native-picker/picker'
import {useData} from "@/context/DataContext"

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
  "Other"
];

export default function ExpensesScreen() {
  const { user } = useAuth()
  const { userData, isLoading: dataLoading, fetchUserData } = useData()
  const [modalVisible, setModalVisible] = useState(false)
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null)
  const [formData, setFormData] = useState({
    amount: "",
    name: "",
    category: EXPENSE_CATEGORIES[0],
    isRecurring: false,
    showCustomInput: false
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Refresh data when screen is focused
  useFocusEffect(
    React.useCallback(() => {
      fetchUserData()
    }, [fetchUserData])
  )

  // Calculate total expenses
  const totalExpenses = userData.expenses.reduce((sum, expense) => sum + expense.amount, 0)

  // Handle category change
  const handleCategoryChange = (category: string) => {
    const showCustomInput = category === "Other"
    setFormData({
      ...formData,
      category,
      showCustomInput,
      name: showCustomInput ? formData.name : category
    })
  }

  // Handle form submission
  const handleSubmit = async () => {
    if (!formData.amount || isNaN(Number(formData.amount))) {
      Alert.alert("Error", "Please enter a valid amount")
      return
    }

    // Determine the expense name based on category selection
    const expenseName = formData.category === "Other" ? formData.name : formData.category

    if (formData.category === "Other" && !formData.name.trim()) {
      Alert.alert("Error", "Please specify the expense name")
      return
    }

    setIsSubmitting(true)
    try {
      const storedToken = await AsyncStorage.getItem("token")
      if (!storedToken) return

      const endpoint = editingExpense
        ? `${process.env.EXPO_PUBLIC_API_URL}/api/expense/update/${editingExpense.id}`
        : `${process.env.EXPO_PUBLIC_API_URL}/api/expense/create`

      const method = editingExpense ? "PUT" : "POST"

      const response = await fetch(endpoint, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${storedToken}`,
        },
        body: JSON.stringify({
          amount: Number(formData.amount),
          name: expenseName,
          isRecurring: formData.isRecurring
        }),
      })

      if (response.ok) {
        setModalVisible(false)
        fetchUserData() // Use context method to refresh data
        resetForm()
      } else {
        const error = await response.json()
        Alert.alert("Error", error.error || "Failed to save expense")
      }
    } catch (error) {
      console.error("Error saving expense:", error)
      Alert.alert("Error", "Failed to save expense")
    } finally {
      setIsSubmitting(false)
    }
  }

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
            setIsSubmitting(true)
            try {
              const storedToken = await AsyncStorage.getItem("token")
              if (!storedToken) return

              const response = await fetch(
                `${process.env.EXPO_PUBLIC_API_URL}/api/expense/delete/${id}`,
                {
                  method: "DELETE",
                  headers: {
                    Authorization: `Bearer ${storedToken}`,
                  },
                }
              )

              if (response.ok) {
                fetchUserData() // Use context method to refresh data
              } else {
                const error = await response.json()
                Alert.alert("Error", error.error || "Failed to delete expense")
              }
            } catch (error) {
              console.error("Error deleting expense:", error)
              Alert.alert("Error", "Failed to delete expense")
            } finally {
              setIsSubmitting(false)
            }
          }
        }
      ]
    )
  }

  // Reset form
  const resetForm = () => {
    setFormData({
      amount: "",
      name: "",
      category: EXPENSE_CATEGORIES[0],
      isRecurring: false,
      showCustomInput: false
    })
    setEditingExpense(null)
  }

  // Set form data when editing an expense
  const setupEditForm = (expense: Expense) => {
    const category = EXPENSE_CATEGORIES.includes(expense.name || "")
      ? expense.name || ""
      : "Other"

    setFormData({
      amount: expense.amount.toString(),
      name: category === "Other" ? expense.name || "" : "",
      category: category,
      isRecurring: expense.isRecurring,
      showCustomInput: category === "Other"
    })
    setEditingExpense(expense)
    setModalVisible(true)
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Expense Management</Text>
        <Text style={styles.totalAmount}>${totalExpenses.toFixed(2)}</Text>
      </View>

      {dataLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Loading expense data...</Text>
        </View>
      ) : userData.expenses.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No expenses yet</Text>
          <Text style={styles.emptySubText}>Tap the + button to add your first expense</Text>
        </View>
      ) : (
        <FlatList
          data={userData.expenses}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <View style={styles.expenseItem}>
              <TouchableOpacity
                style={styles.expenseDetails}
                onPress={() => setupEditForm(item)}
              >
                <Text style={styles.expenseName}>{item.name || 'Unnamed Expense'}</Text>
                <Text style={styles.expenseAmount}>${item.amount.toFixed(2)}</Text>
                <Text style={styles.expenseDate}>Added: {new Date(item.createdAt).toLocaleDateString()}</Text>
              </TouchableOpacity>

              <View style={styles.expenseActions}>
                {item.isRecurring && (
                  <View style={styles.recurringBadge}>
                    <Text style={styles.recurringText}>Recurring</Text>
                  </View>
                )}
                <TouchableOpacity
                  style={styles.deleteButton}
                  onPress={() => handleDelete(item.id)}
                  disabled={isSubmitting}
                >
                  <FontAwesome name="trash" size={18} color={Colors.error} />
                </TouchableOpacity>
              </View>
            </View>
          )}
        />
      )}

      <TouchableOpacity
        style={styles.addButton}
        onPress={() => {
          resetForm()
          setModalVisible(true)
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
          setModalVisible(false)
          resetForm()
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
              onChangeText={(text) => setFormData({...formData, amount: text})}
            />

            <View style={styles.pickerContainer}>
              <Text style={styles.pickerLabel}>Expense Category:</Text>
              <Picker
                selectedValue={formData.category}
                onValueChange={(itemValue) => handleCategoryChange(itemValue)}
                style={styles.picker}
              >
                {EXPENSE_CATEGORIES.map((category) => (
                  <Picker.Item key={category} label={category} value={category} />
                ))}
              </Picker>
            </View>

            {formData.showCustomInput && (
              <TextInput
                style={styles.input}
                placeholder="Specify expense name"
                value={formData.name}
                onChangeText={(text) => setFormData({...formData, name: text})}
              />
            )}

            <TouchableOpacity
              style={styles.recurringToggle}
              onPress={() => setFormData({...formData, isRecurring: !formData.isRecurring})}
            >
              <View style={styles.toggleRow}>
                <Text style={styles.toggleLabel}>Recurring Expense: </Text>
                <View style={[
                  styles.toggleButton,
                  formData.isRecurring ? styles.toggleActive : styles.toggleInactive
                ]}>
                  <View style={[
                    styles.toggleCircle,
                    formData.isRecurring ? styles.toggleCircleRight : styles.toggleCircleLeft
                  ]} />
                </View>
              </View>
            </TouchableOpacity>

            <View style={styles.buttonRow}>
              <TouchableOpacity
                style={[styles.button, styles.cancelButton]}
                onPress={() => {
                  setModalVisible(false)
                  resetForm()
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
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: Colors.text,
  },
  header: {
    backgroundColor: Colors.background,
    padding: 20,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: Colors.light,
  },
  totalAmount: {
    fontSize: 36,
    fontWeight: "700",
    color: Colors.light,
    marginTop: 5,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.gray,
    marginBottom: 10,
  },
  emptySubText: {
    fontSize: 14,
    color: Colors.gray,
    textAlign: 'center',
  },
  expenseItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: Colors.grayLight,
    backgroundColor: Colors.light,
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
  expenseDate: {
    fontSize: 12,
    color: Colors.gray,
    marginTop: 4,
  },
  expenseActions: {
    flexDirection: 'column',
    alignItems: 'flex-end',
    gap: 8,
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
  deleteButton: {
    padding: 8,
  },
  addButton: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
    shadowColor: Colors.dark,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContent: {
    width: '85%',
    backgroundColor: Colors.light,
    borderRadius: 10,
    padding: 20,
    elevation: 5,
    shadowColor: Colors.dark,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: Colors.background,
    marginBottom: 20,
    textAlign: 'center',
  },
  input: {
    borderWidth: 1,
    borderColor: Colors.grayLight,
    borderRadius: 8,
    padding: 12,
    marginBottom: 15,
    fontSize: 16,
  },
  pickerContainer: {
    marginBottom: 15,
  },
  pickerLabel: {
    fontSize: 16,
    color: Colors.text,
    marginBottom: 5,
  },
  picker: {
    borderWidth: 1,
    borderColor: Colors.grayLight,
    borderRadius: 8,
    backgroundColor: Colors.grayLight,
  },
  recurringToggle: {
    marginBottom: 20,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
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
    alignSelf: 'flex-start',
  },
  toggleCircleRight: {
    alignSelf: 'flex-end',
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  button: {
    padding: 12,
    borderRadius: 8,
    width: '48%',
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: Colors.gray,
  },
  submitButton: {
    backgroundColor: Colors.primary,
  },
  buttonText: {
    color: Colors.light,
    fontWeight: '600',
    fontSize: 16,
  },
})
