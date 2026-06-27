import api from './api';

export async function getRemoteConfig() {
  const { data } = await api.get('/config/getConfig.php');
  return data;
}

export async function saveRemoteConfig(config: any) {
  const { data } = await api.post('/config/saveConfig.php', config);
  return data;
}
