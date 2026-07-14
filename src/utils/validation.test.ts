// © 2026 Abubakri Faaruq Adebowale (IbnAbubakri). All rights reserved.
// Faruqsuzay@gmail.com | +2349061345507

import { describe, it, expect } from 'vitest';
import { validateEmail, validateBVN, validateAccountNumber, validatePassword, validateStrongPassword, validatePhone, validateName } from './validation';

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

describe('validatePassword', () => {
  it('returns empty string for valid password', () => {
    expect(validatePassword('abc123')).toBe('');
    expect(validatePassword('a'.repeat(6))).toBe('');
    expect(validatePassword('a'.repeat(20))).toBe('');
  });

  it('returns error for empty password', () => {
    expect(validatePassword('')).toBe('Password is required');
  });

  it('returns error for password shorter than 6 characters', () => {
    expect(validatePassword('abc12')).toBe('Password must be at least 6 characters');
    expect(validatePassword('a')).toBe('Password must be at least 6 characters');
    expect(validatePassword('')).toBe('Password is required');
  });
});

describe('validateStrongPassword', () => {
  it('returns valid for strong password', () => {
    const result = validateStrongPassword('StrongP@ss1');
    expect(result.isValid).toBe(true);
    expect(result.message).toBe('');
  });

  it('rejects password shorter than 8 characters', () => {
    const result = validateStrongPassword('Sh0@');
    expect(result.isValid).toBe(false);
    expect(result.message).toContain('8');
  });

  it('rejects password without uppercase letter', () => {
    const result = validateStrongPassword('weakpass1@');
    expect(result.isValid).toBe(false);
    expect(result.message).toContain('uppercase');
  });

  it('rejects password without lowercase letter', () => {
    const result = validateStrongPassword('WEAKPASS1@');
    expect(result.isValid).toBe(false);
    expect(result.message).toContain('lowercase');
  });

  it('rejects password without number', () => {
    const result = validateStrongPassword('StrongPass@');
    expect(result.isValid).toBe(false);
    expect(result.message).toContain('number');
  });

  it('rejects empty password', () => {
    const result = validateStrongPassword('');
    expect(result.isValid).toBe(false);
    expect(result.message).toBe('Password is required');
  });
});

describe('validatePhone', () => {
  it('returns empty string for valid Nigerian phone numbers', () => {
    expect(validatePhone('+2348012345678')).toBe('');
    expect(validatePhone('2348012345678')).toBe('');
    expect(validatePhone('08012345678')).toBe('');
  });

  it('returns error for invalid phone numbers', () => {
    expect(validatePhone('')).toBeTruthy();
    expect(validatePhone('12345')).toBeTruthy();
    expect(validatePhone('+2340012345678')).toBeTruthy();
  });
});

describe('validateName', () => {
  it('returns empty string for valid names', () => {
    expect(validateName('John', 'First name')).toBe('');
    expect(validateName('A', 'First name')).toBe('First name must be at least 2 characters');
  });

  it('returns error for empty name', () => {
    expect(validateName('', 'First name')).toBe('First name is required');
  });

  it('returns error for name shorter than 2 characters', () => {
    const result = validateName('J', 'Last name');
    expect(result).toBe('Last name must be at least 2 characters');
  });

  it('includes the field name in error', () => {
    expect(validateName('', 'Email')).toBe('Email is required');
    expect(validateName('J', 'Username')).toBe('Username must be at least 2 characters');
  });
});
