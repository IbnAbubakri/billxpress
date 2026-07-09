import React from "react";

const LoadingScreen: React.FC = () => {
  return (
    <div className="min-h-screen bg-primary flex items-center justify-center">
      <div className="text-center">
        <div className="relative mb-4 sm:mb-6">
          <div className="w-14 h-14 sm:w-20 sm:h-20 mx-auto bg-secondary rounded-2xl shadow-lg flex items-center justify-center animate-pulse">
            <span className="text-white font-bold text-2xl sm:text-3xl leading-none">X</span>
          </div>
          <div className="absolute inset-0 w-14 h-14 sm:w-20 sm:h-20 mx-auto border-4 border-transparent border-t-secondary rounded-2xl animate-spin"></div>
        </div>
        <h2 className="text-lg sm:text-xl font-bold text-secondary mb-1 sm:mb-2">BillXpress</h2>
        <p className="text-sm sm:text-base text-black dark:text-white">Loading your dashboard...</p>
      </div>
    </div>
  );
};

export default React.memo(LoadingScreen);
