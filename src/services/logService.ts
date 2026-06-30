import api from "./api";

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

// ----------------------
// LOGS
// ----------------------

export async function getLogs() {
  try {
    const { data } = await api.get("/logs/getLogs.php");
    return data;
  } catch (err: any) {
    console.log("GET LOGS ERROR:", err.response?.data || err.message);
    throw err;
  }
}

export async function createAttendanceLog(log: AttendanceLog) {
  try {
    const { data } = await api.post("/logs/addLog.php", log);
    return data;
  } catch (err: any) {
    console.log("CREATE LOG ERROR:", err.response?.data || err.message);
    throw err;
  }
}

export async function updateAttendanceLog(log: AttendanceLog & { id: number }) {
  try {
    // FIX: use POST instead of PUT (PHP-safe)
    const { data } = await api.post("/logs/updateLog.php", log);
    return data;
  } catch (err: any) {
    console.log("UPDATE LOG ERROR:", err.response?.data || err.message);
    throw err;
  }
}

export async function deleteAttendanceLog(id: number | string) {
  try {
    const { data } = await api.post("/logs/deleteLog.php", {
      id: String(id),
    });
    return data;
  } catch (err: any) {
    console.log("DELETE LOG ERROR:", err.response?.data || err.message);
    throw err;
  }
}

// ----------------------
// ADMIN ACTIONS
// ----------------------

export async function purgeLogs() {
  try {
    const { data } = await api.post("/logs/purgeLogs.php", {});
    return data;
  } catch (err: any) {
    console.log("PURGE LOGS ERROR:", err.response?.data || err.message);
    throw err;
  }
}

// ----------------------
// ALERTS
// ----------------------

export async function getPaymentAlerts() {
  try {
    const { data } = await api.get("/logs/getAlerts.php");
    return data;
  } catch (err: any) {
    console.log("GET ALERTS ERROR:", err.response?.data || err.message);
    throw err;
  }
}

export async function createPaymentAlert(alert: any) {
  try {
    const { data } = await api.post("/logs/addAlert.php", alert);
    return data;
  } catch (err: any) {
    console.log("CREATE ALERT ERROR:", err.response?.data || err.message);
    throw err;
  }
}

export async function purgeAlerts() {
  try {
    const { data } = await api.post("/logs/purgeAlerts.php", {});
    return data;
  } catch (err: any) {
    console.log("PURGE ALERTS ERROR:", err.response?.data || err.message);
    throw err;
  }
}

export async function markAlertRead(id: number | string) {
  try {
    const { data } = await api.post("/logs/markAlertRead.php", {
      id: String(id),
    });
    return data;
  } catch (err: any) {
    console.log("MARK ALERT READ ERROR:", err.response?.data || err.message);
    throw err;
  }
}

export async function markAllAlertsRead() {
  try {
    const { data } = await api.post("/logs/markAllAlertsRead.php", {});
    return data;
  } catch (err: any) {
    console.log("MARK ALL ALERTS ERROR:", err.response?.data || err.message);
    throw err;
  }
}
