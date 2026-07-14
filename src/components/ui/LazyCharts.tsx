// © 2026 Abubakri Faaruq Adebowale (IbnAbubakri). All rights reserved.
// Faruqsuzay@gmail.com | +2349061345507

import { lazy, Suspense } from 'react';

const TransactionChartInner = lazy(() => import('./TransactionChart'));
const SpendingChartInner = lazy(() => import('./SpendingChart'));

function ChartFallback() {
  return (
    <div className="h-[200px] bg-neutral-50 dark:bg-dark-800 rounded-2xl animate-pulse flex items-center justify-center">
      <span className="text-sm text-black dark:text-white">Loading chart...</span>
    </div>
  );
}

export function TransactionChart() {
  return (
    <Suspense fallback={<ChartFallback />}>
      <TransactionChartInner />
    </Suspense>
  );
}

export function SpendingChart() {
  return (
    <Suspense fallback={<ChartFallback />}>
      <SpendingChartInner />
    </Suspense>
  );
}
