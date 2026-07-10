import { describe, it, expect } from 'vitest';
import { validateEmail, validateBVN, validateAccountNumber } from './validation';

describe('validateEmail', () => {
  it('returns empty string for valid emails', () => {
    expect(validateEmail('test@example.com')).toBe('');
    expect(validateEmail('user+tag@domain.co.uk')).toBe('');
  });

  it('returns error for invalid emails', () => {
    expect(validateEmail('')).toBeTruthy();
    expect(validateEmail('not-an-email')).toBeTruthy();
    expect(validateEmail('@domain.com')).toBeTruthy();
  });
});

describe('validateBVN', () => {
  it('returns empty string for valid 11-digit BVN', () => {
    expect(validateBVN('12345678901')).toBe('');
  });

  it('returns error for invalid BVN', () => {
    expect(validateBVN('')).toBeTruthy();
    expect(validateBVN('12345')).toBeTruthy();
    expect(validateBVN('abcdefghijk')).toBeTruthy();
  });
});

describe('validateAccountNumber', () => {
  it('returns empty string for valid 10-digit account number', () => {
    expect(validateAccountNumber('1234567890')).toBe('');
  });

  it('returns error for invalid account numbers', () => {
    expect(validateAccountNumber('')).toBeTruthy();
    expect(validateAccountNumber('12345')).toBeTruthy();
    expect(validateAccountNumber('abcdefghij')).toBeTruthy();
  });
});
