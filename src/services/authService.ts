import api from "./api";

export async function loginToApp(
  email: string,
  password: string,
  role: "admin" | "student",
) {
  try {
    const { data } = await api.post("/auth/login.php", {
      email,
      password,
      role,
    });

    return data;
  } catch (err: any) {
    console.log("LOGIN ERROR:", err.response?.data || err.message);

    return {
      success: false,
      message: "Network or server error",
    };
  }
}
