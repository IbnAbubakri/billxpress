// © 2026 Abubakri Faaruq Adebowale (IbnAbubakri). All rights reserved.
// Faruqsuzay@gmail.com | +2349061345507

export type { User, Transaction, AdminUser, ProfileUpdateData } from '../../shared/types';

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
