// © 2026 Abubakri Faaruq Adebowale (IbnAbubakri). All rights reserved.
// Faruqsuzay@gmail.com | +2349061345507

import { useQuery } from '@tanstack/react-query';
import { walletApi } from '../../api/client';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { useDarkMode } from "../../hooks/useDarkMode";

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const emptyData = DAYS.map(day => ({ day, amount: 0 }));

const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number }>; label?: string }) => {
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
  const { data: apiData } = useQuery({
    queryKey: ['charts', 'weekly'],
    queryFn: async () => {
      const { data } = await walletApi.get('/charts/weekly');
      return data.data as Array<{ day_idx: number; amount: number }>;
    },
    staleTime: 2 * 60 * 1000,
    refetchOnMount: true,
  });

  const data = apiData && apiData.length > 0
    ? DAYS.map((day, i) => {
        const match = apiData.find((d: { day_idx: number }) => Number(d.day_idx) === i);
        return { day, amount: match ? Number(match.amount) : 0 };
      })
    : emptyData;

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