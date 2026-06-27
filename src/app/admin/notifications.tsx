import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert, Modal, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Bell, Trash2, ArrowLeft, User, AlertTriangle, X, Download, ShieldCheck, Clock, FileText } from 'lucide-react-native';
import { useAppContext } from '../../context/AppContext';
import { Colors, Spacing, BorderRadius } from '../../constants/Theme';
import { useRouter } from 'expo-router';
import Animated, { FadeInDown, SlideInRight } from 'react-native-reanimated';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';

export default function AdminNotificationsScreen() {
  const router = useRouter();
  const { paymentAlerts, saveAllAlerts, markAlertAsRead } = useAppContext();
  const [selectedAlert, setSelectedAlert] = useState<any>(null);

  const [customAlert, setCustomAlert] = useState<{
    visible: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  }>({
    visible: false,
    title: '',
    message: '',
    onConfirm: () => {},
  });

  const clearAllAlerts = () => {
    const performClear = async () => {
      setCustomAlert(prev => ({ ...prev, visible: false }));
      await saveAllAlerts([]);
    };

    setCustomAlert({
      visible: true,
      title: 'Clear Security Feed',
      message: 'Are you sure you want to permanently remove all payment block notifications from the server?',
      onConfirm: performClear
    });
  };

  const openAlertDetail = (item: any) => {
    setSelectedAlert(item);
    if (!item.is_read) {
       markAlertAsRead(item.id);
    }
  };

  const exportAlertsCSV = async () => {
    if (paymentAlerts.length === 0) {
      Alert.alert('No Data', 'No alerts to export.');
      return;
    }

    const header = 'ID,Student ID,Name,Course,Date,Time,Status\n';
    const rows = paymentAlerts.map(a =>
      `"${a.id}","${a.student_id}","${a.name}","${a.course}","${a.date}","${a.time}","${a.is_read ? 'Read' : 'New'}"`
    ).join('\n');

    const csvContent = header + rows;
    const fileName = `Security_Alerts_Report.csv`;

    if (Platform.OS === 'web') {
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } else {
      try {
        const fileUri = FileSystem.cacheDirectory + fileName;
        await FileSystem.writeAsStringAsync(fileUri, csvContent);
        await Sharing.shareAsync(fileUri);
      } catch (e) {
        Alert.alert('Error', 'Failed to export report');
      }
    }
  };

  const renderAlertItem = ({ item, index }: { item: any; index: number }) => (
    <Animated.View
      entering={FadeInDown.delay(index * 100).springify()}
      style={[styles.alertCard, item.is_read && styles.alertCardRead]}
    >
      <TouchableOpacity onPress={() => openAlertDetail(item)} activeOpacity={0.7}>
        <View style={styles.alertHeader}>
          <View style={[styles.alertBadge, item.is_read && styles.alertBadgeRead]}>
            {item.is_read ? <ShieldCheck size={14} color="#64748b" /> : <AlertTriangle size={14} color="#92400e" />}
            <Text style={[styles.alertBadgeText, item.is_read && styles.alertBadgeTextRead]}>
              {item.is_read ? 'REVIEWED' : 'ATTEMPT BLOCKED'}
            </Text>
          </View>
          <Text style={styles.alertTime}>{item.date} @ {item.time}</Text>
        </View>

        <View style={styles.alertBody}>
          <View style={styles.userRow}>
            <View style={[styles.userAvatar, item.is_read && { backgroundColor: '#e2e8f0' }]}>
              <User size={18} color="#fff" />
            </View>
            <View>
              <Text style={styles.userName}>{item.name}</Text>
              <Text style={styles.userId}>ID: {item.student_id}</Text>
            </View>
          </View>
          <View style={styles.descBox}>
            <Text style={styles.alertDesc} numberOfLines={1}>
              Blocked from <Text style={styles.courseName}>{item.course}</Text>
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <Animated.View entering={SlideInRight} style={styles.screenHeader}>
          <View style={styles.headerTitleRow}>
            <TouchableOpacity onPress={() => router.replace('/')} style={styles.backBtn}>
              <ArrowLeft size={24} color={Colors.primary} />
            </TouchableOpacity>
            <Bell size={24} color={Colors.primary} />
            <Text style={styles.screenTitle}>Alerts</Text>
          </View>
          <View style={{ flexDirection: 'row', gap: 10 }}>
            {paymentAlerts.length > 0 && (
              <TouchableOpacity style={[styles.clearBtn, { backgroundColor: Colors.blue50 }]} onPress={exportAlertsCSV}>
                <Download size={20} color={Colors.primary} />
              </TouchableOpacity>
            )}
            {paymentAlerts.length > 0 && (
              <TouchableOpacity style={styles.clearBtn} onPress={clearAllAlerts}>
                <Trash2 size={20} color={Colors.danger} />
              </TouchableOpacity>
            )}
          </View>
      </Animated.View>

      <View style={styles.infoArea}>
        <Text style={styles.infoTitle}>SECURITY COMPLIANCE FEED</Text>
        <Text style={styles.infoSubtitle}>Tracking unauthorized kiosk check-in attempts.</Text>
      </View>

      <FlatList
        data={paymentAlerts}
        keyExtractor={(item, index) => item.id?.toString() || index.toString()}
        renderItem={renderAlertItem}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <View style={styles.emptyIconCircle}>
              <Bell size={40} color="#cbd5e1" />
            </View>
            <Text style={styles.emptyText}>Feed is Clear</Text>
            <Text style={styles.emptySubText}>New payment-blocked attempts will appear here automatically.</Text>
          </View>
        }
        ListFooterComponent={<View style={{ height: 120 }} />}
      />

      {/* DETAIL MODAL */}
      <Modal visible={!!selectedAlert} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Security Incident</Text>
              <TouchableOpacity onPress={() => setSelectedAlert(null)} style={styles.closeBtn}><X size={20} color={Colors.text} /></TouchableOpacity>
            </View>
            {selectedAlert && (
              <View style={styles.modalBody}>
                <View style={styles.incidentHeader}>
                   <View style={styles.incidentIcon}>
                      <AlertTriangle size={32} color={Colors.danger} />
                   </View>
                   <View>
                      <Text style={styles.incidentTitle}>Unauthorized Attempt</Text>
                      <Text style={styles.incidentSubtitle}>Kiosk access blocked by payment rules.</Text>
                   </View>
                </View>

                <View style={styles.detailCard}>
                   <View style={styles.detailRow}>
                      <User size={16} color={Colors.primary} />
                      <Text style={styles.detailLabel}>STUDENT:</Text>
                      <Text style={styles.detailValue}>{selectedAlert.name} ({selectedAlert.student_id})</Text>
                   </View>
                   <View style={styles.detailRow}>
                      <FileText size={16} color={Colors.primary} />
                      <Text style={styles.detailLabel}>COURSE:</Text>
                      <Text style={styles.detailValue}>{selectedAlert.course}</Text>
                   </View>
                   <View style={styles.detailRow}>
                      <Clock size={16} color={Colors.primary} />
                      <Text style={styles.detailLabel}>DATETIME:</Text>
                      <Text style={styles.detailValue}>{selectedAlert.date} at {selectedAlert.time}</Text>
                   </View>
                </View>

                <View style={styles.reasonBox}>
                   <Text style={styles.reasonTitle}>REASON FOR BLOCK:</Text>
                   <Text style={styles.reasonText}>The student attempted to check into the terminal but has no active full-term payment record in the centralized registry. Standard protocol requires all 4 terms to be settled for kiosk eligibility.</Text>
                </View>

                <TouchableOpacity style={styles.acknowledgeBtn} onPress={() => setSelectedAlert(null)}>
                  <ShieldCheck size={20} color="#fff" />
                  <Text style={styles.acknowledgeBtnText}>Acknowledge & Close</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
      </Modal>

      {/* CUSTOM ALERT MODAL */}
      <Modal visible={customAlert.visible} transparent animationType="fade">
        <View style={styles.customAlertOverlay}>
          <Animated.View entering={FadeInDown.springify()} style={styles.customAlertBox}>
            <View style={styles.alertIconWrapper}>
              <AlertTriangle size={32} color={Colors.danger} />
            </View>

            <Text style={styles.customAlertTitle}>{customAlert.title}</Text>
            <Text style={styles.customAlertMessage}>{customAlert.message}</Text>

            <View style={styles.alertActions}>
              <TouchableOpacity
                style={styles.alertCancelBtn}
                onPress={() => setCustomAlert({ ...customAlert, visible: false })}
              >
                <Text style={styles.alertCancelText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.alertConfirmBtn}
                onPress={customAlert.onConfirm}
              >
                <Text style={styles.alertConfirmText}>Clear All</Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  screenHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 20, paddingBottom: 10, backgroundColor: '#fff' },
  headerTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  screenTitle: { fontSize: 28, fontWeight: '900', color: '#0f172a', letterSpacing: -0.5 },
  backBtn: { width: 40, height: 40, borderRadius: 12, backgroundColor: '#f8fafc', alignItems: 'center', justifyContent: 'center' },
  clearBtn: { width: 45, height: 45, borderRadius: 14, backgroundColor: '#fee2e2', alignItems: 'center', justifyContent: 'center' },

  infoArea: { paddingHorizontal: 20, marginBottom: 10 },
  infoTitle: { fontSize: 10, fontWeight: '900', color: Colors.primary, letterSpacing: 1 },
  infoSubtitle: { fontSize: 12, color: '#64748b', fontWeight: '600', marginTop: 2 },

  list: { padding: 20, gap: 15 },
  alertCard: { backgroundColor: '#fff', borderRadius: 24, borderWidth: 1, borderColor: '#f1f5f9', padding: 18, gap: 15, elevation: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 10 },
  alertCardRead: { opacity: 0.8, backgroundColor: '#fcfdfe' },
  alertHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  alertBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#fef3c7', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10 },
  alertBadgeRead: { backgroundColor: '#f1f5f9' },
  alertBadgeText: { fontSize: 9, fontWeight: '900', color: '#92400e' },
  alertBadgeTextRead: { color: '#64748b' },
  alertTime: { fontSize: 11, color: '#94a3b8', fontWeight: '800' },
  alertBody: { gap: 12 },
  userRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  userAvatar: { width: 36, height: 36, borderRadius: 12, backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center' },
  userName: { fontSize: 16, fontWeight: '800', color: '#1e293b' },
  userId: { fontSize: 12, color: '#64748b', fontWeight: '700' },
  descBox: { backgroundColor: '#f8fafc', padding: 12, borderRadius: 14, borderLeftWidth: 3, borderLeftColor: Colors.primary },
  alertDesc: { fontSize: 13, color: '#475569', lineHeight: 20, fontWeight: '500' },
  courseName: { fontWeight: '800', color: Colors.primary },

  emptyContainer: { padding: 60, alignItems: 'center', justifyContent: 'center' },
  emptyIconCircle: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#f8fafc', alignItems: 'center', justifyContent: 'center', marginBottom: 20 },
  emptyText: { fontSize: 18, fontWeight: '900', color: '#64748b' },
  emptySubText: { fontSize: 13, color: '#94a3b8', textAlign: 'center', marginTop: 8, lineHeight: 20, fontWeight: '500' },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.6)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#fff', borderTopLeftRadius: 32, borderTopRightRadius: 32, paddingBottom: 40 },
  modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 24, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  modalTitle: { fontSize: 20, fontWeight: '900', color: '#0f172a' },
  closeBtn: { width: 36, height: 36, borderRadius: 12, backgroundColor: '#f1f5f9', alignItems: 'center', justifyContent: 'center' },
  modalBody: { padding: 24, gap: 20 },

  incidentHeader: { flexDirection: 'row', alignItems: 'center', gap: 15 },
  incidentIcon: { width: 60, height: 60, borderRadius: 20, backgroundColor: '#fee2e2', alignItems: 'center', justifyContent: 'center' },
  incidentTitle: { fontSize: 18, fontWeight: '900', color: '#1e293b' },
  incidentSubtitle: { fontSize: 12, fontWeight: '600', color: '#64748b' },

  detailCard: { backgroundColor: '#f8fafc', padding: 20, borderRadius: 20, gap: 12 },
  detailRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  detailLabel: { fontSize: 10, fontWeight: '900', color: '#94a3b8', width: 70 },
  detailValue: { fontSize: 13, fontWeight: '700', color: '#1e293b', flex: 1 },

  reasonBox: { gap: 8 },
  reasonTitle: { fontSize: 10, fontWeight: '900', color: Colors.danger, letterSpacing: 1 },
  reasonText: { fontSize: 14, color: '#475569', lineHeight: 22, fontWeight: '500' },

  acknowledgeBtn: { backgroundColor: Colors.primary, height: 55, borderRadius: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, marginTop: 10 },
  acknowledgeBtnText: { color: '#fff', fontSize: 16, fontWeight: '900' },

  customAlertOverlay: { flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.7)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  customAlertBox: { width: '100%', maxWidth: 340, backgroundColor: '#fff', borderRadius: 28, padding: 24, alignItems: 'center', elevation: 20 },
  alertIconWrapper: { width: 64, height: 64, borderRadius: 22, backgroundColor: '#fee2e2', justifyContent: 'center', alignItems: 'center', marginBottom: 20 },
  customAlertTitle: { fontSize: 20, fontWeight: '900', color: '#0f172a', marginBottom: 10 },
  customAlertMessage: { fontSize: 14, color: '#64748b', textAlign: 'center', lineHeight: 20, marginBottom: 24, fontWeight: '500' },
  alertActions: { width: '100%', gap: 12 },
  alertConfirmBtn: { width: '100%', height: 52, backgroundColor: Colors.danger, borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
  alertConfirmText: { color: '#fff', fontSize: 15, fontWeight: '800' },
  alertCancelBtn: { width: '100%', height: 52, backgroundColor: '#f8fafc', borderRadius: 16, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#f1f5f9' },
  alertCancelText: { color: '#64748b', fontSize: 15, fontWeight: '700' }
} as any);
