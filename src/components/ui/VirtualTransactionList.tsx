import { List } from 'react-window';

interface TransactionItem {
  id: string | number;
  type: string;
  amount: number;
  status: string;
  date: string;
  description: string;
}

interface VirtualTransactionListProps {
  transactions: TransactionItem[];
  height?: number;
  itemSize?: number;
}

const getStatusColor = (status: string) => {
  switch (status) {
    case 'Successful':
    case 'completed':
      return 'bg-green-100 text-green-800';
    case 'Pending':
    case 'pending':
      return 'bg-yellow-100 text-yellow-800';
    case 'Failed':
    case 'failed':
      return 'bg-red-100 text-red-800';
    default:
      return 'bg-gray-100 dark:bg-dark-700 text-gray-300';
  }
};

const formatAmount = (amount: number) => {
  const abs = Math.abs(amount);
  const prefix = amount >= 0 ? '+' : '-';
  return `${prefix}\u20A6${abs.toLocaleString()}`;
};

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

interface RowProps {
  index: number;
  style: React.CSSProperties;
  data: TransactionItem[];
}

const Row = ({ index, style, data }: RowProps) => {
  const transaction = data[index];
  return (
    <div
      style={style}
      className="flex items-center justify-between px-4 border-b border-gray-200 dark:border-dark-700 hover:bg-gray-50 dark:hover:bg-dark-700 transition-colors"
      role="row"
      aria-rowindex={index + 1}
    >
      <div className="flex items-center min-w-0 flex-1 py-2">
        <div className="w-10 h-10 rounded-xl bg-gray-100 dark:bg-dark-700 flex items-center justify-center flex-shrink-0 mr-3 text-blue-600">
          <span className="text-xs font-bold uppercase" aria-hidden="true">
            {transaction.type.charAt(0)}
          </span>
        </div>
        <div className="min-w-0 flex-1">
          <h4 className="font-medium text-black dark:text-white truncate text-sm">
            {transaction.description}
          </h4>
          <div className="flex items-center gap-1.5 mt-0.5">
            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(transaction.status)}`}>
              {transaction.status.charAt(0).toUpperCase() + transaction.status.slice(1)}
            </span>
            <span className="text-xs text-gray-500 dark:text-gray-400">
              {typeof transaction.date === 'string' && transaction.date.includes('T')
                ? formatDate(transaction.date)
                : transaction.date}
            </span>
          </div>
        </div>
      </div>
      <div className="flex-shrink-0 ml-4 text-right">
        <span
          className={`text-sm font-semibold ${
            transaction.amount >= 0 ? 'text-green-600' : 'text-black dark:text-white'
          }`}
        >
          {formatAmount(transaction.amount)}
        </span>
      </div>
    </div>
  );
};

const VirtualTransactionList = ({
  transactions,
  height = 400,
  itemSize = 64,
}: VirtualTransactionListProps) => {
  if (transactions.length === 0) {
    return (
      <div className="p-12 text-center">
        <p className="text-gray-500 dark:text-gray-400">No transactions to display</p>
      </div>
    );
  }

  return (
    <List
      height={height}
      itemCount={transactions.length}
      itemSize={itemSize}
      width="100%"
      itemData={transactions}
      role="grid"
      aria-label="Transaction list"
      ariaRowCount={transactions.length}
    >
      {Row}
    </List>
  );
};

export default VirtualTransactionList;
