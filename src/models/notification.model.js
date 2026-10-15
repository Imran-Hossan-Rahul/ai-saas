import mongoose, { Schema } from "mongoose";

const notificationSchema = new Schema(
  {
    recipient: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    type: {
      type: String,
      required: true,
      enum: [
        "message",
        "task_assigned",
        "task_due",
        "invoice_overdue",
        "document_signed",
        "project_created",
        "comment",
      ],
    },
    title: {
      type: String,
      required: true,
    },
    body: {
      type: String,
      required: true,
    },
    // Deep link — where to navigate on click
    href: {
      type: String,
    },
    isRead: {
      type: Boolean,
      default: false,
      index: true,
    },
    workspace: {
      type: Schema.Types.ObjectId,
      ref: "Workspace",
    },
  },
  { timestamps: true }
);

// Compound index for fast unread counts per recipient
notificationSchema.index({ recipient: 1, isRead: 1, createdAt: -1 });

const Notification = mongoose.models.Notification || mongoose.model("Notification", notificationSchema, "notifications");
export default Notification;
