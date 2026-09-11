import axios, {
  type InternalAxiosRequestConfig
} from "axios";

import type {
  TokenResponse
} from "../types/auth";
import {
  clearAccessToken,
  getAccessToken,
  setAccessToken
} from "../features/auth/store/tokenStore";


interface RetryableRequestConfig
  extends InternalAxiosRequestConfig {
  _retry?: boolean;
}


const baseURL = import.meta.env.VITE_API_URL;


const apiClient = axios.create({
  baseURL,
  headers: {
    "Content-Type": "application/json"
  },
  timeout: 10000,
  withCredentials: true
});


export const refreshClient = axios.create({
  baseURL,
  headers: {
    "Content-Type": "application/json"
  },
  timeout: 10000,
  withCredentials: true
});


let refreshPromise: Promise<string> | null = null;


apiClient.interceptors.request.use((config) => {
  const accessToken = getAccessToken();

  if (accessToken) {
    config.headers.Authorization =
      `Bearer ${accessToken}`;
  }

  return config;
});


apiClient.interceptors.response.use(
  (response) => response,

  async (error) => {
    const originalRequest =
      error.config as
        | RetryableRequestConfig
        | undefined;

    const statusCode = error.response?.status;

    if (
      statusCode !== 401 ||
      !originalRequest ||
      originalRequest._retry ||
      isPublicAuthenticationRequest(
        originalRequest.url
      )
    ) {
      return Promise.reject(error);
    }

    originalRequest._retry = true;

    try {
      if (!refreshPromise) {
        refreshPromise = refreshClient
          .post<TokenResponse>("/auth/refresh")
          .then((response) => {
            const newAccessToken =
              response.data.access_token;

            setAccessToken(newAccessToken);

            return newAccessToken;
          })
          .finally(() => {
            refreshPromise = null;
          });
      }

      const newAccessToken =
        await refreshPromise;

      originalRequest.headers.Authorization =
        `Bearer ${newAccessToken}`;

      return apiClient(originalRequest);
    } catch (refreshError) {
      clearAccessToken();

      window.dispatchEvent(
        new Event("auth:session-expired")
      );

      return Promise.reject(refreshError);
    }
  }
);


function isPublicAuthenticationRequest(
  requestUrl?: string
): boolean {
  if (!requestUrl) {
    return false;
  }

  const excludedPaths = [
    "/auth/login",
    "/auth/register",
    "/auth/refresh",
    "/auth/logout"
  ];

  return excludedPaths.some((path) =>
    requestUrl.includes(path)
  );
}


export default apiClient;