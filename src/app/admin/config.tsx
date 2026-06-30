import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, Alert, Platform, StatusBar, Modal, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Shield, Save, Type, Users, Settings, ArrowLeft, Calendar, ChevronLeft, ChevronRight, X, Clock, CheckSquare } from 'lucide-react-native';
import { useAppContext } from '../../context/AppContext';
import { Colors, Spacing, BorderRadius } from '../../constants/Theme';
import { useRouter } from 'expo-router';
import Animated, { FadeInDown, SlideInRight } from 'react-native-reanimated';

export default function AdminConfigScreen() {
  const router = useRouter();
  const { sysConfig, saveAllConfig, adminPassword, persistAdminPassword } = useAppContext();

  const [cfg, setCfg] = useState(sysConfig);
  const [passRotation, setPassRotation] = useState({ current: '', next: '', confirm: '' });

  // Custom Picker States (Mirrored from Timetable logic)
  const [pickerModal, setPickerModal] = useState<{ visible: boolean; termId: string | null; field: 'start' | 'end' | null }>({
    visible: false,
    termId: null,
    field: null
  });
  const [calendarMonth, setCalendarMonth] = useState(new Date());

  useEffect(() => {
    setCfg(sysConfig);
  }, [sysConfig]);

  const handleSaveConfig = async () => {
    await saveAllConfig(cfg);
    Alert.alert('Success', 'Configuration updated and synced to database.');
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

  // --- CUSTOM CALENDAR PICKER LOGIC ---

  const openPicker = (termId: string, field: 'start' | 'end') => {
    const currentVal = cfg.terms?.[termId]?.[field];
    const initialDate = currentVal ? new Date(currentVal) : new Date();
    if (!isNaN(initialDate.getTime())) {
      setCalendarMonth(initialDate);
    } else {
      setCalendarMonth(new Date());
    }
    setPickerModal({ visible: true, termId, field });
  };

  const handlePickerSelect = (val: string) => {
    if (pickerModal.termId && pickerModal.field) {
      setCfg({
        ...cfg,
        terms: {
          ...cfg.terms,
          [pickerModal.termId]: {
            ...(cfg.terms?.[pickerModal.termId] || {}),
            [pickerModal.field]: val
          }
        }
      });
    }
    setPickerModal({ ...pickerModal, visible: false });
  };

  const changeMonth = (offset: number) => {
    const next = new Date(calendarMonth);
    next.setMonth(next.getMonth() + offset);
    setCalendarMonth(next);
  };

  const renderCalendar = () => {
    const year = calendarMonth.getFullYear();
    const month = calendarMonth.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const monthName = calendarMonth.toLocaleString('default', { month: 'long' });

    const days = [];
    for (let i = 0; i < firstDay; i++) {
      days.push(<View key={`pad-${i}`} style={styles.calendarDayEmpty} />);
    }

    const currentVal = (pickerModal.termId && pickerModal.field) ? cfg.terms[pickerModal.termId][pickerModal.field] : '';

    for (let i = 1; i <= daysInMonth; i++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
      const isSelected = currentVal === dateStr;
      const isToday = new Date().toISOString().split('T')[0] === dateStr;

      days.push(
        <TouchableOpacity
          key={i}
          style={[
            styles.calendarDay,
            isSelected && { backgroundColor: Colors.primary },
            isToday && !isSelected && { backgroundColor: Colors.blue50 }
          ]}
          onPress={() => handlePickerSelect(dateStr)}
        >
          <Text style={[
            styles.calendarDayText,
            isSelected && { color: '#fff' },
            isToday && !isSelected && { color: Colors.primary }
          ]}>{i}</Text>
        </TouchableOpacity>
      );
    }

    return (
      <View style={styles.calendarContainer}>
        <View style={styles.calendarHeader}>
          <TouchableOpacity onPress={() => changeMonth(-1)} style={styles.calNavBtn}>
            <ChevronLeft size={20} color={Colors.primary} />
          </TouchableOpacity>
          <View style={styles.monthDisplay}>
             <Text style={styles.calendarMonthName}>{monthName}</Text>
             <Text style={styles.calendarYearName}>{year}</Text>
          </View>
          <TouchableOpacity onPress={() => changeMonth(1)} style={styles.calNavBtn}>
            <ChevronRight size={20} color={Colors.primary} />
          </TouchableOpacity>
        </View>
        <View style={styles.calendarWeekDays}>
          {['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'].map((d, i) => (
            <Text key={i} style={styles.calendarWeekDayText}>{d}</Text>
          ))}
        </View>
        <View style={styles.calendarGrid}>
          {days}
        </View>
      </View>
    );
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
            <TouchableOpacity style={styles.saveBtn} onPress={handleSaveConfig}>
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
            <TouchableOpacity style={[styles.saveBtn, { backgroundColor: '#8b5cf6' }]} onPress={handleSaveConfig}>
              <Text style={styles.saveBtnText}>Update Names</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>

        {/* 3. Academic Terms Calendar */}
        <Animated.View entering={FadeInDown.delay(250)} style={styles.section}>
          <View style={styles.sectionLabelRow}>
            <Calendar size={16} color="#059669" />
            <Text style={[styles.sectionLabel, { color: '#059669' }]}>ACADEMIC TERMS (CALENDAR)</Text>
          </View>
          <View style={styles.card}>
            <Text style={styles.helperText}>Define dates to automate student payment status checks.</Text>
            {Object.entries(cfg.terms || {}).map(([id, dates]: [string, any]) => (
              <View key={id} style={styles.termRow}>
                <View style={styles.termHeader}>
                  <Text style={styles.termLabel}>TERM {id}</Text>
                </View>
                <View style={styles.inputGrid}>
                  <View style={[styles.inputGroup, { flex: 1 }]}>
                    <Text style={styles.fieldLabel}>START DATE</Text>
                    <TouchableOpacity style={styles.modalInputTouch} onPress={() => openPicker(id, 'start')}>
                      <Calendar size={16} color={Colors.primary} />
                      <Text style={styles.modalInputTouchText}>{dates.start || 'YYYY-MM-DD'}</Text>
                    </TouchableOpacity>
                  </View>
                  <View style={[styles.inputGroup, { flex: 1 }]}>
                    <Text style={styles.fieldLabel}>END DATE</Text>
                    <TouchableOpacity style={styles.modalInputTouch} onPress={() => openPicker(id, 'end')}>
                      <Calendar size={16} color={Colors.primary} />
                      <Text style={styles.modalInputTouchText}>{dates.end || 'YYYY-MM-DD'}</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            ))}
            <TouchableOpacity style={[styles.saveBtn, { backgroundColor: '#059669' }]} onPress={handleSaveConfig}>
              <Save size={18} color="#fff" />
              <Text style={styles.saveBtnText}>Save Term Calendar</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>

        {/* 4. Password Control */}
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

      {/* CUSTOM PICKER MODAL (Mirrored from Timetable) */}
      <Modal visible={pickerModal.visible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
           <View style={styles.pickerModalContent}>
              <View style={styles.pickerHeader}>
                 <Text style={styles.pickerTitle}>Select Date</Text>
                 <TouchableOpacity onPress={() => setPickerModal({...pickerModal, visible: false})} style={styles.closeBtnMini}><X size={20} color={Colors.text} /></TouchableOpacity>
              </View>
              {renderCalendar()}
           </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  screenHeader: {
     flexDirection: 'row',
     alignItems: 'center',
     justifyContent: 'space-between',
     paddingHorizontal: 20,
     paddingTop: Platform.OS === 'android'
       ? StatusBar.currentHeight + 2
       : 2,
     paddingBottom: 50,
     backgroundColor: '#fff',
   },
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
  termRow: { gap: 8, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  termHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  termLabel: { fontSize: 11, fontWeight: '900', color: '#64748b' },
  fieldLabel: { fontSize: 10, color: '#94a3b8', fontWeight: '800', letterSpacing: 0.5 },
  helperText: { fontSize: 12, color: '#64748b', marginBottom: 5, fontWeight: '500' },
  input: { backgroundColor: '#f8fafc', borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 12, paddingHorizontal: 15, height: 48, fontSize: 15, fontWeight: '600', color: '#1e293b' },

  modalInputTouch: { backgroundColor: '#f8fafc', borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 12, paddingHorizontal: 15, height: 48, flexDirection: 'row', alignItems: 'center', gap: 10 },
  modalInputTouchText: { fontSize: 14, fontWeight: '600', color: '#1e293b' },

  saveBtn: { backgroundColor: Colors.primary, height: 52, borderRadius: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, marginTop: 5 },
  saveBtnText: { color: '#fff', fontWeight: '900', fontSize: 14, textTransform: 'uppercase', letterSpacing: 0.5 },

  // Calendar Modal Styles (Mirrored from Timetable)
  modalOverlay: { flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.6)', justifyContent: 'flex-end' },
  pickerModalContent: { backgroundColor: '#fff', borderTopLeftRadius: 32, borderTopRightRadius: 32, paddingBottom: 20 },
  pickerHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 20, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  pickerTitle: { fontSize: 16, fontWeight: '900', color: '#0f172a', textTransform: 'uppercase' },
  closeBtnMini: { width: 36, height: 36, borderRadius: 12, backgroundColor: '#f1f5f9', alignItems: 'center', justifyContent: 'center' },

  calendarContainer: { padding: 20 },
  calendarHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  monthDisplay: { alignItems: 'center' },
  calendarMonthName: { fontSize: 18, fontWeight: '900', color: '#0f172a' },
  calendarYearName: { fontSize: 12, fontWeight: '700', color: '#94a3b8' },
  calNavBtn: { width: 40, height: 40, borderRadius: 12, backgroundColor: '#f8fafc', alignItems: 'center', justifyContent: 'center' },
  calendarWeekDays: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 15, paddingHorizontal: 5 },
  calendarWeekDayText: { fontSize: 10, fontWeight: '900', color: '#94a3b8', width: 40, textAlign: 'center', letterSpacing: 0.5 },
  calendarGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'flex-start' },
  calendarDay: { width: '14.28%', height: 45, alignItems: 'center', justifyContent: 'center', borderRadius: 12, marginVertical: 2 },
  calendarDayEmpty: { width: '14.28%', height: 45, marginVertical: 2 },
  calendarDayText: { fontSize: 14, fontWeight: '700', color: '#334155' },
} as any);
