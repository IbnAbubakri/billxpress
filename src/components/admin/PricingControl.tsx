// © 2026 Abubakri Faaruq Adebowale (IbnAbubakri). All rights reserved.
// Faruqsuzay@gmail.com | +2349061345507

import Seo from '../ui/Seo';
import { useState } from 'react';
import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { walletApi } from '../../api/client';
import {
  DollarSign, Edit3, Save, X, Plus,
  Upload, Download, Smartphone, Wifi,
} from 'lucide-react';

interface PricingItem {
  id: number;
  service: string;
  provider: string;
  type: string;
  cost_price: number;
  selling_price: number;
  profit_margin: number;
  status: 'active' | 'inactive';
}

const PricingControl: React.FC = () => {
  const [editingId, setEditingId] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [editForm, setEditForm] = useState({ cost_price: 0, selling_price: 0 });

  const { data: pricingData, isLoading, isError, error } = useQuery<PricingItem[]>({
    queryKey: ['admin', 'pricing'],
    queryFn: async () => {
      const { data } = await walletApi.get('/admin/pricing');
      return data.pricing || [];
    },
    staleTime: 2 * 60 * 1000,
  });

  const items = pricingData || [];

  const filteredData = items.filter(item => {
    const matchesSearch = item.service.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.provider.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterType === 'all' || item.type === filterType;
    return matchesSearch && matchesFilter;
  });

  const handleEdit = (item: PricingItem) => {
    setEditingId(item.id);
    setEditForm({ cost_price: item.cost_price, selling_price: item.selling_price });
  };

  const handleSave = (id: number) => {
    setEditingId(null);
  };

  const handleCancel = () => {
    setEditingId(null);
    setEditForm({ cost_price: 0, selling_price: 0 });
  };

  if (isLoading) {
    return (
      <div className="space-y-8">
        <Seo title="Pricing Control" />
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-500" />
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="space-y-8">
        <Seo title="Pricing Control" />
        <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-2xl text-sm" role="alert">
          Failed to load pricing data: {(error as Error)?.message || 'Unknown error'}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <Seo title="Pricing Control" />
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-ginto font-bold text-black dark:text-white">Pricing Control</h1>
          <p className="text-black dark:text-white mt-1">Manage service prices and profit margins</p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={() => {}}
            className="flex items-center space-x-2 px-4 py-2 bg-neutral-100 dark:bg-dark-700 text-black dark:text-white rounded-xl hover:bg-neutral-200 dark:hover:bg-dark-600 transition-colors"
          >
            <Upload className="w-4 h-4" aria-hidden="true" />
            <span>Import CSV</span>
          </button>
          <button
            onClick={() => {}}
            className="flex items-center space-x-2 px-4 py-2 bg-neutral-100 dark:bg-dark-700 text-black dark:text-white rounded-xl hover:bg-neutral-200 dark:hover:bg-dark-600 transition-colors"
          >
            <Download className="w-4 h-4" aria-hidden="true" />
            <span>Export CSV</span>
          </button>
          <button
            className="flex items-center space-x-2 px-4 py-2 bg-primary-600 text-white rounded-xl hover:bg-primary-700 transition-colors"
          >
            <Plus className="w-4 h-4" aria-hidden="true" />
            <span>Add Service</span>
          </button>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-4">
        <div className="flex-1">
          <input
            type="text"
            placeholder="Search services or providers..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-3 bg-white dark:bg-dark-800 border border-neutral-200 dark:border-dark-700 rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400"
          />
        </div>
        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          className="px-4 py-3 bg-white dark:bg-dark-800 border border-neutral-200 dark:border-dark-700 rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400"
        >
          <option value="all">All Services</option>
          <option value="airtime">Airtime</option>
          <option value="data">Data</option>
          <option value="electricity">Electricity</option>
          <option value="cable">Cable TV</option>
        </select>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white dark:bg-dark-800 rounded-2xl shadow-lg dark:shadow-dark-lg border border-neutral-100 dark:border-dark-700 overflow-hidden"
      >
        <div className="overflow-x-auto">
          <table className="w-full" aria-label="Pricing table">
            <caption className="sr-only">Service pricing with cost and selling prices</caption>
            <thead className="bg-neutral-50 dark:bg-dark-700">
              <tr>
                <th scope="col" className="px-6 py-4 text-left text-sm font-medium text-black dark:text-white uppercase tracking-wider">Service</th>
                <th scope="col" className="px-6 py-4 text-left text-sm font-medium text-black dark:text-white uppercase tracking-wider">Cost Price</th>
                <th scope="col" className="px-6 py-4 text-left text-sm font-medium text-black dark:text-white uppercase tracking-wider">Selling Price</th>
                <th scope="col" className="px-6 py-4 text-left text-sm font-medium text-black dark:text-white uppercase tracking-wider">Profit Margin</th>
                <th scope="col" className="px-6 py-4 text-left text-sm font-medium text-black dark:text-white uppercase tracking-wider">Status</th>
                <th scope="col" className="px-6 py-4 text-left text-sm font-medium text-black dark:text-white uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100 dark:divide-dark-700">
              {filteredData.map((item) => (
                <motion.tr
                  key={item.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="hover:bg-neutral-50 dark:bg-dark-800 dark:hover:bg-dark-700 transition-colors"
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 rounded-xl bg-neutral-100 dark:bg-dark-700 flex items-center justify-center">
                        <Smartphone className="w-5 h-5 text-slate-500" aria-hidden="true" />
                      </div>
                      <div>
                        <p className="font-medium text-black dark:text-white">{item.service}</p>
                        <p className="text-sm text-black dark:text-white">{item.provider}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {editingId === item.id ? (
                      <input
                        type="number"
                        value={editForm.cost_price}
                        onChange={(e) => setEditForm(prev => ({ ...prev, cost_price: parseFloat(e.target.value) }))}
                        className="w-24 px-2 py-1 border border-neutral-300 dark:border-dark-600 rounded-lg text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400"
                        step="0.01"
                      />
                    ) : (
                      <span className="text-sm font-medium text-black dark:text-white">₦{item.cost_price}</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {editingId === item.id ? (
                      <input
                        type="number"
                        value={editForm.selling_price}
                        onChange={(e) => setEditForm(prev => ({ ...prev, selling_price: parseFloat(e.target.value) }))}
                        className="w-24 px-2 py-1 border border-neutral-300 dark:border-dark-600 rounded-lg text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400"
                        step="0.01"
                      />
                    ) : (
                      <span className="text-sm font-medium text-black dark:text-white">₦{item.selling_price}</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`text-sm font-medium ${
                      item.profit_margin > 3 ? 'text-success-600' : 
                      item.profit_margin > 1 ? 'text-warning-600' : 'text-error-600'
                    }`}>
                      {item.profit_margin.toFixed(1)}%
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                      item.status === 'active' 
                        ? 'bg-success-100 dark:bg-success-900/30 text-success-700' 
                        : 'bg-neutral-100 dark:bg-dark-700 text-black dark:text-white'
                    }`}>
                      {item.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center space-x-2">
                      {editingId === item.id ? (
                        <>
                          <button
                            onClick={() => handleSave(item.id)}
                            aria-label="Save"
                            className="p-2 text-success-600 hover:bg-success-50 dark:hover:bg-success-900/30 rounded-lg transition-colors"
                          >
                            <Save className="w-4 h-4" aria-hidden="true" />
                          </button>
                          <button
                            onClick={handleCancel}
                            aria-label="Cancel"
                            className="p-2 text-error-600 hover:bg-error-50 dark:hover:bg-error-900/30 rounded-lg transition-colors"
                          >
                            <X className="w-4 h-4" aria-hidden="true" />
                          </button>
                        </>
                      ) : (
                        <button
                          onClick={() => handleEdit(item)}
                          aria-label="Edit"
                          className="p-2 text-slate-600 hover:bg-slate-50 dark:hover:bg-dark-700 rounded-lg transition-colors"
                        >
                          <Edit3 className="w-4 h-4" aria-hidden="true" />
                        </button>
                      )}
                    </div>
                  </td>
                </motion.tr>
              ))}
              {filteredData.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-black dark:text-white">No pricing data available</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="stats-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-black dark:text-white">Average Profit Margin</p>
              <p className="text-xl font-bold text-black dark:text-white mt-1">
                {items.length > 0
                  ? `${(items.reduce((s, i) => s + i.profit_margin, 0) / items.length).toFixed(1)}%`
                  : '—'}
              </p>
            </div>
            <div className="w-12 h-12 bg-success-500 rounded-2xl flex items-center justify-center">
              <DollarSign className="w-6 h-6 text-white" aria-hidden="true" />
            </div>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="stats-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-black dark:text-white">Active Services</p>
              <p className="text-xl font-bold text-black dark:text-white mt-1">{items.filter(i => i.status === 'active').length}</p>
            </div>
            <div className="w-12 h-12 bg-slate-500 rounded-2xl flex items-center justify-center">
              <Smartphone className="w-6 h-6 text-white" aria-hidden="true" />
            </div>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="stats-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-black dark:text-white">Total Services</p>
              <p className="text-xl font-bold text-black dark:text-white mt-1">{items.length}</p>
            </div>
            <div className="w-12 h-12 bg-accent-500 rounded-2xl flex items-center justify-center">
              <Wifi className="w-6 h-6 text-white" aria-hidden="true" />
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default PricingControl;
