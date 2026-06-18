import type { LoginInput, RegisterInput, ValidationResult } from './types';

export function validateRegister(data: RegisterInput): ValidationResult {
  const errors: Record<string, string> = {};

  if (!data.username.trim()) {
    errors.username = 'Username is required.';
  } else if (data.username.length < 3) {
    errors.username = 'Username must be at least 3 characters.';
  }

  if (!data.email.trim()) {
    errors.email = 'Email is required.';
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
    errors.email = 'Enter a valid email address.';
  }

  if (!data.password) {
    errors.password = 'Password is required.';
  } else if (data.password.length < 8) {
    errors.password = 'Password must be at least 8 characters.';
  }

  return { valid: Object.keys(errors).length === 0, errors };
}

export function validateLogin(data: LoginInput): ValidationResult {
  const errors: Record<string, string> = {};

  if (!data.username.trim()) {
    errors.username = 'Username is required.';
  }

  if (!data.password) {
    errors.password = 'Password is required.';
  }

  return { valid: Object.keys(errors).length === 0, errors };
}
