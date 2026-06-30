import axios, {
  AxiosError,
  InternalAxiosRequestConfig,
} from "axios";

// Fallback API URL
const fallbackURL = "http://attendance.rhemazambia.com";

const baseURL = process.env.EXPO_PUBLIC_API_URL || fallbackURL;
// const baseURL = fallbackURL;
/**
 * Normalize URL:
 * - Remove extra trailing slashes
 * - Add one final slash
 */
const getFinalBaseURL = (url: string): string => {
  return url.replace(/\/+$/, "") + "/";
};

const api = axios.create({
  baseURL: getFinalBaseURL(baseURL),
  timeout: 15000,
  headers: {
    Accept: "application/json",
    "Content-Type": "application/json",
  },
});

/**
 * REQUEST INTERCEPTOR
 */
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // Remove leading slash to prevent //
    if (config.url) {
      config.url = config.url.replace(/^\/+/, "");
    }

    const fullUrl = `${config.baseURL ?? ""}${config.url ?? ""}`;

    console.log(
      `[API] ${config.method?.toUpperCase()} ${fullUrl}`
    );

    return config;
  },
  (error) => {
    console.log(
      "[REQUEST ERROR]",
      error?.message
    );

    return Promise.reject(error);
  }
);

/**
 * RESPONSE INTERCEPTOR
 */
api.interceptors.response.use(
  (response) => response,

  (error: AxiosError<any>) => {
    if (error.response) {
      console.log(
        "[API ERROR]",
        error.response.data ||
          error.response.status
      );
    } else if (error.request) {
      console.log(
        "[NETWORK ERROR]",
        "Server unreachable"
      );
    } else {
      console.log(
        "[UNKNOWN ERROR]",
        error.message
      );
    }

    return Promise.reject(error);
  }
);

export default api;