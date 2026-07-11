export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  balance: number;
  hasTransactionPin: boolean;
  emailVerified?: boolean;
  bvn?: string;
  accountNumber?: string;
  bankName?: string;
  accountName?: string;
  billingStreet?: string;
  billingCity?: string;
  billingState?: string;
  billingCountry?: string;
  homeStreet?: string;
  homeCity?: string;
  homeState?: string;
  homeZip?: string;
  avatar?: string;
  mfaEnabled?: boolean;
  dateOfBirth?: string;
  gender?: string;
  nin?: string;
  nextOfKin?: Record<string, string>;
  employmentStatus?: string;
  annualIncome?: string;
  createdAt?: string;
  lastLogin?: string;
  passwordChangedAt?: string;
}

export interface Transaction {
  id: string;
  type: string;
  amount: number;
  status: 'pending' | 'completed' | 'failed';
  date: string;
  description: string;
}

export interface AdminUser {
  id: number;
  name: string;
  email: string;
  role: string;
}

export type ProfileUpdateData = Partial<Pick<User,
  'name' | 'phone' | 'bvn' | 'accountNumber' | 'bankName' | 'accountName' |
  'billingStreet' | 'billingCity' | 'billingState' | 'billingCountry' |
  'homeStreet' | 'homeCity' | 'homeState' | 'homeZip' | 'avatar' |
  'email' | 'dateOfBirth' | 'gender' | 'nin' | 'employmentStatus' | 'annualIncome' | 'nextOfKin'
>>;
