import React, { useState, useEffect } from 'react';
import { IndianRupee, TrendingUp, Calendar, ArrowUpRight, ArrowDownRight, Clock, FileText, Download } from 'lucide-react';
import { motion } from 'framer-motion';
import api from '../services/api';

export const VendorFinance = () => {
  const [statement, setStatement] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchFinanceData();
  }, []);

  const fetchFinanceData = async () => {
    setIsLoading(true);
    try {
      // Fetch Statement
      const stmtRes = await api.get('/vendor/finance/statement');
      setStatement(stmtRes.data?.data);
    } catch (err) {
      console.error('Failed to fetch finance data', err);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="p-16 text-center text-slate-500 font-medium animate-pulse">
        Loading merchant financial data...
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div>
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">Financial Dashboard</h1>
        <p className="text-sm text-slate-600 mt-1">
          Track sales earnings, account ledger transactions, and platform commissions
        </p>
      </div>

      {/* Summary Cards */}
      {statement && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white border border-slate-200/80 p-5 rounded-2xl shadow-xs">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100">
                <TrendingUp className="w-5 h-5" />
              </div>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Sales</p>
            </div>
            <h3 className="text-2xl font-black text-slate-900">₹{statement.sales?.toLocaleString()}</h3>
          </div>

          <div className="bg-white border border-slate-200/80 p-5 rounded-2xl shadow-xs">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2.5 rounded-xl bg-rose-50 text-rose-600 border border-rose-100">
                <ArrowDownRight className="w-5 h-5" />
              </div>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Commissions</p>
            </div>
            <h3 className="text-2xl font-black text-slate-900">₹{statement.commission?.toLocaleString()}</h3>
          </div>

          <div className="bg-white border-2 border-blue-600/30 p-5 rounded-2xl shadow-xs relative overflow-hidden bg-gradient-to-br from-blue-50/50 to-white">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2.5 rounded-xl bg-blue-600 text-white shadow-xs">
                <IndianRupee className="w-5 h-5" />
              </div>
              <p className="text-xs font-bold text-blue-700 uppercase tracking-wider">Available Balance</p>
            </div>
            <h3 className="text-3xl font-black text-blue-600">₹{statement.closingBalance?.toLocaleString()}</h3>
          </div>
        </div>
      )}

      {/* Account Ledger */}
      <div className="bg-white border border-slate-200/80 rounded-3xl overflow-hidden shadow-xs">
        <div className="p-6">
          {statement && (
            <div className="space-y-4">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-base font-bold text-slate-900">Account Ledger Transactions</h2>
                <button className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all">
                  <Download className="w-4 h-4" />
                  <span>Export CSV</span>
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b border-slate-100">
                    <tr>
                      <th className="px-4 py-3.5 font-bold">Date</th>
                      <th className="px-4 py-3.5 font-bold">Type</th>
                      <th className="px-4 py-3.5 font-bold">Description</th>
                      <th className="px-4 py-3.5 font-bold text-right">Amount</th>
                      <th className="px-4 py-3.5 font-bold text-right">Balance</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {!statement.transactions || statement.transactions.length === 0 ? (
                      <tr>
                        <td colSpan="5" className="px-4 py-10 text-center text-slate-400">
                          No transactions recorded yet.
                        </td>
                      </tr>
                    ) : (
                      statement.transactions.map((tx, idx) => (
                        <tr key={idx} className="hover:bg-blue-50/30 transition-colors">
                          <td className="px-4 py-3.5 text-slate-600">
                            {new Date(tx.createdAt).toLocaleDateString()}
                          </td>
                          <td className="px-4 py-3.5">
                            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-slate-700 border border-slate-200">
                              {tx.transactionType}
                            </span>
                          </td>
                          <td className="px-4 py-3.5 text-slate-800 font-medium">{tx.description}</td>
                          <td
                            className={`px-4 py-3.5 text-right font-black ${
                              tx.credit > 0 ? 'text-emerald-600' : 'text-rose-600'
                            }`}
                          >
                            {tx.credit > 0 ? '+' : '-'}₹{tx.credit > 0 ? tx.credit : tx.debit}
                          </td>
                          <td className="px-4 py-3.5 text-right font-black text-slate-900">
                            ₹{tx.balanceSnapshot}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default VendorFinance;
