import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Package, Layers, ShoppingCart,
  FileText, Tag, Settings, LogOut, Eye
} from 'lucide-react';
import { logOut } from '../../firebase/authService';
import { auth } from '../../firebase/config';
import toast from 'react-hot-toast';

const navItems = [
  { icon: LayoutDashboard, label: 'Dashboard', to: '/dashboard' },
  { icon: Package, label: 'Inventory', to: '/inventory' },
  { icon: Layers, label: 'Fabric Rolls', to: '/fabric-rolls' },
  { icon: ShoppingCart, label: 'New Sale', to: '/pos' },
  { icon: FileText, label: 'Invoices', to: '/invoices' },
  { icon: Tag, label: 'Tag Manager', to: '/tag-manager' },
  { icon: Settings, label: 'Settings', to: '/settings' },
];

export default function Sidebar({ isOpen, onClose }) {
  const navigate = useNavigate();
  const user = auth.currentUser;

  async function handleLogout() {
    try {
      await logOut();
      navigate('/login');
    } catch {
      toast.error('Logout failed');
    }
  }

  return (
    <>
      {/* Overlay for mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-20 lg:hidden"
          onClick={onClose}
        />
      )}
      <aside className={`
        fixed top-0 left-0 h-full w-64 bg-indigo-950 text-white z-30
        flex flex-col transition-transform duration-300
        ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        {/* Logo */}
        <div className="flex items-center gap-2 px-6 py-5 border-b border-indigo-800">
          <div className="w-9 h-9 bg-amber-600 rounded-lg flex items-center justify-center">
            <Eye className="w-5 h-5 text-white" />
          </div>
          <span className="text-xl font-bold tracking-widest text-amber-400">TRINETRA</span>
        </div>

        {/* Nav */}
        <nav className="flex-1 py-4 overflow-y-auto">
          {navItems.map(({ icon: Icon, label, to }) => (
            <NavLink
              key={to}
              to={to}
              onClick={onClose}
              className={({ isActive }) =>
                `flex items-center gap-3 px-6 py-3 text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-amber-600 text-white'
                    : 'text-indigo-200 hover:bg-indigo-800 hover:text-white'
                }`
              }
            >
              <Icon className="w-5 h-5 flex-shrink-0" />
              {label}
            </NavLink>
          ))}
        </nav>

        {/* User + Logout */}
        <div className="border-t border-indigo-800 px-6 py-4">
          <p className="text-xs text-indigo-400 truncate mb-3">{user?.email || 'Staff'}</p>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 text-sm text-indigo-300 hover:text-white transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
        </div>
      </aside>
    </>
  );
}
