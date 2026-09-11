import apiClient from "../../../api/client";
import type {
  RegisterUserPayload,
  User
} from "../../../types/user";


export async function registerUser(
  payload: RegisterUserPayload
): Promise<User> {
  const response = await apiClient.post<User>(
    "/auth/register",
    payload
  );

  return response.data;
}