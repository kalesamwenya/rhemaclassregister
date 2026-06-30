import * as SQLite from "expo-sqlite";
import { Platform } from "react-native";
import api from "./api";

const DB_NAME = "sync_queue.db";
const isWeb = Platform.OS === "web";

export type QueueItem = {
  id: number;
  endpoint: string;
  method: "POST" | "PUT" | "DELETE";
  payload: string;
  timestamp: number;
};

let db: SQLite.SQLiteDatabase | null = null;

async function getDb(): Promise<SQLite.SQLiteDatabase | null> {
  if (isWeb) return null;

  if (!db) {
    try {
      db = await SQLite.openDatabaseAsync(DB_NAME);

      await db.execAsync(`
        CREATE TABLE IF NOT EXISTS sync_queue (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          endpoint TEXT NOT NULL,
          method TEXT NOT NULL,
          payload TEXT NOT NULL,
          timestamp INTEGER NOT NULL
        );
      `);

      console.log("[OFFLINE QUEUE] Database ready");
    } catch (e) {
      console.error(
        "[OFFLINE QUEUE] Database initialization failed:",
        e
      );
      return null;
    }
  }

  return db;
}

export async function addToSyncQueue(
  endpoint: string,
  method: "POST" | "PUT" | "DELETE",
  payload: any
) {
  if (isWeb) {
    console.log("[OFFLINE QUEUE] Web mode: skipping queue");
    return;
  }

  try {
    const database = await getDb();
    if (!database) return;

    const payloadStr = JSON.stringify(payload);

    await database.runAsync(
      `INSERT INTO sync_queue
      (endpoint, method, payload, timestamp)
      VALUES (?, ?, ?, ?)`,
      endpoint,
      method,
      payloadStr,
      Date.now()
    );

    console.log(
      `[OFFLINE QUEUE] Added ${endpoint}`
    );
  } catch (e) {
    console.error(
      "[OFFLINE QUEUE] Insert failed:",
      e
    );
  }
}

export async function getQueueItems(): Promise<QueueItem[]> {
  if (isWeb) return [];

  try {
    const database = await getDb();
    if (!database) return [];

    return await database.getAllAsync<QueueItem>(
      `SELECT * FROM sync_queue ORDER BY timestamp ASC`
    );
  } catch (e) {
    console.error(
      "[OFFLINE QUEUE] Read failed:",
      e
    );
    return [];
  }
}

export async function removeFromQueue(id: number) {
  if (isWeb) return;

  try {
    const database = await getDb();
    if (!database) return;

    await database.runAsync(
      `DELETE FROM sync_queue WHERE id=?`,
      id
    );
  } catch (e) {
    console.error(
      "[OFFLINE QUEUE] Delete failed:",
      e
    );
  }
}

export async function processSyncQueue(): Promise<number> {
  if (isWeb) return 0;

  const items = await getQueueItems();

  if (!items.length) return 0;

  console.log(
    `[SYNC ENGINE] Processing ${items.length} items`
  );

  let successCount = 0;

  for (const item of items) {
    try {
      const payload = JSON.parse(item.payload);

      let response;

      switch (item.method) {
        case "POST":
          response = await api.post(
            item.endpoint,
            payload
          );
          break;

        case "PUT":
          response = await api.put(
            item.endpoint,
            payload
          );
          break;

        case "DELETE":
          response = await api.delete(
            item.endpoint,
            { data: payload }
          );
          break;
      }

      if (response?.data?.success) {
        await removeFromQueue(item.id);

        successCount++;

        console.log(
          `[SYNC ENGINE] Synced item ${item.id}`
        );
      }
    } catch (err) {
      console.log(
        `[SYNC ENGINE] Network issue detected. Stopping sync.`
      );

      break;
    }
  }

  return successCount;
}

export async function withOfflineSupport<T>(
  apiCall: () => Promise<T>,
  queueData: {
    endpoint: string;
    method: "POST" | "PUT" | "DELETE";
    payload: any;
  }
): Promise<T | { success: true; queued: true }> {
  try {
    return await apiCall();
  } catch (err: any) {
    if (isWeb) throw err;

    const isNetworkError = !err.response;
    const isServerError =
      err.response?.status >= 500;

    if (isNetworkError || isServerError) {
      console.log(
        `[SYNC WRAPPER] Queueing ${queueData.endpoint}`
      );

      await addToSyncQueue(
        queueData.endpoint,
        queueData.method,
        queueData.payload
      );

      return {
        success: true,
        queued: true,
      };
    }

    throw err;
  }
}