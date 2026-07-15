// © 2026 Abubakri Faaruq Adebowale (IbnAbubakri). All rights reserved.
// Faruqsuzay@gmail.com | +2349061345507

interface LogoProps {
  className?: string;
  iconOnly?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

const sizeMap = {
  sm: { container: 'w-7 h-7', text: 'text-xs', mark: 'text-[10px]' },
  md: { container: 'w-9 h-9', text: 'text-lg', mark: 'text-sm' },
  lg: { container: 'w-12 h-12', text: 'text-2xl', mark: 'text-base' },
};

export function Logo({ className = '', iconOnly = false, size = 'md' }: LogoProps) {
  const s = sizeMap[size];
  return (
    <div className={`flex items-center ${className}`}>
      <div className={`${s.container} bg-primary rounded-xl flex items-center justify-center mr-3 flex-shrink-0`}>
        <span className={`${s.mark} font-bold text-white leading-none tracking-tight`}>BX</span>
      </div>
      {!iconOnly && (
        <span className={`${s.text} font-bold text-primary`}>
          BillXpress
        </span>
      )}
    </div>
  );
}
