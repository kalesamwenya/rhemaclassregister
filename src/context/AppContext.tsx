import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getApiHealth, getStudents as getStudentsFromApi, createStudent, updateStudent, deleteStudent } from '../services/studentService';
import { getLogs, purgeLogs, deleteAttendanceLog } from '../services/logService';
import { getPaymentAlerts, purgeAlerts, markAlertRead } from '../services/logService';
import { getScheduleData, syncScheduleData, deleteSchedule as deleteScheduleFromApi } from '../services/scheduleService';
import { getRemoteConfig, saveRemoteConfig } from '../services/configService';
import { Alert, Share, useColorScheme } from 'react-native';
import { getColors } from '../constants/Theme';

interface AppContextType {
  students: Record<string, any>;
  schedule: any[];
  courseEnrollments: Record<string, string[]>;
  attendanceLogs: any[];
  paymentAlerts: any[];
  sysConfig: any;
  colors: any;
  paymentStatus: Record<string, string>;
  apiStatus: 'checking' | 'online' | 'offline';
  isLoading: boolean;
  adminPassword: string;
  saveAllStudents: (data: Record<string, any>) => Promise<void>;
  registerStudent: (student: any) => Promise<void>;
  removeStudent: (id: string) => Promise<void>;
  saveAllSchedule: (data: any[], enrollmentsOverride?: Record<string, string[]>) => Promise<void>;
  removeSchedule: (id: string) => Promise<void>;
  saveAllEnrollments: (data: Record<string, string[]>, scheduleOverride?: any[]) => Promise<void>;
  saveAllLogs: (data: any[]) => Promise<void>;
  removeLog: (id: string | number) => Promise<void>;
  saveAllAlerts: (data: any[]) => Promise<void>;
  markAlertAsRead: (id: number | string) => Promise<void>;
  saveAllConfig: (data: any) => Promise<void>;
  updateStudentPaymentStatus: (studentId: string, status: string) => Promise<void>;
  persistAdminPassword: (pwd: string) => Promise<void>;
  toggleTheme: () => void;
  // Helpers
  getYearGroupFromCohort: (value: any) => 'F' | 'S' | null;
  getYearLabelFromCohort: (value: any) => string;
  isYearCompatible: (studentCohort: any, courseCohort: any) => boolean;
  getPaymentSummary: (value: string | undefined) => { status: string; label: string };
  hasFullTermPayment: (studentId: string) => boolean;
  downloadBackup: () => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const systemColorScheme = useColorScheme();
  const [students, setStudents] = useState<Record<string, any>>({});
  const [schedule, setSchedule] = useState<any[]>([]);
  const [courseEnrollments, setCourseEnrollments] = useState<Record<string, string[]>>({});
  const [attendanceLogs, setAttendanceLogs] = useState<any[]>([]);
  const [paymentAlerts, setPaymentAlerts] = useState<any[]>([]);
  const [adminPassword, setAdminPassword] = useState('admin123');
  const [paymentStatus, setPaymentStatus] = useState<Record<string, string>>({});
  const [apiStatus, setApiStatus] = useState<'checking' | 'online' | 'offline'>('checking');
  const [isLoading, setIsLoading] = useState(true);

  const [sysConfig, setSysConfig] = useState({
    themeMode: 'light' as 'light' | 'dark' | 'system',
    primaryColor: '#3b82f6',
    textCustoms: {
      'lbl-gate-title': 'Rhema Class Attendance',
      'lbl-gate-subtitle': 'Secure checkpoint management console & kiosk logger',
      'lbl-gate-student-card-title': 'Student Check-In Kiosk',
      'lbl-gate-admin-card-title': 'System Administrator',
      'lbl-sidebar-brand-title': 'Rhema Console',
      'lbl-terminal-title': 'Rhema Check-In Terminal',
    },
    cohorts: { '1': 'FYM', '2': 'FYE', '3': 'SYM', '4': 'SYE' },
  });

  const resolvedTheme = useMemo(() => {
    if (sysConfig.themeMode === 'system') return systemColorScheme || 'light';
    return sysConfig.themeMode;
  }, [sysConfig.themeMode, systemColorScheme]);

  const colors = useMemo(() => {
    return getColors(resolvedTheme as any, sysConfig.primaryColor);
  }, [resolvedTheme, sysConfig.primaryColor]);

  useEffect(() => {
    const load = async () => {
      const startTime = Date.now();
      const keys = [
        'rhema_admin_pwd', 'rhema_students', 'rhema_schedule',
        'rhema_enrollments', 'rhema_sys_config', 'rhema_attendance_records',
        'rhema_payment_status', 'rhema_payment_alerts'
      ];
      const results = await AsyncStorage.multiGet(keys);
      results.forEach(([key, value]) => {
        if (!value) return;
        try {
          const parsed = JSON.parse(value);
          if (key === 'rhema_admin_pwd') setAdminPassword(value);
          if (key === 'rhema_students') setStudents(parsed);
          if (key === 'rhema_schedule') setSchedule(parsed);
          if (key === 'rhema_enrollments') setCourseEnrollments(parsed);
          if (key === 'rhema_sys_config') setSysConfig(parsed);
          if (key === 'rhema_attendance_records') setAttendanceLogs(parsed);
          if (key === 'rhema_payment_status') setPaymentStatus(parsed);
          if (key === 'rhema_payment_alerts') setPaymentAlerts(parsed);
        } catch(e) {}
      });

      // Load from API
      await Promise.all([
        loadApiStudents(),
        loadLogsFromApi(),
        loadScheduleFromApi(),
        loadConfigFromApi(),
        loadAlertsFromApi()
      ]);

      // Ensure splash shows for at least 3500ms
      const elapsedTime = Date.now() - startTime;
      const remainingTime = Math.max(0, 3500 - elapsedTime);

      setTimeout(() => {
        setIsLoading(false);
      }, remainingTime);
    };
    load();
  }, []);

  const loadApiStudents = async () => {
    try {
      console.log('Checking API health...');
      const health = await getApiHealth();
      console.log('API health result:', health);
      if (health?.success) {
        setApiStatus('online');
        const res = await getStudentsFromApi();
        if (res?.success) {
          const normalized: Record<string, any> = {};
          const pStatus: Record<string, string> = {};
          (res.data || []).forEach((s: any) => {
            normalized[s.id] = s;
            pStatus[s.id] = s.payment_status || 'Pending';
          });
          setStudents(normalized);
          setPaymentStatus(pStatus);
          await AsyncStorage.setItem('rhema_students', JSON.stringify(normalized));
          await AsyncStorage.setItem('rhema_payment_status', JSON.stringify(pStatus));
        }
      } else {
        setApiStatus('offline');
        console.warn('API health check failed');
      }
    } catch (err: any) {
      setApiStatus('offline');
      console.error('API health check error:', err.message);
    }
  };

  const loadLogsFromApi = async () => {
    try {
      const res = await getLogs();
      if (res?.success) {
        setAttendanceLogs(res.data || []);
        await AsyncStorage.setItem('rhema_attendance_records', JSON.stringify(res.data));
      }
    } catch {}
  };

  const loadScheduleFromApi = async () => {
    try {
      const res = await getScheduleData();
      if (res?.success) {
        setSchedule(res.data.schedules || []);
        setCourseEnrollments(res.data.enrollments || {});
        await AsyncStorage.setItem('rhema_schedule', JSON.stringify(res.data.schedules));
        await AsyncStorage.setItem('rhema_enrollments', JSON.stringify(res.data.enrollments));
      }
    } catch {}
  };

  const loadConfigFromApi = async () => {
    try {
      const res = await getRemoteConfig();
      if (res?.success) {
        setSysConfig(res.data);
        await AsyncStorage.setItem('rhema_sys_config', JSON.stringify(res.data));
      }
    } catch {}
  };

  const loadAlertsFromApi = async () => {
    try {
      const res = await getPaymentAlerts();
      if (res?.success) {
        setPaymentAlerts(res.data || []);
        await AsyncStorage.setItem('rhema_payment_alerts', JSON.stringify(res.data));
      }
    } catch {}
  };

  // Logic Helpers
  const getYearGroupFromCohort = (val: any) => {
    const n = Number(val);
    if (n === 1 || n === 2) return 'F';
    if (n === 3 || n === 4) return 'S';
    return null;
  };

  const getYearLabelFromCohort = (val: any) => {
    const g = getYearGroupFromCohort(val);
    return g === 'F' ? 'First Year' : g === 'S' ? 'Second Year' : 'Unknown';
  };

  const isYearCompatible = (sC: any, cC: any) => {
    const sY = getYearGroupFromCohort(sC);
    const cY = getYearGroupFromCohort(cC);
    return sY === null || cY === null || sY === cY;
  };

  const getPaymentSummary = (val: string | undefined) => {
    const n = String(val || 'Pending').toLowerCase();
    if (n === 'paid') return { status: 'all-paid', label: 'All 4 terms paid' };
    if (n === 'term 1') return { status: 'partial', label: 'Term 1 paid' };
    if (n === 'term 2') return { status: 'partial', label: 'Term 2 paid' };
    if (n === 'term 3') return { status: 'partial', label: 'Term 3 paid' };
    if (n === 'term 4') return { status: 'partial', label: 'Term 4 paid' };
    if (n === 'balance') return { status: 'partial', label: 'Partial terms paid' };
    return { status: 'pending', label: 'No payment recorded' };
  };

  const hasFullTermPayment = (id: string) => getPaymentSummary(paymentStatus[id]).status === 'all-paid';

  // Persistence
  const saveAllStudents = async (data: Record<string, any>) => {
    setStudents(data);
    await AsyncStorage.setItem('rhema_students', JSON.stringify(data));
  };

  const registerStudent = async (student: any) => {
    const idStr = String(student.id);
    const pStatus = paymentStatus[idStr] || 'Pending';
    const nextStudents = { ...students, [idStr]: { ...student, payment_status: pStatus } };
    setStudents(nextStudents);
    await AsyncStorage.setItem('rhema_students', JSON.stringify(nextStudents));

    if (apiStatus === 'online') {
      try {
        const payload = { ...student, payment_status: pStatus };
        // We use update then create if fails to handle upsert behavior on the PHP end
        const res = await updateStudent(payload);
        if (!res?.success) {
          await createStudent(payload);
        }
      } catch (err) {
        try {
          await createStudent({ ...student, payment_status: pStatus });
        } catch (e) {
          console.error('Failed to register student on API', e);
        }
      }
    }
  };

  const removeStudent = async (id: string) => {
    const idStr = String(id);
    console.log(`Removing student locally: ${idStr}`);
    const nextStudents = { ...students };
    delete nextStudents[idStr];
    setStudents(nextStudents);

    const nextPaymentStatus = { ...paymentStatus };
    delete nextPaymentStatus[idStr];
    setPaymentStatus(nextPaymentStatus);

    const nextEnrollments = { ...courseEnrollments };
    Object.keys(nextEnrollments).forEach((slotId) => {
      if (Array.isArray(nextEnrollments[slotId])) {
        nextEnrollments[slotId] = nextEnrollments[slotId].filter((sid) => sid !== idStr);
      }
    });
    setCourseEnrollments(nextEnrollments);

    await AsyncStorage.setItem('rhema_students', JSON.stringify(nextStudents));
    await AsyncStorage.setItem('rhema_payment_status', JSON.stringify(nextPaymentStatus));
    await AsyncStorage.setItem('rhema_enrollments', JSON.stringify(nextEnrollments));

    // Try to delete from API regardless of initial health check status
    try {
      console.log(`[SYNC] Attempting API deletion for student: ${idStr}`);
      const res = await deleteStudent(idStr);
      console.log('[SYNC] Delete student response:', res);
      if (res?.success) {
        console.log(`[SYNC] Successfully deleted student ${idStr} from server`);
      } else {
        console.warn(`[SYNC] Server returned fail for student ${idStr}:`, res?.message);
      }
    } catch (e: any) {
      console.error(`[SYNC] Network/Server error deleting student ${idStr}:`, e.message);
    }
  };

  const saveAllSchedule = async (data: any[], enrollmentsOverride?: Record<string, string[]>) => {
    setSchedule(data);
    const nextEnrollments = enrollmentsOverride ?? courseEnrollments;
    setCourseEnrollments(nextEnrollments);
    await AsyncStorage.setItem('rhema_schedule', JSON.stringify(data));
    await AsyncStorage.setItem('rhema_enrollments', JSON.stringify(nextEnrollments));

    if (apiStatus === 'online') {
      try {
        const res = await syncScheduleData({ schedules: data, enrollments: nextEnrollments });
        if (!res?.success) {
          Alert.alert('Sync Error', res?.message || 'Failed to sync schedule with server');
        }
      } catch (err) {
        console.error('Schedule sync error:', err);
      }
    }
  };

  const removeSchedule = async (id: string) => {
    const nextSchedule = schedule.filter(s => s.id !== id);
    const nextEnrollments = { ...courseEnrollments };
    delete nextEnrollments[id];

    setSchedule(nextSchedule);
    setCourseEnrollments(nextEnrollments);

    await AsyncStorage.setItem('rhema_schedule', JSON.stringify(nextSchedule));
    await AsyncStorage.setItem('rhema_enrollments', JSON.stringify(nextEnrollments));

    if (apiStatus === 'online') {
      try {
        await deleteScheduleFromApi(id);
      } catch (e) {
        console.error('Failed to delete schedule from API', e);
        // Fallback to full sync if specialized delete fails
        try {
          await syncScheduleData({ schedules: nextSchedule, enrollments: nextEnrollments });
        } catch (syncErr) {}
      }
    }
  };

  const saveAllEnrollments = async (data: Record<string, string[]>, scheduleOverride = schedule) => {
    setCourseEnrollments(data);
    setSchedule(scheduleOverride);
    await AsyncStorage.setItem('rhema_enrollments', JSON.stringify(data));
    await AsyncStorage.setItem('rhema_schedule', JSON.stringify(scheduleOverride));

    if (apiStatus === 'online') {
      try {
        const res = await syncScheduleData({ schedules: scheduleOverride, enrollments: data });
        if (!res?.success) {
          Alert.alert('Sync Error', res?.message || 'Failed to sync enrollments with server');
        }
      } catch (err) {
        console.error('Enrollment sync error:', err);
      }
    }
  };

  const saveAllLogs = async (data: any[]) => {
    setAttendanceLogs(data);
    await AsyncStorage.setItem('rhema_attendance_records', JSON.stringify(data));
    if (data.length === 0 && apiStatus === 'online') {
      try {
        const res = await purgeLogs();
        if (!res?.success) {
          Alert.alert('Sync Error', 'Failed to purge logs on server');
        }
      } catch (err) {
        console.error('Purge logs error:', err);
      }
    }
  };

  const removeLog = async (id: string | number) => {
    const nextLogs = attendanceLogs.filter(l => String(l.id) !== String(id));
    setAttendanceLogs(nextLogs);
    await AsyncStorage.setItem('rhema_attendance_records', JSON.stringify(nextLogs));

    if (apiStatus === 'online') {
      try {
        await deleteAttendanceLog(id);
      } catch (e) {
        console.error('Delete log error:', e);
      }
    }
  };

  const saveAllAlerts = async (data: any[]) => {
    setPaymentAlerts(data);
    await AsyncStorage.setItem('rhema_payment_alerts', JSON.stringify(data));
    if (data.length === 0 && apiStatus === 'online') {
      try {
        await purgeAlerts();
      } catch (err) {
        console.error('Purge alerts error:', err);
      }
    }
  };

  const markAlertAsRead = async (id: number | string) => {
    const next = paymentAlerts.map(a => String(a.id) === String(id) ? { ...a, is_read: 1 } : a);
    setPaymentAlerts(next);
    await AsyncStorage.setItem('rhema_payment_alerts', JSON.stringify(next));

    if (apiStatus === 'online') {
      try {
        await markAlertRead(id);
      } catch (e) {
        console.error('Failed to mark alert as read on API', e);
      }
    }
  };

  const saveAllConfig = async (data: any) => {
    setSysConfig(data);
    await AsyncStorage.setItem('rhema_sys_config', JSON.stringify(data));
    if (apiStatus === 'online') {
      try { await saveRemoteConfig(data); } catch {}
    }
  };

  const updateStudentPaymentStatus = async (id: string, status: string) => {
    const idStr = String(id);
    const nextStatus = { ...paymentStatus, [idStr]: status };
    setPaymentStatus(nextStatus);
    await AsyncStorage.setItem('rhema_payment_status', JSON.stringify(nextStatus));

    // Also update the student object if it exists
    if (students[idStr]) {
      const updatedStudent = { ...students[idStr], payment_status: status };
      const nextStudents = { ...students, [idStr]: updatedStudent };
      setStudents(nextStudents);
      await AsyncStorage.setItem('rhema_students', JSON.stringify(nextStudents));

      if (apiStatus === 'online') {
        try {
          await updateStudent(updatedStudent);
        } catch (e) {
          console.error('Failed to update payment status on API', e);
        }
      }
    }
  };

  const persistAdminPassword = async (pwd: string) => {
    setAdminPassword(pwd);
    await AsyncStorage.setItem('rhema_admin_pwd', pwd);
  };

  const toggleTheme = () => {
    const modes: ('light' | 'dark' | 'system')[] = ['light', 'dark', 'system'];
    const nextIndex = (modes.indexOf(sysConfig.themeMode) + 1) % modes.length;
    saveAllConfig({ ...sysConfig, themeMode: modes[nextIndex] });
  };

  const downloadBackup = async () => {
    const state = { students, schedule, enrollments: courseEnrollments, sysConfig, attendanceLogs, paymentStatus };
    const json = JSON.stringify(state, null, 2);
    try {
      await Share.share({ message: json, title: 'Rhema Backup' });
    } catch (e) { Alert.alert('Error', 'Could not create backup share'); }
  };

  return (
    <AppContext.Provider value={{
      students, schedule, courseEnrollments, attendanceLogs, paymentAlerts, sysConfig, paymentStatus, apiStatus, isLoading, adminPassword,
      saveAllStudents, registerStudent, removeStudent, saveAllSchedule, removeSchedule, saveAllEnrollments, saveAllLogs, removeLog, saveAllAlerts, markAlertAsRead, saveAllConfig,
      updateStudentPaymentStatus, persistAdminPassword, getYearGroupFromCohort, getYearLabelFromCohort,
      isYearCompatible, getPaymentSummary, hasFullTermPayment, downloadBackup
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useAppContext must be used within AppProvider');
  return context;
};
