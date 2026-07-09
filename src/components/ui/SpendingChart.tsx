import React, { useEffect, useState } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";

const data = [
  { month: "Jan", spending: 32000 },
  { month: "Feb", spending: 28000 },
  { month: "Mar", spending: 45000 },
  { month: "Apr", spending: 38000 },
  { month: "May", spending: 52000 },
  { month: "Jun", spending: 41000 },
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

const SpendingChart: React.FC = () => {
  const [isDark, setIsDark] = useState(
    typeof document !== 'undefined' && document.documentElement.classList.contains('dark')
  );

  useEffect(() => {
    const observer = new MutationObserver(() => {
      setIsDark(document.documentElement.classList.contains('dark'));
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, []);

  const tickColor = isDark ? "#94a3b8" : "#64748b";
  const gridColor = isDark ? "#334155" : "#e2e8f0";

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-black dark:text-white">Spending Overview</span>
        <span className="text-xs text-black dark:text-white">
          Total: ₦{data.reduce((s, d) => s + d.spending, 0).toLocaleString()}
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

export default React.memo(SpendingChart);
