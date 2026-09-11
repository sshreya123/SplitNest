import apiClient from "../../../api/client";


interface DeleteExpenseArguments {
  groupId: string;
  expenseId: string;
}


export async function deleteExpense({
  groupId,
  expenseId
}: DeleteExpenseArguments): Promise<void> {
  await apiClient.delete(
    `/groups/${groupId}/expenses/${expenseId}`
  );
}