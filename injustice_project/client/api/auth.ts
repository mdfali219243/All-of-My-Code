import { apiRequest } from './client';
import { clearTokens, saveTokens } from './storage';
import type { AuthTokens, LoginInput, RegisterInput, User } from '../shared/types';

type AuthResponse = {
  user: User;
  tokens: AuthTokens;
};

export async function registerUser(input: RegisterInput): Promise<AuthResponse> {
  const data = await apiRequest<AuthResponse>('/auth/register/', {
    method: 'POST',
    body: input,
    auth: false,
  });
  await saveTokens(data.tokens);
  return data;
}

export async function loginUser(input: LoginInput): Promise<AuthResponse> {
  const data = await apiRequest<AuthResponse>('/auth/login/', {
    method: 'POST',
    body: input,
    auth: false,
  });
  await saveTokens(data.tokens);
  return data;
}

export async function fetchCurrentUser(): Promise<User> {
  return apiRequest<User>('/auth/me/');
}

export async function logoutUser(): Promise<void> {
  await clearTokens();
}
