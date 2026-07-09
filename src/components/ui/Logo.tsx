interface LogoProps {
  className?: string;
  iconOnly?: boolean;
}

export function Logo({ className = '', iconOnly = false }: LogoProps) {
  return (
    <div className={`flex items-center ${className}`}>
      <div className="w-8 h-8 bg-secondary rounded-lg flex items-center justify-center mr-3 flex-shrink-0">
        <span className="text-white font-bold text-base leading-none">X</span>
      </div>
      {!iconOnly && <span className="text-lg font-bold text-secondary">BillXpress</span>}
    </div>
  );
}
