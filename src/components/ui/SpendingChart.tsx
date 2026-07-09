import React from "react";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

const data = [
  { label: "Airtime & Data", amount: 22500, color: "#22c55e" },
  { label: "Bills & TV", amount: 17400, color: "#f97316" },
  { label: "Betting & Education", amount: 9700, color: "#ef4444" },
];

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white dark:bg-dark-800 border border-neutral-200 rounded-xl shadow-lg px-3 py-2">
        <p className="text-sm font-medium text-black dark:text-white">
          {`${payload[0].name}: ₦${payload[0].value.toLocaleString()}`}
        </p>
      </div>
    );
  }
  return null;
};

const total = data.reduce((sum, item) => sum + item.amount, 0);

const SpendingChart: React.FC = () => {
  return (
    <div className="space-y-4">
      <div className="flex justify-center">
        <div className="relative w-32 h-32">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={35}
                outerRadius={60}
                paddingAngle={2}
                dataKey="amount"
                nameKey="label"
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="text-center">
              <div className="text-base font-bold text-secondary dark:text-white">
                ₦{total.toLocaleString()}
              </div>
              <div className="text-xs text-black dark:text-white">Total</div>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-2">
        {data.map((item, index) => (
          <div key={index} className="flex items-center justify-between">
            <div className="flex items-center">
              <div
                className="w-3 h-3 rounded-full mr-2"
                style={{ backgroundColor: item.color }}
              ></div>
              <span className="text-sm text-black dark:text-white truncate max-w-[120px] md:max-w-[200px]">{item.label}</span>
            </div>
            <div className="text-right">
              <div className="text-sm font-medium text-secondary dark:text-white">
                ₦{item.amount.toLocaleString()}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default React.memo(SpendingChart);
