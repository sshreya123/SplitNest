import apiClient from "../../../api/client";
import type {
  CreateExpensePayload,
  Expense
} from "../../../types/expense";


interface UpdateExpenseArguments {
  groupId: string;
  expenseId: string;
  payload: CreateExpensePayload;
}


export async function updateExpense({
  groupId,
  expenseId,
  payload
}: UpdateExpenseArguments): Promise<Expense> {
  const response =
    await apiClient.put<Expense>(
      `/groups/${groupId}/expenses/${expenseId}`,
      payload
    );

  return response.data;
}