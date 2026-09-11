import apiClient from "../../../api/client";

import type {
  GroupActivityListResponse
} from "../../../types/activity";


export async function getGroupActivities(
  groupId: string,
  limit = 20,
  offset = 0
): Promise<GroupActivityListResponse> {
  const response =
    await apiClient.get<GroupActivityListResponse>(
      `/groups/${groupId}/activities`,
      {
        params: {
          limit,
          offset
        }
      }
    );

  return response.data;
}