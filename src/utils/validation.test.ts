import {
  generateInviteCode,
  validateEmail,
  validatePassword,
  validateOrgName,
  validateDisplayName,
  validateInviteCode,
} from './validation';

describe('validation', () => {
  test('generateInviteCode returns 6 chars', () => {
    expect(generateInviteCode()).toHaveLength(6);
  });

  test('validateEmail', () => {
    expect(validateEmail('a@b.co')).toBe(true);
    expect(validateEmail('bad')).toBe(false);
  });

  test('validatePassword', () => {
    expect(validatePassword('12345')).not.toBeNull();
    expect(validatePassword('123456')).toBeNull();
  });

  test('validateOrgName', () => {
    expect(validateOrgName('')).not.toBeNull();
    expect(validateOrgName('Al-Noor')).toBeNull();
  });

  test('validateDisplayName', () => {
    expect(validateDisplayName('')).not.toBeNull();
    expect(validateDisplayName('Ahmed')).toBeNull();
  });

  test('validateInviteCode', () => {
    expect(validateInviteCode('ABC')).not.toBeNull();
    expect(validateInviteCode('ABC123')).toBeNull();
  });
});
