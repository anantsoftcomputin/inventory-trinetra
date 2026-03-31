import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ShoppingCart, Bell, Menu } from 'lucide-react';
import { getLowStockProducts } from '../../firebase/inventoryService';
import Logo from '../common/Logo';

const PAGE_TITLES = {
  '/dashboard': 'Dashboard',
  '/inventory': 'Inventory',
  '/fabric-rolls': 'Fabric Rolls',
  '/pos': 'New Sale',
  '/invoices': 'Invoices',
  '/tag-manager': 'Tag Manager',
  '/settings': 'Settings',
};

export default function Header({ onMenuClick }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [now, setNow] = useState(new Date());
  const [lowStockCount, setLowStockCount] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    getLowStockProducts(3)
      .then(p => setLowStockCount(p.length))
      .catch(() => {});
  }, [location.pathname]);

  const title = PAGE_TITLES[location.pathname] || 'Trinetra';
  const formatted = now.toLocaleString('en-IN', {
    weekday: 'short', day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit'
  });

  return (
    <header className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuClick}
          className="lg:hidden p-2 rounded-lg hover:bg-gray-100"
        >
          <Menu className="w-5 h-5 text-gray-600" />
        </button>
        <Logo className="w-7 h-7" imgClassName="w-7 h-7 object-contain flex-shrink-0" />
        <h1 className="text-xl font-bold text-indigo-950">{title}</h1>
      </div>
      <div className="flex items-center gap-3">
        <span className="hidden sm:block text-sm text-gray-500">{formatted}</span>
        <div className="relative">
          <button
            className="p-2 rounded-lg hover:bg-gray-100 relative"
            title="Low stock alerts"
          >
            <Bell className="w-5 h-5 text-gray-600" />
            {lowStockCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
                {lowStockCount}
              </span>
            )}
          </button>
        </div>
        <button
          onClick={() => navigate('/pos')}
          className="bg-indigo-900 text-white text-sm rounded-lg px-3 py-2 hover:bg-indigo-800 flex items-center gap-2"
        >
          <ShoppingCart className="w-4 h-4" />
          <span className="hidden sm:inline">New Sale</span>
        </button>
      </div>
    </header>
  );
}
