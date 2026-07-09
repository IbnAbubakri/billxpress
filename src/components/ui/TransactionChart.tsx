import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { useDarkMode } from "../../hooks/useDarkMode";

const data = [
  { day: "Mon", amount: 12350 },
  { day: "Tue", amount: 8400 },
  { day: "Wed", amount: 5500 },
  { day: "Thu", amount: 7200 },
  { day: "Fri", amount: 9500 },
  { day: "Sat", amount: 4800 },
  { day: "Sun", amount: 3200 },
];

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white dark:bg-dark-800 border border-neutral-200 dark:border-dark-700 rounded-xl shadow-lg px-3 py-2">
        <p className="text-xs text-black dark:text-white">{label}</p>
        <p className="text-sm font-semibold text-black dark:text-white">
          ₦{payload[0].value.toLocaleString()}
        </p>
      </div>
    );
  }
  return null;
};

const formatYAxis = (value: number) => {
  if (value >= 1000) return `₦${(value / 1000).toFixed(0)}k`;
  return `₦${value}`;
};

const TransactionChart = () => {
  const { isDark } = useDarkMode();

  const tickColor = isDark ? "#94a3b8" : "#64748b";
  const total = data.reduce((sum, d) => sum + d.amount, 0);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-black dark:text-white">This Week</span>
        <span className="text-sm font-semibold text-black dark:text-white">
          ₦{total.toLocaleString()}
        </span>
      </div>
      <ResponsiveContainer width="100%" height={200}>
        <BarChart data={data} barCategoryGap="40%">
          <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: tickColor }} />
          <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: tickColor }} tickFormatter={formatYAxis} />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: isDark ? "#1e293b" : "#f1f5f9" }} />
          <Bar dataKey="amount" radius={[6, 6, 0, 0]} maxBarSize={36} fill="#7C3AED" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default TransactionChart;
