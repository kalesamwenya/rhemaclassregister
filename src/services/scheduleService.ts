// FILE: scheduleServices.ts

import api from './api';

export type SchedulePayload = {
  schedules: any[];
  enrollments: Record<string, string[]>;
};

export async function getScheduleData() {
  try {
    const response = await api.get('/schedules/getSchedules.php');

    console.log(
      'Schedules loaded:',
      JSON.stringify(response.data, null, 2)
    );

    return response.data;

  } catch (err: any) {
    console.error(
      'Get schedules error:',
      err.response?.data ||
      err.response?.status ||
      err.message
    );

    throw err;
  }
}

export async function syncScheduleData(
  payload: SchedulePayload
) {
  try {
    const response = await api.post(
      '/schedules/syncSchedules.php',
      payload
    );

    console.log(
      'Sync success:',
      JSON.stringify(response.data, null, 2)
    );

    return response.data;

  } catch (err: any) {
    console.error(
      'Sync schedules error:',
      err.response?.data ||
      err.response?.status ||
      err.message
    );

    throw err;
  }
}

export async function deleteSchedule(
  id: string
) {
  try {
    const response = await api.post(
      '/schedules/deleteSchedule.php',
      { id }
    );

    console.log(
      'Delete success:',
      JSON.stringify(response.data, null, 2)
    );

    return response.data;

  } catch (err: any) {
    console.error(
      'Delete schedule error:',
      err.response?.data ||
      err.response?.status ||
      err.message
    );

    throw err;
  }
}