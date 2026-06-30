import api from './api';

export type QueueItem = {
  id: number;
  endpoint: string;
  method: 'POST' | 'PUT' | 'DELETE';
  payload: string;
  timestamp: number;
};

export async function addToSyncQueue(endpoint: string, method: 'POST' | 'PUT' | 'DELETE', payload: any) {
  console.log('[OFFLINE QUEUE] Not supported on Web');
}

export async function getQueueItems(): Promise<QueueItem[]> {
  return [];
}

export async function removeFromQueue(id: number) {
  // Noop
}

export async function processSyncQueue(): Promise<number> {
  return 0;
}

export async function withOfflineSupport<T>(
  apiCall: () => Promise<T>,
  queueData: { endpoint: string; method: 'POST' | 'PUT' | 'DELETE'; payload: any }
): Promise<T | { success: true; queued: true }> {
  // On web, we just pass through without queueing support
  return await apiCall();
}
