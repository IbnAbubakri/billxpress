export function validateEmail(email: string): string {
  if (!email) return 'Email is required';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return 'Please enter a valid email address';
  return '';
}

export function validatePassword(password: string): string {
  if (!password) return 'Password is required';
  if (password.length < 12) return 'Password must be at least 12 characters';
  if (password.length > 128) return 'Password must be at most 128 characters';
  if (!/[A-Z]/.test(password)) return 'Password must contain at least one uppercase letter';
  if (!/[a-z]/.test(password)) return 'Password must contain at least one lowercase letter';
  if (!/\d/.test(password)) return 'Password must contain at least one number';
  if (!/[^A-Za-z0-9]/.test(password)) return 'Password must contain at least one special character';
  return '';
}

export function validateStrongPassword(password: string): { isValid: boolean; message: string } {
  if (!password) return { isValid: false, message: 'Password is required' };
  const msg = validatePassword(password);
  return msg ? { isValid: false, message: msg } : { isValid: true, message: '' };
}

export function validatePhone(phone: string): string {
  if (!phone) return 'Phone number is required';
  if (!/^(\+234|234|0)[7-9][01]\d{8}$/.test(phone)) return 'Please enter a valid Nigerian phone number';
  return '';
}

export function validateName(name: string, field: string): string {
  if (!name) return `${field} is required`;
  if (name.length < 2) return `${field} must be at least 2 characters`;
  return '';
}

export function validateBVN(bvn: string): string {
  if (!bvn) return 'BVN is required';
  if (!/^\d{11}$/.test(bvn)) return 'BVN must be 11 digits';
  return '';
}

export function validateAccountNumber(accountNumber: string): string {
  if (!accountNumber) return 'Account number is required';
  if (!/^\d{10}$/.test(accountNumber)) return 'Account number must be 10 digits';
  return '';
}
