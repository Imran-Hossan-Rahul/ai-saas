import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { redirect } from "next/navigation";
import connectDb from "@/lib/db";
import Invoice from "@/models/invoice.model";
import Project from "@/models/project.model";
import User from "@/models/user.model";
import Link from "next/link";
import InvoiceActions from "@/components/InvoiceActions";
import { ArrowLeft, Printer, CreditCard, Building2, MapPin, Mail, Phone } from "lucide-react";

async function getInvoiceData(invoiceId, userId, role) {
  await connectDb();
  const invoice = await Invoice.findById(invoiceId)
    .populate("projectId", "title description")
    .populate("clientId", "name email")
    .lean();

  if (!invoice) return null;

  // Security checks
  if (role === "client" && invoice.clientId._id.toString() !== userId) return null;
  
  if (role !== "client" && role !== "admin") {
    // Check if freelancer owns the project
    const project = await Project.findById(invoice.projectId).lean();
    if (!project || (project.owner.toString() !== userId && project.talent?.toString() !== userId)) {
      return null;
    }
  }

  // Get Freelancer (Issuer) info. Since we don't store issuer directly on Invoice yet,
  // we derive it from the Project's talent field, or fallback to the current freelancer user.
  let issuer = null;
  if (role !== "client") {
    issuer = await User.findById(userId).select("name email").lean();
  } else {
    // If client is viewing, find the freelancer
    const project = await Project.findById(invoice.projectId).lean();
    if (project.talent) {
      issuer = await User.findById(project.talent).select("name email").lean();
    } else {
      issuer = { name: "Agency Owner", email: "contact@agency.com" }; // Fallback
    }
  }

  return { 
    invoice: JSON.parse(JSON.stringify(invoice)), 
    issuer: JSON.parse(JSON.stringify(issuer)) 
  };
}

const STATUS_STYLES = {
  "pending": "bg-amber-100 text-amber-800 border-amber-200",
  "paid": "bg-emerald-100 text-emerald-800 border-emerald-200",
  "overdue": "bg-rose-100 text-rose-800 border-rose-200",
  "cancelled": "bg-slate-100 text-slate-800 border-slate-200",
};

export default async function InvoiceDetailPage({ params }) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/auth/login");

  const data = await getInvoiceData(params.id, session.user.id, session.user.role);

  if (!data) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-200 p-8">
        <div className="text-center max-w-md bg-slate-900 p-8 rounded-2xl border border-slate-800">
          <h1 className="text-2xl font-bold mb-3 text-white">Invoice Not Found</h1>
          <p className="text-slate-400 mb-6">This invoice does not exist or you don't have permission to view it.</p>
          <Link href="/dashboard/invoices" className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-medium transition-colors">
            Return to Invoices
          </Link>
        </div>
      </div>
    );
  }

  const { invoice, issuer } = data;
  const isFreelancer = session.user.role !== "client";
  const issueDate = new Date(invoice.createdAt).toLocaleDateString("en-US", { year: 'numeric', month: 'long', day: 'numeric' });
  const dueDate = new Date(invoice.dueDate).toLocaleDateString("en-US", { year: 'numeric', month: 'long', day: 'numeric' });

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 font-sans print:bg-white print:text-black">
      {/* Non-printable Action Bar */}
      <div className="max-w-4xl mx-auto px-6 py-6 print:hidden">
        <div className="flex items-center justify-between mb-8">
          <Link href="/dashboard/invoices" className="text-slate-400 hover:text-white transition-colors flex items-center gap-2 text-sm font-medium">
            <ArrowLeft size={16} /> Back to Invoices
          </Link>
          
          <InvoiceActions invoice={invoice} isFreelancer={isFreelancer} />
        </div>
      </div>

      {/* Printable Document A4 Size */}
      <div className="max-w-4xl mx-auto px-6 pb-20 print:p-0">
        <div className="bg-white text-slate-900 rounded-2xl shadow-xl overflow-hidden print:shadow-none print:rounded-none">
          
          {/* Document Header */}
          <div className="p-10 sm:p-14 border-b border-slate-200 bg-slate-50 print:bg-transparent">
            <div className="flex flex-col sm:flex-row justify-between items-start gap-8">
              <div>
                <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 mb-2 uppercase">INVOICE</h1>
                <p className="text-slate-500 text-sm font-medium tracking-widest uppercase">#{invoice._id.slice(-6).toUpperCase()}</p>
                <div className="mt-4">
                  <span className={"text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider border " + (STATUS_STYLES[invoice.status] || STATUS_STYLES["pending"])}>
                    {invoice.status}
                  </span>
                </div>
              </div>
              
              <div className="text-left sm:text-right">
                <div className="flex items-center sm:justify-end gap-2 text-indigo-600 font-bold text-xl mb-4">
                  <Building2 size={24} />
                  <span>{issuer?.name || "Agency Name"}</span>
                </div>
                <p className="text-slate-500 text-sm mb-1">{issuer?.email}</p>
                <p className="text-slate-500 text-sm">Professional Digital Services</p>
              </div>
            </div>
          </div>

          {/* Billing Info */}
          <div className="p-10 sm:p-14 grid grid-cols-1 sm:grid-cols-2 gap-10">
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Billed To</p>
              <h3 className="text-lg font-bold text-slate-900 mb-1">{invoice.clientId?.name}</h3>
              <p className="text-slate-600 text-sm flex items-center gap-2 mb-1">
                <Mail size={14} className="text-slate-400" /> {invoice.clientId?.email}
              </p>
            </div>
            
            <div className="sm:text-right">
              <div className="mb-4">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Date Issued</p>
                <p className="text-slate-900 font-medium text-sm">{issueDate}</p>
              </div>
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Due Date</p>
                <p className="text-rose-600 font-bold text-sm">{dueDate}</p>
              </div>
            </div>
          </div>

          {/* Line Items */}
          <div className="px-10 sm:px-14 pb-10">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b-2 border-slate-900 text-xs font-bold text-slate-900 uppercase tracking-widest">
                  <th className="py-3 px-2">Description</th>
                  <th className="py-3 px-2 text-center w-24">Qty</th>
                  <th className="py-3 px-2 text-right w-32">Price</th>
                  <th className="py-3 px-2 text-right w-32">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                <tr className="group">
                  <td className="py-5 px-2">
                    <p className="font-bold text-slate-900">{invoice.projectId?.title}</p>
                    <p className="text-slate-500 text-sm mt-1">Project Milestone / Deliverables</p>
                  </td>
                  <td className="py-5 px-2 text-center text-slate-600">1</td>
                  <td className="py-5 px-2 text-right text-slate-600">${invoice.amount.toLocaleString()}</td>
                  <td className="py-5 px-2 text-right font-bold text-slate-900">${invoice.amount.toLocaleString()}</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Totals */}
          <div className="px-10 sm:px-14 pb-14 flex justify-end">
            <div className="w-full sm:w-1/2">
              <div className="flex justify-between items-center py-3 border-b border-slate-100 text-slate-600 text-sm">
                <span>Subtotal</span>
                <span>${invoice.amount.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center py-3 border-b border-slate-100 text-slate-600 text-sm">
                <span>Tax (0%)</span>
                <span>$0.00</span>
              </div>
              <div className="flex justify-between items-center py-4 text-slate-900 font-extrabold text-xl mt-2">
                <span>Total Due</span>
                <span>${invoice.amount.toLocaleString()}</span>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="bg-slate-50 p-10 sm:p-14 border-t border-slate-200 text-center sm:text-left print:bg-transparent">
            <p className="text-slate-500 text-sm font-medium mb-1">Thank you for your business.</p>
            <p className="text-slate-400 text-xs">Payment is due within 14 days of the issued date. Please contact us if you have any questions about this invoice.</p>
          </div>

        </div>
      </div>
    </div>
  );
}
