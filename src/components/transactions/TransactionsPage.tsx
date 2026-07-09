import React, { useState } from "react";
import { ArrowLeft, Search, Filter, Download, Calendar, Phone, Wifi, Tv, Zap, GraduationCap, Target, RefreshCw, CreditCard } from "lucide-react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "../layout/DashboardLayout";

import type { PageProps } from '../../types/page';

interface TransactionsPageProps extends PageProps {}

const TransactionsPage: React.FC<TransactionsPageProps> = ({
  user,
  onLogout,
}) => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("all");
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  const transactions = [
    {
      id: "TXN001",
      type: "airtime",
      description: "MTN Airtime Purchase - ₦500",
      amount: -500,
      status: "completed",
      date: "2026-07-09T08:30:00Z",
      recipient: "08035792046",
    },
    {
      id: "TXN002",
      type: "data",
      description: "Glo 2GB Data Bundle",
      amount: -1500,
      status: "completed",
      date: "2026-07-08T15:45:00Z",
      recipient: "08035792046",
    },
    {
      id: "TXN003",
      type: "wallet_funding",
      description: "Wallet Funding via Bank Transfer",
      amount: 50000,
      status: "completed",
      date: "2026-07-06T09:20:00Z",
      recipient: "Self",
    },
    {
      id: "TXN004",
      type: "tv",
      description: "DStv Premium Subscription - Jul",
      amount: -12400,
      status: "pending",
      date: "2026-07-05T14:15:00Z",
      recipient: "DSTV/123456789",
    },
    {
      id: "TXN005",
      type: "electricity",
      description: "IKEDC Prepaid Meter",
      amount: -5000,
      status: "failed",
      date: "2026-07-04T11:30:00Z",
      recipient: "MTR/IK/4782910345",
    },
    {
      id: "TXN006",
      type: "education",
      description: "JAMB Registration Fee",
      amount: -4700,
      status: "completed",
      date: "2026-07-02T16:20:00Z",
      recipient: "JAMB/REG/AB/67291",
    },
    {
      id: "TXN007",
      type: "betting",
      description: "Bet9ja Wallet Funding",
      amount: -5000,
      status: "completed",
      date: "2026-06-30T13:45:00Z",
      recipient: "BET9JA/ACCT/89012",
    },
    {
      id: "TXN008",
      type: "airtime_to_cash",
      description: "Airtime to Cash - MTN",
      amount: 3400,
      status: "completed",
      date: "2026-06-28T12:10:00Z",
      recipient: "Self",
    },
    {
      id: "TXN009",
      type: "wallet_funding",
      description: "Wallet Funding via Card",
      amount: 20000,
      status: "completed",
      date: "2026-06-25T10:05:00Z",
      recipient: "Self",
    },
    {
      id: "TXN010",
      type: "airtime",
      description: "Airtel Airtime Purchase",
      amount: -200,
      status: "completed",
      date: "2026-06-24T07:15:00Z",
      recipient: "08035792046",
    },
  ];

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
    return icons[type as keyof typeof icons] || <CreditCard className="w-5 h-5" aria-hidden="true" />;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-800";
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "failed":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 dark:bg-dark-700 text-gray-300";
    }
  };

  const filteredTransactions = transactions.filter((transaction) => {
    const matchesSearch =
      transaction.description
        .toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      transaction.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      transaction.recipient.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus =
      statusFilter === "all" || transaction.status === statusFilter;
    const matchesType = typeFilter === "all" || transaction.type === typeFilter;

    return matchesSearch && matchesStatus && matchesType;
  });

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const handleLogoutClick = () => {
    setShowLogoutModal(true);
  };

  const handleConfirmLogout = () => {
    setShowLogoutModal(false);
    onLogout();
  };

  const handleCancelLogout = () => {
    setShowLogoutModal(false);
  };

  return (
    <DashboardLayout user={user} onLogout={handleLogoutClick}>
      <div className="p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center">
            <button
              onClick={() => navigate("/dashboard")}
              aria-label="Go back"
              className="mr-4 p-2 hover:bg-gray-100 dark:bg-dark-700 dark:hover:bg-dark-700 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5" aria-hidden="true" />
            </button>
            <div>
              <h1 className="text-xl font-bold text-gray-900 dark:text-neutral-100">Transactions</h1>
              <p className="text-gray-600 dark:text-gray-300">
                View and manage your transaction history
              </p>
            </div>
          </div>

          <button className="flex items-center px-4 py-2 bg-secondary text-white rounded-2xl hover:bg-opacity-90 transition-colors">
            <Download className="w-4 h-4 mr-2" aria-hidden="true" />
            Export
          </button>
        </div>

        {/* Filters */}
        <div className="bg-white dark:bg-dark-800 rounded-2xl p-4 mb-4 shadow-sm">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" aria-hidden="true" />
              <input
                type="text"
                placeholder="Search transactions..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Status</option>
              <option value="completed">Completed</option>
              <option value="pending">Pending</option>
              <option value="failed">Failed</option>
            </select>

            {/* Type Filter */}
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
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

            {/* Date Filter */}
            <select
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Time</option>
              <option value="today">Today</option>
              <option value="week">This Week</option>
              <option value="month">This Month</option>
              <option value="year">This Year</option>
            </select>
          </div>
        </div>

        {/* Transactions List */}
        <div className="bg-white dark:bg-dark-800 rounded-2xl shadow-sm overflow-hidden">
          <div className="p-4 border-b border-gray-200 dark:border-dark-700">
            <h3 className="text-base font-semibold text-gray-900 dark:text-neutral-100">
              Transaction History ({filteredTransactions.length})
            </h3>
          </div>

          <div className="divide-y divide-gray-200">
            {filteredTransactions.length > 0 ? (
              filteredTransactions.map((transaction) => (
                <div
                  key={transaction.id}
                  className="p-4 hover:bg-gray-50 dark:bg-dark-800 dark:hover:bg-dark-700 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="w-12 h-12 bg-gray-100 dark:bg-dark-700 rounded-xl flex items-center justify-center mr-4 text-primary">
                        {getTransactionIcon(transaction.type)}
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-900 dark:text-neutral-100">
                          {transaction.description}
                        </h4>
                        <div className="flex flex-wrap items-center gap-x-1.5 gap-y-0.5 mt-1">
                          <span className="text-xs md:text-sm text-gray-600 dark:text-gray-300">
                            ID: {transaction.id}
                          </span>
                          <span className="text-xs md:text-sm text-gray-600 dark:text-gray-300 truncate max-w-[100px] md:max-w-[160px]">
                            To: {transaction.recipient}
                          </span>
                          <span className="text-xs md:text-sm text-gray-600 dark:text-gray-300 whitespace-nowrap">
                            {formatDate(transaction.date)}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="text-right">
                      <p
                        className={`text-base font-semibold ${
                          transaction.amount > 0
                            ? "text-green-600"
                            : "text-gray-900 dark:text-neutral-100"
                        }`}
                      >
                        {transaction.amount > 0 ? "+" : ""}₦
                        {Math.abs(transaction.amount).toLocaleString()}
                      </p>
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(
                          transaction.status
                        )}`}
                      >
                        {transaction.status.charAt(0).toUpperCase() +
                          transaction.status.slice(1)}
                      </span>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-12 text-center">
                <div className="w-16 h-16 bg-gray-100 dark:bg-dark-700 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Search className="w-8 h-8 text-gray-400" aria-hidden="true" />
                </div>
                <h3 className="text-base font-medium text-gray-900 dark:text-neutral-100 mb-2">
                  No transactions found
                </h3>
                <p className="text-gray-600 dark:text-gray-300">
                  Try adjusting your search or filter criteria
                </p>
              </div>
            )}
          </div>
        </div>
        {/* Logout Confirmation Modal */}
        {showLogoutModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm bg-black bg-opacity-40 dark:bg-dark-900/80">
            <div className="bg-white dark:bg-dark-800 rounded-2xl shadow-2xl p-6 max-w-sm w-full mx-4">
              <h2 className="text-lg font-bold text-gray-900 dark:text-neutral-100 mb-4 text-center">
                Confirm Logout
              </h2>
              <p className="text-gray-600 dark:text-gray-300 mb-4 text-center">
                Are you sure you want to logout?
              </p>
              <div className="flex space-x-3">
                <button
                  onClick={handleCancelLogout}
                  className="flex-1 py-3 border border-gray-300 rounded-2xl font-medium hover:bg-gray-50 dark:bg-dark-800 dark:hover:bg-dark-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmLogout}
                  className="flex-1 py-3 bg-secondary text-white rounded-2xl font-medium hover:bg-opacity-90 transition-colors"
                >
                  Logout
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
      {/* Logout Confirmation Modal */}
      {showLogoutModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm bg-black bg-opacity-40 dark:bg-dark-900/80">
          <div className="bg-white dark:bg-dark-800 rounded-2xl shadow-2xl p-6 max-w-sm w-full mx-4">
            <h2 className="text-lg font-bold text-gray-900 dark:text-neutral-100 mb-4 text-center">
              Confirm Logout
            </h2>
            <p className="text-gray-600 dark:text-gray-300 mb-4 text-center">
              Are you sure you want to logout?
            </p>
            <div className="flex space-x-3">
              <button
                onClick={handleCancelLogout}
                className="flex-1 py-3 border border-gray-300 rounded-2xl font-medium hover:bg-gray-50 dark:bg-dark-800 dark:hover:bg-dark-700 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmLogout}
                className="flex-1 py-3 bg-secondary text-white rounded-2xl font-medium hover:bg-opacity-90 transition-colors"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
};

export default TransactionsPage;
