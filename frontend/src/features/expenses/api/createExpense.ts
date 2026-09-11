import apiClient from "../../../api/client";
import type {
  CreateExpensePayload,
  Expense
} from "../../../types/expense";


interface CreateExpenseArguments {
  groupId: string;
  payload: CreateExpensePayload;
}


export async function createExpense({
  groupId,
  payload
}: CreateExpenseArguments): Promise<Expense> {
  const response =
    await apiClient.post<Expense>(
      `/groups/${groupId}/expenses`,
      payload
    );

  return response.data;
}