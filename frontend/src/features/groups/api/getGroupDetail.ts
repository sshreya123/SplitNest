import apiClient from "../../../api/client";
import type {
  GroupDetail
} from "../../../types/group";


export async function getGroupDetail(
  groupId: string
): Promise<GroupDetail> {
  const response =
    await apiClient.get<GroupDetail>(
      `/groups/${groupId}`
    );

  return response.data;
}