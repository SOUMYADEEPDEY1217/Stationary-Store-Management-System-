import React from 'react';
import {
  LayoutDashboard,
  Package,
  PlusCircle,
  ShoppingCart,
  Receipt,
  LogOut,
  X,
  BookOpen,
} from 'lucide-react';
import { User } from '../types.js';

export type NavigationTab =
  | 'dashboard'
  | 'products'
  | 'pos'
  | 'sales-history';

interface SidebarProps {
  currentTab: NavigationTab;
  onSelectTab: (tab: NavigationTab) => void;
  onOpenAddProduct: () => void;
  currentUser: User | null;
  onLogout: () => void;
  isOpen: boolean;
  onCloseMobile: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onSelectTab,
  onOpenAddProduct,
  currentUser,
  onLogout,
  isOpen,
  onCloseMobile,
}) => {
  const menuItems = [
    {
      id: 'dashboard' as NavigationTab,
      label: 'Dashboard',
      icon: LayoutDashboard,
      onClick: () => onSelectTab('dashboard'),
    },
    {
      id: 'products' as NavigationTab,
      label: 'Products',
      icon: Package,
      onClick: () => onSelectTab('products'),
    },
    {
      id: 'add-product',
      label: 'Add Product',
      icon: PlusCircle,
      onClick: () => {
        onSelectTab('products');
        onOpenAddProduct();
      },
    },
    {
      id: 'pos' as NavigationTab,
      label: 'Billing',
      icon: ShoppingCart,
      onClick: () => onSelectTab('pos'),
    },
    {
      id: 'sales-history' as NavigationTab,
      label: 'Sales History',
      icon: Receipt,
      onClick: () => onSelectTab('sales-history'),
    },
  ];

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-40 lg:hidden"
          onClick={onCloseMobile}
        />
      )}

      {/* Clean Beginner-Friendly Sidebar */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-64 bg-white border-r border-slate-200 flex flex-col transition-transform duration-200 ease-in-out lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand Header */}
        <div className="p-5 flex items-center justify-between border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-blue-600 rounded-xl flex items-center justify-center text-white shadow-xs">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h1 className="font-bold text-base tracking-tight text-slate-900 leading-tight">
                Stationery Store
              </h1>
              <p className="text-[11px] text-slate-400 font-medium">Store Management</p>
            </div>
          </div>
          <button
            onClick={onCloseMobile}
            className="lg:hidden text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-50 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation items (Strictly 5 simple options) */}
        <nav className="flex-1 p-4 space-y-1.5 overflow-y-auto">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;

            return (
              <button
                key={item.id}
                onClick={() => {
                  item.onClick();
                  onCloseMobile();
                }}
                className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-xl font-medium text-xs transition text-left ${
                  isActive
                    ? 'bg-blue-50 text-blue-700 font-bold shadow-xs'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <Icon
                  className={`w-4 h-4 transition ${
                    isActive ? 'text-blue-600' : 'text-slate-400'
                  }`}
                />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Bottom User Profile & Logout */}
        <div className="p-4 border-t border-slate-100 bg-slate-50/50 space-y-3">
          <div className="flex items-center gap-3 px-1">
            <div className="w-8 h-8 rounded-full bg-blue-600 text-white font-bold text-xs flex items-center justify-center">
              {currentUser?.name?.charAt(0) || 'A'}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold text-slate-900 truncate">
                {currentUser?.name || 'Administrator'}
              </p>
              <p className="text-[10px] text-slate-400 truncate capitalize">
                {currentUser?.role || 'Staff'} Account
              </p>
            </div>
          </div>

          <button
            onClick={onLogout}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 text-xs font-semibold text-rose-600 bg-rose-50 hover:bg-rose-100 rounded-xl transition"
          >
            <LogOut className="w-4 h-4" />
            <span>Logout</span>
          </button>
        </div>
      </aside>
    </>
  );
};
