// FILE: api.ts

import axios from "axios";

// Fallback URL if EXPO_PUBLIC_API_URL is missing
const fallbackURL = "http://attendance.rhemazambia.com";

// Use environment variable or fallback
const rawBaseURL =
  process.env.EXPO_PUBLIC_API_URL?.trim() || fallbackURL;

/**
 * Normalize URL:
 * - remove extra trailing slashes
 * - ensure exactly one trailing slash
 */
const normalizeBaseURL = (url: string): string => {
  return url.replace(/\/+$/, "") + "/";
};

const api = axios.create({
  baseURL: normalizeBaseURL(rawBaseURL),

  headers: {
    Accept: "application/json",
    "Content-Type": "application/json",
  },

  timeout: 15000,
});

// REQUEST INTERCEPTOR
api.interceptors.request.use(
  (config) => {
    // Remove leading slash from endpoint
    if (config.url?.startsWith("/")) {
      config.url = config.url.slice(1);
    }

    const fullUrl = `${config.baseURL}${config.url}`;

    console.log(
      `[API] ${config.method?.toUpperCase()} ${fullUrl}`
    );

    return config;
  },
  (error) => {
    console.log("[REQUEST ERROR]", error.message);
    return Promise.reject(error);
  }
);

// RESPONSE INTERCEPTOR
api.interceptors.response.use(
  (response) => {
    console.log(
      `[API SUCCESS] ${response.status}: ${response.config.url}`
    );

    return response;
  },
  (error) => {
    if (error.code === "ECONNABORTED") {
      console.log("[API ERROR] Request timeout");
    } else if (!error.response) {
      console.log("[API ERROR] Network unavailable");
    } else {
      console.log(
        "[API ERROR]",
        error.response.data ||
          error.response.status ||
          error.message
      );
    }

    return Promise.reject(error);
  }
);

export default api;