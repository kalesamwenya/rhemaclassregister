import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ScrollView, Alert, Platform, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BarChart, Download, Trash2, ChevronRight, ArrowLeft, Filter, Layers, FileSpreadsheet, AlertTriangle, X } from 'lucide-react-native';
import { useAppContext } from '../../context/AppContext';
import { Colors, Spacing, BorderRadius } from '../../constants/Theme';
import { useRouter } from 'expo-router';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import Animated, { FadeInDown, Layout, SlideInRight } from 'react-native-reanimated';

export default function AdminLogsScreen() {
  const router = useRouter();
  const { attendanceLogs, schedule, sysConfig, saveAllLogs, removeLog, students, courseEnrollments } = useAppContext();

  const [logFilterCourse, setLogFilterCourse] = useState('');
  const [logFilterCohort, setLogFilterCohort] = useState('');
  const [exportCourseFilter, setExportCourseFilter] = useState('');
  const [expandedCourses, setExpandedCourses] = useState<Record<string, boolean>>({});

  const [customAlert, setCustomAlert] = useState<{
    visible: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    isDanger?: boolean;
    studentName?: string;
  }>({
    visible: false,
    title: '',
    message: '',
    onConfirm: () => {},
  });

  const coursesWithLogs = useMemo(() => {
    return [...new Set(attendanceLogs.map(l => l.course))].filter(Boolean).sort();
  }, [attendanceLogs]);

  const getLogField = (log: any, ...keys: string[]) => {
    for (const key of keys) {
      if (log[key] !== undefined) return log[key];
    }
    const altKeys = keys.flatMap(k => k.includes('_') ? [k.replace(/_([a-z])/g, g => g[1].toUpperCase())] : [k.replace(/[A-Z]/g, g => `_${g.toLowerCase()}`)]);
    for (const key of altKeys) {
      if (log[key] !== undefined) return log[key];
    }
    return undefined;
  };

  const filteredLogsGroupedByCourse = useMemo(() => {
    const filtered = attendanceLogs.filter(log => {
      const course = getLogField(log, 'course');
      const matchesCourse = !logFilterCourse || course?.toLowerCase() === logFilterCourse.toLowerCase();
      const sessionCohort = String(getLogField(log, 'session_cohort', 'sessionCohort') || '');
      const profileCohort = String(getLogField(log, 'profile_cohort', 'profileCohort') || '');
      const matchesCohort = !logFilterCohort || sessionCohort === logFilterCohort || profileCohort === logFilterCohort;
      return matchesCourse && matchesCohort;
    });

    const grouped: Record<string, any[]> = {};
    filtered.forEach(log => {
      const course = getLogField(log, 'course') || 'Unassigned';
      if (!grouped[course]) grouped[course] = [];
      grouped[course].push(log);
    });
    return grouped;
  }, [attendanceLogs, logFilterCourse, logFilterCohort]);

  const exportFilteredLogsCSV = async () => {
    const logsToExport = attendanceLogs.filter(log => {
      const course = getLogField(log, 'course');
      const matchesCourse = !logFilterCourse || course?.toLowerCase() === logFilterCourse.toLowerCase();
      const sessionCohort = String(getLogField(log, 'session_cohort', 'sessionCohort') || '');
      const profileCohort = String(getLogField(log, 'profile_cohort', 'profileCohort') || '');
      const matchesCohort = !logFilterCohort || sessionCohort === logFilterCohort || profileCohort === logFilterCohort;
      return matchesCourse && matchesCohort;
    });

    if (logsToExport.length === 0) {
      Alert.alert('No Logs', 'No data matches your selection.');
      return;
    }

    const header = 'Student ID,Name,Course,Session Track,Profile Group,Date,Time\n';
    const rows = logsToExport.map(l =>
      `"${getLogField(l, 'student_id', 'studentId')}","${getLogField(l, 'name')}","${getLogField(l, 'course')}","${sysConfig.cohorts[getLogField(l, 'session_cohort', 'sessionCohort')] || ''}","${sysConfig.cohorts[getLogField(l, 'profile_cohort', 'profileCohort')] || ''}","${getLogField(l, 'date')}","${getLogField(l, 'time')}"`
    ).join('\n');

    const csvContent = header + rows;
    const fileName = `Attendance_Log_Filtered.csv`;

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
        Alert.alert('Error', 'Failed to export logs');
      }
    }
  };

  const exportHorizontalMatrixCSV = async () => {
    if (!exportCourseFilter) {
      Alert.alert('Required', 'Select a course track first.');
      return;
    }
    const selectedTrack = schedule.find(s => s.id === exportCourseFilter);
    if (!selectedTrack) return;

    const enrolledIds = courseEnrollments[selectedTrack.id] || [];
    if (enrolledIds.length === 0) {
      Alert.alert('No Enrollment', 'No students are registered for this specific track.');
      return;
    }

    const targetLogs = attendanceLogs.filter(l => getLogField(l, 'schedule_id', 'scheduleId') === selectedTrack.id);
    const uniqueDates = [...new Set(targetLogs.map(l => getLogField(l, 'date')))].sort();

    let csv = `Module,${selectedTrack.course}\n`;
    csv += `Group,${sysConfig.cohorts[selectedTrack.cohort] || 'Unknown'}\n\n`;
    csv += 'Student ID,Name,Cohort,' + uniqueDates.join(',') + '\n';

    enrolledIds.forEach(sid => {
      const profile = students[sid] || { name: 'Unknown', cohort: '1' };
      let row = `"${sid}","${profile.name}","${sysConfig.cohorts[profile.cohort]}"`;
      uniqueDates.forEach(date => {
        const attended = targetLogs.some(l => getLogField(l, 'student_id', 'studentId') === sid && getLogField(l, 'date') === date);
        row += attended ? ',1' : ',0';
      });
      csv += row + '\n';
    });

    try {
      const fileName = `${selectedTrack.course.replace(/[^a-z0-9]/gi, '_')}_Matrix.csv`;
      if (Platform.OS === 'web') {
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      } else {
        const fileUri = FileSystem.cacheDirectory + fileName;
        await FileSystem.writeAsStringAsync(fileUri, csv);
        await Sharing.shareAsync(fileUri);
      }
    } catch (e) {
      Alert.alert('Error', 'Failed to export matrix');
    }
  };

  const exportAllMatrices = async () => {
    if (schedule.length === 0) {
      Alert.alert('No Tracks', 'No schedule tracks found.');
      return;
    }

    let fullCsv = 'ATTENDANCE MASTER REGISTRY\n\n';

    schedule.forEach(track => {
      const enrolledIds = courseEnrollments[track.id] || [];
      if (enrolledIds.length === 0) return;

      const targetLogs = attendanceLogs.filter(l => getLogField(l, 'schedule_id', 'scheduleId') === track.id);
      const uniqueDates = [...new Set(targetLogs.map(l => getLogField(l, 'date')))].sort();

      fullCsv += `MODULE: ${track.course} (${sysConfig.cohorts[track.cohort]})\n`;
      fullCsv += 'Student ID,Name,Cohort,' + uniqueDates.join(',') + '\n';

      enrolledIds.forEach(sid => {
        const profile = students[sid] || { name: 'Unknown', cohort: '1' };
        let row = `"${sid}","${profile.name}","${sysConfig.cohorts[profile.cohort]}"`;
        uniqueDates.forEach(date => {
          const attended = targetLogs.some(l => getLogField(l, 'student_id', 'studentId') === sid && getLogField(l, 'date') === date);
          row += attended ? ',1' : ',0';
        });
        fullCsv += row + '\n';
      });
      fullCsv += '\n\n';
    });

    try {
      const fileName = 'Master_Attendance_Registry.csv';
      if (Platform.OS === 'web') {
        const blob = new Blob([fullCsv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      } else {
        const fileUri = FileSystem.cacheDirectory + fileName;
        await FileSystem.writeAsStringAsync(fileUri, fullCsv);
        await Sharing.shareAsync(fileUri);
      }
    } catch (e) {
      Alert.alert('Error', 'Failed to export bulk registry');
    }
  };

  const renderLogTableItem = (log: any, idx: number) => {
    const logId = log.id;
    const studentId = String(getLogField(log, 'student_id', 'studentId') || '');
    const studentName = String(getLogField(log, 'name') || '');
    const sessionCohort = String(getLogField(log, 'session_cohort', 'sessionCohort') || '');
    const profileCohort = String(getLogField(log, 'profile_cohort', 'profileCohort') || '');
    const date = String(getLogField(log, 'date') || '');
    const time = String(getLogField(log, 'time') || '');

    const handleDelete = () => {
      setCustomAlert({
        visible: true,
        title: 'Remove Log Entry',
        message: 'Are you sure you want to permanently delete the attendance record for ',
        studentName: studentName,
        isDanger: true,
        onConfirm: async () => {
          setCustomAlert(prev => ({ ...prev, visible: false }));
          await removeLog(logId);
        }
      });
    };

    return (
      <View key={idx} style={[styles.logRow, idx % 2 === 1 && { backgroundColor: '#fcfdfe' }]}>
        <View style={{ flex: 1 }}>
          <View style={styles.logMainInfo}>
            <Text style={styles.logId}>{studentId}</Text>
            <Text style={styles.logName} numberOfLines={1}>{studentName}</Text>
          </View>
          <View style={styles.logMeta}>
            <View style={styles.trackPill}><Text style={styles.trackPillText}>{sysConfig.cohorts[sessionCohort] || '—'}</Text></View>
            <Text style={styles.logTime}>{date} • {time}</Text>
          </View>
        </View>
        {logId && (
          <TouchableOpacity
            onPress={handleDelete}
            style={styles.inlineDeleteBtn}
            activeOpacity={0.7}
          >
            <Trash2 size={16} color={Colors.danger} />
          </TouchableOpacity>
        )}
      </View>
    );
  };

  const renderCourseAccordion = ({ item: courseName, index }: { item: string; index: number }) => {
    const logs = filteredLogsGroupedByCourse[courseName] || [];
    const isExpanded = !!expandedCourses[courseName];

    return (
      <Animated.View
        entering={FadeInDown.delay(index * 100).springify()}
        layout={Layout.springify()}
        style={styles.accordionContainer}
      >
        <TouchableOpacity
          style={[styles.accordionHeader, isExpanded && styles.accordionHeaderActive]}
          onPress={() => setExpandedCourses(prev => ({ ...prev, [courseName]: !prev[courseName] }))}
          activeOpacity={0.7}
        >
          <View style={styles.headerLeft}>
            <View style={[styles.chevronWrapper, isExpanded && styles.chevronActive]}>
              <ChevronRight size={18} color={isExpanded ? Colors.primary : '#94a3b8'} />
            </View>
            <Text style={[styles.courseTitle, isExpanded && { color: Colors.primary }]}>{courseName}</Text>
          </View>
          <View style={styles.countBadge}><Text style={styles.countBadgeText}>{logs.length} Logs</Text></View>
        </TouchableOpacity>

        {isExpanded && (
          <View style={styles.accordionContent}>
            {logs.slice().reverse().map((log, idx) => renderLogTableItem(log, idx))}
          </View>
        )}
      </Animated.View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <Animated.View entering={SlideInRight} style={styles.screenHeader}>
          <View style={styles.headerTitleRow}>
            <TouchableOpacity onPress={() => router.replace('/')} style={styles.backBtn}>
              <ArrowLeft size={24} color={Colors.primary} />
            </TouchableOpacity>
            <BarChart size={24} color={Colors.primary} />
            <Text style={styles.screenTitle}>Logs</Text>
          </View>
          <TouchableOpacity style={styles.exportBtn} onPress={exportFilteredLogsCSV}>
            <Download size={22} color="#fff" />
          </TouchableOpacity>
      </Animated.View>

      <ScrollView stickyHeaderIndices={[1]} style={{ flex: 1 }}>
        <View style={styles.filterCard}>
          <View style={styles.filterHeader}>
            <Filter size={14} color={Colors.primary} />
            <Text style={styles.filterLabel}>SMART LOG FILTERS</Text>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
            <TouchableOpacity style={[styles.miniTab, !logFilterCourse && styles.miniTabActive]} onPress={() => setLogFilterCourse('')}>
              <Text style={[styles.miniTabText, !logFilterCourse && styles.miniTabTextActive]}>All Courses</Text>
            </TouchableOpacity>
            {coursesWithLogs.map(c => (
              <TouchableOpacity key={c} style={[styles.miniTab, logFilterCourse === c && styles.miniTabActive]} onPress={() => setLogFilterCourse(c)}>
                <Text style={[styles.miniTabText, logFilterCourse === c && styles.miniTabTextActive]}>{c}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
            <TouchableOpacity style={[styles.miniTab, !logFilterCohort && styles.miniTabActive]} onPress={() => setLogFilterCohort('')}>
              <Text style={[styles.miniTabText, !logFilterCohort && styles.miniTabTextActive]}>All Groups</Text>
            </TouchableOpacity>
            {Object.entries(sysConfig.cohorts).map(([id, label]) => (
              <TouchableOpacity key={id} style={[styles.miniTab, logFilterCohort === id && styles.miniTabActive]} onPress={() => setLogFilterCohort(id)}>
                <Text style={[styles.miniTabText, logFilterCohort === id && styles.miniTabTextActive]}>{label as string}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        <View style={styles.summaryLine}>
          <Layers size={12} color="#64748b" />
          <Text style={styles.summaryText}>
            Showing {Object.keys(filteredLogsGroupedByCourse).length} modules out of {attendanceLogs.length} total entries
          </Text>
        </View>

        <View style={styles.resultsList}>
          {Object.keys(filteredLogsGroupedByCourse).sort().map((courseName, index) => (
            <View key={courseName}>{renderCourseAccordion({ item: courseName, index })}</View>
          ))}

          {Object.keys(filteredLogsGroupedByCourse).length === 0 && (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No matching logs found.</Text>
            </View>
          )}
        </View>

        <View style={styles.actionGrid}>
          <View style={styles.actionCard}>
            <View style={styles.actionHeaderRow}>
              <Text style={styles.actionTitle}>Course Reporting Matrix</Text>
              <TouchableOpacity onPress={exportAllMatrices}>
                <Text style={styles.bulkActionLink}>Export All Matrices</Text>
              </TouchableOpacity>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.matrixScroll}>
               {schedule.map((s) => (
                 <TouchableOpacity key={s.id} style={[styles.matrixPill, exportCourseFilter === s.id && styles.matrixPillActive]} onPress={() => setExportCourseFilter(s.id)}>
                   <Text style={[styles.matrixPillText, exportCourseFilter === s.id && styles.matrixPillTextActive]}>{s.course}</Text>
                 </TouchableOpacity>
               ))}
            </ScrollView>
            <TouchableOpacity style={styles.matrixBtn} onPress={exportHorizontalMatrixCSV}>
              <FileSpreadsheet size={16} color="#fff" />
              <Text style={styles.matrixBtnText}>Generate Excel-Compatible CSV</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={styles.purgeBtn}
            onPress={() => {
              setCustomAlert({
                visible: true,
                title: 'Purge All Logs',
                message: 'This will permanently wipe ALL attendance records from the database. This action cannot be reversed.',
                isDanger: true,
                onConfirm: async () => {
                  setCustomAlert(prev => ({ ...prev, visible: false }));
                  await saveAllLogs([]);
                }
              });
            }}
            activeOpacity={0.7}
          >
            <Trash2 size={16} color={Colors.danger} />
            <Text style={styles.purgeBtnText}>Purge All Logs</Text>
          </TouchableOpacity>
        </View>

        <View style={{ height: 120 }} />
      </ScrollView>

      {/* CUSTOM ALERT MODAL */}
      <Modal visible={customAlert.visible} transparent animationType="fade">
        <View style={styles.alertOverlay}>
          <Animated.View entering={FadeInDown.springify()} style={styles.alertBox}>
            <View style={[styles.alertIconWrapper, customAlert.isDanger && { backgroundColor: '#fee2e2' }]}>
              <AlertTriangle size={32} color={customAlert.isDanger ? Colors.danger : Colors.primary} />
            </View>

            <Text style={styles.alertTitle}>{customAlert.title}</Text>
            <Text style={styles.alertMessage}>
              {customAlert.message}
              {customAlert.studentName && <Text style={styles.alertStrong}>{customAlert.studentName}</Text>}
              {customAlert.studentName && '?'}
            </Text>

            <View style={styles.alertActions}>
              <TouchableOpacity
                style={styles.alertCancelBtn}
                onPress={() => setCustomAlert({ ...customAlert, visible: false })}
              >
                <Text style={styles.alertCancelText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.alertDeleteBtn, customAlert.isDanger && { backgroundColor: Colors.danger }]}
                onPress={customAlert.onConfirm}
              >
                <Text style={styles.alertDeleteText}>Confirm Action</Text>
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
  exportBtn: { width: 48, height: 48, borderRadius: 16, backgroundColor: Colors.success, alignItems: 'center', justifyContent: 'center', elevation: 4, shadowColor: Colors.success, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 6 },

  filterCard: { paddingHorizontal: 20, paddingBottom: 15, gap: 12, backgroundColor: '#fff' },
  filterHeader: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  filterLabel: { fontSize: 10, fontWeight: '900', color: Colors.primary, letterSpacing: 1 },
  filterScroll: { gap: 8 },
  miniTab: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10, backgroundColor: '#f8fafc', borderWidth: 1, borderColor: '#f1f5f9' },
  miniTabActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  miniTabText: { fontSize: 11, fontWeight: '700', color: '#64748b' },
  miniTabTextActive: { color: '#fff' },

  summaryLine: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 20, paddingVertical: 12, backgroundColor: '#fcfdfe', borderTopWidth: 1, borderBottomWidth: 1, borderColor: '#f1f5f9' },
  summaryText: { fontSize: 11, fontWeight: '700', color: '#64748b', textTransform: 'uppercase' },

  resultsList: { padding: 20, gap: 12 },
  accordionContainer: { backgroundColor: '#fff', borderRadius: 20, borderWidth: 1, borderColor: '#f1f5f9', overflow: 'hidden', elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.03, shadowRadius: 4 },
  accordionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 18, backgroundColor: '#fff' },
  accordionHeaderActive: { backgroundColor: '#fcfdfe' },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  chevronWrapper: { width: 28, height: 28, borderRadius: 8, backgroundColor: '#f8fafc', alignItems: 'center', justifyContent: 'center' },
  chevronActive: { backgroundColor: Colors.blue50 },
  courseTitle: { fontSize: 16, fontWeight: '800', color: '#1e293b' },
  countBadge: { backgroundColor: '#0f172a', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
  countBadgeText: { color: '#fff', fontSize: 10, fontWeight: '900' },

  accordionContent: { borderTopWidth: 1, borderTopColor: '#f1f5f9' },
  logRow: { padding: 15, borderBottomWidth: 1, borderBottomColor: '#f8fafc', flexDirection: 'row', alignItems: 'center' },
  inlineDeleteBtn: { padding: 8, marginLeft: 10 },
  logMainInfo: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 4 },
  logId: { fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace', fontSize: 11, fontWeight: '900', color: Colors.primary },
  logName: { fontSize: 13, fontWeight: '700', color: '#334155', flex: 1 },
  logMeta: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  trackPill: { backgroundColor: '#f1f5f9', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  trackPillText: { fontSize: 9, fontWeight: '800', color: '#64748b' },
  logTime: { fontSize: 10, color: '#94a3b8', fontWeight: '700' },

  emptyContainer: { padding: 40, alignItems: 'center' },
  emptyText: { color: '#94a3b8', fontWeight: '700' },

  actionGrid: { paddingHorizontal: 20, gap: 15, marginTop: 10 },
  actionCard: { backgroundColor: '#f8fafc', borderRadius: 20, padding: 15, gap: 12, borderWidth: 1, borderColor: '#f1f5f9' },
  actionHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  actionTitle: { fontSize: 11, fontWeight: '900', color: '#475569', textTransform: 'uppercase' },
  bulkActionLink: { fontSize: 10, fontWeight: '800', color: Colors.primary, textDecorationLine: 'underline' },
  matrixScroll: { height: 35 },
  matrixPill: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, backgroundColor: '#fff', marginRight: 8, borderWidth: 1, borderColor: '#e2e8f0' },
  matrixPillActive: { borderColor: Colors.primary, backgroundColor: Colors.blue50 },
  matrixPillText: { fontSize: 11, fontWeight: '700', color: '#64748b' },
  matrixPillTextActive: { color: Colors.primary },
  matrixBtn: { backgroundColor: '#0f172a', padding: 12, borderRadius: 12, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 8 },
  matrixBtnText: { color: '#fff', fontSize: 12, fontWeight: '800' },
  purgeBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, padding: 15 },
  purgeBtnText: { color: Colors.danger, fontWeight: '800', fontSize: 13 },

  // Custom Alert Styles
  alertOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20
  },
  alertBox: {
    width: '100%',
    maxWidth: 340,
    backgroundColor: '#fff',
    borderRadius: 28,
    padding: 24,
    alignItems: 'center',
    elevation: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
  },
  alertIconWrapper: {
    width: 64,
    height: 64,
    borderRadius: 22,
    backgroundColor: '#eff6ff',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20
  },
  alertTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: '#0f172a',
    marginBottom: 10
  },
  alertMessage: {
    fontSize: 14,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
    fontWeight: '500'
  },
  alertStrong: {
    color: '#1e293b',
    fontWeight: '800'
  },
  alertActions: {
    width: '100%',
    gap: 12
  },
  alertDeleteBtn: {
    width: '100%',
    height: 52,
    backgroundColor: Colors.primary,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  alertDeleteText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '800'
  },
  alertCancelBtn: {
    width: '100%',
    height: 52,
    backgroundColor: '#f8fafc',
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#f1f5f9'
  },
  alertCancelText: {
    color: '#64748b',
    fontSize: 15,
    fontWeight: '700'
  }
} as any);
