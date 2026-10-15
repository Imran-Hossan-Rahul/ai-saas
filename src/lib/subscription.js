import Workspace from "@/models/workspace.model";
import connectDb from "@/lib/db";

// Global Paywall Toggle
// When false, all users get access to all premium features.
// Set this in .env.local as PAYWALL_ENABLED=true to turn on actual billing.
const IS_PAYWALL_ENABLED = process.env.PAYWALL_ENABLED === "true";

export async function checkSubscription(workspaceId) {
  // If paywall is disabled, bypass all checks and return premium access
  if (!IS_PAYWALL_ENABLED) {
    return {
      isSubscribed: true,
      plan: "agency", // Assume highest tier for free access
      status: "active",
      message: "Paywall is currently disabled. Enjoy all premium features!",
    };
  }

  // If paywall is enabled, do the actual check
  await connectDb();
  const workspace = await Workspace.findById(workspaceId);

  if (!workspace) {
    return { isSubscribed: false, plan: "free", status: "none", message: "Workspace not found" };
  }

  const { plan, status, currentPeriodEnd } = workspace.subscription || {};

  const isSubscribed = 
    plan !== "free" && 
    status === "active" && 
    new Date(currentPeriodEnd).getTime() > Date.now();

  return {
    isSubscribed,
    plan: plan || "free",
    status: status || "none",
  };
}

// Utility to enforce usage limits based on plan
export const PLAN_LIMITS = {
  free: { projects: 3, aiTokens: 5000 },
  pro: { projects: 20, aiTokens: 50000 },
  agency: { projects: 999999, aiTokens: 5000000 },
};

export async function getWorkspaceLimits(workspaceId) {
  const sub = await checkSubscription(workspaceId);
  return PLAN_LIMITS[sub.plan];
}
