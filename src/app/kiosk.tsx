import React, { useState, useEffect, useMemo, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ScrollView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { BookOpen, Clock, Layers, CheckCircle, Delete } from 'lucide-react-native';
import { useAppContext } from '../context/AppContext';
import { Colors, Spacing, BorderRadius } from '../constants/Theme';
import { createAttendanceLog, createPaymentAlert } from '../services/logService';

export default function StudentKioskScreen() {
  const router = useRouter();
  const { students, schedule, sysConfig, attendanceLogs, saveAllLogs, isYearCompatible, getYearLabelFromCohort, hasFullTermPayment } = useAppContext();

  const [terminalCohort, setTerminalCohort] = useState('');
  const [studentIdInput, setStudentIdInput] = useState('');
  const [currentTime, setCurrentTime] = useState(new Date());
  const [activeCourseObj, setActiveCourseObj] = useState<any>(null);
  const lastAlertedId = useRef<string | null>(null);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Slot Evaluation Logic
  useEffect(() => {
    if (!terminalCohort) {
      setActiveCourseObj(null);
      return;
    }
    const now = new Date();
    const currentDay = now.getDay();
    const currentTimeStr = now.toTimeString().split(' ')[0].substring(0, 5);
    const currentDate = now.toLocaleDateString('en-CA');

    const found = schedule.find((slot) => {
      const slotCohortId = parseInt(slot.cohort || 1);
      const insideWindow = currentDate >= slot.startDate && currentDate <= slot.endDate;
      const matchesDay = (slot.days || []).map(Number).includes(currentDay);
      const matchesTime = currentTimeStr >= slot.start && currentTimeStr <= slot.end;
      return slotCohortId === parseInt(terminalCohort) && insideWindow && matchesDay && matchesTime;
    });
    setActiveCourseObj(found || null);
  }, [terminalCohort, schedule, currentTime]);

  // Verification Result
  const verification = useMemo(() => {
    if (!studentIdInput) return { text: 'Enter ID to verify...', status: 'default' };
    if (!activeCourseObj) return { text: 'Terminal Locked: No active session check-in window detected.', status: 'error' };

    const profile = students[studentIdInput];
    if (profile) {
      const profileCohort = profile.cohort ?? profile.class ?? 1;
      const courseCohort = activeCourseObj.cohort ?? 1;
      const isCompatible = isYearCompatible(profileCohort, courseCohort);

      if (!isCompatible) {
        return {
          text: `${profile.name} is ${getYearLabelFromCohort(profileCohort)} and cannot register for ${getYearLabelFromCohort(courseCohort)} courses.`,
          status: 'error'
        };
      }

      if (!hasFullTermPayment(studentIdInput)) {
        return {
          text: `${profile.name} has not completed payment for all 4 terms. Attendance blocked.`,
          status: 'error'
        };
      }

      return {
        text: `Recognized Match: ${profile.name} [Class: ${sysConfig.cohorts[String(profileCohort)] || 'Unknown'}]`,
        status: 'success'
      };
    }
    return { text: 'Student ID unknown in system register.', status: 'error' };
  }, [studentIdInput, activeCourseObj, students, terminalCohort]);

  // Payment Alert System
  useEffect(() => {
    if (verification.status === 'error' && verification.text.includes('payment') && studentIdInput && lastAlertedId.current !== studentIdInput) {
      const profile = students[studentIdInput];
      if (profile) {
        lastAlertedId.current = studentIdInput;
        const sendAlert = async () => {
          try {
            await createPaymentAlert({
              student_id: studentIdInput,
              name: profile.name,
              course: activeCourseObj?.course || 'Unknown',
              date: new Date().toLocaleDateString('en-CA'),
              time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            });
          } catch (e) {}
        };
        sendAlert();
      }
    } else if (!studentIdInput) {
      lastAlertedId.current = null;
    }
  }, [verification.status, verification.text, studentIdInput]);

  const handleAttendanceSubmit = async () => {
    if (verification.status !== 'success' || !activeCourseObj) return;

    const profile = students[studentIdInput];
    const newLog = {
      student_id: studentIdInput,
      name: profile.name,
      course: activeCourseObj.course,
      schedule_id: activeCourseObj.id,
      session_cohort: activeCourseObj.cohort,
      profile_cohort: profile.cohort,
      date: new Date().toLocaleDateString('en-CA'),
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    try {
      const res = await createAttendanceLog(newLog);
      if (res?.success) {
        saveAllLogs([newLog, ...attendanceLogs]);
        setStudentIdInput('');
        Alert.alert('Success', `Attendance logged for ${profile.name}`);
      } else {
        Alert.alert('Error', res?.message || 'Server error');
      }
    } catch (e) {
      Alert.alert('Error', 'Connection failed');
    }
  };

  const handleKeyPress = (val: string) => {
    if (studentIdInput.length < 15) {
      setStudentIdInput(prev => prev + val);
    }
  };

  const handleDelete = () => {
    setStudentIdInput(prev => prev.slice(0, -1));
  };

  const Key = ({ value, onPress, isAction = false }: any) => (
    <TouchableOpacity
      style={[styles.key, isAction && styles.keyAction]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      {typeof value === 'string' ? (
        <Text style={[styles.keyText, isAction && styles.keyTextAction]}>{value}</Text>
      ) : (
        value
      )}
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerTitleContainer}>
          <BookOpen size={20} color={Colors.primary} />
          <Text style={styles.headerTitle}>{sysConfig.textCustoms['lbl-terminal-title']}</Text>
        </View>
        <TouchableOpacity style={styles.logoutBtn} onPress={() => { setTerminalCohort(''); setStudentIdInput(''); router.replace('/'); }}>
          <Text style={styles.logoutBtnText}>✕ Log Out</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.main}>
        <View style={styles.section}>
          <Text style={styles.label}>Select Current Active Session Track Group</Text>
          <View style={styles.cohortGrid}>
            {Object.entries(sysConfig.cohorts).map(([id, label]) => (
              <TouchableOpacity
                key={id}
                style={[
                  styles.cohortBtn,
                  terminalCohort === id && styles.cohortBtnActive
                ]}
                onPress={() => { setTerminalCohort(id); setStudentIdInput(''); }}
              >
                <Text style={[
                  styles.cohortBtnText,
                  terminalCohort === id && styles.cohortBtnTextActive
                ]}>{label as string}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.statusCard}>
          <View style={styles.statusRow}>
            <View style={styles.statusItem}>
              <View style={styles.rowAlign}>
                <Layers size={14} color={Colors.textLighter} />
                <Text style={styles.statusLabel}> ACTIVE COURSE SESSION</Text>
              </View>
              <Text style={[styles.statusValue, !activeCourseObj && styles.statusValueEmpty]}>
                {activeCourseObj ? (
                  <Text>Active Module: <Text style={{ color: Colors.primary, fontWeight: '800' }}>{activeCourseObj.course}</Text></Text>
                ) : 'Please select active group above...'}
              </Text>
            </View>
            <View style={styles.statusItem}>
              <View style={styles.rowAlign}>
                <Clock size={14} color={Colors.textLighter} />
                <Text style={styles.statusLabel}> CURRENT CHECK-IN TIME</Text>
              </View>
              <Text style={styles.statusValue}>{currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</Text>
            </View>
          </View>
        </View>

        <View style={styles.inputSection}>
          <Text style={styles.label}>Enter Your Student ID</Text>
          <View style={[styles.idDisplay, !activeCourseObj && styles.idDisplayDisabled]}>
            <Text style={[styles.idDisplayText, !studentIdInput && styles.idPlaceholder]}>
              {studentIdInput || 'Type ID here...'}
            </Text>
          </View>

          <Text style={[styles.label, { fontSize: 10, color: Colors.textLighter }]}>VERIFICATION STATUS</Text>
          <View style={[
            styles.verifBox,
            styles[`verif_${verification.status}`]
          ]}>
             <Text style={[
               styles.verifText,
               styles[`verifText_${verification.status}`]
             ]}>{verification.text}</Text>
          </View>

          {/* CUSTOM KEYPAD */}
          <View style={styles.keypadContainer}>
            <View style={styles.keypadRow}>
              <Key value="1" onPress={() => handleKeyPress('1')} />
              <Key value="2" onPress={() => handleKeyPress('2')} />
              <Key value="3" onPress={() => handleKeyPress('3')} />
            </View>
            <View style={styles.keypadRow}>
              <Key value="4" onPress={() => handleKeyPress('4')} />
              <Key value="5" onPress={() => handleKeyPress('5')} />
              <Key value="6" onPress={() => handleKeyPress('6')} />
            </View>
            <View style={styles.keypadRow}>
              <Key value="7" onPress={() => handleKeyPress('7')} />
              <Key value="8" onPress={() => handleKeyPress('8')} />
              <Key value="9" onPress={() => handleKeyPress('9')} />
            </View>
            <View style={styles.keypadRow}>
              <Key value="Clear" isAction onPress={() => setStudentIdInput('')} />
              <Key value="0" onPress={() => handleKeyPress('0')} />
              <Key value={<Delete size={24} color={Colors.secondary} />} isAction onPress={handleDelete} />
            </View>
          </View>

          <TouchableOpacity
            style={[
              styles.submitBtn,
              verification.status !== 'success' && styles.submitBtnDisabled
            ]}
            onPress={handleAttendanceSubmit}
            disabled={verification.status !== 'success'}
          >
            <CheckCircle size={20} color="#fff" />
            <Text style={styles.submitBtnText}>Confirm & Submit Attendance</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: Spacing.md, backgroundColor: Colors.white, borderBottomWidth: 1, borderBottomColor: Colors.border },
  headerTitleContainer: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  headerTitle: { fontSize: 18, fontWeight: '800', color: Colors.slate900 },
  logoutBtn: { backgroundColor: '#f1f5f9', paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, borderRadius: BorderRadius.lg },
  logoutBtnText: { fontSize: 12, fontWeight: 'bold', color: '#64748b' },
  main: { padding: Spacing.xl, gap: Spacing.xl },
  section: { gap: Spacing.sm },
  label: { fontSize: 14, fontWeight: '600', color: Colors.primary },
  cohortGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  cohortBtn: { flex: 1, minWidth: '45%', backgroundColor: Colors.white, padding: Spacing.md, borderRadius: BorderRadius.lg, borderWidth: 2, borderColor: Colors.border, alignItems: 'center' },
  cohortBtnActive: { borderColor: Colors.primary, backgroundColor: Colors.blue50 },
  cohortBtnText: { fontWeight: 'bold', color: Colors.text },
  cohortBtnTextActive: { color: Colors.primary },
  statusCard: { backgroundColor: Colors.blue50, padding: Spacing.lg, borderRadius: BorderRadius.xl, borderLeftWidth: 4, borderLeftColor: Colors.primary },
  statusRow: { flexDirection: 'row', justifyContent: 'space-between' },
  statusItem: { flex: 1 },
  rowAlign: { flexDirection: 'row', alignItems: 'center' },
  statusLabel: { fontSize: 10, fontWeight: 'bold', color: Colors.textLighter, marginBottom: 4 },
  statusValue: { fontSize: 15, fontWeight: 'bold', color: Colors.slate900 },
  statusValueEmpty: { color: Colors.textLighter, fontStyle: 'italic', fontSize: 13 },
  inputSection: { gap: Spacing.md },
  idDisplay: { backgroundColor: Colors.white, height: 60, borderRadius: BorderRadius.lg, borderWidth: 2, borderColor: Colors.border, paddingHorizontal: Spacing.lg, justifyContent: 'center' },
  idDisplayDisabled: { backgroundColor: '#f8fafc' },
  idDisplayText: { fontSize: 20, fontWeight: 'bold', color: Colors.text },
  idPlaceholder: { color: Colors.textLighter, fontWeight: '500' },
  verifBox: { padding: Spacing.md, borderRadius: BorderRadius.lg, borderWidth: 1, backgroundColor: Colors.white },
  verifText: { fontSize: 13, fontWeight: '700' },
  verif_default: { borderColor: Colors.border, backgroundColor: '#f8fafc' },
  verifText_default: { color: Colors.textLighter },
  verif_success: { borderColor: Colors.success, backgroundColor: '#f0fdf4' },
  verifText_success: { color: '#166534' },
  verif_error: { borderColor: Colors.danger, backgroundColor: '#fef2f2' },
  verifText_error: { color: '#991b1b' },
  keypadContainer: { gap: Spacing.sm, marginTop: Spacing.md },
  keypadRow: { flexDirection: 'row', gap: Spacing.sm },
  key: { flex: 1, height: 65, backgroundColor: Colors.white, borderRadius: BorderRadius.lg, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: Colors.border, elevation: 1 },
  keyAction: { backgroundColor: '#f1f5f9' },
  keyText: { fontSize: 22, fontWeight: '800', color: Colors.slate900 },
  keyTextAction: { fontSize: 14, color: Colors.secondary },
  submitBtn: { backgroundColor: Colors.primary, height: 60, borderRadius: BorderRadius.lg, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.sm, elevation: 4, marginTop: Spacing.md },
  submitBtnDisabled: { backgroundColor: '#e2e8f0', elevation: 0 },
  submitBtnText: { color: Colors.white, fontSize: 16, fontWeight: 'bold' }
} as any);
