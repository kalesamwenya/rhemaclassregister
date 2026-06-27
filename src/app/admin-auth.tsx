import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Lock, Eye, EyeOff, Shield, ArrowLeft } from 'lucide-react-native';
import { useAppContext } from '../context/AppContext';
import { Colors, Spacing, BorderRadius } from '../constants/Theme';

export default function AdminAuthScreen() {
  const router = useRouter();
  const { adminPassword } = useAppContext();
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState(false);

  const handleVerify = () => {
    if (password === adminPassword) {
      router.replace('/admin/students');
    } else {
      setError(true);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.content}
      >
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <ArrowLeft size={20} color={Colors.textLight} />
          <Text style={styles.backText}>Exit</Text>
        </TouchableOpacity>

        <View style={styles.card}>
          <View style={styles.header}>
            <Lock size={24} color={Colors.primary} />
            <Text style={styles.title}>Security Verification</Text>
          </View>

          <View style={styles.inputSection}>
            <Text style={styles.label}>ENTER ADMIN PASSWORD</Text>
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.input}
                secureTextEntry={!showPassword}
                value={password}
                onChangeText={(text) => {
                  setPassword(text);
                  setError(false);
                }}
                placeholder="••••••••"
                placeholderTextColor={Colors.textLighter}
              />
              <TouchableOpacity
                onPress={() => setShowPassword(!showPassword)}
                style={styles.eyeIcon}
              >
                {showPassword ? <EyeOff size={20} color={Colors.textLighter} /> : <Eye size={20} color={Colors.textLighter} />}
              </TouchableOpacity>
            </View>

            {error && (
              <View style={styles.errorContainer}>
                <Text style={styles.errorText}>Invalid authentication credentials.</Text>
              </View>
            )}

            <TouchableOpacity style={styles.verifyButton} onPress={handleVerify}>
              <Shield size={18} color={Colors.white} />
              <Text style={styles.verifyButtonText}>Verify & Unlock Dashboard</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    flex: 1,
    padding: Spacing.xl,
    justifyContent: 'center',
  },
  backButton: {
    position: 'absolute',
    top: Spacing.xl,
    right: Spacing.xl,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.blue100,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    gap: Spacing.xs,
  },
  backText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: Colors.textLight,
  },
  card: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.xl,
    padding: Spacing.xl,
    elevation: 4,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.xl,
    paddingBottom: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.blue50,
    gap: Spacing.sm,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.slate900,
  },
  inputSection: {
    gap: Spacing.md,
  },
  label: {
    fontSize: 10,
    fontWeight: '800',
    color: Colors.textLighter,
    letterSpacing: 1,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: Colors.border,
    borderRadius: BorderRadius.lg,
    paddingHorizontal: Spacing.md,
  },
  input: {
    flex: 1,
    height: 50,
    fontSize: 18,
    color: Colors.text,
    textAlign: 'center',
    letterSpacing: 4,
  },
  eyeIcon: {
    padding: Spacing.sm,
  },
  errorContainer: {
    backgroundColor: '#fef2f2',
    padding: Spacing.sm,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: '#fee2e2',
  },
  errorText: {
    color: Colors.danger,
    fontSize: 12,
    textAlign: 'center',
    fontWeight: '600',
  },
  verifyButton: {
    backgroundColor: Colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 55,
    borderRadius: BorderRadius.lg,
    gap: Spacing.sm,
    marginTop: Spacing.sm,
    elevation: 2,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 4,
  },
  verifyButtonText: {
    color: Colors.white,
    fontWeight: 'bold',
    fontSize: 14,
  },
});
