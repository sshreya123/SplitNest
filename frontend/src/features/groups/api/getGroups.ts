import apiClient from "../../../api/client";
import type { Group } from "../../../types/group";


export async function getGroups():
Promise<Group[]> {
  const response = await apiClient.get<Group[]>(
    "/groups"
  );

  return response.data;
}