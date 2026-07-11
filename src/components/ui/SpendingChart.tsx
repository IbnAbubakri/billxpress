import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { useDarkMode } from "../../hooks/useDarkMode";

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

const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

const SpendingChart = () => {
  const { isDark } = useDarkMode();
  const { data: apiData } = useQuery({
    queryKey: ['charts', 'monthly'],
    queryFn: async () => {
      const { data } = await axios.get('/api/charts/monthly', { withCredentials: true });
      return data.data as Array<{ month: string; spending: number }>;
    },
    staleTime: 2 * 60 * 1000,
  });

  const data = apiData && apiData.length > 0
    ? apiData.map((d: { month: string; spending: number }) => {
        const m = months[parseInt(d.month.split('-')[1], 10) - 1] || d.month;
        return { month: m, spending: Number(d.spending) };
      })
    : [];

  const tickColor = isDark ? "#94a3b8" : "#64748b";
  const gridColor = isDark ? "#334155" : "#e2e8f0";
  const total = data.reduce((s: number, d: { spending: number }) => s + d.spending, 0);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-black dark:text-white">Spending Overview</span>
        <span className="text-xs text-black dark:text-white">
          Total: ₦{total.toLocaleString()}
        </span>
      </div>
      <ResponsiveContainer width="100%" height={220}>
        <AreaChart data={data} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id="spendingGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#7C3AED" stopOpacity={0.3} />
              <stop offset="100%" stopColor="#7C3AED" stopOpacity={0.05} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
          <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: tickColor }} />
          <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: tickColor }} tickFormatter={formatYAxis} />
          <Tooltip content={<CustomTooltip />} cursor={{ stroke: "#7C3AED", strokeWidth: 1, strokeDasharray: "4 4" }} />
          <Area type="monotone" dataKey="spending" stroke="#7C3AED" strokeWidth={2} fill="url(#spendingGradient)" />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};

export default SpendingChart;