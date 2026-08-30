import React, { useRef } from 'react';
import { Printer, X, CheckCircle2, Download, Building2, Phone, Mail, Calendar, User, CreditCard } from 'lucide-react';
import { Sale } from '../types.js';

interface InvoiceModalProps {
  sale: Sale | null;
  isOpen: boolean;
  onClose: () => void;
}

export const InvoiceModal: React.FC<InvoiceModalProps> = ({ sale, isOpen, onClose }) => {
  const printRef = useRef<HTMLDivElement>(null);

  if (!isOpen || !sale) return null;

  const handlePrint = () => {
    window.print();
  };

  const formattedDate = new Date(sale.created_at).toLocaleString([], {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 print:p-0 print:bg-white print:static print:inset-auto">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh] print:max-h-none print:shadow-none print:border-none print:rounded-none">
        {/* Top Modal Bar (Hidden on Print) */}
        <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between print:hidden">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">Tax Invoice Receipt</h3>
              <p className="text-xs text-slate-500">{sale.invoice_number}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-medium shadow-sm transition active:scale-95"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Invoice</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Invoice Printable Content */}
        <div ref={printRef} className="p-6 sm:p-8 overflow-y-auto flex-1 invoice-print-area">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-6 border-b border-slate-200">
            <div>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold text-sm">
                  SS
                </div>
                <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">
                  STATIONERY STORE
                </h1>
              </div>
              <p className="text-xs text-slate-500 mt-1.5 flex items-center gap-1">
                <Building2 className="w-3.5 h-3.5" /> 104 Central Market Complex, College Road
              </p>
              <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-1">
                <Phone className="w-3.5 h-3.5" /> +91 98765 43210 &nbsp;|&nbsp; <Mail className="w-3.5 h-3.5" /> orders@stationery.com
              </p>
            </div>

            <div className="sm:text-right bg-slate-50 sm:bg-transparent p-3 sm:p-0 rounded-xl">
              <span className="inline-block px-2.5 py-0.5 rounded text-[11px] font-bold uppercase tracking-wider bg-emerald-100 text-emerald-800 border border-emerald-200 mb-1">
                Paid / Tax Invoice
              </span>
              <div className="text-base font-bold text-slate-900">{sale.invoice_number}</div>
              <div className="text-xs text-slate-500 mt-0.5 flex items-center sm:justify-end gap-1">
                <Calendar className="w-3.5 h-3.5" /> {formattedDate}
              </div>
            </div>
          </div>

          {/* Billed To / Info Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 py-5 border-b border-slate-200 text-xs">
            <div className="p-3 bg-slate-50 rounded-xl">
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                Customer Details
              </div>
              <div className="font-bold text-slate-800 text-sm">{sale.customer_name || 'Walk-in Customer'}</div>
              {sale.customer_phone && <div className="text-slate-600 mt-0.5">Phone: {sale.customer_phone}</div>}
              {sale.customer_email && <div className="text-slate-600">Email: {sale.customer_email}</div>}
            </div>

            <div className="p-3 bg-slate-50 rounded-xl">
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                Sale Info
              </div>
              <div className="flex justify-between py-0.5">
                <span className="text-slate-500">Billed By:</span>
                <span className="font-semibold text-slate-800">{sale.user_name || 'Store Staff'}</span>
              </div>
              <div className="flex justify-between py-0.5">
                <span className="text-slate-500">Status:</span>
                <span className="font-semibold text-emerald-700">PAID & COMPLETED</span>
              </div>
            </div>
          </div>

          {/* Items Table */}
          <div className="py-4">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 text-slate-400 text-[10px] uppercase font-bold">
                  <th className="py-2.5 px-2">#</th>
                  <th className="py-2.5 px-2">Item Description</th>
                  <th className="py-2.5 px-2 text-right">Price</th>
                  <th className="py-2.5 px-2 text-center">Qty</th>
                  <th className="py-2.5 px-2 text-right">Subtotal</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {sale.items?.map((item, idx) => (
                  <tr key={idx} className="text-slate-700">
                    <td className="py-2.5 px-2 text-slate-400">{idx + 1}</td>
                    <td className="py-2.5 px-2">
                      <div className="font-semibold text-slate-800">{item.product_name}</div>
                      {item.sku && <div className="text-[10px] text-slate-400">SKU: {item.sku}</div>}
                    </td>
                    <td className="py-2.5 px-2 text-right font-mono">₹{Number(item.price).toFixed(2)}</td>
                    <td className="py-2.5 px-2 text-center font-medium">
                      {item.quantity} {item.unit || 'pcs'}
                    </td>
                    <td className="py-2.5 px-2 text-right font-mono font-semibold text-slate-900">
                      ₹{Number(item.subtotal).toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Summary Calculation */}
          <div className="pt-3 border-t border-slate-200 flex justify-end">
            <div className="w-full sm:w-64 space-y-1.5 text-xs">
              <div className="flex justify-between text-slate-600">
                <span>Subtotal:</span>
                <span className="font-mono">₹{Number(sale.subtotal).toFixed(2)}</span>
              </div>
              {sale.discount > 0 && (
                <div className="flex justify-between text-emerald-600">
                  <span>Discount:</span>
                  <span className="font-mono">-₹{Number(sale.discount).toFixed(2)}</span>
                </div>
              )}
              {sale.tax > 0 && (
                <div className="flex justify-between text-slate-600">
                  <span>GST / Tax:</span>
                  <span className="font-mono">+₹{Number(sale.tax).toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between pt-2 border-t border-slate-300 text-sm font-extrabold text-slate-900">
                <span>Grand Total:</span>
                <span className="font-mono text-blue-700 text-base">₹{Number(sale.total_amount).toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Footer Note */}
          <div className="mt-8 pt-4 border-t border-slate-100 text-center text-[11px] text-slate-400">
            <p className="font-medium text-slate-600">Thank you for your business!</p>
            <p className="mt-0.5">Goods once sold can be exchanged within 7 days with original invoice receipt.</p>
          </div>
        </div>

        {/* Modal Footer (Hidden on Print) */}
        <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between print:hidden text-xs text-slate-500">
          <span>Printed on {new Date().toLocaleDateString()}</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl border border-slate-300 hover:bg-slate-100 text-slate-700 font-medium transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
