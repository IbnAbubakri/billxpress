import { useNavigate } from "react-router-dom";
import {
  Phone,
  Wifi,
  Tv,
  Zap,
  GraduationCap,
  ArrowRightLeft,
  Target,
} from "lucide-react"

const cardVariants = [
  { iconShape: 'rounded-xl', hover: 'hover:-translate-y-1 hover:shadow-md', border: '' },
  { iconShape: 'rounded-full', hover: 'hover:shadow-lg', border: 'border-t-2 border-t-blue-200 dark:border-t-blue-800' },
  { iconShape: 'rounded-lg', hover: 'hover:-translate-y-0.5 hover:shadow-md', border: '' },
  { iconShape: 'rounded-2xl', hover: 'hover:border-slate-300 dark:hover:border-dark-500', border: '' },
  { iconShape: 'rounded-xl', hover: 'hover:-translate-y-1 hover:shadow-md', border: '' },
  { iconShape: 'rounded-full', hover: 'hover:shadow-lg', border: 'border-b-2 border-b-orange-200 dark:border-b-orange-800' },
  { iconShape: 'rounded-lg', hover: 'hover:-translate-y-0.5 hover:shadow-md', border: '' },
];

const services = [
  {
    id: "airtime",
    title: "Airtime",
    description: "Buy airtime for all networks",
    icon: Phone,
    color: "bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400",
  },
  {
    id: "data",
    title: "Data",
    description: "Purchase data bundles",
    icon: Wifi,
    color: "bg-green-50 text-green-600 dark:bg-green-900/30 dark:text-green-400",
  },
  {
    id: "tv",
    title: "TV Bills",
    description: "Pay for cable subscriptions",
    icon: Tv,
    color: "bg-purple-50 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400",
  },
  {
    id: "electricity",
    title: "Electricity",
    description: "Pay electricity bills",
    icon: Zap,
    color: "bg-yellow-50 text-yellow-600 dark:bg-yellow-900/30 dark:text-yellow-400",
  },
  {
    id: "education",
    title: "Education",
    description: "WAEC, JAMB & more",
    icon: GraduationCap,
    color: "bg-indigo-50 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400",
  },
  {
    id: "airtime-to-cash",
    title: "Airtime to Cash",
    description: "Convert airtime to cash",
    icon: ArrowRightLeft,
    color: "bg-orange-50 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400",
  },
  {
    id: "betting",
    title: "Betting",
    description: "Fund betting wallets",
    icon: Target,
    color: "bg-red-50 text-red-600 dark:bg-red-900/30 dark:text-red-400",
  },
];

const ServiceGrid = () => {
  const navigate = useNavigate();

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
      {services.map((service, i) => {
        const Icon = service.icon;
        const variant = cardVariants[i % cardVariants.length];
        return (
          <button
            key={service.id}
            onClick={() => navigate(service.path)}
            className={`group relative bg-white dark:bg-dark-800 rounded-2xl p-3 sm:p-4 shadow-sm border border-transparent ${variant.border} transition-all duration-300 ${variant.hover} active:scale-[0.98] text-left overflow-hidden`}
          >
            <div className="relative">
              <div
                className={`w-9 h-9 sm:w-12 sm:h-12 ${variant.iconShape} ${service.color} flex items-center justify-center mb-2 sm:mb-4 transition-all duration-300 group-hover:scale-110 group-hover:shadow-lg`}
              >
                <Icon className="w-5 h-5 sm:w-6 sm:h-6" aria-hidden="true" />
              </div>
              <h3 className="font-semibold text-secondary dark:text-white text-sm sm:text-base mb-1">
                {service.title}
              </h3>
              <p className="text-xs sm:text-sm text-black dark:text-white leading-tight sm:leading-normal">
                {service.description}
              </p>
            </div>
            <span className="absolute bottom-2 right-2 sm:bottom-3 sm:right-3 w-5 h-5 rounded-full bg-slate-100 dark:bg-dark-700 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              <svg className="w-3 h-3 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </span>
          </button>
        );
      })}
    </div>
  );
};

export default ServiceGrid;
