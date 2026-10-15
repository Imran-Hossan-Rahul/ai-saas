import Link from "next/link";
import { ArrowRight, Zap, Layers, MessageSquare, Star, Shield, BarChart3, Users, ReceiptText } from "lucide-react";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#030712] text-white font-sans selection:bg-indigo-500/30">

      {/* Nav */}
      <nav className="fixed w-full z-50 top-0 bg-[#030712]/80 backdrop-blur-xl border-b border-white/5">
        <div className="max-w-7xl mx-auto px-6 h-18 flex items-center justify-between py-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-indigo-600 flex items-center justify-center shadow-sm">
              <Zap size={16} className="text-white" />
            </div>
            <span className="text-lg font-extrabold tracking-tight">iSmart</span>
          </div>
          <div className="hidden md:flex items-center gap-8 text-sm text-slate-400">
            <a href="#features" className="hover:text-white transition-colors">Features</a>
            <a href="#pricing" className="hover:text-white transition-colors">Pricing</a>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/auth/login" className="text-sm font-medium text-slate-300 hover:text-white transition-colors hidden sm:block">
              Log in
            </Link>
            <Link href="/auth/register" className="text-sm font-semibold px-4 py-2 bg-white text-slate-950 rounded-xl hover:bg-slate-100 transition-colors">
              Start Free →
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative pt-44 pb-24 px-6 overflow-hidden">
        {/* Grid pattern bg */}
        <div className="absolute inset-0 opacity-[0.03]" style={{backgroundImage: "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")"}}></div>
        
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-xs font-semibold text-indigo-300 mb-8">
            <span className="flex h-1.5 w-1.5 rounded-full bg-indigo-400 animate-pulse"></span>
            AI-Powered Freelancer OS · Now in Beta
          </div>
          
          <h1 className="text-5xl md:text-7xl font-black tracking-tighter mb-6 leading-[1.05]">
            Run your whole
            <br />
            <span className="text-indigo-400">
              business with AI.
            </span>
          </h1>
          
          <p className="text-lg md:text-xl text-slate-400 mb-10 max-w-2xl mx-auto leading-relaxed">
            Stop juggling 10 different tools. Manage clients, track tasks, generate invoices, and close deals faster with AI proposals — all from one intelligent workspace.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/auth/register" className="w-full sm:w-auto px-8 py-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl font-bold text-base transition-all shadow-sm flex items-center justify-center gap-2 group">
              Get started for free <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link href="/auth/login" className="w-full sm:w-auto px-8 py-4 bg-white/5 hover:bg-white/10 border border-white/10 text-white rounded-2xl font-bold text-base transition-all">
              Log in to your workspace
            </Link>
          </div>
          
          <p className="text-slate-600 text-xs mt-5">No credit card required. Free forever on the Starter plan.</p>
        </div>
      </section>

      {/* Social proof */}
      <section className="py-10 border-y border-white/5 bg-white/[0.02]">
        <div className="max-w-5xl mx-auto px-6 flex flex-wrap justify-center gap-8 items-center opacity-60">
          {["Trusted by 500+ freelancers", "4.9 ★ rating", "10,000+ projects managed", "99.9% uptime"].map(s => (
            <span key={s} className="text-sm text-slate-400 font-medium">{s}</span>
          ))}
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-28 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-indigo-400 text-sm font-semibold uppercase tracking-widest mb-3">Everything you need</p>
            <h2 className="text-4xl md:text-5xl font-black tracking-tight mb-4">Your entire business, automated.</h2>
            <p className="text-slate-400 text-lg max-w-2xl mx-auto">From winning new clients to delivering work and getting paid — iSmart handles it all.</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                icon: Layers,
                color: "indigo",
                title: "Client Portals",
                desc: "Give clients a branded, real-time view of their project. No more 'What's the status?' emails."
              },
              {
                icon: BarChart3,
                color: "cyan",
                title: "Kanban Task Boards",
                desc: "Drag-and-drop task management that auto-syncs. Organize your work visually and never miss a deadline."
              },
              {
                icon: MessageSquare,
                color: "violet",
                title: "AI Proposal Generator",
                desc: "Type one sentence. Get a fully-formatted, professional proposal that references the actual project budget and scope."
              },
              {
                icon: ReceiptText,
                color: "emerald",
                title: "Invoice Management",
                desc: "Generate and send professional invoices in seconds. Track payment status and follow up automatically."
              },
              {
                icon: Shield,
                color: "rose",
                title: "Role-Based Access",
                desc: "Clients see exactly what they should. Sensitive financials and internal notes stay private."
              },
              {
                icon: Users,
                color: "amber",
                title: "Team Collaboration",
                desc: "Invite team members, assign tasks, and manage workload across multiple clients simultaneously."
              },
            ].map((f) => (
              <div key={f.title} className={"group bg-[#0c1120] border border-white/5 p-7 rounded-3xl hover:border-white/10 transition-all duration-300"}>
                <div className={"w-11 h-11 rounded-2xl flex items-center justify-center mb-5 bg-" + f.color + "-500/10 text-" + f.color + "-400 group-hover:scale-110 transition-transform"}>
                  <f.icon size={22} />
                </div>
                <h3 className="text-lg font-bold text-white mb-2">{f.title}</h3>
                <p className="text-slate-400 text-sm leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 px-6">
        <div className="max-w-3xl mx-auto text-center bg-slate-900 border border-slate-800 rounded-3xl p-14 shadow-lg">
          <h2 className="text-4xl md:text-5xl font-black tracking-tight mb-5">Ready to work smarter?</h2>
          <p className="text-slate-400 mb-8">Join thousands of freelancers running their entire business from one place.</p>
          <Link href="/auth/register" className="inline-flex items-center gap-2 px-8 py-4 bg-white text-slate-950 rounded-2xl font-bold text-base hover:bg-slate-100 transition-colors shadow-2xl group">
            Create your workspace <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-10 border-t border-white/5 text-center">
        <p className="text-slate-600 text-sm">© {new Date().getFullYear()} iSmart Workspace. Built for professionals.</p>
      </footer>
    </div>
  );
}
