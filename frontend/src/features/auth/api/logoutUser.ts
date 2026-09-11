import apiClient from "../../../api/client";
import {
  clearAccessToken
} from "../store/tokenStore";


export async function logoutUser(): Promise<void> {
  try {
    await apiClient.post("/auth/logout");
  } finally {
    clearAccessToken();
  }
}