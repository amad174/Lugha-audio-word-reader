/** Generate a random 6-character invite code (uppercase alphanumeric). */
export function generateInviteCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

export function slugifyId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export function validateEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function validatePassword(password: string): string | null {
  if (password.length < 6) return 'Password must be at least 6 characters.';
  return null;
}

export function validateOrgName(name: string): string | null {
  const trimmed = name.trim();
  if (!trimmed) return 'Organization name is required.';
  if (trimmed.length > 60) return 'Organization name is too long.';
  return null;
}

export function validateDisplayName(name: string): string | null {
  const trimmed = name.trim();
  if (!trimmed) return 'Name is required.';
  if (trimmed.length > 40) return 'Name is too long.';
  return null;
}

export function validateInviteCode(code: string): string | null {
  const trimmed = code.trim().toUpperCase();
  if (trimmed.length !== 6) return 'Invite code must be 6 characters.';
  return null;
}
