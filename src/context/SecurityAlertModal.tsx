import React from "react";
import {
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from "react-native";
import { useAppContext } from "../context/AppContext";

export const SecurityAlertModal = () => {
  const { alertModalVisible, setAlertModalVisible, activeAlert } =
    useAppContext();

  return (
    <Modal visible={alertModalVisible} transparent animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.card}>
          {/* Subtle Warning Badge */}
          <View style={styles.badge}>
            <Text style={styles.badgeText}>SECURITY ALERT</Text>
          </View>

          <Text style={styles.title}>System Intrusion</Text>
          <Text style={styles.message}>
            Unauthorized activity detected from: {"\n"}
            <Text style={styles.highlight}>
              {activeAlert?.name || "Unknown Source"}
            </Text>
          </Text>

          <TouchableOpacity
            style={styles.button}
            onPress={() => setAlertModalVisible(false)}
            activeOpacity={0.8}
          >
            <Text style={styles.buttonText}>Review Entry Log</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.4)",
    justifyContent: "center",
    alignItems: "center",
  },
  card: {
    width: "80%",
    backgroundColor: "#ffffff",
    padding: 32,
    borderRadius: 16,
    alignItems: "center",
    // Shadow for a "floating" paper effect
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 5,
  },
  badge: {
    backgroundColor: "#fef08a", // Soft Yellow
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 4,
    marginBottom: 16,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 1.5,
    color: "#854d0e",
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    color: "#18181b",
    marginBottom: 12,
  },
  message: {
    fontSize: 15,
    color: "#71717a",
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 32,
  },
  highlight: {
    fontWeight: "600",
    color: "#eab308", // Strong Yellow/Gold
  },
  button: {
    backgroundColor: "#18181b", // Modern dark charcoal
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 8,
  },
  buttonText: {
    color: "#ffffff",
    fontWeight: "600",
    letterSpacing: 0.5,
  },
});
