import React, { useState, useEffect } from 'react';
import { User, Sale } from './types.js';
import { api } from './services/api.js';
import { ToastProvider } from './components/Toast.js';
import { LoginView } from './components/LoginView.js';
import { Sidebar, NavigationTab } from './components/Sidebar.js';
import { Header } from './components/Header.js';
import { DashboardView } from './components/DashboardView.js';
import { POSView } from './components/POSView.js';
import { ProductsView } from './components/ProductsView.js';
import { SalesHistoryView } from './components/SalesHistoryView.js';
import { InvoiceModal } from './components/InvoiceModal.js';

function MainApp() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loadingUser, setLoadingUser] = useState(true);
  const [currentTab, setCurrentTab] = useState<NavigationTab>('dashboard');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [autoOpenAddProduct, setAutoOpenAddProduct] = useState(false);

  // Invoice Receipt Modal State
  const [activeInvoice, setActiveInvoice] = useState<Sale | null>(null);
  const [isInvoiceOpen, setIsInvoiceOpen] = useState(false);

  useEffect(() => {
    const user = api.getCurrentUser();
    if (user && api.getToken()) {
      api
        .getMe()
        .then((verified) => {
          setCurrentUser(verified);
        })
        .catch(() => {
          api.logout();
          setCurrentUser(null);
        })
        .finally(() => {
          setLoadingUser(false);
        });
    } else {
      setLoadingUser(false);
    }
  }, []);

  const handleLoginSuccess = (user: User) => {
    setCurrentUser(user);
    setCurrentTab('dashboard');
  };

  const handleLogout = () => {
    api.logout();
    setCurrentUser(null);
    setCurrentTab('dashboard');
  };

  const handleOpenInvoice = (sale: Sale) => {
    setActiveInvoice(sale);
    setIsInvoiceOpen(true);
  };

  const handleSaleCompleted = (sale: Sale) => {
    setActiveInvoice(sale);
    setIsInvoiceOpen(true);
  };

  const handleOpenAddProduct = () => {
    setCurrentTab('products');
    setAutoOpenAddProduct(true);
  };

  if (loadingUser) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center text-white">
        <div className="w-8 h-8 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin mb-3" />
        <p className="text-xs text-slate-400 font-medium">Loading Stationery Store...</p>
      </div>
    );
  }

  if (!currentUser) {
    return <LoginView onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans antialiased text-slate-800">
      <div className="flex flex-1 overflow-hidden">
        {/* Simple Sidebar */}
        <Sidebar
          currentTab={currentTab}
          onSelectTab={(tab) => {
            setCurrentTab(tab);
            setIsMobileMenuOpen(false);
          }}
          onOpenAddProduct={handleOpenAddProduct}
          currentUser={currentUser}
          onLogout={handleLogout}
          isOpen={isMobileMenuOpen}
          onCloseMobile={() => setIsMobileMenuOpen(false)}
        />

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col min-w-0 lg:pl-64 overflow-y-auto">
          {/* Header */}
          <Header
            currentUser={currentUser}
            currentTab={currentTab}
            onSelectTab={setCurrentTab}
            onOpenAddProduct={handleOpenAddProduct}
            onToggleSidebar={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          />

          {/* Main Body Views */}
          <main className="flex-1 pb-12">
            {currentTab === 'dashboard' && (
              <DashboardView
                onSelectTab={setCurrentTab}
                onViewInvoice={handleOpenInvoice}
                onOpenAddProduct={handleOpenAddProduct}
                currentUser={currentUser}
              />
            )}

            {currentTab === 'products' && (
              <ProductsView
                currentUser={currentUser}
                autoOpenAddModal={autoOpenAddProduct}
                onResetAutoOpen={() => setAutoOpenAddProduct(false)}
              />
            )}

            {currentTab === 'pos' && (
              <POSView
                currentUser={currentUser}
                onSaleCompleted={handleSaleCompleted}
              />
            )}

            {currentTab === 'sales-history' && (
              <SalesHistoryView
                currentUser={currentUser}
                onViewInvoice={handleOpenInvoice}
              />
            )}
          </main>
        </div>
      </div>

      {/* Invoice Receipt Modal */}
      <InvoiceModal
        sale={activeInvoice}
        isOpen={isInvoiceOpen}
        onClose={() => setIsInvoiceOpen(false)}
      />
    </div>
  );
}

export default function App() {
  return (
    <ToastProvider>
      <MainApp />
    </ToastProvider>
  );
}
