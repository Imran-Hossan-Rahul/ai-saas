"use client";

import { useState, useEffect } from "react";
import { useWorkspace } from "./WorkspaceProvider";
import { Receipt, DollarSign, ArrowUpRight, ArrowDownRight, Tag } from "lucide-react";
import toast from "react-hot-toast";

export default function ExpenseList({ projectId, projectRevenue }) {
  const { activeWorkspace } = useWorkspace();
  const [expenses, setExpenses] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchExpenses = async () => {
      try {
        setIsLoading(true);
        const res = await fetch(`/api/expenses?workspaceId=${activeWorkspace._id}&projectId=${projectId}`);
        const data = await res.json();
        if (res.ok) {
          setExpenses(data.expenses);
        }
      } catch (error) {
        toast.error("Failed to load expenses");
      } finally {
        setIsLoading(false);
      }
    };

    if (activeWorkspace?._id) {
      fetchExpenses();
    }
  }, [activeWorkspace, projectId]);

  const totalExpenses = expenses.reduce((sum, exp) => sum + exp.amount, 0);
  const netProfit = (projectRevenue || 0) - totalExpenses;
  const profitMargin = projectRevenue ? Math.round((netProfit / projectRevenue) * 100) : 0;

  if (isLoading) {
    return <div className="animate-pulse h-32 bg-slate-900 border border-slate-800 rounded-2xl"></div>;
  }

  return (
    <div className="space-y-6">
      {/* Financial Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
          <p className="text-slate-500 text-xs font-semibold uppercase tracking-wider mb-1">Total Revenue</p>
          <div className="flex items-center gap-2">
            <ArrowUpRight className="text-emerald-500" size={20} />
            <h3 className="text-2xl font-bold text-white">${(projectRevenue || 0).toLocaleString()}</h3>
          </div>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
          <p className="text-slate-500 text-xs font-semibold uppercase tracking-wider mb-1">Total Expenses</p>
          <div className="flex items-center gap-2">
            <ArrowDownRight className="text-rose-500" size={20} />
            <h3 className="text-2xl font-bold text-white">${totalExpenses.toLocaleString()}</h3>
          </div>
        </div>
        <div className={`border rounded-2xl p-5 ${netProfit >= 0 ? 'bg-emerald-900/10 border-emerald-900/30' : 'bg-rose-900/10 border-rose-900/30'}`}>
          <div className="flex justify-between items-start">
            <p className={`text-xs font-semibold uppercase tracking-wider mb-1 ${netProfit >= 0 ? 'text-emerald-500/70' : 'text-rose-500/70'}`}>Net Profit</p>
            <span className={`text-xs font-bold px-2 py-0.5 rounded ${netProfit >= 0 ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'}`}>
              {profitMargin}% Margin
            </span>
          </div>
          <div className="flex items-center gap-2 mt-1">
            <DollarSign className={netProfit >= 0 ? "text-emerald-400" : "text-rose-400"} size={20} />
            <h3 className={`text-2xl font-bold ${netProfit >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
              {netProfit >= 0 ? "$" : "-$"}{Math.abs(netProfit).toLocaleString()}
            </h3>
          </div>
        </div>
      </div>

      {/* Expense List */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
        {expenses.length === 0 ? (
          <div className="p-8 text-center">
            <Receipt className="mx-auto h-10 w-10 text-slate-700 mb-3" />
            <p className="text-slate-400">No expenses logged for this project yet.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-800/50">
            {expenses.map((expense) => (
              <div key={expense._id} className="p-4 sm:p-5 flex flex-col sm:flex-row justify-between sm:items-center gap-4 hover:bg-slate-800/30 transition-colors">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center shrink-0">
                    <Tag className="text-slate-400" size={18} />
                  </div>
                  <div>
                    <h4 className="text-white font-medium">{expense.category}</h4>
                    <p className="text-slate-500 text-xs mt-0.5">{expense.description || "No description"}</p>
                    <p className="text-slate-600 text-[10px] mt-1">{new Date(expense.date).toLocaleDateString()}</p>
                  </div>
                </div>
                <div className="text-rose-400 font-semibold sm:text-right">
                  -${expense.amount.toLocaleString()}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
