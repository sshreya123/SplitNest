import apiClient from "../../../api/client";

import type {
  CreateSettlementPayload,
  Settlement
} from "../../../types/settlement";


interface CreateSettlementArguments {
  groupId: string;
  payload: CreateSettlementPayload;
  idempotencyKey: string;
}


export async function createSettlement({
  groupId,
  payload,
  idempotencyKey
}: CreateSettlementArguments): Promise<Settlement> {
  const response =
    await apiClient.post<Settlement>(
      `/groups/${groupId}/settlements`,

      payload,

      {
        headers: {
          "Idempotency-Key":
            idempotencyKey
        }
      }
    );

  return response.data;
}