import api from './api';

export type AttendanceLog = {
  id?: number;
  student_id: string | number;
  name: string;
  course: string;
  schedule_id?: string;
  session_cohort?: string;
  profile_cohort?: string;
  date: string;
  time: string;
  created_at?: string;
};

export async function getLogs() {
  const { data } = await api.get('/logs/getLogs.php');
  return data;
}

export async function createAttendanceLog(log: AttendanceLog) {
  const { data } = await api.post('/logs/addLog.php', log);
  return data;
}

export async function updateAttendanceLog(log: AttendanceLog & { id: number }) {
  const { data } = await api.put('/logs/updateLog.php', log);
  return data;
}

export async function deleteAttendanceLog(id: number | string) {
  const { data } = await api.post('/logs/deleteLog.php', { id });
  return data;
}

export async function purgeLogs() {
  const { data } = await api.post('/logs/purgeLogs.php', {});
  return data;
}

export async function getPaymentAlerts() {
  const { data } = await api.get('/logs/getAlerts.php');
  return data;
}

export async function createPaymentAlert(alert: any) {
  const { data } = await api.post('/logs/addAlert.php', alert);
  return data;
}

export async function purgeAlerts() {
  const { data } = await api.post('/logs/purgeAlerts.php', {});
  return data;
}

export async function markAlertRead(id: number | string) {
  const { data } = await api.post('/logs/markAlertRead.php', { id });
  return data;
}
