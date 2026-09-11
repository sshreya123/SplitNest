import {
  refreshClient
} from "../../../api/client";
import type {
  TokenResponse
} from "../../../types/auth";
import {
  setAccessToken
} from "../store/tokenStore";


export async function refreshSession():
Promise<TokenResponse> {
  const response =
  await refreshClient.post<TokenResponse>(
    "/auth/refresh"
  );
  setAccessToken(
    response.data.access_token
  );

  return response.data;
}