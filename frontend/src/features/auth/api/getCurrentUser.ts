import apiClient from "../../../api/client";
import type { User } from "../../../types/user";


export async function getCurrentUser():
Promise<User> {
  const response = await apiClient.get<User>(
    "/auth/me"
  );

  return response.data;
}