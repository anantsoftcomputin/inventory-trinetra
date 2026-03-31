import { NavLink } from 'react-router-dom';
import { Package, Layers, ShoppingCart, FileText } from 'lucide-react';

const leftItems = [
  { icon: Package, label: 'Inventory', to: '/inventory' },
  { icon: Layers, label: 'Fabrics', to: '/fabric-rolls' },
];

const rightItems = [
  { icon: ShoppingCart, label: 'Sale', to: '/pos' },
  { icon: FileText, label: 'Invoices', to: '/invoices' },
];

export default function BottomNav() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-40 lg:hidden safe-area-bottom">
      <div className="flex items-end justify-around px-1 h-16">

        {/* Left items */}
        {leftItems.map(({ icon: Icon, label, to }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex flex-col items-center justify-center flex-1 h-full gap-0.5 transition-colors ${
                isActive ? 'text-indigo-900' : 'text-gray-400'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <Icon className={`w-5 h-5 ${isActive ? 'stroke-[2.5]' : 'stroke-[1.5]'}`} />
                <span className="text-[10px] font-medium leading-none">{label}</span>
                {isActive && <span className="w-1 h-1 bg-indigo-900 rounded-full" />}
              </>
            )}
          </NavLink>
        ))}

        {/* Center — Home / Dashboard */}
        <div className="flex flex-col items-center justify-end flex-1 pb-1">
          <NavLink to="/dashboard">
            {({ isActive }) => (
              <div className="flex flex-col items-center gap-0.5">
                <div
                  className={`w-14 h-14 rounded-full flex items-center justify-center shadow-lg -translate-y-4 transition-all border-2 ${
                    isActive
                      ? 'border-amber-500 shadow-amber-200/60 scale-105'
                      : 'border-indigo-200 shadow-indigo-200/60'
                  } bg-white`}
                >
                  <img
                    src="/logo.png"
                    alt="Home"
                    className="w-10 h-10 object-contain"
                  />
                </div>
                <span
                  className={`text-[10px] font-semibold -mt-3 ${
                    isActive ? 'text-amber-600' : 'text-gray-400'
                  }`}
                >
                  Home
                </span>
              </div>
            )}
          </NavLink>
        </div>

        {/* Right items */}
        {rightItems.map(({ icon: Icon, label, to }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex flex-col items-center justify-center flex-1 h-full gap-0.5 transition-colors ${
                isActive ? 'text-indigo-900' : 'text-gray-400'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <Icon className={`w-5 h-5 ${isActive ? 'stroke-[2.5]' : 'stroke-[1.5]'}`} />
                <span className="text-[10px] font-medium leading-none">{label}</span>
                {isActive && <span className="w-1 h-1 bg-indigo-900 rounded-full" />}
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
