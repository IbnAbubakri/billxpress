// © 2026 Abubakri Faaruq Adebowale (IbnAbubakri). All rights reserved.
// Faruqsuzay@gmail.com | +2349061345507

import { Logo } from './Logo';

const LoadingScreen = () => {
  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-dark-900 flex items-center justify-center">
      <div className="text-center">
        <div className="mb-6 sm:mb-8 flex justify-center">
          <Logo size="lg" iconOnly className="justify-center" />
        </div>
        <h2 className="text-lg sm:text-xl font-bold text-black dark:text-white mb-2">BillXpress</h2>
        <div className="w-32 h-1 mx-auto bg-gray-200 dark:bg-dark-700 rounded-full overflow-hidden">
          <div className="h-full bg-gradient-to-r from-primary to-blue-600 rounded-full animate-pulse" style={{ width: '60%' }} />
        </div>
      </div>
    </div>
  );
};

export default LoadingScreen;
