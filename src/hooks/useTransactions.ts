import { useQuery } from '@tanstack/react-query';
import axios from 'axios';

interface Transaction {
  id: string;
  type: string;
  amount: number;
  status: 'pending' | 'completed' | 'failed';
  date: string;
  description: string;
}

export function useTransactions() {
  return useQuery<Transaction[]>({
    queryKey: ['transactions'],
    queryFn: async () => {
      const { data } = await axios.get('/api/transactions', { withCredentials: true });
      return data.transactions;
    },
    staleTime: 2 * 60 * 1000,
    placeholderData: [
      { id: 'TXN001', type: 'airtime', amount: 500, status: 'completed', date: new Date().toISOString(), description: 'MTN Airtime Purchase - N500' },
      { id: 'TXN002', type: 'data', amount: 2000, status: 'completed', date: new Date(Date.now() - 86400000).toISOString(), description: 'Glo 2GB Data Bundle' },
      { id: 'TXN003', type: 'transfer', amount: 15000, status: 'completed', date: new Date(Date.now() - 172800000).toISOString(), description: 'Transfer to John Doe' },
      { id: 'TXN004', type: 'funding', amount: 50000, status: 'completed', date: new Date(Date.now() - 259200000).toISOString(), description: 'Wallet Funding via Bank Transfer' },
      { id: 'TXN005', type: 'electricity', amount: 4500, status: 'pending', date: new Date().toISOString(), description: 'IKEDC Prepaid - N4500' },
    ],
  });
}
