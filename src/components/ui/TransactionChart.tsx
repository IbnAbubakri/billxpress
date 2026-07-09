import React, { useEffect, useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { colors } from "../../constants/theme";

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
      <div className="bg-white dark:bg-dark-800 border border-neutral-200 rounded-xl shadow-lg px-3 py-2">
        <p className="text-sm font-medium text-black dark:text-white">{`${label}: ₦${payload[0].value.toLocaleString()}`}</p>
      </div>
    );
  }
  return null;
};

const formatYAxis = (value: number) => {
  if (value >= 1000) {
    return `₦${(value / 1000).toFixed(0)}k`;
  }
  return `₦${value}`;
};

const TransactionChart: React.FC = () => {
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

  const tickColor = isDark ? "#cbd5e1" : "#64748b";
  const cursorFill = isDark ? "#1e293b" : "#f1f5f9";

  return (
    <div className="space-y-3">
      <div className="flex justify-between items-center text-sm text-black dark:text-white">
        <span>This Week</span>
        <span>
          ₦{data.reduce((sum, d) => sum + d.amount, 0).toLocaleString()}
        </span>
      </div>
      <ResponsiveContainer width="100%" height={200}>
        <BarChart data={data} barCategoryGap="30%">
          <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: tickColor }} />
          <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: tickColor }} tickFormatter={formatYAxis} />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: cursorFill }} />
          <Bar dataKey="amount" fill={colors.primary} radius={[8, 8, 0, 0]} maxBarSize={32} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default React.memo(TransactionChart);
