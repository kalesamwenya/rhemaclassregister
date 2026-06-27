import api from './api';

export type SchedulePayload = {
  schedules: any[];
  enrollments: Record<string, string[]>;
};

export async function getScheduleData() {
  const { data } = await api.get('/schedules/getSchedules.php');
  return data;
}

export async function syncScheduleData(payload: SchedulePayload) {
  try {
    const { data } = await api.post('/schedules/syncSchedules.php', payload);
    return data;
  } catch (err: any) {
    console.error('Sync schedules error:', err.response?.data || err.message);
    throw err;
  }
}

export async function deleteSchedule(id: string) {
  try {
    const { data } = await api.post('/schedules/deleteSchedule.php', { id });
    return data;
  } catch (err: any) {
    console.error('Delete schedule error:', err.response?.data || err.message);
    throw err;
  }
}
