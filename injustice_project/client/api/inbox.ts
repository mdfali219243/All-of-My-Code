import { apiRequest } from './client';
import type { DirectMessage, InboxContact, InboxConversation } from '../shared/types';

export async function fetchInbox(): Promise<{ conversations: InboxConversation[]; contacts: InboxContact[] }> {
  return apiRequest('/inbox/');
}

export async function fetchMessages(username: string, lastId = 0): Promise<DirectMessage[]> {
  const data = await apiRequest<{ messages: DirectMessage[] }>(`/inbox/${username}/?last_id=${lastId}`);
  return data.messages;
}

export async function sendMessage(username: string, message: string): Promise<DirectMessage> {
  const data = await apiRequest<{ message: DirectMessage }>(`/inbox/${username}/`, {
    method: 'POST',
    body: { message },
  });
  return data.message;
}
