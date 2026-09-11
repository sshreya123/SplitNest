import apiClient from "../../../api/client";

import type {
  GroupDebtSimplification
} from "../../../types/expense";


export async function getDebtSuggestions(
  groupId: string
): Promise<GroupDebtSimplification> {
  const response =
    await apiClient.get<GroupDebtSimplification>(
      `/groups/${groupId}/debt-suggestions`
    );

  return response.data;
}