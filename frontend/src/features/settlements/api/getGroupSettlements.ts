import apiClient from "../../../api/client";
import type {
  Settlement
} from "../../../types/settlement";


export async function getGroupSettlements(
  groupId: string
): Promise<Settlement[]> {
  const response =
    await apiClient.get<Settlement[]>(
      `/groups/${groupId}/settlements`
    );

  return response.data;
}