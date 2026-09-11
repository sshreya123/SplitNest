import apiClient from "../../../api/client";
import type {
  AddGroupMemberPayload,
  GroupMember
} from "../../../types/group";


interface AddGroupMemberArguments {
  groupId: string;
  payload: AddGroupMemberPayload;
}


export async function addGroupMember({
  groupId,
  payload
}: AddGroupMemberArguments): Promise<GroupMember> {
  const response =
    await apiClient.post<GroupMember>(
      `/groups/${groupId}/members`,
      payload
    );

  return response.data;
}