// © 2026 Abubakri Faaruq Adebowale (IbnAbubakri). All rights reserved.
// Faruqsuzay@gmail.com | +2349061345507

import { Logo } from './Logo';

const LoadingScreen = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary via-primary-700 to-blue-700 flex items-center justify-center">
      <div className="text-center">
        <div className="relative mb-6 sm:mb-8">
          <Logo size="lg" iconOnly className="justify-center" />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-14 h-14 sm:w-20 sm:h-20 border-2 border-white/30 border-t-white rounded-2xl animate-spin" />
          </div>
        </div>
        <h2 className="text-lg sm:text-xl font-bold text-white mb-2">BillXpress</h2>
        <div className="flex items-center justify-center gap-2">
          <div className="w-2 h-2 bg-white/60 rounded-full animate-bounce [animation-delay:0ms]" />
          <div className="w-2 h-2 bg-white/60 rounded-full animate-bounce [animation-delay:150ms]" />
          <div className="w-2 h-2 bg-white/60 rounded-full animate-bounce [animation-delay:300ms]" />
        </div>
      </div>
    </div>
  );
};

export default LoadingScreen;
