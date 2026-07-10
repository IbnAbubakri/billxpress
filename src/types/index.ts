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
}

export interface AdminUser {
  id: number;
  name: string;
  email: string;
  role: string;
}

export interface Transaction {
  id: string;
  type: string;
  amount: number;
  status: 'pending' | 'completed' | 'failed';
  date: string;
  description: string;
}

export interface Service {
  id: string;
  name: string;
  icon: string;
  path: string;
  category: string;
}

export interface ProfileStep {
  label: string;
  description: string;
  icon: string;
  completed: boolean;
}

export interface BankDetails {
  accountNumber: string;
  bankName: string;
  accountName: string;
}

export type ProfileUpdateData = Partial<Pick<User,
  'name' | 'phone' | 'bvn' | 'accountNumber' | 'bankName' | 'accountName' |
  'billingStreet' | 'billingCity' | 'billingState' | 'billingCountry' |
  'homeStreet' | 'homeCity' | 'homeState' | 'homeZip'
>>;

export interface BasicInfo {
  billingStreet: string;
  billingCity: string;
  billingState: string;
  billingCountry: string;
  homeStreet: string;
  homeCity: string;
  homeState: string;
  homeZip: string;
  avatar: File | null;
  avatarPreview: string;
}
