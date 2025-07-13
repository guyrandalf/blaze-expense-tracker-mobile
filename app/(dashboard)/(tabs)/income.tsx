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
} from "react-native"
import {SafeAreaView} from "react-native-safe-area-context"

import {Colors} from "../../utils/constant"
import React, {useEffect, useState} from "react"
import AsyncStorage from "@react-native-async-storage/async-storage"
import {Income} from "@/types/income"
import {FontAwesome} from "@expo/vector-icons"
import {useFocusEffect} from '@react-navigation/native'
import {useData} from "@/context/DataContext"
import {Picker} from '@react-native-picker/picker'

export default function IncomeScreen() {
  const { userData, isLoading: dataLoading, fetchUserData } = useData()
  const [modalVisible, setModalVisible] = useState(false)
  const [editingIncome, setEditingIncome] = useState<Income | null>(null)
  const [formData, setFormData] = useState({
    amount: "",
    source: "",
    isRecurring: false
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Month tracking state
  const [selectedMonth, setSelectedMonth] = useState<string>(getCurrentYearMonth())
  const [filteredIncome, setFilteredIncome] = useState<Income[]>([])
  const [monthlyTotal, setMonthlyTotal] = useState<number>(0)

  // Helper function to get current year and month in YYYY-MM format
  function getCurrentYearMonth() {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  }

  // Generate last 12 months for picker
  const getLast12Months = () => {
    const months = [];
    const now = new Date();

    for (let i = 0; i < 12; i++) {
      const month = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const yearMonth = `${month.getFullYear()}-${String(month.getMonth() + 1).padStart(2, '0')}`;
      const monthName = month.toLocaleString('default', { month: 'long' });
      months.push({
        value: yearMonth,
        label: `${monthName} ${month.getFullYear()}`
      });
    }

    return months;
  };

  // Filter income by selected month
  useEffect(() => {
    if (userData.income.length > 0) {
      const filtered = userData.income.filter(income => {
        const incomeDate = new Date(income.createdAt);
        const incomeYearMonth = `${incomeDate.getFullYear()}-${String(incomeDate.getMonth() + 1).padStart(2, '0')}`;
        return incomeYearMonth === selectedMonth;
      });

      setFilteredIncome(filtered);

      // Calculate total for the month
      const total = filtered.reduce((sum, income) => sum + income.amount, 0);
      setMonthlyTotal(total);
    } else {
      setFilteredIncome([]);
      setMonthlyTotal(0);
    }
  }, [userData.income, selectedMonth]);

  // Refresh data when screen is focused
  useFocusEffect(
    React.useCallback(() => {
      fetchUserData()
    }, [fetchUserData])
  )

  // Total income is now calculated in the useEffect based on the selected month

  // Handle form submission
  const handleSubmit = async () => {
    if (!formData.amount || isNaN(Number(formData.amount))) {
      Alert.alert("Error", "Please enter a valid amount")
      return
    }

    setIsSubmitting(true)
    try {
      const storedToken = await AsyncStorage.getItem("token")
      if (!storedToken) return

      const endpoint = editingIncome
        ? `${process.env.EXPO_PUBLIC_API_URL}/api/income/update/${editingIncome.id}`
        : `${process.env.EXPO_PUBLIC_API_URL}/api/income/create`

      const method = editingIncome ? "PUT" : "POST"

      const response = await fetch(endpoint, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${storedToken}`,
        },
        body: JSON.stringify({
          amount: Number(formData.amount),
          source: formData.source,
          isRecurring: formData.isRecurring
        }),
      })

      if (response.ok) {
        setModalVisible(false)
        fetchUserData()
        resetForm()
      } else {
        const error = await response.json()
        Alert.alert("Error", error.error || "Failed to save income")
      }
    } catch (error) {
      console.error("Error saving income:", error)
      Alert.alert("Error", "Failed to save income")
    } finally {
      setIsSubmitting(false)
    }
  }

  // Handle delete income
  const handleDelete = async (id: string) => {
    Alert.alert(
      "Confirm Delete",
      "Are you sure you want to delete this income?",
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
                `${process.env.EXPO_PUBLIC_API_URL}/api/income/delete/${id}`,
                {
                  method: "DELETE",
                  headers: {
                    Authorization: `Bearer ${storedToken}`,
                  },
                }
              )

              if (response.ok) {
                fetchUserData()
              } else {
                const error = await response.json()
                Alert.alert("Error", error.error || "Failed to delete income")
              }
            } catch (error) {
              console.error("Error deleting income:", error)
              Alert.alert("Error", "Failed to delete income")
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
      source: "",
      isRecurring: false
    })
    setEditingIncome(null)
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Income Management</Text>

        <View style={styles.monthSelectorContainer}>
          <Text style={styles.monthLabel}>
            {selectedMonth === getCurrentYearMonth() ? 'Current Month' : 'Selected Month'}:
          </Text>
          <View style={styles.monthSelector}>
            <Picker
              selectedValue={selectedMonth}
              onValueChange={(itemValue) => setSelectedMonth(itemValue)}
              style={styles.picker}
              dropdownIconColor={Colors.light}
              itemStyle={styles.pickerItem}
            >
              {getLast12Months().map((month) => (
                <Picker.Item key={month.value} label={month.label} value={month.value} />
              ))}
            </Picker>
          </View>
        </View>

        <View style={styles.totalContainer}>
          <Text style={styles.totalLabel}>Monthly Total:</Text>
          <Text style={styles.totalAmount}>${monthlyTotal.toFixed(2)}</Text>
        </View>
      </View>

      {dataLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Loading income data...</Text>
        </View>
      ) : filteredIncome.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No income for {new Date(selectedMonth + '-01').toLocaleString('default', { month: 'long', year: 'numeric' })}</Text>
          <Text style={styles.emptySubText}>Tap the + button to add income for this month</Text>
        </View>
      ) : (
        <FlatList
          data={filteredIncome}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <View style={styles.incomeItem}>
              <TouchableOpacity
                style={styles.incomeDetails}
                onPress={() => {
                  setEditingIncome(item)
                  setFormData({
                    amount: item.amount.toString(),
                    source: item.source || "",
                    isRecurring: item.isRecurring
                  })
                  setModalVisible(true)
                }}
              >
                <Text style={styles.incomeSource}>{item.source || 'Unnamed Source'}</Text>
                <Text style={styles.incomeAmount}>${item.amount.toFixed(2)}</Text>
                <Text style={styles.incomeDate}>Added: {new Date(item.createdAt).toLocaleDateString()}</Text>
              </TouchableOpacity>

              <View style={styles.incomeActions}>
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

      {/* Modal for adding/editing income */}
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
              {editingIncome ? "Edit Income" : "Add Income"}
            </Text>

            <TextInput
              style={styles.input}
              placeholder="Amount"
              keyboardType="numeric"
              value={formData.amount}
              onChangeText={(text) => setFormData({...formData, amount: text})}
            />

            <TextInput
              style={styles.input}
              placeholder="Source (e.g. Salary, Freelance)"
              value={formData.source}
              onChangeText={(text) => setFormData({...formData, source: text})}
            />

            <TouchableOpacity
              style={styles.recurringToggle}
              onPress={() => setFormData({...formData, isRecurring: !formData.isRecurring})}
            >
              <View style={styles.toggleRow}>
                <Text style={styles.toggleLabel}>Recurring Income: </Text>
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
                    {editingIncome ? "Update" : "Add"}
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
  monthSelectorContainer: {
    width: '100%',
    marginTop: 15,
    marginBottom: 10,
  },
  monthLabel: {
    fontSize: 14,
    fontWeight: "500",
    color: Colors.light,
    marginBottom: 5,
    opacity: 0.9,
  },
  monthSelector: {
    width: '100%',
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 10,
    overflow: 'hidden',
  },
  picker: {
    width: '100%',
    color: Colors.light,
    height: 50,
  },
  pickerItem: {
    color: Colors.light,
    fontSize: 16,
  },
  totalContainer: {
    alignItems: 'center',
    marginTop: 5,
  },
  totalLabel: {
    fontSize: 14,
    fontWeight: "500",
    color: Colors.light,
    opacity: 0.9,
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
  incomeItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: Colors.grayLight,
    backgroundColor: Colors.light,
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
  incomeDate: {
    fontSize: 12,
    color: Colors.gray,
    marginTop: 4,
  },
  incomeActions: {
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
