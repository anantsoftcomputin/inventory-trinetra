import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Package, Layers, ShoppingCart,
  FileText, Tag, Settings, LogOut
} from 'lucide-react';
import { logOut } from '../../firebase/authService';
import { auth } from '../../firebase/config';
import toast from 'react-hot-toast';
import Logo from '../common/Logo';

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
        <div className="flex items-center gap-3 px-6 py-4 border-b border-indigo-800">
          <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center p-1 flex-shrink-0 shadow-sm">
            <Logo className="w-10 h-10" imgClassName="w-full h-full object-contain" />
          </div>
          <div>
            <span className="text-lg font-bold tracking-widest text-amber-400 block leading-tight">TRINETRA</span>
            <span className="text-[10px] text-indigo-400 tracking-wide">Fashion Studio</span>
          </div>
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
