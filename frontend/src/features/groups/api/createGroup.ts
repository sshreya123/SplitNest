import apiClient from "../../../api/client";
import type {
  CreatedGroup,
  CreateGroupPayload
} from "../../../types/group";


export async function createGroup(
  payload: CreateGroupPayload
): Promise<CreatedGroup> {
  const response =
    await apiClient.post<CreatedGroup>(
      "/groups",
      payload
    );

  return response.data;
}