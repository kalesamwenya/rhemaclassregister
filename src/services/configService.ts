import api from "./api";

export async function getRemoteConfig() {
  try {
    const { data } = await api.get("/config/getConfig.php");
    return data;
  } catch (err: any) {
    console.log("GET REMOTE CONFIG ERROR:", err.response?.data || err.message);
    throw err;
  }
}

export async function saveRemoteConfig(config: any) {
  try {
    const { data } = await api.post("/config/saveConfig.php", config);
    return data;
  } catch (err: any) {
    console.log("SAVE REMOTE CONFIG ERROR:", err.response?.data || err.message);
    throw err;
  }
}
