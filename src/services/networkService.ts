import * as Network from 'expo-network';

export async function checkNetworkStatus() {
  const state = await Network.getNetworkStateAsync();
  return {
    isConnected: state.isConnected,
    isInternetReachable: state.isInternetReachable,
    type: state.type,
  };
}

export async function isOnline(): Promise<boolean> {
  const state = await Network.getNetworkStateAsync();
  return !!(state.isConnected && state.isInternetReachable);
}
