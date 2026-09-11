import apiClient from "../../../api/client";
import type {
  GroupBalance
} from "../../../types/balance";


export async function getGroupBalances(
  groupId: string
): Promise<GroupBalance> {
  const response =
    await apiClient.get<GroupBalance>(
      `/groups/${groupId}/balances`
    );

  return response.data;
}