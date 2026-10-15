import mongoose, { Schema } from "mongoose";

const workspaceSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      minLength: 2,
      maxLength: 100,
    },
    owner: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    subscription: {
      plan: {
        type: String,
        enum: ["free", "pro", "agency"],
        default: "free",
      },
      stripeCustomerId: String,
      stripeSubscriptionId: String,
      status: {
        type: String,
        enum: ["active", "past_due", "canceled", "unpaid", "trialing"],
        default: "active",
      },
      currentPeriodEnd: Date,
    },
    members: [
      {
        user: { type: Schema.Types.ObjectId, ref: "User" },
        role: {
          type: String,
          enum: ["admin", "member", "client"],
          default: "member",
        },
      },
    ],
  },
  { timestamps: true }
);

const Workspace = mongoose.models.Workspace || mongoose.model("Workspace", workspaceSchema, "workspaces");
export default Workspace;
