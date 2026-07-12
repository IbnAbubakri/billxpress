import React, { useState } from "react";
import { ArrowLeft, Search, Download, Phone, Wifi, Tv, Zap, GraduationCap, Target, RefreshCw, CreditCard, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "../layout/DashboardLayout";
import ConfirmModal from "../ui/ConfirmModal";
import VirtualTransactionList from "../ui/VirtualTransactionList";
import { useTransactions } from "../../hooks/useTransactions";

import type { PageProps } from '../../types/page';

const TransactionsPage: React.FC<PageProps> = ({
  user,
  onLogout,
}) => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("all");
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);

  const { data: transactionsData, isLoading } = useTransactions();
  const transactions = transactionsData || [];

  const getTransactionIcon = (type: string) => {
    const icons: Record<string, React.ReactNode> = {
      airtime: <Phone className="w-5 h-5" aria-hidden="true" />,
      data: <Wifi className="w-5 h-5" aria-hidden="true" />,
      tv: <Tv className="w-5 h-5" aria-hidden="true" />,
      electricity: <Zap className="w-5 h-5" aria-hidden="true" />,
      education: <GraduationCap className="w-5 h-5" aria-hidden="true" />,
      betting: <Target className="w-5 h-5" aria-hidden="true" />,
      airtime_to_cash: <RefreshCw className="w-5 h-5" aria-hidden="true" />,
      wallet_funding: <CreditCard className="w-5 h-5" aria-hidden="true" />,
    };
    return icons[type] || <CreditCard className="w-5 h-5" aria-hidden="true" />;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed": return "bg-green-100 text-green-800";
      case "pending": return "bg-yellow-100 text-yellow-800";
      case "failed": return "bg-red-100 text-red-800";
      default: return "bg-gray-100 dark:bg-dark-700 text-gray-300";
    }
  };

  const matchesDateFilter = (dateStr: string) => {
    if (dateFilter === "all") return true;
    const date = new Date(dateStr);
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfWeek = new Date(startOfDay);
    startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfYear = new Date(now.getFullYear(), 0, 1);
    switch (dateFilter) {
      case "today": return date >= startOfDay;
      case "week": return date >= startOfWeek;
      case "month": return date >= startOfMonth;
      case "year": return date >= startOfYear;
      default: return true;
    }
  };

  const filteredTransactions = transactions.filter((transaction) => {
    const matchesSearch =
      transaction.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      transaction.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      transaction.recipient.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || transaction.status === statusFilter;
    const matchesType = typeFilter === "all" || transaction.type === typeFilter;
    const matchesDate = matchesDateFilter(transaction.date);
    return matchesSearch && matchesStatus && matchesType && matchesDate;
  });

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit",
    });
  };

  const handleLogoutClick = () => setShowLogoutModal(true);
  const handleConfirmLogout = () => { setShowLogoutModal(false); onLogout(); };
  const handleCancelLogout = () => setShowLogoutModal(false);

  const downloadCSV = () => {
    const headers = ['ID', 'Description', 'Amount', 'Status', 'Date', 'Recipient'];
    const rows = transactions.map(tx => [tx.id, tx.description, tx.amount.toString(), tx.status, new Date(tx.date).toLocaleDateString(), tx.recipient]);
    const csv = [headers.join(','), ...rows.map(r => r.map(c => `"${c}"`).join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'transactions.csv';
    a.click();
    URL.revokeObjectURL(url);
    setShowExportModal(false);
  };

  const emailExport = () => {
    const subject = 'BillXpress Transaction History';
    const headers = ['ID', 'Description', 'Amount', 'Status', 'Date', 'Recipient'];
    const rows = transactions.map(tx => [tx.id, tx.description, `₦${tx.amount}`, tx.status, new Date(tx.date).toLocaleDateString(), tx.recipient].join(' | '));
    const body = 'Transaction History\n\n' + headers.join(' | ') + '\n' + rows.join('\n');
    window.location.href = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    setShowExportModal(false);
  };

  return (
    <DashboardLayout user={user} onLogout={handleLogoutClick}>
      <div className="p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center">
            <button onClick={() => navigate("/dashboard")} aria-label="Go back" className="mr-4 p-2 hover:bg-gray-100 dark:hover:bg-dark-700 rounded-lg transition-colors">
              <ArrowLeft className="w-5 h-5" aria-hidden="true" />
            </button>
            <div>
              <h1 className="text-xl font-bold text-black dark:text-white">Transactions</h1>
              <p className="text-black dark:text-white">View and manage your transaction history</p>
            </div>
          </div>
          <button onClick={() => setShowExportModal(true)} className="flex items-center px-4 py-2 bg-secondary text-white rounded-2xl hover:bg-opacity-90 transition-colors">
            <Download className="w-4 h-4 mr-2" aria-hidden="true" />
            Export
          </button>
        </div>

        <div className="bg-white dark:bg-dark-800 rounded-2xl p-4 mb-4 shadow-sm">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-black dark:text-white w-4 h-4" aria-hidden="true" />
              <input type="text" placeholder="Search transactions..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-dark-700 rounded-xl focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:border-transparent dark:bg-dark-800 dark:text-white" />
            </div>
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 dark:border-dark-700 rounded-xl focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:border-transparent dark:bg-dark-800 dark:text-white">
              <option value="all">All Status</option>
              <option value="completed">Completed</option>
              <option value="pending">Pending</option>
              <option value="failed">Failed</option>
            </select>
            <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 dark:border-dark-700 rounded-xl focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:border-transparent dark:bg-dark-800 dark:text-white">
              <option value="all">All Types</option>
              <option value="airtime">Airtime</option>
              <option value="data">Data</option>
              <option value="tv">TV Subscription</option>
              <option value="electricity">Electricity</option>
              <option value="education">Education</option>
              <option value="betting">Betting</option>
              <option value="airtime_to_cash">Airtime to Cash</option>
              <option value="wallet_funding">Wallet Funding</option>
            </select>
            <select value={dateFilter} onChange={(e) => setDateFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 dark:border-dark-700 rounded-xl focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:border-transparent dark:bg-dark-800 dark:text-white">
              <option value="all">All Time</option>
              <option value="today">Today</option>
              <option value="week">This Week</option>
              <option value="month">This Month</option>
              <option value="year">This Year</option>
            </select>
          </div>
        </div>

        <div className="bg-white dark:bg-dark-800 rounded-2xl shadow-sm overflow-hidden">
          <div className="p-4 border-b border-gray-200 dark:border-dark-700">
            <h3 className="text-base font-semibold text-black dark:text-white">Transaction History ({filteredTransactions.length})</h3>
          </div>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
            </div>
          ) : filteredTransactions.length > 0 ? (
            filteredTransactions.length > 10 ? (
              <VirtualTransactionList
                transactions={filteredTransactions.map((t) => ({
                  id: t.id,
                  type: t.type,
                  amount: t.amount,
                  status: t.status,
                  date: t.date,
                  description: t.description,
                }))}
                height={640}
                itemSize={80}
              />
            ) : (
              <div className="divide-y divide-gray-200">
                {filteredTransactions.map((transaction) => (
                  <div key={transaction.id} className="p-4 hover:bg-gray-50 dark:bg-dark-800 dark:hover:bg-dark-700 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div className="w-12 h-12 bg-gray-100 dark:bg-dark-700 rounded-xl flex items-center justify-center mr-4 text-primary">
                          {getTransactionIcon(transaction.type)}
                        </div>
                        <div>
                          <h4 className="font-medium text-black dark:text-white">{transaction.description}</h4>
                          <div className="flex flex-wrap items-center gap-x-1.5 gap-y-0.5 mt-1">
                            <span className="text-xs md:text-sm text-black dark:text-white">ID: {transaction.id}</span>
                            <span className="text-xs md:text-sm text-black dark:text-white truncate max-w-[100px] md:max-w-[160px]">To: {transaction.recipient}</span>
                            <span className="text-xs md:text-sm text-black dark:text-white whitespace-nowrap">{formatDate(transaction.date)}</span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={`text-base font-semibold ${transaction.amount > 0 ? "text-green-600" : "text-black dark:text-white"}`}>
                          {transaction.amount > 0 ? "+" : ""}₦{Math.abs(transaction.amount).toLocaleString()}
                        </p>
                        <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(transaction.status)}`}>
                          {transaction.status.charAt(0).toUpperCase() + transaction.status.slice(1)}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )
          ) : (
            <div className="p-12 text-center">
              <div className="w-16 h-16 bg-gray-100 dark:bg-dark-700 rounded-full flex items-center justify-center mx-auto mb-4">
                <Search className="w-8 h-8 text-black dark:text-white" aria-hidden="true" />
              </div>
              <h3 className="text-base font-medium text-black dark:text-white mb-2">No transactions found</h3>
              <p className="text-black dark:text-white">Try adjusting your search or filter criteria</p>
            </div>
          )}
        </div>

        <ConfirmModal show={showLogoutModal} title="Confirm Logout" message="Are you sure you want to logout?" confirmLabel="Logout" onConfirm={handleConfirmLogout} onCancel={handleCancelLogout} />
      </div>

      {showExportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm bg-black bg-opacity-40 dark:bg-dark-900/80">
          <div className="bg-white dark:bg-dark-800 rounded-2xl shadow-2xl p-6 max-w-sm w-full mx-4">
            <h2 className="text-lg font-bold text-black dark:text-white mb-4 text-center">Export Transactions</h2>
            <div className="space-y-3">
              <button onClick={downloadCSV} className="w-full py-3 bg-secondary text-white rounded-2xl font-medium hover:bg-opacity-90 transition-colors">Download as CSV</button>
              <button onClick={emailExport} className="w-full py-3 border border-gray-300 rounded-2xl font-medium hover:bg-gray-50 dark:bg-dark-800 dark:hover:bg-dark-700 transition-colors text-black dark:text-white">Send to Email</button>
              <button onClick={() => setShowExportModal(false)} className="w-full py-3 text-sm text-black dark:text-white hover:underline">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
};

export default TransactionsPage;
