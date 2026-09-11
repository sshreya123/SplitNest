import apiClient from "../../../api/client";
import type {
  Expense
} from "../../../types/expense";


export async function getGroupExpenses(
  groupId: string
): Promise<Expense[]> {
  const response =
    await apiClient.get<Expense[]>(
      `/groups/${groupId}/expenses`
    );

  return response.data;
}