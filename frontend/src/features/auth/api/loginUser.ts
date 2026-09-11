import apiClient from "../../../api/client";
import type {
  LoginPayload,
  TokenResponse
} from "../../../types/auth";
import {
  setAccessToken
} from "../store/tokenStore";


export async function loginUser(
  payload: LoginPayload
): Promise<TokenResponse> {
  const response = await apiClient.post<TokenResponse>(
    "/auth/login",
    payload
  );

  setAccessToken(
    response.data.access_token
  );

  return response.data;
}