import { useQuery } from '@tanstack/react-query';
import axios from 'axios';

export interface Transaction {
  id: string;
  type: string;
  amount: number;
  status: 'pending' | 'completed' | 'failed';
  date: string;
  description: string;
  recipient?: string;
}

export function useTransactions() {
  return useQuery<Transaction[]>({
    queryKey: ['transactions'],
    queryFn: async () => {
      const { data } = await axios.get('/api/transactions', { withCredentials: true });
      return data.transactions as Transaction[];
    },
    staleTime: 2 * 60 * 1000,
  });
}