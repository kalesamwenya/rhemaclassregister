import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Shield, Save, Type, Users, Settings, ArrowLeft } from 'lucide-react-native';
import { useAppContext } from '../../context/AppContext';
import { Colors, Spacing, BorderRadius } from '../../constants/Theme';
import { useRouter } from 'expo-router';
import Animated, { FadeInDown, SlideInRight } from 'react-native-reanimated';

export default function AdminConfigScreen() {
  const router = useRouter();
  const { sysConfig, saveAllConfig, adminPassword, persistAdminPassword } = useAppContext();

  const [cfg, setCfg] = useState(sysConfig);
  const [passRotation, setPassRotation] = useState({ current: '', next: '', confirm: '' });

  const handleSaveBranding = async () => {
    await saveAllConfig(cfg);
    Alert.alert('Success', 'Terminology updated.');
  };

  const handleUpdatePassword = () => {
    if (passRotation.current !== adminPassword) {
      Alert.alert('Error', 'Current password field is incorrect.');
      return;
    }
    if (passRotation.next !== passRotation.confirm) {
      Alert.alert('Error', 'Password confirmation mismatch.');
      return;
    }
    persistAdminPassword(passRotation.next);
    setPassRotation({ current: '', next: '', confirm: '' });
    Alert.alert('Success', 'Admin access key updated.');
  };

  const updateText = (key: string, val: string) => {
    setCfg({ ...cfg, textCustoms: { ...cfg.textCustoms, [key]: val } });
  };

  const updateCohort = (id: string, val: string) => {
    setCfg({ ...cfg, cohorts: { ...cfg.cohorts, [id]: val } });
  };

  return (
    <SafeAreaView style={styles.container}>
      <Animated.View entering={SlideInRight} style={styles.screenHeader}>
          <View style={styles.headerTitleRow}>
            <TouchableOpacity onPress={() => router.replace('/')} style={styles.backBtn}>
              <ArrowLeft size={24} color={Colors.primary} />
            </TouchableOpacity>
            <Settings size={24} color={Colors.primary} />
            <Text style={styles.screenTitle}>Settings</Text>
          </View>
      </Animated.View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* 1. Interface Branding */}
        <Animated.View entering={FadeInDown.delay(100)} style={styles.section}>
          <View style={styles.sectionLabelRow}>
            <Type size={16} color={Colors.primary} />
            <Text style={styles.sectionLabel}>INTERFACE TERMINOLOGY</Text>
          </View>
          <View style={styles.card}>
            <View style={styles.inputGroup}>
              <Text style={styles.fieldLabel}>GATEWAY PORTAL TITLE</Text>
              <TextInput style={styles.input} value={cfg.textCustoms['lbl-gate-title']} onChangeText={v => updateText('lbl-gate-title', v)} />
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.fieldLabel}>GATEWAY SUBTITLE</Text>
              <TextInput style={styles.input} value={cfg.textCustoms['lbl-gate-subtitle']} onChangeText={v => updateText('lbl-gate-subtitle', v)} />
            </View>
            <View style={styles.inputGrid}>
              <View style={[styles.inputGroup, { flex: 1 }]}>
                <Text style={styles.fieldLabel}>STUDENT KIOSK HEADER</Text>
                <TextInput style={styles.input} value={cfg.textCustoms['lbl-terminal-title']} onChangeText={v => updateText('lbl-terminal-title', v)} />
              </View>
            </View>
            <TouchableOpacity style={styles.saveBtn} onPress={handleSaveBranding}>
              <Save size={18} color="#fff" />
              <Text style={styles.saveBtnText}>Save Text Framework</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>

        {/* 2. Cohort Labels */}
        <Animated.View entering={FadeInDown.delay(200)} style={styles.section}>
          <View style={styles.sectionLabelRow}>
            <Users size={16} color="#8b5cf6" />
            <Text style={[styles.sectionLabel, { color: '#8b5cf6' }]}>COHORT MAPPING</Text>
          </View>
          <View style={styles.card}>
            <View style={styles.grid}>
              {Object.entries(cfg.cohorts).map(([id, label]) => (
                <View key={id} style={[styles.inputGroup, { width: '47%' }]}>
                  <Text style={styles.fieldLabel}>COHORT {id} LABEL</Text>
                  <TextInput style={styles.input} value={label as string} onChangeText={v => updateCohort(id, v)} />
                </View>
              ))}
            </View>
            <TouchableOpacity style={[styles.saveBtn, { backgroundColor: '#8b5cf6' }]} onPress={handleSaveBranding}>
              <Text style={styles.saveBtnText}>Update Names</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>

        {/* 3. Password Control */}
        <Animated.View entering={FadeInDown.delay(300)} style={styles.section}>
          <View style={styles.sectionLabelRow}>
            <Shield size={16} color={Colors.danger} />
            <Text style={[styles.sectionLabel, { color: Colors.danger }]}>ADMIN SECURITY</Text>
          </View>
          <View style={styles.card}>
            <View style={styles.inputGroup}>
              <Text style={styles.fieldLabel}>CURRENT MASTER PASSKEY</Text>
              <TextInput style={styles.input} secureTextEntry value={passRotation.current} onChangeText={t => setPassRotation({...passRotation, current: t})} placeholder="••••••••" />
            </View>
            <View style={styles.inputGrid}>
              <View style={[styles.inputGroup, { flex: 1 }]}>
                <Text style={styles.fieldLabel}>NEW PASSKEY</Text>
                <TextInput style={styles.input} secureTextEntry value={passRotation.next} onChangeText={t => setPassRotation({...passRotation, next: t})} />
              </View>
              <View style={[styles.inputGroup, { flex: 1 }]}>
                <Text style={styles.fieldLabel}>CONFIRM</Text>
                <TextInput style={styles.input} secureTextEntry value={passRotation.confirm} onChangeText={t => setPassRotation({...passRotation, confirm: t})} />
              </View>
            </View>
            <TouchableOpacity style={[styles.saveBtn, { backgroundColor: Colors.danger }]} onPress={handleUpdatePassword}>
              <Shield size={18} color="#fff" />
              <Text style={styles.saveBtnText}>Rotate Key</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>

        <View style={{ height: 120 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  screenHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 20, paddingBottom: 10, backgroundColor: '#fff' },
  headerTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  screenTitle: { fontSize: 28, fontWeight: '900', color: '#0f172a', letterSpacing: -0.5 },
  backBtn: { width: 40, height: 40, borderRadius: 12, backgroundColor: '#f8fafc', alignItems: 'center', justifyContent: 'center' },

  content: { padding: 20, gap: 25 },
  section: { gap: 12 },
  sectionLabelRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingLeft: 4 },
  sectionLabel: { fontSize: 10, fontWeight: '900', color: Colors.primary, letterSpacing: 1.5 },
  card: { padding: 20, backgroundColor: '#fff', borderRadius: 24, borderWidth: 1, borderColor: '#f1f5f9', gap: 18, elevation: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 10 },

  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 15 },
  inputGrid: { flexDirection: 'row', gap: 12 },
  inputGroup: { gap: 6 },
  fieldLabel: { fontSize: 10, color: '#94a3b8', fontWeight: '800', letterSpacing: 0.5 },
  input: { backgroundColor: '#f8fafc', borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 12, paddingHorizontal: 15, height: 48, fontSize: 15, fontWeight: '600', color: '#1e293b' },

  saveBtn: { backgroundColor: Colors.primary, height: 52, borderRadius: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, marginTop: 5 },
  saveBtnText: { color: '#fff', fontWeight: '900', fontSize: 14, textTransform: 'uppercase', letterSpacing: 0.5 },
} as any);
