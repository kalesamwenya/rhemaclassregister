import { useState, useEffect } from 'react';
import { checkNetworkStatus } from '../services/networkService';

export function useNetwork() {
  const [status, setStatus] = useState<{
    isConnected: boolean | undefined;
    isInternetReachable: boolean | undefined;
  }>({
    isConnected: true,
    isInternetReachable: true,
  });

  useEffect(() => {
    const check = async () => {
      const state = await checkNetworkStatus();
      setStatus({
        isConnected: state.isConnected,
        isInternetReachable: state.isInternetReachable,
      });
    };

    check();

    // Since expo-network doesn't have a listener, we can poll occasionally
    // or just rely on the initial check and interceptor errors.
    const interval = setInterval(check, 10000);
    return () => clearInterval(interval);
  }, []);

  return status;
}
