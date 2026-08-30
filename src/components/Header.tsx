import React, { useState, useEffect } from 'react';
import { Menu, ShoppingCart, Clock, Plus } from 'lucide-react';
import { User as UserType } from '../types.js';
import { NavigationTab } from './Sidebar.js';

interface HeaderProps {
  onToggleSidebar: () => void;
  currentTab: NavigationTab;
  onSelectTab: (tab: NavigationTab) => void;
  onOpenAddProduct?: () => void;
  currentUser: UserType | null;
}

export const Header: React.FC<HeaderProps> = ({
  onToggleSidebar,
  currentTab,
  onSelectTab,
  onOpenAddProduct,
  currentUser,
}) => {
  const [timeStr, setTimeStr] = useState('');

  useEffect(() => {
    const update = () => {
      const d = new Date();
      setTimeStr(
        d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      );
    };
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, []);

  const titles: Record<NavigationTab, { title: string; subtitle: string }> = {
    dashboard: { title: 'Dashboard', subtitle: 'Store statistics & quick overview' },
    products: { title: 'Products', subtitle: 'Manage stationery items, stock & prices' },
    pos: { title: 'Billing', subtitle: 'Create new bill and customer invoice' },
    'sales-history': { title: 'Sales History', subtitle: 'Browse past sales records' },
  };

  const headerInfo = titles[currentTab] || {
    title: 'Stationery Store',
    subtitle: 'Store Management',
  };

  return (
    <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 lg:px-8 sticky top-0 z-30">
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleSidebar}
          className="lg:hidden p-2 rounded-lg text-slate-500 hover:text-slate-700 hover:bg-slate-50 transition"
          aria-label="Toggle navigation menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div>
          <h2 className="font-bold text-lg text-slate-900 tracking-tight leading-none">
            {headerInfo.title}
          </h2>
          <p className="hidden sm:block text-xs text-slate-400 font-normal mt-0.5">
            {headerInfo.subtitle}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {/* Real-time Clock */}
        <div className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-50 text-xs font-mono text-slate-500 border border-slate-200">
          <Clock className="w-3.5 h-3.5 text-slate-400" />
          <span>{timeStr}</span>
        </div>

        {/* Quick Billing Action Button */}
        {currentTab !== 'pos' && (
          <button
            onClick={() => onSelectTab('pos')}
            className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl transition flex items-center gap-1.5 shadow-xs"
          >
            <ShoppingCart className="w-4 h-4" />
            <span>+ New Bill</span>
          </button>
        )}
      </div>
    </header>
  );
};
