import React from "react";
import { Modal, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useAppContext } from "../context/AppContext"; // Adjust path

export const SecurityAlertModal = () => {
  const { alertModalVisible, setAlertModalVisible, activeAlert } =
    useAppContext();

  return (
    <Modal visible={alertModalVisible} transparent animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.card}>
          <Text style={styles.title}>Security Alert</Text>
          <Text style={styles.message}>
            {activeAlert?.name} attempt blocked.
          </Text>
          <TouchableOpacity
            style={styles.button}
            onPress={() => setAlertModalVisible(false)}
          >
            <Text style={styles.buttonText}>View Alerts</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "center",
    alignItems: "center",
  },
  card: {
    width: "85%",
    backgroundColor: "#fff",
    padding: 24,
    borderRadius: 20,
    alignItems: "center",
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#dc2626",
    marginBottom: 12,
  },
  message: { fontSize: 16, marginBottom: 24, textAlign: "center" },
  button: {
    backgroundColor: "#3b82f6",
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 10,
  },
  buttonText: { color: "#fff", fontWeight: "600" },
});
