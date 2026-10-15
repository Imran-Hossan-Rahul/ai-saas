"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useWorkspace } from "@/components/WorkspaceProvider";
import {
  User, Building2, Shield, Trash2, Save, UserPlus,
  Check, AlertTriangle, Eye, EyeOff, Crown, X, Loader2
} from "lucide-react";
import toast from "react-hot-toast";

const TABS = [
  { id: "profile",   label: "Profile",   icon: User },
  { id: "workspace", label: "Workspace", icon: Building2 },
  { id: "security",  label: "Security",  icon: Shield },
  { id: "danger",    label: "Danger Zone", icon: Trash2 },
];

// ─── Sub-components ─────────────────────────────────────────────────────────

function ProfileTab({ session }) {
  const [name, setName] = useState(session?.user?.name || "");
  const [currentPwd, setCurrentPwd] = useState("");
  const [newPwd, setNewPwd] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!name.trim()) { toast.error("Name cannot be empty."); return; }
    setSaving(true);
    try {
      const res = await fetch("/api/users/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, currentPassword: currentPwd || undefined, newPassword: newPwd || undefined }),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success("Profile updated successfully!");
        setCurrentPwd(""); setNewPwd("");
      } else {
        toast.error(data.error || "Failed to update profile.");
      }
    } catch { toast.error("Network error."); }
    finally { setSaving(false); }
  };

  return (
    <div className="space-y-8">
      {/* Avatar */}
      <div className="flex items-center gap-6 pb-8 border-b border-slate-800">
        <div className="w-20 h-20 rounded-2xl bg-indigo-600/20 border-2 border-indigo-500/30 flex items-center justify-center text-3xl font-bold text-indigo-300 shrink-0">
          {name.charAt(0).toUpperCase() || "?"}
        </div>
        <div>
          <h3 className="text-white font-semibold text-lg">{name || "Your Name"}</h3>
          <p className="text-slate-400 text-sm mt-0.5">{session?.user?.email}</p>
          <span className="inline-block mt-2 px-3 py-0.5 bg-slate-800 border border-slate-700 text-slate-400 text-[10px] uppercase tracking-widest font-semibold rounded-md">
            {session?.user?.role}
          </span>
        </div>
      </div>

      {/* Name */}
      <div className="space-y-2">
        <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">Full Name</label>
        <input
          type="text"
          value={name}
          onChange={e => setName(e.target.value)}
          className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
        />
      </div>

      {/* Email (read-only) */}
      <div className="space-y-2">
        <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">Email Address</label>
        <input
          type="email"
          value={session?.user?.email || ""}
          disabled
          className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-slate-500 text-sm cursor-not-allowed"
        />
        <p className="text-slate-600 text-xs">Email cannot be changed for security reasons.</p>
      </div>

      {/* Password Change */}
      <div className="pt-4 border-t border-slate-800">
        <h4 className="text-sm font-semibold text-white mb-5">Change Password</h4>
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">Current Password</label>
            <div className="relative">
              <input
                type={showCurrent ? "text" : "password"}
                value={currentPwd}
                onChange={e => setCurrentPwd(e.target.value)}
                placeholder="Enter current password"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all pr-12"
              />
              <button type="button" onClick={() => setShowCurrent(!showCurrent)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors">
                {showCurrent ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>
          <div className="space-y-2">
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">New Password</label>
            <div className="relative">
              <input
                type={showNew ? "text" : "password"}
                value={newPwd}
                onChange={e => setNewPwd(e.target.value)}
                placeholder="Min 8 characters"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all pr-12"
              />
              <button type="button" onClick={() => setShowNew(!showNew)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors">
                {showNew ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-end pt-2">
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-7 py-3 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-xl font-semibold text-sm transition-all flex items-center gap-2 shadow-sm"
        >
          {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
          {saving ? "Saving…" : "Save Changes"}
        </button>
      </div>
    </div>
  );
}

function WorkspaceTab({ session }) {
  const { activeWorkspace, mutateWorkspaces } = useWorkspace();
  const [wsName, setWsName] = useState("");
  const [members, setMembers] = useState([]);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("member");
  const [savingName, setSavingName] = useState(false);
  const [inviting, setInviting] = useState(false);
  const [removingId, setRemovingId] = useState(null);

  useEffect(() => {
    if (activeWorkspace) {
      setWsName(activeWorkspace.name || "");
      setMembers(activeWorkspace.members || []);
    }
  }, [activeWorkspace]);

  const handleRename = async () => {
    if (!wsName.trim() || !activeWorkspace?._id) return;
    setSavingName(true);
    try {
      const res = await fetch(`/api/workspaces/${activeWorkspace._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: wsName }),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success("Workspace renamed!");
        mutateWorkspaces(); // Re-fetch so sidebar updates
      } else { toast.error(data.error); }
    } catch { toast.error("Network error."); }
    finally { setSavingName(false); }
  };

  const handleInvite = async () => {
    if (!inviteEmail.trim()) { toast.error("Enter an email address."); return; }
    setInviting(true);
    try {
      const res = await fetch(`/api/workspaces/${activeWorkspace._id}/members`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: inviteEmail, role: inviteRole }),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success("Member added!");
        setMembers(data.workspace.members || []);
        setInviteEmail("");
      } else { toast.error(data.error); }
    } catch { toast.error("Network error."); }
    finally { setInviting(false); }
  };

  const handleRemove = async (userId) => {
    setRemovingId(userId);
    try {
      const res = await fetch(`/api/workspaces/${activeWorkspace._id}/members`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });
      if (res.ok) {
        toast.success("Member removed.");
        setMembers(prev => prev.filter(m => (m.user?._id || m.user)?.toString() !== userId));
      } else {
        const data = await res.json();
        toast.error(data.error);
      }
    } catch { toast.error("Network error."); }
    finally { setRemovingId(null); }
  };

  const isOwner = activeWorkspace?.owner === session?.user?.id || activeWorkspace?.owner?.toString() === session?.user?.id;

  return (
    <div className="space-y-8">
      {/* Workspace Name */}
      <div>
        <h4 className="text-sm font-semibold text-white mb-5">Workspace Details</h4>
        <div className="space-y-2">
          <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">Workspace Name</label>
          <div className="flex gap-3">
            <input
              type="text"
              value={wsName}
              onChange={e => setWsName(e.target.value)}
              disabled={!isOwner}
              className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            />
            {isOwner && (
              <button
                onClick={handleRename}
                disabled={savingName}
                className="px-5 py-3 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-xl font-medium text-sm transition-all flex items-center gap-2"
              >
                {savingName ? <Loader2 size={15} className="animate-spin" /> : <Check size={15} />}
                Save
              </button>
            )}
          </div>
          {!isOwner && <p className="text-slate-600 text-xs">Only the workspace owner can rename it.</p>}
        </div>
      </div>

      {/* Team Members */}
      <div className="pt-4 border-t border-slate-800">
        <h4 className="text-sm font-semibold text-white mb-5">Team Members ({members.length + 1})</h4>

        {/* Owner */}
        <div className="space-y-2 mb-4">
          <div className="flex items-center justify-between bg-slate-950 border border-slate-800 rounded-xl px-5 py-3.5">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-sm font-bold text-indigo-300">
                {session?.user?.name?.charAt(0).toUpperCase()}
              </div>
              <div>
                <p className="text-sm font-semibold text-white">{session?.user?.name} <span className="text-slate-500 font-normal">(you)</span></p>
                <p className="text-xs text-slate-500">{session?.user?.email}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 text-amber-400">
              <Crown size={14} />
              <span className="text-[10px] font-bold uppercase tracking-widest text-amber-400">Owner</span>
            </div>
          </div>

          {members.map(member => {
            const user = member.user;
            const uid = (user?._id || user)?.toString();
            const name = user?.name || "—";
            const email = user?.email || "—";
            return (
              <div key={uid} className="flex items-center justify-between bg-slate-950 border border-slate-800 rounded-xl px-5 py-3.5">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-sm font-bold text-slate-300">
                    {name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-white">{name}</p>
                    <p className="text-xs text-slate-500">{email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-[10px] font-semibold px-2.5 py-1 bg-slate-800 border border-slate-700 text-slate-400 rounded-md uppercase tracking-wider">{member.role}</span>
                  {isOwner && (
                    <button
                      onClick={() => handleRemove(uid)}
                      disabled={removingId === uid}
                      className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors disabled:opacity-40"
                      title="Remove member"
                    >
                      {removingId === uid ? <Loader2 size={15} className="animate-spin" /> : <X size={15} />}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Invite */}
        {isOwner && (
          <div className="pt-4 border-t border-slate-800">
            <h5 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-4">Invite by Email</h5>
            <div className="flex gap-3">
              <input
                type="email"
                value={inviteEmail}
                onChange={e => setInviteEmail(e.target.value)}
                placeholder="teammate@example.com"
                onKeyDown={e => e.key === "Enter" && handleInvite()}
                className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
              />
              <select
                value={inviteRole}
                onChange={e => setInviteRole(e.target.value)}
                className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-3 text-white text-sm focus:outline-none appearance-none"
              >
                <option value="member">Member</option>
                <option value="admin">Admin</option>
                <option value="client">Client</option>
              </select>
              <button
                onClick={handleInvite}
                disabled={inviting}
                className="px-5 py-3 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-xl font-medium text-sm transition-all flex items-center gap-2 shrink-0"
              >
                {inviting ? <Loader2 size={15} className="animate-spin" /> : <UserPlus size={15} />}
                Invite
              </button>
            </div>
            <p className="text-slate-600 text-xs mt-2">The user must already have an account on this platform.</p>
          </div>
        )}
      </div>
    </div>
  );
}

function SecurityTab({ session }) {
  const loginTime = new Date().toLocaleString("en-US", {
    weekday: "long", year: "numeric", month: "long", day: "numeric", hour: "2-digit", minute: "2-digit"
  });

  return (
    <div className="space-y-6">
      <h4 className="text-sm font-semibold text-white">Current Session</h4>

      <div className="bg-slate-950 border border-slate-800 rounded-2xl p-6 space-y-5">
        {[
          { label: "Account", value: session?.user?.email },
          { label: "Role", value: session?.user?.role?.toUpperCase() },
          { label: "Session Started", value: loginTime },
          { label: "Authentication Method", value: "Email & Password" },
          { label: "2FA", value: "Not enabled (coming soon)" },
        ].map(row => (
          <div key={row.label} className="flex justify-between items-center text-sm border-b border-slate-800/50 pb-4 last:border-0 last:pb-0">
            <span className="text-slate-500 font-medium">{row.label}</span>
            <span className="text-white font-medium text-right max-w-[60%] break-words">{row.value}</span>
          </div>
        ))}
      </div>

      <div className="bg-indigo-600/10 border border-indigo-500/20 rounded-2xl p-5">
        <div className="flex items-start gap-3">
          <Shield className="text-indigo-400 shrink-0 mt-0.5" size={18} />
          <div>
            <p className="text-sm font-semibold text-indigo-300 mb-1">Security Recommendations</p>
            <ul className="text-xs text-indigo-200/70 space-y-1.5 list-disc ml-3">
              <li>Use a strong, unique password of at least 12 characters.</li>
              <li>Never share your login credentials with anyone.</li>
              <li>Sign out when using a shared or public device.</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

function DangerZoneTab() {
  const [confirmText, setConfirmText] = useState("");
  const CONFIRM_PHRASE = "DELETE MY ACCOUNT";

  return (
    <div className="space-y-6">
      <div className="flex items-start gap-3 p-5 bg-rose-900/10 border border-rose-900/50 rounded-2xl">
        <AlertTriangle className="text-rose-400 shrink-0 mt-0.5" size={18} />
        <div>
          <p className="text-sm font-bold text-rose-400 mb-1">Permanent Action</p>
          <p className="text-xs text-rose-300/70 leading-relaxed">
            Deleting your account is irreversible. All your projects, clients, invoices, documents, and messages will be permanently removed. This action cannot be undone.
          </p>
        </div>
      </div>

      <div className="space-y-3">
        <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">
          Type <span className="text-rose-400 font-bold">{CONFIRM_PHRASE}</span> to confirm
        </label>
        <input
          type="text"
          value={confirmText}
          onChange={e => setConfirmText(e.target.value)}
          placeholder={CONFIRM_PHRASE}
          className="w-full bg-slate-950 border border-rose-900/50 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:ring-2 focus:ring-rose-500/50 transition-all placeholder:text-slate-700 font-mono"
        />
      </div>

      <button
        disabled={confirmText !== CONFIRM_PHRASE}
        className="w-full py-3.5 bg-rose-600 hover:bg-rose-500 disabled:opacity-30 disabled:cursor-not-allowed text-white rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2"
        onClick={() => toast.error("Account deletion is disabled in this environment.")}
      >
        <Trash2 size={16} /> Permanently Delete Account
      </button>
    </div>
  );
}

// ─── Main Page ───────────────────────────────────────────────────────────────

export default function SettingsPage() {
  const { data: session } = useSession();
  const [activeTab, setActiveTab] = useState("profile");

  return (
    <div className="min-h-screen bg-slate-950 text-white font-sans p-6 md:p-10">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-10 border-b border-slate-800 pb-6">
          <h1 className="text-3xl font-bold text-white tracking-tight">Settings</h1>
          <p className="text-slate-400 text-sm mt-1.5">Manage your profile, workspace, and security preferences.</p>
        </div>

        <div className="flex flex-col md:flex-row gap-8">
          {/* Sidebar Navigation */}
          <nav className="md:w-52 shrink-0">
            <div className="space-y-1">
              {TABS.map(tab => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                const isDanger = tab.id === "danger";
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium text-sm transition-all ${
                      isActive
                        ? isDanger
                          ? "bg-rose-600/20 text-rose-400 border border-rose-500/30"
                          : "bg-indigo-600/15 text-indigo-400 border border-indigo-500/30"
                        : isDanger
                          ? "text-rose-500/60 hover:bg-rose-500/10 hover:text-rose-400"
                          : "text-slate-400 hover:text-white hover:bg-slate-900"
                    }`}
                  >
                    <Icon size={16} className={isActive && !isDanger ? "text-indigo-400" : ""} />
                    {tab.label}
                  </button>
                );
              })}
            </div>
          </nav>

          {/* Content Panel */}
          <div className="flex-1 bg-slate-900/40 border border-slate-800 rounded-3xl p-6 md:p-8 min-h-[500px]">
            {activeTab === "profile"   && <ProfileTab session={session} />}
            {activeTab === "workspace" && <WorkspaceTab session={session} />}
            {activeTab === "security"  && <SecurityTab session={session} />}
            {activeTab === "danger"    && <DangerZoneTab />}
          </div>
        </div>
      </div>
    </div>
  );
}
