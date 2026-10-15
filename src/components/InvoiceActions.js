"use client";

import React from "react";
import { Printer, CreditCard } from "lucide-react";
import toast from "react-hot-toast";

export default function InvoiceActions({ invoice, isFreelancer }) {
  const handlePrint = () => {
    window.print();
  };

  const handlePay = () => {
    toast.error("LemonSqueezy integration coming soon! (Zero Upfront Cost)");
  };

  return (
    <div className="flex items-center gap-3">
      <button 
        onClick={handlePrint}
        className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg font-medium border border-slate-700 transition-colors text-sm flex items-center gap-2"
      >
        <Printer size={16} /> Print / Save PDF
      </button>
      {!isFreelancer && invoice.status !== "paid" && (
        <button 
          onClick={handlePay}
          className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-medium transition-colors text-sm flex items-center gap-2 shadow-md shadow-indigo-900/20"
        >
          <CreditCard size={16} /> Pay via LemonSqueezy
        </button>
      )}
    </div>
  );
}
